package com.tactics.simulator.service;

import com.tactics.simulator.dto.TacticDto;
import com.tactics.simulator.exception.ResourceNotFoundException;
import com.tactics.simulator.model.*;
import com.tactics.simulator.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TacticService {

    private final TacticRepository tacticRepository;
    private final TacticVersionRepository tacticVersionRepository;
    private final TeamRepository teamRepository;
    private final TagRepository tagRepository;
    private final UserRepository userRepository;

    public List<TacticDto> findAll(List<String> tags, String search) {
        User currentUser = getCurrentUser();
        if (currentUser == null) return List.of();

        List<Tactic> tactics = (search != null && !search.isBlank())
                ? tacticRepository.searchByUser(currentUser.getId(), search)
                : tacticRepository.findByUserIdOrderByUpdatedAtDesc(currentUser.getId());

        if (tags != null && !tags.isEmpty()) {
            tactics = tactics.stream()
                    .filter(t -> t.getTags().stream()
                            .map(TacticTag::getName)
                            .collect(Collectors.toSet())
                            .containsAll(tags))
                    .toList();
        }

        return tactics.stream().map(this::toDto).toList();
    }

    public TacticDto findById(Long id) {
        return toDto(getOwnedTacticOrThrow(id));
    }

    @Transactional
    public TacticDto create(TacticDto.CreateTacticRequest request) {
        Team team = null;
        if (request.teamId() != null) {
            team = teamRepository.findById(request.teamId())
                    .orElseThrow(() -> new ResourceNotFoundException("Team", request.teamId()));
        }

        Team opponentTeam = null;
        if (request.opponentTeamId() != null) {
            opponentTeam = teamRepository.findById(request.opponentTeamId())
                    .orElseThrow(() -> new ResourceNotFoundException("Team", request.opponentTeamId()));
        }

        Set<TacticTag> tags = resolveTags(request.tags());

        User currentUser = getCurrentUser();

        Tactic tactic = Tactic.builder()
                .name(request.name())
                .description(request.description())
                .team(team)
                .opponentTeam(opponentTeam)
                .user(currentUser)
                .tags(tags)
                .build();

        tactic = tacticRepository.save(tactic);

        if (request.frames() != null) {
            TacticVersion version = TacticVersion.builder()
                    .tactic(tactic)
                    .versionNumber(1)
                    .label("Initial version")
                    .frames(request.frames())
                    .build();
            tacticVersionRepository.save(version);
        }

        return toDto(tactic);
    }

    @Transactional
    public TacticDto update(Long id, TacticDto.UpdateTacticRequest request) {
        Tactic tactic = getOwnedTacticOrThrow(id);

        if (request.name() != null) tactic.setName(request.name());
        if (request.description() != null) tactic.setDescription(request.description());
        if (request.tags() != null) tactic.setTags(resolveTags(request.tags()));
        if (request.teamId() != null) {
            Team team = teamRepository.findById(request.teamId())
                    .orElseThrow(() -> new ResourceNotFoundException("Team", request.teamId()));
            tactic.setTeam(team);
        }
        if (request.opponentTeamId() != null) {
            Team opponentTeam = teamRepository.findById(request.opponentTeamId())
                    .orElseThrow(() -> new ResourceNotFoundException("Team", request.opponentTeamId()));
            tactic.setOpponentTeam(opponentTeam);
        }

        return toDto(tacticRepository.save(tactic));
    }

    @Transactional
    public void delete(Long id) {
        Tactic tactic = getOwnedTacticOrThrow(id);
        tacticRepository.delete(tactic);
    }

    public Tactic getTacticOrThrow(Long id) {
        return tacticRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tactic", id));
    }

    /**
     * Fetch a tactic and verify it belongs to the current user. Throws 404
     * (not 403) when access is denied to avoid leaking existence of other
     * users' tactics.
     */
    private Tactic getOwnedTacticOrThrow(Long id) {
        Tactic tactic = getTacticOrThrow(id);
        User currentUser = getCurrentUser();
        if (currentUser == null
                || tactic.getUser() == null
                || !tactic.getUser().getId().equals(currentUser.getId())) {
            throw new ResourceNotFoundException("Tactic", id);
        }
        return tactic;
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        String username = auth.getName();
        return userRepository.findByUsername(username).orElse(null);
    }

    private Set<TacticTag> resolveTags(Set<String> tagNames) {
        if (tagNames == null || tagNames.isEmpty()) return new HashSet<>();
        return tagNames.stream()
                .map(name -> tagRepository.findByName(name)
                        .orElseGet(() -> tagRepository.save(TacticTag.builder().name(name).build())))
                .collect(Collectors.toSet());
    }

    TacticDto toDto(Tactic tactic) {
        var latestVersion = tacticVersionRepository
                .findFirstByTacticIdOrderByVersionNumberDesc(tactic.getId())
                .map(v -> new com.tactics.simulator.dto.TacticVersionDto(
                        v.getId(), v.getVersionNumber(), v.getLabel(),
                        v.getFrames(), v.getCreatedAt()))
                .orElse(null);

        int versionCount = tactic.getVersions() != null ? tactic.getVersions().size() : 0;

        Set<String> tags = tactic.getTags().stream()
                .map(TacticTag::getName)
                .collect(Collectors.toSet());

        return new TacticDto(
                tactic.getId(), tactic.getUuid(), tactic.getName(),
                tactic.getDescription(),
                tactic.getTeam() != null ? tactic.getTeam().getId() : null,
                tactic.getTeam() != null ? tactic.getTeam().getName() : null,
                tactic.getOpponentTeam() != null ? tactic.getOpponentTeam().getId() : null,
                tactic.getOpponentTeam() != null ? tactic.getOpponentTeam().getName() : null,
                tactic.getCreatedAt(), tactic.getUpdatedAt(),
                tags, versionCount, latestVersion);
    }
}

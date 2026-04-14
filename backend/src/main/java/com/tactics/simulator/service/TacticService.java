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
        List<Tactic> tactics;

        if (tags != null && !tags.isEmpty() && search != null && !search.isBlank()) {
            Set<Long> tagFilteredIds = tacticRepository.findByAllTags(tags, tags.size())
                    .stream().map(Tactic::getId).collect(Collectors.toSet());
            tactics = tacticRepository.searchByNameOrDescription(search).stream()
                    .filter(t -> tagFilteredIds.contains(t.getId()))
                    .toList();
        } else if (tags != null && !tags.isEmpty()) {
            tactics = tacticRepository.findByAllTags(tags, tags.size());
        } else if (search != null && !search.isBlank()) {
            tactics = tacticRepository.searchByNameOrDescription(search);
        } else {
            tactics = tacticRepository.findAll();
        }

        return tactics.stream().map(this::toDto).toList();
    }

    public TacticDto findById(Long id) {
        return toDto(getTacticOrThrow(id));
    }

    @Transactional
    public TacticDto create(TacticDto.CreateTacticRequest request) {
        Team team = null;
        if (request.teamId() != null) {
            team = teamRepository.findById(request.teamId())
                    .orElseThrow(() -> new ResourceNotFoundException("Team", request.teamId()));
        }

        Set<TacticTag> tags = resolveTags(request.tags());

        User currentUser = getCurrentUser();

        Tactic tactic = Tactic.builder()
                .name(request.name())
                .description(request.description())
                .team(team)
                .user(currentUser)
                .isPublic(request.isPublic() != null ? request.isPublic() : false)
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
        Tactic tactic = getTacticOrThrow(id);

        if (request.name() != null) tactic.setName(request.name());
        if (request.description() != null) tactic.setDescription(request.description());
        if (request.isPublic() != null) tactic.setIsPublic(request.isPublic());
        if (request.tags() != null) tactic.setTags(resolveTags(request.tags()));
        if (request.teamId() != null) {
            Team team = teamRepository.findById(request.teamId())
                    .orElseThrow(() -> new ResourceNotFoundException("Team", request.teamId()));
            tactic.setTeam(team);
        }

        return toDto(tacticRepository.save(tactic));
    }

    @Transactional
    public void delete(Long id) {
        if (!tacticRepository.existsById(id)) {
            throw new ResourceNotFoundException("Tactic", id);
        }
        tacticRepository.deleteById(id);
    }

    public Tactic getTacticOrThrow(Long id) {
        return tacticRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tactic", id));
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
                tactic.getIsPublic(), tactic.getCreatedAt(), tactic.getUpdatedAt(),
                tags, versionCount, latestVersion);
    }
}

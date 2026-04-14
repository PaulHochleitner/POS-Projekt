package com.tactics.simulator.service;

import com.tactics.simulator.dto.PlayerDto;
import com.tactics.simulator.dto.TeamDto;
import com.tactics.simulator.exception.ResourceNotFoundException;
import com.tactics.simulator.model.Team;
import com.tactics.simulator.model.User;
import com.tactics.simulator.repository.TeamRepository;
import com.tactics.simulator.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TeamService {

    private final TeamRepository teamRepository;
    private final UserRepository userRepository;

    public List<TeamDto> findAll() {
        return teamRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    public TeamDto findById(Long id) {
        return toDto(getTeamOrThrow(id));
    }

    @Transactional
    public TeamDto create(TeamDto.CreateTeamRequest request) {
        Team team = Team.builder()
                .name(request.name())
                .primaryColor(request.primaryColor())
                .secondaryColor(request.secondaryColor())
                .logoUrl(request.logoUrl())
                .user(getCurrentUser())
                .build();
        return toDto(teamRepository.save(team));
    }

    @Transactional
    public TeamDto update(Long id, TeamDto.UpdateTeamRequest request) {
        Team team = getTeamOrThrow(id);
        team.setName(request.name());
        team.setPrimaryColor(request.primaryColor());
        team.setSecondaryColor(request.secondaryColor());
        team.setLogoUrl(request.logoUrl());
        return toDto(teamRepository.save(team));
    }

    @Transactional
    public void delete(Long id) {
        if (!teamRepository.existsById(id)) {
            throw new ResourceNotFoundException("Team", id);
        }
        teamRepository.deleteById(id);
    }

    public Team getTeamOrThrow(Long id) {
        return teamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team", id));
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        return userRepository.findByUsername(auth.getName()).orElse(null);
    }

    private TeamDto toDto(Team team) {
        List<PlayerDto> players = team.getPlayers().stream()
                .map(p -> new PlayerDto(
                        p.getId(), p.getName(), p.getNumber(), p.getPosition(),
                        p.getPace(), p.getPassing(), p.getShooting(),
                        p.getDefending(), p.getPhysical(), p.getDribbling(),
                        p.getImageUrl(), team.getId()))
                .toList();
        return new TeamDto(
                team.getId(), team.getName(), team.getPrimaryColor(),
                team.getSecondaryColor(), team.getLogoUrl(), team.getCreatedAt(),
                players);
    }
}

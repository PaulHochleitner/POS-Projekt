package com.tactics.simulator.service;

import com.tactics.simulator.dto.TeamDto;
import com.tactics.simulator.exception.ResourceNotFoundException;
import com.tactics.simulator.model.Team;
import com.tactics.simulator.repository.TeamRepository;
import com.tactics.simulator.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TeamServiceTest {

    @Mock
    private TeamRepository teamRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private TeamService teamService;

    private Team buildTeam(Long id, String name) {
        return Team.builder()
                .id(id)
                .name(name)
                .primaryColor("#FFD700")
                .secondaryColor("#DC143C")
                .createdAt(LocalDateTime.now())
                .players(new ArrayList<>())
                .build();
    }

    @Test
    void shouldFindAllTeams() {
        when(teamRepository.findAll()).thenReturn(List.of(buildTeam(1L, "FC Test")));

        List<TeamDto> result = teamService.findAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).name()).isEqualTo("FC Test");
    }

    @Test
    void shouldFindTeamById() {
        when(teamRepository.findById(1L)).thenReturn(Optional.of(buildTeam(1L, "FC Test")));

        TeamDto result = teamService.findById(1L);

        assertThat(result.name()).isEqualTo("FC Test");
        assertThat(result.primaryColor()).isEqualTo("#FFD700");
    }

    @Test
    void shouldThrowWhenTeamNotFound() {
        when(teamRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> teamService.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Team");
    }

    @Test
    void shouldCreateTeam() {
        TeamDto.CreateTeamRequest request = new TeamDto.CreateTeamRequest(
                "FC New", "#FFFFFF", "#000000", null);
        Team saved = buildTeam(1L, "FC New");
        when(teamRepository.save(any(Team.class))).thenReturn(saved);

        TeamDto result = teamService.create(request);

        assertThat(result.name()).isEqualTo("FC New");
        verify(teamRepository).save(any(Team.class));
    }

    @Test
    void shouldUpdateTeam() {
        Team existing = buildTeam(1L, "FC Old");
        when(teamRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(teamRepository.save(any(Team.class))).thenReturn(existing);

        TeamDto.UpdateTeamRequest request = new TeamDto.UpdateTeamRequest(
                "FC Updated", "#111", "#222", null);
        TeamDto result = teamService.update(1L, request);

        assertThat(result.name()).isEqualTo("FC Updated");
    }

    @Test
    void shouldDeleteTeam() {
        when(teamRepository.existsById(1L)).thenReturn(true);

        teamService.delete(1L);

        verify(teamRepository).deleteById(1L);
    }

    @Test
    void shouldThrowWhenDeletingNonExistentTeam() {
        when(teamRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> teamService.delete(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}

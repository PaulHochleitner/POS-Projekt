package com.tactics.simulator.service;

import com.tactics.simulator.dto.PlayerDto;
import com.tactics.simulator.exception.ResourceNotFoundException;
import com.tactics.simulator.model.Player;
import com.tactics.simulator.model.Team;
import com.tactics.simulator.model.enums.Position;
import com.tactics.simulator.repository.PlayerRepository;
import com.tactics.simulator.repository.TeamRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlayerServiceTest {

    @Mock
    private PlayerRepository playerRepository;

    @Mock
    private TeamRepository teamRepository;

    @InjectMocks
    private PlayerService playerService;

    private Team buildTeam() {
        return Team.builder().id(1L).name("FC Test").primaryColor("#FFF").secondaryColor("#000")
                .players(new ArrayList<>()).build();
    }

    private Player buildPlayer(Long id, Team team) {
        return Player.builder().id(id).team(team).name("Test Player").number(10)
                .position(Position.ST).pace(80).passing(75).shooting(85)
                .defending(70).physical(65).dribbling(72).build();
    }

    @Test
    void shouldFindPlayersByTeamId() {
        Team team = buildTeam();
        when(teamRepository.existsById(1L)).thenReturn(true);
        when(playerRepository.findByTeamId(1L)).thenReturn(List.of(buildPlayer(1L, team)));

        List<PlayerDto> result = playerService.findByTeamId(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).name()).isEqualTo("Test Player");
    }

    @Test
    void shouldThrowWhenTeamNotFoundForPlayers() {
        when(teamRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> playerService.findByTeamId(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void shouldCreatePlayer() {
        Team team = buildTeam();
        when(teamRepository.findById(1L)).thenReturn(Optional.of(team));
        Player saved = buildPlayer(1L, team);
        when(playerRepository.save(any(Player.class))).thenReturn(saved);

        PlayerDto.CreatePlayerRequest request = new PlayerDto.CreatePlayerRequest(
                "Test Player", 10, Position.ST, 80, 75, 85, 70, 65, 72, null);
        PlayerDto result = playerService.create(1L, request);

        assertThat(result.name()).isEqualTo("Test Player");
        assertThat(result.position()).isEqualTo(Position.ST);
        assertThat(result.defending()).isEqualTo(70);
    }

    @Test
    void shouldUpdatePlayer() {
        Team team = buildTeam();
        Player existing = buildPlayer(1L, team);
        when(playerRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(playerRepository.save(any(Player.class))).thenReturn(existing);

        PlayerDto.UpdatePlayerRequest request = new PlayerDto.UpdatePlayerRequest(
                "Updated", 9, Position.CAM, 70, 85, 60, 55, 50, 80, null);
        PlayerDto result = playerService.update(1L, request);

        assertThat(result.name()).isEqualTo("Updated");
    }

    @Test
    void shouldDeletePlayer() {
        when(playerRepository.existsById(1L)).thenReturn(true);

        playerService.delete(1L);

        verify(playerRepository).deleteById(1L);
    }

    @Test
    void shouldThrowWhenDeletingNonExistentPlayer() {
        when(playerRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> playerService.delete(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}

package com.tactics.simulator.service;

import com.tactics.simulator.dto.PlayerDto;
import com.tactics.simulator.exception.ResourceNotFoundException;
import com.tactics.simulator.model.Player;
import com.tactics.simulator.model.Team;
import com.tactics.simulator.repository.PlayerRepository;
import com.tactics.simulator.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlayerService {

    private final PlayerRepository playerRepository;
    private final TeamRepository teamRepository;

    public List<PlayerDto> findByTeamId(Long teamId) {
        if (!teamRepository.existsById(teamId)) {
            throw new ResourceNotFoundException("Team", teamId);
        }
        return playerRepository.findByTeamId(teamId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public PlayerDto create(Long teamId, PlayerDto.CreatePlayerRequest request) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", teamId));

        Player player = Player.builder()
                .team(team)
                .name(request.name())
                .number(request.number())
                .position(request.position())
                .pace(request.pace())
                .passing(request.passing())
                .shooting(request.shooting())
                .defending(request.defending())
                .physical(request.physical())
                .dribbling(request.dribbling())
                .build();
        return toDto(playerRepository.save(player));
    }

    @Transactional
    public PlayerDto update(Long id, PlayerDto.UpdatePlayerRequest request) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Player", id));

        player.setName(request.name());
        player.setNumber(request.number());
        player.setPosition(request.position());
        player.setPace(request.pace());
        player.setPassing(request.passing());
        player.setShooting(request.shooting());
        player.setDefending(request.defending());
        player.setPhysical(request.physical());
        player.setDribbling(request.dribbling());
        return toDto(playerRepository.save(player));
    }

    @Transactional
    public void delete(Long id) {
        if (!playerRepository.existsById(id)) {
            throw new ResourceNotFoundException("Player", id);
        }
        playerRepository.deleteById(id);
    }

    public PlayerDto toDto(Player player) {
        return new PlayerDto(
                player.getId(), player.getName(), player.getNumber(),
                player.getPosition(), player.getPace(), player.getPassing(),
                player.getShooting(), player.getDefending(), player.getPhysical(),
                player.getDribbling(), player.getImageUrl(), player.getTeam().getId());
    }
}

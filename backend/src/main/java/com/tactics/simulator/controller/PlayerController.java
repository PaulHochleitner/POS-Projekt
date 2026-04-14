package com.tactics.simulator.controller;

import com.tactics.simulator.dto.PlayerDto;
import com.tactics.simulator.service.PlayerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class PlayerController {

    private final PlayerService playerService;

    @GetMapping("/api/teams/{teamId}/players")
    public List<PlayerDto> getByTeamId(@PathVariable Long teamId) {
        return playerService.findByTeamId(teamId);
    }

    @PostMapping("/api/teams/{teamId}/players")
    @ResponseStatus(HttpStatus.CREATED)
    public PlayerDto create(@PathVariable Long teamId,
                            @Valid @RequestBody PlayerDto.CreatePlayerRequest request) {
        return playerService.create(teamId, request);
    }

    @PutMapping("/api/players/{id}")
    public PlayerDto update(@PathVariable Long id,
                            @Valid @RequestBody PlayerDto.UpdatePlayerRequest request) {
        return playerService.update(id, request);
    }

    @DeleteMapping("/api/players/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        playerService.delete(id);
    }
}

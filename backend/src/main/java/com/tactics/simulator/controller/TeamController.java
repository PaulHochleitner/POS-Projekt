package com.tactics.simulator.controller;

import com.tactics.simulator.dto.TeamDto;
import com.tactics.simulator.service.TeamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    @GetMapping
    public List<TeamDto> getAll() {
        return teamService.findAll();
    }

    @GetMapping("/{id}")
    public TeamDto getById(@PathVariable Long id) {
        return teamService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TeamDto create(@Valid @RequestBody TeamDto.CreateTeamRequest request) {
        return teamService.create(request);
    }

    @PutMapping("/{id}")
    public TeamDto update(@PathVariable Long id, @Valid @RequestBody TeamDto.UpdateTeamRequest request) {
        return teamService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        teamService.delete(id);
    }
}

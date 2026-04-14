package com.tactics.simulator.controller;

import com.tactics.simulator.dto.TacticDto;
import com.tactics.simulator.service.TacticService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tactics")
@RequiredArgsConstructor
public class TacticController {

    private final TacticService tacticService;

    @GetMapping
    public List<TacticDto> getAll(
            @RequestParam(required = false) List<String> tags,
            @RequestParam(required = false) String search) {
        return tacticService.findAll(tags, search);
    }

    @GetMapping("/{id}")
    public TacticDto getById(@PathVariable Long id) {
        return tacticService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TacticDto create(@Valid @RequestBody TacticDto.CreateTacticRequest request) {
        return tacticService.create(request);
    }

    @PutMapping("/{id}")
    public TacticDto update(@PathVariable Long id, @Valid @RequestBody TacticDto.UpdateTacticRequest request) {
        return tacticService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        tacticService.delete(id);
    }
}

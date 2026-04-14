package com.tactics.simulator.controller;

import com.tactics.simulator.dto.TacticVersionDto;
import com.tactics.simulator.dto.VersionCompareDto;
import com.tactics.simulator.service.TacticVersionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tactics/{tacticId}/versions")
@RequiredArgsConstructor
public class TacticVersionController {

    private final TacticVersionService versionService;

    @GetMapping
    public List<TacticVersionDto> getVersions(@PathVariable Long tacticId) {
        return versionService.findByTacticId(tacticId);
    }

    @GetMapping("/{versionId}")
    public TacticVersionDto getVersion(@PathVariable Long tacticId, @PathVariable Long versionId) {
        return versionService.findById(tacticId, versionId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TacticVersionDto create(@PathVariable Long tacticId,
                                   @RequestBody TacticVersionDto.CreateVersionRequest request) {
        return versionService.create(tacticId, request);
    }

    @GetMapping("/compare")
    public VersionCompareDto compare(@PathVariable Long tacticId,
                                     @RequestParam Long v1,
                                     @RequestParam Long v2) {
        return versionService.compare(tacticId, v1, v2);
    }
}

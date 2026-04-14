package com.tactics.simulator.controller;

import com.tactics.simulator.dto.TacticDto;
import com.tactics.simulator.service.ShareService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/shared")
@RequiredArgsConstructor
public class ShareController {

    private final ShareService shareService;

    @GetMapping("/{uuid}")
    public TacticDto getShared(@PathVariable UUID uuid) {
        return shareService.getSharedTactic(uuid);
    }

    @PostMapping("/{uuid}/fork")
    @ResponseStatus(HttpStatus.CREATED)
    public TacticDto fork(@PathVariable UUID uuid) {
        return shareService.fork(uuid);
    }
}

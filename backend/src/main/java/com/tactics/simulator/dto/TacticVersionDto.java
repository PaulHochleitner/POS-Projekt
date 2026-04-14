package com.tactics.simulator.dto;

import java.time.LocalDateTime;

public record TacticVersionDto(
        Long id,
        Integer versionNumber,
        String label,
        String frames,
        LocalDateTime createdAt
) {
    public record CreateVersionRequest(
            String label,
            String frames
    ) {}
}

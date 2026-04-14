package com.tactics.simulator.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public record TacticDto(
        Long id,
        UUID uuid,
        String name,
        String description,
        Long teamId,
        String teamName,
        Boolean isPublic,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        Set<String> tags,
        int versionCount,
        TacticVersionDto latestVersion
) {
    public record CreateTacticRequest(
            @NotBlank String name,
            String description,
            Long teamId,
            Boolean isPublic,
            Set<String> tags,
            String frames
    ) {}

    public record UpdateTacticRequest(
            String name,
            String description,
            Long teamId,
            Boolean isPublic,
            Set<String> tags
    ) {}
}

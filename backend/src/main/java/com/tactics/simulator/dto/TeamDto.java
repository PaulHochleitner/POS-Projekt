package com.tactics.simulator.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;
import java.util.List;

public record TeamDto(
        Long id,
        @NotBlank String name,
        @NotBlank String primaryColor,
        @NotBlank String secondaryColor,
        String logoUrl,
        LocalDateTime createdAt,
        List<PlayerDto> players
) {
    public record CreateTeamRequest(
            @NotBlank String name,
            @NotBlank String primaryColor,
            @NotBlank String secondaryColor,
            String logoUrl
    ) {}

    public record UpdateTeamRequest(
            @NotBlank String name,
            @NotBlank String primaryColor,
            @NotBlank String secondaryColor,
            String logoUrl
    ) {}
}

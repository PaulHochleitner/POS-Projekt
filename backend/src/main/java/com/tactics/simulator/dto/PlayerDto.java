package com.tactics.simulator.dto;

import com.tactics.simulator.model.enums.Position;
import jakarta.validation.constraints.*;

public record PlayerDto(
        Long id,
        String name,
        Integer number,
        Position position,
        Integer pace,
        Integer passing,
        Integer shooting,
        Integer defending,
        Integer physical,
        Integer dribbling,
        String imageUrl,
        Long teamId,
        String notes
) {
    public record CreatePlayerRequest(
            @NotBlank String name,
            @Min(1) @Max(99) Integer number,
            @NotNull Position position,
            @Min(1) @Max(99) Integer pace,
            @Min(1) @Max(99) Integer passing,
            @Min(1) @Max(99) Integer shooting,
            @Min(1) @Max(99) Integer defending,
            @Min(1) @Max(99) Integer physical,
            @Min(1) @Max(99) Integer dribbling,
            @Size(max = 2000) String notes
    ) {}

    public record UpdatePlayerRequest(
            @NotBlank String name,
            @Min(1) @Max(99) Integer number,
            @NotNull Position position,
            @Min(1) @Max(99) Integer pace,
            @Min(1) @Max(99) Integer passing,
            @Min(1) @Max(99) Integer shooting,
            @Min(1) @Max(99) Integer defending,
            @Min(1) @Max(99) Integer physical,
            @Min(1) @Max(99) Integer dribbling,
            @Size(max = 2000) String notes
    ) {}
}

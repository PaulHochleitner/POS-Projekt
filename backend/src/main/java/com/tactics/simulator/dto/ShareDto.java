package com.tactics.simulator.dto;

import java.util.UUID;

public record ShareDto(
        UUID uuid,
        String shareUrl,
        boolean isPublic
) {}

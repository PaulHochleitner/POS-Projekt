package com.tactics.simulator.dto;

public record TagDto(
        Long id,
        String name,
        long usageCount
) {}

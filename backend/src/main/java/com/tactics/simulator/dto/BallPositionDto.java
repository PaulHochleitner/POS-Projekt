package com.tactics.simulator.dto;

public record BallPositionDto(
        double x,
        double y,
        Long carriedByPlayerId
) {}

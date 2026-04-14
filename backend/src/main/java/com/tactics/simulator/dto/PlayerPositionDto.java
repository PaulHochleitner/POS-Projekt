package com.tactics.simulator.dto;

public record PlayerPositionDto(
        Long playerId,
        String playerName,
        int playerNumber,
        String position,
        double x,
        double y
) {}

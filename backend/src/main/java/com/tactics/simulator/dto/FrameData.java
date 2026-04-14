package com.tactics.simulator.dto;

import java.util.List;

public record FrameData(
        List<Frame> frames,
        Double animationSpeed,
        String pitchType
) {
    public record Frame(
            int index,
            String label,
            List<PlayerPosition> players,
            BallPosition ball
    ) {}

    public record PlayerPosition(
            Long playerId,
            String playerName,
            int playerNumber,
            String position,
            double x,
            double y
    ) {}

    public record BallPosition(
            double x,
            double y,
            Long carriedByPlayerId
    ) {}
}

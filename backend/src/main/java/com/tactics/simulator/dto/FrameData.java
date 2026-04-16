package com.tactics.simulator.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * Backend representation of a tactic's frame stream. The frontend frame shape
 * also includes an `opponents` array — it is intentionally NOT declared here so
 * that GIF exports render only the user's own team. {@link JsonIgnoreProperties}
 * guarantees the opponents field is dropped during deserialization even if the
 * global Jackson config is ever tightened.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record FrameData(
        List<Frame> frames,
        Double animationSpeed,
        String pitchType
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Frame(
            int index,
            String label,
            List<PlayerPosition> players,
            List<PlayerPosition> opponents,
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

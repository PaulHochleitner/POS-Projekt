package com.tactics.simulator.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tactics.simulator.dto.FrameData;
import com.tactics.simulator.dto.ValidationResultDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ValidationService {

    private final ObjectMapper objectMapper;

    public ValidationResultDto validateLineup(String framesJson) {
        List<String> errors = new ArrayList<>();

        FrameData frameData;
        try {
            frameData = objectMapper.readValue(framesJson, FrameData.class);
        } catch (JsonProcessingException e) {
            return new ValidationResultDto(false, List.of("Invalid JSON format: " + e.getMessage()));
        }

        if (frameData.frames() == null || frameData.frames().isEmpty()) {
            return new ValidationResultDto(false, List.of("No frames provided"));
        }

        for (int i = 0; i < frameData.frames().size(); i++) {
            FrameData.Frame frame = frameData.frames().get(i);
            validateFrame(frame, i, errors);
        }

        return new ValidationResultDto(errors.isEmpty(), errors);
    }

    private void validateFrame(FrameData.Frame frame, int frameIndex, List<String> errors) {
        if (frame.players() == null) {
            errors.add("Frame " + frameIndex + ": players list is null");
            return;
        }

        if (frame.players().size() != 11) {
            errors.add("Frame " + frameIndex + ": expected 11 players, found " + frame.players().size());
        }

        long gkCount = frame.players().stream()
                .filter(p -> "GK".equals(p.position()))
                .count();
        if (gkCount != 1) {
            errors.add("Frame " + frameIndex + ": expected exactly 1 GK, found " + gkCount);
        }

        Set<Long> playerIds = new HashSet<>();
        for (FrameData.PlayerPosition player : frame.players()) {
            if (!playerIds.add(player.playerId())) {
                errors.add("Frame " + frameIndex + ": duplicate player ID " + player.playerId());
            }

            if (player.x() < 0 || player.x() > 100) {
                errors.add("Frame " + frameIndex + ": player " + player.playerName() + " x=" + player.x() + " out of range [0,100]");
            }
            if (player.y() < 0 || player.y() > 100) {
                errors.add("Frame " + frameIndex + ": player " + player.playerName() + " y=" + player.y() + " out of range [0,100]");
            }
        }

        if (frame.ball() != null) {
            if (frame.ball().x() < 0 || frame.ball().x() > 100) {
                errors.add("Frame " + frameIndex + ": ball x=" + frame.ball().x() + " out of range [0,100]");
            }
            if (frame.ball().y() < 0 || frame.ball().y() > 100) {
                errors.add("Frame " + frameIndex + ": ball y=" + frame.ball().y() + " out of range [0,100]");
            }
        }
    }
}

package com.tactics.simulator.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tactics.simulator.dto.ValidationResultDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ValidationServiceTest {

    private ValidationService validationService;

    @BeforeEach
    void setUp() {
        validationService = new ValidationService(new ObjectMapper());
    }

    @Test
    void shouldValidateCorrectLineup() {
        String json = buildValidFrameJson();
        ValidationResultDto result = validationService.validateLineup(json);
        assertThat(result.valid()).isTrue();
        assertThat(result.errors()).isEmpty();
    }

    @Test
    void shouldRejectTooFewPlayers() {
        String json = """
                {
                  "frames": [{
                    "index": 0,
                    "label": "Test",
                    "players": [
                      {"playerId": 1, "playerName": "GK", "playerNumber": 1, "position": "GK", "x": 50, "y": 95}
                    ],
                    "ball": {"x": 50, "y": 50, "carriedByPlayerId": null}
                  }],
                  "animationSpeed": 1.0,
                  "pitchType": "full"
                }
                """;
        ValidationResultDto result = validationService.validateLineup(json);
        assertThat(result.valid()).isFalse();
        assertThat(result.errors()).anyMatch(e -> e.contains("expected 11 players"));
    }

    @Test
    void shouldRejectNoGoalkeeper() {
        String json = buildFrameJsonWithPositions("CB", "CB", "LB", "RB", "CDM", "CM", "CAM", "LM", "RM", "LW", "ST");
        ValidationResultDto result = validationService.validateLineup(json);
        assertThat(result.valid()).isFalse();
        assertThat(result.errors()).anyMatch(e -> e.contains("expected exactly 1 GK"));
    }

    @Test
    void shouldRejectDuplicatePlayerIds() {
        StringBuilder players = new StringBuilder();
        for (int i = 0; i < 11; i++) {
            if (i > 0) players.append(",");
            long id = (i == 10) ? 1 : (i + 1); // duplicate ID 1
            String pos = (i == 0) ? "GK" : "CB";
            players.append(String.format(
                    "{\"playerId\": %d, \"playerName\": \"P%d\", \"playerNumber\": %d, \"position\": \"%s\", \"x\": %d, \"y\": %d}",
                    id, i + 1, i + 1, pos, 10 + i * 8, 50));
        }
        String json = String.format("""
                {"frames": [{"index": 0, "label": "Test", "players": [%s],
                "ball": {"x": 50, "y": 50, "carriedByPlayerId": null}}],
                "animationSpeed": 1.0, "pitchType": "full"}""", players);
        ValidationResultDto result = validationService.validateLineup(json);
        assertThat(result.valid()).isFalse();
        assertThat(result.errors()).anyMatch(e -> e.contains("duplicate player ID"));
    }

    @Test
    void shouldRejectOutOfBoundsCoordinates() {
        StringBuilder players = new StringBuilder();
        String[] positions = {"GK", "CB", "CB", "LB", "RB", "CDM", "CM", "CAM", "LM", "LW", "ST"};
        for (int i = 0; i < 11; i++) {
            if (i > 0) players.append(",");
            int x = (i == 0) ? 150 : (10 + i * 8); // first player out of bounds
            players.append(String.format(
                    "{\"playerId\": %d, \"playerName\": \"P%d\", \"playerNumber\": %d, \"position\": \"%s\", \"x\": %d, \"y\": 50}",
                    i + 1, i + 1, i + 1, positions[i], x));
        }
        String json = String.format("""
                {"frames": [{"index": 0, "label": "Test", "players": [%s],
                "ball": {"x": 50, "y": 50, "carriedByPlayerId": null}}],
                "animationSpeed": 1.0, "pitchType": "full"}""", players);
        ValidationResultDto result = validationService.validateLineup(json);
        assertThat(result.valid()).isFalse();
        assertThat(result.errors()).anyMatch(e -> e.contains("out of range"));
    }

    @Test
    void shouldRejectInvalidJson() {
        ValidationResultDto result = validationService.validateLineup("not json");
        assertThat(result.valid()).isFalse();
        assertThat(result.errors()).anyMatch(e -> e.contains("Invalid JSON format"));
    }

    @Test
    void shouldRejectEmptyFrames() {
        String json = """
                {"frames": [], "animationSpeed": 1.0, "pitchType": "full"}
                """;
        ValidationResultDto result = validationService.validateLineup(json);
        assertThat(result.valid()).isFalse();
        assertThat(result.errors()).anyMatch(e -> e.contains("No frames provided"));
    }

    private String buildValidFrameJson() {
        return buildFrameJsonWithPositions("GK", "CB", "CB", "LB", "RB", "CDM", "CM", "CAM", "LM", "LW", "ST");
    }

    private String buildFrameJsonWithPositions(String... positions) {
        StringBuilder players = new StringBuilder();
        for (int i = 0; i < positions.length; i++) {
            if (i > 0) players.append(",");
            int x = 10 + i * 8;
            players.append(String.format(
                    "{\"playerId\": %d, \"playerName\": \"Player %d\", \"playerNumber\": %d, \"position\": \"%s\", \"x\": %d, \"y\": 50}",
                    i + 1, i + 1, i + 1, positions[i], x));
        }
        return String.format("""
                {"frames": [{"index": 0, "label": "Test", "players": [%s],
                "ball": {"x": 50, "y": 50, "carriedByPlayerId": null}}],
                "animationSpeed": 1.0, "pitchType": "full"}""", players);
    }
}

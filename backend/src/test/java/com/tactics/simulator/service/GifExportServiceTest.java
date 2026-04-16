package com.tactics.simulator.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tactics.simulator.exception.ResourceNotFoundException;
import com.tactics.simulator.model.Tactic;
import com.tactics.simulator.model.TacticVersion;
import com.tactics.simulator.repository.TacticVersionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GifExportServiceTest {

    private static final String VALID_FRAMES_JSON = """
            {"frames":[{"index":0,"label":"Frame 1","players":[{"playerId":1,"playerName":"Test","playerNumber":1,"position":"GK","x":6,"y":50}],"opponents":[],"ball":{"x":50,"y":50,"carriedByPlayerId":null}},{"index":1,"label":"Frame 2","players":[{"playerId":1,"playerName":"Test","playerNumber":1,"position":"GK","x":10,"y":50}],"opponents":[],"ball":{"x":55,"y":50,"carriedByPlayerId":null}}],"animationSpeed":1.0,"pitchType":"full"}""";

    @Mock
    private TacticVersionRepository versionRepository;

    private GifExportService gifExportService;

    @BeforeEach
    void setUp() {
        gifExportService = new GifExportService(versionRepository, new ObjectMapper());
    }

    private TacticVersion buildVersion(Long tacticId, String frames) {
        Tactic tactic = Tactic.builder()
                .id(tacticId)
                .uuid(UUID.randomUUID())
                .name("Test")
                .build();
        return TacticVersion.builder()
                .id(1L)
                .tactic(tactic)
                .versionNumber(1)
                .label("v1")
                .frames(frames)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void shouldExportGif() {
        TacticVersion version = buildVersion(1L, VALID_FRAMES_JSON);
        when(versionRepository.findById(1L)).thenReturn(Optional.of(version));

        byte[] result = gifExportService.exportGif(1L, 1L);

        assertThat(result).isNotEmpty();
        // Verify GIF89a magic bytes
        assertThat(result[0]).isEqualTo((byte) 'G');
        assertThat(result[1]).isEqualTo((byte) 'I');
        assertThat(result[2]).isEqualTo((byte) 'F');
        assertThat(result[3]).isEqualTo((byte) '8');
        assertThat(result[4]).isEqualTo((byte) '9');
        assertThat(result[5]).isEqualTo((byte) 'a');
    }

    @Test
    void shouldThrow404WhenVersionNotFound() {
        when(versionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> gifExportService.exportGif(1L, 99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void shouldThrow404WhenVersionBelongsToDifferentTactic() {
        TacticVersion version = buildVersion(2L, VALID_FRAMES_JSON);
        when(versionRepository.findById(1L)).thenReturn(Optional.of(version));

        assertThatThrownBy(() -> gifExportService.exportGif(1L, 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void shouldThrowOnInvalidFrameJson() {
        TacticVersion version = buildVersion(1L, "invalid json");
        when(versionRepository.findById(1L)).thenReturn(Optional.of(version));

        assertThatThrownBy(() -> gifExportService.exportGif(1L, 1L))
                .isInstanceOf(IllegalStateException.class);
    }
}

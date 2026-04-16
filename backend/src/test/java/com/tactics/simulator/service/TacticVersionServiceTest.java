package com.tactics.simulator.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tactics.simulator.dto.FrameData;
import com.tactics.simulator.dto.TacticVersionDto;
import com.tactics.simulator.dto.VersionCompareDto;
import com.tactics.simulator.exception.ResourceNotFoundException;
import com.tactics.simulator.model.Tactic;
import com.tactics.simulator.model.TacticVersion;
import com.tactics.simulator.repository.TacticRepository;
import com.tactics.simulator.repository.TacticVersionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TacticVersionServiceTest {

    @Mock
    private TacticVersionRepository versionRepository;

    @Mock
    private TacticRepository tacticRepository;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private TacticVersionService tacticVersionService;

    @Test
    void shouldFindVersionsByTacticId() {
        when(tacticRepository.existsById(1L)).thenReturn(true);

        Tactic tactic = Tactic.builder().id(1L).build();
        TacticVersion version = TacticVersion.builder()
                .id(10L)
                .tactic(tactic)
                .versionNumber(1)
                .label("v1")
                .frames("{}")
                .createdAt(LocalDateTime.now())
                .build();

        when(versionRepository.findByTacticIdOrderByVersionNumberDesc(1L))
                .thenReturn(List.of(version));

        List<TacticVersionDto> result = tacticVersionService.findByTacticId(1L);

        assertEquals(1, result.size());
        assertEquals(1, result.get(0).versionNumber());
        assertEquals("v1", result.get(0).label());
    }

    @Test
    void shouldThrow404WhenTacticNotFound() {
        when(tacticRepository.existsById(99L)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class,
                () -> tacticVersionService.findByTacticId(99L));
    }

    @Test
    void shouldFindVersionById() {
        Tactic tactic = Tactic.builder().id(1L).build();
        TacticVersion version = TacticVersion.builder()
                .id(10L)
                .tactic(tactic)
                .versionNumber(1)
                .label("v1")
                .frames("{\"frames\":[]}")
                .createdAt(LocalDateTime.now())
                .build();

        when(versionRepository.findById(10L)).thenReturn(Optional.of(version));

        TacticVersionDto result = tacticVersionService.findById(1L, 10L);

        assertNotNull(result);
        assertEquals(10L, result.id());
        assertEquals("{\"frames\":[]}", result.frames());
    }

    @Test
    void shouldThrow404WhenVersionBelongsToDifferentTactic() {
        Tactic tactic = Tactic.builder().id(2L).build();
        TacticVersion version = TacticVersion.builder()
                .id(10L)
                .tactic(tactic)
                .versionNumber(1)
                .label("v1")
                .frames("{}")
                .createdAt(LocalDateTime.now())
                .build();

        when(versionRepository.findById(10L)).thenReturn(Optional.of(version));

        assertThrows(ResourceNotFoundException.class,
                () -> tacticVersionService.findById(1L, 10L));
    }

    @Test
    void shouldCreateVersion() {
        Tactic tactic = Tactic.builder().id(1L).build();
        when(tacticRepository.findById(1L)).thenReturn(Optional.of(tactic));
        when(versionRepository.findMaxVersionNumberByTacticId(1L)).thenReturn(1);
        when(versionRepository.save(any(TacticVersion.class))).thenAnswer(invocation -> {
            TacticVersion saved = invocation.getArgument(0);
            saved.setId(20L);
            saved.setCreatedAt(LocalDateTime.now());
            return saved;
        });

        TacticVersionDto.CreateVersionRequest request = new TacticVersionDto.CreateVersionRequest(
                "Version 2", "{\"frames\":[]}"
        );

        TacticVersionDto result = tacticVersionService.create(1L, request);

        assertNotNull(result);
        assertEquals(2, result.versionNumber());
        assertEquals("Version 2", result.label());
        verify(versionRepository).save(argThat(v -> v.getVersionNumber() == 2));
    }

    @Test
    void shouldCompareVersions() throws JsonProcessingException {
        Tactic tactic = Tactic.builder().id(1L).build();

        String framesJson1 = "{\"frames\":[{\"index\":0,\"label\":\"Start\",\"players\":[{\"playerId\":1,\"playerName\":\"Player1\",\"playerNumber\":9,\"position\":\"ST\",\"x\":50.0,\"y\":50.0}],\"opponents\":[],\"ball\":{\"x\":50.0,\"y\":50.0,\"carriedByPlayerId\":1}}],\"animationSpeed\":1.0,\"pitchType\":\"standard\"}";
        String framesJson2 = "{\"frames\":[{\"index\":0,\"label\":\"Start\",\"players\":[{\"playerId\":1,\"playerName\":\"Player1\",\"playerNumber\":9,\"position\":\"ST\",\"x\":80.0,\"y\":80.0}],\"opponents\":[],\"ball\":{\"x\":80.0,\"y\":80.0,\"carriedByPlayerId\":1}}],\"animationSpeed\":1.0,\"pitchType\":\"standard\"}";

        TacticVersion version1 = TacticVersion.builder()
                .id(10L).tactic(tactic).versionNumber(1).label("v1")
                .frames(framesJson1).createdAt(LocalDateTime.now()).build();
        TacticVersion version2 = TacticVersion.builder()
                .id(11L).tactic(tactic).versionNumber(2).label("v2")
                .frames(framesJson2).createdAt(LocalDateTime.now()).build();

        when(versionRepository.findById(10L)).thenReturn(Optional.of(version1));
        when(versionRepository.findById(11L)).thenReturn(Optional.of(version2));

        FrameData.PlayerPosition p1 = new FrameData.PlayerPosition(1L, "Player1", 9, "ST", 50.0, 50.0);
        FrameData.BallPosition b1 = new FrameData.BallPosition(50.0, 50.0, 1L);
        FrameData.Frame frame1 = new FrameData.Frame(0, "Start", List.of(p1), List.of(), b1);
        FrameData data1 = new FrameData(List.of(frame1), 1.0, "standard");

        FrameData.PlayerPosition p2 = new FrameData.PlayerPosition(1L, "Player1", 9, "ST", 80.0, 80.0);
        FrameData.BallPosition b2 = new FrameData.BallPosition(80.0, 80.0, 1L);
        FrameData.Frame frame2 = new FrameData.Frame(0, "Start", List.of(p2), List.of(), b2);
        FrameData data2 = new FrameData(List.of(frame2), 1.0, "standard");

        when(objectMapper.readValue(eq(framesJson1), eq(FrameData.class))).thenReturn(data1);
        when(objectMapper.readValue(eq(framesJson2), eq(FrameData.class))).thenReturn(data2);

        VersionCompareDto result = tacticVersionService.compare(1L, 10L, 11L);

        assertNotNull(result);
        assertNotNull(result.diff());
        assertEquals(0, result.diff().framesAddedOrRemoved());
        assertFalse(result.diff().playerChanges().isEmpty());
        assertFalse(result.diff().ballChanges().isEmpty());
    }
}

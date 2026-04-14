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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TacticVersionService {

    private final TacticVersionRepository versionRepository;
    private final TacticRepository tacticRepository;
    private final ObjectMapper objectMapper;

    public List<TacticVersionDto> findByTacticId(Long tacticId) {
        if (!tacticRepository.existsById(tacticId)) {
            throw new ResourceNotFoundException("Tactic", tacticId);
        }
        return versionRepository.findByTacticIdOrderByVersionNumberDesc(tacticId).stream()
                .map(v -> new TacticVersionDto(v.getId(), v.getVersionNumber(), v.getLabel(), null, v.getCreatedAt()))
                .toList();
    }

    public TacticVersionDto findById(Long tacticId, Long versionId) {
        TacticVersion version = versionRepository.findById(versionId)
                .orElseThrow(() -> new ResourceNotFoundException("TacticVersion", versionId));
        if (!version.getTactic().getId().equals(tacticId)) {
            throw new ResourceNotFoundException("TacticVersion", versionId);
        }
        return toDto(version);
    }

    @Transactional
    public TacticVersionDto create(Long tacticId, TacticVersionDto.CreateVersionRequest request) {
        Tactic tactic = tacticRepository.findById(tacticId)
                .orElseThrow(() -> new ResourceNotFoundException("Tactic", tacticId));

        int nextVersion = versionRepository.findMaxVersionNumberByTacticId(tacticId) + 1;

        TacticVersion version = TacticVersion.builder()
                .tactic(tactic)
                .versionNumber(nextVersion)
                .label(request.label())
                .frames(request.frames())
                .build();

        return toDto(versionRepository.save(version));
    }

    public VersionCompareDto compare(Long tacticId, Long versionId1, Long versionId2) {
        TacticVersionDto v1 = findById(tacticId, versionId1);
        TacticVersionDto v2 = findById(tacticId, versionId2);

        VersionCompareDto.DiffSummary diff = computeDiff(v1.frames(), v2.frames());
        return new VersionCompareDto(v1, v2, diff);
    }

    private VersionCompareDto.DiffSummary computeDiff(String framesJson1, String framesJson2) {
        List<String> playerChanges = new ArrayList<>();
        List<String> ballChanges = new ArrayList<>();
        int frameDiff = 0;

        try {
            FrameData data1 = objectMapper.readValue(framesJson1, FrameData.class);
            FrameData data2 = objectMapper.readValue(framesJson2, FrameData.class);

            frameDiff = Math.abs(data1.frames().size() - data2.frames().size());

            int minFrames = Math.min(data1.frames().size(), data2.frames().size());
            for (int i = 0; i < minFrames; i++) {
                FrameData.Frame f1 = data1.frames().get(i);
                FrameData.Frame f2 = data2.frames().get(i);

                Map<Long, FrameData.PlayerPosition> players1 = f1.players().stream()
                        .collect(Collectors.toMap(FrameData.PlayerPosition::playerId, p -> p));

                for (FrameData.PlayerPosition p2 : f2.players()) {
                    FrameData.PlayerPosition p1 = players1.get(p2.playerId());
                    if (p1 != null) {
                        double dist = Math.sqrt(Math.pow(p1.x() - p2.x(), 2) + Math.pow(p1.y() - p2.y(), 2));
                        if (dist > 5.0) {
                            playerChanges.add("Frame " + i + ": " + p2.playerName() +
                                    " moved " + String.format("%.1f", dist) + " units");
                        }
                    }
                }

                double ballDist = Math.sqrt(
                        Math.pow(f1.ball().x() - f2.ball().x(), 2) +
                        Math.pow(f1.ball().y() - f2.ball().y(), 2));
                if (ballDist > 5.0) {
                    ballChanges.add("Frame " + i + ": ball moved " + String.format("%.1f", ballDist) + " units");
                }
            }
        } catch (JsonProcessingException e) {
            playerChanges.add("Could not parse frame data for comparison");
        }

        return new VersionCompareDto.DiffSummary(frameDiff, playerChanges, ballChanges);
    }

    private TacticVersionDto toDto(TacticVersion version) {
        return new TacticVersionDto(
                version.getId(), version.getVersionNumber(),
                version.getLabel(), version.getFrames(), version.getCreatedAt());
    }
}

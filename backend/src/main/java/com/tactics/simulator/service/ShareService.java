package com.tactics.simulator.service;

import com.tactics.simulator.dto.TacticDto;
import com.tactics.simulator.exception.ResourceNotFoundException;
import com.tactics.simulator.exception.TacticNotPublicException;
import com.tactics.simulator.model.Tactic;
import com.tactics.simulator.model.TacticVersion;
import com.tactics.simulator.repository.TacticRepository;
import com.tactics.simulator.repository.TacticVersionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ShareService {

    private final TacticRepository tacticRepository;
    private final TacticVersionRepository versionRepository;
    private final TacticService tacticService;

    @Transactional(readOnly = true)
    public TacticDto getSharedTactic(UUID uuid) {
        Tactic tactic = tacticRepository.findByUuid(uuid)
                .orElseThrow(() -> new ResourceNotFoundException("Tactic", uuid));
        if (!Boolean.TRUE.equals(tactic.getIsPublic())) {
            throw new TacticNotPublicException(uuid);
        }
        return tacticService.toDto(tactic);
    }

    @Transactional
    public TacticDto fork(UUID uuid) {
        Tactic original = tacticRepository.findByUuid(uuid)
                .orElseThrow(() -> new ResourceNotFoundException("Tactic", uuid));
        if (!Boolean.TRUE.equals(original.getIsPublic())) {
            throw new TacticNotPublicException(uuid);
        }

        Tactic forked = Tactic.builder()
                .name(original.getName() + " (Fork)")
                .description(original.getDescription())
                .team(original.getTeam())
                .isPublic(false)
                .tags(new HashSet<>(original.getTags()))
                .build();
        forked = tacticRepository.save(forked);

        var latestVersion = versionRepository
                .findFirstByTacticIdOrderByVersionNumberDesc(original.getId());
        if (latestVersion.isPresent()) {
            TacticVersion copy = TacticVersion.builder()
                    .tactic(forked)
                    .versionNumber(1)
                    .label("Forked from " + original.getName())
                    .frames(latestVersion.get().getFrames())
                    .build();
            versionRepository.save(copy);
        }

        return tacticService.toDto(forked);
    }
}

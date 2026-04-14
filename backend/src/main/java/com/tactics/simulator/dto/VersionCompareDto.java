package com.tactics.simulator.dto;

import java.util.List;

public record VersionCompareDto(
        TacticVersionDto version1,
        TacticVersionDto version2,
        DiffSummary diff
) {
    public record DiffSummary(
            int framesAddedOrRemoved,
            List<String> playerChanges,
            List<String> ballChanges
    ) {}
}

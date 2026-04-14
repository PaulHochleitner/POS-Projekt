package com.tactics.simulator.dto;

import java.util.List;

public record ValidationResultDto(
        boolean valid,
        List<String> errors
) {}

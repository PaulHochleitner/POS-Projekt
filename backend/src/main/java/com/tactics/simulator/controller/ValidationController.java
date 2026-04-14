package com.tactics.simulator.controller;

import com.tactics.simulator.dto.ValidationResultDto;
import com.tactics.simulator.service.ValidationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/validate")
@RequiredArgsConstructor
public class ValidationController {

    private final ValidationService validationService;

    @PostMapping("/lineup")
    public ValidationResultDto validateLineup(@RequestBody String framesJson) {
        return validationService.validateLineup(framesJson);
    }
}

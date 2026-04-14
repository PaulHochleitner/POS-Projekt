package com.tactics.simulator.controller;

import com.tactics.simulator.dto.TacticDto;
import com.tactics.simulator.dto.TagDto;
import com.tactics.simulator.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    @GetMapping
    public List<TagDto> getAll() {
        return tagService.findAllWithUsageCount();
    }

    @GetMapping("/{name}/tactics")
    public List<TacticDto> getTacticsByTag(@PathVariable String name) {
        return tagService.findTacticsByTag(name);
    }
}

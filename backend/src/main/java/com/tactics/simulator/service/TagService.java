package com.tactics.simulator.service;

import com.tactics.simulator.dto.TagDto;
import com.tactics.simulator.dto.TacticDto;
import com.tactics.simulator.model.Tactic;
import com.tactics.simulator.model.TacticTag;
import com.tactics.simulator.repository.TacticRepository;
import com.tactics.simulator.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TagService {

    private final TagRepository tagRepository;
    private final TacticRepository tacticRepository;
    private final TacticService tacticService;

    public List<TagDto> findAllWithUsageCount() {
        return tagRepository.findAll().stream()
                .map(tag -> {
                    long count = tacticRepository.findByAllTags(List.of(tag.getName()), 1).size();
                    return new TagDto(tag.getId(), tag.getName(), count);
                })
                .toList();
    }

    public List<TacticDto> findTacticsByTag(String tagName) {
        List<Tactic> tactics = tacticRepository.findByAllTags(List.of(tagName), 1);
        return tactics.stream().map(tacticService::toDto).toList();
    }
}

package com.tactics.simulator.service;

import com.tactics.simulator.dto.TagDto;
import com.tactics.simulator.dto.TacticDto;
import com.tactics.simulator.model.Tactic;
import com.tactics.simulator.model.User;
import com.tactics.simulator.repository.TacticRepository;
import com.tactics.simulator.repository.TagRepository;
import com.tactics.simulator.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
    private final UserRepository userRepository;

    /**
     * Returns only tags used by the current user's tactics, with usage counts
     * scoped to that user. A new user with no tactics sees an empty list.
     */
    public List<TagDto> findAllWithUsageCount() {
        User currentUser = getCurrentUser();
        if (currentUser == null) return List.of();

        return tagRepository.findTagsByUserId(currentUser.getId()).stream()
                .map(tag -> {
                    long count = tacticRepository.findByUserIdAndAllTags(
                            currentUser.getId(), List.of(tag.getName()), 1).size();
                    return new TagDto(tag.getId(), tag.getName(), count);
                })
                .toList();
    }

    /**
     * Returns only the current user's tactics that have the given tag.
     */
    public List<TacticDto> findTacticsByTag(String tagName) {
        User currentUser = getCurrentUser();
        if (currentUser == null) return List.of();

        List<Tactic> tactics = tacticRepository.findByUserIdAndAllTags(
                currentUser.getId(), List.of(tagName), 1);
        return tactics.stream().map(tacticService::toDto).toList();
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        return userRepository.findByUsername(auth.getName()).orElse(null);
    }
}

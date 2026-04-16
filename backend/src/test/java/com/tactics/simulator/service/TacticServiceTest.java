package com.tactics.simulator.service;

import com.tactics.simulator.dto.TacticDto;
import com.tactics.simulator.exception.ResourceNotFoundException;
import com.tactics.simulator.model.*;
import com.tactics.simulator.repository.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TacticServiceTest {

    @Mock
    private TacticRepository tacticRepository;

    @Mock
    private TacticVersionRepository tacticVersionRepository;

    @Mock
    private TeamRepository teamRepository;

    @Mock
    private TagRepository tagRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private TacticService tacticService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .username("testuser")
                .email("test@example.com")
                .password("encoded")
                .createdAt(LocalDateTime.now())
                .build();

        var auth = new UsernamePasswordAuthenticationToken("testuser", null, List.of());
        SecurityContextHolder.getContext().setAuthentication(auth);

        lenient().when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldFindAllTacticsForCurrentUser() {
        Tactic tactic = buildTactic(1L, "Test Tactic");
        when(tacticRepository.findByUserIdOrderByUpdatedAtDesc(1L)).thenReturn(List.of(tactic));
        when(tacticVersionRepository.findFirstByTacticIdOrderByVersionNumberDesc(1L))
                .thenReturn(Optional.empty());

        List<TacticDto> result = tacticService.findAll(null, null);

        assertEquals(1, result.size());
        assertEquals("Test Tactic", result.get(0).name());
        verify(tacticRepository).findByUserIdOrderByUpdatedAtDesc(1L);
    }

    @Test
    void shouldReturnEmptyListWhenNoUser() {
        SecurityContextHolder.clearContext();

        List<TacticDto> result = tacticService.findAll(null, null);

        assertTrue(result.isEmpty());
    }

    @Test
    void shouldFilterByTags() {
        TacticTag konterTag = TacticTag.builder().id(1L).name("Konter").build();
        TacticTag pressingTag = TacticTag.builder().id(2L).name("Pressing").build();

        Tactic tactic1 = buildTactic(1L, "Tactic With Konter");
        tactic1.setTags(new HashSet<>(Set.of(konterTag)));

        Tactic tactic2 = buildTactic(2L, "Tactic Without Tag");
        tactic2.setTags(new HashSet<>(Set.of(pressingTag)));

        when(tacticRepository.findByUserIdOrderByUpdatedAtDesc(1L))
                .thenReturn(List.of(tactic1, tactic2));
        when(tacticVersionRepository.findFirstByTacticIdOrderByVersionNumberDesc(anyLong()))
                .thenReturn(Optional.empty());

        List<TacticDto> result = tacticService.findAll(List.of("Konter"), null);

        assertEquals(1, result.size());
        assertEquals("Tactic With Konter", result.get(0).name());
    }

    @Test
    void shouldSearchTactics() {
        Tactic tactic = buildTactic(1L, "Counter Attack");
        when(tacticRepository.searchByUser(1L, "Counter")).thenReturn(List.of(tactic));
        when(tacticVersionRepository.findFirstByTacticIdOrderByVersionNumberDesc(1L))
                .thenReturn(Optional.empty());

        List<TacticDto> result = tacticService.findAll(null, "Counter");

        assertEquals(1, result.size());
        verify(tacticRepository).searchByUser(1L, "Counter");
    }

    @Test
    void shouldFindTacticByIdWhenOwned() {
        Tactic tactic = buildTactic(1L, "My Tactic");
        when(tacticRepository.findById(1L)).thenReturn(Optional.of(tactic));
        when(tacticVersionRepository.findFirstByTacticIdOrderByVersionNumberDesc(1L))
                .thenReturn(Optional.empty());

        TacticDto result = tacticService.findById(1L);

        assertNotNull(result);
        assertEquals("My Tactic", result.name());
    }

    @Test
    void shouldThrow404WhenTacticNotOwnedByUser() {
        User otherUser = User.builder().id(2L).username("other").build();
        Tactic tactic = buildTactic(1L, "Other's Tactic");
        tactic.setUser(otherUser);
        when(tacticRepository.findById(1L)).thenReturn(Optional.of(tactic));

        assertThrows(ResourceNotFoundException.class, () -> tacticService.findById(1L));
    }

    @Test
    void shouldCreateTactic() {
        TacticDto.CreateTacticRequest request = new TacticDto.CreateTacticRequest(
                "New Tactic", "A description", null, null, null, "{\"frames\":[]}"
        );

        when(tacticRepository.save(any(Tactic.class))).thenAnswer(invocation -> {
            Tactic saved = invocation.getArgument(0);
            saved.setId(10L);
            saved.setUuid(UUID.randomUUID());
            saved.setCreatedAt(LocalDateTime.now());
            saved.setUpdatedAt(LocalDateTime.now());
            saved.setTags(new HashSet<>());
            saved.setVersions(new ArrayList<>());
            return saved;
        });
        when(tacticVersionRepository.save(any(TacticVersion.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(tacticVersionRepository.findFirstByTacticIdOrderByVersionNumberDesc(10L))
                .thenReturn(Optional.empty());

        TacticDto result = tacticService.create(request);

        assertNotNull(result);
        assertEquals("New Tactic", result.name());
        verify(tacticRepository).save(any(Tactic.class));
        verify(tacticVersionRepository).save(any(TacticVersion.class));
    }

    @Test
    void shouldUpdateOwnedTactic() {
        Tactic tactic = buildTactic(1L, "Old Name");
        when(tacticRepository.findById(1L)).thenReturn(Optional.of(tactic));
        when(tacticRepository.save(any(Tactic.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(tacticVersionRepository.findFirstByTacticIdOrderByVersionNumberDesc(1L))
                .thenReturn(Optional.empty());

        TacticDto.UpdateTacticRequest request = new TacticDto.UpdateTacticRequest(
                "New Name", "New Desc", null, null, null
        );

        TacticDto result = tacticService.update(1L, request);

        assertEquals("New Name", result.name());
        assertEquals("New Desc", result.description());
    }

    @Test
    void shouldDeleteOwnedTactic() {
        Tactic tactic = buildTactic(1L, "To Delete");
        when(tacticRepository.findById(1L)).thenReturn(Optional.of(tactic));

        tacticService.delete(1L);

        verify(tacticRepository).delete(tactic);
    }

    @Test
    void shouldResolveAndCreateNewTags() {
        TacticTag newTag = TacticTag.builder().id(5L).name("NewTag").build();

        when(tagRepository.findByName("NewTag")).thenReturn(Optional.empty());
        when(tagRepository.save(any(TacticTag.class))).thenReturn(newTag);
        when(tacticRepository.save(any(Tactic.class))).thenAnswer(invocation -> {
            Tactic saved = invocation.getArgument(0);
            saved.setId(10L);
            saved.setUuid(UUID.randomUUID());
            saved.setCreatedAt(LocalDateTime.now());
            saved.setUpdatedAt(LocalDateTime.now());
            saved.setVersions(new ArrayList<>());
            return saved;
        });
        when(tacticVersionRepository.findFirstByTacticIdOrderByVersionNumberDesc(10L))
                .thenReturn(Optional.empty());

        TacticDto.CreateTacticRequest request = new TacticDto.CreateTacticRequest(
                "Tagged Tactic", "Desc", null, null, Set.of("NewTag"), null
        );

        TacticDto result = tacticService.create(request);

        assertNotNull(result);
        verify(tagRepository).findByName("NewTag");
        verify(tagRepository).save(any(TacticTag.class));
    }

    private Tactic buildTactic(Long id, String name) {
        return Tactic.builder()
                .id(id)
                .uuid(UUID.randomUUID())
                .name(name)
                .description("Desc")
                .user(testUser)
                .tags(new HashSet<>())
                .versions(new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }
}

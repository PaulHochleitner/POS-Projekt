package com.tactics.simulator.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tactics.simulator.dto.TacticDto;
import com.tactics.simulator.dto.TacticVersionDto;
import com.tactics.simulator.service.JwtService;
import com.tactics.simulator.service.TacticService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import com.tactics.simulator.config.SecurityConfig;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TacticController.class)
@Import(SecurityConfig.class)
class TacticControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private TacticService tacticService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserDetailsService userDetailsService;

    private TacticDto sampleTactic() {
        return new TacticDto(1L, UUID.randomUUID(), "Konter rechts", "Schneller Konter",
                1L, "FC Test", null, null, LocalDateTime.now(), LocalDateTime.now(),
                Set.of("Konter", "4-3-3"), 1,
                new TacticVersionDto(1L, 1, "Initial", "{}", LocalDateTime.now()));
    }

    @Test
    @WithMockUser
    void shouldGetAllTactics() throws Exception {
        when(tacticService.findAll(any(), any())).thenReturn(List.of(sampleTactic()));

        mockMvc.perform(get("/api/tactics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Konter rechts"));
    }

    @Test
    @WithMockUser
    void shouldFilterByTags() throws Exception {
        when(tacticService.findAll(eq(List.of("Konter")), any())).thenReturn(List.of(sampleTactic()));

        mockMvc.perform(get("/api/tactics?tags=Konter"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Konter rechts"));
    }

    @Test
    @WithMockUser
    void shouldSearchTactics() throws Exception {
        when(tacticService.findAll(any(), eq("rechts"))).thenReturn(List.of(sampleTactic()));

        mockMvc.perform(get("/api/tactics?search=rechts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Konter rechts"));
    }

    @Test
    @WithMockUser
    void shouldCreateTactic() throws Exception {
        TacticDto.CreateTacticRequest request = new TacticDto.CreateTacticRequest(
                "New Tactic", "Description", null, null, Set.of("Pressing"), "{}");
        when(tacticService.create(any())).thenReturn(sampleTactic());

        mockMvc.perform(post("/api/tactics")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser
    void shouldUpdateTactic() throws Exception {
        TacticDto.UpdateTacticRequest request = new TacticDto.UpdateTacticRequest(
                "Updated Name", "New Desc", null, null, Set.of("Eckball"));
        when(tacticService.update(eq(1L), any())).thenReturn(sampleTactic());

        mockMvc.perform(put("/api/tactics/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser
    void shouldDeleteTactic() throws Exception {
        mockMvc.perform(delete("/api/tactics/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    void shouldReturn401WhenNotAuthenticated() throws Exception {
        mockMvc.perform(get("/api/tactics"))
                .andExpect(status().isForbidden());
    }
}

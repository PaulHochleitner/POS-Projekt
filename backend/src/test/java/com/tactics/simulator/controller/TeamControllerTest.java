package com.tactics.simulator.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tactics.simulator.dto.TeamDto;
import com.tactics.simulator.exception.ResourceNotFoundException;
import com.tactics.simulator.service.JwtService;
import com.tactics.simulator.service.TeamService;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TeamController.class)
@Import(SecurityConfig.class)
class TeamControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private TeamService teamService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @Test
    void shouldGetAllTeams() throws Exception {
        TeamDto team = new TeamDto(1L, "FC Test", "#FFD700", "#DC143C", null,
                LocalDateTime.now(), List.of());
        when(teamService.findAll()).thenReturn(List.of(team));

        mockMvc.perform(get("/api/teams"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("FC Test"))
                .andExpect(jsonPath("$[0].primaryColor").value("#FFD700"));
    }

    @Test
    void shouldGetTeamById() throws Exception {
        TeamDto team = new TeamDto(1L, "FC Test", "#FFD700", "#DC143C", null,
                LocalDateTime.now(), List.of());
        when(teamService.findById(1L)).thenReturn(team);

        mockMvc.perform(get("/api/teams/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("FC Test"));
    }

    @Test
    void shouldReturn404WhenTeamNotFound() throws Exception {
        when(teamService.findById(99L)).thenThrow(new ResourceNotFoundException("Team", 99L));

        mockMvc.perform(get("/api/teams/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser
    void shouldCreateTeam() throws Exception {
        TeamDto.CreateTeamRequest request = new TeamDto.CreateTeamRequest(
                "FC New", "#FFFFFF", "#000000", null);
        TeamDto created = new TeamDto(1L, "FC New", "#FFFFFF", "#000000", null,
                LocalDateTime.now(), List.of());
        when(teamService.create(any())).thenReturn(created);

        mockMvc.perform(post("/api/teams")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("FC New"));
    }

    @Test
    @WithMockUser
    void shouldRejectInvalidTeamCreation() throws Exception {
        String invalidJson = """
                {"name": "", "primaryColor": "", "secondaryColor": ""}
                """;

        mockMvc.perform(post("/api/teams")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void shouldUpdateTeam() throws Exception {
        TeamDto.UpdateTeamRequest request = new TeamDto.UpdateTeamRequest(
                "FC Updated", "#111111", "#222222", null);
        TeamDto updated = new TeamDto(1L, "FC Updated", "#111111", "#222222", null,
                LocalDateTime.now(), List.of());
        when(teamService.update(eq(1L), any())).thenReturn(updated);

        mockMvc.perform(put("/api/teams/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("FC Updated"));
    }

    @Test
    @WithMockUser
    void shouldDeleteTeam() throws Exception {
        mockMvc.perform(delete("/api/teams/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser
    void shouldReturn404OnDeleteNonExistentTeam() throws Exception {
        doThrow(new ResourceNotFoundException("Team", 99L)).when(teamService).delete(99L);

        mockMvc.perform(delete("/api/teams/99"))
                .andExpect(status().isNotFound());
    }
}

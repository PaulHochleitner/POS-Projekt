package com.tactics.simulator.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tactics.simulator.dto.PlayerDto;
import com.tactics.simulator.model.enums.Position;
import com.tactics.simulator.service.JwtService;
import com.tactics.simulator.service.PlayerService;
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

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PlayerController.class)
@Import(SecurityConfig.class)
class PlayerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private PlayerService playerService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @Test
    void shouldGetPlayersByTeam() throws Exception {
        PlayerDto player = new PlayerDto(1L, "Test Player", 10, Position.ST, 80, 75, 85, 70, 65, 72, null, 1L);
        when(playerService.findByTeamId(1L)).thenReturn(List.of(player));

        mockMvc.perform(get("/api/teams/1/players"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Test Player"))
                .andExpect(jsonPath("$[0].number").value(10))
                .andExpect(jsonPath("$[0].position").value("ST"));
    }

    @Test
    @WithMockUser
    void shouldCreatePlayer() throws Exception {
        PlayerDto.CreatePlayerRequest request = new PlayerDto.CreatePlayerRequest(
                "New Player", 7, Position.LW, 90, 70, 80, 65, 60, 75);
        PlayerDto created = new PlayerDto(1L, "New Player", 7, Position.LW, 90, 70, 80, 65, 60, 75, null, 1L);
        when(playerService.create(eq(1L), any())).thenReturn(created);

        mockMvc.perform(post("/api/teams/1/players")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("New Player"))
                .andExpect(jsonPath("$.position").value("LW"));
    }

    @Test
    @WithMockUser
    void shouldUpdatePlayer() throws Exception {
        PlayerDto.UpdatePlayerRequest request = new PlayerDto.UpdatePlayerRequest(
                "Updated Player", 9, Position.ST, 85, 72, 90, 68, 70, 77);
        PlayerDto updated = new PlayerDto(1L, "Updated Player", 9, Position.ST, 85, 72, 90, 68, 70, 77, null, 1L);
        when(playerService.update(eq(1L), any())).thenReturn(updated);

        mockMvc.perform(put("/api/players/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Player"));
    }

    @Test
    @WithMockUser
    void shouldDeletePlayer() throws Exception {
        mockMvc.perform(delete("/api/players/1"))
                .andExpect(status().isNoContent());
    }
}

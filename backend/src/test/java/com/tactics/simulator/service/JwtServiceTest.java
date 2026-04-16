package com.tactics.simulator.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secret",
                "dGVzdC1zZWNyZXQta2V5LWZvci10ZXN0aW5nLW9ubHktMjU2Yml0cy1sb25nLWtleS1oZXJl");
        ReflectionTestUtils.setField(jwtService, "expiration", 86400000L);
    }

    @Test
    void shouldGenerateToken() {
        String token = jwtService.generateToken("testuser");

        assertNotNull(token);
        assertFalse(token.isEmpty());
    }

    @Test
    void shouldExtractUsername() {
        String token = jwtService.generateToken("testuser");

        String username = jwtService.extractUsername(token);

        assertEquals("testuser", username);
    }

    @Test
    void shouldValidateCorrectToken() {
        String token = jwtService.generateToken("testuser");

        assertTrue(jwtService.isTokenValid(token, "testuser"));
    }

    @Test
    void shouldRejectTokenWithWrongUsername() {
        String token = jwtService.generateToken("user1");

        assertFalse(jwtService.isTokenValid(token, "user2"));
    }

    @Test
    void shouldRejectExpiredToken() throws InterruptedException {
        ReflectionTestUtils.setField(jwtService, "expiration", 1L);

        String token = jwtService.generateToken("testuser");
        Thread.sleep(50);

        assertThrows(io.jsonwebtoken.ExpiredJwtException.class,
                () -> jwtService.isTokenValid(token, "testuser"));
    }
}

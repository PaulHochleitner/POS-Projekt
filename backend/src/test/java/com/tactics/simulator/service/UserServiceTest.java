package com.tactics.simulator.service;

import com.tactics.simulator.dto.AuthDto;
import com.tactics.simulator.model.User;
import com.tactics.simulator.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    @Test
    void shouldLoadUserByUsername() {
        User user = User.builder()
                .id(1L)
                .username("testuser")
                .email("test@example.com")
                .password("encodedPassword")
                .createdAt(LocalDateTime.now())
                .build();
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));

        UserDetails details = userService.loadUserByUsername("testuser");

        assertNotNull(details);
        assertEquals("testuser", details.getUsername());
        assertEquals("encodedPassword", details.getPassword());
    }

    @Test
    void shouldThrowWhenUserNotFound() {
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class,
                () -> userService.loadUserByUsername("unknown"));
    }

    @Test
    void shouldRegisterNewUser() {
        AuthDto.RegisterRequest request = new AuthDto.RegisterRequest("newuser", "new@example.com", "password123");

        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encodedPw");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });

        User result = userService.register(request);

        assertNotNull(result);
        verify(userRepository).save(argThat(u -> "encodedPw".equals(u.getPassword())));
    }

    @Test
    void shouldRejectDuplicateUsername() {
        AuthDto.RegisterRequest request = new AuthDto.RegisterRequest("existing", "new@example.com", "password123");
        when(userRepository.existsByUsername("existing")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userService.register(request));

        assertEquals("Benutzername bereits vergeben", ex.getMessage());
    }

    @Test
    void shouldRejectDuplicateEmail() {
        AuthDto.RegisterRequest request = new AuthDto.RegisterRequest("newuser", "existing@example.com", "password123");
        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userService.register(request));

        assertEquals("E-Mail bereits registriert", ex.getMessage());
    }
}

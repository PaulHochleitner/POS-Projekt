package com.tactics.simulator.controller;

import com.tactics.simulator.dto.AuthDto;
import com.tactics.simulator.model.User;
import com.tactics.simulator.service.JwtService;
import com.tactics.simulator.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @PostMapping("/register")
    public ResponseEntity<AuthDto.AuthResponse> register(@Valid @RequestBody AuthDto.RegisterRequest request) {
        User user = userService.register(request);
        String token = jwtService.generateToken(user.getUsername());
        return ResponseEntity.ok(new AuthDto.AuthResponse(token, user.getUsername(), user.getEmail()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthDto.AuthResponse> login(@Valid @RequestBody AuthDto.LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password()));
        User user = userService.findByUsername(request.username());
        String token = jwtService.generateToken(user.getUsername());
        return ResponseEntity.ok(new AuthDto.AuthResponse(token, user.getUsername(), user.getEmail()));
    }
}

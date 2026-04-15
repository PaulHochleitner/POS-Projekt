package com.tactics.simulator.controller;

import com.tactics.simulator.service.TunnelService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Exposes the auto-generated cloudflared tunnel URL so the frontend share-button
 * can build shareable links that work from outside the LAN.
 */
@RestController
@RequestMapping("/api/share")
@RequiredArgsConstructor
public class TunnelController {

    private final TunnelService tunnelService;

    @GetMapping("/tunnel-url")
    public ResponseEntity<Map<String, String>> getTunnelUrl() {
        String url = tunnelService.getTunnelUrl();
        if (url == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(Map.of("url", url));
    }
}

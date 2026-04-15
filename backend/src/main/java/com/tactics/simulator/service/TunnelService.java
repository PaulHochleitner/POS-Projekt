package com.tactics.simulator.service;

import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Spawns cloudflared on application startup so the running instance is reachable
 * from outside the LAN via a public https://*.trycloudflare.com URL. No separate
 * terminal needed — Paul just runs `./mvnw -Pfullstack spring-boot:run` and a
 * shareable link is printed to the console and exposed at /api/share/tunnel-url.
 *
 * Requires `cloudflared` to be on PATH. If it isn't, the service logs a warning
 * and the app keeps running normally (share-links just fall back to localhost).
 *
 * Disable via `app.tunnel.enabled: false` in application.yml.
 */
@Service
@Slf4j
public class TunnelService {

    private static final Pattern TUNNEL_URL = Pattern.compile("https://[a-z0-9-]+\\.trycloudflare\\.com");

    @Value("${app.tunnel.enabled:true}")
    private boolean enabled;

    @Value("${server.port:8080}")
    private int serverPort;

    private volatile String tunnelUrl;
    private Process process;
    private Thread readerThread;

    public String getTunnelUrl() {
        return tunnelUrl;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void start() {
        if (!enabled) {
            log.info("Tunnel disabled (app.tunnel.enabled=false)");
            return;
        }
        String target = "http://localhost:" + serverPort;
        try {
            ProcessBuilder pb = new ProcessBuilder("cloudflared", "tunnel", "--url", target);
            pb.redirectErrorStream(true);
            process = pb.start();
            log.info("Starting cloudflared tunnel for {} (pid={})", target, process.pid());
        } catch (IOException e) {
            log.warn("Could not start cloudflared (is it installed? `winget install --id Cloudflare.cloudflared`). Share-links will fall back to localhost. Cause: {}", e.getMessage());
            return;
        }

        readerThread = new Thread(this::readOutput, "cloudflared-reader");
        readerThread.setDaemon(true);
        readerThread.start();
    }

    private void readOutput() {
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                // cloudflared prints the URL once on startup, we capture and hold it.
                if (tunnelUrl == null) {
                    Matcher m = TUNNEL_URL.matcher(line);
                    if (m.find()) {
                        tunnelUrl = m.group();
                        log.info("");
                        log.info("================================================================");
                        log.info("  PUBLIC SHARE URL READY:  {}", tunnelUrl);
                        log.info("  --> Open THIS URL in your browser (not localhost!) so that");
                        log.info("      the share-button produces links your friends can open.");
                        log.info("================================================================");
                        log.info("");
                    }
                }
                log.debug("[cloudflared] {}", line);
            }
        } catch (IOException e) {
            log.debug("cloudflared reader ended: {}", e.getMessage());
        }
    }

    @PreDestroy
    public void stop() {
        if (process != null && process.isAlive()) {
            log.info("Stopping cloudflared tunnel (pid={})", process.pid());
            process.destroy();
            try {
                if (!process.waitFor(3, java.util.concurrent.TimeUnit.SECONDS)) {
                    process.destroyForcibly();
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                process.destroyForcibly();
            }
        }
    }
}

package com.tactics.simulator.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tactics.simulator.dto.FrameData;
import com.tactics.simulator.exception.ResourceNotFoundException;
import com.tactics.simulator.model.TacticVersion;
import com.tactics.simulator.repository.TacticVersionRepository;
import com.madgag.gif.fmsware.AnimatedGifEncoder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.awt.geom.Ellipse2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GifExportService {

    private static final int WIDTH = 800;
    private static final int HEIGHT = 520;
    private static final int INTERPOLATION_STEPS = 20;
    private static final int PLAYER_RADIUS = 15;
    private static final Color PITCH_COLOR = new Color(45, 138, 78);
    private static final Color LINE_COLOR = Color.WHITE;
    private static final Color BALL_COLOR = Color.WHITE;
    private static final Color HOME_BODY = new Color(30, 58, 95);   // #1e3a5f
    private static final Color AWAY_BODY = new Color(220, 38, 38);  // #dc2626

    private final TacticVersionRepository versionRepository;
    private final ObjectMapper objectMapper;

    public byte[] exportGif(Long tacticId, Long versionId) {
        TacticVersion version = versionRepository.findById(versionId)
                .orElseThrow(() -> new ResourceNotFoundException("TacticVersion", versionId));

        if (!version.getTactic().getId().equals(tacticId)) {
            throw new ResourceNotFoundException("TacticVersion", versionId);
        }

        FrameData frameData;
        try {
            frameData = objectMapper.readValue(version.getFrames(), FrameData.class);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Invalid frame data in version " + versionId, e);
        }

        return renderGif(frameData);
    }

    private byte[] renderGif(FrameData frameData) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        AnimatedGifEncoder encoder = new AnimatedGifEncoder();
        encoder.start(baos);
        encoder.setRepeat(0);
        encoder.setDelay(50);
        encoder.setQuality(10);

        List<FrameData.Frame> frames = frameData.frames();
        for (int i = 0; i < frames.size() - 1; i++) {
            FrameData.Frame from = frames.get(i);
            FrameData.Frame to = frames.get(i + 1);

            for (int step = 0; step < INTERPOLATION_STEPS; step++) {
                double t = (double) step / INTERPOLATION_STEPS;
                BufferedImage image = renderInterpolatedFrame(from, to, t);
                encoder.addFrame(image);
            }
        }

        // Render the last keyframe
        if (!frames.isEmpty()) {
            BufferedImage lastFrame = renderInterpolatedFrame(
                    frames.get(frames.size() - 1), frames.get(frames.size() - 1), 0);
            for (int i = 0; i < 10; i++) {
                encoder.addFrame(lastFrame);
            }
        }

        encoder.finish();
        return baos.toByteArray();
    }

    private BufferedImage renderInterpolatedFrame(FrameData.Frame from, FrameData.Frame to, double t) {
        BufferedImage image = new BufferedImage(WIDTH, HEIGHT, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        drawPitch(g);

        // Home team
        if (from.players() != null && !from.players().isEmpty()) {
            List<FrameData.PlayerPosition> toHome = (to.players() != null && !to.players().isEmpty())
                    ? to.players() : from.players();
            drawRoster(g, from.players(), toHome, t, HOME_BODY);
        }

        // Away team (opponents) — may be null for very old saved frames
        if (from.opponents() != null && !from.opponents().isEmpty()) {
            List<FrameData.PlayerPosition> toAway = (to.opponents() != null && !to.opponents().isEmpty())
                    ? to.opponents() : from.opponents();
            drawRoster(g, from.opponents(), toAway, t, AWAY_BODY);
        }

        drawBall(g, from.ball(), to.ball(), t);

        g.dispose();
        return image;
    }

    private void drawPitch(Graphics2D g) {
        g.setColor(PITCH_COLOR);
        g.fillRect(0, 0, WIDTH, HEIGHT);

        g.setColor(LINE_COLOR);
        g.setStroke(new BasicStroke(2));

        int margin = 30;
        int pw = WIDTH - 2 * margin;
        int ph = HEIGHT - 2 * margin;

        // Pitch outline
        g.drawRect(margin, margin, pw, ph);

        // Center line
        g.drawLine(WIDTH / 2, margin, WIDTH / 2, HEIGHT - margin);

        // Center circle
        int circleR = 50;
        g.drawOval(WIDTH / 2 - circleR, HEIGHT / 2 - circleR, circleR * 2, circleR * 2);

        // Center spot
        g.fillOval(WIDTH / 2 - 3, HEIGHT / 2 - 3, 6, 6);

        // Left penalty area
        int paW = 120;
        int paH = 240;
        g.drawRect(margin, HEIGHT / 2 - paH / 2, paW, paH);

        // Right penalty area
        g.drawRect(WIDTH - margin - paW, HEIGHT / 2 - paH / 2, paW, paH);

        // Left goal area
        int gaW = 40;
        int gaH = 120;
        g.drawRect(margin, HEIGHT / 2 - gaH / 2, gaW, gaH);

        // Right goal area
        g.drawRect(WIDTH - margin - gaW, HEIGHT / 2 - gaH / 2, gaW, gaH);
    }

    private void drawRoster(Graphics2D g,
                            List<FrameData.PlayerPosition> fromRoster,
                            List<FrameData.PlayerPosition> toRoster,
                            double t,
                            Color bodyColor) {
        for (int i = 0; i < fromRoster.size(); i++) {
            FrameData.PlayerPosition pFrom = fromRoster.get(i);
            FrameData.PlayerPosition pTo = (i < toRoster.size()) ? toRoster.get(i) : pFrom;

            double x = lerp(pFrom.x(), pTo.x(), t);
            double y = lerp(pFrom.y(), pTo.y(), t);

            int px = (int) (30 + x / 100.0 * (WIDTH - 60));
            int py = (int) (30 + y / 100.0 * (HEIGHT - 60));

            // Position-based border color
            Color borderColor = getPositionColor(pFrom.position());

            // Player circle with border
            g.setColor(borderColor);
            g.fill(new Ellipse2D.Double(px - PLAYER_RADIUS - 2, py - PLAYER_RADIUS - 2,
                    (PLAYER_RADIUS + 2) * 2, (PLAYER_RADIUS + 2) * 2));

            g.setColor(bodyColor);
            g.fill(new Ellipse2D.Double(px - PLAYER_RADIUS, py - PLAYER_RADIUS,
                    PLAYER_RADIUS * 2, PLAYER_RADIUS * 2));

            // Jersey number
            g.setColor(Color.WHITE);
            g.setFont(new Font("Arial", Font.BOLD, 12));
            String num = String.valueOf(pFrom.playerNumber());
            FontMetrics fm = g.getFontMetrics();
            g.drawString(num, px - fm.stringWidth(num) / 2, py + fm.getAscent() / 2 - 1);

            // Player name — only if actually set (skip empty defaults and sticky leftovers)
            String name = pFrom.playerName();
            if (name != null && !name.isBlank()) {
                g.setFont(new Font("Arial", Font.PLAIN, 9));
                fm = g.getFontMetrics();
                if (name.length() > 14) name = name.substring(0, 14);
                g.drawString(name, px - fm.stringWidth(name) / 2, py + PLAYER_RADIUS + 12);
            }
        }
    }

    private void drawBall(Graphics2D g, FrameData.BallPosition from, FrameData.BallPosition to, double t) {
        double x = lerp(from.x(), to.x(), t);
        double y = lerp(from.y(), to.y(), t);

        int bx = (int) (30 + x / 100.0 * (WIDTH - 60));
        int by = (int) (30 + y / 100.0 * (HEIGHT - 60));

        g.setColor(Color.BLACK);
        g.fillOval(bx - 7, by - 7, 14, 14);
        g.setColor(BALL_COLOR);
        g.fillOval(bx - 5, by - 5, 10, 10);
    }

    private Color getPositionColor(String position) {
        if ("GK".equals(position)) return new Color(234, 179, 8);
        if (List.of("CB", "LB", "RB").contains(position)) return new Color(59, 130, 246);
        if (List.of("CDM", "CM", "CAM", "LM", "RM").contains(position)) return new Color(34, 197, 94);
        return new Color(239, 68, 68);
    }

    private double lerp(double a, double b, double t) {
        return a + (b - a) * t;
    }
}

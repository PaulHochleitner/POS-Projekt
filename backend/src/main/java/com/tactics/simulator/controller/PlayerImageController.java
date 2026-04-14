package com.tactics.simulator.controller;

import com.tactics.simulator.dto.PlayerDto;
import com.tactics.simulator.exception.ResourceNotFoundException;
import com.tactics.simulator.model.Player;
import com.tactics.simulator.repository.PlayerRepository;
import com.tactics.simulator.service.PlayerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/players")
@RequiredArgsConstructor
public class PlayerImageController {

    private static final Path UPLOAD_DIR = Paths.get("./uploads/players");
    private static final long MAX_FILE_SIZE = 2 * 1024 * 1024;
    private static final Set<String> ALLOWED_TYPES = Set.of(
            MediaType.IMAGE_JPEG_VALUE, MediaType.IMAGE_PNG_VALUE);

    private final PlayerRepository playerRepository;
    private final PlayerService playerService;

    @PostMapping("/{id}/image")
    public PlayerDto uploadImage(@PathVariable Long id, @RequestParam("file") MultipartFile file) throws IOException {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Player", id));

        if (file.isEmpty()) {
            throw new IllegalArgumentException("Datei darf nicht leer sein");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Maximale Dateigröße: 2MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Nur JPG/PNG Dateien erlaubt");
        }

        Files.createDirectories(UPLOAD_DIR);

        String ext = contentType.equals(MediaType.IMAGE_PNG_VALUE) ? ".png" : ".jpg";
        String filename = UUID.randomUUID() + ext;
        Path target = UPLOAD_DIR.resolve(filename);
        file.transferTo(target.toFile());

        // Delete old image if exists
        if (player.getImageUrl() != null) {
            String oldFilename = player.getImageUrl().substring(player.getImageUrl().lastIndexOf('/') + 1);
            Path oldFile = UPLOAD_DIR.resolve(oldFilename);
            Files.deleteIfExists(oldFile);
        }

        player.setImageUrl("/api/uploads/players/" + filename);
        playerRepository.save(player);

        return playerService.toDto(player);
    }
}

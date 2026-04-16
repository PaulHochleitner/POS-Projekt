package com.tactics.simulator.controller;

import com.tactics.simulator.service.GifExportService;
import com.tactics.simulator.service.TacticService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class ExportController {

    private final GifExportService gifExportService;
    private final TacticService tacticService;

    @PostMapping("/api/tactics/{tacticId}/versions/{versionId}/export/gif")
    public ResponseEntity<byte[]> exportGif(@PathVariable Long tacticId, @PathVariable Long versionId) {
        // Ownership check — throws 404 if tactic doesn't belong to current user
        tacticService.findById(tacticId);

        byte[] gif = gifExportService.exportGif(tacticId, versionId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=tactic-animation.gif")
                .contentType(MediaType.IMAGE_GIF)
                .body(gif);
    }
}

package com.pharmaassist.backend.controller;

import com.pharmaassist.backend.dto.ScanDtos.ScanResultResponse;
import com.pharmaassist.backend.service.ScanService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/scan")
public class ScanController {

    private final ScanService scanService;

    public ScanController(ScanService scanService) {
        this.scanService = scanService;
    }

    // Core Feature 1: AI Medicine Recognition (staff photographs a medicine)
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<ScanResultResponse> scan(@RequestParam("file") MultipartFile file,
                                                     Authentication authentication) throws IOException {
        String userEmail = authentication != null ? authentication.getName() : "anonymous";
        return ResponseEntity.ok(scanService.scanMedicine(file, userEmail));
    }
}

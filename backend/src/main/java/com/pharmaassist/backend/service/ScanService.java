package com.pharmaassist.backend.service;

import com.pharmaassist.backend.dto.ScanDtos.*;
import com.pharmaassist.backend.entity.Medicine;
import com.pharmaassist.backend.entity.ScanHistory;
import com.pharmaassist.backend.entity.User;
import com.pharmaassist.backend.repository.MedicineRepository;
import com.pharmaassist.backend.repository.ScanHistoryRepository;
import com.pharmaassist.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

@Service
public class ScanService {

    private final AiRecognitionClient aiRecognitionClient;
    private final MedicineRepository medicineRepository;
    private final ScanHistoryRepository scanHistoryRepository;
    private final UserRepository userRepository;

    @Value("${app.upload.dir}")
    private String uploadDir;

    public ScanService(AiRecognitionClient aiRecognitionClient,
                        MedicineRepository medicineRepository,
                        ScanHistoryRepository scanHistoryRepository,
                        UserRepository userRepository) {
        this.aiRecognitionClient = aiRecognitionClient;
        this.medicineRepository = medicineRepository;
        this.scanHistoryRepository = scanHistoryRepository;
        this.userRepository = userRepository;
    }

    public ScanResultResponse scanMedicine(MultipartFile file, String userEmail) throws IOException {
        // 1. Save uploaded image
        Files.createDirectories(Path.of(uploadDir));
        String filename = UUID.randomUUID() + "-" + file.getOriginalFilename();
        File saved = new File(uploadDir, filename);
        file.transferTo(saved);

        // 2. Call AI microservice for recognition
        AiRecognitionResponse aiResult = aiRecognitionClient.recognize(saved);

        // 3. Match against our verified medicine database (never trust the AI's
        //    name as fact by itself — always resolve through the DB record)
        List<Medicine> matches = medicineRepository.findByNameContainingIgnoreCase(aiResult.medicineName());
        Medicine matched = matches.isEmpty() ? null : matches.get(0);

        // 4. Log the scan for audit + training-dashboard purposes
        User user = userRepository.findByEmail(userEmail).orElse(null);
        ScanHistory history = new ScanHistory();
        history.setUser(user);
        history.setMedicine(matched);
        history.setImagePath(saved.getPath());
        history.setConfidence(aiResult.confidence());
        scanHistoryRepository.save(history);

        if (matched == null) {
            return new ScanResultResponse(null, aiResult.medicineName(), null, null, aiResult.confidence(), false);
        }

        return new ScanResultResponse(
                matched.getId(), matched.getName(), matched.getGenericName(),
                matched.getCategory(), aiResult.confidence(), true);
    }
}

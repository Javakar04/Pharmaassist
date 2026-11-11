package com.pharmaassist.backend.dto;

import java.math.BigDecimal;

public class ScanDtos {

    // Response coming back from the Python AI service
    public record AiRecognitionResponse(String medicineName, BigDecimal confidence) {}

    // Response sent to the frontend after scan + DB lookup
    public record ScanResultResponse(
            Long medicineId,
            String name,
            String genericName,
            String category,
            BigDecimal confidence,
            boolean matchedInDatabase) {}
}

package com.pharmaassist.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class InventoryDtos {

    public record InventoryRequest(
            Long medicineId,
            String batchNumber,
            Integer quantity,
            BigDecimal mrp,
            BigDecimal salePrice,
            BigDecimal purchasePrice,
            String rack,
            String shelf,
            LocalDate expiryDate,
            String status
    ) {}

    public record InventoryUpdateRequest(
            String batchNumber,
            Integer quantity,
            BigDecimal mrp,
            BigDecimal salePrice,
            BigDecimal purchasePrice,
            String rack,
            String shelf,
            LocalDate expiryDate,
            String status
    ) {}

    public record InventoryResponse(
            Long id,
            Long medicineId,
            String medicineName,
            String genericName,
            String category,
            String batchNumber,
            Integer quantity,
            BigDecimal mrp,
            BigDecimal salePrice,
            BigDecimal purchasePrice,
            String rack,
            String shelf,
            LocalDate expiryDate,
            String status
    ) {}

    public record StockLocationResponse(
            Long medicineId,
            String medicineName,
            boolean available,
            int quantity,
            String rack,
            String shelf,
            LocalDate expiryDate
    ) {}
}

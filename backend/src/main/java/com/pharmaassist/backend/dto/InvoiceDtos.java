package com.pharmaassist.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class InvoiceDtos {

    public record CreateInvoiceItemRequest(
            Long medicineId,
            Long inventoryId,
            Integer quantity,
            BigDecimal unitPrice
    ) {}

    public record CreateInvoiceRequest(
            String customerName,
            String customerPhone,
            String doctorName,
            String prescriptionRef,
            String paymentMethod,
            BigDecimal discountPercentage,
            BigDecimal taxPercentage,
            List<CreateInvoiceItemRequest> items
    ) {}

    public record InvoiceItemResponse(
            Long id,
            Long medicineId,
            String medicineName,
            Long inventoryId,
            String batchNumber,
            Integer quantity,
            BigDecimal unitPrice,
            BigDecimal totalPrice
    ) {}

    public record InvoiceResponse(
            Long id,
            String invoiceNumber,
            String customerName,
            String customerPhone,
            Long cashierId,
            String cashierName,
            String doctorName,
            String prescriptionRef,
            BigDecimal totalAmount,
            BigDecimal discountPercentage,
            BigDecimal discountAmount,
            BigDecimal taxPercentage,
            BigDecimal taxAmount,
            BigDecimal netPayable,
            String paymentMethod,
            String paymentStatus,
            LocalDateTime createdAt,
            List<InvoiceItemResponse> items
    ) {}

    public record SalesSummaryResponse(
            BigDecimal todaySalesAmount,
            long todayInvoiceCount,
            BigDecimal totalRevenue,
            long totalInvoices,
            long lowStockCount,
            long totalMedicines
    ) {}
}

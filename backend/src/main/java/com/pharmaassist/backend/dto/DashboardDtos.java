package com.pharmaassist.backend.dto;

import java.math.BigDecimal;

public class DashboardDtos {

    public record DashboardStats(
            long totalMedicines,
            long lowStock,
            long expiringSoon,
            long expired,
            BigDecimal todaySales,
            long todayInvoicesCount,
            BigDecimal totalRevenue,
            long totalInvoices
    ) {}
}

package com.pharmaassist.backend.service;

import com.pharmaassist.backend.dto.DashboardDtos.DashboardStats;
import com.pharmaassist.backend.repository.InventoryRepository;
import com.pharmaassist.backend.repository.InvoiceRepository;
import com.pharmaassist.backend.repository.MedicineRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
public class DashboardService {

    private final MedicineRepository medicineRepository;
    private final InventoryRepository inventoryRepository;
    private final InvoiceRepository invoiceRepository;

    public DashboardService(MedicineRepository medicineRepository,
                            InventoryRepository inventoryRepository,
                            InvoiceRepository invoiceRepository) {
        this.medicineRepository = medicineRepository;
        this.inventoryRepository = inventoryRepository;
        this.invoiceRepository = invoiceRepository;
    }

    public DashboardStats getStats() {
        long total = medicineRepository.count();
        long lowStock = inventoryRepository.findByQuantityLessThan(10).size();
        long expiringSoon = inventoryRepository
                .findByExpiryDateBetween(LocalDate.now(), LocalDate.now().plusDays(30)).size();
        long expired = inventoryRepository.findByExpiryDateBefore(LocalDate.now()).size();

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        BigDecimal todaySales = invoiceRepository.sumTodaySales(startOfDay);
        long todayCount = invoiceRepository.countTodayInvoices(startOfDay);
        BigDecimal totalRev = invoiceRepository.sumTotalSales();
        long totalInvs = invoiceRepository.count();

        return new DashboardStats(
                total,
                lowStock,
                expiringSoon,
                expired,
                todaySales != null ? todaySales : BigDecimal.ZERO,
                todayCount,
                totalRev != null ? totalRev : BigDecimal.ZERO,
                totalInvs
        );
    }
}

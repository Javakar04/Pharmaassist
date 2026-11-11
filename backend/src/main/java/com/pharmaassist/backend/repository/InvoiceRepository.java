package com.pharmaassist.backend.repository;

import com.pharmaassist.backend.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    List<Invoice> findAllByOrderByCreatedAtDesc();

    List<Invoice> findByCashierIdOrderByCreatedAtDesc(Long cashierId);

    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.createdAt >= :startOfDay")
    long countTodayInvoices(@Param("startOfDay") LocalDateTime startOfDay);

    @Query("SELECT COALESCE(SUM(i.netPayable), 0) FROM Invoice i WHERE i.createdAt >= :startOfDay AND i.paymentStatus = 'PAID'")
    BigDecimal sumTodaySales(@Param("startOfDay") LocalDateTime startOfDay);

    @Query("SELECT COALESCE(SUM(i.netPayable), 0) FROM Invoice i WHERE i.paymentStatus = 'PAID'")
    BigDecimal sumTotalSales();
}

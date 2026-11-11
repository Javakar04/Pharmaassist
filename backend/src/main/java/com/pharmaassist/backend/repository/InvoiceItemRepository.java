package com.pharmaassist.backend.repository;

import com.pharmaassist.backend.entity.InvoiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InvoiceItemRepository extends JpaRepository<InvoiceItem, Long> {
    List<InvoiceItem> findByInvoiceId(Long invoiceId);
    boolean existsByInventoryId(Long inventoryId);
}

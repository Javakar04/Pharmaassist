package com.pharmaassist.backend.service;

import com.pharmaassist.backend.dto.InventoryDtos.*;
import com.pharmaassist.backend.entity.Inventory;
import com.pharmaassist.backend.entity.Medicine;
import com.pharmaassist.backend.repository.InventoryRepository;
import com.pharmaassist.backend.repository.InvoiceItemRepository;
import com.pharmaassist.backend.repository.MedicineRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final MedicineRepository medicineRepository;
    private final InvoiceItemRepository invoiceItemRepository;

    public InventoryService(InventoryRepository inventoryRepository,
                            MedicineRepository medicineRepository,
                            InvoiceItemRepository invoiceItemRepository) {
        this.inventoryRepository = inventoryRepository;
        this.medicineRepository = medicineRepository;
        this.invoiceItemRepository = invoiceItemRepository;
    }

    public List<InventoryResponse> getAll() {
        return inventoryRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public InventoryResponse getById(Long id) {
        Inventory inv = inventoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Inventory item not found: " + id));
        return mapToResponse(inv);
    }

    public List<InventoryResponse> getAvailableBatches(Long medicineId) {
        return inventoryRepository.findAvailableByMedicineIdFefo(medicineId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Core Feature 3/4: "Where is this medicine?"
    public StockLocationResponse getLocation(Long medicineId) {
        Medicine medicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new IllegalArgumentException("Medicine not found: " + medicineId));

        List<Inventory> entries = inventoryRepository.findByMedicineId(medicineId);

        if (entries.isEmpty()) {
            return new StockLocationResponse(medicineId, medicine.getName(), false, 0, null, null, null);
        }

        Inventory best = entries.stream()
                .max((a, b) -> Integer.compare(a.getQuantity(), b.getQuantity()))
                .orElse(entries.get(0));

        int totalQty = entries.stream().mapToInt(Inventory::getQuantity).sum();

        return new StockLocationResponse(
                medicineId, medicine.getName(), totalQty > 0, totalQty,
                best.getRack(), best.getShelf(), best.getExpiryDate());
    }

    public List<InventoryResponse> lowStock(int threshold) {
        return inventoryRepository.findByQuantityLessThan(threshold).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<InventoryResponse> expiringSoon(int days) {
        return inventoryRepository.findByExpiryDateBetween(LocalDate.now(), LocalDate.now().plusDays(days)).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<InventoryResponse> expired() {
        return inventoryRepository.findByExpiryDateBefore(LocalDate.now()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public InventoryResponse create(InventoryRequest req) {
        Medicine medicine = medicineRepository.findById(req.medicineId())
                .orElseThrow(() -> new IllegalArgumentException("Medicine not found: " + req.medicineId()));

        Inventory inv = new Inventory();
        inv.setMedicine(medicine);
        inv.setBatchNumber(req.batchNumber() != null ? req.batchNumber().trim().toUpperCase() : "BATCH-" + System.currentTimeMillis());
        inv.setQuantity(req.quantity() != null ? Math.max(0, req.quantity()) : 0);
        inv.setMrp(req.mrp() != null ? req.mrp() : BigDecimal.ZERO);
        inv.setSalePrice(req.salePrice() != null ? req.salePrice() : (req.mrp() != null ? req.mrp() : BigDecimal.ZERO));
        inv.setPurchasePrice(req.purchasePrice() != null ? req.purchasePrice() : BigDecimal.ZERO);
        inv.setRack(req.rack());
        inv.setShelf(req.shelf());
        inv.setExpiryDate(req.expiryDate());
        inv.setStatus(req.status() != null ? req.status() : (inv.getQuantity() <= 10 ? "LOW_STOCK" : "AVAILABLE"));

        Inventory saved = inventoryRepository.save(inv);
        return mapToResponse(saved);
    }

    @Transactional
    public InventoryResponse update(Long id, InventoryUpdateRequest req) {
        Inventory inv = inventoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Inventory item not found: " + id));

        if (req.batchNumber() != null) inv.setBatchNumber(req.batchNumber().trim().toUpperCase());
        if (req.quantity() != null) {
            inv.setQuantity(Math.max(0, req.quantity()));
            if (inv.getQuantity() == 0) {
                inv.setStatus("OUT_OF_STOCK");
            } else if (inv.getQuantity() <= 10 && !"QUARANTINED".equals(inv.getStatus())) {
                inv.setStatus("LOW_STOCK");
            } else if (!"QUARANTINED".equals(inv.getStatus())) {
                inv.setStatus("AVAILABLE");
            }
        }
        if (req.mrp() != null) inv.setMrp(req.mrp());
        if (req.salePrice() != null) inv.setSalePrice(req.salePrice());
        if (req.purchasePrice() != null) inv.setPurchasePrice(req.purchasePrice());
        if (req.rack() != null) inv.setRack(req.rack());
        if (req.shelf() != null) inv.setShelf(req.shelf());
        if (req.expiryDate() != null) inv.setExpiryDate(req.expiryDate());
        if (req.status() != null) inv.setStatus(req.status());

        Inventory updated = inventoryRepository.save(inv);
        return mapToResponse(updated);
    }

    @Transactional
    public boolean deleteOrQuarantine(Long id) {
        Inventory inv = inventoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Inventory item not found: " + id));

        // Real-world check: If this batch has been invoiced in sales history,
        // we MUST NOT physically delete it (referential integrity + accounting audit trail).
        // Instead, we safely quarantine it and set quantity to 0.
        boolean hasSales = invoiceItemRepository.existsByInventoryId(id);
        if (hasSales) {
            inv.setStatus("QUARANTINED");
            inv.setQuantity(0);
            inventoryRepository.save(inv);
            return false; // Safely quarantined instead of hard-deleted
        } else {
            inventoryRepository.delete(inv);
            return true; // Hard deleted
        }
    }

    private InventoryResponse mapToResponse(Inventory inv) {
        return new InventoryResponse(
                inv.getId(),
                inv.getMedicine() != null ? inv.getMedicine().getId() : null,
                inv.getMedicine() != null ? inv.getMedicine().getName() : "Unknown",
                inv.getMedicine() != null ? inv.getMedicine().getGenericName() : "",
                inv.getMedicine() != null ? inv.getMedicine().getCategory() : "",
                inv.getBatchNumber(),
                inv.getQuantity(),
                inv.getMrp(),
                inv.getSalePrice(),
                inv.getPurchasePrice(),
                inv.getRack(),
                inv.getShelf(),
                inv.getExpiryDate(),
                inv.getStatus()
        );
    }
}

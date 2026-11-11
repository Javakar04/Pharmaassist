package com.pharmaassist.backend.controller;

import com.pharmaassist.backend.dto.InventoryDtos.*;
import com.pharmaassist.backend.service.InventoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping
    public List<InventoryResponse> getAll() {
        return inventoryService.getAll();
    }

    @GetMapping("/{id}")
    public InventoryResponse getById(@PathVariable Long id) {
        return inventoryService.getById(id);
    }

    @GetMapping("/medicine/{medicineId}/batches")
    public List<InventoryResponse> getAvailableBatches(@PathVariable Long medicineId) {
        return inventoryService.getAvailableBatches(medicineId);
    }

    // Core Feature 3/4: "Where is this medicine?"
    @GetMapping("/medicine/{medicineId}/location")
    public StockLocationResponse getLocation(@PathVariable Long medicineId) {
        return inventoryService.getLocation(medicineId);
    }

    @GetMapping("/low-stock")
    public List<InventoryResponse> lowStock(@RequestParam(defaultValue = "10") int threshold) {
        return inventoryService.lowStock(threshold);
    }

    @GetMapping("/expiring-soon")
    public List<InventoryResponse> expiringSoon(@RequestParam(defaultValue = "30") int days) {
        return inventoryService.expiringSoon(days);
    }

    @GetMapping("/expired")
    public List<InventoryResponse> expired() {
        return inventoryService.expired();
    }

    @PostMapping
    public InventoryResponse create(@RequestBody InventoryRequest req) {
        return inventoryService.create(req);
    }

    @PutMapping("/{id}")
    public InventoryResponse update(@PathVariable Long id, @RequestBody InventoryUpdateRequest req) {
        return inventoryService.update(id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteOrQuarantine(@PathVariable Long id) {
        boolean hardDeleted = inventoryService.deleteOrQuarantine(id);
        if (hardDeleted) {
            return ResponseEntity.ok(Map.of("message", "Stock entry deleted successfully.", "action", "DELETED"));
        } else {
            return ResponseEntity.ok(Map.of("message", "Stock item has prior sales history; it was safely moved to QUARANTINED status to protect accounting integrity.", "action", "QUARANTINED"));
        }
    }
}

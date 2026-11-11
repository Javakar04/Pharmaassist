package com.pharmaassist.backend.controller;

import com.pharmaassist.backend.dto.MedicineDtos.MedicineRequest;
import com.pharmaassist.backend.entity.Medicine;
import com.pharmaassist.backend.entity.MedicineUse;
import com.pharmaassist.backend.service.MedicineService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medicines")
public class MedicineController {

    private final MedicineService medicineService;

    public MedicineController(MedicineService medicineService) {
        this.medicineService = medicineService;
    }

    @GetMapping
    public List<Medicine> search(@RequestParam(required = false) String q) {
        return medicineService.search(q);
    }

    @GetMapping("/{id}")
    public Medicine getOne(@PathVariable Long id) {
        return medicineService.getById(id);
    }

    @GetMapping("/{id}/uses")
    public List<MedicineUse> getUses(@PathVariable Long id) {
        return medicineService.getUses(id);
    }

    // Core Feature 6: Medicine Similarity / Brand Recognition
    @GetMapping("/{id}/similar")
    public List<Medicine> getSimilar(@PathVariable Long id) {
        return medicineService.findSameActiveIngredient(id);
    }

    @PostMapping
    public ResponseEntity<Medicine> create(@RequestBody MedicineRequest req) {
        return ResponseEntity.ok(medicineService.create(req));
    }

    @PutMapping("/{id}")
    public Medicine update(@PathVariable Long id, @RequestBody MedicineRequest req) {
        return medicineService.update(id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        medicineService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

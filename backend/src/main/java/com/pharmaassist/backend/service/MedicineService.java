package com.pharmaassist.backend.service;

import com.pharmaassist.backend.dto.MedicineDtos.*;
import com.pharmaassist.backend.entity.Medicine;
import com.pharmaassist.backend.entity.MedicineUse;
import com.pharmaassist.backend.repository.MedicineRepository;
import com.pharmaassist.backend.repository.MedicineUseRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MedicineService {

    private final MedicineRepository medicineRepository;
    private final MedicineUseRepository medicineUseRepository;

    public MedicineService(MedicineRepository medicineRepository, MedicineUseRepository medicineUseRepository) {
        this.medicineRepository = medicineRepository;
        this.medicineUseRepository = medicineUseRepository;
    }

    public List<Medicine> search(String query) {
        if (query == null || query.isBlank()) return medicineRepository.findAll();
        return medicineRepository.findByNameContainingIgnoreCase(query);
    }

    public Medicine getById(Long id) {
        return medicineRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Medicine not found: " + id));
    }

    public List<MedicineUse> getUses(Long medicineId) {
        return medicineUseRepository.findByMedicineId(medicineId);
    }

    // Same-active-ingredient lookup for "Medicine Similarity / Brand Recognition"
    public List<Medicine> findSameActiveIngredient(Long medicineId) {
        Medicine medicine = getById(medicineId);
        if (medicine.getActiveIngredient() == null) return List.of();
        return medicineRepository.findByActiveIngredientIgnoreCase(medicine.getActiveIngredient())
                .stream().filter(m -> !m.getId().equals(medicineId)).toList();
    }

    public Medicine create(MedicineRequest req) {
        Medicine m = new Medicine();
        apply(m, req);
        return medicineRepository.save(m);
    }

    public Medicine update(Long id, MedicineRequest req) {
        Medicine m = getById(id);
        apply(m, req);
        return medicineRepository.save(m);
    }

    public void delete(Long id) {
        medicineRepository.deleteById(id);
    }

    private void apply(Medicine m, MedicineRequest req) {
        m.setName(req.name());
        m.setGenericName(req.genericName());
        m.setActiveIngredient(req.activeIngredient());
        m.setStrength(req.strength());
        m.setDosageForm(req.dosageForm());
        m.setCategory(req.category());
        m.setManufacturer(req.manufacturer());
        m.setStorageInformation(req.storageInformation());
    }
}

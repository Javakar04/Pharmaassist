package com.pharmaassist.backend.repository;

import com.pharmaassist.backend.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MedicineRepository extends JpaRepository<Medicine, Long> {
    List<Medicine> findByNameContainingIgnoreCase(String name);
    List<Medicine> findByActiveIngredientIgnoreCase(String activeIngredient);
}

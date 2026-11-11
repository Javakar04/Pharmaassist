package com.pharmaassist.backend.repository;

import com.pharmaassist.backend.entity.MedicineUse;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MedicineUseRepository extends JpaRepository<MedicineUse, Long> {
    List<MedicineUse> findByMedicineId(Long medicineId);
}

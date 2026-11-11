package com.pharmaassist.backend.repository;

import com.pharmaassist.backend.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    List<Inventory> findAllByOrderByMedicineNameAsc();

    List<Inventory> findByMedicineId(Long medicineId);

    @Query("SELECT i FROM Inventory i WHERE i.medicine.id = :medicineId AND i.quantity > 0 AND (i.status IS NULL OR i.status != 'QUARANTINED') ORDER BY i.expiryDate ASC")
    List<Inventory> findAvailableByMedicineIdFefo(@Param("medicineId") Long medicineId);

    List<Inventory> findByQuantityLessThan(Integer threshold);

    List<Inventory> findByExpiryDateBetween(LocalDate start, LocalDate end);

    List<Inventory> findByExpiryDateBefore(LocalDate date);

    @Query("SELECT i FROM Inventory i WHERE i.status = :status")
    List<Inventory> findByStatus(@Param("status") String status);

    @Query("SELECT COUNT(i) FROM Inventory i WHERE i.quantity <= :threshold")
    long countLowStock(@Param("threshold") int threshold);
}

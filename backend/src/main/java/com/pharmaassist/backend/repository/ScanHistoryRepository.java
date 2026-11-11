package com.pharmaassist.backend.repository;

import com.pharmaassist.backend.entity.ScanHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ScanHistoryRepository extends JpaRepository<ScanHistory, Long> {
    List<ScanHistory> findByUserIdOrderByTimestampDesc(Long userId);
}

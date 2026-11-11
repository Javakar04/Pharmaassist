package com.pharmaassist.backend.repository;

import com.pharmaassist.backend.entity.PharmacyKnowledge;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PharmacyKnowledgeRepository extends JpaRepository<PharmacyKnowledge, Long> {
}

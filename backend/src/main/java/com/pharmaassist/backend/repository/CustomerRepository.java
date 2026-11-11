package com.pharmaassist.backend.repository;

import com.pharmaassist.backend.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByPhone(String phone);
    List<Customer> findByNameContainingIgnoreCaseOrPhoneContaining(String name, String phone);
}

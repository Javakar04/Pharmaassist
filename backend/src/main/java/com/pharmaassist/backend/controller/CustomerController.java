package com.pharmaassist.backend.controller;

import com.pharmaassist.backend.entity.Customer;
import com.pharmaassist.backend.repository.CustomerRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerRepository customerRepository;

    public CustomerController(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @GetMapping("/search")
    public Optional<Customer> findByPhone(@RequestParam String phone) {
        return customerRepository.findByPhone(phone.trim());
    }

    @GetMapping
    public List<Customer> getAll() {
        return customerRepository.findAll();
    }
}

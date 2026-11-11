package com.pharmaassist.backend.controller;

import com.pharmaassist.backend.dto.InvoiceDtos.*;
import com.pharmaassist.backend.service.InvoiceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @PostMapping
    public ResponseEntity<InvoiceResponse> createInvoice(@RequestBody CreateInvoiceRequest req,
                                                         Authentication authentication) {
        String cashierEmail = authentication != null ? authentication.getName() : "admin@pharmaassist.local";
        InvoiceResponse response = invoiceService.createInvoice(req, cashierEmail);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public List<InvoiceResponse> getAllInvoices() {
        return invoiceService.getAllInvoices();
    }

    @GetMapping("/my")
    public List<InvoiceResponse> getMyInvoices(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        return invoiceService.getInvoicesByCashier(email);
    }

    @GetMapping("/{id}")
    public InvoiceResponse getInvoiceById(@PathVariable Long id) {
        return invoiceService.getInvoiceById(id);
    }

    @GetMapping("/summary")
    public SalesSummaryResponse getSalesSummary() {
        return invoiceService.getSalesSummary();
    }
}

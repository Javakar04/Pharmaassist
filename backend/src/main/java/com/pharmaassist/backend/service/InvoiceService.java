package com.pharmaassist.backend.service;

import com.pharmaassist.backend.dto.InvoiceDtos.*;
import com.pharmaassist.backend.entity.*;
import com.pharmaassist.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final InventoryRepository inventoryRepository;
    private final MedicineRepository medicineRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;

    public InvoiceService(InvoiceRepository invoiceRepository,
                          InventoryRepository inventoryRepository,
                          MedicineRepository medicineRepository,
                          UserRepository userRepository,
                          CustomerRepository customerRepository) {
        this.invoiceRepository = invoiceRepository;
        this.inventoryRepository = inventoryRepository;
        this.medicineRepository = medicineRepository;
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
    }

    @Transactional
    public InvoiceResponse createInvoice(CreateInvoiceRequest req, String cashierEmail) {
        if (req.items() == null || req.items().isEmpty()) {
            throw new IllegalArgumentException("Cannot create an invoice with no items.");
        }

        User cashier = userRepository.findByEmail(cashierEmail).orElse(null);

        // 1. Process Customer record
        if (req.customerPhone() != null && !req.customerPhone().isBlank()) {
            Optional<Customer> existingCustomer = customerRepository.findByPhone(req.customerPhone().trim());
            if (existingCustomer.isEmpty()) {
                Customer newCust = new Customer();
                newCust.setName(req.customerName() != null ? req.customerName().trim() : "Walk-in Customer");
                newCust.setPhone(req.customerPhone().trim());
                customerRepository.save(newCust);
            }
        }

        // 2. Build Invoice Entity
        Invoice invoice = new Invoice();
        String datePrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randomSuffix = String.format("%04d", (int)(Math.random() * 9000) + 1000);
        invoice.setInvoiceNumber("INV-" + datePrefix + "-" + randomSuffix);

        invoice.setCustomerName(req.customerName() != null && !req.customerName().isBlank() ? req.customerName().trim() : "Walk-in Customer");
        invoice.setCustomerPhone(req.customerPhone() != null ? req.customerPhone().trim() : "N/A");
        invoice.setCashier(cashier);
        invoice.setCashierName(cashier != null ? cashier.getName() : "Pharmacist");
        invoice.setDoctorName(req.doctorName() != null ? req.doctorName().trim() : "Self / OTC");
        invoice.setPrescriptionRef(req.prescriptionRef() != null ? req.prescriptionRef().trim() : "");
        invoice.setCreatedAt(LocalDateTime.now());

        if (req.paymentMethod() != null) {
            try {
                invoice.setPaymentMethod(Invoice.PaymentMethod.valueOf(req.paymentMethod().toUpperCase()));
            } catch (Exception e) {
                invoice.setPaymentMethod(Invoice.PaymentMethod.CASH);
            }
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        List<InvoiceItem> invoiceItems = new ArrayList<>();

        // 3. Process each line item with STRICT QUANTITY CHECKING and ATOMIC DEDUCTION
        for (CreateInvoiceItemRequest itemReq : req.items()) {
            if (itemReq.quantity() == null || itemReq.quantity() <= 0) {
                throw new IllegalArgumentException("Quantity must be greater than zero.");
            }

            Inventory inventory = null;
            if (itemReq.inventoryId() != null) {
                inventory = inventoryRepository.findById(itemReq.inventoryId())
                        .orElseThrow(() -> new IllegalArgumentException("Selected batch not found: " + itemReq.inventoryId()));
            } else if (itemReq.medicineId() != null) {
                // If inventory ID not provided, pick the earliest expiring available batch (FEFO)
                List<Inventory> available = inventoryRepository.findAvailableByMedicineIdFefo(itemReq.medicineId());
                if (available.isEmpty()) {
                    Medicine med = medicineRepository.findById(itemReq.medicineId()).orElse(null);
                    String medName = med != null ? med.getName() : "ID #" + itemReq.medicineId();
                    throw new IllegalArgumentException("Out of stock: No available batch for " + medName);
                }
                inventory = available.get(0);
            } else {
                throw new IllegalArgumentException("Medicine or inventory batch must be specified.");
            }

            Medicine medicine = inventory.getMedicine();

            // REAL-WORLD QUANTITY CHECKING: Prevent overselling!
            if (inventory.getQuantity() < itemReq.quantity()) {
                throw new IllegalArgumentException("Insufficient stock for " + medicine.getName()
                        + " (Batch: " + inventory.getBatchNumber() + "). Available: "
                        + inventory.getQuantity() + ", Requested: " + itemReq.quantity());
            }

            // Deduct stock from the batch
            int remainingQty = inventory.getQuantity() - itemReq.quantity();
            inventory.setQuantity(remainingQty);
            if (remainingQty == 0) {
                inventory.setStatus("OUT_OF_STOCK");
            } else if (remainingQty <= 10) {
                inventory.setStatus("LOW_STOCK");
            }
            inventoryRepository.save(inventory);

            // Calculate item price
            BigDecimal unitPrice = itemReq.unitPrice() != null && itemReq.unitPrice().compareTo(BigDecimal.ZERO) > 0
                    ? itemReq.unitPrice()
                    : (inventory.getSalePrice() != null && inventory.getSalePrice().compareTo(BigDecimal.ZERO) > 0
                        ? inventory.getSalePrice() : inventory.getMrp());

            BigDecimal itemTotal = unitPrice.multiply(BigDecimal.valueOf(itemReq.quantity()));
            subtotal = subtotal.add(itemTotal);

            InvoiceItem lineItem = new InvoiceItem();
            lineItem.setInvoice(invoice);
            lineItem.setMedicine(medicine);
            lineItem.setMedicineName(medicine.getName());
            lineItem.setInventory(inventory);
            lineItem.setBatchNumber(inventory.getBatchNumber());
            lineItem.setQuantity(itemReq.quantity());
            lineItem.setUnitPrice(unitPrice);
            lineItem.setTotalPrice(itemTotal);

            invoiceItems.add(lineItem);
        }

        invoice.setItems(invoiceItems);
        invoice.setTotalAmount(subtotal.setScale(2, RoundingMode.HALF_UP));

        // 4. Discounts & Taxes calculation
        BigDecimal discPct = req.discountPercentage() != null ? req.discountPercentage() : BigDecimal.ZERO;
        BigDecimal discAmount = subtotal.multiply(discPct).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        invoice.setDiscountPercentage(discPct);
        invoice.setDiscountAmount(discAmount);

        BigDecimal taxableAmount = subtotal.subtract(discAmount);

        BigDecimal taxPct = req.taxPercentage() != null ? req.taxPercentage() : BigDecimal.ZERO;
        BigDecimal taxAmount = taxableAmount.multiply(taxPct).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        invoice.setTaxPercentage(taxPct);
        invoice.setTaxAmount(taxAmount);

        BigDecimal netPayable = taxableAmount.add(taxAmount).setScale(2, RoundingMode.HALF_UP);
        invoice.setNetPayable(netPayable);

        Invoice saved = invoiceRepository.save(invoice);
        return mapToResponse(saved);
    }

    public List<InvoiceResponse> getAllInvoices() {
        return invoiceRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<InvoiceResponse> getInvoicesByCashier(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return List.of();
        return invoiceRepository.findByCashierIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public InvoiceResponse getInvoiceById(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found: " + id));
        return mapToResponse(invoice);
    }

    public SalesSummaryResponse getSalesSummary() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        BigDecimal todaySales = invoiceRepository.sumTodaySales(startOfDay);
        long todayCount = invoiceRepository.countTodayInvoices(startOfDay);
        BigDecimal totalRev = invoiceRepository.sumTotalSales();
        long totalInvs = invoiceRepository.count();
        long lowStock = inventoryRepository.countLowStock(10);
        long totalMeds = medicineRepository.count();

        return new SalesSummaryResponse(
                todaySales != null ? todaySales : BigDecimal.ZERO,
                todayCount,
                totalRev != null ? totalRev : BigDecimal.ZERO,
                totalInvs,
                lowStock,
                totalMeds
        );
    }

    private InvoiceResponse mapToResponse(Invoice inv) {
        List<InvoiceItemResponse> itemResponses = inv.getItems().stream()
                .map(i -> new InvoiceItemResponse(
                        i.getId(),
                        i.getMedicine() != null ? i.getMedicine().getId() : null,
                        i.getMedicineName(),
                        i.getInventory() != null ? i.getInventory().getId() : null,
                        i.getBatchNumber(),
                        i.getQuantity(),
                        i.getUnitPrice(),
                        i.getTotalPrice()
                )).collect(Collectors.toList());

        return new InvoiceResponse(
                inv.getId(),
                inv.getInvoiceNumber(),
                inv.getCustomerName(),
                inv.getCustomerPhone(),
                inv.getCashier() != null ? inv.getCashier().getId() : null,
                inv.getCashierName(),
                inv.getDoctorName(),
                inv.getPrescriptionRef(),
                inv.getTotalAmount(),
                inv.getDiscountPercentage(),
                inv.getDiscountAmount(),
                inv.getTaxPercentage(),
                inv.getTaxAmount(),
                inv.getNetPayable(),
                inv.getPaymentMethod().name(),
                inv.getPaymentStatus().name(),
                inv.getCreatedAt(),
                itemResponses
        );
    }
}

-- PharmaAssist AI - MySQL Schema (Real-World Pharmacy Ready)
-- Run: mysql -u root -p < database/schema.sql

CREATE DATABASE IF NOT EXISTS pharmaassist;
USE pharmaassist;

-- ==========================================================
-- USERS & ROLES
-- ==========================================================
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,       -- BCrypt hash
    role ENUM('ADMIN', 'SENIOR_PHARMACIST', 'JUNIOR_PHARMACIST') NOT NULL DEFAULT 'JUNIOR_PHARMACIST',
    joined_date DATE NOT NULL DEFAULT (CURRENT_DATE)
);

-- ==========================================================
-- MEDICINES
-- ==========================================================
CREATE TABLE IF NOT EXISTS medicines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    generic_name VARCHAR(160),
    active_ingredient VARCHAR(160),
    strength VARCHAR(60),
    dosage_form VARCHAR(60),
    category VARCHAR(100),
    manufacturer VARCHAR(160),
    storage_information TEXT,
    INDEX idx_medicine_name (name),
    INDEX idx_active_ingredient (active_ingredient)
);

CREATE TABLE IF NOT EXISTS medicine_uses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    medicine_id BIGINT NOT NULL,
    use_category VARCHAR(120),
    description TEXT,
    source VARCHAR(200),
    verified_by BIGINT,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ==========================================================
-- INVENTORY (stock + rack/shelf location + pricing + status)
-- ==========================================================
CREATE TABLE IF NOT EXISTS inventory (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    medicine_id BIGINT NOT NULL,
    batch_number VARCHAR(80) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    mrp DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    sale_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    purchase_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    rack VARCHAR(40),
    shelf VARCHAR(40),
    expiry_date DATE,
    status ENUM('AVAILABLE', 'LOW_STOCK', 'QUARANTINED', 'EXPIRED') DEFAULT 'AVAILABLE',
    FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
    INDEX idx_expiry (expiry_date),
    INDEX idx_batch (batch_number)
);

-- ==========================================================
-- CUSTOMERS
-- ==========================================================
CREATE TABLE IF NOT EXISTS customers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(120),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_customer_phone (phone)
);

-- ==========================================================
-- INVOICES (Sales Billing)
-- ==========================================================
CREATE TABLE IF NOT EXISTS invoices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    customer_name VARCHAR(120) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    cashier_id BIGINT,
    cashier_name VARCHAR(120),
    doctor_name VARCHAR(120),
    prescription_ref VARCHAR(100),
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    tax_percentage DECIMAL(5,2) DEFAULT 0.00,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    net_payable DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_method ENUM('CASH', 'CARD', 'UPI', 'CREDIT') DEFAULT 'CASH',
    payment_status ENUM('PAID', 'REFUNDED', 'CANCELLED') DEFAULT 'PAID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_invoice_num (invoice_number),
    INDEX idx_invoice_created (created_at)
);

-- ==========================================================
-- INVOICE ITEMS (Sold medicine line items)
-- ==========================================================
CREATE TABLE IF NOT EXISTS invoice_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_id BIGINT NOT NULL,
    medicine_id BIGINT NOT NULL,
    medicine_name VARCHAR(160) NOT NULL,
    inventory_id BIGINT,
    batch_number VARCHAR(80) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id),
    FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE SET NULL
);

-- ==========================================================
-- SCAN HISTORY (AI recognition log)
-- ==========================================================
CREATE TABLE IF NOT EXISTS scan_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    medicine_id BIGINT,
    image_path VARCHAR(255),
    confidence DECIMAL(5,2),
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE SET NULL
);

-- ==========================================================
-- TRAINING MODULES & PHARMACY KNOWLEDGE
-- ==========================================================
CREATE TABLE IF NOT EXISTS training_module (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(160) NOT NULL,
    description TEXT,
    content LONGTEXT
);

CREATE TABLE IF NOT EXISTS quiz (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    module_id BIGINT NOT NULL,
    question TEXT NOT NULL,
    option_a VARCHAR(255),
    option_b VARCHAR(255),
    option_c VARCHAR(255),
    option_d VARCHAR(255),
    answer CHAR(1),
    FOREIGN KEY (module_id) REFERENCES training_module(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_progress (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    module_id BIGINT NOT NULL,
    score INT DEFAULT 0,
    completion_percentage INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES training_module(id) ON DELETE CASCADE,
    UNIQUE KEY uq_user_module (user_id, module_id)
);

CREATE TABLE IF NOT EXISTS pharmacy_knowledge (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content LONGTEXT NOT NULL,
    category VARCHAR(100),
    created_by BIGINT,
    verified BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ==========================================================
-- SEED DATA
-- ==========================================================
INSERT IGNORE INTO users (id, name, email, password, role) VALUES
(1, 'Admin User', 'admin@pharmaassist.local', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhi5L4pLh3Hyk5wJ.EDX0LlS.dmqNlfy', 'ADMIN'), -- admin123
(2, 'Senior Pharmacist', 'senior@pharmaassist.local', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhi5L4pLh3Hyk5wJ.EDX0LlS.dmqNlfy', 'SENIOR_PHARMACIST'),
(3, 'Arun (Junior/Sales)', 'arun@pharmaassist.local', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhi5L4pLh3Hyk5wJ.EDX0LlS.dmqNlfy', 'JUNIOR_PHARMACIST');

INSERT IGNORE INTO medicines (id, name, generic_name, active_ingredient, strength, dosage_form, category, manufacturer, storage_information) VALUES
(1, 'Amoxil 500', 'Amoxicillin', 'Amoxicillin', '500 mg', 'Tablet', 'Antibiotic', 'GenPharma', 'Store below 25°C, away from moisture.'),
(2, 'Paracet 650', 'Paracetamol', 'Paracetamol', '650 mg', 'Tablet', 'Analgesic/Antipyretic', 'GenPharma', 'Store at room temperature.'),
(3, 'Gasnil 20', 'Omeprazole', 'Omeprazole', '20 mg', 'Capsule', 'Antacid/PPI', 'MedLife', 'Store in a cool, dry place.'),
(4, 'Cetriz 10', 'Cetirizine', 'Cetirizine HCl', '10 mg', 'Tablet', 'Antihistamine', 'AllergenLab', 'Store below 30°C in dry place.'),
(5, 'Azithro 500', 'Azithromycin', 'Azithromycin', '500 mg', 'Tablet', 'Antibiotic', 'SunPharma', 'Store at controlled room temperature.');

INSERT IGNORE INTO medicine_uses (id, medicine_id, use_category, description, source, verified_by) VALUES
(1, 1, 'Bacterial infections', 'Used for respiratory, ear, and urinary tract infections.', 'Internal Formulary v1', 2),
(2, 2, 'Pain & Fever', 'Used for mild to moderate pain and fever reduction.', 'Internal Formulary v1', 2),
(3, 3, 'Acid reflux / GERD', 'Reduces stomach acid production.', 'Internal Formulary v1', 2),
(4, 4, 'Allergy & Cold', 'Relief from sneezing, runny nose, and hives.', 'Internal Formulary v1', 2),
(5, 5, 'Bacterial infections', 'Respiratory tract and soft tissue infections.', 'Internal Formulary v1', 2);

INSERT IGNORE INTO inventory (id, medicine_id, batch_number, quantity, mrp, sale_price, purchase_price, rack, shelf, expiry_date, status) VALUES
(1, 1, 'AMX-2024-11', 85, 120.00, 108.00, 75.00, 'A2', '3', '2027-05-10', 'AVAILABLE'),
(2, 2, 'PCT-2024-08', 240, 35.00, 30.00, 18.00, 'A1', '1', '2027-12-01', 'AVAILABLE'),
(3, 3, 'OMZ-2024-09', 18, 95.00, 85.00, 52.00, 'B1', '2', '2026-11-20', 'AVAILABLE'),
(4, 4, 'CTZ-2024-05', 150, 45.00, 40.00, 22.00, 'B2', '1', '2028-02-15', 'AVAILABLE'),
(5, 5, 'AZT-2024-01', 8, 140.00, 125.00, 80.00, 'A3', '4', '2026-11-15', 'LOW_STOCK');

INSERT IGNORE INTO customers (id, name, phone, email) VALUES
(1, 'Rahul Sharma', '9876543210', 'rahul.s@example.com'),
(2, 'Priya Patel', '9123456780', 'priya.p@example.com'),
(3, 'John Doe', '9988776655', 'john.doe@example.com');

INSERT IGNORE INTO invoices (id, invoice_number, customer_name, customer_phone, cashier_id, cashier_name, doctor_name, prescription_ref, total_amount, discount_percentage, discount_amount, tax_percentage, tax_amount, net_payable, payment_method, payment_status, created_at) VALUES
(1, 'INV-20261109-001', 'Rahul Sharma', '9876543210', 3, 'Arun (Junior/Sales)', 'Dr. Mehta', 'RX-8821', 138.00, 5.00, 6.90, 5.00, 6.55, 137.65, 'UPI', 'PAID', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2, 'INV-20261110-002', 'Priya Patel', '9123456780', 1, 'Admin User', 'Dr. Kapoor', 'RX-9042', 85.00, 0.00, 0.00, 5.00, 4.25, 89.25, 'CASH', 'PAID', NOW());

INSERT IGNORE INTO invoice_items (id, invoice_id, medicine_id, medicine_name, inventory_id, batch_number, quantity, unit_price, total_price) VALUES
(1, 1, 1, 'Amoxil 500', 1, 'AMX-2024-11', 1, 108.00, 108.00),
(2, 1, 2, 'Paracet 650', 2, 'PCT-2024-08', 1, 30.00, 30.00),
(3, 2, 3, 'Gasnil 20', 3, 'OMZ-2024-09', 1, 85.00, 85.00);

INSERT IGNORE INTO training_module (id, title, description, content) VALUES
(1, 'Basic Medicine Categories', 'Understand common therapeutic categories.', 'Analgesics, Antibiotics, Antacids, Antihistamines...'),
(2, 'Pharmacy SOP', 'Standard operating procedures for this pharmacy.', 'Dispensing checks, verification steps, quarantine process...');

INSERT IGNORE INTO pharmacy_knowledge (id, title, content, category, created_by, verified) VALUES
(1, 'Rack Layout Overview', 'Rack A: Pain Relief & Antibiotics. Rack B: Gastrointestinal & Diabetes.', 'Storage', 2, TRUE);

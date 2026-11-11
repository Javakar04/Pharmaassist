# PharmaAssist AI — Real-World Pharmacy Management System

An intelligent, full-stack pharmacy operations platform built for modern retail pharmacies and healthcare dispensaries.

```
React POS Frontend (5173) ──REST/JWT──▶ Spring Boot (8080) ──HTTP──▶ AI Service (8000)
                                              │
                                              ▼
                                       MySQL Database (3306)
```

---

## 🌟 Real-World Features Implemented

### 1. Dual-Role Experience & Dashboards
- **👑 Admin Maintenance Portal**:
  - Full inventory CRUD: Add new stock batch (Goods Received Note / GRN), edit prices & shelf locations, and execute **safe stock quarantine/deletion** (protects accounting audit trails if a batch has prior sales).
  - Store-wide sales history, profit margins, and daily revenue statistics.
  - Ability for Admin to also generate counter bills.
- **💼 Salesperson POS Terminal**:
  - Streamlined, high-speed Point of Sale interface designed for fast counter service.
  - Live rack and shelf location finder to immediately pick items.
  - Personal shift sales register with instant bill reprinting.

### 2. Point of Sale (POS) Fast Billing & Invoice Generation
- **Fast Medicine & Salt Lookup**: Instant autocomplete by Brand Name, Generic / Salt name, or Active Ingredient.
- **Strict Quantity Validation**: Prevents overselling by checking current available stock per batch before adding to the bill.
- **FEFO Batch Allocation**: First-Expire-First-Out selection ensuring older stock is dispensed first.
- **Customer & Prescription Tracking**: Captures Customer Name, Phone (with repeat customer auto-recognition), Doctor Name, and Rx number.
- **Automated Tax & Discount Calculations**: Subtotal, configurable Discount %, and GST/Tax breakdown.
- **Payment Method Flexibility**: Cash, UPI / QR, Credit/Debit Card, or Store Credit (Khata).
- **Printable Tax Invoice Receipt**: Formatted thermal/A4 cash receipt with pharmacy license numbers, line-item details, and one-click browser printing (`window.print()`).
- **Atomic Stock Deduction**: Automatically decrements batch quantities and updates stock status to `LOW_STOCK` or `OUT_OF_STOCK` in real time.

### 3. Sales History & Accounting Ledger
- Permanent, immutable transaction record for every generated invoice.
- Searchable by Bill Number, Customer Name, or Phone.
- Complete line-item breakdown (medicines, batches, rates, and quantities).
- One-click reprint of any historical receipt.

### 4. AI-Powered Medicine Scanner
- Photograph or upload medicine packaging to extract generic salts, dosage instructions, and storage requirements.

---

## 🚀 How to Run the Project

### Option 1: Docker (One Command — Recommended)
Ensure **Docker Desktop** is open and running on your computer, then execute:
```bash
docker compose up --build
```
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080/api
- **AI Microservice**: http://localhost:8000/docs

---

### Option 2: Run Bare-Metal Locally

#### 1. Database
Import the real-world schema into MySQL (port 3306):
```bash
mysql -u root -p < database/schema.sql
```

#### 2. AI Microservice (Python)
```bash
cd ai-service
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

#### 3. Backend (Spring Boot 3)
```bash
cd backend
./mvnw spring-boot:run
```

#### 4. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Demo Login Accounts

All accounts use the password: `admin123`

| User | Email | Role | Dashboard Experience |
|---|---|---|---|
| **Admin User** | `admin@pharmaassist.local` | `ADMIN` | Full control: Stock Add/Edit/Delete, Store-wide Sales, Pricing, Counter POS |
| **Senior Pharmacist** | `senior@pharmaassist.local` | `SENIOR_PHARMACIST` | Counter POS, Shelf Locator, Medicine Verification |
| **Arun (Sales Staff)** | `arun@pharmaassist.local` | `JUNIOR_PHARMACIST` | Counter POS, Shelf Locator, Personal Shift Register |

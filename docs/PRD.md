# TrackingDuit - Developer PRD

> Version: 1.0

## 1. Project Overview

TrackingDuit adalah aplikasi web personal finance berbasis PWA untuk
mencatat pemasukan, pengeluaran, analitik, OCR nota, sinkronisasi Google
Spreadsheet, serta integrasi saldo melalui API resmi jika tersedia.

## 2. Goals

-   Pencatatan keuangan cepat
-   Dashboard realtime
-   OCR nota
-   Sinkronisasmoi spreadsheet
-   Multi-wallet
-   AI Insight

## 3. Tech Stack

-   Next.js
-   React
-   Tailwind CSS
-   Supabase (Auth, PostgreSQL, Realtime, Storage)
-   Google Sheets API
-   OCR (Google Vision/Tesseract)

## 4. Modul

-   Authentication
-   Dashboard
-   Wallet
-   Transactions
-   OCR Receipt
-   Saving Goals
-   Budget
-   Bills Reminder
-   Analytics
-   AI Insight
-   Settings

## 5. Database (Ringkas)

Users, Wallets, Transactions, Categories, Budgets, SavingGoals, Bills,
OCRReceipts, Notifications, SyncLogs.

## 6. API

-   POST /auth/login
-   POST /transactions
-   GET /transactions
-   POST /ocr
-   POST /sync/google-sheet
-   GET /analytics

## 7. OCR Flow

Foto → OCR → Parsing → Validasi → Simpan → Sinkron Spreadsheet → Update
Dashboard.

## 8. Spreadsheet Sync

Sinkron dua arah dengan Google Spreadsheet menggunakan timestamp dan
conflict resolution.

## 9. Integrasi Bank/E-Wallet

Gunakan Open Finance/API resmi bila tersedia. Jika tidak tersedia
gunakan import mutasi (CSV/PDF) atau sinkronisasi manual.

## 10. Keamanan

JWT, Row Level Security Supabase, HTTPS, Audit Log.

## 11. Roadmap

### MVP

-   Login
-   Dashboard
-   Wallet
-   Transaksi
-   OCR
-   Spreadsheet
-   Analytics

### V2

-   AI Insight
-   Saving Goals
-   Reminder

### V3

-   Open Banking
-   AI Assistant
-   Multi-user Family

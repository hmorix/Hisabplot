*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 2: Side Hustle](https://dev.to/challenges/hacktoberfest-week2-2026-10-12)*

# HisabPilot — AI Paperwork Assistant for Small Businesses

> *"Your invoices, organized in seconds."*

---

## What I Built

**HisabPilot** is an AI-powered document extraction and paperwork assistant built specifically for the 63+ million small businesses, freelancers, shopkeepers (*kiranas*), and independent accountants in India.

### The Problem
Every month before the 20th (India's GSTR-3B tax filing deadline), freelancers and small business owners face a mountain of crumpled paper bills, digital PDFs, and WhatsApp photos:
1. **Manual Entry is Slow & Painful**: Typing invoice numbers, 15-digit alphanumeric GSTINs, and line items into spreadsheets takes 8–15 hours every month.
2. **Costly Tax Discrepancies**: If an invoice has an invalid GSTIN or confuses Intra-state tax (**CGST + SGST**) with Inter-state tax (**IGST**), the business loses its **Input Tax Credit (ITC)** or receives an automated tax notice.
3. **Rounding & Handwritten Errors**: Printed and handwritten bills frequently have discrepancies between itemized line items and the grand total.

### The Solution
HisabPilot allows anyone to drag-and-drop receipt images or PDFs (or snap photos on their phone camera) and automatically:
- Extracts **Vendor Name**, **Address**, **Supplier GSTIN** (validated by state code), **Buyer GSTIN**, **Invoice Number**, **Date**, **Due Date**, **Payment Mode**, and **Expense Category**.
- Extracts itemized **Line Items** with HSN codes, quantity, unit price, tax rate %, and line totals.
- **Audits the Financial Math**: Verifies $\text{Subtotal} + \text{Taxes} - \text{Discounts} \approx \text{Grand Total}$ and flags discrepancies with color-coded severity.
- **Validates GST Rules**: Automatically checks whether Intra-state or Inter-state tax rules were applied correctly based on supplier/buyer state codes.
- **One-Click Auto-Recalculate**: Automatically resolves rounding mismatches between line items and totals.
- **Export in Seconds**: Generates formatted dual-sheet Excel (`.xlsx`) workbooks (*Invoices Overview* + *Line Items Breakdown*), CSV, JSON, and print-ready A4 audit vouchers.

### Who Would Pay for It?
- **Freelancers & Consultants** ($5–$9/mo): To log client travel, software SaaS subscriptions, and client billings without manual spreadsheets.
- **Small Business Owners & Kirana Stores** ($15–$29/mo): To reconcile supplier delivery challans and purchase bills.
- **Chartered Accountants (CAs) & Bookkeepers** ($49–$99/mo): For high-volume multi-client invoice processing prior to filing monthly GST returns.

---

## Demo

- **Live Application URL**: [https://hisabpilot.harshsharma.tech](https://hisabpilot.harshsharma.tech)
- **Built-in Demo Fixtures**: Don't have a receipt on hand? Test the system immediately with 1 click using realistic Indian demo fixtures:
  - *Shree Balaji Paper Mart* (Intra-state Delhi CGST + SGST tax invoice)
  - *Kaveri Cloud Technologies* (Inter-state Karnataka to Maharashtra B2B SaaS invoice)
  - *Bharat Hardware Discrepancy Demo* (Demonstrates real-time mathematical discrepancy detection and review alerts)

---

## Code

- **GitHub Repository**: [https://github.com/harshsharma/hisabpilot](https://github.com/harshsharma/hisabpilot)
- **Live Site**: [https://hisabpilot.harshsharma.tech](https://hisabpilot.harshsharma.tech)

{% github https://github.com/harshsharma/hisabpilot %}

### Tech Stack
- **Framework**: React 19, TypeScript, Vite, Express
- **Styling**: Tailwind CSS, Lucide React icons
- **AI Model**: Google Gemini (`gemini-3.8-flash` & `gemini-3.1-flash-lite`) via official `@google/genai` TypeScript SDK
- **Validation**: Zod schema validation & custom Indian GSTIN regex validation
- **Spreadsheet Generation**: `xlsx` (SheetJS) for formatted multi-sheet Excel generation
- **Deployment Target**: Vercel / Cloud Run with Node.js server runtime

---

## How I Built It

### 1. Server-Side Gemini Vision Engine
HisabPilot uses the official `@google/genai` TypeScript SDK exclusively on the backend (`server.ts`). Uploaded documents (JPG, PNG, PDF) are processed via multimodal vision:
- The server configures low temperature ($0.1$) and passes a strict `responseSchema` to guarantee structured JSON output.
- Accepts both images and multi-page PDFs directly in memory without disk persistence.
- Handles API quotas, rate limiting, and content safety with user-friendly retry guidance.

### 2. Indian GST & Financial Auditing Engine
Rather than blindly trusting AI text, HisabPilot passes all extracted data through an automated financial auditing module (`src/lib/invoice-validation.ts`):
- **GSTIN Structural Validation**: Verifies the 15-character Indian format: `[State Code 2-digit][PAN 10-char][Entity 1-char][Z][Checksum]`.
- **Intra-state vs. Inter-state Logic**: Checks if the first two digits of Supplier and Buyer GSTIN match. If they match, it verifies that CGST and SGST are charged equally and flags any accidental IGST. If they differ, it expects IGST.
- **Math Parity Check**: Re-sums line items and verifies if `(Subtotal + Taxes - Discounts) == Grand Total`. Any mismatch $> ₹2.00$ triggers a **"Review Required"** badge.

### 3. Side-by-Side Review Workspace
Users can inspect the original document on the left (with zoom, pan, and rotate controls) while editing vendor details, GST numbers, tax figures, and tabular line items on the right.

### 4. Zero Server Storage & Ephemeral Privacy
Financial documents contain sensitive trade prices and vendor bank information. HisabPilot keeps documents purely in temporary memory during the Gemini inference request and discards them immediately. Invoices are stored in the user's private browser `localStorage`, allowing offline search, category filtering, and export.

---

## Why Does Open Innovation Matter?

Small business accounting is fundamentally about **trust and data privacy**. When independent shopkeepers and freelancers adopt AI tools, they are understandably cautious about uploading tax receipts and proprietary supplier rates to opaque closed-box platforms.

Open innovation matters here because:
1. **Verifiable Privacy**: Open-source architecture allows business owners and developers to verify that invoices are never permanently retained or sold to third parties.
2. **Zero Vendor Lock-in**: By designing the pipeline around modular TypeScript schemas and open formats (Excel XLSX, CSV, JSON), businesses can own their data and export it anywhere.
3. **Accessibility**: Leveraging open APIs and free-tier eligible models like `gemini-3.8-flash` allows developers to build high-utility side hustles that small businesses in emerging economies can access without prohibitive subscription fees.

---

## My Agent Session

This application was engineered using AI Studio Build and agent-assisted workflows to coordinate full-stack TypeScript scaffolding, Express server-side Gemini integration, Zod schema design, and Indian GST tax reconciliation logic.

---

## My First User

I shared an early preview with an independent digital agency owner based in New Delhi:
> *"Every month my team collects around 40 bills from cloud hosting, stationery, software subscriptions, and hardware repairs. Manually typing these into our tally sheet used to take me half a Saturday. With HisabPilot, I drag the folder in, fix the one bill where the vendor miscalculated tax, and export an Excel sheet straight to my CA in 10 minutes."*

---

## Prize Categories

- **Side Hustle**: A production-grade SaaS tool targeting a massive, underserved market (Indian MSMEs, freelancers, and small business accounting).
- **Most Helpful Hack**: Directly eliminates 10+ hours of tedious manual paperwork each month while preventing tax compliance errors and lost Input Tax Credit.

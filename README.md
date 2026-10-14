# HisabPilot — AI Paperwork Assistant for Small Businesses

> **"Your invoices, organized in seconds."**

HisabPilot is an AI-powered document extraction tool tailored for Indian freelancers, shopkeepers, small businesses, and accountants. It parses GST tax invoices, retail receipts, bills of supply, and cash memos in JPG, JPEG, PNG, and PDF formats—or captures them live via a mobile device camera.

---

## Key Features

1. **Multimodal Document Extraction via Google Gemini**
   - Extracts Vendor Name, Vendor Address, Supplier GSTIN (15 characters), Customer Name, Customer GSTIN, Invoice Number, Invoice Date, Due Date, Payment Mode, and Expense Category.
   - Extracts itemized Line Items: Description, HSN/SAC Code, Quantity, Unit Rate, Discounts, Tax Rate %, Tax Amount, and Line Totals.
   - Uses official `@google/genai` TypeScript SDK on the server side (`gemini-3.8-flash` or `gemini-3.1-flash-lite`).

2. **Automated Indian GST & Financial Audit**
   - **Intra-State vs. Inter-State Logic**: Distinguishes CGST + SGST (Intra-state, same state code) from IGST (Inter-state, differing state codes).
   - **Math Discrepancy Checks**: Flags mismatches between `Subtotal + Taxes - Discounts` and `Grand Total`.
   - **Line Items Reconciler**: Compares line item totals with the document subtotal.
   - **Interactive Auto-Recalculate**: Fixes rounding errors and math inconsistencies with one click.

3. **Side-by-Side Review & Editing**
   - High-fidelity zoom, pan, and rotate controls for original invoice images and PDFs.
   - Edit any field before finalizing and exporting.
   - Review Required alert indicators for uncertain or missing data.

4. **Dashboard & Analytics**
   - Real-time spend totals in Indian Rupees (`₹` formatted in Lakhs/Crores).
   - Input Tax Credit (ITC) tracking: Total CGST, SGST, and IGST breakdowns.
   - Expense category distribution progress bars.

5. **Flexible Export Options**
   - **Excel (.xlsx)**: Structured 2-sheet workbook with *Invoices Overview* and *Line Items Breakdown*.
   - **CSV**: Universal spreadsheet export with UTF-8 BOM encoding for Excel.
   - **JSON**: Clean developer export.
   - **Print-friendly Report**: Clean A4 audit voucher suitable for filing or printing.

6. **Privacy & Security**
   - Ephemeral server processing: zero permanent server-side document storage.
   - Server-only API keys: credentials never leak to the client bundle.
   - Rate limiting and request throttling to respect free-tier API quotas.

---

## Local Setup & Development

### 1. Prerequisites
- Node.js 18+ or 20+
- A Google AI Studio Gemini API Key ([Get one for free at aistudio.google.com](https://aistudio.google.com/app/apikey))

### 2. Installation
```bash
git clone https://github.com/your-username/hisab-pilot.git
cd hisab-pilot
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory:
```env
# Google Gemini API Key from Google AI Studio
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Preferred Gemini Model (defaults to gemini-3.8-flash)
GEMINI_MODEL=gemini-3.8-flash

# Port for Full-Stack Server
PORT=3000
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deploying to Vercel

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of HisabPilot"
   git branch -M main
   git remote add origin https://github.com/<your-username>/hisab-pilot.git
   git push -u origin main
   ```

2. **Import into Vercel**:
   - Go to [vercel.com](https://vercel.com) and log in.
   - Click **Add New** > **Project** and select your GitHub repository.

3. **Configure Environment Variables**:
   - Under **Project Settings > Environment Variables**, add:
     - `GEMINI_API_KEY`: Your Google AI Studio API key.
     - `GEMINI_MODEL`: `gemini-3.8-flash` (or `gemini-3.1-flash-lite`).

4. **Deploy**:
   - Click **Deploy**. Vercel will build and deploy the application.

---

## Statutory Disclaimer & Limitations

- **Not an Official GST Filing Tool**: HisabPilot is an assistive paperwork parser. It is not an Application Service Provider (ASP) or GST Suvidha Provider (GSP) and does not directly submit returns to the GST Portal.
- **Verification Required**: While Gemini multimodal models provide high extraction fidelity, users should inspect and verify amounts before recording business filings or claiming Input Tax Credit (ITC).

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { RawExtractionZodSchema, normalizeCategory } from './src/lib/invoice-schema';
import { validateInvoiceFinances } from './src/lib/invoice-validation';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Security and body parsers
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ limit: '30mb', extended: true }));

// Disable x-powered-by for security
app.disable('x-powered-by');

// Add essential security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// In-memory rate limiting and request counter
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_MINUTE = 30;
const ipRequestCounts = new Map<string, { count: number; resetAt: number }>();

let totalInvoicesProcessed = 0;
let totalErrorsEncountered = 0;

function rateLimiter(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const clientData = ipRequestCounts.get(ip);

  if (!clientData || now > clientData.resetAt) {
    ipRequestCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (clientData.count >= MAX_REQUESTS_PER_MINUTE) {
    const retryAfterSeconds = Math.ceil((clientData.resetAt - now) / 1000);
    res.setHeader('Retry-After', retryAfterSeconds);
    res.status(429).json({
      success: false,
      errorCode: 'RATE_LIMIT_EXCEEDED',
      error: `Too many extraction requests. Please wait ${retryAfterSeconds} seconds before trying again.`,
    });
    return;
  }

  clientData.count += 1;
  next();
}

// Initialize Gemini Client
// Uses environment variable GEMINI_API_KEY or the provided API key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6J_UPBTxJqTfWSs4zlWQuIBmjK50cPelPNhAPCZ4ZZ5DA';
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Document Extraction JSON Schema for Gemini
const INVOICE_EXTRACTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    vendorName: { type: Type.STRING, description: 'Legal name or trading name of the supplier/seller' },
    vendorAddress: { type: Type.STRING, description: 'Address of the vendor/supplier' },
    vendorPhone: { type: Type.STRING, description: 'Supplier phone or mobile number' },
    vendorEmail: { type: Type.STRING, description: 'Supplier email address' },
    supplierGstin: { type: Type.STRING, description: '15-character Goods and Services Tax Identification Number of supplier' },
    customerName: { type: Type.STRING, description: 'Name of the buyer / customer / billed-to party' },
    customerAddress: { type: Type.STRING, description: 'Address of the customer' },
    customerGstin: { type: Type.STRING, description: '15-character GSTIN of the buyer, if present' },
    invoiceNumber: { type: Type.STRING, description: 'Invoice number, bill number, memo number, or receipt number' },
    invoiceDate: { type: Type.STRING, description: 'Date of invoice in YYYY-MM-DD format if identifiable' },
    dueDate: { type: Type.STRING, description: 'Due date of payment in YYYY-MM-DD format' },
    placeOfSupply: { type: Type.STRING, description: 'State name or state code for Place of Supply' },
    currency: { type: Type.STRING, description: 'Currency code, usually INR or symbol ₹' },
    paymentMethod: { type: Type.STRING, description: 'Stated payment mode (e.g., UPI, Cash, Bank Transfer, NEFT, Cheque, Card)' },
    expenseCategory: {
      type: Type.STRING,
      description: 'One of: Inventory / Stock, Office Supplies, Logistics & Transport, Utilities, Rent & Facility, IT & Software Subscriptions, Meals & Refreshments, Professional & Legal Fees, Repairs & Maintenance, Capital Equipment, Marketing & Advertising, Other Expense',
    },
    subtotal: { type: Type.NUMBER, description: 'Total taxable amount before taxes and discounts' },
    cgst: { type: Type.NUMBER, description: 'Central GST amount in INR' },
    sgst: { type: Type.NUMBER, description: 'State GST amount in INR' },
    igst: { type: Type.NUMBER, description: 'Integrated GST amount in INR (for inter-state supply)' },
    otherTaxes: { type: Type.NUMBER, description: 'Cess, TCS, round-off, delivery or other charges' },
    discount: { type: Type.NUMBER, description: 'Total discount amount deducted' },
    totalAmount: { type: Type.NUMBER, description: 'Grand total payable amount' },
    amountPaid: { type: Type.NUMBER, description: 'Amount already paid' },
    balanceDue: { type: Type.NUMBER, description: 'Remaining balance due' },
    confidence: { type: Type.STRING, description: 'high, medium, or low based on visual legibility' },
    rawNotes: { type: Type.STRING, description: 'Brief audit notes or remarks about unusual fields' },
    lineItems: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING, description: 'Item name or service description' },
          hsnCode: { type: Type.STRING, description: 'HSN code or SAC code' },
          quantity: { type: Type.NUMBER, description: 'Quantity or number of units' },
          unitPrice: { type: Type.NUMBER, description: 'Rate or price per unit' },
          discount: { type: Type.NUMBER, description: 'Discount for this item' },
          taxRate: { type: Type.NUMBER, description: 'GST rate percentage (e.g. 5, 12, 18, 28)' },
          taxAmount: { type: Type.NUMBER, description: 'Calculated or printed tax amount for this item' },
          lineTotal: { type: Type.NUMBER, description: 'Total for this line item' },
        },
        required: ['description', 'lineTotal'],
      },
    },
  },
  required: ['vendorName', 'invoiceNumber', 'totalAmount'],
};

// API: Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'HisabPilot Document Extraction Engine',
    model: DEFAULT_MODEL,
    hasApiKey: Boolean(GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// API: Usage stats
app.get('/api/usage', (req, res) => {
  res.json({
    totalInvoicesProcessed,
    totalErrorsEncountered,
    rateLimitMaxPerMinute: MAX_REQUESTS_PER_MINUTE,
    model: DEFAULT_MODEL,
    freeTierGuide: {
      recommendedModel: 'gemini-3.8-flash',
      requestsPerMinuteLimit: 15,
      requestsPerDayLimit: 1500,
      note: 'HisabPilot operates under Google AI Studio API rate limits.',
    },
  });
});

// API: Document Extraction Route
app.post('/api/extract', rateLimiter, async (req, res) => {
  const startTime = Date.now();

  try {
    const { fileData, mimeType, fileName, requestedModel } = req.body;

    // 1. Validate Input Payload
    if (!fileData || typeof fileData !== 'string') {
      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_PAYLOAD',
        error: 'Missing document fileData (expected base64 encoded string).',
      });
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
    const resolvedMimeType = mimeType || 'image/jpeg';

    if (!allowedMimeTypes.includes(resolvedMimeType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        errorCode: 'UNSUPPORTED_FILE_TYPE',
        error: `Unsupported file format '${resolvedMimeType}'. Allowed formats: JPG, PNG, WEBP, and PDF.`,
      });
    }

    // Rough check on base64 size (20MB limit)
    const approximateSizeBytes = (fileData.length * 3) / 4;
    if (approximateSizeBytes > 22 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        errorCode: 'FILE_TOO_LARGE',
        error: 'The uploaded file exceeds the 20MB limit. Please compress the image or upload a shorter PDF.',
      });
    }

    // Clean base64 string if it contains data URL header
    const cleanBase64 = fileData.replace(/^data:[^;]+;base64,/, '');

    // 2. Select Model
    const modelToUse = requestedModel && ['gemini-3.8-flash', 'gemini-3.1-flash-lite'].includes(requestedModel)
      ? requestedModel
      : DEFAULT_MODEL;

    // 3. System instruction & Multimodal prompt
    const systemPrompt = `You are HisabPilot, a high-precision AI document extraction system for Indian businesses, shopkeepers, freelancers, and accountants.
Your task is to parse invoices, tax receipts, cash bills, and GST memos into clean structured JSON.

Key Indian GST & Tax rules:
1. Indian GSTIN is a 15-character alphanumeric identifier (e.g., 07AAAAA0000A1Z5). The first 2 digits represent the State Code.
2. Intra-state supply (same state) charges CGST (Central GST) and SGST (State GST) in equal parts (e.g. 9% + 9% for 18% slab).
3. Inter-state supply (different states) charges IGST (Integrated GST) as a single tax.
4. Extract Subtotal, CGST, SGST, IGST, Discounts, and Total Amount accurately.
5. If a field is not present or unreadable, return null. NEVER invent numbers, dates, or names.
6. Return only valid JSON according to the schema.`;

    const userPrompt = `Extract all invoice fields, GSTINs, vendor and customer details, line items, and tax breakdown from this document image/PDF.`;

    const documentPart = {
      inlineData: {
        mimeType: resolvedMimeType === 'image/jpg' ? 'image/jpeg' : resolvedMimeType,
        data: cleanBase64,
      },
    };

    // 4. Call Gemini API
    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: {
        parts: [documentPart, { text: userPrompt }],
      },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: INVOICE_EXTRACTION_SCHEMA,
        temperature: 0.1, // Low temperature for high deterministic extraction accuracy
      },
    });

    const rawText = response.text?.trim() || '';
    if (!rawText) {
      throw new Error('Gemini returned an empty response.');
    }

    // 5. Parse and Clean Model JSON Output
    let parsedJson: any;
    try {
      // Clean possible markdown code fences if present
      const cleanJsonString = rawText
        .replace(/^```json\s*/i, '')
        .replace(/\s*```$/, '')
        .trim();
      parsedJson = JSON.parse(cleanJsonString);
    } catch (parseError: any) {
      totalErrorsEncountered += 1;
      return res.status(502).json({
        success: false,
        errorCode: 'MALFORMED_MODEL_JSON',
        error: 'The AI model returned non-standard JSON. Please try again with a clearer picture.',
        rawResponse: rawText.slice(0, 500),
      });
    }

    // 6. Validate with Zod Schema
    const zodResult = RawExtractionZodSchema.safeParse(parsedJson);
    if (!zodResult.success) {
      // In case of minor schema variance, log code but salvage available fields
      console.warn('Zod validation warning:', zodResult.error.issues);
    }

    const validatedData = zodResult.success ? zodResult.data : parsedJson;

    // 7. Format Complete Invoice Data
    const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const lineItems = (validatedData.lineItems || []).map((item: any, idx: number) => ({
      id: item.id || `li_${idx + 1}_${Date.now()}`,
      description: item.description || `Item #${idx + 1}`,
      hsnCode: item.hsnCode || null,
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice) || 0,
      discount: item.discount !== undefined && item.discount !== null ? Number(item.discount) : null,
      taxRate: item.taxRate !== undefined && item.taxRate !== null ? Number(item.taxRate) : null,
      taxAmount: item.taxAmount !== undefined && item.taxAmount !== null ? Number(item.taxAmount) : null,
      lineTotal: Number(item.lineTotal) || (Number(item.quantity || 1) * Number(item.unitPrice || 0)),
    }));

    const invoiceRecord = {
      id: invoiceId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fileName: fileName || `invoice_${Date.now()}.${resolvedMimeType.split('/')[1] || 'jpg'}`,
      fileType: resolvedMimeType,
      fileSize: approximateSizeBytes,
      vendorName: validatedData.vendorName || 'Unknown Vendor',
      vendorAddress: validatedData.vendorAddress || null,
      vendorPhone: validatedData.vendorPhone || null,
      vendorEmail: validatedData.vendorEmail || null,
      supplierGstin: validatedData.supplierGstin ? validatedData.supplierGstin.toUpperCase().trim() : null,
      customerName: validatedData.customerName || null,
      customerAddress: validatedData.customerAddress || null,
      customerGstin: validatedData.customerGstin ? validatedData.customerGstin.toUpperCase().trim() : null,
      invoiceNumber: validatedData.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
      invoiceDate: validatedData.invoiceDate || new Date().toISOString().split('T')[0],
      dueDate: validatedData.dueDate || null,
      placeOfSupply: validatedData.placeOfSupply || null,
      currency: validatedData.currency || 'INR',
      paymentMethod: validatedData.paymentMethod || null,
      expenseCategory: normalizeCategory(validatedData.expenseCategory),
      subtotal: Number(validatedData.subtotal) || 0,
      cgst: validatedData.cgst !== undefined && validatedData.cgst !== null ? Number(validatedData.cgst) : null,
      sgst: validatedData.sgst !== undefined && validatedData.sgst !== null ? Number(validatedData.sgst) : null,
      igst: validatedData.igst !== undefined && validatedData.igst !== null ? Number(validatedData.igst) : null,
      otherTaxes: validatedData.otherTaxes !== undefined && validatedData.otherTaxes !== null ? Number(validatedData.otherTaxes) : null,
      discount: validatedData.discount !== undefined && validatedData.discount !== null ? Number(validatedData.discount) : null,
      totalAmount: Number(validatedData.totalAmount) || 0,
      amountPaid: validatedData.amountPaid !== undefined && validatedData.amountPaid !== null ? Number(validatedData.amountPaid) : null,
      balanceDue: validatedData.balanceDue !== undefined && validatedData.balanceDue !== null ? Number(validatedData.balanceDue) : null,
      lineItems,
      rawNotes: validatedData.rawNotes || null,
      modelConfidence: validatedData.confidence || 'medium',
      userVerified: false,
      needsReview: false,
      validationWarnings: [],
    };

    // 8. Run Audit & Financial Consistency Verification
    const audit = validateInvoiceFinances(invoiceRecord);
    invoiceRecord.validationWarnings = audit.warnings as any;
    invoiceRecord.needsReview = audit.needsReview;

    totalInvoicesProcessed += 1;
    const processingTimeMs = Date.now() - startTime;

    return res.json({
      success: true,
      invoice: invoiceRecord,
      warnings: audit.warnings,
      modelUsed: modelToUse,
      processingTimeMs,
    });
  } catch (error: any) {
    totalErrorsEncountered += 1;
    console.error('Extraction error:', error?.message || error);

    // Differentiate error types for user actionability
    const errorMessage = error?.message || '';

    if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota') || errorMessage.toLowerCase().includes('rate limit')) {
      return res.status(429).json({
        success: false,
        errorCode: 'QUOTA_EXHAUSTED',
        error: 'Google Gemini API quota reached or rate limited. Please wait 30 seconds and retry, or use an eligible free-tier model.',
      });
    }

    if (errorMessage.includes('403') || errorMessage.includes('401') || errorMessage.toLowerCase().includes('api key')) {
      return res.status(401).json({
        success: false,
        errorCode: 'AUTH_ERROR',
        error: 'Gemini API authentication failed. Please verify that a valid GEMINI_API_KEY is configured in server environment.',
      });
    }

    if (errorMessage.includes('safety') || errorMessage.includes('blocked')) {
      return res.status(400).json({
        success: false,
        errorCode: 'CONTENT_FLAGGED',
        error: 'The uploaded document could not be processed due to content safety triggers. Please ensure standard invoice content.',
      });
    }

    return res.status(500).json({
      success: false,
      errorCode: 'EXTRACTION_FAILED',
      error: errorMessage || 'An error occurred during invoice extraction. Please verify document legibility and retry.',
    });
  }
});

// Full-stack Vite handling
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Vite Dev Server middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[HisabPilot] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start HisabPilot server:', err);
  process.exit(1);
});

import { InvoiceData } from '../types/invoice';
import { SAMPLE_INVOICES } from './sample-data';

const STORAGE_KEY = 'hisabpilot_invoices_v1';

export function getSavedInvoices(): InvoiceData[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Initialize with sample invoices for instant delight
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_INVOICES));
      return SAMPLE_INVOICES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load invoices from localStorage', e);
    return SAMPLE_INVOICES;
  }
}

export function saveInvoice(invoice: InvoiceData): InvoiceData[] {
  const current = getSavedInvoices();
  const existingIndex = current.findIndex(item => item.id === invoice.id);
  
  let updated: InvoiceData[];
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = { ...invoice, updatedAt: new Date().toISOString() };
  } else {
    updated = [{ ...invoice, updatedAt: new Date().toISOString() }, ...current];
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Storage limit reached, removing preview images from older items', e);
    // Strip large preview base64 from older items if localStorage quota is tight
    const stripped = updated.map((item, idx) => {
      if (idx > 2 && item.documentPreviewData) {
        return { ...item, documentPreviewData: undefined };
      }
      return item;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stripped));
  }
  return updated;
}

export function deleteInvoice(id: string): InvoiceData[] {
  const current = getSavedInvoices();
  const updated = current.filter(item => item.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete invoice', e);
  }
  return updated;
}

export function clearAllInvoices(): InvoiceData[] {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear invoices', e);
  }
  return [];
}

export function resetToSampleInvoices(): InvoiceData[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_INVOICES));
  } catch (e) {
    console.error('Failed to reset samples', e);
  }
  return SAMPLE_INVOICES;
}

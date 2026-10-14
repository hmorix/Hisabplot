import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Camera, 
  FileText, 
  FileImage, 
  X, 
  ArrowRight, 
  AlertCircle, 
  Sparkles, 
  CheckCircle2, 
  Loader2,
  FileSpreadsheet,
  Shield,
  HelpCircle
} from 'lucide-react';
import { fileToBase64, validateUploadFile } from '../lib/pdf-preview';
import { formatBytes } from '../lib/formatters';
import { InvoiceData } from '../types/invoice';
import { SAMPLE_INVOICES } from '../lib/sample-data';

interface UploadZoneProps {
  onExtractionSuccess: (invoice: InvoiceData) => void;
  selectedModel: string;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onExtractionSuccess,
  selectedModel,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = async (file: File) => {
    setErrorMessage(null);
    const validation = validateUploadFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid file');
      return;
    }

    setSelectedFile(file);

    // Generate preview
    try {
      const base64 = await fileToBase64(file);
      setFilePreview(base64);
    } catch {
      setFilePreview(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleExtract = async () => {
    if (!selectedFile || !filePreview) return;

    setIsLoading(true);
    setErrorMessage(null);
    setLoadingStep('Uploading document securely...');

    try {
      // Step 1: Prepare data
      setLoadingStep('Sending document to Gemini AI...');

      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileData: filePreview,
          mimeType: selectedFile.type,
          fileName: selectedFile.name,
          requestedModel: selectedModel,
        }),
      });

      setLoadingStep('Auditing GSTIN, tax breakdown, and financial math...');

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract invoice data');
      }

      setLoadingStep('Extraction complete!');
      
      // Attach the original preview for side-by-side editing
      const invoiceData: InvoiceData = {
        ...data.invoice,
        documentPreviewData: filePreview,
        fileType: selectedFile.type,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
      };

      onExtractionSuccess(invoiceData);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error occurred while processing invoice.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleLoadSample = (sample: InvoiceData) => {
    onExtractionSuccess(sample);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gemini-Powered Document Extraction for Indian Small Businesses</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Automate Your Invoice & Receipt Paperwork
        </h1>
        <p className="text-base text-slate-600 max-w-2xl mx-auto">
          Upload any paper receipt, tax invoice, or PDF bill. HisabPilot extracts supplier GSTINs, 
          calculates CGST/SGST/IGST breakdowns, itemizes line items, and checks for financial math discrepancies.
        </p>
      </div>

      {/* Upload Box */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 transition-all">
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Extraction Notice</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {!selectedFile ? (
          <div>
            {/* Drag & Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-indigo-600 bg-indigo-50/50 scale-[0.99]'
                  : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/70'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                Drag & drop your invoice here
              </h3>
              <p className="text-sm text-slate-500 mb-5">
                Supports PDF, JPG, JPEG, and PNG files up to 20 MB
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Browse Document</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    cameraInputRef.current?.click();
                  }}
                  className="px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-sm font-semibold shadow-xs transition-colors flex items-center space-x-2"
                >
                  <Camera className="w-4 h-4 text-indigo-600" />
                  <span>Scan via Camera</span>
                </button>
              </div>

              {/* Hidden File Inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/webp,application/pdf"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>

            {/* Quick Demonstration Invoices */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Or try with realistic Indian demo invoices</span>
                </span>
                <span className="text-xs text-slate-400">One-click audit</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SAMPLE_INVOICES.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleLoadSample(sample)}
                    className="p-3 text-left rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {sample.vendorName.split(' ')[0]} {sample.vendorName.split(' ')[1] || ''}
                      </span>
                      {sample.needsReview ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                          Discrepancy Demo
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          Clean GST
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate mb-1.5">
                      {sample.expenseCategory} • ₹{sample.totalAmount.toLocaleString('en-IN')}
                    </p>
                    <span className="text-[11px] font-medium text-indigo-600 group-hover:underline flex items-center space-x-1">
                      <span>Inspect & Edit</span>
                      <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Selected File Preview & Action */
          <div className="space-y-6">
            <div className="flex items-start justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                  {selectedFile.type === 'application/pdf' ? (
                    <FileText className="w-7 h-7 text-red-500" />
                  ) : filePreview ? (
                    <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <FileImage className="w-7 h-7 text-indigo-500" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 truncate max-w-xs sm:max-w-md">
                    {selectedFile.name}
                  </h4>
                  <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                    <span>{formatBytes(selectedFile.size)}</span>
                    <span>•</span>
                    <span className="uppercase">{selectedFile.type.split('/')[1] || 'DOC'}</span>
                    <span>•</span>
                    <span className="text-emerald-600 font-medium flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Ready for AI extraction</span>
                    </span>
                  </div>
                </div>
              </div>

              {!isLoading && (
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
                  title="Remove file"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Document Thumbnail Expanded Preview */}
            {filePreview && selectedFile.type !== 'application/pdf' && (
              <div className="max-h-64 rounded-xl border border-slate-200 bg-slate-900/5 p-2 flex items-center justify-center overflow-hidden">
                <img
                  src={filePreview}
                  alt="Document"
                  className="max-h-60 max-w-full rounded-lg object-contain shadow-xs"
                />
              </div>
            )}

            {/* Loading State Overlay */}
            {isLoading ? (
              <div className="p-6 rounded-xl bg-indigo-50/70 border border-indigo-100 text-center space-y-3">
                <div className="flex items-center justify-center space-x-2 text-indigo-700 font-semibold text-sm">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing with Gemini 3.8 Flash...</span>
                </div>
                <p className="text-xs text-indigo-600 font-medium">
                  {loadingStep}
                </p>
                <div className="w-full max-w-xs mx-auto bg-indigo-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full w-2/3 rounded-full animate-pulse" />
                </div>
              </div>
            ) : (
              /* Extract Action Buttons */
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Choose Different File
                </button>

                <button
                  type="button"
                  onClick={handleExtract}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-100 transition-all flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Extract Invoice Data</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-sm">
            GST
          </div>
          <h4 className="font-semibold text-slate-900 text-sm">Intra & Inter-State GST Rules</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Distinguishes CGST + SGST from IGST automatically based on supplier and customer state codes.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h4 className="font-semibold text-slate-900 text-sm">Automated Math Audit</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Checks if subtotal + taxes − discount matches grand total. Flags discrepancies before export.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <h4 className="font-semibold text-slate-900 text-sm">Private & Ephemeral</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your documents are never permanently stored on servers. Processed temporarily via official Gemini SDK.
          </p>
        </div>
      </div>
    </div>
  );
};

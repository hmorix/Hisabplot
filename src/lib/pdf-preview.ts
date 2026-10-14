/**
 * Utility for PDF previews and image conversion
 */

export interface PdfPagePreview {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Converts a File object to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Checks file type and size constraints
 */
export function validateUploadFile(file: File, maxSizeBytes = 20 * 1024 * 1024): { valid: boolean; error?: string } {
  const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
  if (!allowed.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `File type '${file.type || 'unknown'}' is not supported. Please upload a JPG, PNG, or PDF file.`,
    };
  }

  if (file.size > maxSizeBytes) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds maximum allowed limit of 20 MB.`,
    };
  }

  return { valid: true };
}

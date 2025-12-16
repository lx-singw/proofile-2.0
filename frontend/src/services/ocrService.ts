/**
 * OCR Service
 * Handles document upload and extraction for verification
 */

export interface OCRResult {
    document_id: string;
    status: "processing" | "complete" | "failed";
    extracted_data?: {
        company_name?: string;
        job_title?: string;
        dates?: {
            start?: string;
            end?: string;
        };
        confidence: number;
    };
    error?: string;
}

export interface UploadProgress {
    phase: "uploading" | "analyzing" | "matching" | "complete";
    progress: number;
    message: string;
}

/**
 * Upload a document for OCR verification
 */
export async function uploadDocument(
    file: File,
    targetType: "employment" | "education",
    targetId?: string,
    onProgress?: (progress: UploadProgress) => void
): Promise<OCRResult> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("target_type", targetType);
    if (targetId) {
        formData.append("target_id", targetId);
    }

    onProgress?.({
        phase: "uploading",
        progress: 0,
        message: "Uploading document...",
    });

    const response = await fetch("/api/v1/verify/documents/upload", {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Upload failed");
    }

    const initialResult = await response.json();

    onProgress?.({
        phase: "analyzing",
        progress: 30,
        message: "Analyzing document...",
    });

    // Poll for completion
    return pollForResult(initialResult.document_id, onProgress);
}

/**
 * Poll for OCR result
 */
async function pollForResult(
    documentId: string,
    onProgress?: (progress: UploadProgress) => void,
    maxAttempts = 30
): Promise<OCRResult> {
    let attempts = 0;

    while (attempts < maxAttempts) {
        const response = await fetch(`/api/v1/verify/documents/${documentId}/status`);

        if (!response.ok) {
            throw new Error("Failed to check document status");
        }

        const result: OCRResult = await response.json();

        if (result.status === "complete") {
            onProgress?.({
                phase: "complete",
                progress: 100,
                message: "Analysis complete!",
            });
            return result;
        }

        if (result.status === "failed") {
            throw new Error(result.error || "Document analysis failed");
        }

        // Update progress
        const progress = Math.min(30 + (attempts / maxAttempts) * 60, 90);
        onProgress?.({
            phase: "analyzing",
            progress,
            message: attempts > 10 ? "Still analyzing..." : "Reading document...",
        });

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
    }

    throw new Error("Document analysis timed out");
}

/**
 * Upload a document from base64 data (for camera capture)
 */
export async function uploadBase64Document(
    base64Data: string,
    filename: string,
    targetType: "employment" | "education",
    targetId?: string,
    onProgress?: (progress: UploadProgress) => void
): Promise<OCRResult> {
    // Convert base64 to File
    const response = await fetch(base64Data);
    const blob = await response.blob();
    const file = new File([blob], filename, { type: blob.type });

    return uploadDocument(file, targetType, targetId, onProgress);
}

/**
 * Validate a file before upload
 */
export function validateDocument(file: File): { valid: boolean; error?: string } {
    const validTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf"
    ];

    if (!validTypes.includes(file.type)) {
        return {
            valid: false,
            error: "Invalid file type. Please upload JPG, PNG, or PDF.",
        };
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        return {
            valid: false,
            error: "File too large. Maximum size is 5MB.",
        };
    }

    return { valid: true };
}

export default {
    uploadDocument,
    uploadBase64Document,
    validateDocument,
};

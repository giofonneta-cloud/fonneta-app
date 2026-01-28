export interface OCRResult {
    provider_name: string;
    invoice_number: string;
    issue_date: string;
    total_amount: number;
    currency: string;
    tax_amount: number;
    confidence: number;
}

export const ocrService = {
    async processInvoice(file: File): Promise<OCRResult> {
        // Simulating OCR delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mock result
        return {
            provider_name: "Imprenta Los Andes S.A.S",
            invoice_number: "INV-2026-001",
            issue_date: new Date().toISOString().split('T')[0],
            total_amount: 2500.00,
            currency: "USD",
            tax_amount: 475.00,
            confidence: 0.92
        };
    }
};

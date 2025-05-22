export interface PaymentMessage {
    id: string;
    amount: number;
    currency: string;
    timestamp: Date;
    metadata?: Record<string, unknown>;
}
export declare class PaymentProcessor {
    private readonly batchSize;
    private readonly processingInterval;
    constructor(batchSize?: number, processingInterval?: number);
    startProcessing(): Promise<void>;
    private processBatch;
    private fetchMessages;
    private processPayment;
}

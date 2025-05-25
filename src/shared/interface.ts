export interface ProductVariant {
    id: number;
    product_id: number;
    sku: string;
    variant_name: string;
    price_adjustment: string;
    stock_quantity: number;
    created_at: Date;
    updated_at: Date;
}
export interface PaymentMessage {
    id: string;
    // this array must have less than 20 items.
    productVariants: { amount: number, id: number }[];
    shipingPromo?: string;
    discountPromo?: string;
    currency: string;
    timestamp: Date;
    metadata?: Record<string, unknown>;
}
export interface ProcessedPaymentMessage extends PaymentMessage {
    status: 'init' | 'pending' | 'failed'

}
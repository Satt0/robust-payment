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

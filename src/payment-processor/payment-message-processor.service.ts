import { executeQuery } from "../shared/db.utils";
import { PaymentMessage, ProcessedPaymentMessage, ProductVariant } from "../shared/interface";

export class PaymentMessageProcessor {
    private variantInfo = new Map<number, ProductVariant>();
    constructor() { }
    /**
     * PaymentMessageProcessor handles the processing of payment messages and manages product variant information.
     * It maintains an in-memory cache of product variant data and processes payment requests by checking
     * stock availability and updating quantities.
     */
    public async seedVariantInfo(ids: number[]) {
        const dbInfos = await executeQuery<ProductVariant>('SELECT * FROM product_variants WHERE id IN(:ids)', { ids: Array.from(new Set(ids)) })
        dbInfos.forEach(info => {
            this.variantInfo.set(info.id, info)
        })
    }
    /**
     * Processes a payment message by checking stock availability and updating quantities.
     * 
     * @param message - The payment message containing product variant information and payment details
     * @returns A processed payment message with updated status
     * 
     * The method:
     * 1. Creates a copy of the input message with 'pending' status
     * 2. Checks if all requested product variants are available in sufficient quantity
     * 3. Updates the status to 'failed' if any variant is out of stock
     * 4. Updates in-memory stock quantities if all variants are available
     * 
     * Note: Calculates payment result in memory and returns the processed payment
     */
    public handle(message: PaymentMessage): ProcessedPaymentMessage {
        const processedMessage: ProcessedPaymentMessage = { ...message, status: 'pending' }
        const dbVariants = message.productVariants.map(req => {
            if (this.variantInfo.has(req.id) && this.variantInfo.get(req.id)!.stock_quantity >= req.amount) {
                return req
            }
            return null;
        }).filter(e => !!e)

        if (dbVariants.length < message.productVariants.length) {
            // if some variant is out of stock, mark payment as failed
            processedMessage.status = 'failed'
        } else {
            // subtract variantInfo in memory, we still need update condition in later db update query
            for (const variant of message.productVariants) {
                this.variantInfo.get(variant.id)!.stock_quantity -= variant.amount
            }
        }
        return processedMessage
    }
}
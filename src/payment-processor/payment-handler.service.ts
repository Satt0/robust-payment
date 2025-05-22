import { executeQuery } from "../shared/db.utils";
import { ProductVariant } from "../shared/interface";
import { PaymentMessage } from "./payment-job.service";


export class PaymentHandler {
    private variantInfo = new Map<number, ProductVariant>();

    private handleMessage(message: PaymentMessage): { success: boolean, item: PaymentMessage } {
        const dbVariants = message.productVariants.map(req => {
            if (this.variantInfo.has(req.id) && this.variantInfo.get(req.id)!.stock_quantity >= req.amount) {
                return req
            }
            return null;
        }).filter(e => !!e)

        if (dbVariants.length < message.productVariants.length) {
            // failed
            return { success: false, item: message }
        }
        // subtract variantInfo in memory, we still need update condition in later db update query
        message.productVariants.forEach(e => {
            this.variantInfo.get(e.id)!.stock_quantity -= e.amount
        })
        return { success: true, item: message }
    }
    public async handleBatch(messages: PaymentMessage[]) {
        await this.getProductVariantInfoMap(messages.map(m => m.productVariants.map(v => v.id)).flat(1));

        // iterate over messages to check stock and save payments
        console.log(this.variantInfo, 'before');

        await this.savePayments(messages.map(e => this.handleMessage(e)));
        // success and failed payment will be saved to db.
        console.log(this.variantInfo, 'after');
    }
    private async getProductVariantInfoMap(variantId: number[]) {
        // we get the product variant info from db.
        const res = await executeQuery<ProductVariant>('SELECT * FROM product_variants WHERE id IN(:ids)', { ids: Array.from(new Set(variantId)) })
        res.forEach(e => {
            this.variantInfo.set(e.id, e)
        })
    }
    public async savePayments(data: { success: boolean, item: PaymentMessage }[]) {
    }
}
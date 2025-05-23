import { executeQuery, sequelize, TransactionExec } from "../shared/db.utils";
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
        console.log(messages);

        await this.getProductVariantInfoMap(messages.map(m => m.productVariants.map(v => v.id)).flat(1));
        console.log(this.variantInfo);

        // iterate over messages to check stock and save payments
        await this.savePayments(messages.map(e => this.handleMessage(e)));
        // success and failed payment will be saved to db.
    }
    private async getProductVariantInfoMap(variantId: number[]) {
        // we get the product variant info from db.
        const res = await executeQuery<ProductVariant>('SELECT * FROM product_variants WHERE id IN(:ids)', { ids: Array.from(new Set(variantId)) })
        res.forEach(e => {
            this.variantInfo.set(e.id, e)
        })
    }
    public async savePayments(data: { success: boolean, item: PaymentMessage }[]) {
        console.log(data);
        await TransactionExec(async (t) => {
            // update variant quantity
            const updateRes = await sequelize.query(
                `UPDATE product_variants 
                SET stock_quantity = CASE id 
                    ${data.map(e =>
                    e.success ?
                        e.item.productVariants.map(v =>
                            `WHEN ${v.id} THEN CASE 
                                WHEN stock_quantity >= ${v.amount} THEN stock_quantity - ${v.amount}
                                ELSE stock_quantity
                            END`
                        ).join(' ') : ''
                ).filter(Boolean).join(' ')}
                    ELSE stock_quantity 
                END
                WHERE id IN (:ids)`,
                {
                    replacements: {
                        ids: data
                            .filter(e => e.success)
                            .map(e => e.item.productVariants.map(v => v.id))
                            .flat()
                    },
                    transaction: t
                }
            );
            // if some variant is not updated, which means the stock may be negative if we continue, throw error to rollback

            // if (updateRes[1] !== data
            //     .filter(e => e.success)
            //     .map(e => e.item.productVariants.map(v => v.id))
            //     .flat()
            //     .filter((value, index, self) => self.indexOf(value) === index)
            //     .length) {
            //     throw new Error('Stock update failed - affected rows mismatch');
            // }
            // insert payment records, both success and fail
            // await sequelize.query(
            //     'INSERT INTO payments (id, amount, status, created_at, updated_at) VALUES :values',
            //     {
            //         replacements: { values: data.map(e => ({ ...e.item, status: e.success ? 'pending' : 'failed' })) },
            //         transaction: t
            //     })

        })
    }
}
import { TransactionExec } from "../shared/db.utils";
import { PaymentMessage, ProcessedPaymentMessage } from "../shared/interface";
import { savePayment, updateStock } from "../shared/payment.repository";
import { PaymentMessageProcessor } from "./payment-message-processor.service";

export class PaymentHandler {
    private processor: PaymentMessageProcessor
    constructor() {
        this.processor = new PaymentMessageProcessor()
    }

    public async handleBatch(messages: PaymentMessage[]) {
        const allProductVariantIdsInBatch = messages.map(m => m.productVariants.map(v => v.id)).flat(1)
        await this.processor.seedVariantInfo(allProductVariantIdsInBatch);

        const processedPayment = messages.map(m => this.processor.handle(m))
        await this.updateStockAndSavePayment(processedPayment);
    }

    public async updateStockAndSavePayment(data: ProcessedPaymentMessage[]) {
        await TransactionExec(async (t) => {
            // update variant quantity
            await updateStock(t, data, false)
            // insert payment records, both success and fail
            await savePayment(t, data)
        })
    }
}
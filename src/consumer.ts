import { PaymentHandler } from "./payment-processor/payment-handler.service";
import { QUEUE_NAME } from "./shared/constant";
import { createConsumer } from "./shared/kafka.utils";


const consume = async () => {
    const kafkaConsumer = await createConsumer('test-group-id123')
    kafkaConsumer.subscribe({
        topic: QUEUE_NAME,
    })
    // Get messages in batch
    await kafkaConsumer.run({
        eachBatch: async (messages) => {
            try {
                const paymentHandler = new PaymentHandler()
                await paymentHandler.handleBatch(messages.batch.messages.map(e => (JSON.parse(e.value!.toString()))))
            } catch (error) {
                console.log(error);
            }
        },

    })

}

consume()
// a producer that sends messages to the queue
import { v4 as uuidv4 } from 'uuid';
import { QUEUE_NAME } from './shared/constant';
import dotenv from 'dotenv';
import { createProducer } from './shared/kafka.utils';

dotenv.config();



async function addPendingPayments(numMessages: number): Promise<void> {
    // Connect to RabbitMQ
    const kafkaProducer = await createProducer()

    try {
        const messages = []
        // Generate and send messages
        for (let i = 0; i < numMessages; i++) {
            const message = {
                id: uuidv4(),
                productVariants: [{
                    id: Math.floor(Math.random() * 1000) + 1,
                    amount: Math.floor(Math.random() * 5) + 1
                }],
                currency: 'USD',
                timestamp: new Date()
            };

            messages.push({ value: JSON.stringify(message) })
        }
        const res = await kafkaProducer.send({
            messages,
            topic: QUEUE_NAME,
            acks: 1
        })
        console.log(res);

    } catch (error) {
        console.error('Error in addPendingPayments:', error);
    } finally {
        kafkaProducer.disconnect()
    }
}

export { addPendingPayments };

addPendingPayments(100);
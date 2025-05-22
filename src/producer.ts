// a producer that sends messages to the queue
import { v4 as uuidv4 } from 'uuid';
import { createConnection, pushToQueue } from './shared/rabbit.utils';
import { QUEUE_NAME } from './shared/constant';
import dotenv from 'dotenv';

dotenv.config();

const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'localhost';
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || '5672';
const RABBITMQ_USER = process.env.RABBITMQ_USER || 'payment_user';
const RABBITMQ_PASSWORD = process.env.RABBITMQ_PASSWORD || 'payment_password';

async function addPendingPayments(numMessages: number, userId: string): Promise<void> {
    // Connect to RabbitMQ
    const connection = await createConnection();
    const channel = await connection.createChannel();
    try {
        // Generate and send messages
        for (let i = 0; i < numMessages; i++) {
            const message = {
                id: uuidv4(),
                userId: userId,
                productId: Math.floor(Math.random() * 1000) + 1, // Random product ID between 1 and 1000
                timestamp: new Date().toISOString()
            };

            pushToQueue(channel, QUEUE_NAME, message);
        }

    } catch (error) {
        console.error('Error in addPendingPayments:', error);
    } finally {
        await channel.close();
        await connection.close();
    }
}

export { addPendingPayments };

addPendingPayments(10, '123');
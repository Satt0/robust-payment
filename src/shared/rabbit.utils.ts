import amqp from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();

// Create a connection to RabbitMQ
export async function createConnection() {
    try {
        const hostname = process.env.RABBITMQ_HOST || 'localhost';
        const port = process.env.RABBITMQ_PORT || '5672';
        const username = process.env.RABBITMQ_USER || 'payment_user';
        const password = process.env.RABBITMQ_PASSWORD || 'payment_password';

        const connection = await amqp.connect(`amqp://${username}:${password}@${hostname}:${port}`);
        return connection;
    } catch (error) {
        console.error('Error creating RabbitMQ connection:', error);
        throw error;
    }
}


// Push a message to a queue
export async function pushToQueue(channel: amqp.Channel, queueName: string, message: any) {
    try {
        const messageBuffer = Buffer.from(JSON.stringify(message));
        channel.sendToQueue(queueName, messageBuffer, {
            persistent: true
        });
        console.log(`Message pushed to queue ${queueName}:`, message);
    } catch (error) {
        console.error('Error pushing to queue:', error);
        throw error;
    }
}

// Read messages from a queue
export async function readFromQueue(channel: amqp.Channel, queueName: string, callback: (message: any) => void) {
    try {
        await channel.consume(queueName, (msg) => {
            if (msg !== null) {
                const content = JSON.parse(msg.content.toString());
                callback(content);
                channel.ack(msg);
            }
        });
    } catch (error) {
        console.error('Error reading from queue:', error);
        throw error;
    }
}

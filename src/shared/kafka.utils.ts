import { Kafka, Producer, Consumer } from 'kafkajs';
import dotenv from 'dotenv';
import { assert } from 'console';

dotenv.config();
assert(!!process.env.KAFKA_PORT, 'missing kafka port')
// Create a Kafka instance
const kafka = new Kafka({
    clientId: 'payment-service',
    brokers: [`localhost:${process.env.KAFKA_PORT}`],
});

// Create a producer
export async function createProducer(): Promise<Producer> {
    try {
        const producer = kafka.producer();
        await producer.connect();
        console.log('Kafka producer connected successfully');
        return producer;
    } catch (error) {
        console.error('Error creating Kafka producer:', error);
        throw error;
    }
}

// Create a consumer
export async function createConsumer(groupId: string): Promise<Consumer> {
    try {
        const consumer = kafka.consumer({
            groupId,
            maxBytes: 12, // 1MB batch size
            maxWaitTimeInMs: 200, // Wait up to 5 seconds to fill the batch
            retry: {
                initialRetryTime: 100,
                retries: 8
            }
        });
        await consumer.connect();
        onCleanUp(consumer)
        console.log('Kafka consumer connected successfully');
        return consumer;
    } catch (error) {
        console.error('Error creating Kafka consumer:', error);
        throw error;
    }
}


function onCleanUp(kafkaConsumer: Consumer) {
    const handler = async () => {
        await kafkaConsumer.disconnect()
        process.exit(0)
    }
    process.on('exit', handler);

    // catches ctrl+c event
    process.on('SIGINT', handler);

    // catches "kill pid" (for example: nodemon restart)
    process.on('SIGUSR1', handler);
    process.on('SIGUSR2', handler);

    // catches uncaught exceptions
    process.on('uncaughtException', handler);
}
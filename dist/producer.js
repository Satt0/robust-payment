"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPendingPayments = addPendingPayments;
const amqplib_1 = __importDefault(require("amqplib"));
const uuid_1 = require("uuid");
async function addPendingPayments(numMessages, userId) {
    try {
        const connection = await amqplib_1.default.connect('amqp://payment_user:payment_password@localhost:5672');
        const channel = await connection.createChannel();
        const queueName = 'pending_payment';
        await channel.assertQueue(queueName, {
            durable: true
        });
        for (let i = 0; i < numMessages; i++) {
            const message = {
                id: (0, uuid_1.v4)(),
                userId: userId,
                productId: Math.floor(Math.random() * 1000) + 1,
                timestamp: new Date().toISOString()
            };
            channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
                persistent: true
            });
            console.log(`Message sent: ${JSON.stringify(message)}`);
        }
        await channel.close();
        await connection.close();
    }
    catch (error) {
        console.error('Error in addPendingPayments:', error);
        throw error;
    }
}
//# sourceMappingURL=producer.js.map
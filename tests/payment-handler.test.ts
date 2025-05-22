import { PaymentHandler } from '../src/payment-processor/payment-handler.service';
import { executeQuery } from '../src/shared/db.utils';
import { ProductVariant } from '../src/shared/interface';
import { PaymentMessage } from '../src/payment-processor/payment-job.service';

// Mock the executeQuery function
jest.mock('../src/shared/db.utils', () => ({
    executeQuery: jest.fn()
}));

describe('PaymentHandler', () => {
    let paymentHandler: PaymentHandler;
    const mockProductVariants: ProductVariant[] = [
        {
            id: 1,
            product_id: 1,
            sku: 'SKU1',
            variant_name: 'Variant 1',
            price_adjustment: '0',
            stock_quantity: 10,
            created_at: new Date(),
            updated_at: new Date()
        },
        {
            id: 2,
            product_id: 1,
            sku: 'SKU2',
            variant_name: 'Variant 2',
            price_adjustment: '0',
            stock_quantity: 15,
            created_at: new Date(),
            updated_at: new Date()
        }
    ];

    beforeEach(() => {
        paymentHandler = new PaymentHandler();
        // Reset all mocks before each test
        jest.clearAllMocks();
        // Setup default mock implementation
        (executeQuery as jest.Mock).mockResolvedValue(mockProductVariants);
    });

    describe('handleBatch', () => {
        it('should process valid payment messages successfully', async () => {
            const messages: PaymentMessage[] = [{
                id: 'test-1',
                productVariants: [
                    { id: 1, amount: 5 },
                    { id: 2, amount: 3 }
                ],
                currency: 'USD',
                timestamp: new Date()
            }];
            const savePaymentsSpy = jest.spyOn(paymentHandler, 'savePayments');

            await paymentHandler.handleBatch(messages);

            // verify variant stock is subtracted correctly, bypass private key
            expect((paymentHandler as any).variantInfo.get(1)?.stock_quantity).toEqual(5)
            // Verify executeQuery was called with correct parameters
            expect(executeQuery).toHaveBeenCalledWith(
                'SELECT * FROM product_variants WHERE id IN(:ids)',
                { ids: [1, 2] }
            );
            expect(savePaymentsSpy).toHaveBeenCalledWith([{
                success: true,
                item: messages[0]
            }]);
        });


    });

});

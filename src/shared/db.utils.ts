import { BindOrReplacements, QueryTypes, Sequelize, Transaction } from 'sequelize';

// Create a Sequelize instance
export const sequelize = new Sequelize({
    dialect: 'postgres',
    username: process.env.DB_USER || 'payment_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'payment_db',
    password: process.env.DB_PASSWORD || 'payment_password',
    port: parseInt(process.env.DB_PORT || '5432'),
});

// Execute a raw query
export async function executeQuery<T = any>(query: string, params?: BindOrReplacements): Promise<T[]> {
    try {
        return await sequelize.query(query, {
            replacements: params,
            type: QueryTypes.SELECT
        }) as T[];
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
}

/**
 * Executes a database transaction with automatic rollback on error
 * @param callback - Function to execute within the transaction context
 * @returns Promise that resolves when the transaction is complete
 * 
 * The function:
 * 1. Creates a new transaction
 * 2. Executes the provided callback with the transaction object
 * 3. Automatically rolls back the transaction if an error occurs
 * 4. Logs any transaction errors to the console
 * 
 * Example usage:
 * ```typescript
 * await TransactionExec(async (t) => {
 *   await updateStock(t, data);
 *   await savePayment(t, data);
 * });
 * ```
 */

export async function TransactionExec(callback: (t: Transaction) => any) {
    return sequelize.transaction(async (t) => {
        try {
            await callback(t)
        } catch (error) {
            console.log('tx error', error)
            await t.rollback()
        }
    });
}

// Close the connection when the application shuts down
export async function closePool(): Promise<void> {
    await sequelize.close();
}

// Example usage

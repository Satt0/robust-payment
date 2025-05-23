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

export async function TransactionExec(callback: (t: Transaction) => any) {
    return sequelize.transaction(async (t) => {
        try {
            await callback(t)
        } catch (error) {
            await t.rollback()
        } finally {
            await t.commit()
        }
    });
}

// Close the connection when the application shuts down
export async function closePool(): Promise<void> {
    await sequelize.close();
}

// Example usage

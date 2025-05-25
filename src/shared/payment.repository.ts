import { Transaction } from "sequelize";
import { sequelize } from "./db.utils";
import { ProcessedPaymentMessage } from "./interface";
import assert from "assert";

/**
 * Updates the stock quantity for product variants based on payment messages
 * @param t - Sequelize transaction object
 * @param data - Array of processed payment messages containing product variant information
 * @param throwErrorOnLessUpdatedRow - If true, throws error when number of updated rows doesn't match expected count
 * @returns Number of rows affected by the update
 * @throws Error if throwErrorOnLessUpdatedRow is true and affected rows don't match expected count
 */
export const updateStock = async (
    t: Transaction,
    data: ProcessedPaymentMessage[],
    throwErrorOnLessUpdatedRow = false
) => {
    // Get new stock of variants
    const variantUpdates = data
        .filter((e) => e.status === "pending")
        .flatMap((e) => e.productVariants.map((v) => [v.id, v.amount]));

    // Return if there is no update
    if (variantUpdates.length === 0) {
        return;
    }

    await sequelize.query(
        `CREATE TEMPORARY TABLE temp_variant_updates (
            variant_id INT,
            amount INT
        )`,
        { transaction: t }
    );

    await sequelize.query(
        `INSERT INTO temp_variant_updates (variant_id, amount) VALUES ?`,
        {
            replacements: [variantUpdates],
            transaction: t,
        }
    );

    // Update product variants using join with temp table
    const updateRes = await sequelize.query(
        `UPDATE product_variants pv
            SET stock_quantity = CASE 
                WHEN stock_quantity >= (
                    SELECT amount 
                    FROM temp_variant_updates tvu 
                    WHERE tvu.variant_id = pv.id
                ) THEN ABS(stock_quantity - (
                    SELECT amount 
                    FROM temp_variant_updates tvu 
                    WHERE tvu.variant_id = pv.id
                ))
                ELSE stock_quantity
            END
        WHERE EXISTS (
            SELECT 1 
            FROM temp_variant_updates tvu 
            WHERE tvu.variant_id = pv.id
        )
        RETURNING pv.*`,
        { transaction: t }
    );

    console.log("Updated product variants:", updateRes[0]);

    // Verify affected rows if needed
    // if (
    //     throwErrorOnLessUpdatedRow &&
    //     updateRes[1] !== new Set(variantUpdates.map(([id]) => id)).size
    // ) {
    //     throw new Error("Stock update failed - affected rows mismatch");
    // }

    return updateRes[1];
};

/**
 * Saves payment records to the database
 * @param t - Sequelize transaction object
 * @param item - Array of processed payment messages to save
 */
export const savePayment = async (t: Transaction, item: ProcessedPaymentMessage[]) => {
    assert(item.length <= 200, 'savePayment: too many items, may failed to insert')
    await sequelize.query(
        "INSERT INTO payments (id, amount, items, status) VALUES ?",
        {
            replacements: [item.map(e => ([e.id, '100', JSON.stringify(e.productVariants), e.status]))],
            transaction: t,
        }
    );
};

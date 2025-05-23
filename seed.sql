-- Seed users
INSERT INTO users (id, email, password_hash, first_name, last_name)
SELECT 
    gen_random_uuid(),
    'user_' || generate_series || '@example.com',
    '$2b$10$example_hash',
    'User' || generate_series,
    'LastName' || generate_series
FROM generate_series(1, 500);

-- Seed products
INSERT INTO products (name, description)
SELECT 
    'Product ' || generate_series,
    'Description for product ' || generate_series,
FROM generate_series(1, 1000);

-- Seed product variants
INSERT INTO product_variants (product_id, sku, variant_name, price, stock_quantity)
SELECT 
    p.id,
    'SKU-' || p.id || '-' || v.variant_num,
    'Variant ' || v.variant_num,
    (random() * 20 - 10)::decimal(10,2),
    floor(random() * 200 + 50)::integer
FROM products p
CROSS JOIN generate_series(1, 5) v(variant_num);
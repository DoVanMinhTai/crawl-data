import mysql from 'mysql2/promise';
import config from './config.js';

let pool = null;

/**
 * Initialize database connection pool
 */
export async function initDatabase() {
  if (pool) return pool;
  
  try {
    pool = mysql.createPool(config.database);
    console.log('✅ Database connection pool created');
    
    // Test connection
    const connection = await pool.getConnection();
    console.log('✅ Database connection successful');
    connection.release();
    
    return pool;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
}

/**
 * Get or create shop by name
 */
export async function getOrCreateShop(shopData) {
  const connection = await pool.getConnection();
  
  try {
    // Check if shop exists by name
    const [existing] = await connection.execute(
      'SELECT id FROM shops WHERE shop_name = ? LIMIT 1',
      [shopData.name]
    );
    
    if (existing.length > 0) {
      return existing[0].id;
    }
    
    // Create a dummy user for this shop (since user_id is UNIQUE)
    const userEmail = `shop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@chotot.crawler`;
    const [userResult] = await connection.execute(
      `INSERT INTO users (email, password_hash, full_name, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [
        userEmail,
        '$2a$10$dummyhash',
        shopData.name,
        'seller'
      ]
    );
    
    // Get the actual user ID
    const [insertedUser] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [userEmail]
    );
    
    const userId = insertedUser[0].id;
    
    // Create shop with the new user_id
    const [result] = await connection.execute(
      `INSERT INTO shops (user_id, shop_name, description, address, avg_rating, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        userId,
        shopData.name,
        `Seller from Chợ Tốt`,
        shopData.address || null,
        shopData.rating || 0.0
      ]
    );
    
    // Get the actual shop ID that was created
    const [insertedShop] = await connection.execute(
      'SELECT id FROM shops WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
    
    const shopId = insertedShop[0].id;
    
    console.log(`✅ Created shop: ${shopData.name} (ID: ${shopId})`);
    return shopId;
    
  } catch (error) {
    console.error(`❌ Shop creation failed: ${error.message}`);
    // Fallback: return first existing shop
    const [fallback] = await connection.execute('SELECT id FROM shops LIMIT 1');
    if (fallback.length > 0) {
      console.warn(`⚠️ Using fallback shop ID: ${fallback[0].id}`);
      return fallback[0].id;
    }
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Get category ID by slug
 */
export async function getCategoryBySlug(slug) {
  const connection = await pool.getConnection();
  
  try {
    const [rows] = await connection.execute(
      'SELECT id FROM categories WHERE slug = ? LIMIT 1',
      [slug]
    );
    
    if (rows.length === 0) {
      console.warn(`⚠️ Category not found: ${slug}, using default`);
      // Return first category as fallback
      const [fallback] = await connection.execute(
        'SELECT id FROM categories LIMIT 1'
      );
      return fallback.length > 0 ? fallback[0].id : null;
    }
    
    return rows[0].id;
    
  } finally {
    connection.release();
  }
}

/**
 * Insert product with all related data
 */
export async function insertProduct(productData) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 1. Get or create shop
    const shopId = await getOrCreateShop(productData.shop);
    
    // 2. Get category ID
    const categoryId = await getCategoryBySlug(productData.category_slug);
    
    if (!categoryId) {
      throw new Error('No valid category found');
    }
    
    // 3. Insert product
    const [productResult] = await connection.execute(
      `INSERT INTO products (name, description, price, stock, condition_status, brand, category_id, shop_id, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [
        productData.name,
        productData.description || null,
        productData.price,
        productData.stock || 1,
        productData.condition_status,
        productData.brand || null,
        categoryId,
        shopId
      ]
    );
    
    // Get the actual UUID that was generated
    const [productIdResult] = await connection.execute(
      'SELECT LAST_INSERT_ID() as id'
    );
    
    // For UUID primary keys, we need to get the actual ID differently
    const [insertedProduct] = await connection.execute(
      'SELECT id FROM products WHERE shop_id = ? AND name = ? ORDER BY created_at DESC LIMIT 1',
      [shopId, productData.name]
    );
    
    const productId = insertedProduct[0].id;
    console.log(`✅ Inserted product: ${productData.name} (ID: ${productId})`);
    
    // 4. Insert product images
    if (productData.images && productData.images.length > 0) {
      for (let i = 0; i < productData.images.length; i++) {
        const image = productData.images[i];
        await connection.execute(
          `INSERT INTO product_images (product_id, image_url, is_primary, sort_order, created_at)
           VALUES (?, ?, ?, ?, NOW())`,
          [productId, image.url, i === 0 ? 1 : 0, i]
        );
      }
      console.log(`✅ Inserted ${productData.images.length} images`);
    }
    
    // 5. Insert product variant
    if (productData.variant) {
      await connection.execute(
        `INSERT INTO product_variants (product_id, color, size, type, stock_qty, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          productId,
          productData.variant.color || 'other',
          productData.variant.size || 'freesize',
          productData.variant.type || 'other',
          productData.variant.stock_qty || 1
        ]
      );
      console.log(`✅ Inserted variant`);
    }
    
    await connection.commit();
    console.log(`✅ Product insertion complete (ID: ${productId})\n`);
    
    return productId;
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Product insertion failed:', error.message);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Check if product already exists by name
 */
export async function productExists(name) {
  const connection = await pool.getConnection();
  
  try {
    const [rows] = await connection.execute(
      'SELECT id FROM products WHERE name = ? LIMIT 1',
      [name]
    );
    
    return rows.length > 0;
    
  } finally {
    connection.release();
  }
}

/**
 * Get crawl statistics
 */
export async function getCrawlStats() {
  const connection = await pool.getConnection();
  
  try {
    const [products] = await connection.execute(
      'SELECT COUNT(*) as total FROM products'
    );
    
    const [images] = await connection.execute(
      'SELECT COUNT(*) as total FROM product_images'
    );
    
    const [shops] = await connection.execute(
      'SELECT COUNT(*) as total FROM shops'
    );
    
    return {
      products: products[0].total,
      images: images[0].total,
      shops: shops[0].total
    };
    
  } finally {
    connection.release();
  }
}

/**
 * Close database connection pool
 */
export async function closeDatabase() {
  if (pool) {
    await pool.end();
    console.log('✅ Database connection pool closed');
  }
}

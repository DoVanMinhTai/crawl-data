import dotenv from 'dotenv';
dotenv.config();

import mysql from 'mysql2/promise';
import config from './config.js';

async function seedDatabase() {
  console.log('🌱 Seeding database...\n');
  
  const connection = await mysql.createConnection(config.database);
  
  try {
    await connection.beginTransaction();
    
    // 1. Create dummy user for crawler shops
    console.log('👤 Creating crawler user...');
    const crawlerUserId = '00000000-0000-0000-0000-000000000001';
    
    try {
      await connection.execute(
        `INSERT INTO users (id, email, password, full_name, created_at, updated_at)
         VALUES (?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE id=id`,
        [crawlerUserId, 'crawler@system.local', 'N/A', 'Chợ Tốt Crawler']
      );
      console.log('✅ Crawler user created/verified\n');
    } catch (error) {
      console.log('⚠️ User creation skipped (may already exist)\n');
    }
    
    // 2. Insert categories
    console.log('📁 Creating categories...');
    
    const categories = [
      { name: "Men's Clothing", slug: 'mens-clothing' },
      { name: "Women's Clothing", slug: 'womens-clothing' },
      { name: 'Unisex', slug: 'unisex' },
      { name: 'Shoes', slug: 'shoes' },
      { name: 'Bags', slug: 'bags' },
      { name: 'Watches', slug: 'watches' },
      { name: 'Accessories', slug: 'accessories' }
    ];
    
    for (const cat of categories) {
      try {
        await connection.execute(
          `INSERT INTO categories (name, slug, created_at)
           VALUES (?, ?, NOW())
           ON DUPLICATE KEY UPDATE name=VALUES(name)`,
          [cat.name, cat.slug]
        );
        console.log(`✅ Category: ${cat.name} (${cat.slug})`);
      } catch (error) {
        console.log(`⚠️ Category ${cat.slug} may already exist`);
      }
    }
    
    await connection.commit();
    
    console.log('\n✅ Database seeding complete!\n');
    
    // Verify
    const [cats] = await connection.execute('SELECT id, name, slug FROM categories');
    console.log('📋 Available categories:');
    console.table(cats);
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Seeding failed:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

seedDatabase();

import dotenv from 'dotenv';
dotenv.config();

import mysql from 'mysql2/promise';
import config from './config.js';

async function checkSchema() {
  console.log('🔍 Checking database schema...\n');
  
  const connection = await mysql.createConnection(config.database);
  
  try {
    // Check shops table
    console.log('📋 SHOPS table structure:');
    const [shops] = await connection.execute('DESCRIBE shops');
    console.table(shops);
    
    // Check products table
    console.log('\n📋 PRODUCTS table structure:');
    const [products] = await connection.execute('DESCRIBE products');
    console.table(products);
    
    // Check product_images table
    console.log('\n📋 PRODUCT_IMAGES table structure:');
    const [images] = await connection.execute('DESCRIBE product_images');
    console.table(images);
    
    // Check product_variants table
    console.log('\n📋 PRODUCT_VARIANTS table structure:');
    const [variants] = await connection.execute('DESCRIBE product_variants');
    console.table(variants);
    
    // Check categories table
    console.log('\n📋 CATEGORIES table structure:');
    const [categories] = await connection.execute('DESCRIBE categories');
    console.table(categories);
    
    // Show sample categories
    console.log('\n📋 Available categories:');
    const [catData] = await connection.execute('SELECT id, name, slug FROM categories');
    console.table(catData);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkSchema();

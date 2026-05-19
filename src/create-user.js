import dotenv from 'dotenv';
dotenv.config();

import mysql from 'mysql2/promise';
import config from './config.js';

async function createCrawlerUser() {
  console.log('👤 Creating crawler user...\n');
  
  const connection = await mysql.createConnection(config.database);
  
  try {
    const crawlerUserId = '00000000-0000-0000-0000-000000000001';
    
    // Check if user exists
    const [existing] = await connection.execute(
      'SELECT id FROM users WHERE id = ?',
      [crawlerUserId]
    );
    
    if (existing.length > 0) {
      console.log('✅ Crawler user already exists\n');
      return;
    }
    
    // Create user
    await connection.execute(
      `INSERT INTO users (id, email, password_hash, full_name, phone, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        crawlerUserId,
        'crawler@chotot.system',
        '$2a$10$dummyhashedpasswordforCrawlerUser123456789',
        'Chợ Tốt Crawler System',
        '0000000000',
        'seller'
      ]
    );
    
    console.log('✅ Crawler user created successfully!');
    console.log(`   ID: ${crawlerUserId}`);
    console.log(`   Email: crawler@chotot.system\n`);
    
  } catch (error) {
    console.error('❌ Failed to create user:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

createCrawlerUser();

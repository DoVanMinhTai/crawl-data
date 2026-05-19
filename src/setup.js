import dotenv from 'dotenv';
dotenv.config();

import readline from 'readline';
import { testCloudinaryConnection } from './imageUploader.js';
import { initDatabase, getCrawlStats, closeDatabase } from './database.js';
import config from './config.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setup() {
  console.log('\n' + '='.repeat(60));
  console.log('🛠️  FASHION CRAWLER SETUP');
  console.log('='.repeat(60) + '\n');

  try {
    // 1. Check .env file
    console.log('📋 Step 1: Checking configuration...\n');
    
    if (!config.cloudinary.cloud_name || !config.cloudinary.api_key) {
      console.error('❌ Cloudinary credentials missing in .env file');
      console.log('\nPlease:');
      console.log('1. Copy .env.example to .env');
      console.log('2. Add your Cloudinary credentials from https://cloudinary.com/console');
      console.log('3. Run this setup again\n');
      process.exit(1);
    }
    
    if (!config.database.password) {
      console.error('❌ Database password missing in .env file');
      console.log('\nPlease add DB_PASSWORD to your .env file\n');
      process.exit(1);
    }
    
    console.log('✅ Configuration file found\n');

    // 2. Test Cloudinary
    console.log('📋 Step 2: Testing Cloudinary connection...\n');
    const cloudinaryOk = await testCloudinaryConnection();
    
    if (!cloudinaryOk) {
      console.error('\n❌ Cloudinary connection failed');
      console.log('\nPlease check:');
      console.log('- CLOUDINARY_CLOUD_NAME is correct');
      console.log('- CLOUDINARY_API_KEY is correct');
      console.log('- CLOUDINARY_API_SECRET is correct');
      console.log('- Your Cloudinary account is active\n');
      process.exit(1);
    }
    
    console.log('');

    // 3. Test Database
    console.log('📋 Step 3: Testing database connection...\n');
    
    try {
      await initDatabase();
      const stats = await getCrawlStats();
      
      console.log('✅ Database connection successful');
      console.log(`\nCurrent database state:`);
      console.log(`- Products: ${stats.products}`);
      console.log(`- Images: ${stats.images}`);
      console.log(`- Shops: ${stats.shops}\n`);
      
      await closeDatabase();
      
    } catch (error) {
      console.error('\n❌ Database connection failed:', error.message);
      console.log('\nPlease check:');
      console.log('- MySQL is running');
      console.log('- DB_HOST, DB_USER, DB_PASSWORD are correct');
      console.log('- Database "fashion_marketplace" exists');
      console.log('- Tables are created (run schema SQL file)\n');
      process.exit(1);
    }

    // 4. Summary
    console.log('='.repeat(60));
    console.log('✅ SETUP COMPLETE');
    console.log('='.repeat(60));
    console.log('\nYou can now run the crawler:');
    console.log('\n  Test mode (10 products):');
    console.log('  $ npm test');
    console.log('\n  Production mode (custom limit):');
    console.log('  $ node src/crawler.js --limit=50');
    console.log('\n  Full crawl (500 products):');
    console.log('  $ npm run crawl\n');
    
    const proceed = await question('Do you want to run a test crawl now? (y/n): ');
    
    if (proceed.toLowerCase() === 'y') {
      console.log('\n🚀 Starting test crawl...\n');
      rl.close();
      
      // Import and run crawler
      const { default: crawl } = await import('./crawler.js');
      
    } else {
      console.log('\n👋 Setup complete. Run crawler when ready!\n');
      rl.close();
    }

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error(error.stack);
    rl.close();
    process.exit(1);
  }
}

setup();

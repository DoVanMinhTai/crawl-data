import dotenv from 'dotenv';
dotenv.config();

import pLimit from 'p-limit';
import fs from 'fs';
import path from 'path';
import config from './config.js';
import { initDatabase, insertProduct, productExists, getCrawlStats, closeDatabase } from './database.js';
import { processImages, cleanupTempImages, testCloudinaryConnection } from './imageUploader.js';
import { 
  initBrowser, 
  extractProductUrls, 
  extractProductData, 
  transformProductData,
  addDelay 
} from './scraper.js';
import { validateProduct } from './utils.js';

// Parse command line arguments
const args = process.argv.slice(2);
const testMode = args.includes('--test');
const limitArg = args.find(arg => arg.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : (testMode ? 10 : 500);

// Error log
const errors = [];

/**
 * Log error to file
 */
function logError(productUrl, error) {
  const errorEntry = {
    url: productUrl,
    error: error.message,
    timestamp: new Date().toISOString()
  };
  
  errors.push(errorEntry);
  
  // Write to file
  const errorFile = path.join(process.cwd(), 'data', 'crawl_errors.json');
  const dir = path.dirname(errorFile);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(errorFile, JSON.stringify(errors, null, 2));
}

/**
 * Save successful products to backup file
 */
function saveProductBackup(products) {
  const backupFile = path.join(process.cwd(), 'data', 'products.json');
  const dir = path.dirname(backupFile);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(backupFile, JSON.stringify(products, null, 2));
  console.log(`💾 Backup saved: ${products.length} products`);
}

/**
 * Process single product
 */
async function processProduct(page, productUrl, productIndex, totalProducts) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📦 Processing product ${productIndex}/${totalProducts}`);
  console.log(`${'='.repeat(60)}`);
  
  try {
    // Check if product already exists
    const rawData = await extractProductData(page, productUrl);
    
    if (!rawData) {
      throw new Error('Failed to extract product data');
    }
    
    // Check if already in database
    const exists = await productExists(rawData.title);
    if (exists) {
      console.log('⏭️ Product already exists, skipping...');
      return { skipped: true, data: rawData };
    }
    
    // Transform data
    const productData = transformProductData(rawData);
    
    // Validate
    const validation = validateProduct(productData);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Process images
    console.log(`\n📸 Processing ${productData.images.length} images...`);
    const uploadedImages = await processImages(
      productData.images.map(img => img.url),
      `product_${Date.now()}_${productIndex}`
    );
    
    if (uploadedImages.length === 0) {
      console.warn('⚠️ No images uploaded, but continuing...');
    }
    
    productData.images = uploadedImages;
    
    // Insert into database
    console.log('\n💾 Inserting into database...');
    const productId = await insertProduct(productData);
    
    console.log(`✅ Product ${productIndex}/${totalProducts} completed (ID: ${productId})`);
    
    return { success: true, data: productData, id: productId };
    
  } catch (error) {
    console.error(`❌ Failed to process product ${productIndex}:`, error.message);
    logError(productUrl, error);
    return { error: true, message: error.message };
  }
}

/**
 * Main crawler function
 */
async function crawl() {
  console.log('\n' + '='.repeat(60));
  console.log('🕷️  CHỢ TỐT FASHION CRAWLER');
  console.log('='.repeat(60));
  console.log(`Mode: ${testMode ? 'TEST' : 'PRODUCTION'}`);
  console.log(`Limit: ${limit} products`);
  console.log(`Headless: ${config.crawler.headless}`);
  console.log('='.repeat(60) + '\n');
  
  let browser = null;
  let page = null;
  const successfulProducts = [];
  
  try {
    // 1. Test Cloudinary connection
    console.log('☁️ Testing Cloudinary connection...');
    const cloudinaryOk = await testCloudinaryConnection();
    if (!cloudinaryOk) {
      throw new Error('Cloudinary connection failed. Check your credentials in .env');
    }
    
    // 2. Initialize database
    console.log('\n💾 Initializing database...');
    await initDatabase();
    
    // 3. Initialize browser
    const browserData = await initBrowser();
    browser = browserData.browser;
    page = browserData.page;
    
    // 4. Extract product URLs
    const categoryUrl = config.urls.base + config.urls.categories.clothing;
    const productUrls = await extractProductUrls(page, categoryUrl, limit);
    
    if (productUrls.length === 0) {
      throw new Error('No product URLs found');
    }
    
    console.log(`\n📋 Found ${productUrls.length} products to crawl`);
    
    // 5. Process products with concurrency limit
    const limiter = pLimit(config.crawler.maxConcurrent);
    let processedCount = 0;
    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < productUrls.length; i++) {
      const productUrl = productUrls[i];
      
      const result = await limiter(async () => {
        return await processProduct(page, productUrl, i + 1, productUrls.length);
      });
      
      processedCount++;
      
      if (result.success) {
        successCount++;
        successfulProducts.push(result.data);
      } else if (result.skipped) {
        skippedCount++;
      } else if (result.error) {
        errorCount++;
      }
      
      // Add delay between products
      if (i < productUrls.length - 1) {
        await addDelay();
      }
      
      // Save backup every 10 products
      if (successfulProducts.length > 0 && successfulProducts.length % 10 === 0) {
        saveProductBackup(successfulProducts);
      }
    }
    
    // 6. Final statistics
    console.log('\n' + '='.repeat(60));
    console.log('📊 CRAWL STATISTICS');
    console.log('='.repeat(60));
    console.log(`Total processed: ${processedCount}`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`⏭️ Skipped: ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('='.repeat(60));
    
    // Database stats
    const dbStats = await getCrawlStats();
    console.log('\n📊 DATABASE STATISTICS');
    console.log('='.repeat(60));
    console.log(`Products: ${dbStats.products}`);
    console.log(`Images: ${dbStats.images}`);
    console.log(`Shops: ${dbStats.shops}`);
    console.log('='.repeat(60) + '\n');
    
    // Save final backup
    if (successfulProducts.length > 0) {
      saveProductBackup(successfulProducts);
    }
    
    console.log('✅ Crawl completed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Crawl failed:', error.message);
    console.error(error.stack);
    process.exit(1);
    
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    
    if (browser) {
      await browser.close();
      console.log('✅ Browser closed');
    }
    
    await closeDatabase();
    cleanupTempImages();
    
    console.log('✅ Cleanup complete\n');
  }
}

// Run crawler
crawl().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

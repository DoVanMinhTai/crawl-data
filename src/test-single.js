import dotenv from 'dotenv';
dotenv.config();

import { initBrowser, extractProductData, transformProductData } from './scraper.js';
import { validateProduct } from './utils.js';

async function testSingleProduct() {
  console.log('🧪 Testing single product extraction...\n');
  
  let browser = null;
  let page = null;
  
  try {
    const browserData = await initBrowser();
    browser = browserData.browser;
    page = browserData.page;
    
    const testUrl = 'https://www.chotot.com/mua-ban-quan-ao-quan-dong-da-ha-noi/132365841.htm';
    
    console.log('📄 Extracting data...\n');
    const rawData = await extractProductData(page, testUrl);
    
    if (!rawData) {
      console.error('❌ Failed to extract data');
      process.exit(1);
    }
    
    console.log('\n📊 Raw Data:');
    console.log(JSON.stringify(rawData, null, 2));
    
    console.log('\n🔄 Transforming data...\n');
    const productData = transformProductData(rawData);
    
    console.log('📊 Transformed Data:');
    console.log(JSON.stringify(productData, null, 2));
    
    console.log('\n✅ Validating...\n');
    const validation = validateProduct(productData);
    
    if (validation.valid) {
      console.log('✅ Product data is valid!');
    } else {
      console.log('❌ Validation errors:');
      validation.errors.forEach(err => console.log(`   - ${err}`));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testSingleProduct();

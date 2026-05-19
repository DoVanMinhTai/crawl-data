import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import config from './config.js';
import { 
  extractBrand, 
  extractSize, 
  extractColor, 
  mapCondition, 
  mapCategory,
  determineType,
  cleanPrice,
  sleep,
  randomDelay,
  getRandomUserAgent
} from './utils.js';

// Use stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

/**
 * Extract product URLs from listing page
 */
export async function extractProductUrls(page, categoryUrl, limit = 50) {
  console.log(`\n🔍 Extracting product URLs from: ${categoryUrl}`);
  
  try {
    await page.goto(categoryUrl, { 
      waitUntil: 'networkidle2',
      timeout: 60000 
    });
    
    // Wait for product listings to load
    await page.waitForSelector('a[href*=".htm"]', { timeout: 30000 });
    
    // Scroll to load more products (if infinite scroll)
    await autoScroll(page);
    
    // Extract product URLs
    const productUrls = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*=".htm"]'));
      const urls = links
        .map(link => link.href)
        .filter(url => url.includes('.htm') && !url.includes('javascript:'));
      
      // Remove duplicates
      return [...new Set(urls)];
    });
    
    console.log(`✅ Found ${productUrls.length} product URLs`);
    
    return productUrls.slice(0, limit);
    
  } catch (error) {
    console.error('❌ Failed to extract product URLs:', error.message);
    return [];
  }
}

/**
 * Extract product data from detail page
 */
export async function extractProductData(page, productUrl) {
  console.log(`\n📄 Extracting data from: ${productUrl}`);
  
  try {
    await page.goto(productUrl, { 
      waitUntil: 'networkidle2',
      timeout: 60000 
    });
    
    // Wait for main content
    await page.waitForSelector('h1, [class*="title"]', { timeout: 10000 });
    
    // Extract all data
    const data = await page.evaluate(() => {
      // Helper function to get text content safely
      const getText = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.textContent.trim() : null;
      };
      
      // Helper function to get all text matching selector
      const getAllText = (selector) => {
        const elements = document.querySelectorAll(selector);
        return Array.from(elements).map(el => el.textContent.trim());
      };
      
      // Extract title - H1 with specific class
      const title = getText('h1.h17lwlta') || getText('h1');
      
      // Extract price - look in body text for price pattern
      let price = null;
      const bodyText = document.body.innerText;
      const priceMatch = bodyText.match(/([\d.,]+)\s*đ/);
      if (priceMatch) {
        price = priceMatch[1];
      }
      
      // Extract description - look for "Mô tả chi tiết" section
      let description = null;
      const descHeaders = document.querySelectorAll('h2');
      for (const header of descHeaders) {
        if (header.textContent.includes('Mô tả chi tiết')) {
          const nextEl = header.nextElementSibling;
          if (nextEl) {
            description = nextEl.textContent.trim();
            break;
          }
        }
      }
      
      // Extract condition - look for "Đã sử dụng" or "Mới"
      let condition = null;
      if (bodyText.includes('Đã sử dụng')) {
        condition = 'Đã sử dụng';
      } else if (bodyText.includes('Mới')) {
        condition = 'Mới';
      }
      
      // Extract category - look for "Đồ nam", "Đồ nữ", etc.
      let category = null;
      if (bodyText.includes('Đồ nam')) {
        category = 'Đồ nam';
      } else if (bodyText.includes('Đồ nữ')) {
        category = 'Đồ nữ';
      } else if (bodyText.includes('Cả nam và nữ')) {
        category = 'Cả nam và nữ';
      }
      
      // Extract location - look for address pattern
      const locationMatch = bodyText.match(/(Phường|Quận|Huyện|Thành phố)[^\n]+/);
      const location = locationMatch ? locationMatch[0] : null;
      
      // Extract seller name - look for name near "Hoạt động"
      let sellerName = null;
      const lines = bodyText.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('Hoạt động') && i > 0) {
          sellerName = lines[i - 1].trim();
          break;
        }
      }
      
      // Extract rating - look for rating pattern
      const ratingMatch = bodyText.match(/([\d.]+)\s*\n\s*\d+\s*đánh giá/);
      const rating = ratingMatch ? ratingMatch[1] : null;
      
      // Extract images - CDN images only
      const images = [];
      const imgElements = document.querySelectorAll('img[src*="cdn.chotot.com"]');
      
      imgElements.forEach(img => {
        const src = img.src;
        if (src && !src.includes('icon') && !src.includes('logo') && !src.includes('avatar')) {
          images.push(src);
        }
      });
      
      return {
        title,
        price,
        description,
        condition,
        category,
        location,
        sellerName,
        rating,
        images: [...new Set(images)] // Remove duplicates
      };
    });
    
    // Validate extracted data
    if (!data.title || !data.price) {
      console.warn('⚠️ Missing critical data (title or price)');
      return null;
    }
    
    console.log(`✅ Extracted: ${data.title}`);
    console.log(`   Price: ${data.price}`);
    console.log(`   Condition: ${data.condition}`);
    console.log(`   Category: ${data.category}`);
    console.log(`   Images: ${data.images.length}`);
    console.log(`   Seller: ${data.sellerName}`);
    console.log(`   Location: ${data.location}`);
    console.log(`   Rating: ${data.rating}`);
    
    return data;
    
  } catch (error) {
    console.error('❌ Failed to extract product data:', error.message);
    return null;
  }
}

/**
 * Transform raw data to database format
 */
export function transformProductData(rawData) {
  const brand = extractBrand(rawData.title);
  const size = extractSize(rawData.title);
  const color = extractColor(rawData.title);
  const condition = mapCondition(rawData.condition);
  const categorySlug = mapCategory(rawData.category);
  const type = determineType(rawData.title, rawData.category);
  const price = cleanPrice(rawData.price);
  
  return {
    name: rawData.title,
    description: rawData.description,
    price: price,
    stock: 1,
    condition_status: condition,
    brand: brand,
    category_slug: categorySlug,
    shop: {
      name: rawData.sellerName || 'Unknown Seller',
      address: rawData.location,
      phone: null,
      rating: rawData.rating ? parseFloat(rawData.rating) : null
    },
    images: rawData.images.map(url => ({ url })),
    variant: {
      color: color,
      size: size,
      type: type,
      stock_qty: 1
    }
  };
}

/**
 * Auto-scroll page to load dynamic content
 */
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight || totalHeight > 3000) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

/**
 * Initialize browser with stealth settings
 */
export async function initBrowser() {
  console.log('🚀 Launching browser...');
  
  const browser = await puppeteer.launch({
    headless: config.crawler.headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920,1080'
    ]
  });
  
  const page = await browser.newPage();
  
  // Set viewport
  await page.setViewport({ width: 1920, height: 1080 });
  
  // Set random user agent
  await page.setUserAgent(getRandomUserAgent());
  
  // Set extra headers
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
  });
  
  console.log('✅ Browser launched successfully');
  
  return { browser, page };
}

/**
 * Add random delay between requests
 */
export async function addDelay() {
  const delay = randomDelay(config.crawler.delayMin, config.crawler.delayMax);
  console.log(`⏳ Waiting ${(delay / 1000).toFixed(1)}s...`);
  await sleep(delay);
}

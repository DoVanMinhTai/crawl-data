import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import dotenv from 'dotenv';

dotenv.config();
puppeteer.use(StealthPlugin());

async function inspectPage() {
  console.log('🔍 Inspecting Chợ Tốt page structure...\n');
  
  const browser = await puppeteer.launch({
    headless: false, // Show browser
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    // Go to a product page
    const url = 'https://www.chotot.com/mua-ban-quan-ao-quan-dong-da-ha-noi/132365841.htm';
    console.log(`Navigating to: ${url}\n`);
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Wait a bit for dynamic content
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Extract all possible selectors
    const analysis = await page.evaluate(() => {
      const results = {
        allH1: [],
        allH2: [],
        allPriceClasses: [],
        allDescriptionClasses: [],
        allImages: [],
        bodyText: document.body.innerText.substring(0, 500)
      };
      
      // Find all h1, h2
      document.querySelectorAll('h1').forEach(el => {
        results.allH1.push({
          text: el.textContent.trim(),
          classes: el.className,
          id: el.id
        });
      });
      
      document.querySelectorAll('h2').forEach(el => {
        results.allH2.push({
          text: el.textContent.trim(),
          classes: el.className,
          id: el.id
        });
      });
      
      // Find elements with "price" in class
      document.querySelectorAll('[class*="price"], [class*="Price"], [class*="gia"]').forEach(el => {
        results.allPriceClasses.push({
          text: el.textContent.trim(),
          classes: el.className,
          tag: el.tagName
        });
      });
      
      // Find elements with "description" in class
      document.querySelectorAll('[class*="description"], [class*="Description"], [class*="content"]').forEach(el => {
        if (el.textContent.trim().length > 20 && el.textContent.trim().length < 500) {
          results.allDescriptionClasses.push({
            text: el.textContent.trim().substring(0, 100),
            classes: el.className,
            tag: el.tagName
          });
        }
      });
      
      // Find all images
      document.querySelectorAll('img').forEach(el => {
        const src = el.src || el.getAttribute('data-src');
        if (src && !src.includes('icon') && !src.includes('logo')) {
          results.allImages.push({
            src: src.substring(0, 100),
            alt: el.alt,
            classes: el.className
          });
        }
      });
      
      return results;
    });
    
    console.log('📊 Analysis Results:\n');
    console.log('='.repeat(60));
    
    console.log('\n🏷️ H1 Elements:');
    analysis.allH1.forEach((h1, i) => {
      console.log(`  ${i + 1}. "${h1.text}"`);
      console.log(`     Class: ${h1.classes}`);
      console.log(`     ID: ${h1.id}`);
    });
    
    console.log('\n🏷️ H2 Elements:');
    analysis.allH2.slice(0, 5).forEach((h2, i) => {
      console.log(`  ${i + 1}. "${h2.text}"`);
      console.log(`     Class: ${h2.classes}`);
    });
    
    console.log('\n💰 Price Elements:');
    analysis.allPriceClasses.slice(0, 5).forEach((price, i) => {
      console.log(`  ${i + 1}. "${price.text}"`);
      console.log(`     Class: ${price.classes}`);
      console.log(`     Tag: ${price.tag}`);
    });
    
    console.log('\n📝 Description Elements:');
    analysis.allDescriptionClasses.slice(0, 3).forEach((desc, i) => {
      console.log(`  ${i + 1}. "${desc.text}..."`);
      console.log(`     Class: ${desc.classes}`);
    });
    
    console.log('\n🖼️ Images Found:', analysis.allImages.length);
    analysis.allImages.slice(0, 3).forEach((img, i) => {
      console.log(`  ${i + 1}. ${img.src}...`);
    });
    
    console.log('\n📄 Body Text Preview:');
    console.log(analysis.bodyText);
    
    console.log('\n' + '='.repeat(60));
    console.log('\n⏸️ Browser will stay open for 30 seconds for manual inspection...');
    console.log('Press Ctrl+C to close early.\n');
    
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

inspectPage();

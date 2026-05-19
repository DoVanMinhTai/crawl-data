# Puppeteer Crawler - Build Complete ✅

**Date:** 2026-05-18  
**Status:** Ready to use  
**Location:** `C:\Users\dotai\.openclaw\workspace\fashion-crawler`

---

## ✅ What's Built

### Core Files
- ✅ `src/crawler.js` - Main crawler orchestration
- ✅ `src/scraper.js` - Puppeteer scraping logic with stealth mode
- ✅ `src/database.js` - MySQL operations (insert products, shops, images, variants)
- ✅ `src/imageUploader.js` - Cloudinary image upload pipeline
- ✅ `src/utils.js` - Brand/size/color extraction, data transformation
- ✅ `src/config.js` - Configuration management
- ✅ `src/setup.js` - Setup verification script

### Documentation
- ✅ `README.md` - Full documentation
- ✅ `QUICKSTART.md` - 5-minute quick start guide
- ✅ `package.json` - Dependencies and scripts
- ✅ `.env.example` - Configuration template
- ✅ `.gitignore` - Git ignore rules

---

## ✅ Setup Verification Results

```
🛠️  FASHION CRAWLER SETUP

📋 Step 1: Checking configuration...
✅ Configuration file found

📋 Step 2: Testing Cloudinary connection...
✅ Cloudinary connection successful
   - Cloud: dbbrcjdsk
   - Rate limit: 500 requests
   - Status: Active

📋 Step 3: Testing database connection...
✅ Database connection successful
   - Host: localhost
   - Database: fashion
   - Current state:
     • Products: 0
     • Images: 0
     • Shops: 0
```

---

## 🚀 How to Use

### 1. Install Dependencies (First Time Only)
```bash
cd C:\Users\dotai\.openclaw\workspace\fashion-crawler
npm install
```

### 2. Run Test Crawl (10 products)
```bash
npm test
```

### 3. Run Production Crawl
```bash
# 50 products
node src/crawler.js --limit=50

# 500 products (full)
npm run crawl
```

---

## 📊 What It Does

1. **Extract URLs**: Navigates to Chợ Tốt clothing category, extracts product links
2. **Scrape Data**: For each product:
   - Title, price, description, condition
   - Seller name, location, rating
   - All product images
3. **Transform Data**:
   - Extract brand from title (Tommy Hilfiger, Nike, Adidas, etc.)
   - Extract size (S, M, L, XL, etc.)
   - Extract color (Vietnamese → English)
   - Map condition (Mới → new, Đã sử dụng → like_new)
   - Map category (Đồ nam → mens-clothing, etc.)
4. **Upload Images**: Download → Upload to Cloudinary → Get permanent URLs
5. **Insert Database**:
   - Create/find shop
   - Insert product with all fields
   - Insert images (with primary flag)
   - Insert variant (color, size, type)
6. **Backup**: Save to `data/products.json` every 10 products

---

## 🎯 Features

- ✅ **Stealth Mode**: Puppeteer with stealth plugin to avoid detection
- ✅ **Rate Limiting**: 3-5 second delays, max 2 concurrent
- ✅ **User-Agent Rotation**: Random user agents
- ✅ **Error Handling**: Logs failed products to `data/crawl_errors.json`
- ✅ **Duplicate Detection**: Skips products already in database
- ✅ **Transaction Safety**: Database rollback on errors
- ✅ **Progress Tracking**: Real-time console output
- ✅ **Automatic Backup**: JSON backup every 10 products
- ✅ **Image Pipeline**: Cloudinary CDN with permanent URLs
- ✅ **Data Validation**: Validates before insertion

---

## 📁 Output Files

After crawling:
```
fashion-crawler/
├── data/
│   ├── products.json       # Backup of all scraped products
│   └── crawl_errors.json   # Log of failed products
└── temp_images/            # (auto-deleted after upload)
```

---

## 🔧 Configuration

Your current `.env` settings:
```env
# Cloudinary
CLOUDINARY_CLOUD_NAME=dbbrcjdsk ✅
CLOUDINARY_API_KEY=355376229982188 ✅
CLOUDINARY_API_SECRET=*** ✅

# Database
DB_HOST=localhost ✅
DB_USER=root ✅
DB_PASSWORD=admin ✅
DB_NAME=fashion ✅
DB_PORT=3306 ✅

# Crawler
CRAWL_DELAY_MIN=3000 (3 seconds)
CRAWL_DELAY_MAX=5000 (5 seconds)
MAX_CONCURRENT=2 (parallel processing)
DAILY_LIMIT=500 (safety limit)
HEADLESS=true (no browser window)
```

---

## ⚠️ Important Notes

### Database Schema
Make sure your `fashion` database has these tables:
- `products` (with columns: name, description, price, stock, condition_status, brand, category_id, shop_id, is_active)
- `product_images` (with columns: product_id, image_url, is_primary, sort_order)
- `product_variants` (with columns: product_id, color, size, type, stock_qty)
- `shops` (with columns: name, address, phone, rating, is_active)
- `categories` (with columns: id, name, slug)

### Legal Notice
⚠️ This crawler is for **educational/personal use only**:
- Chợ Tốt's ToS likely prohibits scraping
- Do NOT use for commercial purposes
- Do NOT overload their servers
- Respect rate limits (500 products/day max)

---

## 📊 Expected Performance

**Test crawl (10 products):**
- Time: ~5-10 minutes
- Success rate: ~80-90%
- Images per product: 1-5
- Database inserts: 10 products, 20-50 images, 5-10 shops

**Full crawl (500 products):**
- Time: ~4-6 hours
- Success rate: ~80-90%
- Total images: 1000-2500
- Cloudinary usage: ~2-5GB

---

## 🐛 Troubleshooting

### "Cannot find module"
```bash
npm install
```

### "No product URLs found"
- Chợ Tốt may have changed HTML structure
- Try with `HEADLESS=false` to see browser
- Check if website is accessible

### "Image upload failed"
- Check Cloudinary quota (25GB/month free)
- Verify API credentials
- Check network connection

### "Database insertion failed"
- Verify table schema matches
- Check foreign key constraints
- Ensure categories table has data

---

## 🎯 Next Steps

1. **Install dependencies**: `npm install`
2. **Run test crawl**: `npm test`
3. **Check results**: 
   - Database: `SELECT * FROM products LIMIT 10;`
   - Backup: `data/products.json`
   - Cloudinary: https://cloudinary.com/console/media_library
4. **Adjust settings** if needed (delay, concurrency, etc.)
5. **Run production crawl** when ready

---

## 📞 Support

- Check `README.md` for detailed documentation
- Check `QUICKSTART.md` for quick start guide
- Review `data/crawl_errors.json` for failed products
- Check console output for real-time progress

---

**Status:** ✅ Ready to crawl!  
**Command:** `npm test` (start with 10 products)

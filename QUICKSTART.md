# Fashion Crawler - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Install Dependencies
```bash
cd C:\Users\dotai\.openclaw\workspace\fashion-crawler
npm install
```

### 2. Get Cloudinary Credentials

**Free Account Setup:**
1. Go to https://cloudinary.com/users/register_free
2. Sign up (free tier: 25GB storage, 25GB bandwidth/month)
3. After login, go to Dashboard: https://cloudinary.com/console
4. Copy these values:
   - Cloud Name
   - API Key
   - API Secret

### 3. Configure Environment

Copy `.env.example` to `.env`:
```bash
copy .env.example .env
```

Edit `.env` and fill in your credentials:
```env
# Cloudinary (from step 2)
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here

# Database (your MySQL credentials)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=fashion_marketplace
DB_PORT=3306
```

### 4. Verify Setup
```bash
node src/setup.js
```

This will:
- ✅ Check your configuration
- ✅ Test Cloudinary connection
- ✅ Test database connection
- ✅ Show current database stats

### 5. Run Test Crawl (10 products)
```bash
npm test
```

### 6. Run Production Crawl
```bash
# 50 products
node src/crawler.js --limit=50

# 500 products (full)
npm run crawl
```

## 📊 What to Expect

**Test crawl (10 products) takes ~5-10 minutes:**
- Extract 10 product URLs
- Scrape each product page
- Download and upload images to Cloudinary
- Insert into database
- Generate backup JSON

**Console output:**
```
🕷️  CHỢ TỐT FASHION CRAWLER
Mode: TEST
Limit: 10 products

☁️ Testing Cloudinary connection...
✅ Cloudinary connection successful

💾 Initializing database...
✅ Database connection successful

🚀 Launching browser...
✅ Browser launched successfully

🔍 Extracting product URLs...
✅ Found 50 product URLs

📦 Processing product 1/10
✅ Extracted: Áo thun Tommy Hilfiger Nữ size S Xám
📸 Processing 3 images...
✅ Image 1 uploaded successfully
💾 Inserting into database...
✅ Product 1/10 completed (ID: 123)

...

📊 CRAWL STATISTICS
Total processed: 10
✅ Success: 8
⏭️ Skipped: 1
❌ Errors: 1
```

## 🔧 Troubleshooting

### "Cannot find module 'puppeteer'"
```bash
npm install
```

### "Cloudinary connection failed"
- Double-check credentials in `.env`
- Make sure no extra spaces
- Verify account is active

### "Database connection failed"
- Check MySQL is running: `mysql -u root -p`
- Verify database exists: `SHOW DATABASES;`
- Check password in `.env`

### "No product URLs found"
- Chợ Tốt may have changed structure
- Try with `HEADLESS=false` in `.env` to see browser
- Check if website is accessible

## 📁 Output Files

After crawling, you'll find:

```
fashion-crawler/
├── data/
│   ├── products.json       # Backup of all scraped products
│   └── crawl_errors.json   # Log of failed products
└── temp_images/            # (auto-deleted after upload)
```

## 🎯 Next Steps

1. **Run test crawl** to verify everything works
2. **Check database** to see inserted products
3. **Review `data/products.json`** for backup
4. **Adjust settings** in `.env` if needed:
   - `CRAWL_DELAY_MIN/MAX` - Speed vs detection risk
   - `MAX_CONCURRENT` - Parallel processing
   - `HEADLESS` - See browser (debugging)

## 💡 Tips

- **Start small**: Test with 10 products first
- **Monitor logs**: Watch for errors or blocks
- **Respect limits**: Don't exceed 500 products/day
- **Check Cloudinary**: Monitor your usage at https://cloudinary.com/console
- **Backup data**: `data/products.json` is your safety net

## 🆘 Need Help?

Check the main README.md for detailed documentation.

---

**Ready?** Run `npm test` to start! 🚀

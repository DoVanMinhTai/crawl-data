# Fashion Crawler

Automated web crawler for extracting fashion product data from Chợ Tốt (chotot.com) and populating the `fashion_marketplace` database.

## Features

- 🕷️ Puppeteer-based scraping with stealth mode
- ☁️ Automatic image upload to Cloudinary
- 💾 MySQL database integration
- 🔄 Concurrent processing with rate limiting
- 📊 Progress tracking and statistics
- 🛡️ Anti-bot detection avoidance
- 💾 Automatic backup to JSON files
- ⚠️ Error logging and recovery

## Prerequisites

- Node.js 18+ 
- MySQL database (fashion_marketplace schema)
- Cloudinary account (free tier)

## Installation

```bash
cd fashion-crawler
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` with your credentials:
```env
# Cloudinary (get from https://cloudinary.com/console)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=fashion_marketplace
DB_PORT=3306

# Crawler settings (optional)
CRAWL_DELAY_MIN=3000
CRAWL_DELAY_MAX=5000
MAX_CONCURRENT=2
DAILY_LIMIT=500
HEADLESS=true
```

## Usage

### Test Mode (10 products)
```bash
npm test
```

### Production Mode (custom limit)
```bash
node src/crawler.js --limit=50
```

### Full Crawl (500 products)
```bash
npm run crawl
```

## Project Structure

```
fashion-crawler/
├── src/
│   ├── crawler.js          # Main entry point
│   ├── scraper.js          # Puppeteer scraping logic
│   ├── database.js         # MySQL operations
│   ├── imageUploader.js    # Cloudinary image handling
│   ├── utils.js            # Helper functions
│   └── config.js           # Configuration
├── data/
│   ├── products.json       # Backup of scraped products
│   └── crawl_errors.json   # Failed products log
├── temp_images/            # Temporary image storage (auto-deleted)
├── .env                    # Environment variables
├── .env.example            # Environment template
├── package.json
└── README.md
```

## How It Works

1. **Initialize**: Connect to database and Cloudinary
2. **Extract URLs**: Navigate to category page and extract product links
3. **Scrape Data**: For each product:
   - Navigate to detail page
   - Extract title, price, description, images, seller info
   - Transform data to match database schema
4. **Process Images**: 
   - Download images from Chợ Tốt
   - Upload to Cloudinary
   - Get permanent URLs
5. **Insert Database**:
   - Create/find shop
   - Insert product
   - Insert images
   - Insert variant
6. **Backup**: Save to JSON every 10 products

## Data Mapping

### Product Fields
- **Title** → `products.name`
- **Price** → `products.price` (cleaned, numeric)
- **Description** → `products.description`
- **Condition** → `products.condition_status` (new/like_new/good)
- **Brand** → `products.brand` (extracted from title)

### Automatic Extraction
- **Brand**: Tommy Hilfiger, Nike, Adidas, etc.
- **Size**: S, M, L, XL, XXL, XXXL, freesize
- **Color**: Black, white, gray, red, blue, etc.
- **Type**: top, bottom, dress, shoes, bag, accessories

### Category Mapping
- Đồ nam → mens-clothing
- Đồ nữ → womens-clothing
- Cả nam và nữ → unisex
- Giày dép → shoes
- Túi xách → bags

## Rate Limiting

- **Delay between requests**: 3-5 seconds (random)
- **Max concurrent**: 2 products
- **Daily limit**: 500 products
- **User-Agent rotation**: Yes
- **Stealth mode**: Enabled

## Error Handling

- Failed products logged to `data/crawl_errors.json`
- Automatic retry on network errors (max 3 times)
- Continues on image upload failure
- Skips products already in database
- Transaction rollback on database errors

## Output

### Console
```
🕷️  CHỢ TỐT FASHION CRAWLER
Mode: TEST
Limit: 10 products
Headless: true

☁️ Testing Cloudinary connection...
✅ Cloudinary connection successful

💾 Initializing database...
✅ Database connection successful

🚀 Launching browser...
✅ Browser launched successfully

🔍 Extracting product URLs from: https://www.chotot.com/mua-ban-quan-ao
✅ Found 50 product URLs

📦 Processing product 1/10
📄 Extracting data from: https://www.chotot.com/...
✅ Extracted: Áo thun Tommy Hilfiger Nữ size S Xám
📸 Processing 3 images...
☁️ Uploading to Cloudinary...
✅ Image 1 uploaded successfully
💾 Inserting into database...
✅ Product 1/10 completed (ID: 123)

...

📊 CRAWL STATISTICS
Total processed: 10
✅ Success: 8
⏭️ Skipped: 1
❌ Errors: 1

📊 DATABASE STATISTICS
Products: 108
Images: 324
Shops: 45
```

### Files Generated
- `data/products.json` - Backup of all scraped products
- `data/crawl_errors.json` - Log of failed products

## Troubleshooting

### "Cloudinary connection failed"
- Check your Cloudinary credentials in `.env`
- Verify account is active at https://cloudinary.com/console

### "Database connection failed"
- Verify MySQL is running
- Check database credentials in `.env`
- Ensure `fashion_marketplace` database exists

### "No product URLs found"
- Chợ Tốt may have changed their HTML structure
- Check if category URL is still valid
- Try running with `HEADLESS=false` to see browser

### "Too many errors"
- Reduce `MAX_CONCURRENT` to 1
- Increase `CRAWL_DELAY_MIN` to 5000
- Check if IP is blocked (try different network)

## Legal Notice

⚠️ **Important**: This crawler is for **educational and personal use only**.

- Chợ Tốt's Terms of Service likely prohibit automated scraping
- Do NOT use for commercial purposes
- Do NOT overload their servers
- Do NOT resell scraped data
- Respect rate limits and robots.txt

**Recommendation**: Contact Chợ Tốt for official API access if this is for production use.

## License

MIT

## Author

Tài - 2026

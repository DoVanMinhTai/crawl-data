import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root (one level up from src/)
dotenv.config({ path: join(__dirname, '..', '.env') });

export default {
  // Cloudinary
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  },

  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'fashion_marketplace',
    port: parseInt(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  },

  // Crawler settings
  crawler: {
    delayMin: parseInt(process.env.CRAWL_DELAY_MIN) || 3000,
    delayMax: parseInt(process.env.CRAWL_DELAY_MAX) || 5000,
    maxConcurrent: parseInt(process.env.MAX_CONCURRENT) || 2,
    dailyLimit: parseInt(process.env.DAILY_LIMIT) || 500,
    headless: process.env.HEADLESS !== 'false',
    userAgents: [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ]
  },

  // Target URLs
  urls: {
    base: process.env.BASE_URL || 'https://www.chotot.com',
    categories: {
      clothing: process.env.CATEGORY_CLOTHING || '/mua-ban-quan-ao',
      shoes: process.env.CATEGORY_SHOES || '/mua-ban-giay-dep',
      bags: process.env.CATEGORY_BAGS || '/mua-ban-tui-xach'
    }
  },

  // Brand list for extraction
  brands: [
    'Tommy Hilfiger', 'Nike', 'Adidas', 'Uniqlo', 'Lacoste',
    'Puma', 'Vans', 'Fila', 'Louis Vuitton', 'Gucci',
    'Balenciaga', 'Zara', 'H&M', 'Forever 21', 'Gap',
    'Levi\'s', 'Calvin Klein', 'Ralph Lauren', 'Burberry',
    'Việt Tiến', 'Blue Exchange', 'Bitis Hunter'
  ],

  // Size mapping
  sizes: {
    'XS': 'XS', 'S': 'S', 'M': 'M', 'L': 'L', 
    'XL': 'XL', 'XXL': 'XXL', 'XXXL': 'XXXL',
    'freesize': 'freesize', 'free size': 'freesize'
  },

  // Color mapping (Vietnamese -> English)
  colors: {
    'đen': 'black', 'trắng': 'white', 'xám': 'gray',
    'đỏ': 'red', 'xanh': 'blue', 'vàng': 'yellow',
    'hồng': 'pink', 'nâu': 'brown', 'cam': 'orange',
    'tím': 'purple', 'be': 'beige', 'xanh lá': 'green',
    'xanh dương': 'blue', 'xanh navy': 'navy'
  },

  // Condition mapping
  conditions: {
    'mới': 'new',
    'đã sử dụng': 'like_new',
    'cũ': 'good'
  },

  // Category mapping
  categoryMap: {
    'đồ nam': 'mens-clothing',
    'đồ nữ': 'womens-clothing',
    'cả nam và nữ': 'unisex',
    'giày dép': 'shoes',
    'túi xách': 'bags',
    'đồng hồ': 'watches'
  }
};

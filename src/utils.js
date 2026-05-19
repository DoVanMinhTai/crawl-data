import config from './config.js';

/**
 * Extract brand name from product title
 */
export function extractBrand(title) {
  if (!title) return null;
  
  const titleLower = title.toLowerCase();
  
  for (const brand of config.brands) {
    if (titleLower.includes(brand.toLowerCase())) {
      return brand;
    }
  }
  
  return null;
}

/**
 * Extract size from product title
 */
export function extractSize(title) {
  if (!title) return 'freesize';
  
  const titleLower = title.toLowerCase();
  
  // Check for explicit size mentions
  for (const [key, value] of Object.entries(config.sizes)) {
    const pattern = new RegExp(`\\bsize\\s*${key}\\b|\\b${key}\\b`, 'i');
    if (pattern.test(title)) {
      return value;
    }
  }
  
  return 'freesize';
}

/**
 * Extract color from product title
 */
export function extractColor(title) {
  if (!title) return 'other';
  
  const titleLower = title.toLowerCase();
  
  for (const [vietnamese, english] of Object.entries(config.colors)) {
    if (titleLower.includes(vietnamese)) {
      return english;
    }
  }
  
  return 'other';
}

/**
 * Map Vietnamese condition to DB enum
 */
export function mapCondition(condition) {
  if (!condition) return 'like_new';
  
  const conditionLower = condition.toLowerCase();
  
  for (const [vietnamese, english] of Object.entries(config.conditions)) {
    if (conditionLower.includes(vietnamese)) {
      return english;
    }
  }
  
  return 'like_new';
}

/**
 * Map Vietnamese category to DB category slug
 */
export function mapCategory(category) {
  if (!category) return 'unisex';
  
  const categoryLower = category.toLowerCase();
  
  for (const [vietnamese, slug] of Object.entries(config.categoryMap)) {
    if (categoryLower.includes(vietnamese)) {
      return slug;
    }
  }
  
  return 'unisex';
}

/**
 * Clean price string and convert to number
 */
export function cleanPrice(priceStr) {
  if (!priceStr) return 0;
  
  // Remove all non-numeric characters except decimal point
  const cleaned = priceStr.replace(/[^\d.]/g, '');
  const price = parseFloat(cleaned);
  
  return isNaN(price) ? 0 : price;
}

/**
 * Determine product type from title and category
 */
export function determineType(title, category) {
  if (!title) return 'other';
  
  const titleLower = title.toLowerCase();
  const categoryLower = category ? category.toLowerCase() : '';
  
  // Shoes
  if (categoryLower.includes('giày') || titleLower.includes('giày')) {
    return 'shoes';
  }
  
  // Bags
  if (categoryLower.includes('túi') || titleLower.includes('túi')) {
    return 'bag';
  }
  
  // Dresses
  if (titleLower.includes('váy') || titleLower.includes('đầm')) {
    return 'dress';
  }
  
  // Outerwear
  if (titleLower.includes('áo khoác') || titleLower.includes('jacket')) {
    return 'outerwear';
  }
  
  // Bottoms
  if (titleLower.includes('quần') || titleLower.includes('short')) {
    return 'bottom';
  }
  
  // Tops
  if (titleLower.includes('áo')) {
    return 'top';
  }
  
  // Accessories
  if (titleLower.includes('phụ kiện') || titleLower.includes('đồng hồ') || 
      titleLower.includes('mũ') || titleLower.includes('khăn')) {
    return 'accessories';
  }
  
  return 'other';
}

/**
 * Generate random delay between min and max
 */
export function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get random user agent
 */
export function getRandomUserAgent() {
  const agents = config.crawler.userAgents;
  return agents[Math.floor(Math.random() * agents.length)];
}

/**
 * Sanitize filename for safe file system usage
 */
export function sanitizeFilename(filename) {
  return filename.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
}

/**
 * Validate product data before insertion
 */
export function validateProduct(product) {
  const errors = [];
  
  if (!product.name || product.name.trim().length === 0) {
    errors.push('Product name is required');
  }
  
  if (!product.price || product.price <= 0) {
    errors.push('Valid price is required');
  }
  
  if (!product.condition_status) {
    errors.push('Condition status is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

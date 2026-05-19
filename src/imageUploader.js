import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import config from './config.js';
import { sanitizeFilename } from './utils.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloud_name,
  api_key: config.cloudinary.api_key,
  api_secret: config.cloudinary.api_secret
});

/**
 * Download image from URL to temp folder
 */
async function downloadImage(imageUrl, filename) {
  const tempDir = path.join(process.cwd(), 'temp_images');
  
  // Create temp directory if not exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const filepath = path.join(tempDir, filename);
  
  try {
    const response = await axios({
      method: 'GET',
      url: imageUrl,
      responseType: 'stream',
      timeout: 30000
    });
    
    const writer = fs.createWriteStream(filepath);
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(filepath));
      writer.on('error', reject);
    });
    
  } catch (error) {
    console.error(`❌ Failed to download image: ${imageUrl}`, error.message);
    throw error;
  }
}

/**
 * Upload image to Cloudinary
 */
async function uploadToCloudinary(filepath, publicId) {
  try {
    const result = await cloudinary.uploader.upload(filepath, {
      public_id: publicId,
      folder: 'fashion_marketplace',
      resource_type: 'image',
      overwrite: false
    });
    
    return result.secure_url;
    
  } catch (error) {
    console.error(`❌ Failed to upload to Cloudinary: ${filepath}`, error.message);
    throw error;
  }
}

/**
 * Delete temporary image file
 */
function deleteTempFile(filepath) {
  try {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  } catch (error) {
    console.warn(`⚠️ Failed to delete temp file: ${filepath}`);
  }
}

/**
 * Process and upload product images
 * @param {Array} imageUrls - Array of image URLs from Chợ Tốt
 * @param {string} productId - Unique product identifier
 * @returns {Array} Array of uploaded image URLs
 */
export async function processImages(imageUrls, productId) {
  if (!imageUrls || imageUrls.length === 0) {
    console.warn('⚠️ No images to process');
    return [];
  }
  
  const uploadedImages = [];
  
  for (let i = 0; i < imageUrls.length; i++) {
    const imageUrl = imageUrls[i];
    const filename = `${sanitizeFilename(productId)}_${i}.jpg`;
    const publicId = `product_${sanitizeFilename(productId)}_${i}`;
    
    let filepath = null;
    
    try {
      console.log(`📥 Downloading image ${i + 1}/${imageUrls.length}...`);
      filepath = await downloadImage(imageUrl, filename);
      
      console.log(`☁️ Uploading to Cloudinary...`);
      const cloudinaryUrl = await uploadToCloudinary(filepath, publicId);
      
      uploadedImages.push({
        url: cloudinaryUrl,
        original: imageUrl
      });
      
      console.log(`✅ Image ${i + 1} uploaded successfully`);
      
    } catch (error) {
      console.error(`❌ Failed to process image ${i + 1}:`, error.message);
      // Continue with other images
      
    } finally {
      // Clean up temp file
      if (filepath) {
        deleteTempFile(filepath);
      }
    }
  }
  
  return uploadedImages;
}

/**
 * Clean up all temporary images
 */
export function cleanupTempImages() {
  const tempDir = path.join(process.cwd(), 'temp_images');
  
  try {
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      
      for (const file of files) {
        fs.unlinkSync(path.join(tempDir, file));
      }
      
      fs.rmdirSync(tempDir);
      console.log('✅ Temporary images cleaned up');
    }
  } catch (error) {
    console.warn('⚠️ Failed to clean up temp images:', error.message);
  }
}

/**
 * Test Cloudinary connection
 */
export async function testCloudinaryConnection() {
  try {
    // Validate config first
    if (!config.cloudinary.cloud_name) {
      throw new Error('Must supply cloud_name');
    }
    if (!config.cloudinary.api_key) {
      throw new Error('Must supply api_key');
    }
    if (!config.cloudinary.api_secret) {
      throw new Error('Must supply api_secret');
    }
    
    // Test actual connection
    const result = await cloudinary.api.resources({ max_results: 1 });
    console.log('✅ Cloudinary connection successful');
    return true;
  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error.message);
    throw error;
  }
}

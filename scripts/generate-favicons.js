#!/usr/bin/env node

/**
 * Script to generate favicon PNG files from the brain icon SVG
 * 
 * To use this script:
 * 1. Install sharp: npm install sharp
 * 2. Run: node scripts/generate-favicons.js
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.error('Sharp is not installed. Please install it with: npm install sharp');
  console.error('Or use an online SVG to PNG converter with the brain-icon.svg file.');
  process.exit(1);
}

async function generateFavicons() {
  const svgPath = path.join(__dirname, '../public/brain-icon.svg');
  const outputDir = path.join(__dirname, '../public');
  
  // Check if SVG exists
  if (!fs.existsSync(svgPath)) {
    console.error('brain-icon.svg not found in public directory');
    process.exit(1);
  }
  
  const sizes = [16, 32];
  
  try {
    for (const size of sizes) {
      const outputPath = path.join(outputDir, `favicon-${size}x${size}.png`);
      
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated favicon-${size}x${size}.png`);
    }
    
    console.log('\n🎉 Favicon generation complete!');
    console.log('The brain icon is now set as your application favicon.');
    
  } catch (error) {
    console.error('Error generating favicons:', error);
    process.exit(1);
  }
}

generateFavicons(); 

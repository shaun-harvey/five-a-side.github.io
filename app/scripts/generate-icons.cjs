// Script to generate PWA icons and favicon from logo
// Run with: node scripts/generate-icons.cjs

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIcons() {
  const logoPath = path.join(__dirname, '../public/images/logo.png');
  const iconsDir = path.join(__dirname, '../public/icons');
  const publicDir = path.join(__dirname, '../public');

  // Ensure icons directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // Generate PWA icons
  const sizes = [192, 512];

  for (const size of sizes) {
    const outputPath = path.join(iconsDir, `icon-${size}.png`);

    await sharp(logoPath)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(outputPath);

    console.log(`Generated icon-${size}.png`);
  }

  // Generate favicon (32x32)
  await sharp(logoPath)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));

  console.log('Generated favicon.png');

  // Generate apple-touch-icon (180x180)
  await sharp(logoPath)
    .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  console.log('Generated apple-touch-icon.png');

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);

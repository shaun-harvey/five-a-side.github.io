import sharp from 'sharp'
import { stat } from 'fs/promises'
import { join } from 'path'

const IMAGES_DIR = './public/images'

// Only compress background images - logo stays untouched
const FILES_TO_COMPRESS = ['hero-bg.png', 'hero.png']

async function optimizeImages() {
  console.log('Optimizing background images (logo unchanged)...\n')

  for (const file of FILES_TO_COMPRESS) {
    const inputPath = join(IMAGES_DIR, file)
    const outputPath = join(IMAGES_DIR, file.replace('.png', '.webp'))

    const beforeStats = await stat(inputPath)
    const beforeSize = (beforeStats.size / 1024 / 1024).toFixed(2)

    await sharp(inputPath)
      .webp({ quality: 80 })
      .toFile(outputPath)

    const afterStats = await stat(outputPath)
    const afterSize = (afterStats.size / 1024 / 1024).toFixed(2)

    console.log(`${file}: ${beforeSize}MB → ${afterSize}MB`)
  }

  console.log('\nLogo.png: unchanged (pixel-perfect quality preserved)')
  console.log('\nDone! Update hero image references to use .webp')
}

optimizeImages().catch(console.error)

/**
 * Script to seed players to Firestore
 *
 * Usage:
 * 1. Make sure you have Firebase Admin SDK credentials set up
 * 2. Run: npx ts-node scripts/seed-players.ts
 *
 * Note: This script uses the Firebase Admin SDK for server-side seeding.
 * For a simpler approach, you can also import players directly in the browser
 * using the seedPlayers function from firestore.ts when logged in as an admin.
 */

import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import * as fs from 'fs'
import * as path from 'path'

// Load service account key (download from Firebase Console)
const serviceAccountPath = path.join(__dirname, '../firebase-admin-key.json')

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`
⚠️  Firebase Admin SDK key not found!

To seed players:
1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate new private key"
3. Save the file as 'firebase-admin-key.json' in the app/ folder
4. Run this script again

Or alternatively, use the browser-based seeding:
1. Log in to the app
2. Open browser console
3. Run: window.__seedPlayers()
`)
  process.exit(1)
}

const serviceAccount = JSON.parse(
  fs.readFileSync(serviceAccountPath, 'utf8')
) as ServiceAccount

initializeApp({
  credential: cert(serviceAccount),
})

const db = getFirestore()

interface PlayerData {
  name: string
  hint: string
  category: string
}

interface PlayersJson {
  modern: PlayerData[]
  legend: PlayerData[]
  obscure: PlayerData[]
}

async function seedPlayers() {
  console.log('🚀 Starting player seeding...\n')

  // Load players from JSON
  const playersPath = path.join(__dirname, '../src/data/players.json')
  const playersData = JSON.parse(fs.readFileSync(playersPath, 'utf8')) as PlayersJson

  console.log(`📊 Found players:`)
  console.log(`   Modern: ${playersData.modern.length}`)
  console.log(`   Legend: ${playersData.legend.length}`)
  console.log(`   Obscure: ${playersData.obscure.length}`)
  console.log(`   Total: ${playersData.modern.length + playersData.legend.length + playersData.obscure.length}\n`)

  const batch = db.batch()
  let count = 0

  const addPlayers = (players: PlayerData[], category: string) => {
    players.forEach((player) => {
      // Create a document ID from the player name
      const docId = player.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      const playerRef = db.collection('players').doc(docId)

      batch.set(playerRef, {
        name: player.name,
        hint: player.hint,
        category,
        isActive: true,
        createdAt: new Date(),
      })
      count++
    })
  }

  addPlayers(playersData.modern, 'modern')
  addPlayers(playersData.legend, 'legend')
  addPlayers(playersData.obscure, 'obscure')

  console.log(`📝 Preparing to write ${count} players...`)

  try {
    await batch.commit()
    console.log(`\n✅ Successfully seeded ${count} players to Firestore!`)
  } catch (error) {
    console.error('\n❌ Error seeding players:', error)
    process.exit(1)
  }
}

seedPlayers()

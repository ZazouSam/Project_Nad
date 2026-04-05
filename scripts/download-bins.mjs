#!/usr/bin/env node
/**
 * Downloads the yt-dlp standalone binary for the current platform
 * into resources/bin/.
 *
 * ffmpeg is provided by the ffmpeg-static npm package — no manual download needed.
 *
 * Usage:  node scripts/download-bins.mjs
 */

import { createWriteStream, existsSync, mkdirSync, chmodSync, copyFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import https from 'https'

const require = createRequire(import.meta.url)

const __dirname = dirname(fileURLToPath(import.meta.url))
const BIN_DIR = join(__dirname, '..', 'resources', 'bin')

mkdirSync(BIN_DIR, { recursive: true })

const platform = process.platform

if (platform !== 'darwin' && platform !== 'win32') {
  console.error('Unsupported platform. Only win32 and darwin are supported.')
  process.exit(1)
}

const YTDLP_FILE = platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp_macos'
const YTDLP_URL =
  `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${YTDLP_FILE}`

function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (existsSync(dest)) {
      console.log(`  ✓ already exists: ${dest}`)
      resolve()
      return
    }

    console.log(`  ↓ ${url}`)
    const file = createWriteFile(dest)

    function get(u) {
      https.get(u, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return get(res.headers.location)
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} downloading ${u}`))
          return
        }
        res.pipe(file)
        file.on('finish', () => {
          file.close()
          if (platform !== 'win32') {
            try { chmodSync(dest, 0o755) } catch {}
          }
          console.log(`  ✓ saved: ${dest}`)
          resolve()
        })
      }).on('error', reject)
    }

    get(url)
  })
}

function createWriteFile(dest) {
  return createWriteStream(dest)
}

async function main() {
  console.log(`\nPlatform: ${platform}`)
  console.log('Downloading yt-dlp...\n')

  const ytdlpDest = join(BIN_DIR, YTDLP_FILE)
  await download(YTDLP_URL, ytdlpDest)

  // On Windows the packaged app needs ffmpeg.exe in resources/bin/.
  // Copy it from the ffmpeg-static devDependency (already installed by npm ci/install).
  if (platform === 'win32') {
    console.log('\nCopying ffmpeg.exe from ffmpeg-static...')
    const ffmpegSrc = require('ffmpeg-static')
    const ffmpegDest = join(BIN_DIR, 'ffmpeg.exe')
    if (!existsSync(ffmpegDest)) {
      copyFileSync(ffmpegSrc, ffmpegDest)
      console.log(`  ✓ saved: ${ffmpegDest}`)
    } else {
      console.log(`  ✓ already exists: ${ffmpegDest}`)
    }
  }

  console.log('\nDone! Run "npm run dev" to start the app.\n')
}

main().catch((err) => {
  console.error('\nFailed:', err.message)
  process.exit(1)
})

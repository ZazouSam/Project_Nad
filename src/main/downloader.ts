import { spawn } from 'child_process'
import { join } from 'path'
import { existsSync } from 'fs'
import { app } from 'electron'
import ffmpegStaticPath from 'ffmpeg-static'

function getBinDir(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'bin')
  }
  return join(process.cwd(), 'resources', 'bin')
}

export function getYtDlpPath(): string {
  const dir = getBinDir()
  const name = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp_macos'
  const p = join(dir, name)
  if (!existsSync(p)) {
    throw new Error(
      `yt-dlp binary not found at ${p}.\nRun: node scripts/download-bins.mjs`
    )
  }
  return p
}

export function getFfmpegPath(): string {
  // In a packaged build, always use the binary from extraResources (resources/bin/).
  // ffmpeg-static is only used as a dev-mode convenience.
  if (app.isPackaged) {
    const dir = getBinDir()
    const name = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
    const p = join(dir, name)
    if (!existsSync(p)) throw new Error(`ffmpeg not found at ${p}`)
    return p
  }
  if (!ffmpegStaticPath) throw new Error('ffmpeg-static did not resolve a binary path')
  return ffmpegStaticPath
}

const INVALID_CHARS_RE = /[<>:"/\\|?*\x00-\x1f]/g

export function sanitizeFilename(name: string): string {
  const map: Record<string, string> = {
    '<': '(',
    '>': ')',
    ':': '-',
    '"': "'",
    '/': '-',
    '\\': '-',
    '|': '-',
    '?': '',
    '*': ''
  }
  let safe = name.replace(INVALID_CHARS_RE, (ch) => map[ch] ?? '')
  safe = safe.trim().replace(/\.+$/, '')
  if (!safe) safe = 'Untitled'
  if (safe.length > 200) safe = safe.slice(0, 200)
  return safe
}

export interface MetaResult {
  title?: string
  artist?: string      // YouTube channel name
  uploadYear?: string  // e.g. "2021"
  thumbnailUrl?: string
  error?: string
}

export function fetchMeta(url: string): Promise<MetaResult> {
  return new Promise((resolve) => {
    let ytdlp: string
    try {
      ytdlp = getYtDlpPath()
    } catch (e) {
      resolve({ error: (e as Error).message })
      return
    }

    const args = ['--no-playlist', '--skip-download', '-J', '--no-warnings', url]
    const proc = spawn(ytdlp, args, { shell: false })

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (d: Buffer) => { stdout += d.toString() })
    proc.stderr.on('data', (d: Buffer) => { stderr += d.toString() })

    proc.on('close', (code) => {
      if (code !== 0) {
        const msg = stderr.split('\n').find((l) => l.trim()) ?? 'Unknown error'
        resolve({ error: msg })
        return
      }
      try {
        const info = JSON.parse(stdout)

        // Pick the best JPEG thumbnail (prefer wider ones)
        let thumbnailUrl: string | undefined
        const thumbs: Array<{ url: string; width?: number }> = info.thumbnails ?? []
        const jpegThumbs = thumbs.filter((t) => /\.(jpg|jpeg)/i.test(t.url))
        const sorted = [...(jpegThumbs.length ? jpegThumbs : thumbs)].sort(
          (a, b) => (b.width ?? 0) - (a.width ?? 0)
        )
        if (sorted.length > 0) thumbnailUrl = sorted[0].url

        // Upload year from upload_date "YYYYMMDD"
        const uploadYear = info.upload_date
          ? (info.upload_date as string).slice(0, 4)
          : undefined

        resolve({
          title: info.title ?? 'Untitled',
          artist: info.channel ?? info.uploader ?? undefined,
          uploadYear,
          thumbnailUrl
        })
      } catch {
        resolve({ error: 'Could not parse video info' })
      }
    })

    proc.on('error', (err) => resolve({ error: err.message }))
  })
}

export interface DownloadCallbacks {
  onProgress: (line: string) => void
  onDone: (success: boolean, outputPath: string | null, error?: string) => void
}

export function downloadMp3(
  url: string,
  title: string,
  outputDir: string,
  callbacks: DownloadCallbacks
): void {
  let ytdlp: string
  let ffmpeg: string
  try {
    ytdlp = getYtDlpPath()
    ffmpeg = getFfmpegPath()
  } catch (e) {
    callbacks.onDone(false, null, (e as Error).message)
    return
  }

  const safeTitle = sanitizeFilename(title)
  const outputTemplate = join(outputDir, `${safeTitle}.%(ext)s`)
  const expectedOutput = join(outputDir, `${safeTitle}.mp3`)

  const args = [
    '-x',
    '--audio-format', 'mp3',
    '--audio-quality', '0',
    '--no-playlist',
    '--ffmpeg-location', ffmpeg,
    '-o', outputTemplate,
    '--no-warnings',
    url
  ]

  const proc = spawn(ytdlp, args, { shell: false })
  let lastError = ''

  proc.stdout.on('data', (d: Buffer) => {
    for (const line of d.toString().split('\n')) {
      const t = line.trim()
      if (t) callbacks.onProgress(t)
    }
  })

  proc.stderr.on('data', (d: Buffer) => {
    for (const line of d.toString().split('\n')) {
      const t = line.trim()
      if (t) { lastError = t; callbacks.onProgress(t) }
    }
  })

  proc.on('close', (code) => {
    if (code === 0) {
      callbacks.onDone(true, expectedOutput)
    } else {
      callbacks.onDone(false, null, lastError || `Process exited with code ${code}`)
    }
  })

  proc.on('error', (err) => callbacks.onDone(false, null, err.message))
}

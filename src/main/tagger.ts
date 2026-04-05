import NodeID3 from 'node-id3'
import https from 'https'
import http from 'http'

export interface SongMeta {
  title: string
  artist?: string
  album?: string
  year?: string
  thumbnailUrl?: string
}

function downloadImage(url: string): Promise<Buffer | null> {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http
    client
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          res.resume()
          resolve(null)
          return
        }
        const chunks: Buffer[] = []
        res.on('data', (c: Buffer) => chunks.push(c))
        res.on('end', () => resolve(Buffer.concat(chunks)))
        res.on('error', () => resolve(null))
      })
      .on('error', () => resolve(null))
  })
}

export async function writeId3Tags(filePath: string, meta: SongMeta): Promise<void> {
  let imageBuffer: Buffer | null = null

  if (meta.thumbnailUrl) {
    imageBuffer = await downloadImage(meta.thumbnailUrl)
  }

  const tags: NodeID3.Tags = {
    title: meta.title,
    artist: meta.artist,
    album: meta.album ?? 'YouTube',
    year: meta.year,
    ...(imageBuffer
      ? {
          image: {
            mime: 'image/jpeg',
            type: { id: 3, name: 'Front Cover' },
            description: 'Cover',
            imageBuffer
          }
        }
      : {})
  }

  NodeID3.write(tags, filePath)
}

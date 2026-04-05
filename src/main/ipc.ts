import { ipcMain, dialog, shell, BrowserWindow, app } from 'electron'
import { mkdirSync } from 'fs'
import { getDownloadDir, setDownloadDir } from './store'
import { fetchMeta, downloadMp3, type MetaResult } from './downloader'
import { writeId3Tags } from './tagger'

interface DownloadQueueItem {
  id: string
  url: string
  title: string
  artist?: string
  uploadYear?: string
  thumbnailUrl?: string
}

export function registerIpcHandlers(win: BrowserWindow): void {
  ipcMain.handle('folder:get', () => getDownloadDir())

  ipcMain.handle('folder:pick', async () => {
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory', 'createDirectory'],
      defaultPath: getDownloadDir(),
      title: 'Choose where to save MP3 files'
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const chosen = result.filePaths[0]
    setDownloadDir(chosen)
    return chosen
  })

  ipcMain.handle('meta:fetch', async (_event, { id, url }: { id: string; url: string }) => {
    const result: MetaResult = await fetchMeta(url)
    return { id, ...result }
  })

  ipcMain.handle(
    'download:start',
    async (_event, { queue }: { queue: DownloadQueueItem[] }) => {
      const downloadDir = getDownloadDir()
      try { mkdirSync(downloadDir, { recursive: true }) } catch { /* already exists */ }

      for (const item of queue) {
        await new Promise<void>((resolve) => {
          downloadMp3(item.url, item.title, downloadDir, {
            onProgress: (line) => {
              win.webContents.send('download:progress', { id: item.id, line })
            },
            onDone: async (success, outputPath, error) => {
              if (success && outputPath) {
                win.webContents.send('download:progress', {
                  id: item.id,
                  line: 'Writing tags…'
                })
                try {
                  await writeId3Tags(outputPath, {
                    title: item.title,
                    artist: item.artist,
                    album: 'YouTube',
                    year: item.uploadYear,
                    thumbnailUrl: item.thumbnailUrl
                  })
                } catch (tagErr) {
                  console.error('[tagger] failed:', tagErr)
                }
              }
              win.webContents.send('download:done', { id: item.id, success, error })
              resolve()
            }
          })
        })
      }
    }
  )

  ipcMain.handle('folder:reveal', () => {
    shell.openPath(getDownloadDir())
  })

  ipcMain.on('updater:install', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { autoUpdater } = require('electron-updater')
    autoUpdater.quitAndInstall()
  })

  ipcMain.handle('app:version', () => app.getVersion())
}

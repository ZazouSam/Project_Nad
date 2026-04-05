import Store from 'electron-store'
import { app } from 'electron'
import { join } from 'path'

interface StoreSchema {
  downloadDir: string
}

const store = new Store<StoreSchema>()

export function getDownloadDir(): string {
  if (!store.has('downloadDir')) {
    const defaultDir = join(app.getPath('documents'), 'YouTube MP3')
    store.set('downloadDir', defaultDir)
  }
  return store.get('downloadDir') as string
}

export function setDownloadDir(dir: string): void {
  store.set('downloadDir', dir)
}

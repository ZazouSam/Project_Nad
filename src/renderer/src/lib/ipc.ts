export interface MetaResult {
  id: string
  title?: string
  artist?: string
  uploadYear?: string
  thumbnailUrl?: string
  error?: string
}

export interface DownloadItem {
  id: string
  url: string
  title: string
  artist?: string
  uploadYear?: string
  thumbnailUrl?: string
}

export interface DownloadProgress {
  id: string
  line: string
}

export interface DownloadDone {
  id: string
  success: boolean
  error?: string
}

export interface UpdaterAvailable {
  version: string
}

const api = window.electronAPI

export const ipc = {
  fetchMeta: (id: string, url: string): Promise<MetaResult> =>
    api.invoke('meta:fetch', { id, url }) as Promise<MetaResult>,

  startDownload: (queue: DownloadItem[]): Promise<void> =>
    api.invoke('download:start', { queue }) as Promise<void>,

  getFolder: (): Promise<string> =>
    api.invoke('folder:get') as Promise<string>,

  pickFolder: (): Promise<string | null> =>
    api.invoke('folder:pick') as Promise<string | null>,

  revealFolder: (): Promise<void> =>
    api.invoke('folder:reveal') as Promise<void>,

  installUpdate: (): void => api.send('updater:install'),

  onDownloadProgress: (cb: (data: DownloadProgress) => void): (() => void) =>
    api.on('download:progress', (data) => cb(data as DownloadProgress)),

  onDownloadDone: (cb: (data: DownloadDone) => void): (() => void) =>
    api.on('download:done', (data) => cb(data as DownloadDone)),

  onUpdaterAvailable: (cb: (data: UpdaterAvailable) => void): (() => void) =>
    api.on('updater:available', (data) => cb(data as UpdaterAvailable))
}

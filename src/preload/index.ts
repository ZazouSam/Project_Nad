import { contextBridge, ipcRenderer } from 'electron'

type IpcCallback = (data: unknown) => void

const electronAPI = {
  invoke: (channel: string, ...args: unknown[]): Promise<unknown> =>
    ipcRenderer.invoke(channel, ...args),

  send: (channel: string, ...args: unknown[]): void =>
    ipcRenderer.send(channel, ...args),

  on: (channel: string, callback: IpcCallback): (() => void) => {
    const wrapped = (_event: Electron.IpcRendererEvent, data: unknown): void => callback(data)
    ipcRenderer.on(channel, wrapped)
    return () => ipcRenderer.removeListener(channel, wrapped)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronAPI', electronAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electronAPI = electronAPI
}

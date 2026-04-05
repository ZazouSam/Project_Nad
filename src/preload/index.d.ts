type IpcCallback = (data: unknown) => void

interface ElectronAPI {
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
  send: (channel: string, ...args: unknown[]) => void
  on: (channel: string, callback: IpcCallback) => () => void
}

declare interface Window {
  electronAPI: ElectronAPI
}

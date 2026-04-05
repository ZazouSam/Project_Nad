import { app, shell, BrowserWindow, Menu } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../build/music-note.png?asset'
import { registerIpcHandlers } from './ipc'
import { setupUpdater } from './updater'

Menu.setApplicationMenu(null)

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    title: 'YouTube MP3',
    width: 820,
    height: 680,
    minWidth: 640,
    minHeight: 520,
    show: false,
    frame: true,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  registerIpcHandlers(mainWindow)
  setupUpdater(mainWindow)
}

app.whenReady().then(() => {
  app.setName('YouTube MP3')
  electronApp.setAppUserModelId('com.zazousam.ytmp3')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

})

app.on('window-all-closed', () => {
  app.quit()
})

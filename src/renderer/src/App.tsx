import { useEffect, useReducer, useCallback } from 'react'
import { Download, FolderOpen, Trash2 } from 'lucide-react'
import { Toaster, toast } from 'sonner'
import { ipc, type DownloadProgress, type DownloadDone, type UpdaterAvailable, type MetaResult } from './lib/ipc'
import { FolderBar } from './components/FolderBar'
import { AddUrlBar } from './components/AddUrlBar'
import { QueueList } from './components/QueueList'
import { UpdateBanner } from './components/UpdateBanner'
import { Button } from './components/ui/button'
import type { QueueItemData, ItemStatus } from './components/QueueItem'

// ── State ────────────────────────────────────────────────────────────────────

interface AppState {
  folder: string
  queue: QueueItemData[]
  isDownloading: boolean
  updateVersion: string | null
}

type Action =
  | { type: 'SET_FOLDER'; folder: string }
  | { type: 'ADD_ITEM'; item: QueueItemData }
  | { type: 'UPDATE_ITEM'; id: string; patch: Partial<QueueItemData> }
  | { type: 'REMOVE_ITEM'; id: string }
  | { type: 'CLEAR_DONE' }
  | { type: 'SET_DOWNLOADING'; value: boolean }
  | { type: 'SET_UPDATE'; version: string }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_FOLDER':
      return { ...state, folder: action.folder }
    case 'ADD_ITEM':
      return { ...state, queue: [...state.queue, action.item] }
    case 'UPDATE_ITEM':
      return {
        ...state,
        queue: state.queue.map((q) =>
          q.id === action.id ? { ...q, ...action.patch } : q
        )
      }
    case 'REMOVE_ITEM':
      return { ...state, queue: state.queue.filter((q) => q.id !== action.id) }
    case 'CLEAR_DONE':
      return { ...state, queue: state.queue.filter((q) => q.status !== 'done' && q.status !== 'failed') }
    case 'SET_DOWNLOADING':
      return { ...state, isDownloading: action.value }
    case 'SET_UPDATE':
      return { ...state, updateVersion: action.version }
    default:
      return state
  }
}

const initialState: AppState = {
  folder: '',
  queue: [],
  isDownloading: false,
  updateVersion: null
}

// ── Component ────────────────────────────────────────────────────────────────

let idCounter = 0
function nextId(): string {
  return `item-${++idCounter}-${Date.now()}`
}

export default function App(): React.JSX.Element {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Load folder on mount + subscribe to IPC events
  useEffect(() => {
    ipc.getFolder().then((f) => dispatch({ type: 'SET_FOLDER', folder: f as string }))

    const offProgress = ipc.onDownloadProgress((data) => {
      const d = data as DownloadProgress
      dispatch({ type: 'UPDATE_ITEM', id: d.id, patch: { progressLine: d.line } })
    })

    const offDone = ipc.onDownloadDone((data) => {
      const d = data as DownloadDone
      const status: ItemStatus = d.success ? 'done' : 'failed'
      dispatch({
        type: 'UPDATE_ITEM',
        id: d.id,
        patch: { status, error: d.error }
      })
    })

    const offUpdate = ipc.onUpdaterAvailable((data) => {
      const d = data as UpdaterAvailable
      dispatch({ type: 'SET_UPDATE', version: d.version })
    })

    return () => {
      offProgress()
      offDone()
      offUpdate()
    }
  }, [])

  const handleChangeFolder = useCallback(async () => {
    const result = await ipc.pickFolder()
    if (result) dispatch({ type: 'SET_FOLDER', folder: result as string })
  }, [])

  const handleAdd = useCallback(async (url: string) => {
    const id = nextId()
    const newItem: QueueItemData = {
      id,
      url,
      title: '',
      status: 'fetching'
    }
    dispatch({ type: 'ADD_ITEM', item: newItem })

    const result = await ipc.fetchMeta(id, url)
    const meta = result as MetaResult

    if (meta.error) {
      dispatch({
        type: 'UPDATE_ITEM',
        id,
        patch: { status: 'error', error: meta.error, title: 'Could not fetch title' }
      })
    } else {
      dispatch({
        type: 'UPDATE_ITEM',
        id,
        patch: {
          status: 'ready',
          title: meta.title ?? 'Untitled',
          artist: meta.artist,
          uploadYear: meta.uploadYear,
          thumbnailUrl: meta.thumbnailUrl
        }
      })
    }
  }, [])

  const handleDownloadAll = useCallback(async () => {
    const ready = state.queue.filter((q) => q.status === 'ready')
    if (ready.length === 0) return

    dispatch({ type: 'SET_DOWNLOADING', value: true })

    // Mark all ready items as downloading
    ready.forEach((q) => dispatch({ type: 'UPDATE_ITEM', id: q.id, patch: { status: 'downloading' } }))

    try {
      await ipc.startDownload(
        ready.map((q) => ({
          id: q.id,
          url: q.url,
          title: q.title,
          artist: q.artist,
          uploadYear: q.uploadYear,
          thumbnailUrl: q.thumbnailUrl
        }))
      )
      toast.success('All downloads complete!', {
        action: {
          label: 'Open folder',
          onClick: () => ipc.revealFolder()
        }
      })
    } catch (err) {
      toast.error('Download failed', {
        description: err instanceof Error ? err.message : String(err)
      })
    } finally {
      dispatch({ type: 'SET_DOWNLOADING', value: false })
    }
  }, [state.queue])

  const readyCount = state.queue.filter((q) => q.status === 'ready').length
  const hasDoneOrFailed = state.queue.some((q) => q.status === 'done' || q.status === 'failed')

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{ className: 'border border-border bg-card text-foreground' }}
      />

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur px-5 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-primary/10 p-1.5">
            <Download size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground leading-none">YouTube MP3</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Download music as MP3</p>
          </div>
        </div>
        {hasDoneOrFailed && !state.isDownloading && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch({ type: 'CLEAR_DONE' })}
            className="text-xs gap-1.5 text-muted-foreground"
          >
            <Trash2 size={12} />
            Clear finished
          </Button>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col gap-3 px-5 py-4 overflow-auto">
        {state.updateVersion && <UpdateBanner version={state.updateVersion} />}

        <FolderBar folder={state.folder || '…'} onChangeFolder={handleChangeFolder} />

        <AddUrlBar disabled={state.isDownloading} onAdd={handleAdd} />

        <div className="flex-1 min-h-0 overflow-y-auto">
          <QueueList
            items={state.queue}
            isDownloading={state.isDownloading}
            onRemove={(id) => dispatch({ type: 'REMOVE_ITEM', id })}
            onTitleChange={(id, title) => dispatch({ type: 'UPDATE_ITEM', id, patch: { title } })}
          />
        </div>
      </main>

      {/* Footer / action bar */}
      <footer className="border-t border-border bg-card/50 px-5 py-3 flex items-center justify-between shrink-0">
        <p className="text-xs text-muted-foreground">
          {state.queue.length === 0
            ? 'No songs in queue'
            : `${state.queue.length} song${state.queue.length !== 1 ? 's' : ''} • ${readyCount} ready`}
        </p>
        <div className="flex items-center gap-2">
          {hasDoneOrFailed && !state.isDownloading && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => ipc.revealFolder()}
              className="gap-1.5 text-xs"
            >
              <FolderOpen size={13} />
              Open folder
            </Button>
          )}
          <Button
            onClick={handleDownloadAll}
            disabled={readyCount === 0 || state.isDownloading}
            className="gap-2"
          >
            {state.isDownloading ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                Downloading…
              </>
            ) : (
              <>
                <Download size={15} />
                Download All {readyCount > 0 && `(${readyCount})`}
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  )
}

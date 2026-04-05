import { useState, useRef, useEffect } from 'react'
import { Loader2, CheckCircle2, XCircle, Trash2, Music } from 'lucide-react'
import { cn } from '../lib/utils'
import { Button } from './ui/button'

export type ItemStatus = 'fetching' | 'ready' | 'error' | 'downloading' | 'done' | 'failed'

export interface QueueItemData {
  id: string
  url: string
  title: string
  artist?: string
  uploadYear?: string
  thumbnailUrl?: string
  status: ItemStatus
  progressLine?: string
  error?: string
}

interface QueueItemProps {
  item: QueueItemData
  isDownloading: boolean
  onRemove: (id: string) => void
  onTitleChange: (id: string, title: string) => void
}

export function QueueItem({
  item,
  isDownloading,
  onRemove,
  onTitleChange
}: QueueItemProps): React.JSX.Element {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item.title)
  const inputRef = useRef<HTMLInputElement>(null)

  // Keep draft in sync with the resolved title when not actively editing
  useEffect(() => {
    if (!editing) setDraft(item.title)
  }, [item.title, editing])

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  const commitEdit = (): void => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== item.title) {
      onTitleChange(item.id, trimmed)
    } else {
      setDraft(item.title)
    }
    setEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') {
      setDraft(item.title)
      setEditing(false)
    }
  }

  const canEdit = item.status === 'ready' && !isDownloading
  const canRemove = !isDownloading || item.status === 'done' || item.status === 'failed'

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors',
        item.status === 'done' && 'border-green-500/20 bg-green-500/5',
        item.status === 'failed' && 'border-red-500/20 bg-red-500/5',
        item.status === 'downloading' && 'border-primary/30 bg-primary/5',
        item.status !== 'done' && item.status !== 'failed' && item.status !== 'downloading' && 'border-border bg-card'
      )}
    >
      {/* Status icon */}
      <div className="mt-0.5 shrink-0">
        {item.status === 'fetching' && <Loader2 size={16} className="text-muted-foreground animate-spin" />}
        {item.status === 'downloading' && <Loader2 size={16} className="text-primary animate-spin" />}
        {item.status === 'ready' && <Music size={16} className="text-muted-foreground" />}
        {item.status === 'done' && <CheckCircle2 size={16} className="text-green-400" />}
        {(item.status === 'error' || item.status === 'failed') && (
          <XCircle size={16} className="text-red-400" />
        )}
      </div>

      {/* Title + details */}
      <div className="flex-1 min-w-0">
        {item.status === 'fetching' ? (
          <span className="text-sm text-muted-foreground italic">Fetching title…</span>
        ) : editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-sm text-foreground border-b border-primary outline-none pb-0.5"
          />
        ) : (
          <p
            className={cn(
              'text-sm truncate',
              canEdit && 'cursor-text hover:text-primary transition-colors',
              !canEdit && 'text-foreground'
            )}
            title={canEdit ? 'Click to rename' : item.title}
            onClick={() => canEdit && setEditing(true)}
          >
            {item.title || <span className="text-muted-foreground italic">Untitled</span>}
          </p>
        )}

        {/* URL */}
        <p className="text-xs text-muted-foreground truncate mt-0.5" title={item.url}>
          {item.url}
        </p>

        {/* Progress / error */}
        {item.status === 'downloading' && item.progressLine && (
          <p className="text-xs text-primary/80 mt-1 font-mono truncate">{item.progressLine}</p>
        )}
        {(item.status === 'error' || item.status === 'failed') && item.error && (
          <p className="text-xs text-red-400 mt-1 break-words">{item.error}</p>
        )}
        {item.status === 'done' && (
          <p className="text-xs text-green-400 mt-0.5">Saved successfully</p>
        )}
      </div>

      {/* Remove button */}
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 h-7 w-7 text-muted-foreground hover:text-red-400"
        disabled={!canRemove}
        onClick={() => onRemove(item.id)}
        title="Remove"
      >
        <Trash2 size={14} />
      </Button>
    </div>
  )
}

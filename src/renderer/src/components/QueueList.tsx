import { Music } from 'lucide-react'
import { QueueItem, type QueueItemData } from './QueueItem'

interface QueueListProps {
  items: QueueItemData[]
  isDownloading: boolean
  onRemove: (id: string) => void
  onTitleChange: (id: string, title: string) => void
}

export function QueueList({
  items,
  isDownloading,
  onRemove,
  onTitleChange
}: QueueListProps): React.JSX.Element {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="rounded-full bg-card border border-border p-4">
          <Music size={28} className="text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">No songs yet</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Paste a YouTube link above and press Add
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <QueueItem
          key={item.id}
          item={item}
          isDownloading={isDownloading}
          onRemove={onRemove}
          onTitleChange={onTitleChange}
        />
      ))}
    </div>
  )
}

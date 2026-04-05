import { Folder, FolderOpen } from 'lucide-react'
import { Button } from './ui/button'

interface FolderBarProps {
  folder: string
  onChangeFolder: () => void
}

export function FolderBar({ folder, onChangeFolder }: FolderBarProps): React.JSX.Element {
  const display = folder.length > 55 ? '…' + folder.slice(-52) : folder

  return (
    <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
      <Folder size={15} className="text-muted-foreground shrink-0" />
      <span
        className="text-sm text-muted-foreground truncate flex-1"
        title={folder}
      >
        {display}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onChangeFolder}
        className="shrink-0 h-7 px-2 text-xs gap-1.5"
      >
        <FolderOpen size={13} />
        Change folder
      </Button>
    </div>
  )
}

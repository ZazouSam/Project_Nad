import { Download } from 'lucide-react'
import { Button } from './ui/button'
import { ipc } from '../lib/ipc'

interface UpdateBannerProps {
  version: string
}

export function UpdateBanner({ version }: UpdateBannerProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-3 bg-primary/10 border border-primary/20 rounded-lg px-4 py-2.5 text-sm">
      <div className="flex items-center gap-2 text-primary">
        <Download size={15} />
        <span>
          Version <strong>{version}</strong> is ready — restart to update
        </span>
      </div>
      <Button size="sm" onClick={() => ipc.installUpdate()}>
        Restart &amp; Update
      </Button>
    </div>
  )
}

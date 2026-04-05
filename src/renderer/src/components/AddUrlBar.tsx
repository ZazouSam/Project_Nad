import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'

const YOUTUBE_HOSTS = ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com', 'music.youtube.com']

function isValidYoutubeUrl(raw: string): boolean {
  try {
    const url = new URL(raw)
    return YOUTUBE_HOSTS.some((h) => url.hostname === h)
  } catch {
    return false
  }
}

interface AddUrlBarProps {
  disabled?: boolean
  onAdd: (url: string) => void
}

export function AddUrlBar({ disabled, onAdd }: AddUrlBarProps): React.JSX.Element {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  const handleAdd = (): void => {
    const trimmed = value.trim()
    if (!trimmed) return

    if (!isValidYoutubeUrl(trimmed)) {
      setError('Please enter a valid YouTube URL')
      return
    }

    onAdd(trimmed)
    setValue('')
    setError('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') handleAdd()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setValue(e.target.value)
    if (error) setError('')
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="flex-1 font-mono text-xs"
          autoFocus
        />
        <Button onClick={handleAdd} disabled={disabled || !value.trim()} className="shrink-0 gap-1.5">
          <Plus size={15} />
          Add
        </Button>
      </div>
      {error && <p className="text-xs text-red-400 px-1">{error}</p>}
    </div>
  )
}

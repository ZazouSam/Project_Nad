const INVALID_CHARS_RE = /[<>:"/\\|?*\x00-\x1f]/g

export function sanitizeFilename(name: string): string {
  let safe = name.replace(INVALID_CHARS_RE, (ch) => {
    const map: Record<string, string> = {
      '<': '(',
      '>': ')',
      ':': '-',
      '"': "'",
      '/': '-',
      '\\': '-',
      '|': '-',
      '?': '',
      '*': ''
    }
    return map[ch] ?? ''
  })

  safe = safe.trim().replace(/\.+$/, '')

  if (!safe) safe = 'Untitled'
  if (safe.length > 200) safe = safe.slice(0, 200)

  return safe
}

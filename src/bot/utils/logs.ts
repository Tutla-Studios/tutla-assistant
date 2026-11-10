/** Keeps the last N console lines in memory for /panel log (port of panel.py's PrintLogger). */

const MAX_LINES = 50
const lines: string[] = []

const g = globalThis as unknown as { __tutlaLogCapture?: boolean }

export function installLogCapture() {
  if (g.__tutlaLogCapture) return
  g.__tutlaLogCapture = true

  for (const level of ['log', 'info', 'warn', 'error'] as const) {
    const original = console[level].bind(console)
    console[level] = (...args: unknown[]) => {
      const text = args
        .map((a) => (a instanceof Error ? a.stack ?? a.message : typeof a === 'string' ? a : JSON.stringify(a)))
        .join(' ')
      for (const line of text.split('\n')) {
        if (!line.trim()) continue
        lines.push(`[${new Date().toISOString().slice(11, 19)}] ${level.toUpperCase()} ${line}`)
        if (lines.length > MAX_LINES) lines.shift()
      }
      original(...args)
    }
  }
}

export function recentLogs(): string {
  return lines.join('\n')
}

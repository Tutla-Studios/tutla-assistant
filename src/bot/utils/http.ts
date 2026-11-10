/**
 * Thrown for expected, user-facing failures (bad input, missing config, upstream API down).
 * interactionCreate shows the message to the user instead of the generic error.
 */
export class CommandError extends Error {}

export const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.79 Safari/537.36'

export async function fetchJson<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) throw new CommandError(`Request failed (HTTP ${res.status}).`)
  return (await res.json()) as T
}

export async function fetchText(url: string, init?: RequestInit): Promise<string> {
  const res = await fetch(url, init)
  if (!res.ok) throw new CommandError(`Request failed (HTTP ${res.status}).`)
  return res.text()
}

export async function fetchBuffer(url: string, init?: RequestInit): Promise<Buffer> {
  const res = await fetch(url, init)
  if (!res.ok) throw new CommandError(`Request failed (HTTP ${res.status}).`)
  return Buffer.from(await res.arrayBuffer())
}

function rapidKey(): string {
  const key = process.env.RAPID_API_KEY
  if (!key) throw new CommandError('This command is not configured (missing RAPID_API_KEY).')
  return key
}

interface RapidOptions {
  params?: Record<string, string | number | boolean>
  /** When set, the request is a JSON POST with this body. */
  body?: unknown
}

/** Call a RapidAPI endpoint (equivalent of the old `api()` helper in Utils.py). */
export async function rapidApi<T = any>(url: string, host: string, opts: RapidOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'x-rapidapi-key': rapidKey(),
    'x-rapidapi-host': host,
  }
  const qs = opts.params
    ? '?' + new URLSearchParams(Object.entries(opts.params).map(([k, v]) => [k, String(v)]))
    : ''

  if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    return fetchJson<T>(url + qs, { method: 'POST', headers, body: JSON.stringify(opts.body) })
  }
  return fetchJson<T>(url + qs, { headers })
}

/** Trim text to Discord's 2000-char message limit. */
export function clip(text: string, max = 2000): string {
  return text.length > max ? text.slice(0, max - 1) + '…' : text
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Inclusive random integer, like Python's random.randint. */
export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

export function decodeHtml(text: string): string {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, code: string) => {
    if (code[0] === '#') {
      const n = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
      return Number.isFinite(n) ? String.fromCodePoint(n) : m
    }
    return ENTITIES[code.toLowerCase()] ?? m
  })
}

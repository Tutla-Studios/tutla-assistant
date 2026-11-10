import { CommandError, rapidApi } from './http'

const YT_HOST = 'yt-api.p.rapidapi.com'

/** Extract an 11-char video ID from a youtube.com / youtu.be / shorts URL (or a bare ID). */
export function youtubeId(input: string): string | null {
  const trimmed = input.trim()
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed
  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    const host = url.hostname.replace(/^(www\.|m\.|music\.)/, '')
    if (host === 'youtu.be') return url.pathname.slice(1, 12) || null
    if (host === 'youtube.com') {
      const v = url.searchParams.get('v')
      if (v) return v
      const m = /^\/(shorts|embed|live|v)\/([\w-]{11})/.exec(url.pathname)
      if (m) return m[2]
    }
  } catch {
    // not a URL
  }
  return null
}

interface YtFormat {
  url: string
  mimeType?: string
  bitrate?: number
  contentLength?: string
}

export interface YtDownloadInfo {
  channelId?: string
  formats?: YtFormat[]
  adaptiveFormats?: YtFormat[]
}

export function ytDownloadInfo(id: string) {
  return rapidApi<YtDownloadInfo>('https://yt-api.p.rapidapi.com/dl', YT_HOST, { params: { id } })
}

/** Muxed (video+audio) stream URL. */
export async function videoUrl(id: string): Promise<string> {
  const info = await ytDownloadInfo(id)
  const url = info.formats?.[0]?.url
  if (!url) throw new CommandError('Failed to download the video.')
  return url
}

/** Highest-bitrate audio-only stream URL. */
export async function audioUrl(id: string): Promise<string> {
  const info = await ytDownloadInfo(id)
  const audio = (info.adaptiveFormats ?? [])
    .filter((f) => f.mimeType?.startsWith('audio/'))
    .sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0))[0]
  const url = audio?.url ?? info.formats?.[0]?.url
  if (!url) throw new CommandError('Failed to download the audio.')
  return url
}

export function ytApi<T = any>(path: string, params: Record<string, string>) {
  return rapidApi<T>(`https://yt-api.p.rapidapi.com/${path}`, YT_HOST, { params })
}

import path from 'node:path'
import { readdirSync } from 'node:fs'
import type { Attachment } from 'discord.js'
import { CommandError, fetchBuffer } from './http'

export const ASSETS_DIR = path.join(process.cwd(), 'src/bot/assets')
export const FONTS_DIR = path.join(ASSETS_DIR, 'fonts')

/** Font names available to image commands (file names in assets/fonts without .ttf). */
export const FONTS: string[] = (() => {
  try {
    return readdirSync(FONTS_DIR)
      .filter((f) => f.endsWith('.ttf'))
      .map((f) => f.slice(0, -4))
      .sort()
  } catch {
    return []
  }
})()

export function fontPath(name: string): string {
  return path.join(FONTS_DIR, `${name}.ttf`)
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024

/** Download an attachment, rejecting non-images and oversized files. */
export async function readImage(att: Attachment, maxBytes = MAX_IMAGE_BYTES): Promise<Buffer> {
  if (att.contentType && !att.contentType.startsWith('image/')) {
    throw new CommandError('That attachment is not an image.')
  }
  if (att.size > maxBytes) throw new CommandError('File is too big!')
  return fetchBuffer(att.url)
}

export function parseHex(hex: string): { r: number; g: number; b: number } {
  const clean = hex.trim().replace(/^#/, '')
  if (!/^[0-9a-f]{6}$/i.test(clean)) throw new CommandError(`Invalid hex color: \`${hex}\` (expected RRGGBB).`)
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  }
}

export function toHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
}

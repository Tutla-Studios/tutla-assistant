/** Lists the Python bot scraped at import time; here they're fetched lazily on first use and cached. */
import * as cheerio from 'cheerio'
import { BROWSER_UA, CommandError, fetchJson, fetchText } from '@/bot/utils/http'

const RIZZ_URL = 'https://www.womansday.com/relationships/dating-marriage/a41055149/best-pickup-lines/'
const SHOWER_URL = 'https://thepleasantconversation.com/shower-thoughts/'

async function scrapeListItems(url: string, limit: number): Promise<string[]> {
  const $ = cheerio.load(await fetchText(url, { headers: { 'user-agent': BROWSER_UA } }))
  return $('li')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter((t) => t.length > 15 && t.length < 2000)
    .slice(0, limit)
}

function cached(url: string, limit: number) {
  let promise: Promise<string[]> | null = null
  return async () => {
    promise ??= scrapeListItems(url, limit).then((items) => {
      if (!items.length) throw new CommandError('Could not load lines right now, try again later.')
      return items
    })
    // Don't cache failures, so a later call can retry.
    return promise.catch((err) => {
      promise = null
      throw err instanceof CommandError ? err : new CommandError('Could not load lines right now, try again later.')
    })
  }
}

export const rizzLines = cached(RIZZ_URL, 1000)
export const showerThoughts = cached(SHOWER_URL, 543)

export async function guessGender(name: string): Promise<string> {
  const data = await fetchJson<{ gender: string | null }>(`https://api.genderize.io?name=${encodeURIComponent(name)}`)
  return data.gender ?? 'unknown'
}

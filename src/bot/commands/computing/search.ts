import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import * as cheerio from 'cheerio'
import { CommandScope } from '@/bot/commands/types'
import { clip, fetchJson, fetchText } from '@/bot/utils/http'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('search')
  .setDescription('Search the web')
  .addStringOption((o) =>
    o
      .setName('engine')
      .setDescription('Select a search engine')
      .setRequired(true)
      .addChoices(
        { name: 'DuckDuckGo', value: 'ddg' },
        { name: 'Tutla Website', value: 'tutla' },
        { name: 'Wikimedia', value: 'wm' },
        { name: 'Wikipedia', value: 'wiki' },
        { name: 'Universities in a country', value: 'uns' },
      ),
  )
  .addStringOption((o) => o.setName('search').setDescription('Search query').setRequired(true))
  .addIntegerOption((o) =>
    o.setName('results').setDescription('Number of results (default 3)').setMinValue(1).setMaxValue(10),
  )

const WIKI_HEADERS = { 'User-Agent': 'tutla-assistant (Discord bot)' }

interface DdgTopic {
  Name?: string
  Text?: string
  FirstURL?: string
  Topics?: DdgTopic[]
}

async function duckduckgo(query: string, results: number): Promise<string> {
  const data = await fetchJson<{ RelatedTopics: DdgTopic[]; AbstractText?: string; AbstractURL?: string }>(
    `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`,
  )
  let out = `## Results for \`${query}\`:\n`
  if (data.AbstractText) out += `${data.AbstractText} (<${data.AbstractURL}>)\n`
  for (const topic of data.RelatedTopics.slice(0, results)) {
    if (topic.Name) {
      out += `### ${topic.Name}\n`
      for (const t of topic.Topics ?? []) {
        if (t.Text) out += ` - [${t.Text}](<${t.FirstURL}>)\n`
      }
      out += '\n'
    } else if (topic.Text) {
      out += `[${topic.Text}](<${topic.FirstURL}>)\n`
    }
  }
  return out
}

async function wikimedia(query: string, results: number): Promise<string> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    generator: 'search',
    gsrsearch: query,
    gsrlimit: String(results),
    gsrnamespace: '6',
    prop: 'imageinfo',
    iiprop: 'url',
  })
  const data = await fetchJson<any>(`https://commons.wikimedia.org/w/api.php?${params}`, { headers: WIKI_HEADERS })
  const pages = Object.values<any>(data.query?.pages ?? {})
  let out = `Results for \`${query}\`:\n`
  for (const page of pages) {
    const url = page.imageinfo?.[0]?.url
    if (url) out += `[Image](${url})\n`
  }
  return out
}

/** Like python's wikipedia.summary(query, sentences=n). */
async function wikipedia(query: string, sentences: number): Promise<string> {
  const search = await fetchJson<any>(
    `https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit=1&srsearch=${encodeURIComponent(query)}`,
    { headers: WIKI_HEADERS },
  )
  const title: string | undefined = search.query?.search?.[0]?.title
  if (!title) return `No Wikipedia page found for \`${query}\`.`
  const summary = await fetchJson<any>(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replaceAll(' ', '_'))}`,
    { headers: WIKI_HEADERS },
  )
  const extract: string = summary.extract ?? ''
  const parts = extract.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [extract]
  return `**${summary.title}**\n${parts.slice(0, sentences).join('').trim()}`
}

async function universities(country: string): Promise<string> {
  const list = await fetchJson<{ name: string; web_pages: string[] }[]>(
    `http://universities.hipolabs.com/search?country=${encodeURIComponent(country.toLowerCase())}`,
  )
  let out = `Universities in ${country}:\n`
  for (const u of list.slice(0, 5)) out += `- [${u.name}](<${u.web_pages[0]}>)\n`
  return out
}

async function tutla(query: string): Promise<string> {
  const html = await fetchText(`https://tutla.net/?s=${encodeURIComponent(query).replaceAll('%20', '+')}`)
  const $ = cheerio.load(html)
  let out = `### __Search Results for "${query}":__\n`
  $('ul.wp-block-post-template li h2.wp-block-post-title a').each((_, el) => {
    out += `- ${$(el).text().trim()}: <${$(el).attr('href')}>\n`
  })
  return out
}

export async function execute(ctx: ChatInputCommandInteraction) {
  const engine = ctx.options.getString('engine', true)
  const query = ctx.options.getString('search', true)
  const results = ctx.options.getInteger('results') ?? 3

  await ctx.reply({ content: 'Searching 🔎...', ephemeral: true })

  let out: string
  switch (engine) {
    case 'ddg':
      out = await duckduckgo(query, results)
      break
    case 'wm':
      out = await wikimedia(query, results)
      break
    case 'wiki':
      out = await wikipedia(query, results)
      break
    case 'uns':
      out = await universities(query)
      break
    default:
      out = await tutla(query)
  }
  await ctx.followUp(clip(out))
}

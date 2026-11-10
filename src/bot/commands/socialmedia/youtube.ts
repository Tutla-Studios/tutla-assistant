import {
  SlashCommandBuilder,
  EmbedBuilder,
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  ComponentType,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
} from 'discord.js'
import * as cheerio from 'cheerio'
import { CommandScope } from '@/bot/commands/types'
import { isPremium } from '@/bot/utils/checks'
import { BROWSER_UA, CommandError, fetchText } from '@/bot/utils/http'
import { audioUrl, videoUrl, youtubeId, ytApi, ytDownloadInfo } from '@/bot/utils/youtube'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('youtube')
  .setDescription('Get/download a YouTube video')
  .addStringOption((o) => o.setName('query_or_url').setDescription('Video URL, or a search query').setRequired(true))
  .addBooleanOption((o) => o.setName('search').setDescription('Search YouTube instead of looking up a URL'))

/** Discord's default upload limit for bots. Bigger files are sent as a link. */
const MAX_UPLOAD = 10 * 1024 * 1024

const field = (v: string | undefined) => (v ? v.slice(0, 1024) : 'N/A')

async function videoEmbed(url: string): Promise<EmbedBuilder> {
  const $ = cheerio.load(await fetchText(url, { headers: { 'user-agent': BROWSER_UA, 'accept-language': 'en' } }))
  const meta = (attr: 'name' | 'itemprop', key: string) => $(`meta[${attr}="${key}"]`).attr('content')

  return new EmbedBuilder()
    .setTitle((meta('name', 'title') ?? $('title').text() ?? 'YouTube video').slice(0, 256))
    .setDescription(meta('name', 'description')?.slice(0, 4096) || null)
    .setColor(Colors.Red)
    .addFields(
      { name: 'Views', value: field(meta('itemprop', 'interactionCount')), inline: true },
      { name: 'Channel', value: field($('link[itemprop="name"]').attr('content')), inline: true },
      { name: 'Uploaded at', value: field(meta('itemprop', 'uploadDate')), inline: true },
      { name: 'Duration', value: field(meta('itemprop', 'duration')?.replace('PT', '')), inline: true },
      { name: 'Keywords', value: field(meta('name', 'keywords')), inline: true },
      { name: 'Category', value: field(meta('itemprop', 'genre')), inline: true },
    )
}

async function sendDownload(i: ButtonInteraction, streamUrl: string, filename: string) {
  const head = await fetch(streamUrl, { method: 'HEAD' }).catch(() => null)
  const size = Number(head?.headers.get('content-length') ?? 0)
  if (!head?.ok || size === 0 || size > MAX_UPLOAD) {
    await i.followUp({ content: `File is too large to upload here, download it directly: <${streamUrl}>`, ephemeral: true })
    return
  }
  const buf = Buffer.from(await (await fetch(streamUrl)).arrayBuffer())
  await i.followUp({ files: [new AttachmentBuilder(buf, { name: filename })] })
}

async function handleButton(i: ButtonInteraction, id: string) {
  if (i.customId === 'yt_channel') {
    await i.reply({ content: 'Getting channels...', ephemeral: true })
    const info = await ytDownloadInfo(id)
    if (!info.channelId) throw new CommandError('Channel not found.')
    const { meta } = await ytApi('channel/home', { id: info.channelId })
    const embed = new EmbedBuilder()
      .setTitle(meta.title)
      .setDescription(meta.description?.slice(0, 4096) || null)
      .addFields(
        { name: 'Handle', value: field(meta.channelHandle), inline: true },
        { name: 'Subscribers', value: field(meta.subscriberCountText), inline: true },
        { name: 'Video Count', value: field(meta.videosCountText), inline: true },
      )
    if (meta.avatar?.[0]?.url) embed.setThumbnail(meta.avatar[0].url)
    if (meta.banner?.[0]?.url) embed.setImage(meta.banner[0].url)
    await i.followUp({ content: 'Channel Found!', embeds: [embed] })
    return
  }

  if (!(await isPremium(i.user.id))) {
    await i.reply({ content: "You're not a premium user!", ephemeral: true })
    return
  }
  await i.reply({ content: 'Downloading...', ephemeral: true })
  if (i.customId === 'yt_download') await sendDownload(i, await videoUrl(id), 'video.mp4')
  else await sendDownload(i, await audioUrl(id), 'audio.m4a')
}

export async function execute(ctx: ChatInputCommandInteraction) {
  const q = ctx.options.getString('query_or_url', true)

  if (ctx.options.getBoolean('search')) {
    await ctx.reply({ content: 'Searching 🔎...', ephemeral: true })
    const e = await ytApi('search', { query: q })
    const embed = new EmbedBuilder().setTitle(`"${q}" Videos`.slice(0, 256)).setColor(Colors.Red)
    for (const v of (e.data ?? []).filter((v: any) => v.videoId).slice(0, 25)) {
      embed.addFields({
        name: `${v.title} by ${v.channelTitle ?? 'Anonymous'}`.slice(0, 256),
        value: `https://youtube.com/watch?v=${v.videoId}`,
      })
    }
    await ctx.followUp({ content: 'Videos found', embeds: [embed] })
    return
  }

  const id = youtubeId(q)
  if (!id) {
    await ctx.reply({ content: "That doesn't look like a YouTube URL. Use `search: True` to search.", ephemeral: true })
    return
  }

  await ctx.deferReply()
  const url = `https://www.youtube.com/watch?v=${id}`
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('yt_download').setLabel('Download').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('yt_mp3').setLabel('Download MP3').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('yt_channel').setLabel('Channel Info').setStyle(ButtonStyle.Primary),
  )
  await ctx.followUp({ content: url, embeds: [await videoEmbed(url)], components: [row] })

  const message = await ctx.fetchReply()
  const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 600_000 })
  collector.on('collect', async (i) => {
    try {
      await handleButton(i, id)
    } catch (err) {
      const content = err instanceof CommandError ? err.message : 'Something went wrong.'
      if (!(err instanceof CommandError)) console.error('youtube button error:', err)
      if (i.replied || i.deferred) await i.followUp({ content, ephemeral: true }).catch(() => null)
      else await i.reply({ content, ephemeral: true }).catch(() => null)
    }
  })
  collector.on('end', () => {
    ctx.editReply({ components: [] }).catch(() => null)
  })
}

import {
  SlashCommandBuilder,
  AttachmentBuilder,
  ChannelType,
  MessageFlags,
  type ChatInputCommandInteraction,
  type User,
} from 'discord.js'
import sharp from 'sharp'
import { CommandScope } from '@/bot/commands/types'
import { CommandError, fetchBuffer, fetchJson, rapidApi } from '@/bot/utils/http'

export const scope = CommandScope.All
export const premium = true

export const data = new SlashCommandBuilder()
  .setName('say')
  .setDescription('Say something')
  .addStringOption((o) => o.setName('phrase').setDescription('What to say').setRequired(true).setMaxLength(1500))
  .addBooleanOption((o) => o.setName('hear').setDescription('Get an audio pronunciation instead'))
  .addUserOption((o) => o.setName('user').setDescription('Say it as this user'))
  .addBooleanOption((o) => o.setName('old').setDescription('With user: send via webhook instead of an image'))

const FLAGGED = ['ban', 'kick', 'timeout', 'fuck', 'nigga', 'nigger', 'niger', 'niga']
const COMMAND_PREFIXES = ['.', '!', '?', ',', '/', '*', '^', '$', '#', '@']

/** Validate + censor the phrase the same way the Python bot did. Throws CommandError if rejected. */
async function sanitize(phrase: string): Promise<string> {
  const text = phrase.replace('.say', '')
  if (FLAGGED.some((w) => text.toLowerCase().includes(w))) throw new CommandError('Flagged Text, cannot be executed')
  if (text.length <= 3) throw new CommandError('Too small')
  if (COMMAND_PREFIXES.includes(text[0])) throw new CommandError('Command Cannot be executed')

  // Drop words containing non-ASCII characters (lookalike-letter filter bypasses).
  const asciiOnly = text.split(/\s+/).filter((w) => /^[\x00-\x7f]*$/.test(w)).join(' ')
  if (!asciiOnly.trim()) throw new CommandError('Too small')

  const { result } = await rapidApi<{ result: string }>(
    'https://community-purgomalum.p.rapidapi.com/json',
    'community-purgomalum.p.rapidapi.com',
    { params: { text: asciiOnly } },
  )
  return result.replaceAll('*', '#')
}

async function pronounce(ctx: ChatInputCommandInteraction, word: string) {
  await ctx.followUp({ content: 'Getting pronunciation', ephemeral: true })
  const f = await fetchJson<any>(`https://ftapi.pythonanywhere.com/translate?dl=en&text=${encodeURIComponent(word)}`)
  const audioUrl: string | undefined = f.pronunciation?.['source-text-audio']
  if (!audioUrl) throw new CommandError('No word found')
  await ctx.followUp({ files: [new AttachmentBuilder(await fetchBuffer(audioUrl), { name: 'pronunciation.mp3' })] })
}

async function sayAsWebhook(ctx: ChatInputCommandInteraction, user: User, text: string) {
  const channel = ctx.channel
  if (!channel || channel.type !== ChannelType.GuildText) {
    throw new CommandError('Webhook mode only works in server text channels.')
  }
  const webhook = await channel.createWebhook({ name: user.username, avatar: user.displayAvatarURL() }).catch(() => {
    throw new CommandError('I need the Manage Webhooks permission for this.')
  })
  try {
    await webhook.send({
      content: text,
      username: user.displayName,
      avatarURL: user.displayAvatarURL(),
      flags: MessageFlags.SuppressNotifications,
      allowedMentions: { parse: [] },
    })
  } finally {
    await webhook.delete().catch(() => null)
  }
}

async function sayAsImage(ctx: ChatInputCommandInteraction, user: User, text: string) {
  const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const params = new URLSearchParams({
    name: user.username,
    color: 'white',
    time: `Today at ${time}`,
    avatar: user.displayAvatarURL({ extension: 'png' }),
    text,
  })
  const image = await fetchBuffer(`https://tools.tutla.net/api/message?${params}`)
  // Same crop as the Python bot: keep the top 15% of the rendered image (the message itself).
  const { width, height } = await sharp(image).metadata()
  const out = await sharp(image)
    .extract({ left: 0, top: 0, width: width!, height: Math.max(1, Math.round(height! * 0.15)) })
    .png()
    .toBuffer()
  await ctx.followUp({ files: [new AttachmentBuilder(out, { name: 'message.png' })] })
}

export async function execute(ctx: ChatInputCommandInteraction) {
  const phrase = ctx.options.getString('phrase', true)
  const user = ctx.options.getUser('user')
  await ctx.deferReply({ ephemeral: !!user })

  if (ctx.options.getBoolean('hear')) {
    await pronounce(ctx, phrase)
    return
  }

  if (phrase.toLowerCase().includes('rizz')) await ctx.followUp(`${ctx.user} you got NO rizz`)
  const text = await sanitize(phrase)

  if (!user) {
    await ctx.followUp({ content: text, flags: MessageFlags.SuppressNotifications, allowedMentions: { parse: [] } })
    return
  }

  await ctx.followUp({ content: 'Sending message...', ephemeral: true })
  if (ctx.options.getBoolean('old')) await sayAsWebhook(ctx, user, text)
  else await sayAsImage(ctx, user, text)
}

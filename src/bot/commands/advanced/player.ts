import { Readable } from 'node:stream'
import { SlashCommandBuilder, ChannelType, InteractionContextType, type ChatInputCommandInteraction } from 'discord.js'
import {
  AudioPlayerStatus,
  StreamType,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
  type AudioPlayer,
  type VoiceConnection,
} from '@discordjs/voice'
import { CommandScope } from '@/bot/commands/types'
import { CommandError } from '@/bot/utils/http'
import { audioUrl, youtubeId } from '@/bot/utils/youtube'

export const scope = CommandScope.Global
export const premium = true

export const data = new SlashCommandBuilder()
  .setName('player')
  .setDescription('Music/Video Player')
  .setContexts(InteractionContextType.Guild)
  .addSubcommand((s) =>
    s
      .setName('play')
      .setDescription('Play a song/mp3 in VC')
      .addChannelOption((o) =>
        o.setName('vc').setDescription('Voice channel').setRequired(true).addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice),
      )
      .addStringOption((o) => o.setName('url').setDescription('YouTube URL or direct audio file URL').setRequired(true)),
  )
  .addSubcommand((s) =>
    s
      .setName('stop')
      .setDescription('Stop playing')
      .addChannelOption((o) =>
        o.setName('vc').setDescription('Voice channel').setRequired(true).addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice),
      ),
  )

/** One voice session per guild (Discord only allows a bot in one VC per guild). */
const sessions = new Map<string, { channelId: string; connection: VoiceConnection; player: AudioPlayer }>()

function endSession(guildId: string) {
  const session = sessions.get(guildId)
  if (!session) return
  sessions.delete(guildId)
  session.player.stop(true)
  session.connection.destroy()
}

async function openStream(url: string): Promise<Readable> {
  const res = await fetch(url)
  if (!res.ok || !res.body) throw new CommandError('Could not download that audio.')
  return Readable.fromWeb(res.body as import('node:stream/web').ReadableStream)
}

export async function execute(ctx: ChatInputCommandInteraction) {
  if (!ctx.inCachedGuild()) {
    await ctx.reply({ content: 'This command only works in servers.', ephemeral: true })
    return
  }
  const vc = ctx.options.getChannel('vc', true, [ChannelType.GuildVoice, ChannelType.GuildStageVoice])

  if (ctx.options.getSubcommand() === 'stop') {
    const session = sessions.get(ctx.guildId)
    if (!session || session.channelId !== vc.id) {
      await ctx.reply({ content: "I'm not playing in that channel.", ephemeral: true })
      return
    }
    endSession(ctx.guildId)
    await ctx.reply('Disconnected')
    return
  }

  const url = ctx.options.getString('url', true)
  await ctx.deferReply()
  await ctx.followUp({ content: 'Downloading...', ephemeral: true })

  const id = youtubeId(url)
  const stream = await openStream(id ? await audioUrl(id) : url)

  let session = sessions.get(ctx.guildId)
  if (session && session.channelId !== vc.id) {
    endSession(ctx.guildId)
    session = undefined
  }
  if (!session) {
    const connection = joinVoiceChannel({
      channelId: vc.id,
      guildId: ctx.guildId,
      adapterCreator: ctx.guild.voiceAdapterCreator,
    })
    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 20_000)
    } catch {
      connection.destroy()
      throw new CommandError("Couldn't connect to that voice channel.")
    }
    const player = createAudioPlayer()
    connection.subscribe(player)
    player.on('error', (err) => console.error('Voice player error:', err.message))
    player.on(AudioPlayerStatus.Idle, () => endSession(ctx.guildId))
    connection.on(VoiceConnectionStatus.Disconnected, () => endSession(ctx.guildId))
    session = { channelId: vc.id, connection, player }
    sessions.set(ctx.guildId, session)
  }

  // Arbitrary input is transcoded to Opus by ffmpeg (must be on PATH).
  session.player.play(createAudioResource(stream, { inputType: StreamType.Arbitrary }))
  await ctx.followUp(`[Playing](<${url}>) in ${vc}...`)
}

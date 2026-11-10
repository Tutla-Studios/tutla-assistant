import { SlashCommandBuilder, type ChatInputCommandInteraction, type Message } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { fetchLoggingChannel } from '@/bot/utils/feed'
import { CommandError, clip } from '@/bot/utils/http'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('bugs')
  .setDescription('Lists bugs in the bot')

export async function execute(ctx: ChatInputCommandInteraction) {
  const channel = await fetchLoggingChannel(ctx.client)
  if (!channel) throw new CommandError('Reporting is not configured (missing LOGGING_CHANNEL_ID).')
  await ctx.deferReply({ ephemeral: true })

  // Discord returns at most 100 messages per request; fetch two pages to cover the last 200.
  const messages: Message[] = []
  let before: string | undefined
  for (let page = 0; page < 2; page++) {
    const batch = await channel.messages.fetch({ limit: 100, before })
    messages.push(...batch.values())
    if (batch.size < 100) break
    before = batch.last()?.id
  }

  const bugs = messages.filter((m) => m.content.includes('Bug/Suggestion'))
  const out = bugs.length ? 'Bugs:\n' + bugs.map((m) => `- ${m.content}`).join('\n') : 'No bugs reported.'
  await ctx.followUp(clip(out))
}

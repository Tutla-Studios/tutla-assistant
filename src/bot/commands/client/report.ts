import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { fetchLoggingChannel } from '@/bot/utils/feed'
import { CommandError, randInt } from '@/bot/utils/http'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('report')
  .setDescription('Report a bug/suggest')
  .addStringOption((o) => o.setName('bug').setDescription('Describe the bug or suggestion').setRequired(true).setMaxLength(1500))

export async function execute(ctx: ChatInputCommandInteraction) {
  const bug = ctx.options.getString('bug', true).replaceAll('```', "'''")
  const channel = await fetchLoggingChannel(ctx.client)
  if (!channel) throw new CommandError('Reporting is not configured (missing LOGGING_CHANNEL_ID).')

  const id = randInt(10000, 99999)
  await channel.send({
    content: `Bug/Suggestion #${id}:\n\`\`\`yaml\n${bug}\`\`\`\nReported By ${ctx.user}`,
    allowedMentions: { parse: [] },
  })
  await ctx.reply(
    `:warning: Spamming Suggestions/Bug or False Reports will result in a Tutla Assistance Ban!:warning:\n Reported Bug ID: ${id}\n\`\`\`yaml\n${bug}\`\`\``,
  )
}

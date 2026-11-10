import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { loadQotd } from '@/bot/utils/feed'
import { clearChangelogCache } from './changelog'

export const scope = CommandScope.All
export const premium = true

export const data = new SlashCommandBuilder()
  .setName('reload')
  .setDescription('Reload the bot data')

export async function execute(ctx: ChatInputCommandInteraction) {
  // Premium/ban status is read live from the DB now; this refreshes the remaining cached data.
  clearChangelogCache()
  await loadQotd()
  await ctx.reply({ content: 'Reloaded bot data.', ephemeral: true })
}

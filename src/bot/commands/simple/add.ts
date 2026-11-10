import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { buildAddBotRow } from './help'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('add')
  .setDescription('Add the bot')

export async function execute(ctx: ChatInputCommandInteraction) {
  await ctx.reply({
    content: 'Use me and get to use cool tools, fun commands, music playing, economy, and more!',
    components: [buildAddBotRow()],
  })
}

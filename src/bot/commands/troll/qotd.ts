import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { state } from '@/bot/state'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('qotd')
  .setDescription('Get the question of the day')

export async function execute(ctx: ChatInputCommandInteraction) {
  await ctx.reply(state.qotd || 'No question of the day has been set yet.')
}

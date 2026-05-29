import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'

export const scope = CommandScope.User

export const data = new SlashCommandBuilder()
  .setName('coinflip')
  .setDescription('Unbiased coinflip')

export async function execute(ctx: ChatInputCommandInteraction) {
  await ctx.reply(Math.random() < 0.5 ? 'Heads' : 'Tails')
}

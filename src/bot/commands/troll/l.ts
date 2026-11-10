import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('l')
  .setDescription('LMAO')

export async function execute(ctx: ChatInputCommandInteraction) {
  await ctx.reply('lmao')
}

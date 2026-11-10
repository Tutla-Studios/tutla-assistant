import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('racisim')
  .setDescription('Call out attempted racism')

export async function execute(ctx: ChatInputCommandInteraction) {
  await ctx.reply(`${ctx.user} bro really tried being racist`)
}

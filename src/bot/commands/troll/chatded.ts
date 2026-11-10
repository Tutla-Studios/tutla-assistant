import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('chatded')
  .setDescription('Show current time with chat ded message')

export async function execute(ctx: ChatInputCommandInteraction) {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  await ctx.reply(`Chat ded - \`${now} UTC\``)
}

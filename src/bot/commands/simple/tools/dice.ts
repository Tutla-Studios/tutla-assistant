import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('dice')
  .setDescription('Roll a dice!')

export async function execute(ctx: ChatInputCommandInteraction) {
  await ctx.reply(`Dice Roll: ${Math.floor(Math.random() * 6) + 1}`)
}

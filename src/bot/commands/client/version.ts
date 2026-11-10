import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import pkg from '../../../../package.json'

export const scope = CommandScope.All
export const skipChecks = true

export const data = new SlashCommandBuilder()
  .setName('version')
  .setDescription('Tutla Assistance Version')

export async function execute(ctx: ChatInputCommandInteraction) {
  await ctx.reply(`Tutla Assistance v3 (${pkg.version})`)
}

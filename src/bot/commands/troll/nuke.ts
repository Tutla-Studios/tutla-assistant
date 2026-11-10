import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'

export const scope = CommandScope.All
export const skipChecks = true

export const data = new SlashCommandBuilder()
  .setName('nuke')
  .setDescription('Nuke the server')

export async function execute(ctx: ChatInputCommandInteraction) {
  await ctx.reply('Imma go nuke this sh1t. (contact num for ultimate nuking service: `6942014696969`)')
  await new Promise((r) => setTimeout(r, 2000))
  await ctx.followUp('Nuking server....')
}

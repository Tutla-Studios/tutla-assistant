import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { pick } from '@/bot/utils/http'
import { showerThoughts } from './scraped'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('showerthought')
  .setDescription('Get a random shower thought')

export async function execute(ctx: ChatInputCommandInteraction) {
  await ctx.reply(pick(await showerThoughts()))
}

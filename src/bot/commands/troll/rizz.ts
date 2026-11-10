import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { pick } from '@/bot/utils/http'
import { rizzLines } from './scraped'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('rizz')
  .setDescription('Pickup lines uwu~s')

export async function execute(ctx: ChatInputCommandInteraction) {
  await ctx.reply(pick(await rizzLines()))
}

import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { pick } from '@/bot/utils/http'
import { FACTS } from './data'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('fact')
  .setDescription('Get a random fact')

export async function execute(ctx: ChatInputCommandInteraction) {
  await ctx.reply(`Did you know? ${pick(FACTS)}`)
}

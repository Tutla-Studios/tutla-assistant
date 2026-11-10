import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { pick } from '@/bot/utils/http'
import { NPC_PHRASES } from './data'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('antinpc')
  .setDescription('Deal with NPCs')

export async function execute(ctx: ChatInputCommandInteraction) {
  await ctx.reply(pick(NPC_PHRASES))
}

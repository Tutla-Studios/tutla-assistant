import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { clip } from '@/bot/utils/http'
import { joshify } from './text'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('joshify')
  .setDescription('Ruin grammar')
  .addStringOption((o) => o.setName('input').setDescription('Text to ruin').setRequired(true))

export async function execute(ctx: ChatInputCommandInteraction) {
  await ctx.reply(clip(joshify(ctx.options.getString('input', true))))
}

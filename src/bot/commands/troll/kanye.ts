import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { fetchJson } from '@/bot/utils/http'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('kanye')
  .setDescription('Get a Kanye West quote')

export async function execute(ctx: ChatInputCommandInteraction) {
  const { quote } = await fetchJson<{ quote: string }>('https://api.kanye.rest')
  await ctx.reply(quote)
}

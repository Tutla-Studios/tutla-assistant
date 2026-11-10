import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { fetchJson } from '@/bot/utils/http'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('catfact')
  .setDescription('Get a random cat fact')

export async function execute(ctx: ChatInputCommandInteraction) {
  const { fact } = await fetchJson<{ fact: string }>('https://catfact.ninja/fact')
  await ctx.reply(fact)
}

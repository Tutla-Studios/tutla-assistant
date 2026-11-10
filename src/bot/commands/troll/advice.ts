import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { fetchJson } from '@/bot/utils/http'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('advice')
  .setDescription('Get random advice')

export async function execute(ctx: ChatInputCommandInteraction) {
  const { slip } = await fetchJson<{ slip: { advice: string } }>('https://api.adviceslip.com/advice')
  await ctx.reply(slip.advice)
}

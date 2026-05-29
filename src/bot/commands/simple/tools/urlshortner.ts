import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('urlshortner')
  .setDescription('Shorten a url')
  .addStringOption((opt) =>
    opt.setName('url').setDescription('URL to shorten').setRequired(true),
  )

export async function execute(ctx: ChatInputCommandInteraction) {
  await ctx.deferReply({ ephemeral: true })
  const url = ctx.options.getString('url', true)
  const apiKey = process.env.RAPID_API_KEY

  if (!apiKey) {
    await ctx.followUp('URL shortener is not configured (missing RAPID_API_KEY).')
    return
  }

  const res = await fetch('https://fast-url-shortener1.p.rapidapi.com/shorten', {
    method: 'POST',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'fast-url-shortener1.p.rapidapi.com',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  })
  const data = await res.json() as any
  await ctx.followUp(data.shortened)
}

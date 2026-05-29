import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('translate')
  .setDescription('Translate text')
  .addStringOption((opt) =>
    opt.setName('from_language').setDescription("Source language code or 'detect'").setRequired(true),
  )
  .addStringOption((opt) =>
    opt.setName('to_language').setDescription('Target language code').setRequired(true),
  )
  .addStringOption((opt) =>
    opt.setName('text').setDescription('Text to translate').setRequired(true),
  )

export async function execute(ctx: ChatInputCommandInteraction) {
  await ctx.deferReply({ ephemeral: true })
  const from = ctx.options.getString('from_language', true).toUpperCase()
  const to = ctx.options.getString('to_language', true).toUpperCase()
  const text = ctx.options.getString('text', true)

  const url = from === 'DETECT'
    ? `https://ftapi.pythonanywhere.com/translate?dl=${to}&text=${encodeURIComponent(text)}`
    : `https://ftapi.pythonanywhere.com/translate?sl=${from}&dl=${to}&text=${encodeURIComponent(text)}`

  const res = await fetch(url)
  const data = await res.json() as any
  const translated = data.translations['possible-translations'][0]
  await ctx.followUp(`\`${from}\` to \`${to}\`: ${translated}\n-# Source Text: ${text}`)
}

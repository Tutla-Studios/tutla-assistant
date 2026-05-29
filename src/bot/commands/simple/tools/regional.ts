import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('regional')
  .setDescription('Create regional indicator text')
  .addStringOption((opt) =>
    opt.setName('text').setDescription('Text to convert').setRequired(true),
  )

export async function execute(ctx: ChatInputCommandInteraction) {
  const text = ctx.options.getString('text', true)
  const result = text
    .split('')
    .map((char) => {
      if (char === ' ') return '      '
      const lower = char.toLowerCase()
      const pos = lower.charCodeAt(0) - 97
      if (pos >= 0 && pos <= 25) return `:regional_indicator_${lower}: `
      return char
    })
    .join('')
  await ctx.reply(result || '​')
}

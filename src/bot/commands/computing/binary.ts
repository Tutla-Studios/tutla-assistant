import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { clip } from '@/bot/utils/http'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('binary')
  .setDescription('Binary Encode/Decode')
  .addStringOption((o) => o.setName('text').setDescription('Text to encode/decode').setRequired(true))
  .addBooleanOption((o) => o.setName('decode').setDescription('Decode instead of encode'))

export async function execute(ctx: ChatInputCommandInteraction) {
  const text = ctx.options.getString('text', true)
  if (ctx.options.getBoolean('decode')) {
    const bytes = text.trim().split(/\s+/)
    if (!bytes.every((b) => /^[01]+$/.test(b))) {
      await ctx.reply('Invalid binary.')
      return
    }
    await ctx.reply(clip(bytes.map((b) => String.fromCodePoint(parseInt(b, 2))).join('')))
  } else {
    await ctx.reply(clip([...text].map((c) => c.codePointAt(0)!.toString(2).padStart(8, '0')).join(' ')))
  }
}

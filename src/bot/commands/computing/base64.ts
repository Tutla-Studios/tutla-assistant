import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { clip } from '@/bot/utils/http'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('base64')
  .setDescription('Base64 Encode/Decode')
  .addStringOption((o) => o.setName('text').setDescription('Text to encode/decode').setRequired(true))
  .addBooleanOption((o) => o.setName('decode').setDescription('Decode instead of encode'))

export async function execute(ctx: ChatInputCommandInteraction) {
  const text = ctx.options.getString('text', true)
  if (ctx.options.getBoolean('decode')) {
    const clean = text.trim()
    if (!/^[A-Za-z0-9+/_-]*={0,2}$/.test(clean)) {
      await ctx.reply('Invalid base64 encoding.')
      return
    }
    await ctx.reply(clip(`Base64 Decoded: \`${Buffer.from(clean, 'base64').toString('utf8')}\``))
  } else {
    await ctx.reply(clip(`Base64 Encoded: \`${Buffer.from(text, 'utf8').toString('base64')}\``))
  }
}

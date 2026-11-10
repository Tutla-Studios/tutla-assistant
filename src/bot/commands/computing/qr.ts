import { SlashCommandBuilder, AttachmentBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { fetchBuffer } from '@/bot/utils/http'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('qr')
  .setDescription('Generate a QR Code')
  .addStringOption((o) => o.setName('url').setDescription('Text or URL to encode').setRequired(true))

export async function execute(ctx: ChatInputCommandInteraction) {
  const url = ctx.options.getString('url', true)
  const buf = await fetchBuffer(
    `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`,
  )
  await ctx.reply({ files: [new AttachmentBuilder(buf, { name: 'qr.png' })] })
}

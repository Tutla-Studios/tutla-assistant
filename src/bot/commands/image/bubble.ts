import path from 'node:path'
import { SlashCommandBuilder, AttachmentBuilder, type ChatInputCommandInteraction } from 'discord.js'
import sharp from 'sharp'
import { CommandScope } from '@/bot/commands/types'
import { ASSETS_DIR, readImage } from '@/bot/utils/images'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('bubble')
  .setDescription('Add a bubble to image')
  .addAttachmentOption((o) => o.setName('image').setDescription('Image').setRequired(true))

export async function execute(ctx: ChatInputCommandInteraction) {
  const attachment = ctx.options.getAttachment('image', true)
  await ctx.reply({ content: 'Editing Image....', ephemeral: true })

  const input = sharp(await readImage(attachment)).ensureAlpha()
  const { width, height } = await input.metadata()
  if (!width || !height) throw new Error('Could not read image size')

  const bubble = await sharp(path.join(ASSETS_DIR, 'bubble.png'))
    .resize(width, Math.max(1, Math.floor(height / 4)), { fit: 'fill' })
    .toBuffer()

  const withBubble = await input.composite([{ input: bubble, top: 0, left: 0 }]).png().toBuffer()
  const out = await sharp(withBubble)
    .resize(Math.floor(width * 1.5), height, { fit: 'fill' })
    .gif()
    .toBuffer()

  await ctx.followUp({ files: [new AttachmentBuilder(out, { name: 'bubble.gif' })] })
}

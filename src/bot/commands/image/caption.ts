import { SlashCommandBuilder, AttachmentBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas'
import { CommandScope } from '@/bot/commands/types'
import { fontPath, readImage } from '@/bot/utils/images'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('caption')
  .setDescription('Add caption to an image')
  .addAttachmentOption((o) => o.setName('image').setDescription('Image to caption').setRequired(true))
  .addStringOption((o) => o.setName('text').setDescription('Caption text').setRequired(true))

const BOX_HEIGHT = 80
const FONT_FAMILY = 'TutlaCaption'
let fontRegistered = false

export async function execute(ctx: ChatInputCommandInteraction) {
  const attachment = ctx.options.getAttachment('image', true)
  const caption = ctx.options.getString('text', true)
  await ctx.deferReply()

  if (!fontRegistered) {
    GlobalFonts.registerFromPath(fontPath('font'), FONT_FAMILY)
    fontRegistered = true
  }

  const image = await loadImage(await readImage(attachment))
  const canvas = createCanvas(image.width, image.height + BOX_HEIGHT)
  const g = canvas.getContext('2d')

  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, canvas.width, BOX_HEIGHT)

  // Grow the font until the text no longer fits the box (90% width, box height).
  let size = 1
  for (;;) {
    g.font = `${size + 1}px ${FONT_FAMILY}`
    const m = g.measureText(caption)
    const h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent
    if (h > BOX_HEIGHT * 0.9 || m.width > image.width * 0.9 || size > 400) break
    size++
  }
  g.font = `${size}px ${FONT_FAMILY}`
  g.fillStyle = '#000000'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(caption, canvas.width / 2, BOX_HEIGHT / 2)

  g.drawImage(image, 0, BOX_HEIGHT)

  const out = await canvas.encode('png')
  await ctx.followUp({ files: [new AttachmentBuilder(out, { name: 'image_with_caption.png' })] })
}

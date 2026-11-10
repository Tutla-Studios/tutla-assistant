import {
  SlashCommandBuilder,
  AttachmentBuilder,
  type ChatInputCommandInteraction,
  type SlashCommandSubcommandBuilder,
} from 'discord.js'
import sharp from 'sharp'
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas'
import { CommandScope } from '@/bot/commands/types'
import { CommandError, fetchBuffer, fetchJson } from '@/bot/utils/http'
import { FONTS, fontPath, readImage, toHex } from '@/bot/utils/images'
import { removeBackground } from './removebg'

export const scope = CommandScope.All
export const premiumSubcommands = ['getcolors', 'extract_text', 'kernel', 'removebackground', 'text', 'image'] as const

const withImage = (s: SlashCommandSubcommandBuilder) =>
  s.addAttachmentOption((o) => o.setName('image').setDescription('Image to edit').setRequired(true))

const FORMATS = ['png', 'jpeg', 'webp', 'gif', 'tiff', 'avif'] as const

export const data = new SlashCommandBuilder()
  .setName('photoshop')
  .setDescription('Image editing commands')
  .addSubcommand((s) => withImage(s.setName('getcolors').setDescription('Get all colors in an image')))
  .addSubcommand((s) => withImage(s.setName('extract_text').setDescription('Extract text from an image')))
  .addSubcommand((s) =>
    withImage(s.setName('kernel').setDescription('Burn an image')).addIntegerOption((o) =>
      o.setName('level').setDescription('Burn strength').setRequired(true).setMinValue(-20).setMaxValue(20),
    ),
  )
  .addSubcommand((s) => withImage(s.setName('removewhite').setDescription('Converts white to a transparent part')))
  .addSubcommand((s) =>
    withImage(s.setName('removebackground').setDescription('Removes background')).addIntegerOption((o) =>
      o.setName('tolerance').setDescription('How different a colour can be and still count as background (default 40)').setMinValue(1).setMaxValue(200),
    ),
  )
  .addSubcommand((s) =>
    withImage(s.setName('text').setDescription('Add text to an image'))
      .addStringOption((o) => o.setName('text').setDescription('Text to draw').setRequired(true))
      .addIntegerOption((o) => o.setName('size').setDescription('Font size (default 32)').setMinValue(1).setMaxValue(1000))
      .addIntegerOption((o) => o.setName('y_position').setDescription('Y position (default 0)'))
      .addIntegerOption((o) => o.setName('x_position').setDescription('X position (default 0)'))
      .addIntegerOption((o) => o.setName('r').setDescription('Red (default 255)').setMinValue(0).setMaxValue(255))
      .addIntegerOption((o) => o.setName('g').setDescription('Green (default 255)').setMinValue(0).setMaxValue(255))
      .addIntegerOption((o) => o.setName('b').setDescription('Blue (default 255)').setMinValue(0).setMaxValue(255))
      .addStringOption((o) =>
        o
          .setName('font')
          .setDescription('Font (default roboto)')
          .addChoices(...FONTS.slice(0, 25).map((f) => ({ name: f, value: f }))),
      ),
  )
  .addSubcommand((s) =>
    withImage(s.setName('image').setDescription('Add an image to an image'))
      .addAttachmentOption((o) => o.setName('overlay').setDescription('Image to paste on top').setRequired(true))
      .addIntegerOption((o) => o.setName('y_position').setDescription('Y position').setRequired(true))
      .addIntegerOption((o) => o.setName('x_position').setDescription('X position').setRequired(true)),
  )
  .addSubcommand((s) =>
    s
      .setName('placeholder')
      .setDescription('Generate a placeholder image')
      .addIntegerOption((o) => o.setName('width').setDescription('Width').setRequired(true).setMinValue(1).setMaxValue(4000))
      .addIntegerOption((o) => o.setName('height').setDescription('Height').setRequired(true).setMinValue(1).setMaxValue(4000)),
  )
  .addSubcommand((s) =>
    withImage(s.setName('convert').setDescription('Change filetype (image)')).addStringOption((o) =>
      o
        .setName('filetype')
        .setDescription('Target format (default gif)')
        .addChoices(...FORMATS.map((f) => ({ name: f, value: f }))),
    ),
  )
  .addSubcommand((s) =>
    withImage(s.setName('resize').setDescription('Resize an image'))
      .addIntegerOption((o) => o.setName('width').setDescription('Width').setRequired(true).setMinValue(1).setMaxValue(8000))
      .addIntegerOption((o) => o.setName('height').setDescription('Height').setRequired(true).setMinValue(1).setMaxValue(8000)),
  )
  .addSubcommand((s) =>
    withImage(s.setName('rotate').setDescription('Rotate an image')).addIntegerOption((o) =>
      o.setName('degree').setDescription('Degrees counter-clockwise').setRequired(true),
    ),
  )
  .addSubcommand((s) =>
    withImage(s.setName('blur').setDescription('Blur an image'))
      .addIntegerOption((o) => o.setName('blur_radius').setDescription('Blur radius').setRequired(true).setMinValue(0).setMaxValue(200))
      .addIntegerOption((o) => o.setName('width').setDescription('Region width (default 50)').setMinValue(1))
      .addIntegerOption((o) => o.setName('height').setDescription('Region height (default 50)').setMinValue(1))
      .addIntegerOption((o) => o.setName('x').setDescription('Region X (default 50)').setMinValue(0))
      .addIntegerOption((o) => o.setName('y').setDescription('Region Y (default 50)').setMinValue(0)),
  )

const registeredFonts = new Set<string>()
function fontFamily(name: string): string {
  const family = `Tutla_${name}`
  if (!registeredFonts.has(name)) {
    GlobalFonts.registerFromPath(fontPath(name), family)
    registeredFonts.add(name)
  }
  return family
}

const png = (buf: Buffer, name = 'output.png') => ({ files: [new AttachmentBuilder(buf, { name })] })

type Handler = (ctx: ChatInputCommandInteraction, image: () => Promise<Buffer>) => Promise<void>

const handlers: Record<string, Handler> = {
  async getcolors(ctx, image) {
    const { data, info } = await sharp(await image()).removeAlpha().raw().toBuffer({ resolveWithObject: true })
    const seen = new Set<number>()
    for (let i = 0; i < data.length; i += info.channels) seen.add((data[i] << 16) | (data[i + 1] << 8) | data[i + 2])
    const list = [...seen].map((c) => toHex(c >> 16, (c >> 8) & 0xff, c & 0xff))
    await ctx.followUp({
      content: `Colors found in image: ${list.length}`,
      files: [new AttachmentBuilder(Buffer.from(list.join('\n')), { name: 'colors.txt' })],
    })
  },

  async extract_text(ctx, image) {
    const form = new FormData()
    form.append('image', new Blob([new Uint8Array(await image())], { type: 'image/png' }), 'image.png')
    const headers: Record<string, string> = {}
    if (process.env.API_NINJAS_KEY) headers['X-Api-Key'] = process.env.API_NINJAS_KEY
    const items = await fetchJson<{ text: string; bounding_box: { y1: number } }[]>(
      'https://api.api-ninjas.com/v1/imagetotext',
      { method: 'POST', body: form, headers },
    )
    // Group words into lines by rounding their top edge to the nearest 10px.
    const lines = new Map<number, string[]>()
    for (const item of items) {
      const y = Math.floor(item.bounding_box.y1 / 10) * 10
      lines.set(y, [...(lines.get(y) ?? []), item.text])
    }
    const text = [...lines.entries()].sort(([a], [b]) => a - b).map(([, words]) => words.join(' ')).join('\n')
    await ctx.followUp(text.slice(0, 2000) || 'No text found.')
  },

  async kernel(ctx, image) {
    const level = ctx.options.getInteger('level', true)
    const kernel = [-2, 0, -1, 0, 0, 0, -2, -1, 0, 0, -1, -1, 1, 1, 1, 0, 0, 1, 2, 0, 0, 0, 1, 0, 2].map((v) => v * level)
    const out = await sharp(await image()).convolve({ width: 5, height: 5, kernel, scale: 1, offset: 0 }).png().toBuffer()
    await ctx.followUp(png(out, 'image_with_filtered_kernel.png'))
  },

  async removewhite(ctx, image) {
    const { data, info } = await sharp(await image()).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] === 255 && data[i + 1] === 255 && data[i + 2] === 255) data[i + 3] = 0
    }
    const out = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer()
    await ctx.followUp(png(out, 'image_without_white.png'))
  },

  async removebackground(ctx, image) {
    const out = await removeBackground(await image(), ctx.options.getInteger('tolerance') ?? 40)
    await ctx.followUp(png(out, 'image_with_removed_bg.png'))
  },

  async text(ctx, image) {
    const font = ctx.options.getString('font') ?? 'roboto'
    if (!FONTS.includes(font)) throw new CommandError(`Select a valid font! Available: ${FONTS.join(', ')}`)
    const img = await loadImage(await image())
    const canvas = createCanvas(img.width, img.height)
    const g = canvas.getContext('2d')
    g.drawImage(img, 0, 0)
    g.font = `${ctx.options.getInteger('size') ?? 32}px ${fontFamily(font)}`
    g.fillStyle = `rgb(${ctx.options.getInteger('r') ?? 255}, ${ctx.options.getInteger('g') ?? 255}, ${ctx.options.getInteger('b') ?? 255})`
    g.textBaseline = 'top'
    g.fillText(ctx.options.getString('text', true), ctx.options.getInteger('x_position') ?? 0, ctx.options.getInteger('y_position') ?? 0)
    await ctx.followUp(png(await canvas.encode('png'), 'image_with_text.png'))
  },

  async image(ctx, image) {
    const base = await image()
    const overlay = await readImage(ctx.options.getAttachment('overlay', true))
    const meta = await sharp(base).metadata()
    const left = ctx.options.getInteger('x_position', true)
    const top = ctx.options.getInteger('y_position', true)
    // Crop the overlay to the part that lands inside the base image (sharp rejects out-of-bounds overlays).
    const ov = sharp(overlay).ensureAlpha()
    const om = await ov.metadata()
    const x0 = Math.max(0, -left)
    const y0 = Math.max(0, -top)
    const w = Math.min(om.width!, meta.width! - left) - x0
    const h = Math.min(om.height!, meta.height! - top) - y0
    if (w <= 0 || h <= 0) throw new CommandError('The overlay position is completely outside the image.')
    const cropped = await ov.extract({ left: x0, top: y0, width: w, height: h }).png().toBuffer()
    const out = await sharp(base).composite([{ input: cropped, left: left + x0, top: top + y0 }]).png().toBuffer()
    await ctx.followUp(png(out, 'image_with_overlay.png'))
  },

  async placeholder(ctx) {
    const w = ctx.options.getInteger('width', true)
    const h = ctx.options.getInteger('height', true)
    await ctx.followUp(png(await fetchBuffer(`https://fakeimg.pl/${w}x${h}`), 'placeholder.png'))
  },

  async convert(ctx, image) {
    const format = (ctx.options.getString('filetype') ?? 'gif') as (typeof FORMATS)[number]
    const out = await sharp(await image(), { animated: true }).toFormat(format).toBuffer()
    await ctx.followUp(png(out, `out.${format === 'jpeg' ? 'jpg' : format}`))
  },

  async resize(ctx, image) {
    const out = await sharp(await image())
      .resize(ctx.options.getInteger('width', true), ctx.options.getInteger('height', true), { fit: 'fill' })
      .png()
      .toBuffer()
    await ctx.followUp(png(out, 'resized.png'))
  },

  async rotate(ctx, image) {
    // Like PIL's Image.rotate: counter-clockwise, canvas keeps its original size.
    const input = await image()
    const { width, height } = await sharp(input).metadata()
    const rotated = await sharp(input)
      .rotate(-ctx.options.getInteger('degree', true), { background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer({ resolveWithObject: true })
    const out = await sharp(rotated.data)
      .extract({
        left: Math.floor((rotated.info.width - width!) / 2),
        top: Math.floor((rotated.info.height - height!) / 2),
        width: width!,
        height: height!,
      })
      .png()
      .toBuffer()
    await ctx.followUp(png(out, 'rotated.png'))
  },

  async blur(ctx, image) {
    const input = await image()
    const radius = ctx.options.getInteger('blur_radius', true)
    const { width: iw, height: ih } = await sharp(input).metadata()
    const width = Math.min(ctx.options.getInteger('width') ?? 50, iw!)
    const height = Math.min(ctx.options.getInteger('height') ?? 50, ih!)
    const left = Math.max(0, Math.min(ctx.options.getInteger('x') ?? 50, iw! - width))
    const top = Math.max(0, Math.min(ctx.options.getInteger('y') ?? 50, ih! - height))
    if (radius < 1) {
      await ctx.followUp(png(await sharp(input).png().toBuffer(), 'image_with_blur.png'))
      return
    }
    const region = await sharp(input).extract({ left, top, width, height }).blur(radius).toBuffer()
    const out = await sharp(input).composite([{ input: region, left, top }]).png().toBuffer()
    await ctx.followUp(png(out, 'image_with_blur.png'))
  },
}

export async function execute(ctx: ChatInputCommandInteraction) {
  const sub = ctx.options.getSubcommand()
  await ctx.reply({ content: 'Editing Image....', ephemeral: true })
  const attachment = ctx.options.getAttachment('image')
  const image = async () => {
    if (!attachment) throw new CommandError('An image is required.')
    return readImage(attachment)
  }
  await handlers[sub](ctx, image)
}

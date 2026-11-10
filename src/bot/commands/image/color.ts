import { SlashCommandBuilder, AttachmentBuilder, type ChatInputCommandInteraction } from 'discord.js'
import sharp from 'sharp'
import { CommandScope } from '@/bot/commands/types'
import { parseHex, toHex } from '@/bot/utils/images'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('color')
  .setDescription('Generate a color/gradient')
  .addStringOption((o) => o.setName('hex_1').setDescription('Color (e.g. #ff8800)').setRequired(true))
  .addStringOption((o) => o.setName('hex_2').setDescription('Second color → horizontal gradient'))
  .addIntegerOption((o) => o.setName('r').setDescription('Red (0-255), use with g and b').setMinValue(0).setMaxValue(255))
  .addIntegerOption((o) => o.setName('g').setDescription('Green (0-255)').setMinValue(0).setMaxValue(255))
  .addIntegerOption((o) => o.setName('b').setDescription('Blue (0-255)').setMinValue(0).setMaxValue(255))
  .addIntegerOption((o) => o.setName('length').setDescription('Gradient width (default 512)').setMinValue(2).setMaxValue(2048))

function solid(r: number, g: number, b: number) {
  return sharp({ create: { width: 200, height: 100, channels: 3, background: { r, g, b } } }).png().toBuffer()
}

export async function execute(ctx: ChatInputCommandInteraction) {
  const hex1 = ctx.options.getString('hex_1', true)
  const hex2 = ctx.options.getString('hex_2')
  const r = ctx.options.getInteger('r')
  const g = ctx.options.getInteger('g')
  const b = ctx.options.getInteger('b')

  if (hex2) {
    const c1 = parseHex(hex1)
    const c2 = parseHex(hex2)
    const width = ctx.options.getInteger('length') ?? 512
    const height = 512
    const raw = Buffer.alloc(width * height * 3)
    for (let x = 0; x < width; x++) {
      const pr = c1.r + Math.floor(((c2.r - c1.r) * x) / width)
      const pg = c1.g + Math.floor(((c2.g - c1.g) * x) / width)
      const pb = c1.b + Math.floor(((c2.b - c1.b) * x) / width)
      for (let y = 0; y < height; y++) {
        const i = (y * width + x) * 3
        raw[i] = pr
        raw[i + 1] = pg
        raw[i + 2] = pb
      }
    }
    const out = await sharp(raw, { raw: { width, height, channels: 3 } }).png().toBuffer()
    await ctx.reply({ files: [new AttachmentBuilder(out, { name: 'gradient.png' })] })
    return
  }

  if (r !== null && g !== null && b !== null) {
    await ctx.reply({ content: toHex(r, g, b), files: [new AttachmentBuilder(await solid(r, g, b), { name: 'rgb_color.png' })] })
    return
  }

  const c = parseHex(hex1)
  await ctx.reply({
    content: `IN RGB: ${c.r}, ${c.g}, ${c.b}`,
    files: [new AttachmentBuilder(await solid(c.r, c.g, c.b), { name: 'hex_color.png' })],
  })
}

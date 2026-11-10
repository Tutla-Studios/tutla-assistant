import { SlashCommandBuilder, AttachmentBuilder, type ChatInputCommandInteraction } from 'discord.js'
import sharp from 'sharp'
import { CommandScope } from '@/bot/commands/types'
import { CommandError, fetchBuffer } from '@/bot/utils/http'

export const scope = CommandScope.Global
export const premium = true

export const data = new SlashCommandBuilder()
  .setName('bruh')
  .setDescription('Bruh/Debruh a File')
  .addAttachmentOption((o) => o.setName('file').setDescription('Image (to bruh) or .bruh file (to debruh)').setRequired(true))
  .addBooleanOption((o) => o.setName('bruh').setDescription('true = image → .bruh, false = .bruh → image (default true)'))

const CREDIT = 'Made by <@914245831748632636> | [Github](<https://github.com/Tycho10101/bruh-python/>)'

/** .bruh format: uint32 LE width, uint32 LE height, then one line of RRGGBB hex per row. */
async function toBruh(input: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const header = Buffer.alloc(8)
  header.writeUInt32LE(info.width, 0)
  header.writeUInt32LE(info.height, 4)
  const rows: string[] = []
  for (let y = 0; y < info.height; y++) {
    const start = y * info.width * 3
    rows.push(data.subarray(start, start + info.width * 3).toString('hex'))
  }
  return Buffer.concat([header, Buffer.from(rows.join('\n'), 'utf8')])
}

async function fromBruh(input: Buffer): Promise<Buffer> {
  if (input.length < 8) throw new CommandError('Invalid .bruh file.')
  const width = input.readUInt32LE(0)
  const height = input.readUInt32LE(4)
  if (!width || !height || width * height > 16_000_000) throw new CommandError('Invalid .bruh file.')
  const rows = input.subarray(8).toString('utf8').split(/\r?\n/)
  const raw = Buffer.alloc(width * height * 3)
  for (let y = 0; y < height; y++) {
    const row = rows[y] ?? ''
    if (!/^[0-9a-f]*$/i.test(row)) throw new CommandError(`Invalid hex data on row ${y + 1}.`)
    Buffer.from(row.slice(0, width * 6), 'hex').copy(raw, y * width * 3)
  }
  return sharp(raw, { raw: { width, height, channels: 3 } }).png().toBuffer()
}

export async function execute(ctx: ChatInputCommandInteraction) {
  const file = ctx.options.getAttachment('file', true)
  const bruh = ctx.options.getBoolean('bruh') ?? true

  if (bruh) {
    if (file.size > 80_000) {
      await ctx.reply('File is too big!')
      return
    }
    await ctx.deferReply()
    const out = await toBruh(await fetchBuffer(file.url))
    await ctx.followUp({ content: CREDIT, files: [new AttachmentBuilder(out, { name: 'image.bruh' })] })
  } else {
    if (file.size > 10 * 1024 * 1024) {
      await ctx.reply('File is too big!')
      return
    }
    await ctx.deferReply()
    const out = await fromBruh(await fetchBuffer(file.url))
    await ctx.followUp({ content: CREDIT, files: [new AttachmentBuilder(out, { name: 'image.png' })] })
  }
}

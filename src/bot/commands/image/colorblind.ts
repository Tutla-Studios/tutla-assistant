import { SlashCommandBuilder, AttachmentBuilder, type ChatInputCommandInteraction } from 'discord.js'
import sharp from 'sharp'
import { CommandScope } from '@/bot/commands/types'
import { readImage } from '@/bot/utils/images'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('colorblind')
  .setDescription('See in colorblind (CC)')
  .addAttachmentOption((o) => o.setName('image').setDescription('Image').setRequired(true))
  .addIntegerOption((o) => o.setName('level').setDescription('Channel swap level 0-5 (default 1)').setMinValue(0).setMaxValue(5))

/** Output channel order per level, as indices into [R, G, B] (matches the original PIL Image.merge calls). */
const PERMUTATIONS: [number, number, number][] = [
  [0, 1, 2],
  [0, 2, 1],
  [2, 0, 1],
  [2, 1, 0],
  [1, 2, 0],
  [1, 0, 2],
]

export async function execute(ctx: ChatInputCommandInteraction) {
  const attachment = ctx.options.getAttachment('image', true)
  const level = ctx.options.getInteger('level') ?? 1
  await ctx.deferReply()

  const perm = PERMUTATIONS[level]
  const matrix = perm.map((src) => [0, 1, 2].map((c) => (c === src ? 1 : 0))) as [
    [number, number, number],
    [number, number, number],
    [number, number, number],
  ]
  const out = await sharp(await readImage(attachment)).recomb(matrix).png().toBuffer()
  await ctx.followUp({ files: [new AttachmentBuilder(out, { name: 'output.png' })] })
}

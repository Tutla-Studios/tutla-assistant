import { SlashCommandBuilder, MessageFlags, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { prisma } from '@/lib/prisma'

export const scope = CommandScope.Global

export const data = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('Leaderboard')
  .addSubcommand((s) => s.setName('coins').setDescription('Coins Leaderboard'))
  .addSubcommand((s) => s.setName('xp').setDescription('XP Leaderboard'))

export async function execute(ctx: ChatInputCommandInteraction) {
  const field = ctx.options.getSubcommand() as 'coins' | 'xp'

  const top = await prisma.discordUser.findMany({ orderBy: { [field]: 'desc' }, take: 10, select: { id: true, [field]: true } })
  const me = await prisma.discordUser.findUnique({ where: { id: ctx.user.id }, select: { [field]: true } })
  const myValue = (me as Record<string, number> | null)?.[field] ?? 0
  const position = (await prisma.discordUser.count({ where: { [field]: { gt: myValue } } })) + 1

  let out = `${field.toUpperCase()} LEADERBOARD\n`
  top.forEach((row, i) => {
    out += `#${i + 1} <@${row.id}>: ${(row as Record<string, unknown>)[field]}\n`
  })
  out += `\n======================\nYour Position: ${position}`

  await ctx.reply({ content: out, flags: MessageFlags.SuppressNotifications, allowedMentions: { parse: [] } })
}

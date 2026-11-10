import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { prisma } from '@/lib/prisma'
import { getAccount } from '@/bot/utils/economy'
import { randInt } from '@/bot/utils/http'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('daily')
  .setDescription('Tutla Assistance daily')

const COOLDOWN_MS = 12 * 60 * 60 * 1000

export async function execute(ctx: ChatInputCommandInteraction) {
  const account = await getAccount(ctx.user.id)
  const now = new Date()

  if (account.lastDaily) {
    const elapsed = now.getTime() - account.lastDaily.getTime()
    if (elapsed < COOLDOWN_MS) {
      const hours = Math.floor((COOLDOWN_MS - elapsed) / 3_600_000)
      await ctx.reply(`You have already claimed your daily, you can claim again in ${hours} hours`)
      return
    }
  }

  let xp = 20 + randInt(1, 2000)
  let coins = 100 + randInt(1, 1000)
  if (account.premium) {
    xp += 1500
    coins += 2000
  }
  const jackpot = randInt(1, 10000) === 1 ? 99999 : 0

  await prisma.discordUser.update({
    where: { id: ctx.user.id },
    data: { xp: { increment: xp }, coins: { increment: coins + jackpot }, lastDaily: now },
  })

  let msg = `> **Your daily:**\n> XP: ${xp}\n> Coins: ${coins}`
  if (account.premium) msg += '\n> Bonus: 1500 XP & 2000 coins for premium'
  if (jackpot) msg += '\n:peach: **BY RARE LUCK (0.01% chance) YOU GOT +99999 COINS** :peach:'
  await ctx.reply(msg)
}

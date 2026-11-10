import { prisma } from '@/lib/prisma'

/** Fetch a user's bot profile, creating it on first use. */
export function getAccount(userId: string) {
  return prisma.discordUser.upsert({ where: { id: userId }, update: {}, create: { id: userId } })
}

export function addCoins(userId: string, amount: number) {
  return prisma.discordUser.upsert({
    where: { id: userId },
    update: { coins: { increment: amount } },
    create: { id: userId, coins: amount },
  })
}

export async function hasCoins(userId: string, amount: number): Promise<boolean> {
  const account = await getAccount(userId)
  return account.coins >= amount
}

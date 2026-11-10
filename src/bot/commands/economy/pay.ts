import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { prisma } from '@/lib/prisma'
import { getAccount } from '@/bot/utils/economy'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('pay')
  .setDescription('Pay a user in cash')
  .addUserOption((o) => o.setName('user').setDescription('User to pay').setRequired(true))
  .addIntegerOption((o) => o.setName('cash').setDescription('Amount to pay').setRequired(true).setMinValue(1))

export async function execute(ctx: ChatInputCommandInteraction) {
  const user = ctx.options.getUser('user', true)
  const cash = ctx.options.getInteger('cash', true)

  if (user.id === ctx.user.id || user.bot) {
    await ctx.reply({ content: "You can't pay that user.", ephemeral: true })
    return
  }

  const me = await getAccount(ctx.user.id)
  if (me.coins < cash) {
    await ctx.reply("You don't have enough money to give!")
    return
  }

  await prisma.$transaction([
    prisma.discordUser.update({ where: { id: ctx.user.id }, data: { coins: { decrement: cash } } }),
    prisma.discordUser.upsert({
      where: { id: user.id },
      update: { coins: { increment: cash } },
      create: { id: user.id, coins: cash },
    }),
  ])
  await ctx.reply(`Successfully paid ${user} ${cash}!`)
}

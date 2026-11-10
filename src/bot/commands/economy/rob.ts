import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { prisma } from '@/lib/prisma'
import { addCoins, getAccount } from '@/bot/utils/economy'
import { pick, randInt } from '@/bot/utils/http'

export const scope = CommandScope.All
export const premium = true

export const data = new SlashCommandBuilder()
  .setName('rob')
  .setDescription('Steal from someone')
  .addUserOption((o) => o.setName('user').setDescription('Victim').setRequired(true))

const FAIL_REASONS = [
  'HOLY SHI! You lost all the coins because you escaped the police using a lawnmover',
  'You managed to break in, but your non existant mom called you bcack for chores and you forgot to turn on do not disturb mode',
  'you sneezed they heared you, the police came 2 seconds later',
  'you fell asleep',
  'they had a dog',
  'your tail fell off',
  'you managed to steal it but everyone saw you steal it. L rizz',
]

export async function execute(ctx: ChatInputCommandInteraction) {
  const user = ctx.options.getUser('user', true)
  if (user.id === ctx.user.id || user.bot) {
    await ctx.reply({ content: "You can't rob that user.", ephemeral: true })
    return
  }

  const victim = await getAccount(user.id)
  const me = await getAccount(ctx.user.id)

  if (victim.coins <= 0) {
    await ctx.reply('User is broke')
    return
  }
  if (me.coins < victim.coins / 10) {
    await ctx.reply("You need atleast 10% of the user's coins to rob them!")
    return
  }

  // 90% chance to fail
  if (randInt(1, 10) < 10) {
    const loss = Math.floor(me.coins / 10)
    await addCoins(ctx.user.id, -loss)
    await ctx.reply(`YOU **FAILED** stealing ${user}!:\nReason: \`${pick(FAIL_REASONS)}\`\nYou lost 10% of your coins`)
    return
  }

  let cash = randInt(1, victim.coins)
  if (victim.premium) cash = Math.min(victim.coins, Math.floor(cash * 1.5))
  await prisma.$transaction([
    prisma.discordUser.update({ where: { id: user.id }, data: { coins: { decrement: cash } } }),
    prisma.discordUser.update({ where: { id: ctx.user.id }, data: { coins: { increment: cash } } }),
  ])
  await ctx.reply(`${ctx.user} You managed to steal ${cash} off ${user}! W Rizz`)
}

import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { addCoins, hasCoins } from '@/bot/utils/economy'

export const scope = CommandScope.User

export const data = new SlashCommandBuilder()
  .setName('coinflip')
  .setDescription('Unbiased coinflip')
  .addIntegerOption((o) => o.setName('coins').setDescription('Coins to bet').setMinValue(1))

const face = (roll: number) => (roll === 1 ? 'Heads' : 'Tails')
const flip = () => (Math.random() < 0.5 ? 1 : 2)

export async function execute(ctx: ChatInputCommandInteraction) {
  const coins = ctx.options.getInteger('coins')
  if (coins === null) {
    await ctx.reply(face(flip()))
    return
  }

  if (!(await hasCoins(ctx.user.id, coins))) {
    await ctx.reply(`You do not have ${coins} coins to bet`)
    return
  }

  const roll = flip()
  if (roll === flip()) {
    await addCoins(ctx.user.id, coins * 2)
    await ctx.reply(`You got ${face(roll)} and won ${coins * 2}`)
  } else {
    await addCoins(ctx.user.id, -coins)
    await ctx.reply(`You rolled ${face(roll)} and lost it all :(`)
  }
}

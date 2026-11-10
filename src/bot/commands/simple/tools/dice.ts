import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { addCoins, hasCoins } from '@/bot/utils/economy'
import { randInt } from '@/bot/utils/http'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('dice')
  .setDescription('Roll a dice!')
  .addIntegerOption((o) => o.setName('coins').setDescription('Coins to bet').setMinValue(1))

export async function execute(ctx: ChatInputCommandInteraction) {
  const coins = ctx.options.getInteger('coins')
  if (coins === null) {
    await ctx.reply(`Dice Roll: ${randInt(1, 6)}`)
    return
  }

  if (!(await hasCoins(ctx.user.id, coins))) {
    await ctx.reply(`You do not have ${coins} coins to bet`)
    return
  }

  const roll = randInt(1, 6)
  if (roll === randInt(1, 6)) {
    await addCoins(ctx.user.id, coins * 4)
    await ctx.reply(`You rolled ${roll} and won ${coins * 4}`)
  } else {
    await addCoins(ctx.user.id, -coins)
    await ctx.reply(`You rolled ${roll} and lost it all :(`)
  }
}

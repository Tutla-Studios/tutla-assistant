import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { guessGender } from './scraped'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('doxx')
  .setDescription('Doxx a user with fun facts')
  .addUserOption((o) => o.setName('user').setDescription('User').setRequired(true))

export async function execute(ctx: ChatInputCommandInteraction) {
  const user = ctx.options.getUser('user', true)
  await ctx.reply({ content: 'Finding more about user 🔍...', ephemeral: true })
  const gender = await guessGender(user.displayName)
  await ctx.followUp(
    `More about ${user}:\n- Age: ||Above 0||\n- Location: ||Milkyway Galaxy, Earth||\n- Gender: ||${gender}||\n` +
      `- email: ||hosted by sum email service like gmail or sum||\n- Skin Color: ||black, yellow, white, or brown||`,
  )
}

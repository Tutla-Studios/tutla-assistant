import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { guessGender } from './scraped'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('sex')
  .setDescription('Find out the gender/sex of a user')
  .addUserOption((o) => o.setName('user').setDescription('User').setRequired(true))

export async function execute(ctx: ChatInputCommandInteraction) {
  const user = ctx.options.getUser('user', true)
  await ctx.reply(`${user}'s Gender: ${await guessGender(user.displayName)}`)
  await ctx.followUp('WHAT ARE YOU DOING????!\nhttps://tenor.com/view/freak-freaky-tongue-out-sticking-gif-10627789')
}

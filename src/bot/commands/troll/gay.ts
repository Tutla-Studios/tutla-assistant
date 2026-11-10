import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('gay')
  .setDescription('Find out how gay a user is')
  .addUserOption((o) => o.setName('user').setDescription('User').setRequired(true))

export async function execute(ctx: ChatInputCommandInteraction) {
  const user = ctx.options.getUser('user', true)
  const score = [...user.username].reduce((sum, c) => sum + c.codePointAt(0)!, 0) % 101
  await ctx.reply(`${user.username} is ${score}% gay`)
}

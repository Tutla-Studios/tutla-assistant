import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { MessageFlags } from 'discord.js'
import { isPremium } from '@/bot/utils/checks'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('activesite')
  .setDescription('Find the most visited site of a user')
  .addUserOption((o) => o.setName('user').setDescription('User').setRequired(true))

export async function execute(ctx: ChatInputCommandInteraction) {
  const user = ctx.options.getUser('user', true)
  await ctx.reply({ content: 'Finding more about user 🔍...', ephemeral: true })
  const name = user.globalName ?? user.username
  const site = (await isPremium(user.id)) ? 'x.com (good boi)' : 'the p hub (100% real data) :skull:'
  await ctx.followUp({ content: `Most active site ${name} is on: || ${site} ||`, flags: MessageFlags.SuppressNotifications })
}

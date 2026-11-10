import { SlashCommandBuilder, MessageFlags, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { isPremium } from '@/bot/utils/checks'

export const scope = CommandScope.All
export const skipChecks = true

export const data = new SlashCommandBuilder()
  .setName('premium')
  .setDescription("Check if you're premium")
  .addUserOption((o) => o.setName('user').setDescription('User to check (defaults to you)'))

export async function execute(ctx: ChatInputCommandInteraction) {
  const user = ctx.options.getUser('user') ?? ctx.user
  const content = (await isPremium(user.id))
    ? `${user} has premium. Try out some cool premium commands!`
    : `${user} does not have premium & your missing out on so much! Get it [here for **5$**](https://tutla.net/shop/discord/tutla-assistance-premium/)`
  await ctx.reply({ content, flags: MessageFlags.SuppressNotifications })
}

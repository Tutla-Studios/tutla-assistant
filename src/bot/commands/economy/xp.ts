import { SlashCommandBuilder, MessageFlags, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { getAccount } from '@/bot/utils/economy'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('xp')
  .setDescription('Gets your XP')
  .addUserOption((o) => o.setName('user').setDescription('User to check (defaults to you)'))

export async function execute(ctx: ChatInputCommandInteraction) {
  const user = ctx.options.getUser('user') ?? ctx.user
  const account = await getAccount(user.id)
  await ctx.reply({ content: `XP: ${account.xp}`, flags: MessageFlags.SuppressNotifications })
}

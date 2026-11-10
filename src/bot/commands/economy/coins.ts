import { SlashCommandBuilder, MessageFlags, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { getAccount } from '@/bot/utils/economy'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('coins')
  .setDescription('Gets your coins')
  .addUserOption((o) => o.setName('user').setDescription('User to check (defaults to you)'))

export async function execute(ctx: ChatInputCommandInteraction) {
  const user = ctx.options.getUser('user') ?? ctx.user
  const account = await getAccount(user.id)
  await ctx.reply({ content: `Coins: ${account.coins}`, flags: MessageFlags.SuppressNotifications })
}

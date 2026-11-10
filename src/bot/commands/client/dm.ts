import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'

export const scope = CommandScope.All
export const premium = true

export const data = new SlashCommandBuilder()
  .setName('dm')
  .setDescription('DM a user')
  .addUserOption((o) => o.setName('user').setDescription('User to DM').setRequired(true))
  .addStringOption((o) => o.setName('text').setDescription('Message').setRequired(true))

export async function execute(ctx: ChatInputCommandInteraction) {
  const user = ctx.options.getUser('user', true)
  try {
    await user.send(ctx.options.getString('text', true))
    await ctx.reply({ content: 'Sent!', ephemeral: true })
  } catch {
    await ctx.reply({ content: "Couldn't DM that user (they may have DMs closed).", ephemeral: true })
  }
}

import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { flames } from './text'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('match')
  .setDescription('FLAMES matching based on user names')
  .addUserOption((o) => o.setName('user').setDescription('User').setRequired(true))
  .addUserOption((o) => o.setName('match').setDescription('User to match with').setRequired(true))

export async function execute(ctx: ChatInputCommandInteraction) {
  const user = ctx.options.getUser('user', true)
  const match = ctx.options.getUser('match', true)
  await ctx.reply({ content: 'Matching users 🔍...', ephemeral: true })
  const a = user.displayName.replace(/[^\p{L}]/gu, '')
  const b = match.displayName.replace(/[^\p{L}]/gu, '')
  await ctx.followUp(`${a} + ${b}: ${flames(a, b)}`)
}

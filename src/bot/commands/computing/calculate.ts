import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { evaluate } from './math'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('calculate')
  .setDescription('Meth')
  .addStringOption((o) => o.setName('question').setDescription('e.g. (2+3)*4^2').setRequired(true))

export async function execute(ctx: ChatInputCommandInteraction) {
  const question = ctx.options.getString('question', true)
  try {
    const answer = evaluate(question)
    if (!Number.isFinite(answer)) throw new Error('not finite')
    await ctx.reply(`Answer: \`${answer}\``)
  } catch {
    await ctx.reply('Invalid Numbers')
  }
}

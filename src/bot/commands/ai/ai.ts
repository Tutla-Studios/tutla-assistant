import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { ai } from '@/bot/utils/ai'

export const scope = CommandScope.All
export const premium = true

export const data = new SlashCommandBuilder()
  .setName('ai')
  .setDescription('Generate an AI Response')
  .addStringOption((opt) => opt.setName('prompt').setDescription('Your prompt').setRequired(true))

export async function execute(ctx: ChatInputCommandInteraction) {
  const prompt = ctx.options.getString('prompt', true)
  await ctx.reply('Generating please wait')
  const resp = await ai(prompt + '\n respond in less than 2000 characters')
  if (!resp.trim()) {
    await ctx.editReply('The AI returned an empty response.')
    return
  }
  if (resp.length >= 2000) {
    await ctx.editReply('Response is too big to send')
    return
  }
  await ctx.editReply(resp)
}

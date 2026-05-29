import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'

export const scope = CommandScope.User

export const data = new SlashCommandBuilder()
  .setName('convert')
  .setDescription('Convert currency')
  .addStringOption((opt) =>
    opt.setName('from').setDescription('Source currency code (e.g. USD)').setRequired(true),
  )
  .addStringOption((opt) =>
    opt.setName('to').setDescription('Target currency code (e.g. EUR)').setRequired(true),
  )
  .addNumberOption((opt) =>
    opt.setName('amount').setDescription('Amount to convert').setRequired(true),
  )

export async function execute(ctx: ChatInputCommandInteraction) {
  await ctx.deferReply()
  const fromCur = ctx.options.getString('from', true).toUpperCase()
  const toCur = ctx.options.getString('to', true).toUpperCase()
  const amount = ctx.options.getNumber('amount', true)

  const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCur}`)
  if (!res.ok) {
    await ctx.followUp('smoll error, report bug if it happens again')
    return
  }
  const data = await res.json() as any
  const rate: number | undefined = data.rates[toCur]
  if (!rate) {
    await ctx.followUp(`Unknown currency: ${toCur}`)
    return
  }
  await ctx.followUp(`${amount} ${fromCur} is equal to ${(amount * rate).toFixed(2)} ${toCur}`)
}

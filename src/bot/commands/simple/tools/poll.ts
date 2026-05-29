import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('poll')
  .setDescription('Create a poll')
  .addStringOption((opt) =>
    opt.setName('question').setDescription('The poll question').setRequired(true),
  )
  .addStringOption((opt) =>
    opt.setName('options').setDescription('Options separated by commas (max 6)').setRequired(true),
  )

const NUMBER_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣']

export async function execute(ctx: ChatInputCommandInteraction) {
  const question = ctx.options.getString('question', true)
  const raw = ctx.options.getString('options', true)
  const options = raw.split(',').map((o) => o.trim()).filter(Boolean)

  if (options.length > 6) {
    await ctx.reply({ content: 'Too many options (Max 6)', ephemeral: true })
    return
  }

  await ctx.reply('Creating poll')

  let body = `## Poll 📊\n**Question: ${question}**\n`
  options.forEach((opt, i) => { body += `#${i + 1}: ${opt}\n` })

  const msg = await ctx.followUp(body)
  for (let i = 0; i < options.length; i++) {
    await msg.react(NUMBER_EMOJIS[i])
  }
}

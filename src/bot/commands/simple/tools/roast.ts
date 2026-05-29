import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'

export const scope = CommandScope.User

export const data = new SlashCommandBuilder()
  .setName('roast')
  .setDescription('Roast/Insult')
  .addUserOption((opt) =>
    opt.setName('user').setDescription('User to roast').setRequired(true),
  )

export async function execute(ctx: ChatInputCommandInteraction) {
  const target = ctx.options.getUser('user', true)
  const res = await fetch('https://evilinsult.com/generate_insult.php?lang=en&type=json')
  const data = await res.json() as { insult: string }
  await ctx.reply(`${target} ${data.insult}`)
}

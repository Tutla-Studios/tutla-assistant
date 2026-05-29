import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('emoji')
  .setDescription('Use an emoji anywhere')
  .addStringOption((opt) =>
    opt.setName('emoji').setDescription('The custom emoji (e.g. <:name:id>)').setRequired(true),
  )

export async function execute(ctx: ChatInputCommandInteraction) {
  const emoji = ctx.options.getString('emoji', true)
  const emojiId = emoji.split(':').pop()?.replace('>', '')
  if (!emojiId || !/^\d+$/.test(emojiId)) {
    await ctx.reply({ content: 'Invalid emoji format. Use a custom emoji like `<:name:id>`', ephemeral: true })
    return
  }
  const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.png`
  await ctx.reply(`Copy the text below and send it (ANYWHERE ON DISCORD) to use it as an emoji: \`\`\`[.](${emojiUrl})\`\`\``)
}

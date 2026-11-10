import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { AttachmentBuilder } from 'discord.js'
import { fetchBuffer, randInt } from '@/bot/utils/http'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('furry')
  .setDescription('Get a random furry/fox picture')

export async function execute(ctx: ChatInputCommandInteraction) {
  await ctx.reply({ content: 'Getting furry pic...', ephemeral: true })
  const buf = await fetchBuffer(`https://randomfox.ca/images/${randInt(1, 123)}.jpg`)
  await ctx.followUp({
    content: 'Furry Pic\n:warning: REAL FURRY :warning:\n-# Click To see:',
    files: [new AttachmentBuilder(buf, { name: 'fox.jpg' }).setSpoiler(true)],
  })
}

import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Check if the bot is alive')

export async function execute(interaction: ChatInputCommandInteraction) {
  const latency = Date.now() - interaction.createdTimestamp
  await interaction.reply(`Pong! \`${latency}ms\``)
}

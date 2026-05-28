import { type Interaction } from 'discord.js'
import { commands } from '../commands'

export async function execute(interaction: Interaction) {
  if (!interaction.isChatInputCommand()) return

  const command = commands.get(interaction.commandName)
  if (!command) return

  try {
    await command.execute(interaction)
  } catch (err) {
    console.error(`Error executing command /${interaction.commandName}:`, err)
    const reply = { content: 'An error occurred.', ephemeral: true }
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply)
    } else {
      await interaction.reply(reply)
    }
  }
}

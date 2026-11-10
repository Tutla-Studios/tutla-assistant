import { type Interaction } from 'discord.js'
import { commands } from '../commands'
import { commandCheck } from '../utils/checks'
import { CommandError } from '../utils/http'

export async function execute(interaction: Interaction) {
  if (!interaction.isChatInputCommand()) return

  const command = commands.get(interaction.commandName)
  if (!command) return

  try {
    const sub = interaction.options.getSubcommand(false)
    const needsPremium = command.premium || (sub !== null && !!command.premiumSubcommands?.includes(sub))
    if (needsPremium && !(await commandCheck(interaction))) return
    await command.execute(interaction)
  } catch (err) {
    const userFacing = err instanceof CommandError
    if (!userFacing) console.error(`Error executing command /${interaction.commandName}:`, err)
    const reply = { content: userFacing ? err.message : 'An error occurred.', ephemeral: true }
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply).catch(() => null)
    } else {
      await interaction.reply(reply).catch(() => null)
    }
  }
}

import { type ChatInputCommandInteraction, type Interaction } from 'discord.js'
import { commands, type Command } from '../commands'
import { commandCheck } from '../utils/checks'
import { CommandError } from '../utils/http'

/** userId:command → timestamp (ms) when the cooldown ends. */
const cooldowns = new Map<string, number>()

/** Returns true (and replies) if the user is still on cooldown for this command. */
async function onCooldown(interaction: ChatInputCommandInteraction, command: Command): Promise<boolean> {
  if (!command.cooldown) return false
  const key = `${interaction.user.id}:${interaction.commandName}`
  const now = Date.now()
  const until = cooldowns.get(key) ?? 0
  if (until > now) {
    await interaction.reply({
      content: `This command is on cooldown. Try again in ${((until - now) / 1000).toFixed(2)} seconds.`,
      ephemeral: true,
    })
    return true
  }
  cooldowns.set(key, now + command.cooldown * 1000)
  return false
}

export async function execute(interaction: Interaction) {
  if (!interaction.isChatInputCommand()) return

  const command = commands.get(interaction.commandName)
  if (!command) return

  try {
    const sub = interaction.options.getSubcommand(false)
    const needsPremium = !!command.premium || (sub !== null && !!command.premiumSubcommands?.includes(sub))
    if (!command.skipChecks && !(await commandCheck(interaction, needsPremium))) return
    if (await onCooldown(interaction, command)) return
    await command.execute(interaction)
  } catch (err) {
    const userFacing = err instanceof CommandError
    if (!userFacing) console.error(`Error executing command /${interaction.commandName}:`, err)
    const reply = { content: userFacing ? err.message : 'Oops! Something went wrong.', ephemeral: true }
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply).catch(() => null)
    } else {
      await interaction.reply(reply).catch(() => null)
    }
  }
}

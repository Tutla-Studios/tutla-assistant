import type { ChatInputCommandInteraction } from 'discord.js'

/**
 * Returns true if the user has premium access.
 * Replace this stub with real logic (e.g. a Prisma DB lookup) when ready.
 */
export async function isPremium(userId: string): Promise<boolean> {
  void userId
  return false
}

/**
 * Equivalent to @app_commands.check(commandCheck) in discord.py.
 * Call at the top of any premium command's execute() — returns true if the
 * interaction should proceed, false if it was already replied to with a denial.
 */
export async function commandCheck(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const allowed = await isPremium(interaction.user.id)
  if (!allowed) {
    await interaction.reply({
      content: '🔮 This command is for **premium** users only.',
      ephemeral: true,
    })
  }
  return allowed
}

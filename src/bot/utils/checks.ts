import type { ChatInputCommandInteraction } from 'discord.js'
import { prisma } from '@/lib/prisma'

/** Returns true if the user has premium access (DiscordUser.premium). */
export async function isPremium(userId: string): Promise<boolean> {
  const user = await prisma.discordUser.findUnique({ where: { id: userId }, select: { premium: true } })
  return user?.premium ?? false
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

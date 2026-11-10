import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  type ChatInputCommandInteraction,
} from 'discord.js'
import { prisma } from '@/lib/prisma'

export const TOS_URL = 'https://github.com/TutlaMC/tutla-assistant/blob/main/TOS.md'

/**
 * Admin levels (from the Python bot's Utils.getAdminLevel):
 * 0 user · 1 can add/remove premium · 2 admin commands (counts as premium, can't be bot-banned)
 * 3 can bot-ban users · 4 owner (logs, shell, edit user data)
 */
export enum AdminLevel {
  User = 0,
  Premium = 1,
  Admin = 2,
  Moderator = 3,
  Owner = 4,
}

/** Comma-separated Discord user IDs that are always level 4 (bootstraps the first owner). */
function ownerIds(): Set<string> {
  return new Set((process.env.BOT_OWNER_IDS ?? '').split(',').map((s) => s.trim()).filter(Boolean))
}

export async function getAdminLevel(userId: string): Promise<number> {
  if (ownerIds().has(userId)) return AdminLevel.Owner
  const user = await prisma.discordUser.findUnique({ where: { id: userId }, select: { adminLevel: true } })
  return user?.adminLevel ?? AdminLevel.User
}

/** Returns true if the user has premium access (DiscordUser.premium, or admin level 2+). */
export async function isPremium(userId: string): Promise<boolean> {
  const user = await prisma.discordUser.findUnique({
    where: { id: userId },
    select: { premium: true, adminLevel: true },
  })
  return !!user?.premium || (await getAdminLevel(userId)) >= AdminLevel.Admin
}

/** Ask the user to accept the Terms of Service. Resolves true once accepted. */
async function promptTerms(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('tos_accept').setLabel('Accept').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('tos_decline').setLabel('Decline').setStyle(ButtonStyle.Danger),
  )
  await interaction.reply({
    content: `Please accept the [terms and conditions](<${TOS_URL}>) to continue`,
    components: [row],
    ephemeral: true,
  })
  const message = await interaction.fetchReply()
  const click = await message
    .awaitMessageComponent({ componentType: ComponentType.Button, filter: (i) => i.user.id === interaction.user.id, time: 120_000 })
    .catch(() => null)

  if (!click) {
    await interaction.editReply({ content: 'No response received.', components: [] }).catch(() => null)
    return false
  }
  if (click.customId === 'tos_decline') {
    await click.update({ content: 'You declined the terms, you cannot proceed.', components: [] })
    return false
  }

  await prisma.discordUser.upsert({
    where: { id: interaction.user.id },
    update: { tosAcceptedAt: new Date() },
    create: { id: interaction.user.id, tosAcceptedAt: new Date(), xp: 1 },
  })
  await click.update({
    content: 'You have accepted the terms and conditions. You may now execute your command. Have fun with the bot!',
    components: [],
  })
  return true
}

/**
 * Port of Module.commandCheck: runs before every command (unless the command sets `skipChecks`).
 * Blocks bot-banned users, gates premium commands, asks for ToS acceptance on first use,
 * and gives +1 XP per command. Returns false if the interaction was already answered.
 */
export async function commandCheck(interaction: ChatInputCommandInteraction, needsPremium = false): Promise<boolean> {
  const userId = interaction.user.id
  const [user, adminLevel] = await Promise.all([
    prisma.discordUser.findUnique({ where: { id: userId } }),
    getAdminLevel(userId),
  ])
  const isAdmin = adminLevel >= AdminLevel.Admin

  if (user?.banned && !isAdmin) {
    await interaction.reply({
      content: '**You are banned** from using Tutla Assistance, therefore you cannot use this.',
      ephemeral: true,
    })
    return false
  }

  if (needsPremium && !user?.premium && !isAdmin) {
    await interaction.reply({ content: '🔮 This command is for **premium** users only.', ephemeral: true })
    return false
  }

  if (!user?.tosAcceptedAt) {
    // The prompt uses up this interaction's reply, so the user re-runs the command after accepting.
    await promptTerms(interaction)
    return false
  }

  await prisma.discordUser.update({ where: { id: userId }, data: { xp: { increment: 1 } } })
  return true
}

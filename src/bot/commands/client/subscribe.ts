import { SlashCommandBuilder, InteractionContextType, PermissionFlagsBits, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { prisma } from '@/lib/prisma'
import { AdminLevel, getAdminLevel } from '@/bot/utils/checks'

export const scope = CommandScope.Global

export const data = new SlashCommandBuilder()
  .setName('subscribe')
  .setDescription('Subscribe/unsubscribe this channel to the Tutla feed')
  .setContexts(InteractionContextType.Guild)

export async function execute(ctx: ChatInputCommandInteraction) {
  const perms = ctx.memberPermissions
  const allowed =
    perms?.has(PermissionFlagsBits.ManageGuild) ||
    perms?.has(PermissionFlagsBits.ManageChannels) ||
    (await getAdminLevel(ctx.user.id)) >= AdminLevel.Admin
  if (!allowed) {
    await ctx.reply(
      'You need to have manage guild/channels permissions or be a Tutla Admin to subscribe this channel to tutla assistance',
    )
    return
  }

  const existing = await prisma.feedSubscription.findUnique({ where: { channelId: ctx.channelId } })
  if (existing) {
    await prisma.feedSubscription.delete({ where: { channelId: ctx.channelId } })
    await ctx.reply('Unsubscribed channel from Tutla Assistance Feed!')
  } else {
    await prisma.feedSubscription.create({ data: { channelId: ctx.channelId, guildId: ctx.guildId } })
    await ctx.reply('Subscribed channel to Tutla Assistance Feed!')
  }
}

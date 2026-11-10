import {
  SlashCommandBuilder,
  ChannelType,
  InteractionContextType,
  PermissionFlagsBits,
  GuildMember,
  type ChatInputCommandInteraction,
  type Message,
} from 'discord.js'
import { CommandScope } from '@/bot/commands/types'

export const scope = CommandScope.Global

export const data = new SlashCommandBuilder()
  .setName('admin')
  .setDescription('Admin Level Commands')
  .setContexts(InteractionContextType.Guild)
  .addSubcommand((s) =>
    s
      .setName('kick')
      .setDescription('Kick a user')
      .addUserOption((o) => o.setName('user').setDescription('Member to kick').setRequired(true))
      .addStringOption((o) => o.setName('reason').setDescription('Reason')),
  )
  .addSubcommand((s) =>
    s
      .setName('ban')
      .setDescription('Ban a user')
      .addUserOption((o) => o.setName('user').setDescription('Member to ban').setRequired(true))
      .addStringOption((o) => o.setName('reason').setDescription('Reason')),
  )
  .addSubcommand((s) =>
    s
      .setName('purge')
      .setDescription('Delete messages in bulk')
      .addIntegerOption((o) => o.setName('amount').setDescription('Messages to delete').setRequired(true).setMinValue(1).setMaxValue(100))
      .addUserOption((o) => o.setName('skip_user').setDescription("Don't delete this user's messages"))
      .addUserOption((o) => o.setName('focus_user').setDescription("Only delete this user's messages"))
      .addIntegerOption((o) => o.setName('after').setDescription('Only look within the latest N messages').setMinValue(1).setMaxValue(100)),
  )
  .addSubcommand((s) =>
    s
      .setName('role')
      .setDescription('Give a user a role')
      .addUserOption((o) => o.setName('user').setDescription('Member').setRequired(true))
      .addRoleOption((o) => o.setName('role').setDescription('Role to add').setRequired(true)),
  )
  .addSubcommand((s) =>
    s
      .setName('timeout')
      .setDescription('Times out the user')
      .addUserOption((o) => o.setName('member').setDescription('Member').setRequired(true))
      .addStringOption((o) => o.setName('duration').setDescription('e.g. 30s, 10m, 2h, 1d').setRequired(true))
      .addStringOption((o) => o.setName('reason').setDescription('Reason')),
  )
  .addSubcommand((s) =>
    s
      .setName('delete')
      .setDescription('Delete something')
      .addChannelOption((o) => o.setName('text_channel').setDescription('Text channel').addChannelTypes(ChannelType.GuildText))
      .addChannelOption((o) => o.setName('voice_channel').setDescription('Voice channel').addChannelTypes(ChannelType.GuildVoice))
      .addChannelOption((o) => o.setName('forum').setDescription('Forum channel').addChannelTypes(ChannelType.GuildForum))
      .addRoleOption((o) => o.setName('role').setDescription('Role')),
  )

const DENIED = { content: 'You cannot execute this!', ephemeral: true }
const HIERARCHY =
  "You cannot perform this action to the specified user because the user's role is higher than yours"

function parseDuration(input: string): number | null {
  const m = /^(\d+)\s*([smhd])$/i.exec(input.trim())
  if (!m) return null
  const unit = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }[m[2].toLowerCase() as 's' | 'm' | 'h' | 'd']
  return Number(m[1]) * unit
}

/** True if the invoker outranks the target (guild owner always does). */
function outranks(invoker: GuildMember, target: GuildMember): boolean {
  if (invoker.id === invoker.guild.ownerId) return true
  return invoker.roles.highest.comparePositionTo(target.roles.highest) > 0
}

export async function execute(ctx: ChatInputCommandInteraction) {
  if (!ctx.inCachedGuild()) {
    await ctx.reply({ content: 'This command only works in servers.', ephemeral: true })
    return
  }
  const sub = ctx.options.getSubcommand()
  const me = ctx.member
  const perms = ctx.memberPermissions
  const botPerms = ctx.guild.members.me?.permissions

  switch (sub) {
    case 'kick':
    case 'ban': {
      const flag = sub === 'kick' ? PermissionFlagsBits.KickMembers : PermissionFlagsBits.BanMembers
      if (!perms.has(flag)) return void (await ctx.reply(DENIED))
      const target = ctx.options.getMember('user')
      if (!target) return void (await ctx.reply({ content: 'That user is not in this server.', ephemeral: true }))
      if (!outranks(me, target)) return void (await ctx.reply(HIERARCHY))
      const reason = ctx.options.getString('reason') ?? undefined
      try {
        if (sub === 'kick') await target.kick(reason)
        else await target.ban({ reason })
        await ctx.reply(`Successfully ${sub === 'kick' ? 'kicked' : 'banned'} ${target}`)
      } catch {
        await ctx.reply(`I do not have permission to ${sub} users`)
      }
      return
    }

    case 'purge': {
      if (!perms.has(PermissionFlagsBits.ManageMessages)) return void (await ctx.reply(DENIED))
      const channel = ctx.channel
      if (!channel || !('bulkDelete' in channel)) {
        return void (await ctx.reply({ content: "Can't purge messages here.", ephemeral: true }))
      }
      const amount = ctx.options.getInteger('amount', true)
      const skip = ctx.options.getUser('skip_user')
      const focus = ctx.options.getUser('focus_user')
      const after = ctx.options.getInteger('after')
      await ctx.reply({ content: `Deleting ${amount} messages.`, ephemeral: true })

      const recent = await channel.messages.fetch({ limit: after ?? 100 })
      const toDelete = [...recent.values()]
        .filter((m: Message) => (!skip || m.author.id !== skip.id) && (!focus || m.author.id === focus.id))
        .slice(0, amount)
      const deleted = await channel.bulkDelete(toDelete, true)
      await ctx.followUp({ content: `Deleted ${deleted.size} messages.`, ephemeral: true })
      return
    }

    case 'role': {
      if (!perms.has(PermissionFlagsBits.ManageRoles)) return void (await ctx.reply(DENIED))
      const target = ctx.options.getMember('user')
      const role = ctx.options.getRole('role', true)
      if (!target) return void (await ctx.reply({ content: 'That user is not in this server.', ephemeral: true }))
      if (!outranks(me, target)) return void (await ctx.reply(HIERARCHY))
      try {
        await target.roles.add(role)
        await ctx.reply('Added roles to user')
      } catch (e) {
        await ctx.reply(`I do not have permission to add roles to members, error log:\`\`\`\n${e}\`\`\``)
      }
      return
    }

    case 'timeout': {
      if (!perms.has(PermissionFlagsBits.ModerateMembers)) return void (await ctx.reply(DENIED))
      const target = ctx.options.getMember('member')
      if (!target) return void (await ctx.reply({ content: 'That user is not in this server.', ephemeral: true }))
      if (!outranks(me, target)) return void (await ctx.reply(HIERARCHY))
      if (!botPerms?.has(PermissionFlagsBits.ModerateMembers)) {
        return void (await ctx.reply({ content: "I don't have permission to timeout members.", ephemeral: true }))
      }
      const duration = ctx.options.getString('duration', true)
      const ms = parseDuration(duration)
      if (ms === null) {
        return void (await ctx.reply({
          content: "Invalid time format. Use 's' for seconds, 'm' for minutes, 'h' for hours, or 'd' for days.",
          ephemeral: true,
        }))
      }
      if (ms > 28 * 86_400_000) return void (await ctx.reply({ content: 'Timeouts can be at most 28 days.', ephemeral: true }))
      await target.timeout(ms, ctx.options.getString('reason') ?? undefined)
      await ctx.reply(`${target} has been timed out for ${duration}.`)
      return
    }

    case 'delete': {
      if (!perms.has(PermissionFlagsBits.ManageChannels)) return void (await ctx.reply(DENIED))
      if (!botPerms?.has(PermissionFlagsBits.ManageChannels)) {
        return void (await ctx.reply({ content: "I don't have permission to manage channels.", ephemeral: true }))
      }
      const target =
        ctx.options.getChannel('text_channel') ??
        ctx.options.getChannel('voice_channel') ??
        ctx.options.getChannel('forum') ??
        ctx.options.getRole('role')
      if (!target) return void (await ctx.reply({ content: 'Specify a parameter to delete!', ephemeral: true }))
      await target.delete()
      // The command may have been run inside the channel that was just deleted.
      await ctx.reply('Successfully deleted!').catch(() => null)
      return
    }
  }
}

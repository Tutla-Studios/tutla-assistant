import { SlashCommandBuilder, PermissionFlagsBits, GuildMember, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { clip } from '@/bot/utils/http'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('userinfo')
  .setDescription('Get user data')
  .addUserOption((o) => o.setName('user').setDescription('User').setRequired(true))

export async function execute(ctx: ChatInputCommandInteraction) {
  const user = await ctx.options.getUser('user', true).fetch()
  const member = ctx.options.getMember('user')

  let text =
    `User Name: ${user.globalName ?? user.username}\n` +
    `User ID: ${user.id}\n` +
    `User Creation Date: ${user.createdAt.toISOString()}\n` +
    `Is Bot: ${user.bot ? 'True' : 'False'}\n` +
    `Token First part: ${Buffer.from(user.id).toString('base64')}\n`

  if (member instanceof GuildMember) {
    text += `Joined server at: ${member.joinedAt?.toISOString() ?? 'Unknown'}\n`
    text += '---Roles---\n'
    for (const role of member.roles.cache.values()) text += `${role.name}\n`
    text += '---Permissions---\n'
    if (member.permissions.has(PermissionFlagsBits.ManageGuild)) text += 'Manage Guild: True\n'
    if (member.permissions.has(PermissionFlagsBits.ManageRoles)) text += 'Manage Roles: True\n'
    if (member.permissions.has(PermissionFlagsBits.Administrator)) text += 'All Perms: True\n'
    text += `Highest role: ${member.roles.highest.name}\n`
  } else {
    text += 'Highest Role: None\n'
  }
  text += '-----TUTLA CLIENT-----\n This bot is made by Tutla'

  await ctx.reply(clip(`\`\`\`yml\n${text.slice(0, 1800)}\`\`\`[Avatar:](${user.displayAvatarURL()})`))
}

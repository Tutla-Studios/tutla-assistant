import {
  SlashCommandBuilder,
  ChannelType,
  InteractionContextType,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
  type OverwriteResolvable,
  type SlashCommandSubcommandBuilder,
} from 'discord.js'
import { CommandScope } from '@/bot/commands/types'

export const scope = CommandScope.Global

function withAccessOptions(s: SlashCommandSubcommandBuilder, what: string) {
  return s
    .addStringOption((o) => o.setName('name').setDescription(`Name of the ${what}`).setRequired(true))
    .addStringOption((o) => o.setName('emoji').setDescription(`Emoji to prepend to the ${what} name`))
    .addStringOption((o) => o.setName('separator').setDescription('Separator between emoji and name'))
    .addRoleOption((o) => o.setName('see_role').setDescription(`Role that can access the ${what}`))
    .addRoleOption((o) => o.setName('blocked_role').setDescription(`Role that cannot access the ${what}`))
    .addRoleOption((o) => o.setName('messages_role').setDescription('Can send messages'))
    .addRoleOption((o) => o.setName('no_messages_role').setDescription('Cannot send messages'))
}

export const data = new SlashCommandBuilder()
  .setName('create')
  .setDescription('Create channels')
  .setContexts(InteractionContextType.Guild)
  .addSubcommand((s) => withAccessOptions(s.setName('textchannel').setDescription('Create a text channel'), 'text channel'))
  .addSubcommand((s) => withAccessOptions(s.setName('category').setDescription('Create a category'), 'category'))
  .addSubcommand((s) =>
    s
      .setName('voicechannel')
      .setDescription('Create a voice channel')
      .addStringOption((o) => o.setName('name').setDescription('Name of the channel').setRequired(true))
      .addStringOption((o) => o.setName('emoji').setDescription('Emoji to prepend to the channel name'))
      .addStringOption((o) => o.setName('separator').setDescription('Separator between emoji and name')),
  )
  .addSubcommand((s) =>
    s
      .setName('emoji')
      .setDescription('Create an emoji/sticker')
      .addStringOption((o) => o.setName('name').setDescription('Name of emoji').setRequired(true))
      .addAttachmentOption((o) => o.setName('emoji').setDescription('Emoji file').setRequired(true))
      .addBooleanOption((o) => o.setName('sticker').setDescription('Create a sticker instead'))
      .addStringOption((o) => o.setName('description').setDescription('Sticker description'))
      .addStringOption((o) => o.setName('sticker_emoji').setDescription('Emoji related to the sticker')),
  )

export async function execute(ctx: ChatInputCommandInteraction) {
  if (!ctx.inCachedGuild()) {
    await ctx.reply({ content: 'This command only works in servers.', ephemeral: true })
    return
  }
  const sub = ctx.options.getSubcommand()
  const botPerms = ctx.guild.members.me?.permissions

  if (sub === 'emoji') {
    if (!ctx.memberPermissions.has(PermissionFlagsBits.ManageGuildExpressions)) {
      return void (await ctx.reply({ content: 'You cannot execute this!', ephemeral: true }))
    }
    if (!botPerms?.has(PermissionFlagsBits.ManageGuildExpressions)) {
      return void (await ctx.reply({ content: "I don't have permission to manage expressions.", ephemeral: true }))
    }
    const name = ctx.options.getString('name', true)
    const file = ctx.options.getAttachment('emoji', true)
    if (!ctx.options.getBoolean('sticker')) {
      const emoji = await ctx.guild.emojis.create({ name, attachment: file.url })
      await ctx.reply(`Emoji ${emoji} created.`)
      return
    }
    const description = ctx.options.getString('description')
    const stickerEmoji = ctx.options.getString('sticker_emoji')
    if (!description || !stickerEmoji) {
      await ctx.reply(
        'Sticker creation requires `description` (desc for sticker) and `sticker_emoji` (emoji related to the sticker).',
      )
      return
    }
    await ctx.guild.stickers.create({ name, file: file.url, description, tags: stickerEmoji })
    await ctx.reply('Sticker created.')
    return
  }

  if (!ctx.memberPermissions.has(PermissionFlagsBits.ManageChannels)) {
    return void (await ctx.reply({ content: 'You cannot execute this!', ephemeral: true }))
  }
  if (!botPerms?.has(PermissionFlagsBits.ManageChannels)) {
    return void (await ctx.reply({ content: "I don't have permission to manage channels.", ephemeral: true }))
  }

  let name = ctx.options.getString('name', true)
  const emoji = ctx.options.getString('emoji')
  const separator = ctx.options.getString('separator') ?? '｜'

  if (sub === 'voicechannel') {
    if (emoji) name = `${emoji} ${separator} ${name}`
    const channel = await ctx.guild.channels.create({ name, type: ChannelType.GuildVoice })
    await ctx.reply(`Voice channel ${channel} created.`)
    return
  }

  if (emoji) name = `${emoji}${separator}${name}`
  await ctx.reply({ content: 'Creating Channel...', ephemeral: true })

  const overwrites: OverwriteResolvable[] = [{ id: ctx.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] }]
  const see = ctx.options.getRole('see_role')
  const blocked = ctx.options.getRole('blocked_role')
  const canSend = ctx.options.getRole('messages_role')
  const cantSend = ctx.options.getRole('no_messages_role')
  if (see) overwrites.push({ id: see.id, allow: [PermissionFlagsBits.ViewChannel] })
  if (blocked) overwrites.push({ id: blocked.id, deny: [PermissionFlagsBits.ViewChannel] })
  if (canSend) overwrites.push({ id: canSend.id, allow: [PermissionFlagsBits.SendMessages] })
  if (cantSend) overwrites.push({ id: cantSend.id, deny: [PermissionFlagsBits.SendMessages] })

  if (sub === 'category') {
    const category = await ctx.guild.channels.create({ name, type: ChannelType.GuildCategory, permissionOverwrites: overwrites })
    await ctx.followUp(`Category ${category.name} created.`)
  } else {
    const channel = await ctx.guild.channels.create({ name, type: ChannelType.GuildText, permissionOverwrites: overwrites })
    await ctx.followUp(`Text channel ${channel} created.`)
  }
}

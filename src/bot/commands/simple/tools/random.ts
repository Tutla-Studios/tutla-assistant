import {
  SlashCommandBuilder,
  AttachmentBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js'
import { CommandScope } from '@/bot/commands/types'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('random')
  .setDescription('Random choice')
  .addStringOption((opt) =>
    opt
      .setName('type')
      .setDescription('Select random type')
      .setRequired(true)
      .addChoices(
        { name: 'Number', value: 'number' },
        { name: 'User', value: 'user' },
        { name: 'Image', value: 'image' },
        { name: 'ProfilePicture', value: 'pfp' },
        { name: 'Burger', value: 'burger' },
      ),
  )
  .addIntegerOption((opt) =>
    opt.setName('range_start').setDescription('Range start (number type only)'),
  )
  .addIntegerOption((opt) =>
    opt.setName('range_end').setDescription('Range end (number type only)'),
  )
  .addBooleanOption((opt) =>
    opt.setName('mention').setDescription('Mention the user (user type only)'),
  )

export async function execute(ctx: ChatInputCommandInteraction) {
  const type = ctx.options.getString('type', true)

  if (type === 'number') {
    const start = ctx.options.getInteger('range_start') ?? 0
    const end = ctx.options.getInteger('range_end') ?? 100
    await ctx.reply(`Selected: ${Math.floor(Math.random() * (end - start + 1)) + start}`)
    return
  }

  if (type === 'user') {
    if (!ctx.guild) {
      await ctx.reply('Guild not found.')
      return
    }
    const members = await ctx.guild.members.fetch()
    const arr = [...members.values()].filter((m) => !m.user.bot)
    if (!arr.length) {
      await ctx.reply('No members in guild')
      return
    }
    const picked = arr[Math.floor(Math.random() * arr.length)]
    const mention = ctx.options.getBoolean('mention') ?? false
    await ctx.reply(`Selected: ${mention ? picked.toString() : picked.user.username}`)
    return
  }

  if (type === 'image') {
    await ctx.deferReply()
    const res = await fetch('https://picsum.photos/512/512')
    const buf = Buffer.from(await res.arrayBuffer())
    await ctx.followUp({ content: 'Random Image:', files: [new AttachmentBuilder(buf, { name: 'image.jpg' })] })
    return
  }

  if (type === 'pfp') {
    await ctx.deferReply()
    const res = await fetch('https://loremflickr.com/320/240')
    const buf = Buffer.from(await res.arrayBuffer())
    await ctx.followUp({ content: 'Random PFP:', files: [new AttachmentBuilder(buf, { name: 'pfp.jpg' })] })
    return
  }

  if (type === 'burger') {
    await ctx.deferReply()
    const res = await fetch('https://foodish-api.com/api/images/burger')
    const data = await res.json() as { image: string }
    await ctx.followUp(data.image)
  }
}

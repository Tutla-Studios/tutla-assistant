import { SlashCommandBuilder, InteractionContextType, Guild, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'

export const scope = CommandScope.Global

export const data = new SlashCommandBuilder()
  .setName('server')
  .setDescription('Get server data')
  .setContexts(InteractionContextType.Guild)
  .addStringOption((o) => o.setName('invite').setDescription('Invite code/link of another server'))
  .addStringOption((o) => o.setName('id').setDescription('ID of a server the bot is in'))

export async function execute(ctx: ChatInputCommandInteraction) {
  const invite = ctx.options.getString('invite')
  const id = ctx.options.getString('id')
  await ctx.deferReply()

  let lines: string
  let iconUrl: string | null = null
  let ownerId: string | null = null

  if (invite) {
    const inv = await ctx.client.fetchInvite(invite)
    if (!inv.guild) {
      await ctx.followUp('That invite does not point to a server.')
      return
    }
    const g = inv.guild
    lines =
      `Server Name: ${g.name}\n` +
      `Server ID: ${g.id}\n` +
      `Members: ${inv.memberCount ?? 'Unknown'}\n` +
      `Server Creation Date: ${g.createdAt.toISOString()}\n`
    iconUrl = g.iconURL()
    if (g instanceof Guild) ownerId = g.ownerId
  } else {
    const g = id ? await ctx.client.guilds.fetch(id).catch(() => null) : ctx.guild
    if (!g) {
      await ctx.followUp(id ? "I'm not in a server with that ID." : 'Guild not found.')
      return
    }
    const channels = await g.channels.fetch()
    lines =
      `Server Name: ${g.name}\n` +
      `Server ID: ${g.id}\n` +
      `Members: ${g.memberCount}\n` +
      `Server Creation Date: ${g.createdAt.toISOString()}\n` +
      `Channel Count: ${channels.size}\n`
    iconUrl = g.iconURL()
    ownerId = g.ownerId
  }

  if (ownerId) {
    const owner = await ctx.client.users.fetch(ownerId)
    lines +=
      `-------OWNER INFO-------\n` +
      `Owner ID: ${owner.id}\n` +
      `Owner Name: ${owner.username}\n` +
      `Owner Creation Date: ${owner.createdAt.toISOString()}\n\n` +
      `You can use /userinfo <@${owner.id}> to get more data`
  }

  await ctx.followUp(`\`\`\`yml\n${lines}\`\`\`${iconUrl ? `\n[Icon](${iconUrl})` : ''}`)
}

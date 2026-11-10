import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { prisma } from '@/lib/prisma'
import { commands } from '@/bot/commands'
import { clip } from '@/bot/utils/http'
import { FONTS } from '@/bot/utils/images'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('list')
  .setDescription('List command')
  .addSubcommand((s) => s.setName('premium_users').setDescription('List all premium users'))
  .addSubcommand((s) => s.setName('premium_commands').setDescription('List all premium commands'))
  .addSubcommand((s) => s.setName('mods').setDescription('List all mods'))
  .addSubcommand((s) => s.setName('fonts').setDescription('List all fonts'))

interface RawCommand {
  name: string
  description: string
  options?: { type: number; name: string; description: string }[]
}

function premiumCommands(): string {
  const lines: string[] = []
  for (const cmd of commands.values()) {
    const json = cmd.data.toJSON() as RawCommand
    if (cmd.premium) lines.push(`${json.name}: ${json.description}`)
    for (const sub of json.options ?? []) {
      if (sub.type === 1 && cmd.premiumSubcommands?.includes(sub.name)) lines.push(`${json.name} ${sub.name}: ${sub.description}`)
    }
  }
  return lines.join('\n')
}

export async function execute(ctx: ChatInputCommandInteraction) {
  switch (ctx.options.getSubcommand()) {
    case 'premium_users': {
      const users = await prisma.discordUser.findMany({ where: { premium: true }, select: { id: true } })
      const body = users.length ? users.map((u) => `- <@${u.id}>`).join('\n') : 'None yet.'
      await ctx.reply({ content: clip(`__Premium Users__\n${body}`), ephemeral: true, allowedMentions: { parse: [] } })
      return
    }
    case 'premium_commands':
      await ctx.reply(clip(`\`\`\`yaml\nPremium Commands:\n${premiumCommands()}\`\`\``))
      return
    case 'mods':
      // Message-event mods (mods/ on main) haven't been ported to v3 yet.
      await ctx.reply('Mods:\n```yaml\n- None installed\n```')
      return
    case 'fonts':
      await ctx.reply(`Fonts:\n\`\`\`yaml\n${FONTS.map((f) => `- ${f}`).join('\n')}\n\`\`\``)
      return
  }
}

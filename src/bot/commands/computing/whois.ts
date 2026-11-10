import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { rapidApi } from '@/bot/utils/http'

function convertToString(data: Record<string, unknown>): string {
  return Object.entries(data)
    .map(([key, value]) => {
      const spaced = key.replace(/(?<!^)(?=[A-Z])/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      return `${spaced}: ${typeof value === 'object' ? JSON.stringify(value) : value}`
    })
    .join('\n')
}

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('whois')
  .setDescription('Get a domain whois data')
  .addStringOption((o) => o.setName('domain').setDescription('Domain name').setRequired(true))

export async function execute(ctx: ChatInputCommandInteraction) {
  const domain = ctx.options.getString('domain', true)
  await ctx.deferReply()
  const e = await rapidApi('https://whois40.p.rapidapi.com/whois', 'whois40.p.rapidapi.com', { params: { q: domain } })
  await ctx.followUp(`\`\`\`yaml\n${convertToString(e).slice(0, 1980)}\`\`\``)
}

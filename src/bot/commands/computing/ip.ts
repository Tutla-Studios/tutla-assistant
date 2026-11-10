import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { CommandScope } from '@/bot/commands/types'
import { fetchJson } from '@/bot/utils/http'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('ip')
  .setDescription('Get the info of an IP address')
  .addStringOption((o) => o.setName('ip').setDescription('IP address or domain').setRequired(true))

export async function execute(ctx: ChatInputCommandInteraction) {
  const host = ctx.options
    .getString('ip', true)
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/\s/g, '')

  let address = host
  if (!isIP(host)) {
    try {
      address = (await lookup(host)).address
    } catch {
      await ctx.reply('Unable to resolve the domain.')
      return
    }
  }

  const data = await fetchJson<Record<string, string>>(`https://ipinfo.io/${address}/json`)
  const location = `${data.ip ?? 'N/A'}: ${data.country ?? 'N/A'}, ${data.region ?? 'N/A'}, ${data.city ?? 'N/A'}`
  await ctx.reply(`${host}:\`\`\`${location}\`\`\``)
}

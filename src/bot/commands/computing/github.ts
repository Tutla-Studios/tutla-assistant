import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { clip } from '@/bot/utils/http'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('github')
  .setDescription('Get a github repo')
  .addStringOption((o) => o.setName('repository').setDescription('Repository name').setRequired(true))
  .addStringOption((o) => o.setName('owner').setDescription('Repository owner').setRequired(true))

export async function execute(ctx: ChatInputCommandInteraction) {
  const repo = ctx.options.getString('repository', true)
  const owner = ctx.options.getString('owner', true)
  const res = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
    { headers: { 'User-Agent': 'tutla-assistant', Accept: 'application/vnd.github.v3+json' } },
  )
  if (!res.ok) {
    await ctx.reply(`Repository not found. Status code: ${res.status}`)
    return
  }
  const r = (await res.json()) as any
  await ctx.reply(
    clip(
      `**Repository Name:** ${r.name}\n` +
        `**Description:** ${r.description}\n` +
        `**Stars:** ${r.stargazers_count}\n` +
        `**Forks:** ${r.forks_count}\n` +
        `**Open Issues:** ${r.open_issues_count}\n` +
        `**Watchers:** ${r.watchers_count}\n` +
        `**Language:** ${r.language}\n` +
        `**License:** ${r.license ? r.license.name : 'None'}\n` +
        `**Default Branch:** ${r.default_branch}\n` +
        `**Owner:** ${r.owner.login}\n` +
        `**Repository URL:** ${r.html_url}\n` +
        `**Created At:** ${r.created_at}\n` +
        `**Last Pushed At:** ${r.pushed_at}\n` +
        `**Size:** ${r.size} KB`,
    ),
  )
}

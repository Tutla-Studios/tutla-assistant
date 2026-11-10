import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { clip, fetchText } from '@/bot/utils/http'

export const scope = CommandScope.All
export const skipChecks = true

export const data = new SlashCommandBuilder()
  .setName('changelog')
  .setDescription("What's new?")

const CHANGELOG_URL = 'https://raw.githubusercontent.com/TutlaMC/tutla-assistant/main/changelog.md'
let cached: string | null = null

export function clearChangelogCache() {
  cached = null
}

export async function execute(ctx: ChatInputCommandInteraction) {
  cached ??= await fetchText(CHANGELOG_URL)
  await ctx.reply(clip(cached))
}

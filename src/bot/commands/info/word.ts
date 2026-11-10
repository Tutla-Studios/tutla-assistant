import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { clip, fetchJson } from '@/bot/utils/http'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('word')
  .setDescription('Get info about a word')
  .addStringOption((o) => o.setName('word').setDescription('Word to look up').setRequired(true))

interface Definition {
  definition: string
  example?: string
  synonyms?: Record<string, string[]> | null
}

export async function execute(ctx: ChatInputCommandInteraction) {
  const word = ctx.options.getString('word', true)
  await ctx.reply({ content: 'Getting word...', ephemeral: true })

  const f = await fetchJson<{ definitions?: Definition[] }>(
    `https://ftapi.pythonanywhere.com/translate?dl=en&text=${encodeURIComponent(word)}`,
  )
  if (!f.definitions?.length) {
    await ctx.followUp('No word found')
    return
  }

  let out = 'Definitions, Examples & Synonyms:\n'
  for (const d of f.definitions.slice(0, 3)) {
    out += `- ${d.definition}\n - Example: ${d.example ?? 'None'}\n - Synonyms:\n`
    const synonyms = d.synonyms ? Object.values(d.synonyms).flat() : []
    if (synonyms.length) for (const s of synonyms) out += `  - ${s}\n`
    else out += '  - No Synonyms found\n'
  }
  out += `Characters: ${word.length}\n`
  await ctx.followUp(clip(out))
}

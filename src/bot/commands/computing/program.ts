import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { clip, rapidApi } from '@/bot/utils/http'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('program')
  .setDescription('Program something')
  .addStringOption((o) => o.setName('lang').setDescription('Language, e.g. python').setRequired(true))
  .addStringOption((o) => o.setName('file_extension').setDescription('e.g. py').setRequired(true))
  .addStringOption((o) => o.setName('code').setDescription('Code to run').setRequired(true))

export async function execute(ctx: ChatInputCommandInteraction) {
  const lang = ctx.options.getString('lang', true)
  const ext = ctx.options.getString('file_extension', true)
  const code = ctx.options.getString('code', true)
  await ctx.deferReply()
  const e = await rapidApi('https://onecompiler-apis.p.rapidapi.com/api/v1/run', 'onecompiler-apis.p.rapidapi.com', {
    body: { language: lang, files: [{ name: `index.${ext}`, content: code }] },
  })
  const stderr = e.stderr ? String(e.stderr).slice(0, 700) : 'None'
  const stdout = String(e.stdout ?? '').slice(0, 900)
  await ctx.followUp(
    clip(`Code Execution: \`${e.status}\`\nStderr:\`\`\`${lang}\n${stderr}\`\`\`\nStdout:\`\`\`${lang}\n${stdout}\`\`\``),
  )
}

import {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { rapidApi } from '@/bot/utils/http'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('detectai')
  .setDescription('Detect AI')

export async function execute(ctx: ChatInputCommandInteraction) {
  const modalId = `detectai:${ctx.id}`
  const modal = new ModalBuilder()
    .setCustomId(modalId)
    .setTitle('Detect AI')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('prompt')
          .setLabel('PROMPT')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Give the "AI" or not so AI prompt here')
          .setRequired(true)
          .setMaxLength(500),
      ),
    )

  await ctx.showModal(modal)
  const submit = await ctx
    .awaitModalSubmit({ filter: (i) => i.customId === modalId, time: 300_000 })
    .catch(() => null)
  if (!submit) return

  const doc = submit.fields.getTextInputValue('prompt')
  await submit.reply('Detecting')
  try {
    const result = await rapidApi(
      'https://chatgpt-detector-ai-checker.p.rapidapi.com/v2/predict/text',
      'chatgpt-detector-ai-checker.p.rapidapi.com',
      { body: { document: doc, writing_stats_required: true, interpretability_required: false } },
    )
    const isAi = result?.documents?.[0]?.predicted_class === 'ai'
    await submit.followUp(`${isAi ? 'AI Detected' : 'No AI Detected'}\n-# ${doc}`)
  } catch (err) {
    await submit.followUp({ content: err instanceof Error ? err.message : 'Oops! Something went wrong.', ephemeral: true })
  }
}

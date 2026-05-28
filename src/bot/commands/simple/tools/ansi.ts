import {
  SlashCommandBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
  type ChatInputCommandInteraction,
} from 'discord.js'
import { CommandScope } from '@/bot/commands/types'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('ansiformat')
  .setDescription('Format text with ANSI colors and styles')
  .addStringOption((opt) =>
    opt.setName('text').setDescription('Text with HTML-like tags e.g. <red>hello</red>').setRequired(true),
  )

const TEXT_COLORS: Record<string, string> = {
  gray:   '30',
  red:    '31',
  green:  '32',
  yellow: '33',
  blue:   '34',
  pink:   '35',
  cyan:   '36',
  white:  '37',
}

const BG_COLORS: Record<string, string> = {
  'firefly-dark-blue':  '40',
  'orange':             '41',
  'marble-blue':        '42',
  'greyish-turquoise':  '43',
  'gray':               '44',
  'indigo':             '45',
  'light-gray':         '46',
  'white':              '47',
}

function formatAnsi(text: string): string {
  let out = text

  for (const [color, code] of Object.entries(BG_COLORS)) {
    out = out.replaceAll(`<bg-${color}>`, `\x1b[${code}m`)
  }

  for (const [color, code] of Object.entries(TEXT_COLORS)) {
    out = out
      .replaceAll(`<${color}>`, `\x1b[${code}m`)
      .replaceAll(`</${color}>`, `\x1b[${code}m`)
  }

  out = out
    .replaceAll('<bold>',        '\x1b[1m')
    .replaceAll('</bold>',       '\x1b[0m')
    .replaceAll('<underline>',   '\x1b[4m')
    .replaceAll('</underline>',  '\x1b[0m')
    .replaceAll('<highlight>',   '\x1b[7m')
    .replaceAll('</highlight>',  '\x1b[0m')

  return out
}

const TUTORIAL = `HTML-like tags are replaced with ANSI escape codes.

**Text colors:** \`<red></red>\` \`<green></green>\` \`<blue></blue>\` \`<yellow></yellow>\` \`<pink></pink>\` \`<cyan></cyan>\` \`<gray></gray>\` \`<white></white>\`
**Background:** \`<bg-orange>\` \`<bg-indigo>\` \`<bg-marble-blue>\` \`<bg-greyish-turquoise>\` \`<bg-gray>\` \`<bg-firefly-dark-blue>\` \`<bg-light-gray>\` \`<bg-white>\`
**Styles:** \`<bold></bold>\` \`<underline></underline>\` \`<highlight></highlight>\`

**Example:**
\`<blue>Hello</blue> <bold><underline>World</underline></bold>\``

export async function execute(interaction: ChatInputCommandInteraction) {
  const input = interaction.options.getString('text', true)
  const formatted = formatAnsi(input)

  const tutorialBtn = new ButtonBuilder()
    .setCustomId('ansi_tutorial')
    .setLabel('Usage Tutorial')
    .setStyle(ButtonStyle.Secondary)

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(tutorialBtn)

  await interaction.reply({
    content: `\`\`\`ansi\n${formatted}\x1b[0m\`\`\``,
    components: [row],
  })

  const collector = interaction.channel?.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: (i) => i.customId === 'ansi_tutorial',
    time: 120_000,
  })

  collector?.on('collect', async (i) => {
    await i.reply({ content: TUTORIAL, ephemeral: true })
  })
}

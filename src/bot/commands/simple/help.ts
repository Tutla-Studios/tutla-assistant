import {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ComponentType,
  type ChatInputCommandInteraction,
  type StringSelectMenuInteraction,
} from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { commands, type Command } from '@/bot/commands'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('List commands or get info about a specific command')
  .addIntegerOption((opt) =>
    opt.setName('page').setDescription('Page number').setRequired(false).setMinValue(1),
  )
  .addStringOption((opt) =>
    opt.setName('command').setDescription('Get info about a specific command').setRequired(false),
  )

const TOS_URL = 'https://raw.githubusercontent.com/TutlaMC/tutla-assistant/main/TOS.md'

const ABOUT = `**Tutla Assistant** is a multi-purpose Discord bot built by TutlaMC.
It offers tools, utility commands, and more — all accessible as a user-installable app.

**Developer:** TutlaMC
**Source:** github.com/TutlaMC/tutla-assistant`

// ── builders ─────────────────────────────────────────────────────────────────

interface RawOption {
  type: number
  name: string
  description?: string
  required?: boolean
  options?: RawOption[]
}

interface RawCommand {
  name: string
  description: string
  options?: RawOption[]
}

const SUBCOMMAND = 1
const SUBCOMMAND_GROUP = 2

function commandify(name: string, description: string, options: RawOption[] = [], premium = false): string {
  let line = `**/${name}`
  for (const opt of options) {
    if (opt.type <= SUBCOMMAND_GROUP) continue
    line += ` \`[${opt.required ? '' : 'Optional: '}${opt.name}]\``
  }
  if (premium) line += ' 🔮'
  line += `**\n ${description}\n`
  return line
}

/** Render a command; grouped commands (/admin, /photoshop…) get a heading plus one line per subcommand. */
function describeCommand(cmd: Command): string {
  const json = cmd.data.toJSON() as RawCommand
  const subs = (json.options ?? []).filter((o) => o.type === SUBCOMMAND || o.type === SUBCOMMAND_GROUP)
  if (subs.length === 0) return commandify(json.name, json.description, json.options, cmd.premium)

  const isPremium = (sub: string) => !!cmd.premium || !!cmd.premiumSubcommands?.includes(sub)
  let out = `### ${json.name.toUpperCase()}\n`
  for (const sub of subs) {
    if (sub.type === SUBCOMMAND_GROUP) {
      for (const s of sub.options ?? []) {
        out += commandify(`${json.name} ${sub.name} ${s.name}`, s.description ?? '', s.options, isPremium(s.name))
      }
    } else {
      out += commandify(`${json.name} ${sub.name}`, sub.description ?? '', sub.options, isPremium(sub.name))
    }
  }
  return out
}

function buildPages(): EmbedBuilder[] {
  const pages: string[] = []
  for (const cmd of commands.values()) {
    const line = describeCommand(cmd) + '\n'
    if (pages.length === 0 || pages[pages.length - 1].length + line.length > 1500) {
      pages.push(line)
    } else {
      pages[pages.length - 1] += line
    }
  }
  return pages.map((desc) => new EmbedBuilder().setDescription(desc).setColor(0x5865f2))
}

function buildPaginationRow(page: number, total: number) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('help_prev')
      .setLabel('◀')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId('help_next')
      .setLabel('▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === total - 1),
  )
}

function buildMenuRow() {
  const menu = new StringSelectMenuBuilder()
    .setCustomId('help_menu')
    .setPlaceholder('Choose an option...')
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel('About the bot')
        .setDescription('Bot basic info, details and credits')
        .setEmoji('❓')
        .setValue('about'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Adding the bot')
        .setDescription('How to add the bot')
        .setEmoji('➕')
        .setValue('add'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Terms & Conditions')
        .setDescription('Usage Policies for Tutla Assistance')
        .setEmoji('📜')
        .setValue('tos'),
    )
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu)
}

export function buildAddBotRow() {
  const clientId = process.env.DISCORD_CLIENT_ID ?? ''
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel('Use me anywhere')
      .setStyle(ButtonStyle.Link)
      .setURL(`https://discord.com/oauth2/authorize?client_id=${clientId}&integration_type=1&scope=applications.commands`),
    new ButtonBuilder()
      .setLabel('Use me in your server')
      .setStyle(ButtonStyle.Link)
      .setURL(`https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&integration_type=0&scope=applications.commands+bot`),
    new ButtonBuilder()
      .setLabel('Add without permissions')
      .setStyle(ButtonStyle.Link)
      .setURL(`https://discord.com/oauth2/authorize?client_id=${clientId}&integration_type=0&scope=applications.commands+bot`),
  )
}

// ── select handler ────────────────────────────────────────────────────────────

async function handleMenuSelect(i: StringSelectMenuInteraction) {
  const value = i.values[0]

  if (value === 'about') {
    await i.reply({ content: ABOUT, ephemeral: true })
    return
  }

  if (value === 'add') {
    await i.reply({
      content: 'Use me and get to use cool tools, fun commands, and more!',
      components: [buildAddBotRow()],
      ephemeral: true,
    })
    return
  }

  if (value === 'tos') {
    try {
      const res = await fetch(TOS_URL)
      const tos = res.ok ? await res.text() : 'Could not fetch Terms of Service.'
      const trimmed = tos.length > 1900 ? tos.slice(0, 1900) + '\n…(truncated)' : tos
      await i.reply({ content: `Here is the TOS:\n${trimmed}`, ephemeral: true })
    } catch {
      await i.reply({ content: 'Could not fetch Terms of Service.', ephemeral: true })
    }
  }
}

// ── command ───────────────────────────────────────────────────────────────────

export async function execute(interaction: ChatInputCommandInteraction) {
  const commandName = interaction.options.getString('command')

  if (commandName) {
    const cmd = commands.get(commandName)
    if (!cmd) {
      await interaction.reply({ content: `Command "${commandName}" not found.`, ephemeral: true })
      return
    }
    await interaction.reply({ content: describeCommand(cmd), ephemeral: true })
    return
  }

  const pages = buildPages()
  if (pages.length === 0) {
    await interaction.reply({ content: 'No commands available.', ephemeral: true })
    return
  }

  const requestedPage = (interaction.options.getInteger('page') ?? 1) - 1
  if (requestedPage >= pages.length) {
    await interaction.reply({
      content: `No page ${requestedPage + 1}. There are only ${pages.length} page(s).`,
      ephemeral: true,
    })
    return
  }

  let currentPage = requestedPage

  const buildComponents = (page: number) => {
    const rows: ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] = []
    if (pages.length > 1) rows.push(buildPaginationRow(page, pages.length) as ActionRowBuilder<ButtonBuilder>)
    rows.push(buildMenuRow())
    return rows
  }

  const header = () =>
    `Hi, I'm **Tutla Assistant** and can run the following **${commands.size}** commands:\n\`PAGE ${currentPage + 1}/${pages.length}\`\n`

  await interaction.reply({
    content: header(),
    embeds: [pages[currentPage]],
    components: buildComponents(currentPage),
  })

  const message = await interaction.fetchReply()
  const collector = message.createMessageComponentCollector({
    filter: (i) => i.user.id === interaction.user.id,
    time: 180_000,
  })

  collector.on('collect', async (i) => {
    if (i.componentType === ComponentType.Button) {
      if (i.customId === 'help_prev') currentPage = Math.max(0, currentPage - 1)
      if (i.customId === 'help_next') currentPage = Math.min(pages.length - 1, currentPage + 1)
      await i.update({
        content: header(),
        embeds: [pages[currentPage]],
        components: buildComponents(currentPage),
      })
    }

    if (i.componentType === ComponentType.StringSelect && i.customId === 'help_menu') {
      await handleMenuSelect(i as StringSelectMenuInteraction)
    }
  })

  collector.on('end', async () => {
    await interaction.editReply({ components: [] }).catch(() => null)
  })
}

import {
  SlashCommandBuilder,
  EmbedBuilder,
  Colors,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
  type ChatInputCommandInteraction,
} from 'discord.js'
import { CommandScope } from '@/bot/commands/types'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('modrinth')
  .setDescription('Search Modrinth mods')
  .addStringOption((o) => o.setName('mod').setDescription('Search query, or slug when direct').setRequired(true))
  .addBooleanOption((o) => o.setName('direct').setDescription('Look up a mod by slug/ID directly'))

const HEADERS = { 'User-Agent': 'tutla-assistant (Discord bot)' }

const tags = (list: string[] | undefined) => (list?.length ? list.map((t) => `\`${t}\``).join(' ').slice(0, 1024) : '-')

function modEmbed(d: any): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(d.title)
    .setDescription(d.description || null)
    .setColor(Colors.Green)
    .addFields(
      { name: 'Downloads', value: String(d.downloads ?? '-'), inline: true },
      { name: 'Followers', value: String(d.followers ?? '-'), inline: true },
      { name: 'Published On', value: String(d.published ?? '-'), inline: true },
      { name: 'Last Updated', value: String(d.updated ?? '-'), inline: true },
      { name: 'Status', value: String(d.status ?? '-').replace(/^\w/, (c) => c.toUpperCase()), inline: true },
      { name: 'License', value: d.license?.name || 'No License', inline: true },
      { name: 'Categories', value: tags(d.categories), inline: true },
      { name: 'Loaders', value: tags(d.loaders), inline: true },
      { name: 'Versions', value: tags(d.game_versions), inline: true },
      { name: 'URL', value: `https://modrinth.com/mod/${d.slug}`, inline: true },
    )
  if (d.icon_url) embed.setThumbnail(d.icon_url)
  return embed
}

function modEmoji(categories: string[]): string {
  if (categories.includes('combat')) return '⚔️'
  if (categories.includes('models')) return '🎠'
  if (categories.includes('utility')) return '🧵'
  if (categories.includes('vanilla-like')) return '👀'
  if (categories.includes('lightweight')) return '🪶'
  if (categories.includes('fabric')) return '📜'
  if (categories.includes('forge')) return '🔨'
  return '🤔'
}

async function fetchProject(idOrSlug: string): Promise<any | null> {
  const res = await fetch(`https://api.modrinth.com/v2/project/${encodeURIComponent(idOrSlug)}`, { headers: HEADERS })
  return res.ok ? res.json() : null
}

export async function execute(ctx: ChatInputCommandInteraction) {
  const query = ctx.options.getString('mod', true)

  if (ctx.options.getBoolean('direct')) {
    await ctx.reply({ content: 'Fetching mod...', ephemeral: true })
    const project = await fetchProject(query)
    if (project) await ctx.followUp({ content: 'Modrinth', embeds: [modEmbed(project)] })
    else await ctx.followUp({ content: `Mod with slug \`${query}\` not found`, ephemeral: true })
    return
  }

  await ctx.reply('Fetching modrinth mods....')
  const res = await fetch(`https://api.modrinth.com/v2/search?query=${encodeURIComponent(query)}&limit=8`, { headers: HEADERS })
  if (!res.ok) {
    await ctx.editReply('Failed to get mod data')
    return
  }
  const mods: any[] = ((await res.json()) as any).hits ?? []
  if (!mods.length) {
    await ctx.editReply(`No mods found for '${query}'`)
    return
  }

  const embed = new EmbedBuilder().setTitle(`'${query}' Mods on Modrinth`.slice(0, 256)).setColor(Colors.Green)
  for (const mod of mods) {
    embed.addFields({
      name: `${mod.title ?? 'No Title'} by ${mod.author ?? 'Unknown Author'}`.slice(0, 256),
      value: `${mod.description ?? 'No description'} [Get here!](https://modrinth.com/mod/${mod.slug})`.slice(0, 1024),
    })
  }

  const menu = new StringSelectMenuBuilder()
    .setCustomId('modrinth_select')
    .setPlaceholder('Choose a mod')
    .addOptions(
      mods.map((mod) => ({
        label: String(mod.title ?? mod.slug).slice(0, 100),
        description: String(mod.description ?? '').slice(0, 90) + '...',
        emoji: modEmoji(mod.display_categories ?? []),
        value: mod.project_id,
      })),
    )

  await ctx.editReply({
    content: 'Found Mods',
    embeds: [embed],
    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu)],
  })

  const message = await ctx.fetchReply()
  const collector = message.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 180_000 })
  collector.on('collect', async (i) => {
    const project = await fetchProject(i.values[0])
    if (!project) {
      await i.reply({ content: 'Could not fetch that mod.', ephemeral: true })
      return
    }
    await i.reply({ content: project.title, embeds: [modEmbed(project)] })
  })
  collector.on('end', () => {
    ctx.editReply({ components: [] }).catch(() => null)
  })
}

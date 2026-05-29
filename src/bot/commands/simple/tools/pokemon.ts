import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('pokemon')
  .setDescription("Get a pokemon character's data")
  .addStringOption((opt) =>
    opt.setName('pokemon').setDescription('Pokemon name or ID').setRequired(true),
  )

export async function execute(ctx: ChatInputCommandInteraction) {
  await ctx.deferReply({ ephemeral: true })
  const name = ctx.options.getString('pokemon', true).toLowerCase()

  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`)
  if (!res.ok) {
    await ctx.followUp(`Error: Pokémon '${name}' not found.`)
    return
  }
  const data = await res.json() as any

  const weight = `__INFO__\n**Weight:** ${data.weight / 10}kg`
  const height = `**Height:** ${data.height / 10}m`
  const abilities = data.abilities.map((a: any) => a.ability.name).join(', ')
  const types = data.types.map((t: any) => t.type.name).join(', ')

  let statsStr = '\n__Stats__\n'
  for (const stat of data.stats) {
    statsStr += `**${(stat.stat.name as string).charAt(0).toUpperCase() + (stat.stat.name as string).slice(1)}:** ${stat.base_stat}\n`
  }

  const moves = data.moves.map((m: any) => m.move.name).join(', ')

  await ctx.followUp(
    `\`${name}\`:\n ${weight}\n${height}\n**Abilities:** ${abilities}\n**Type:** ${types}\n${statsStr}\n**Moves**: ${moves}`,
  )
}

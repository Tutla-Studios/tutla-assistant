import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { fetchJson, pick } from '@/bot/utils/http'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('joke')
  .setDescription('Get a random joke')

export async function execute(ctx: ChatInputCommandInteraction) {
  const joke = await fetchJson<any>(pick(['https://v2.jokeapi.dev/joke/Dark', 'https://v2.jokeapi.dev/joke/Misc']))
  if (joke.joke) {
    await ctx.reply(joke.joke)
    return
  }
  await ctx.reply(joke.setup)
  await new Promise((r) => setTimeout(r, 5000))
  await ctx.followUp(joke.delivery)
}

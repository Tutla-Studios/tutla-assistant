import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('weather')
  .setDescription("Get a city's weather data")
  .addStringOption((opt) =>
    opt.setName('city').setDescription('City name').setRequired(true),
  )

export async function execute(ctx: ChatInputCommandInteraction) {
  await ctx.deferReply()
  const city = ctx.options.getString('city', true)

  const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`)
  if (!res.ok) {
    await ctx.followUp('Failed to retrieve weather data.')
    return
  }
  const data = await res.json() as any
  const w = data.current_condition[0]

  await ctx.followUp(
    `Weather in ${city}:\n` +
    `- Description: ${w.weatherDesc[0].value}\n` +
    `- Temperature: ${w.temp_C}°C\n` +
    `- Cloud Cover: ${w.cloudcover}%\n` +
    `- Precipitation: ${w.precipMM} mm\n` +
    `- Humidity: ${w.humidity}%\n` +
    `- Wind Direction & Speed: ${w.windspeedKmph} km/h ${w.winddir16Point}`,
  )
}

import { Collection, REST, Routes, type ChatInputCommandInteraction } from 'discord.js'
import * as ping from './ping'

interface Command {
  data: { name: string; toJSON(): unknown }
  execute(interaction: ChatInputCommandInteraction): Promise<void>
}

export const commands = new Collection<string, Command>([
  [ping.data.name, ping],
])

export async function deployCommands() {
  const token = process.env.DISCORD_TOKEN
  const clientId = process.env.DISCORD_CLIENT_ID
  const guildId = process.env.DISCORD_GUILD_ID

  if (!token || !clientId) {
    console.warn('Skipping command deploy: DISCORD_TOKEN or DISCORD_CLIENT_ID not set')
    return
  }

  const body = [...commands.values()].map((c) => c.data.toJSON())
  const rest = new REST().setToken(token)

  if (guildId) {
    // Guild deploy is instant — use for development
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body })
    console.log(`Deployed ${body.length} guild command(s) to ${guildId}`)
  } else {
    // Global deploy takes up to 1 hour to propagate
    await rest.put(Routes.applicationCommands(clientId), { body })
    console.log(`Deployed ${body.length} global command(s)`)
  }
}

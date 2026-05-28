import {
  Collection,
  REST,
  Routes,
  ApplicationIntegrationType,
  InteractionContextType,
} from 'discord.js'
import * as ping from './simple/ping'
import * as tools from './simple/tools/'
export type { Command } from './types'
import { CommandScope, type Command } from './types'

export const commands = new Collection<string, Command>([
  [ping.data.name, ping],
  ...tools.commands
])

export async function deployCommands() {
  const token = process.env.DISCORD_TOKEN
  const clientId = process.env.DISCORD_CLIENT_ID
  const guildId = process.env.DISCORD_GUILD_ID

  if (!token || !clientId) {
    console.warn('Skipping command deploy: DISCORD_TOKEN or DISCORD_CLIENT_ID not set')
    return
  }

  const rest = new REST().setToken(token)
  const all = [...commands.values()]

  const guildOnly = all.filter((c) => c.scope === CommandScope.Guild)
  const global = all.filter((c) => c.scope === CommandScope.Global)
  const userOnly = all.filter((c) => c.scope === CommandScope.User)
  const everywhere = all.filter((c) => c.scope === CommandScope.All)

  // Guild-scoped: instant deploy to one guild
  if (guildOnly.length > 0) {
    if (!guildId) {
      console.warn(`Skipping ${guildOnly.length} guild command(s): DISCORD_GUILD_ID not set`)
    } else {
      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: guildOnly.map((c) => c.data.toJSON()) },
      )
      console.log(`Deployed ${guildOnly.length} guild command(s) to ${guildId}`)
    }
  }

  // Global: available in every guild the bot is in
  if (global.length > 0) {
    await rest.put(
      Routes.applicationCommands(clientId),
      { body: global.map((c) => c.data.toJSON()) },
    )
    console.log(`Deployed ${global.length} global command(s)`)
  }

  if (userOnly.length > 0) {
    await rest.put(
      Routes.applicationCommands(clientId),
      {
        body: userOnly.map((c) => ({
          ...(c.data.toJSON() as object),
          integration_types: [ApplicationIntegrationType.UserInstall],
          contexts: [InteractionContextType.BotDM, InteractionContextType.PrivateChannel],
        })),
      },
    )
    console.log(`Deployed ${userOnly.length} user-install command(s)`)
  }

  if (everywhere.length > 0) {
    await rest.put(
      Routes.applicationCommands(clientId),
      {
        body: everywhere.map((c) => ({
          ...(c.data.toJSON() as object),
          integration_types: [
            ApplicationIntegrationType.GuildInstall,
            ApplicationIntegrationType.UserInstall,
          ],
          contexts: [
            InteractionContextType.Guild,
            InteractionContextType.BotDM,
            InteractionContextType.PrivateChannel,
          ],
        })),
      },
    )
    console.log(`Deployed ${everywhere.length} everywhere command(s)`)
  }
}

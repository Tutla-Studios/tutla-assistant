import {
  Collection,
  REST,
  Routes,
  ApplicationIntegrationType,
  InteractionContextType,
} from 'discord.js'
import * as ping from './simple/ping'
import * as help from './simple/help'
import * as add from './simple/add'
import * as tools from './simple/tools/'
import * as ai from './ai/'
import * as computing from './computing/'
import * as economy from './economy/'
import * as image from './image/'
import * as info from './info/'
import * as socialmedia from './socialmedia/'
import * as troll from './troll/'
import * as advanced from './advanced/'
import * as client from './client/'
export type { Command } from './types'
import { CommandScope, type Command } from './types'

export const commands = new Collection<string, Command>([
  [ping.data.name, ping],
  [help.data.name, help],
  [add.data.name, add],
  ...tools.commands,
  ...ai.commands,
  ...computing.commands,
  ...economy.commands,
  ...image.commands,
  ...info.commands,
  ...socialmedia.commands,
  ...troll.commands,
  ...advanced.commands,
  ...client.commands,
])

function toBody(c: Command): object {
  const json = c.data.toJSON() as object
  switch (c.scope) {
    case CommandScope.User:
      return {
        ...json,
        integration_types: [ApplicationIntegrationType.UserInstall],
        contexts: [InteractionContextType.BotDM, InteractionContextType.PrivateChannel],
      }
    case CommandScope.All:
      return {
        ...json,
        integration_types: [
          ApplicationIntegrationType.GuildInstall,
          ApplicationIntegrationType.UserInstall,
        ],
        contexts: [
          InteractionContextType.Guild,
          InteractionContextType.BotDM,
          InteractionContextType.PrivateChannel,
        ],
      }
    default:
      return json
  }
}

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
  const applicationWide = all.filter((c) => c.scope !== CommandScope.Guild)

  // Guild-scoped: instant deploy to one guild
  if (guildOnly.length > 0) {
    if (!guildId) {
      console.warn(`Skipping ${guildOnly.length} guild command(s): DISCORD_GUILD_ID not set`)
    } else {
      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: guildOnly.map(toBody) },
      )
      console.log(`Deployed ${guildOnly.length} guild command(s) to ${guildId}`)
    }
  }

  // Global, user-install and everywhere commands share one route, and a PUT replaces
  // the whole set — so they must be sent together in a single request.
  if (applicationWide.length > 0) {
    await rest.put(Routes.applicationCommands(clientId), { body: applicationWide.map(toBody) })
    console.log(`Deployed ${applicationWide.length} application command(s)`)
  }
}

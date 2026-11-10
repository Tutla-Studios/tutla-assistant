import { Client, Events, GatewayIntentBits } from 'discord.js'
import { setDiscordClient } from '@/lib/bot'
import { deployCommands } from './commands'
import { installLogCapture } from './utils/logs'
import { execute as onReady } from './events/ready'
import { execute as onMessageCreate } from './events/messageCreate'
import { execute as onInteractionCreate } from './events/interactionCreate'

export async function initBot() {
  installLogCapture()
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.DirectMessageReactions,
    ],
  })

  client.once(Events.ClientReady, (c) => onReady(c))
  client.on(Events.MessageCreate, onMessageCreate)
  client.on(Events.InteractionCreate, onInteractionCreate)

  await client.login(process.env.DISCORD_TOKEN)
  setDiscordClient(client)

  await deployCommands()
}

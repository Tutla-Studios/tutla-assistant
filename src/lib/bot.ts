import type { Client } from 'discord.js'

const globalForBot = globalThis as unknown as { discordClient: Client | undefined }

export function getDiscordClient(): Client {
  if (!globalForBot.discordClient) {
    throw new Error('Discord client is not initialized yet')
  }
  return globalForBot.discordClient
}

export function setDiscordClient(client: Client): void {
  globalForBot.discordClient = client
}

export function isDiscordReady(): boolean {
  return globalForBot.discordClient?.isReady() ?? false
}

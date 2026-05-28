import type { Client } from 'discord.js'

export async function execute(client: Client<true>) {
  console.log(`Discord bot ready: ${client.user.tag}`)
}

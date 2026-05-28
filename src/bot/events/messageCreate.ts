import type { Message } from 'discord.js'

export async function execute(message: Message) {
  if (message.author.bot) return
}

import { ActivityType, PresenceUpdateStatus, type Client } from 'discord.js'
import { loadQotd, startDailyLoop } from '@/bot/utils/feed'

export async function execute(client: Client<true>) {
  console.log(`Discord bot ready: ${client.user.tag}`)
  client.user.setPresence({
    status: PresenceUpdateStatus.Idle,
    activities: [{ name: 'tutla.net', type: ActivityType.Custom }],
  })
  await loadQotd().catch((err) => console.error('Failed to load QOTD:', err))
  startDailyLoop(client)
}

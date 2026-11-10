/** Tutla feed + question of the day (port of main.py's dailyLoad and Utils.sendToSubScribers). */
import type { Client, EmbedBuilder } from 'discord.js'
import { prisma } from '@/lib/prisma'
import { state } from '@/bot/state'

const QOTD_KEY = 'qotd'
const DAY_MS = 24 * 60 * 60 * 1000

/** Channel used for bug reports and as the source of the question of the day. */
export function loggingChannelId(): string | undefined {
  return process.env.LOGGING_CHANNEL_ID || undefined
}

export async function fetchLoggingChannel(client: Client) {
  const id = loggingChannelId()
  if (!id) return null
  const channel = await client.channels.fetch(id).catch(() => null)
  return channel?.isTextBased() && 'send' in channel ? channel : null
}

/** Send a message to every subscribed channel; returns how many it reached. */
export async function sendToSubscribers(client: Client, content: string, embed?: EmbedBuilder): Promise<number> {
  const subs = await prisma.feedSubscription.findMany()
  let sent = 0
  for (const sub of subs) {
    try {
      const channel = await client.channels.fetch(sub.channelId)
      if (channel?.isTextBased() && 'send' in channel) {
        await channel.send({ content, embeds: embed ? [embed] : [] })
        sent++
      }
    } catch {
      console.warn(`Can't send feed to subscribed channel ${sub.channelId}`)
    }
  }
  return sent
}

/** Load the persisted question of the day into state. */
export async function loadQotd(): Promise<void> {
  const row = await prisma.botSetting.findUnique({ where: { key: QOTD_KEY } })
  state.qotd = row?.value ?? ''
}

/**
 * Look at the last 20 messages in the logging channel; the newest one mentioning "qotd" becomes
 * the question of the day, is deleted from the channel, and is sent to feed subscribers.
 */
export async function dailyLoad(client: Client): Promise<void> {
  const channel = await fetchLoggingChannel(client)
  if (!channel) return
  const messages = await channel.messages.fetch({ limit: 20 })
  const msg = messages.find((m) => m.content.toLowerCase().includes('qotd'))
  if (!msg) return

  state.qotd = msg.content
  await prisma.botSetting.upsert({
    where: { key: QOTD_KEY },
    update: { value: msg.content },
    create: { key: QOTD_KEY, value: msg.content },
  })
  await msg.delete().catch(() => null)
  await sendToSubscribers(client, msg.content)
  console.log('Done with daily load')
}

const g = globalThis as unknown as { __tutlaDailyTimer?: NodeJS.Timeout }

/** Start the 24h loop (skipped when BOT_DEV_MODE=true, like the Python dev_mode flag). */
export function startDailyLoop(client: Client): void {
  if (process.env.BOT_DEV_MODE === 'true' || g.__tutlaDailyTimer) return
  const run = () => dailyLoad(client).catch((err) => console.error('Daily load failed:', err))
  void run()
  g.__tutlaDailyTimer = setInterval(run, DAY_MS)
}

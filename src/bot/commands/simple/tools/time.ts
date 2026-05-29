import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('time')
  .setDescription('Convert timezones')
  .addStringOption((opt) =>
    opt.setName('time').setDescription('Time in Y-M-D H:M:S format (e.g. 2024-01-03 14:30:00)').setRequired(true),
  )
  .addStringOption((opt) =>
    opt.setName('from_tz').setDescription('Source timezone (e.g. Asia/Kolkata)').setRequired(true),
  )
  .addStringOption((opt) =>
    opt.setName('to_tz').setDescription('Target timezone (e.g. America/New_York)').setRequired(true),
  )

export async function execute(ctx: ChatInputCommandInteraction) {
  const time = ctx.options.getString('time', true)
  const fromTz = ctx.options.getString('from_tz', true)
  const toTz = ctx.options.getString('to_tz', true)

  const params = new URLSearchParams({
    fromTimeZone: fromTz,
    toTimeZone: toTz,
    dateTime: time,
    dstAmbiguity: '',
  })

  const res = await fetch(
    `https://www.timeapi.io/api/conversion/converttimezone?${params}`,
    { method: 'POST', headers: { accept: 'application/json', 'Content-Type': 'application/json' } },
  )

  if (!res.ok) {
    await ctx.reply(
      "Failed to convert time. Timezone must be `Continent/City` (e.g. `Asia/Kolkata`) and time must be `Y-M-D H:M:S` with 2-digit values (e.g. `2024-03-05 14:30:00`).",
    )
    return
  }

  const data = await res.json() as any
  await ctx.reply(`Converted time: ${data.convertedDateTime}`)
}

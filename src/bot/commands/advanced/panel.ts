import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { prisma } from '@/lib/prisma'
import { AdminLevel, getAdminLevel } from '@/bot/utils/checks'
import { recentLogs } from '@/bot/utils/logs'

export const scope = CommandScope.All
// Panel commands do their own admin-level checks and must work even for bot-banned/ToS-less owners.
export const skipChecks = true

const EDITABLE = ['xp', 'coins', 'premium', 'banned', 'admin_level'] as const

export const data = new SlashCommandBuilder()
  .setName('panel')
  .setDescription('Tutla Assistance Admin Panel')
  .addSubcommand((s) => s.setName('log').setDescription('Recent bot logs'))
  .addSubcommand((s) =>
    s
      .setName('shell')
      .setDescription('Tutla Shell')
      .addStringOption((o) =>
        o
          .setName('execution')
          .setDescription('Shell command')
          .setRequired(true)
          .addChoices(
            { name: 'ldb – print the user database', value: 'ldb' },
            { name: 'stats – bot status', value: 'stats' },
            { name: 'sp – restart the bot', value: 'sp' },
          ),
      ),
  )
  .addSubcommand((s) =>
    s
      .setName('premium')
      .setDescription('Toggle premium for a user')
      .addUserOption((o) => o.setName('user').setDescription('User').setRequired(true)),
  )
  .addSubcommand((s) =>
    s
      .setName('ban')
      .setDescription('Toggle bot-ban for a user')
      .addUserOption((o) => o.setName('user').setDescription('User').setRequired(true)),
  )
  .addSubcommand((s) =>
    s
      .setName('edit')
      .setDescription('Edit user data')
      .addUserOption((o) => o.setName('user').setDescription('User').setRequired(true))
      .addStringOption((o) =>
        o
          .setName('data')
          .setDescription('Field to change')
          .setRequired(true)
          .addChoices(...EDITABLE.map((f) => ({ name: f, value: f }))),
      )
      .addStringOption((o) => o.setName('changed').setDescription('New value').setRequired(true)),
  )

/** Minimum admin level per subcommand (levels documented in Utils.getAdminLevel). */
const REQUIRED: Record<string, AdminLevel> = {
  log: AdminLevel.Owner,
  shell: AdminLevel.Owner,
  edit: AdminLevel.Owner,
  premium: AdminLevel.Premium,
  ban: AdminLevel.Moderator,
}

const block = (text: string) => '```\n' + (text.length > 1900 ? '…' + text.slice(-1900) : text) + '\n```'

async function shell(ctx: ChatInputCommandInteraction, cmd: string) {
  if (cmd === 'ldb') {
    const users = await prisma.discordUser.findMany({ orderBy: { createdAt: 'asc' } })
    const rows = users.map(
      (u) => `${u.id} coins=${u.coins} xp=${u.xp} premium=${u.premium} banned=${u.banned} admin=${u.adminLevel}`,
    )
    await ctx.reply({ content: `Tutla Shell > ldb\n${block(`discord_user (${users.length})\n` + rows.join('\n'))}`, ephemeral: true })
    return
  }
  if (cmd === 'stats') {
    const mem = process.memoryUsage()
    const stats = [
      `uptime: ${Math.round(process.uptime())}s`,
      `guilds: ${ctx.client.guilds.cache.size}`,
      `ping: ${ctx.client.ws.ping}ms`,
      `memory: ${Math.round(mem.rss / 1024 / 1024)}MB`,
      `node: ${process.version}`,
    ]
    await ctx.reply({ content: `Tutla Shell > stats\n${block(stats.join('\n'))}`, ephemeral: true })
    return
  }
  // sp: exit; docker compose's restart policy brings the app back up.
  await ctx.reply({ content: 'Tutla Shell > sp\nRestarting…', ephemeral: true })
  console.warn(`Restart requested via /panel shell by ${ctx.user.id}`)
  setTimeout(() => process.exit(0), 1000)
}

function parseValue(field: (typeof EDITABLE)[number], raw: string): number | boolean | null {
  if (field === 'premium' || field === 'banned') {
    if (/^(true|1|yes)$/i.test(raw)) return true
    if (/^(false|0|no)$/i.test(raw)) return false
    return null
  }
  const n = Number(raw)
  if (!Number.isInteger(n)) return null
  if (field === 'admin_level' && (n < 0 || n > 4)) return null
  return n
}

export async function execute(ctx: ChatInputCommandInteraction) {
  const sub = ctx.options.getSubcommand()
  if ((await getAdminLevel(ctx.user.id)) < REQUIRED[sub]) {
    await ctx.reply({ content: "You don't have access to this panel command.", ephemeral: true })
    return
  }

  switch (sub) {
    case 'log':
      await ctx.reply({ content: block(recentLogs() || '(no logs yet)'), ephemeral: true })
      return

    case 'shell':
      await shell(ctx, ctx.options.getString('execution', true))
      return

    case 'premium':
    case 'ban': {
      const user = ctx.options.getUser('user', true)
      const field = sub === 'premium' ? 'premium' : 'banned'
      const current = await prisma.discordUser.findUnique({ where: { id: user.id }, select: { [field]: true } })
      const next = !(current as Record<string, boolean> | null)?.[field]
      await prisma.discordUser.upsert({
        where: { id: user.id },
        update: { [field]: next },
        create: { id: user.id, [field]: next },
      })
      const msg =
        sub === 'premium'
          ? next ? `Gave ${user} premium!` : `Revoked premium off ${user}!`
          : next ? `Banned ${user}` : `Unbanned ${user}!`
      await ctx.reply({ content: msg, ephemeral: true })
      return
    }

    case 'edit': {
      const user = ctx.options.getUser('user', true)
      const field = ctx.options.getString('data', true) as (typeof EDITABLE)[number]
      const raw = ctx.options.getString('changed', true)
      const value = parseValue(field, raw)
      if (value === null) {
        await ctx.reply({ content: `Invalid value \`${raw}\` for \`${field}\`.`, ephemeral: true })
        return
      }
      const column = field === 'admin_level' ? 'adminLevel' : field
      await prisma.discordUser.upsert({
        where: { id: user.id },
        update: { [column]: value },
        create: { id: user.id, [column]: value },
      })
      await ctx.reply({ content: `Edited ${field} for ${user} to ${value}`, ephemeral: true })
      return
    }
  }
}

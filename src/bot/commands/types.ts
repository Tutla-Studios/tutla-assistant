import type { ChatInputCommandInteraction } from 'discord.js'

export enum CommandScope {
  /** Deployed to DISCORD_GUILD_ID only — instant, good for dev/admin commands. */
  Guild = 'guild',
  /** Deployed to all guilds the bot is in (up to 1h propagation). */
  Global = 'global',
  /** User-installable — works in any DM/server without the bot being present. */
  User = 'user',
  /** Guild-installed + user-installed — usable everywhere. */
  All = 'all',
}

export interface Command {
  data: { name: string; toJSON(): unknown }
  scope: CommandScope
  /** Mark true to restrict this command to premium users only (shows 🔮 in /help). */
  premium?: boolean
  execute(interaction: ChatInputCommandInteraction): Promise<void>
}

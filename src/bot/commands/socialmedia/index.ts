import type { Command } from '@/bot/commands/types'
import * as instagram from './instagram'
import * as modrinth from './modrinth'
import * as youtube from './youtube'

export const commands: [string, Command][] = [
  [instagram.data.name, instagram],
  [modrinth.data.name, modrinth],
  [youtube.data.name, youtube],
]

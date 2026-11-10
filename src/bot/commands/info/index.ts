import type { Command } from '@/bot/commands/types'
import * as server from './server'
import * as userinfo from './userinfo'
import * as word from './word'

export const commands: [string, Command][] = [
  [server.data.name, server],
  [userinfo.data.name, userinfo],
  [word.data.name, word],
]

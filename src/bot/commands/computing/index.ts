import type { Command } from '@/bot/commands/types'
import * as base64 from './base64'
import * as binary from './binary'
import * as calculate from './calculate'
import * as coderoast from './coderoast'
import * as github from './github'
import * as program from './program'
import * as qr from './qr'
import * as whois from './whois'
import * as ip from './ip'
import * as search from './search'

export const commands: [string, Command][] = [
  [base64.data.name, base64],
  [binary.data.name, binary],
  [calculate.data.name, calculate],
  [coderoast.data.name, coderoast],
  [github.data.name, github],
  [program.data.name, program],
  [qr.data.name, qr],
  [whois.data.name, whois],
  [ip.data.name, ip],
  [search.data.name, search],
]

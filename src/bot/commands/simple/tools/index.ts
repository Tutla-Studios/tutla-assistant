import type { Command } from '@/bot/commands/types'
import * as ansi from './ansi'
import * as afk from './afk'
import * as ball from './8ball'
import * as freaky from './freaky'
import * as regional from './regional'
import * as brain from './brain'
import * as emoji from './emoji'
import * as coinflip from './coinflip'
import * as dice from './dice'
import * as pokemon from './pokemon'
import * as roast from './roast'
import * as weather from './weather'
import * as translate from './translate'
import * as time from './time'
import * as urlshortner from './urlshortner'
import * as poll from './poll'
import * as convert from './convert'
import * as random from './random'

export const commands: [string, Command][] = [
  [ansi.data.name, ansi],
  [afk.data.name, afk],
  [ball.data.name, ball],
  [freaky.data.name, freaky],
  [regional.data.name, regional],
  [brain.data.name, brain],
  [emoji.data.name, emoji],
  [coinflip.data.name, coinflip],
  [dice.data.name, dice],
  [pokemon.data.name, pokemon],
  [roast.data.name, roast],
  [weather.data.name, weather],
  [translate.data.name, translate],
  [time.data.name, time],
  [urlshortner.data.name, urlshortner],
  [poll.data.name, poll],
  [convert.data.name, convert],
  [random.data.name, random],
]
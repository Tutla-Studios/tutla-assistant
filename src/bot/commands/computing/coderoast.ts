import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { clip } from '@/bot/utils/http'

const ROASTS: Record<string, string> = {
  length: `\`\`\`python
Traceback (most recent call last):
  File "universe.py", line 507, in _life
    await getGirl(*args, **kwargs)
  File "universe.py", line 175, in getGirl
    await girl.CheckSize([E])
  File "unverse/human.py", line 55, in CheckSize
    Req = Average.Length - [E].Psize()
LengthError: 2 Inches\`\`\``,
  nil: `\`\`\`lua
lua: universe.lua:2: attempt to perform arithmetic on local '[E]' (a nil value)
stack traceback:
	universe.lua:205: in function 'getObject'
	universe.lua:5: in main chunk
	[C]: ?\`\`\``,
  java: `\`\`\`java
Exception in thread "main" java.lang.NullPointerException: Cannot invoke "[E].get()" because "[E]" is null
    at com.universe.Life.find[E](Life.java:34)
    com.universe.Main.get[E]([E].java:24)
    at com.universe.Main.main(Main.java:10)\`\`\``,
  stfu: `\`\`\`lua
[E] = random.Person(Union[Character.Types.IDIOT,Character.Types.Retarded], SIGMA=false, Life=nil)
[E]:ShutUp()

from internet.SocialMedia import Discord

SigmaMaleDiscordMod = Discord:login(MainCharacter)
ThisServer = SigmaMaleDiscordMod:getServer()
ThisServer:ban([E], time=Time.Eternity) -- The Sigma Male makes the idiot [E] shut up\`\`\``,
  sigma: `\`\`\`lua
[E].AURA -= Utils.INFINITY
console.log([E].SIGMA)
================================
Error in Line 1, Script "life.py": Cannot subtract None from [E] as local variable [E].AURA is a constant of None
while Exception.NOAURA was running another error at Line 2: Cannot log [E].SIGMA as constant SIGMA is a NoneType\`\`\``,
  idiot: `\`\`\`lua
from CharcterTypes import Bitch, Idiot, Stupid, Illiterate
[E] = Random.Person("[E]", Type=[Bitch.Max(), Idiot.Retarded, Stupid.max(), illiterate.max()], "got his application rejected for getting his non existant brain back")

ardtyss@ [E]:smash()
ardtyss@ [E]:touch()
[E]:setColor(Skintone.BLACK)
[E] = Idiot\`\`\``,
}

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('coderoast')
  .setDescription('Roast in code')
  .addStringOption((o) =>
    o
      .setName('template')
      .setDescription('Select a template')
      .setRequired(true)
      .addChoices(
        { name: 'Egg Plant Length', value: 'length' },
        { name: "Object can't reduced/increase because it doesn't exist", value: 'nil' },
        { name: 'Cannot get object', value: 'java' },
        { name: 'stfu', value: 'stfu' },
        { name: 'No Sigma & Aura', value: 'sigma' },
        { name: 'Programmically expresses the fact that you are idiotic', value: 'idiot' },
      ),
  )
  .addStringOption((o) => o.setName('roast').setDescription('Who/what to roast').setRequired(true))

export async function execute(ctx: ChatInputCommandInteraction) {
  const template = ROASTS[ctx.options.getString('template', true)]
  const roast = ctx.options.getString('roast', true)
  await ctx.reply(clip(template.replaceAll('[E]', roast)))
}

import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('brain')
  .setDescription('Make ppl use their brain')

export async function execute(ctx: ChatInputCommandInteraction) {
  await ctx.reply(`## Use your brain
1. **[Don't ask to ask](https://dontasktoask.com)**
2. **Google it**
-# Any information I give you will likely be the first search result I find on google. So just do us both a favor and do it yourself. It will also save you time, as you don't have to wait for me to respond!
3. **[Don't just say hello in chat](<https://nohello.net>)**. Instead, __Just ask the question__! 🤯😊👏🏻
4. Use proper channels
-# Do not ask in someone's DMs if there is a valid support channel or ticket system in your server of origin. Asking in DMs makes it harder for other people to find a solution to the same problem. Unless your problem may potentialy reveal private information, always use publicly available support channels.
5. Ask about the problem not your solution
Guy> \`How do I increase the font size in my header?\`
Dev> \`Add a "font-size:" tag to your header class\`
Dev> \`Why do you want to increase it?\`
Guy> \`Im trying to make it stand out\`
Dev> \`Got it. Consider using a larger font size and maybe some styling effects like bold or color to make it stand out even more\`
Guy> \`Ah, thank you! I didn't think about that.\`

Make sure to always share the bigger picture, and provide detail. If someone asks for more information, please provide it

Taken from [trouper.me](<https://trouper.me>)`)
}

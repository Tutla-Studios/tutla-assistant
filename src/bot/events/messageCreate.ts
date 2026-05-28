import type { Message } from 'discord.js'
import { state } from '@/bot/state'
export async function execute(message: Message) {
  if (message.author.bot) return

  if (message.author.id in state.afkUsers){
    delete state.afkUsers[message.author.id];
    await message.reply(`<@${message.author.id}> is no longer AFK!`);
    return;
  }

  if (message.mentions.users.size > 0){
    for (const userId in state.afkUsers){
      if (message.mentions.has(userId) && !message.mentions.everyone){
        const msg = await message.reply(`<@${userId}> is AFK for ${state.afkUsers[userId]}`);
        setTimeout(async () => {
        try {
          await msg.delete();
        } catch {
        }
      }, 5000);
      }
    };
  }
}

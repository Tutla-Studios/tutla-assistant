import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import {state} from '@/bot/state'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('afk')
  .setDescription('Set your afk status')
  .addStringOption((opt) =>
    opt.setName('status').setDescription('Your afk status').setRequired(true),
  )

export async function execute(ctx: ChatInputCommandInteraction) {
    const reason: string = ctx.options.getString('status') ?? "No reason specified";
    if (!(ctx.user.id in state.afkUsers)){
        state.afkUsers[ctx.user.id] = reason
        await ctx.reply("You are now afk!")
    } else {
        delete state.afkUsers[ctx.user.id]
        await ctx.reply("You are no longer in afk")
    }
}

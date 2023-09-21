import { Piece, Precondition } from "@sapphire/framework";
import {
    ChatInputCommandInteraction,
    ContextMenuCommandInteraction,
    Message,
    User,
} from "discord.js";

export class BetaTesterOnlyPrecondition extends Precondition {
    constructor(ctx: Piece.Context, opts: Precondition.Options) {
        super(ctx, {
            ...opts,
            name: "BetaTesterOnly",
        });
    }

    override messageRun = async (message: Message) =>
        await this.checkBetaTester(message.author);

    override chatInputRun = async (interaction: ChatInputCommandInteraction) =>
        await this.checkBetaTester(interaction.user);

    override contextMenuRun = async (
        interaction: ContextMenuCommandInteraction,
    ) => await this.checkBetaTester(interaction.user);

    private async checkBetaTester(user: User) {
        const { database, staff } = this.container;
        if (staff.includes(user.id)) return this.ok();

        const db = await database.users.fetch(user);

        if (!db.betaTester)
            return this.error({
                message: "You are not a beta Tester",
            });

        return this.ok();
    }
}

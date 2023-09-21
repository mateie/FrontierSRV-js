import { Piece, Precondition } from "@sapphire/framework";
import { ChatInputCommandInteraction } from "discord.js";

export class StaffOnlyPre extends Precondition {
    constructor(ctx: Piece.Context, opts: Precondition.Options) {
        super(ctx, {
            ...opts,
            name: "StaffOnly",
        });
    }

    override chatInputRun = (interaction: ChatInputCommandInteraction) =>
        this.checkStaff(interaction.user.id);

    private checkStaff = (userId: string) =>
        this.container.staff.includes(userId)
            ? this.ok()
            : this.error({ message: "Only staff can use this command" });
}

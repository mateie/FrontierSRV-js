import {
    ContextMenuCommandDeniedPayload,
    Listener,
    UserError,
} from "@sapphire/framework";

export class SlashCommandListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Context Command Denied",
            event: "contextMenuCommandDenied",
        });
    }

    async run(
        error: UserError,
        { interaction }: ContextMenuCommandDeniedPayload
    ) {
        const { initialized } = this.container;

        if (!initialized)
            return interaction.reply({
                content: "Bot is not ready yet, please wait a few seconds.",
                ephemeral: true,
            });

        if (Reflect.get(Object(error.context), "silent")) return;
        return interaction.reply({ content: error.message, ephemeral: true });
    }
}

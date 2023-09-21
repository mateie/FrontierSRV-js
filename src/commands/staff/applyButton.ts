import { Command } from "@sapphire/framework";
import { ButtonStyle, ChannelType, PermissionsBitField } from "discord.js";

export class ApplyButtonCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "applybutton",
            description: "Apply button",
            preconditions: ["StaffOnly"],
        });
    }

    override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDefaultMemberPermissions(
                    PermissionsBitField.Flags.ManageGuild,
                )
                .addChannelOption((opt) =>
                    opt
                        .setName("channel")
                        .setDescription("The channel to send the button to")
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText),
                ),
        );
    }

    async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const { util } = this.container;

        const channel = interaction.options.getChannel("channel", true, [
            ChannelType.GuildText,
        ]);

        const embed = util
            .embed()
            .setColor("#09FF00")
            .setDescription("**Click the `Apply` button below to apply**");

        const row = util
            .row()
            .setComponents(
                util
                    .button()
                    .setCustomId("apply_to_smp")
                    .setLabel("Apply")
                    .setEmoji("📝")
                    .setStyle(ButtonStyle.Success),
            );

        await channel.send({
            embeds: [embed],
            components: [row],
        });

        await interaction.reply({
            content: "**Apply button sent!**",
            ephemeral: true,
        });
    }
}

import { Subcommand } from "@sapphire/plugin-subcommands";
import { PermissionsBitField } from "discord.js";

export class StaffCommand extends Subcommand {
    constructor(ctx: Subcommand.Context, opts: Subcommand.Options) {
        super(ctx, {
            ...opts,
            name: "staff",
            description: "Staff System",
            preconditions: ["StaffOnly"],
        });
    }

    /**
     * Register Slash Commands
     */

    override registerApplicationCommands(registry: Subcommand.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDefaultMemberPermissions(
                    PermissionsBitField.Flags.ManageGuild,
                )
                .addSubcommand((command) =>
                    command.setName("add").setDescription("Add a staff member"),
                )
                .addSubcommand((command) =>
                    command
                        .setName("remove")
                        .setDescription("Remove a staff member"),
                )
                .addSubcommand((command) =>
                    command
                        .setName("list")
                        .setDescription("List all staff members"),
                ),
        );
    }
}

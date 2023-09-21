import {
    InteractionHandler,
    InteractionHandlerTypes,
    PieceContext,
} from "@sapphire/framework";
import { ButtonInteraction, ButtonStyle, TextInputStyle } from "discord.js";
import Application from "#schemas/Application";
import moment from "moment";
import { gql } from "@apollo/client";

export class ApplicationResponseButtons extends InteractionHandler {
    constructor(ctx: PieceContext, opts: InteractionHandler.Options) {
        super(ctx, {
            ...opts,
            interactionHandlerType: InteractionHandlerTypes.Button,
        });
    }

    public override parse(interaction: ButtonInteraction) {
        if (
            ![
                "approve_application",
                "deny_application",
                "undecided_application",
            ].includes(interaction.customId)
        )
            return this.none();

        return this.some();
    }

    public async run(interaction: ButtonInteraction) {
        if (!interaction.inCachedGuild()) return;

        const { client, database, ac, util } = this.container;

        const { message, user: clicker } = interaction;

        const embed = message.embeds[0];

        const userId = embed.footer?.text?.split(": ")[1];

        if (!userId) return;

        const application = await Application.findOne({
            userId,
        });

        const user = await client.users.fetch(userId).catch(() => null);

        if (!application)
            return interaction.reply({
                content:
                    "**This user does not have an application or it was deleted**",
                ephemeral: true,
            });

        if (!user)
            return interaction.reply({
                content:
                    "**This user is not in the server, so you cannot approve, deny or mark the application undecided**",
                ephemeral: true,
            });

        const db = await database.users.fetch(user);

        if (
            application.status !== "pending" &&
            application.status !== "undecided"
        )
            return interaction.reply({
                content: `This application is already **${application.status}**`,
                ephemeral: true,
            });

        if (interaction.customId !== "approve_application") {
            let whatHappened = "";

            const modal = util.modal();

            switch (interaction.customId) {
                case "deny_application": {
                    modal
                        .setCustomId("deny_application_modal")
                        .setTitle("Deny Application")
                        .setComponents(
                            util
                                .modalRow()
                                .setComponents(
                                    util
                                        .input()
                                        .setCustomId("deny_application_reason")
                                        .setLabel("Your reason for denying")
                                        .setPlaceholder("Type your reason here")
                                        .setRequired(true)
                                        .setStyle(TextInputStyle.Paragraph),
                                ),
                        );

                    whatHappened = "declined";

                    break;
                }

                case "undecided_application":
                    {
                        modal
                            .setCustomId("undecided_application_modal")
                            .setTitle("Undecided Application")
                            .setComponents(
                                util
                                    .modalRow()
                                    .setComponents(
                                        util
                                            .input()
                                            .setCustomId(
                                                "undecided_application_reason",
                                            )
                                            .setLabel(
                                                "Your reason for undecided",
                                            )
                                            .setPlaceholder(
                                                "Type your reason here",
                                            )
                                            .setRequired(true)
                                            .setStyle(TextInputStyle.Paragraph),
                                    ),
                            );
                    }

                    whatHappened = "undecided";

                    break;
            }

            await interaction.showModal(modal);

            const mInteraction = await interaction
                .awaitModalSubmit({
                    time: 5000,
                })
                .catch(() => null);

            let reason = "No reason provided";

            if (mInteraction)
                reason =
                    mInteraction.fields.fields.at(0)?.value?.toString() ||
                    reason;

            await user
                .send({
                    content: `Your application was **${whatHappened}** for the following reason: \`${reason}\``,
                })
                .then(() => {
                    const successOpts = {
                        content: `**Successfully DM'd the user that their application was \`${whatHappened}\` with reason: \`${reason}\`**`,
                        ephemeral: true,
                    };
                    if (mInteraction) mInteraction.reply(successOpts);
                    else message.reply(successOpts);
                })
                .catch(() => {
                    const failedOpts = {
                        content: `**Failed to DM the user that their application was \`${whatHappened}\` with reason: \`${reason}\`**`,
                        ephemeral: true,
                    };
                    if (mInteraction) mInteraction.reply(failedOpts);
                    else message.reply(failedOpts);
                });
        }

        if (interaction.customId !== "undecided_application") {
            await message.edit({
                components: [
                    util
                        .row()
                        .setComponents(
                            util
                                .button()
                                .setCustomId("view_application")
                                .setLabel("View Application")
                                .setEmoji("📄")
                                .setStyle(ButtonStyle.Primary),
                            util
                                .button()
                                .setCustomId("view_transcript")
                                .setLabel("View Transcript")
                                .setEmoji("📝")
                                .setStyle(ButtonStyle.Primary),
                        ),
                ],
            });
        } else {
            await message.edit({
                components: [
                    util
                        .row()
                        .setComponents(
                            util
                                .button()
                                .setCustomId("approve_application")
                                .setEmoji("✅")
                                .setLabel("Approve")
                                .setStyle(ButtonStyle.Success),
                            util
                                .button()
                                .setCustomId("deny_application")
                                .setLabel("Deny")
                                .setEmoji("⛔")
                                .setStyle(ButtonStyle.Danger),
                        ),
                    util
                        .row()
                        .setComponents(
                            util
                                .button()
                                .setCustomId("view_application")
                                .setLabel("View Application")
                                .setEmoji("📄")
                                .setStyle(ButtonStyle.Primary),
                            util
                                .button()
                                .setCustomId("view_transcript")
                                .setLabel("View Transcript")
                                .setEmoji("📝")
                                .setStyle(ButtonStyle.Primary),
                        ),
                ],
            });

            await message.pin();
        }

        switch (interaction.customId) {
            case "approve_application": {
                await application.updateOne({
                    status: "approved",
                    approvedBy: clicker.id,
                    approvedAt: Date.now(),
                });

                db.canSubmitAgainAt = null;

                if (message.pinned) await message.unpin();

                await ac
                    .query({
                        query: gql`
                            query whitelistPlayer($username: String!) {
                                whitelistPlayer(username: $username)
                            }
                        `,
                        variables: {
                            username: application.mcUsername,
                        },
                    })
                    .catch((err: any) => console.log(err));

                await user.send({
                    content: `**Your application was approved and now you are whitelisted!**`,
                });

                break;
            }
            case "deny_application": {
                await application.updateOne({
                    status: "denied",
                    deniedBy: clicker.id,
                    deniedAt: Date.now(),
                });

                db.canSubmitAgainAt = moment(application.createdAt)
                    .add(1, "day")
                    .unix();

                if (message.pinned) await message.unpin();

                break;
            }
            case "undecided_application": {
                await application.updateOne({
                    status: "undecided",
                    undecidedBy: clicker.id,
                    undecidedAt: Date.now(),
                });

                db.canSubmitAgainAt = null;

                break;
            }
        }

        await db.save();
    }
}

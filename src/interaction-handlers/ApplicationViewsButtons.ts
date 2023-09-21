import {
    InteractionHandler,
    InteractionHandlerTypes,
    PieceContext,
} from "@sapphire/framework";
import {
    AttachmentBuilder,
    ButtonInteraction,
    ButtonStyle,
    ComponentType,
} from "discord.js";
import Application from "#schemas/Application";

export class ApplicationViewsButtons extends InteractionHandler {
    constructor(ctx: PieceContext, opts: InteractionHandler.Options) {
        super(ctx, {
            ...opts,
            interactionHandlerType: InteractionHandlerTypes.Button,
        });
    }

    public override parse(interaction: ButtonInteraction) {
        if (
            !["view_application", "view_transcript"].includes(
                interaction.customId,
            )
        )
            return this.none();

        return this.some();
    }

    public async run(interaction: ButtonInteraction) {
        if (!interaction.inCachedGuild()) return;

        const { util } = this.container;

        const { message } = interaction;

        const embed = message.embeds[0];

        const userId = embed.footer?.text?.split(": ")[1];

        if (!userId) return;

        const application = await Application.findOne({
            userId,
        });

        if (!application)
            return interaction.reply({
                content:
                    "**This user does not have an application or it was deleted**",
                ephemeral: true,
            });

        switch (interaction.customId) {
            case "view_application": {
                await interaction.reply({
                    content: "**Fetching the application...**",
                    ephemeral: true,
                });

                const platform = application.questions[0].answer as string;
                const mcUsername = application.questions[1].answer as string;
                const age = application.questions[2].answer as number;
                const country = application.questions[3].answer as string;
                const timePlayed = application.questions[4].answer as string;
                const likes = application.questions[5].answer as string;
                const about = application.questions[6].answer as string;
                const screenshots = (
                    application.questions[7]
                        ? application.questions[7].answer
                        : null
                ) as (string | Buffer)[] | null;
                const additionalQuestions = (
                    application.questions[8]
                        ? application.questions[8].answer
                        : null
                ) as string | null;

                const platformEmoji = platform.includes("Java")
                    ? "<:grass_block:1138387731886657608>"
                    : "<:bedrock_block:1138387836899446874>";

                const embed = util
                    .embed()
                    .setAuthor({
                        name: application.username,
                        iconURL: application.iconURL,
                    })
                    .setTitle("Application Review")
                    .setDescription(
                        `${platformEmoji} **${platform}** | **${mcUsername}** **has been playing: ${timePlayed}**\n\n<:info:1143702668498440345> ${age} years old from **${country}**\n\n***Their likes***\n\`\`\`${likes}\`\`\`\n***About them***\n\`\`\`${about}\`\`\`${
                            additionalQuestions
                                ? `\n***Additional Questions***\n\`\`\`${additionalQuestions}\`\`\``
                                : ""
                        }`,
                    );

                const screenshotLinks = [];
                const attachments: AttachmentBuilder[] = [];

                if (screenshots) {
                    for (let i = 0; i < screenshots.length; i++) {
                        const screenshot = screenshots[i];
                        if (typeof screenshot === "string")
                            screenshotLinks.push(screenshot);
                        else {
                            attachments.push(
                                util.attachment(
                                    Buffer.from(
                                        screenshot.toString("base64"),
                                        "base64",
                                    ),
                                    `screenshot-${i}.png`,
                                ),
                            );
                        }
                    }
                }

                if (screenshotLinks.length > 0)
                    embed.addFields({
                        name: "Screenshot Links",
                        value: screenshotLinks.join("\n"),
                    });

                let page = 0;

                await interaction.editReply({
                    content: null,
                    embeds: [embed],
                    files: attachments.length > 0 ? [attachments[page]] : [],
                });

                if (attachments.length > 1) {
                    const navButtons = util
                        .row()
                        .setComponents(
                            util
                                .button()
                                .setCustomId("previous_page")
                                .setEmoji("⬅️")
                                .setStyle(ButtonStyle.Secondary),
                            util
                                .button()
                                .setCustomId("next_page")
                                .setEmoji("➡️")
                                .setStyle(ButtonStyle.Secondary),
                        );

                    const msg = await interaction.editReply({
                        components: [navButtons],
                    });

                    const collector = msg.createMessageComponentCollector({
                        componentType: ComponentType.Button,
                    });

                    collector.on("collect", async (i) => {
                        await i.deferUpdate();

                        switch (i.customId) {
                            case "previous_page":
                                page =
                                    page > 0 ? --page : attachments.length - 1;
                                break;
                            case "next_page":
                                page =
                                    page + 1 < attachments.length ? ++page : 0;
                                break;
                            default:
                                break;
                        }

                        await i.editReply({
                            files: [attachments[page]],
                        });
                    });
                }

                break;
            }
            case "view_transcript": {
                const transcript = util.attachment(
                    application.transcript,
                    `${application.id}-transcript.html`,
                );

                await interaction.reply({
                    content: "Download the transcript below",
                    files: [transcript],
                    ephemeral: true,
                });
                break;
            }
        }
    }
}

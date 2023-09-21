import {
    InteractionHandler,
    InteractionHandlerTypes,
    PieceContext,
} from "@sapphire/framework";
import {
    AnyThreadChannel,
    ButtonInteraction,
    ButtonStyle,
    ChannelType,
    Collection,
    ComponentType,
    Message,
    time as ts,
} from "discord.js";
import Application from "#schemas/Application";

import {
    ExportReturnType,
    generateFromMessages,
} from "discord-html-transcripts";

export class ApplyButton extends InteractionHandler {
    constructor(ctx: PieceContext, opts: InteractionHandler.Options) {
        super(ctx, {
            ...opts,
            interactionHandlerType: InteractionHandlerTypes.Button,
        });
    }

    public override parse(interaction: ButtonInteraction) {
        if (interaction.customId !== "apply_to_smp") return this.none();

        return this.some();
    }

    public async run(interaction: ButtonInteraction) {
        if (!interaction.inCachedGuild()) return;

        const { database, recruitingChannel, util } = this.container;

        const { guild, user } = interaction;

        await interaction.deferReply({ ephemeral: true });

        const application = await Application.findOne({
            userId: user.id,
        });

        const dbUser = await database.users.fetch(user);

        if (dbUser.age < 18)
            return interaction.editReply({
                content:
                    "**You must be 18 or older to apply!** *If you think this is an error, please contact staff*",
            });

        if (application) {
            switch (application.status) {
                case "approved":
                    return interaction.editReply({
                        content:
                            "**You already have an approved application!**",
                    });
                case "pending":
                    return interaction.editReply({
                        content: "**You already have an application pending!**",
                    });
                case "denied":
                    if (
                        dbUser.canSubmitAgainAt &&
                        dbUser.canSubmitAgainAt < Date.now()
                    )
                        return interaction.editReply({
                            content: `**You already have a denied application!**\n\n**You can submit another application in** ***${ts(
                                dbUser.canSubmitAgainAt,
                                "R",
                            )}***`,
                        });
            }
        }

        const applicationCh = guild.channels.cache.get("1154523780870324265");
        if (!applicationCh || applicationCh.type !== ChannelType.GuildText)
            return;

        const applicationId = `${user.username.substring(
            0,
            6,
        )}-${user.id.substring(0, 6)}`;

        const applicationName = `${user.username.substring(
            0,
            6,
        )} - Application`;

        if (
            applicationCh.threads.cache.some(
                (thread) => thread.name === applicationName,
            )
        )
            return interaction.editReply({
                content: "**You already started an application process!**",
            });

        const thread = await applicationCh.threads.create({
            name: applicationName,
            autoArchiveDuration: 4320,
            type: ChannelType.PrivateThread,
            invitable: false,
        });

        await thread.members.add(user.id);

        await interaction.editReply({
            content: `**Your application process has started!**\n\n**Click the channel below 👇**\n**<#${thread.id}>**`,
        });

        const embed = util
            .embed()
            .setAuthor({
                name: `${util.shorten(
                    user.username,
                    200,
                )} - Application Process`,
                iconURL: user.displayAvatarURL(),
            })
            .setColor("Orange");

        const buttons = util
            .row()
            .setComponents(
                util
                    .button()
                    .setCustomId("java_edition")
                    .setLabel("Java Edition")
                    .setEmoji("<:grass_block:1138387731886657608>")
                    .setStyle(ButtonStyle.Success),
                util
                    .button()
                    .setCustomId("bedrock_edition")
                    .setLabel("Bedrock Edition")
                    .setEmoji("<:bedrock_block:1138387836899446874>")
                    .setStyle(ButtonStyle.Secondary),
            );

        const startMessage = await thread.send({
            embeds: [embed.setTitle("Which platform are you on?")],
            components: [buttons],
        });

        const messages: Collection<string, Message> = new Collection();

        const time = 60000;

        const platformInteraction = await startMessage
            .awaitMessageComponent({
                componentType: ComponentType.Button,
                filter: (i) => i.user.id === user.id,
                time,
            })
            .catch(() => null);

        if (!platformInteraction) {
            await thread.delete();
            return interaction.followUp({
                content:
                    "**You took too long to answer, so your application process was terminated!**",
                ephemeral: true,
            });
        }

        const platform = util.capEachFirstLetter(
            platformInteraction.customId.split("_").join(" "),
            " ",
        );

        const questions = [];

        questions.push({
            question: "Which Platform are you on?",
            answer: platform,
        });

        await thread.setLocked(true);

        const platformChoiceMsg = await thread.send({
            content: "**You chose `" + platform + "` as your platform**!",
        });

        messages.set(platformChoiceMsg.id, platformChoiceMsg);

        await startMessage.edit({
            embeds: [embed.setTitle("What is your Minecraft Username?")],
            components: [],
        });

        setTimeout(async () => {
            await platformChoiceMsg.delete();
            await thread.setLocked(false);
        }, 1000);

        const username = await thread
            .awaitMessages({
                filter: (m) => m.author.id === user.id,
                max: 1,
                time,
            })
            .catch(() => null);

        if (!username) {
            await thread.delete();
            return interaction.followUp({
                content:
                    "**You took too long to answer, so your application process was terminated!**",
                ephemeral: true,
            });
        }

        const usernameMsg = username.first();
        if (!usernameMsg) return;

        await usernameMsg.delete();

        const usernameAnswer = usernameMsg.content;

        questions.push({
            question: "What is your Minecraft Username?",
            answer: usernameAnswer,
        });

        usernameMsg.content = `*What is your Minecraft Username?*\n\n**${usernameAnswer}**`;
        messages.set(usernameMsg.id, usernameMsg);

        if (!dbUser.age || dbUser.age < 18) {
            await startMessage.edit({
                embeds: [
                    embed
                        .setTitle("How old are you?")
                        .setDescription(
                            "`Must be 18+` (Please enter a number)",
                        ),
                ],
                components: [],
            });

            let invalidAnswer = true;

            while (invalidAnswer) {
                const ageAnswer = await thread
                    .awaitMessages({
                        filter: (m) => m.author.id === user.id,
                        max: 1,
                        time,
                    })
                    .catch(() => null);

                if (!ageAnswer) {
                    await thread.delete();
                    await interaction.followUp({
                        content:
                            "**You took too long to answer, so your application process was terminated!**",
                        ephemeral: true,
                    });
                    break;
                }

                const ageMsg = ageAnswer.first();

                if (!ageMsg) continue;

                const ageNum = parseInt(ageMsg.content);

                if (!ageNum) {
                    const sent = await ageMsg.channel.send({
                        content: "**Please enter a number!**",
                    });

                    await ageMsg.delete().catch(() => null);

                    setTimeout(async () => {
                        await sent.delete();
                    }, 1000);

                    continue;
                }

                dbUser.age = ageNum;

                await dbUser.save();

                if (ageNum < 18) {
                    invalidAnswer = false;

                    await thread.delete();

                    await interaction.followUp({
                        content: "**You must be 18 years or older to apply!**",
                        ephemeral: true,
                    });
                    break;
                }

                invalidAnswer = false;

                await ageMsg.delete();

                questions.push({
                    question: "How old are you?",
                    answer: ageNum,
                });

                ageMsg.content =
                    "*How old are you?*\n\n`" + ageNum + "` **years old**";
                messages.set(ageMsg.id, ageMsg);
            }
        } else
            questions.push({
                question: "How old are you?",
                answer: dbUser.age,
            });

        await startMessage.edit({
            embeds: [
                embed
                    .setTitle("What country do you live in?")
                    .setDescription(null),
            ],
        });

        const countryMessage = await thread
            .awaitMessages({
                filter: (m) => m.author.id === user.id,
                max: 1,
                time,
            })
            .catch(() => null);

        if (!countryMessage) {
            await thread.delete();
            return interaction.followUp({
                content:
                    "**You took too long to answer, so your application process was terminated!**",
                ephemeral: true,
            });
        }

        const cMsg = countryMessage.first();
        if (!cMsg) return;

        await cMsg.delete();

        const countryAnswer = cMsg.content;

        questions.push({
            question: "What country do you live in?",
            answer: countryAnswer,
        });

        cMsg.content = `*What country do you live in?*\n\n**${countryAnswer}**`;

        messages.set(cMsg.id, cMsg);

        await startMessage.edit({
            embeds: [
                embed.setTitle("How long have you been playing minecraft?"),
            ],
        });

        const playTimeMessage = await thread
            .awaitMessages({
                filter: (m) => m.author.id === user.id,
                max: 1,
                time,
            })
            .catch(() => null);

        if (!playTimeMessage) {
            await thread.delete();
            return interaction.followUp({
                content:
                    "**You took too long to answer, so your application process was terminated!**",
                ephemeral: true,
            });
        }

        const pMsg = playTimeMessage.first();
        if (!pMsg) return;

        await pMsg.delete();

        const playTimeAnswer = pMsg.content;

        questions.push({
            question: "How long have you been playing minecraft?",
            answer: playTimeAnswer,
        });

        pMsg.content = `*How long have you been playing minecraft?*\n\n**${playTimeAnswer}**`;
        messages.set(pMsg.id, pMsg);

        await startMessage.edit({
            embeds: [
                embed.setTitle(
                    "What do you you like the most about Minecraft?",
                ),
            ],
        });

        const likeMessage = await thread
            .awaitMessages({
                filter: (m) => m.author.id === user.id,
                max: 1,
                time,
            })
            .catch(() => null);

        if (!likeMessage) {
            await thread.delete();
            return interaction.followUp({
                content:
                    "**You took too long to answer, so your application process was terminated!**",
                ephemeral: true,
            });
        }

        const lMsg = likeMessage.first();
        if (!lMsg) return;

        await lMsg.delete();

        const likeAnswer = lMsg.content;

        questions.push({
            question: "What do you like the most about Minecraft?",
            answer: likeAnswer,
        });

        lMsg.content = `*What do you like the most about Minecraft?*\n\n**${likeAnswer}**`;
        messages.set(lMsg.id, lMsg);

        await startMessage.edit({
            embeds: [
                embed
                    .setTitle("Tell us a bit about yourself!")
                    .setDescription(
                        "**Personality, hobbies, interest, anything!**",
                    ),
            ],
        });

        const aboutMessage = await thread
            .awaitMessages({
                filter: (m) => m.author.id === user.id,
                max: 1,
                time,
            })
            .catch(() => null);

        if (!aboutMessage) {
            await thread.delete();
            return interaction.followUp({
                content:
                    "**You took too long to answer, so your application process was terminated!**",
                ephemeral: true,
            });
        }

        const aMsg = aboutMessage.first();

        if (!aMsg) return;

        await aMsg.delete();

        const aboutAnswer = aMsg.content;

        questions.push({
            question: "Tell us a bit about yourself!",
            answer: aboutAnswer,
        });

        aMsg.content = `*Tell us a bit about yourself!*\n**${aboutAnswer}**`;
        messages.set(aMsg.id, aMsg);

        const yesNoButtons = util
            .row()
            .setComponents(
                util
                    .button()
                    .setCustomId("yes")
                    .setLabel("Yes")
                    .setStyle(ButtonStyle.Success),
                util
                    .button()
                    .setCustomId("no")
                    .setLabel("No")
                    .setStyle(ButtonStyle.Danger),
            );

        await startMessage.edit({
            embeds: [
                embed
                    .setTitle("Any Screenshots?")
                    .setDescription(
                        "Do you want to provide any screenshot/s of previous builds?\n\n***You will have 2 minutes to submit them, when prompted.***",
                    ),
            ],
            components: [yesNoButtons],
        });

        const screenshotMessage = await startMessage
            .awaitMessageComponent({
                componentType: ComponentType.Button,
                filter: (i) => i.user.id === user.id,
                time,
            })
            .catch(() => null);

        if (!screenshotMessage) {
            await thread.delete();
            return interaction.followUp({
                content:
                    "**You took too long to answer, so your application process was terminated!**",
                ephemeral: true,
            });
        }

        if (!screenshotMessage) {
            await thread.delete();
            return interaction.followUp({
                content:
                    "**You took too long to answer, so your application process was terminated!**",
                ephemeral: true,
            });
        }

        let hasScreenshot = false;

        const sMsg = screenshotMessage.customId;

        if (sMsg === "yes") hasScreenshot = true;

        await screenshotMessage.deferUpdate();

        if (hasScreenshot) {
            await startMessage.edit({
                embeds: [
                    embed
                        .setTitle(`Screenshot Submission`)
                        .setDescription(
                            "Since you have screenshot/s, please upload them here or post links. (You can upload multiple images at once!)\n\n**You have *2 minutes* to submit them.**",
                        ),
                ],
                components: [],
            });

            const screenshotsMessages = await thread
                .awaitMessages({
                    filter: (m) => m.author.id === user.id,
                    time: time * 2,
                    max: 1,
                })
                .catch(() => null);

            if (!screenshotsMessages) {
                await thread.delete();
                return interaction.followUp({
                    content:
                        "**You took too long to answer, so your application process was terminated!**",
                    ephemeral: true,
                });
            }

            const screenshots: (string | Buffer)[] = [];

            await startMessage.edit({
                embeds: [
                    embed
                        .setTitle(`Screenshot Submission`)
                        .setDescription(
                            "**Please wait while we process your screenshots...**",
                        ),
                ],
            });

            const screenshotsMessage = screenshotsMessages.first();

            if (!screenshotsMessage) return;

            for (const attachment of screenshotsMessage.attachments.values()) {
                screenshots.push(await util.imageToBuffer(attachment.url));
            }

            if (
                screenshotsMessage.content.includes("http") ||
                screenshotsMessage.content.includes("www")
            ) {
                if (screenshotsMessage.content.includes(",")) {
                    screenshots.push(...screenshotsMessage.content.split(","));
                } else {
                    screenshots.push(...screenshotsMessage.content.split(" "));
                }
            }

            await screenshotsMessage.delete();

            screenshotsMessage.content = `*Screenshot Submission*\n\n**${screenshotsMessage.content}**`;

            messages.set(screenshotsMessage.id, screenshotsMessage);

            questions.push({
                question: "Do you have any screenshots?",
                answer: screenshots,
            });
        }

        await startMessage.edit({
            embeds: [
                embed
                    .setTitle("Do you have any questions?")
                    .setDescription(null),
            ],
            components: [yesNoButtons],
        });

        const questionMessage = await startMessage
            .awaitMessageComponent({
                componentType: ComponentType.Button,

                filter: (i) => i.user.id === user.id,
                time,
            })
            .catch(() => null);

        if (!questionMessage) {
            await thread.delete();
            return interaction.followUp({
                content:
                    "**You took too long to answer, so your application process was terminated!**",
                ephemeral: true,
            });
        }

        const qMsg = questionMessage.customId;

        if (qMsg === "yes") {
            await questionMessage.deferUpdate();

            await startMessage.edit({
                embeds: [
                    embed
                        .setTitle("Ask your questions here!")
                        .setDescription(
                            "**You have *2 minutes* to ask them.**",
                        ),
                ],
                components: [],
            });

            const additionalQuestions = await thread
                .awaitMessages({
                    filter: (m) => m.author.id === user.id,
                    time: time * 2,
                    max: 1,
                })
                .catch(() => null);

            if (!additionalQuestions) {
                await thread.delete();
                return interaction.followUp({
                    content:
                        "**You took too long to answer, so your application process was terminated!**",
                    ephemeral: true,
                });
            }

            const questionsAnswer = additionalQuestions.first();

            if (!questionsAnswer) return;

            await questionsAnswer.delete();

            questions.push({
                question: "Do you have any questions?",
                answer: questionsAnswer.content,
            });

            questionsAnswer.content = `*Do you have any questions?*\n\n**${questionsAnswer.content}**`;

            messages.set(questionsAnswer.id, questionsAnswer);
        }

        const transcriptBuffer = await generateFromMessages(
            messages,
            thread as AnyThreadChannel,
            {
                poweredBy: false,
                returnType: ExportReturnType.Buffer,
            },
        );

        const sendItButtons = util
            .row()
            .setComponents(
                util
                    .button()
                    .setCustomId("send_transcript")
                    .setLabel("Send the Transcript to my DMs")
                    .setStyle(ButtonStyle.Success),
            );

        await startMessage.edit({
            embeds: [
                embed
                    .setTitle("Application Submitted!")
                    .setDescription(
                        "Your application has been submitted! Please wait for a staff member to review it.\n\n***Above is a transcript of your application (in HTML format).***\n\n**This thread will close automatically in 5 minutes.**",
                    )
                    .setFooter({
                        text: "You can click the button below to send the transcript to your DMs. (Recommended)",
                    }),
            ],
            components: [sendItButtons],
            files: [
                {
                    name: `${applicationId}-transcript.html`,
                    attachment: transcriptBuffer,
                },
            ],
        });

        const sendItButton = startMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter: (i) => i.user.id === user.id,
        });

        sendItButton.on("collect", async (i) => {
            if (i.customId === "send_transcript") {
                await i.deferUpdate();

                const sentTranscript = await user
                    .send({
                        content: `**Here is your transcript from your FrontierCraft Application!**`,
                        files: [
                            {
                                name: `frontiercraft-application-transcript.html`,
                                attachment: transcriptBuffer,
                            },
                        ],
                    })
                    .catch(() => null);

                if (!sentTranscript) {
                    i.followUp({
                        content:
                            "**I couldn't send the transcript to your DMs!**\n\n***Make sure you have your DMs open, you can click the button again***",
                        ephemeral: true,
                    });
                    return;
                }

                i.followUp({
                    content: "**I've sent the transcript to your DMs!**",
                    ephemeral: true,
                });

                const disabledButtons = util
                    .row()
                    .setComponents(
                        util
                            .button()
                            .setCustomId("send_transcript")
                            .setLabel("Send the Transcript to my DMs")
                            .setStyle(ButtonStyle.Success)
                            .setDisabled(true),
                    );

                await startMessage.edit({
                    components: [disabledButtons],
                });

                setTimeout(() => {
                    startMessage.edit({
                        components: [sendItButtons],
                    });
                }, 10000);
            }
        });

        setTimeout(() => {
            thread.delete();
            sendItButton.stop();
        }, 300000);

        const embedRecruiting = util
            .embed()
            .setAuthor({
                name: user.username,
                iconURL: user.displayAvatarURL(),
            })
            .setTitle(`New Application`)
            .setFooter({ text: `User ID: ${user.id}` });

        const topRow = util
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
                util
                    .button()
                    .setCustomId("undecided_application")
                    .setLabel("Undecided")
                    .setEmoji("❔")
                    .setStyle(ButtonStyle.Secondary),
            );

        const bottomRow = util
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
            );

        await recruitingChannel.send({
            embeds: [embedRecruiting],
            components: [topRow, bottomRow],
        });

        await new Application({
            id: applicationId,
            userId: user.id,
            username: user.username,
            mcUsername: usernameAnswer,
            iconURL: user.displayAvatarURL()
                ? user.displayAvatarURL()
                : user.defaultAvatarURL,
            status: "pending",
            questions,
            transcript: transcriptBuffer,
            createdAt: Date.now(),
        }).save();
    }
}

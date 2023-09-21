import { Container } from "@sapphire/pieces";
import Util from ".";

import {
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    ComponentType,
    Message,
} from "discord.js";

export default class UtilPagination {
    private readonly container: Container;
    private readonly util: Util;

    constructor(container: Container, util: Util) {
        this.container = container;
        this.util = util;
    }

    async default(
        interaction: ButtonInteraction | ChatInputCommandInteraction,
        contents: string[] | string[][],
        title?: string,
        ephemeral = false,
        timeout = 12000
    ) {
        let page = 0;

        const buttons = [
            this.util
                .button()
                .setCustomId("previous_page")
                .setEmoji("⬅️")
                .setStyle(ButtonStyle.Secondary),
            this.util
                .button()
                .setCustomId("next_page")
                .setEmoji("➡️")
                .setStyle(ButtonStyle.Secondary),
        ];

        const row = this.util.row().addComponents(buttons);

        const embeds = contents.map((content, index) => {
            const embed = this.util.embed();
            if (typeof content == "object") {
                embed.setDescription(content.join("\n"));
            } else {
                embed.setDescription(content);
            }

            embed.setFooter({
                text: `Page ${index + 1} of ${contents.length}`,
            });
            if (title) embed.setTitle(title);

            return embed;
        });

        if (!interaction.deferred) await interaction.deferReply({ ephemeral });

        const message = await interaction.editReply({
            embeds: [embeds[page]],
            components: embeds.length < 2 ? [] : [row],
        });

        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter: (i) =>
                i.customId === "previous_page" || i.customId === "next_page",
            time: timeout,
        });

        collector
            .on("collect", async (i) => {
                switch (i.customId) {
                    case "previous_page":
                        page = page > 0 ? --page : embeds.length - 1;
                        break;
                    case "next_page":
                        page = page + 1 < embeds.length ? ++page : 0;
                        break;
                    default:
                        break;
                }

                await i.deferUpdate();
                await i.editReply({
                    embeds: [embeds[page]],
                    components: [row],
                });

                collector.resetTimer();
            })
            .on("end", (_, reason) => {
                if (
                    reason !== "messageDelete" &&
                    !ephemeral &&
                    embeds.length < 2
                ) {
                    const disabledRow = this.util
                        .row()
                        .addComponents(
                            buttons[0].setDisabled(true),
                            buttons[1].setDisabled(true)
                        );

                    message.edit({
                        embeds: [embeds[page]],
                        components: embeds.length < 2 ? [] : [disabledRow],
                    });
                }
            });
    }

    async message(
        message: Message,
        contents: string[] | string[][],
        title?: string,
        timeout = 12000
    ) {
        let page = 0;

        const buttons = [
            this.util
                .button()
                .setCustomId("previous_page")
                .setEmoji("⬅️")
                .setStyle(ButtonStyle.Secondary),
            this.util
                .button()
                .setCustomId("next_page")
                .setEmoji("➡️")
                .setStyle(ButtonStyle.Secondary),
        ];

        const row = this.util.row().addComponents(buttons);

        const embeds = contents.map((content, index) => {
            const embed = this.util.embed();
            if (typeof content == "object") {
                embed.setDescription(content.join("\n"));
            } else {
                embed.setDescription(content);
            }

            embed.setFooter({
                text: `Page ${index + 1} of ${contents.length}`,
            });
            if (title) embed.setTitle(title);

            return embed;
        });

        const msg = await message.reply({
            embeds: [embeds[page]],
            components: embeds.length < 2 ? [] : [row],
        });

        const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter: (i) =>
                i.customId === "previous_page" || i.customId === "next_page",
            time: timeout,
        });

        collector
            .on("collect", async (i) => {
                switch (i.customId) {
                    case "previous_page":
                        page = page > 0 ? --page : embeds.length - 1;
                        break;
                    case "next_page":
                        page = page + 1 < embeds.length ? ++page : 0;
                        break;
                    default:
                        break;
                }

                await i.deferUpdate();
                await i.editReply({
                    embeds: [embeds[page]],
                    components: [row],
                });

                collector.resetTimer();
            })
            .on("end", (_, reason) => {
                if (reason !== "messageDelete" && embeds.length < 2) {
                    const disabledRow = this.util
                        .row()
                        .addComponents(
                            buttons[0].setDisabled(true),
                            buttons[1].setDisabled(true)
                        );

                    message.edit({
                        embeds: [embeds[page]],
                        components: embeds.length < 2 ? [] : [disabledRow],
                    });
                }
            });
    }

    async messageWithoutEmbed(
        message: Message,
        contents: string[] | string[][],
        title?: string,
        timeout = 12000
    ) {
        let page = 0;

        const buttons = [
            this.util
                .button()
                .setCustomId("previous_page")
                .setEmoji("⬅️")
                .setStyle(ButtonStyle.Secondary),
            this.util
                .button()
                .setCustomId("next_page")
                .setEmoji("➡️")
                .setStyle(ButtonStyle.Secondary),
        ];

        const row = this.util.row().addComponents(buttons);

        const fixedContents = contents.map((content) => {
            let newContent =
                typeof content === "object" ? content.join("\n") : content;

            if (title) newContent = `${title}\n${newContent}`;

            newContent = newContent.concat(
                `\n\n**Page ${page + 1} / ${contents.length}**`
            );

            return newContent;
        });

        const msg = await message.reply({
            content: fixedContents[page],
            components: fixedContents.length < 2 ? [] : [row],
        });

        const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter: (i) =>
                i.customId === "previous_page" || i.customId === "next_page",
            time: timeout,
        });

        collector
            .on("collect", async (i) => {
                switch (i.customId) {
                    case "previous_page":
                        page = page > 0 ? --page : fixedContents.length - 1;
                        break;
                    case "next_page":
                        page = page + 1 < fixedContents.length ? ++page : 0;
                        break;
                    default:
                        break;
                }

                await i.deferUpdate();
                await i.editReply({
                    content: fixedContents[page],
                    components: [row],
                });

                collector.resetTimer();
            })
            .on("end", (_, reason) => {
                if (reason !== "messageDelete" && fixedContents.length < 2) {
                    const disabledRow = this.util
                        .row()
                        .addComponents(
                            buttons[0].setDisabled(true),
                            buttons[1].setDisabled(true)
                        );

                    message.edit({
                        content: fixedContents[page],
                        components:
                            fixedContents.length < 2 ? [] : [disabledRow],
                    });
                }
            });
    }
}

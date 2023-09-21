import { Listener } from "@sapphire/framework";
import { ButtonStyle } from "discord-api-types/v10";
import { TextChannel } from "discord.js";

export class ReadyListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            once: true,
            name: "clientReady",
            event: "ready",
        });
    }

    async run() {
        const { container } = this;

        const { client, logger, util } = container;

        try {
            const removedCommands = await util.removeNonexistentCommands();
            removedCommands.forEach((command) =>
                logger.info(
                    `Removed command ${command}, since it no longer exists`,
                ),
            );

            logger.info(`Ready! Logged in as ${client.user?.tag}`);

            const smpServer = await client.guilds.fetch("637891096650842113");

            container.smpServer = smpServer;
            container.recruitingChannel = (await smpServer.channels.fetch(
                "704133440731217981",
            )) as TextChannel;

            /*const channel = (await smpServer.channels.fetch(
                "1071586418981347328",
            )) as TextChannel;

            console.log(channel);

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
            });*/

            container.initialized = true;
        } catch (err) {
            logger.error(err);
        }
    }
}

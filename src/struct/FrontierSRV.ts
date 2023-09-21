import "@sapphire/plugin-logger/register";

import { container, LogLevel, SapphireClient } from "@sapphire/framework";
import { Partials } from "discord.js";

import logs from "discord-logs";
import Database from "./database";
import FrontierUtil from "./util";
import { ApolloClient, InMemoryCache } from "@apollo/client";
import { loadDevMessages, loadErrorMessages } from "@apollo/client/dev";

const { GQL_URL } = process.env;

export default class FrontierSRV extends SapphireClient {
    constructor() {
        super({
            intents: [
                "GuildBans",
                "GuildInvites",
                "Guilds",
                "GuildEmojisAndStickers",
                "GuildMessageReactions",
                "GuildMembers",
                "GuildMessages",
                "GuildVoiceStates",
                "GuildPresences",
                "GuildIntegrations",
                "MessageContent",
                "DirectMessages",
            ],
            partials: [Partials.Channel, Partials.Message, Partials.User],
            loadMessageCommandListeners: true,
            loadDefaultErrorListeners: true,
            logger: {
                level:
                    process.env.NODE_ENV === "development"
                        ? LogLevel.Debug
                        : LogLevel.Info,
            },
        });

        logs(this, {
            debug: process.env.NODE_ENV === "development",
        });

        if (process.env.NODE_ENV === "development") {
            loadDevMessages();
            loadErrorMessages();
        }

        container.initialized = false;

        container.staff = [
            "401269337924829186",
            "625548080305012737",
            "211189672863465482",
            "236660034375778304",
        ];

        container.recruiters = [
            "401269337924829186",
            "625548080305012737",
            "211189672863465482",
            "236660034375778304",
        ];

        container.database = new Database(container);
        container.ac = new ApolloClient({
            uri: GQL_URL,
            cache: new InMemoryCache(),
        });

        container.util = new FrontierUtil(container);
    }

    override async login(token?: string) {
        const { database, client, rcon, logger } = container;

        try {
            await database.connect();
        } catch (err) {
            logger.error(err);
            await super.destroy();
            logger.error("Failed to connect to the database, shutting down");
            return "";
        }

        client.setMaxListeners(0);
        return super.login(token);
    }

    override async destroy() {
        const { database } = container;

        await database.disconnect();
        return super.destroy();
    }
}

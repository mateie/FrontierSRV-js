import { Container } from "@sapphire/pieces";
import {
    Collection,
    Guild as DiscordGuild,
    InviteGuild,
    OAuth2Guild,
} from "discord.js";

import Guild, { GuildDocument } from "#schemas/Guild";

export default class DatabaseGuilds {
    readonly cache: Collection<string, GuildDocument>;
    private readonly container: Container;

    constructor(container: Container) {
        this.container = container;
        this.cache = new Collection();
    }

    async create(guild: DiscordGuild | OAuth2Guild | InviteGuild) {
        const { logger } = this.container;

        logger.info(
            `Guild added to the database (ID: ${guild.id} - Name: ${guild.name})`
        );

        const doc = await Guild.create({ id: guild.id, name: guild.name });

        if (!this.cache.has(guild.id)) this.cache.set(guild.id, doc);

        return doc;
    }

    async fetch(guild: DiscordGuild | OAuth2Guild | InviteGuild) {
        let doc = await Guild.findOne({ id: guild.id });
        if (!doc) doc = await this.create(guild);

        if (!this.cache.has(guild.id)) this.cache.set(guild.id, doc);
        
        return doc;
    }

    fetchAll = () => Guild.find();
}

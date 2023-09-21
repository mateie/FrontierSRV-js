import { Container } from "@sapphire/pieces";
import { Collection, User as DiscordUser } from "discord.js";

import User, { UserDocument } from "#schemas/User";

export default class DatabaseUsers {
    readonly cache: Collection<string, UserDocument>;
    private readonly container: Container;

    constructor(container: Container) {
        this.container = container;
        this.cache = new Collection();
    }

    async create(user: DiscordUser) {
        const { logger } = this.container;

        logger.info(
            `User added to the Database (ID: ${user.id} - Name: ${user.username})`,
        );

        const doc = await User.create({ id: user.id, username: user.username });

        if (!this.cache.has(user.id)) this.cache.set(user.id, doc);

        return doc;
    }

    async fetch(user: DiscordUser) {
        const doc = await User.findOne({ id: user.id });
        if (!doc) return this.create(user);

        if (!this.cache.has(user.id)) this.cache.set(user.id, doc);

        return doc;
    }

    fetchAll = () => User.find();
}

import { Container } from "@sapphire/pieces";
import {
    Collection,
    Guild as DiscordGuild,
    User as DiscordUser,
} from "discord.js";

import Application, { ApplicationDocument } from "#schemas/Application";
import { ApplicationQuestions, ApplicationStatus } from "../../@types";

export default class DatabaseApplications {
    readonly cache: Collection<string, ApplicationDocument>;
    private readonly container: Container;

    constructor(container: Container) {
        this.container = container;
        this.cache = new Collection();
    }

    async create(
        user: DiscordUser,
        guild: DiscordGuild,
        questions: ApplicationQuestions,
    ) {
        const { logger } = this.container;

        logger.debug(
            `Application added to the Database (ID: ${user.id} - Name: ${user.username})`,
        );

        const id = `${user.username.substring(0, 4)}-${user.id.substring(
            0,
            4,
        )}`;

        const doc = await Application.create({
            id,
            userId: user.id,
            guildId: guild.id,
            questions,
            status: "pending",
            createdAt: Date.now(),
        });

        if (!this.cache.has(user.id)) this.cache.set(user.id, doc);

        return doc;
    }

    async fetch(user: DiscordUser) {
        const { logger } = this.container;

        logger.debug(
            `Application fetched from the Database (ID: ${user.id} - Name: ${user.username})`,
        );

        if (this.cache.has(user.id)) return this.cache.get(user.id);

        const doc = await Application.findOne({ userId: user.id });

        if (doc) this.cache.set(user.id, doc);

        return doc;
    }

    async fetchAll(guild: DiscordGuild) {
        const { logger } = this.container;

        logger.debug(
            `Applications fetched from the Database (Guild: ${guild.id} - Name: ${guild.name})`,
        );

        return Application.find({ guildId: guild.id });
    }

    async fetchAllPending(guild: DiscordGuild) {
        const { logger } = this.container;

        logger.debug(
            `Applications fetched from the Database (Guild: ${guild.id} - Name: ${guild.name})`,
        );

        return Application.find({ guildId: guild.id, status: "pending" });
    }

    async fetchAllAccepted(guild: DiscordGuild) {
        const { logger } = this.container;

        logger.debug(
            `Applications fetched from the Database (Guild: ${guild.id} - Name: ${guild.name})`,
        );

        return Application.find({ guildId: guild.id, status: "accepted" });
    }

    async fetchAllDenied(guild: DiscordGuild) {
        const { logger } = this.container;

        logger.debug(
            `Applications fetched from the Database (Guild: ${guild.id} - Name: ${guild.name})`,
        );

        return Application.find({ guildId: guild.id, status: "denied" });
    }

    async setStatus(user: DiscordUser, status: ApplicationStatus) {
        const { logger } = this.container;

        logger.debug(
            `Application status updated in the Database (ID: ${user.id} - Name: ${user.username})`,
        );

        const doc = await this.fetch(user);

        if (!doc) return;

        doc.status = status;

        await doc.save();

        return doc;
    }
}

import mongoose from "mongoose";
import { Container } from "@sapphire/pieces";

import DatabaseGuilds from "./Guilds";
import DatabaseTickets from "./Tickets";
import DatabaseUsers from "./Users";
import DatabaseApplications from "#struct/database/Applications";

const { DB } = process.env;

export default class Database {
    readonly connection: typeof mongoose;
    
    readonly applications: DatabaseApplications;
    readonly guilds: DatabaseGuilds;
    readonly tickets: DatabaseTickets;
    readonly users: DatabaseUsers;
    private readonly container: Container;

    constructor(container: Container) {
        this.container = container;
        this.connection = mongoose;

        this.applications = new DatabaseApplications(this.container);
        this.guilds = new DatabaseGuilds(this.container);
        this.tickets = new DatabaseTickets();
        this.users = new DatabaseUsers(this.container);
    }

    connect = () =>
        this.connection
            .connect(DB ?? "")
            .then(() => this.container.logger.info("Connected to the database"))
            .catch((err) => {
                throw err;
            });
    disconnect = () =>
        this.connection
            .disconnect()
            .then(() =>
                this.container.logger.info("Disconnected from the database"),
            )
            .catch(this.container.logger.error);
}

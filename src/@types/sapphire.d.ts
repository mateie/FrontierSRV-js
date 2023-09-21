import { FrontierSRV } from "#struct/FrontierSRV";
import { Guild, TextChannel } from "discord.js";
import FrontierUtil from "#struct/util";
import Database from "#struct/database";
import Systems from "#struct/systems";
import { Rcon } from "rcon-client";
import { GraphQLClient } from "graphql-request";
import { ApolloClient } from "@apollo/client";

declare module "@sapphire/pieces" {
    interface Container {
        initialized: boolean;

        staff: string[];
        recruiters: string[];

        client: FrontierSRV;

        smpServer: Guild;
        publicServer: Guild;
        staffServer: Guild;

        recruitingChannel: TextChannel;

        database: Database;
        ac: ApolloClient;
        rcon: Rcon;
        systems: Systems;

        util: FrontierUtil;

        botLogs: TextChannel | null;
    }
}

declare module "@sapphire/framework" {
    interface Preconditions {
        StaffOnly: never;
        BetaTesterOnly: never;
    }
}

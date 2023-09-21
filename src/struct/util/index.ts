import { Container } from "@sapphire/pieces";
import _ from "lodash";
import axios from "axios";
import {
    ActionRowBuilder,
    ApplicationCommandType,
    AttachmentBuilder,
    BufferResolvable,
    ButtonBuilder,
    ChannelSelectMenuBuilder,
    EmbedBuilder,
    MentionableSelectMenuBuilder,
    MessageActionRowComponentBuilder,
    ModalActionRowComponentBuilder,
    ModalBuilder,
    PermissionResolvable,
    PermissionsBitField,
    RoleSelectMenuBuilder,
    StringSelectMenuBuilder,
    TextInputBuilder,
    UserSelectMenuBuilder,
} from "discord.js";
import { Stream } from "stream";
import moment from "moment";

import { v4 as uuidv4 } from "uuid";

import Nekos from "nekos.life";

import { CDN } from "@discordjs/rest";

import UtilPagination from "./Pagination";

export default class FrontierUtil {
    readonly pagination: UtilPagination;
    readonly nekos: Nekos;
    readonly cdn: CDN;
    readonly _: typeof _;
    private readonly container: Container;

    constructor(container: Container) {
        this.container = container;

        this.pagination = new UtilPagination(this.container, this);
        this.nekos = new Nekos();
        this.cdn = new CDN();
        this._ = _;
    }

    abbrev(num: any) {
        if (!num || isNaN(num)) return 0;
        if (typeof num === "string") num = parseInt(num);
        const decPlaces = Math.pow(10, 1);
        const abbrev = ["K", "M", "B", "T"];
        for (let i = abbrev.length - 1; i >= 0; i--) {
            const size = Math.pow(10, (i + 1) * 3);
            if (size <= num) {
                num = Math.round((num * decPlaces) / size) / decPlaces;
                if (num === 1000 && i < abbrev.length - 1) {
                    num = 1;
                    i++;
                }
                num += abbrev[i];
                break;
            }
        }
        return num;
    }

    permToBit(permissions?: PermissionResolvable) {
        if (!permissions) return undefined;

        return PermissionsBitField.Flags[
            permissions as keyof typeof PermissionsBitField.Flags
        ];
    }

    async clearCommands() {
        const { client, logger } = this.container;

        await client.application?.commands.set([]);

        logger.info("Cleared all commands");
    }

    containsURL(url: string) {
        const urlPattern = new RegExp(
            "([a-zA-Z0-9]+://)?([a-zA-Z0-9_]+:[a-zA-Z0-9_]+@)?([a-zA-Z0-9.-]+\\.[A-Za-z]{2,4})(:[0-9]+)?(/.*)?",
        );

        return urlPattern.test(url);
    }

    extractURL(url: string) {
        const urlPattern = new RegExp(
            "([a-zA-Z0-9]+://)?([a-zA-Z0-9_]+:[a-zA-Z0-9_]+@)?([a-zA-Z0-9.-]+\\.[A-Za-z]{2,4})(:[0-9]+)?(/.*)?",
        );

        return url.match(urlPattern)?.[0].split(" ")[0];
    }

    daysToSecs = (days: number) => days * 24 * 60 * 60;

    row = (): ActionRowBuilder<MessageActionRowComponentBuilder> =>
        new ActionRowBuilder<MessageActionRowComponentBuilder>();

    modalRow = (): ActionRowBuilder<ModalActionRowComponentBuilder> =>
        new ActionRowBuilder<ModalActionRowComponentBuilder>();

    button = () => new ButtonBuilder();

    stringMenu = () => new StringSelectMenuBuilder();

    roleMenu = () => new RoleSelectMenuBuilder();

    mentionableMenu = () => new MentionableSelectMenuBuilder();

    channelMenu = () => new ChannelSelectMenuBuilder();

    userMenu = () => new UserSelectMenuBuilder();

    modal = () => new ModalBuilder();

    unknownModal = () =>
        new ModalBuilder()
            .setCustomId("unknown_modal")
            .setTitle("Something went wrong, please try again");

    input = () => new TextInputBuilder();

    randomElement = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

    durationMs = (dur: string) =>
        dur
            .split(":")
            .map(Number)
            .reduce((acc, curr) => curr + acc * 60) * 1000;

    msToDur = (ms: number) => moment(ms).format("h:mm:ss");

    formatNumber = (number: any, minFractionDigits = 0) =>
        Number.parseFloat(number).toLocaleString(undefined, {
            minimumFractionDigits: minFractionDigits,
            maximumFractionDigits: 2,
        });

    calcPercentage = (num: any) => num * 100;

    embed = () => new EmbedBuilder().setTimestamp(new Date());

    convertToPercentage = (num: number) => Math.floor(num * 100);

    attachment = (file: BufferResolvable | Stream, name?: string) =>
        new AttachmentBuilder(file, { name });

    embedURL = (title: string, url: string, display?: string) =>
        `[${title}](${url.replace(/\)/g, "%29")}${
            display ? ` "${display}"` : ""
        })`;

    capFirstLetter = (str: string) =>
        str.charAt(0).toUpperCase() + str.slice(1);

    imageToBuffer = async (url: string) =>
        (
            await axios.get(url, {
                responseType: "arraybuffer",
            })
        ).data;

    async removeNonexistentCommands(): Promise<string[]> {
        const { client } = this.container;
        const commands = await client.application?.commands.fetch();
        const deletedCommands: string[] = [];
        if (!commands) return deletedCommands;
        const commandStore = this.container.stores.get("commands");
        commands.forEach((command) => {
            if (
                command.type === ApplicationCommandType.Message ||
                command.type === ApplicationCommandType.User
            )
                return;
            if (!commandStore.has(command.name)) {
                command.delete();
                deletedCommands.push(
                    `${command.name} (${command.type.toString()}))`,
                );
            }
        });

        return deletedCommands;
    }

    chunk(arr: any, size: number) {
        const temp = [];
        for (let i = 0; i < arr.length; i += size) {
            temp.push(arr.slice(i, i + size));
        }

        return temp;
    }

    list(arr: string[], conj = "and") {
        const len = arr.length;
        if (len === 0) return "";
        if (len === 1) return arr[0];
        return `${arr.slice(0, -1).join(", ")}${
            len > 1 ? `${len > 2 ? "," : ""} ${conj} ` : ""
        }${arr.slice(-1)}`;
    }

    capEachFirstLetter = (str: string, separator = " ") =>
        str.split(separator).map(this.capFirstLetter).join(separator);

    conjuction = (arr: string[], conj = "and") => {
        const len = arr.length;
        if (len === 0) return "";
        if (len === 1) return arr[0];
        return `${arr.slice(0, -1).join(", ")}${
            len > 1 ? `${len > 2 ? "," : ""} ${conj} ` : ""
        }${arr.slice(-1)}`;
    };

    shorten = (text: string, maxLen = 200) =>
        text.length > maxLen ? `${text.substring(0, maxLen - 3)}...` : text;

    uuid = () => uuidv4();
}

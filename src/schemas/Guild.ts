import { model, Schema } from "mongoose";

export interface IGuild {
    id: string;
    name: string;
    autorole: string[];
    applications: {
        id: string;
        name: string;
        description: string;
        questions: string[];
        type: string;
        createdBy: string;
    }[];
    polls: {
        messageId: string;
        channelId: string;
        buttons?: {
            customId: string;
            text: string;
            index: number;
            votes: {
                userId: string;
                votedAt: number;
            }[];
        }[];
        emojis?: {
            text: string;
            index: number;
        }[];
        type: "buttons" | "emojis";
        duration: number | null;
    }[];
    channels: {
        recruiting: string;
    };
    questions: string[];
    logs: {
        channel: string;
        types: {
            memberWarned: boolean;
            memberReported: boolean;
            memberJoin: boolean;
            memberLeave: boolean;
            memberBoost: boolean;
            memberUnboost: boolean;
            memberRoleAdded: boolean;
            memberRoleRemoved: boolean;
            memberNicknameChange: boolean;
            messageDeleted: boolean;
            messageEdited: boolean;
        };
    };
    tickets: {
        category: string;
        message: string;
        channels: {
            openTicket: string;
            transcripts: string;
        };
        buttons: string[];
    };
    selfRoles: {
        channelId: string;
        messages: {
            id: string;
            buttons: {
                id: string;
                name: string;
                roleId: string;
                emoji?: string | null;
                style: number;
            }[];
        }[];
    }[];
    filters: {
        message: {
            enabled: boolean;
        };
        media: {
            enabled: boolean;
        };
    };
}

export const Guild = new Schema<IGuild>({
    id: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    applications: [],
    autorole: [],
    polls: [],
    channels: {
        recruiting: String,
    },
    questions: [],
    logs: {
        channel: String,
        types: {
            memberWarned: Boolean,
            memberReported: Boolean,
            memberJoin: Boolean,
            memberLeave: Boolean,
            memberBoost: Boolean,
            memberUnboost: Boolean,
            memberRoleAdded: Boolean,
            memberRoleRemoved: Boolean,
            memberNicknameChange: Boolean,
            messageDeleted: Boolean,
            messageEdited: Boolean,
        },
    },
    tickets: {
        category: String,
        message: String,
        channels: {
            openTicket: String,
            transcripts: String,
        },
        buttons: [],
    },
    selfRoles: [
        {
            channelId: String,
            messages: [
                {
                    id: String,
                    buttons: [
                        {
                            id: String,
                            name: String,
                            roleId: String,
                            emoji: String,
                            style: Number,
                        },
                    ],
                },
            ],
        },
    ],
    filters: {
        message: {
            enabled: Boolean,
        },
        media: {
            enabled: Boolean,
        },
    },
});

const GuildModel = model<IGuild>("guilds", Guild);

export type GuildDocument = ReturnType<(typeof GuildModel)["hydrate"]>;

export default GuildModel;

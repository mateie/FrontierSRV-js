import { model, Schema } from "mongoose";
import { ApplicationQuestions, ApplicationStatus } from "../@types";

export interface IApplication {
    id: string;
    userId: string;
    username: string;
    mcUsername: string;
    mcPlatform: String;
    iconURL: string;
    guildId: string;
    questions: ApplicationQuestions;
    transcript: Buffer;
    status: ApplicationStatus;
    createdAt: number;
    deniedReason?: string;
    deniedBy?: string;
    deniedAt?: number;
    approvedBy?: string;
    approvedAt?: number;
    undecidedBy?: string;
    undecidedAt?: number;
    undecidedReason?: string;
}

const schema = new Schema<IApplication>({
    id: { type: String, required: true },
    userId: { type: String, required: true },
    username: { type: String, required: true },
    mcUsername: { type: String, required: true },
    mcPlatform: { type: String, required: true },
    iconURL: { type: String, required: true },
    questions: [],
    transcript: { type: Buffer, required: true },
    status: { type: String, required: true },
    createdAt: { type: Number, required: true },
    deniedReason: { type: String, required: false },
    deniedBy: { type: String, required: false },
    deniedAt: { type: Number, required: false },
    approvedBy: { type: String, required: false },
    approvedAt: { type: Number, required: false },
    undecidedBy: { type: String, required: false },
    undecidedAt: { type: Number, required: false },
    undecidedReason: { type: String, required: false },
});

const ApplicationModel = model<IApplication>("Application", schema);

export type ApplicationDocument = ReturnType<
    (typeof ApplicationModel)["hydrate"]
>;

export default ApplicationModel;

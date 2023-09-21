import { model, Schema } from "mongoose";

export interface ITicket {
    guildId: string;
    memberId: string;
    ticketId: string;
    channelId: string;
    closed: boolean;
    locked: boolean;
    transcript: Buffer;
    type: string;
}

export const Ticket = new Schema<ITicket>({
    guildId: String,
    memberId: String,
    ticketId: String,
    channelId: String,
    closed: Boolean,
    locked: Boolean,
    transcript: Buffer,
    type: String,
});

const TicketModel = model<ITicket>("tickets", Ticket);

export type TicketDocument = ReturnType<(typeof TicketModel)["hydrate"]>;

export default TicketModel;

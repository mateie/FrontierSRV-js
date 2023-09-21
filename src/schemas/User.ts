import { model, Schema } from "mongoose";
import { IReport, IWarn } from "../@types";

export interface IUser {
    id: string;
    username: string;
    betaTester: boolean;
    age: number;
    canSubmitAgainAt?: number | null;
}

export const User = new Schema<IUser>({
    id: {
        type: String,
        required: true,
        unique: true,
    },
    username: {
        type: String,
        required: true,
    },
    betaTester: {
        type: Boolean,
        default: false,
    },
    age: Number,
    canSubmitAgainAt: Number,
});

const UserModel = model<IUser>("users", User);

export type UserDocument = ReturnType<(typeof UserModel)["hydrate"]>;

export default UserModel;

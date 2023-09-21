import { model, Schema } from "mongoose";
import { StaffType } from "../@types";

export interface IStaff {
    id: string;
    description?: string;
    type: StaffType;
}

export const Staff = new Schema<IStaff>({
    id: {
        type: String,
        required: true,
        unique: true,
    },
    description: String,
    type: {
        type: String,
        required: true,
    },
});

const StaffModel = model<IStaff>("staff", Staff);

export type StaffDocument = ReturnType<(typeof StaffModel)["hydrate"]>;

export default StaffModel;

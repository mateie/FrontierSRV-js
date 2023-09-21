export type StaffType =
    | "owner"
    | "system_admin"
    | "developer"
    | "moderator"
    | "trial_moderator";

export type IWarn = {
    id: string;
    guildId: string;
    by: string;
    reason: string;
};

export type IReport = {
    id: string;
    guildId: string;
    by: string;
    message?: { id: string; content: string };
    reason: string;
};

export type ApplicationQuestions = {
    question: string;
    answer: (string | Buffer | number) | (string | Buffer)[];
}[];
export type ApplicationStatus = "pending" | "approved" | "denied" | "undecided";

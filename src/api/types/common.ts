export type NoteDto = {
    id: number;
    content: string;
    authorSteamId: string;
    authorNickname: string | null;
    createdAt: string;
};

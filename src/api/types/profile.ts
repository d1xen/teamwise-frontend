export type UserProfileDto = {
    steamId: string;
    nickname: string;
    avatarUrl: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    birthDate: string | null;
    address: string | null;
    zipCode: string | null;
    city: string | null;
    countryCode: string | null;
    phone: string | null;
    discord: string | null;
    twitter: string | null;
    hltv: string | null;
    customUsername: string | null;
    profileCompleted: boolean;
};

export type UserProfileUpdateDto = Partial<
    Omit<
        UserProfileDto,
        "steamId" | "nickname" | "avatarUrl" | "profileCompleted"
    >
>;


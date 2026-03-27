// ============================================================================
// Enums
// ============================================================================

export type CompetitionType = "LEAGUE" | "TOURNAMENT" | "CUP" | "LAN" | "QUALIFIER" | "OTHER";
export type CompetitionStatus = "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED";
export type CompetitionSource = "MANUAL" | "FACEIT";

// ============================================================================
// Data Transfer Objects
// ============================================================================

export type CompetitionDto = {
    id: number;
    teamId: number;
    name: string;
    type: CompetitionType;
    status: CompetitionStatus;
    startDate: string | null;
    endDate: string | null;
    registrationDate: string | null;
    checkInDate: string | null;
    stage: string | null;
    format: string | null;
    cashprize: string | null;
    url: string | null;
    logoUrl: string | null;
    notes: string | null;
    source: CompetitionSource;
    faceitCompetitionId: string | null;
    season: string | null;
    region: string | null;
    division: string | null;
    organizerId: string | null;
    organizerName: string | null;
    category: string | null;
    matchRecord: { wins: number; losses: number; draws: number } | null;
    createdByNickname: string | null;
    updatedByNickname: string | null;
    createdAt: string | null;
    updatedAt: string | null;
};

export type CompetitionSummaryDto = {
    id: number;
    name: string;
    type: CompetitionType;
    status: CompetitionStatus;
    stage: string | null;
    startDate: string | null;
    endDate: string | null;
    source: CompetitionSource;
    faceitCompetitionId: string | null;
};

// ============================================================================
// Request DTOs
// ============================================================================

export type CreateCompetitionRequest = {
    name: string;
    type: CompetitionType;
    startDate?: string | null;
    endDate?: string | null;
    registrationDate?: string | null;
    checkInDate?: string | null;
    stage?: string | null;
    format?: string | null;
    cashprize?: string | null;
    url?: string | null;
    logoUrl?: string | null;
    notes?: string | null;
};

export type UpdateCompetitionRequest = {
    name?: string;
    type?: CompetitionType;
    status?: CompetitionStatus;
    startDate?: string | null;
    endDate?: string | null;
    registrationDate?: string | null;
    checkInDate?: string | null;
    stage?: string | null;
    format?: string | null;
    cashprize?: string | null;
    url?: string | null;
    logoUrl?: string | null;
    notes?: string | null;
};

// ============================================================================
// UI Types
// ============================================================================

export type CompetitionTab = "active" | "completed" | "all";

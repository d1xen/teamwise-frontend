// ============================================================================
// Enums
// ============================================================================

export type StratSide = "T" | "CT";
export type StratType = "DEFAULT" | "EXECUTE" | "FAKE" | "RUSH" | "CONTACT" | "RETAKE" | "SETUP";
export type StratDifficulty = "EASY" | "MEDIUM" | "HARD";
export type StratStatus = "DRAFT" | "READY" | "IN_PRACTICE" | "DEPRECATED";
export type StratPhaseType = "SETUP" | "MID_ROUND" | "EXECUTE" | "POST_PLANT";
export type UtilityType = "SMOKE" | "FLASH" | "MOLLY" | "HE";

// ============================================================================
// Response DTOs
// ============================================================================

export type StratPhaseDto = {
    id: number;
    phaseType: StratPhaseType;
    orderIndex: number;
    description: string | null;
    playerPositions: string | null;
};

export type StratUtilityDto = {
    id: number;
    utilityType: UtilityType;
    name: string;
    position: string | null;
    target: string | null;
    description: string | null;
    timing: string | null;
    videoUrl: string | null;
    orderIndex: number;
};

import type { NoteDto } from "@/api/types/common";

export type StratDto = {
    id: number;
    teamId: number;
    name: string;
    map: string;
    side: StratSide;
    type: StratType;
    difficulty: StratDifficulty;
    status: StratStatus;
    callName: string | null;
    description: string | null;
    objective: string | null;
    conditions: string | null;
    tags: string[];
    createdBySteamId: string;
    createdByNickname: string | null;
    updatedByNickname: string | null;
    createdAt: string;
    updatedAt: string;
    phases: StratPhaseDto[];
    utilities: StratUtilityDto[];
    notes: NoteDto[];
    favorited: boolean;
};

export type StratSummaryDto = {
    id: number;
    name: string;
    description: string | null;
    map: string;
    side: StratSide;
    type: StratType;
    difficulty: StratDifficulty;
    status: StratStatus;
    callName: string | null;
    tags: string[];
    phaseCount: number;
    utilityCount: number;
    noteCount: number;
    favorited: boolean;
    createdAt: string;
    updatedAt: string;
};

// ============================================================================
// Request DTOs
// ============================================================================

export type CreateStratPhaseRequest = {
    phaseType: StratPhaseType;
    orderIndex: number;
    description?: string | null;
    playerPositions?: string | null;
};

export type CreateStratUtilityRequest = {
    utilityType: UtilityType;
    name: string;
    position?: string | null;
    target?: string | null;
    description?: string | null;
    timing?: string | null;
    videoUrl?: string | null;
    orderIndex: number;
};

export type CreateStratRequest = {
    name: string;
    map: string;
    side: StratSide;
    type: StratType;
    difficulty: StratDifficulty;
    callName?: string | null;
    description?: string | null;
    objective?: string | null;
    conditions?: string | null;
    tags?: string[];
    phases?: CreateStratPhaseRequest[];
    utilities?: CreateStratUtilityRequest[];
};

export type UpdateStratRequest = {
    name?: string;
    map?: string;
    side?: StratSide;
    type?: StratType;
    difficulty?: StratDifficulty;
    status?: StratStatus;
    callName?: string | null;
    description?: string | null;
    objective?: string | null;
    conditions?: string | null;
    tags?: string[];
    phases?: CreateStratPhaseRequest[];
    utilities?: CreateStratUtilityRequest[];
};

export type CreateStratNoteRequest = {
    content: string;
};

// ============================================================================
// Pagination
// ============================================================================

export type PagedStratsDto = {
    content: StratSummaryDto[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
    hasNext: boolean;
    hasPrevious: boolean;
};

// ============================================================================
// Filters (frontend-only)
// ============================================================================

export type StratFilters = {
    map: string;
    side: StratSide | "";
    type: StratType | "";
    status: StratStatus | "";
    difficulty: StratDifficulty | "";
    search: string;
    tag: string;
    favoritesOnly: boolean;
};

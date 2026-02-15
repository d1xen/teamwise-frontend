import { createContext } from "react";
import type { TeamContextType } from "@/contexts/team/team.types.ts";

export const TeamContext = createContext<TeamContextType | undefined>(undefined);


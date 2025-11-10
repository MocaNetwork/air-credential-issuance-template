import { AirService } from "@mocanetwork/airkit";
import { createContext } from "react";

interface AirkitContextType {
  airService: AirService;
  isInitialized: boolean;
  initError: Error | null;
}

export const AirkitContext = createContext<AirkitContextType | null>(null);

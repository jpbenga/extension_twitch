"use client";
import { createContext, useContext } from "react";
export const LegacyToolsContext = createContext(false);
export const useLegacyTools = () => useContext(LegacyToolsContext);

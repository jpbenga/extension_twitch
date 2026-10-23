"use client";
import { createContext, useContext } from "react";
import { useCreator } from "../lib/use-creator";
const Context = createContext<ReturnType<typeof useCreator> | null>(null);
export function CreatorProvider({ children }: { children: React.ReactNode }) {
  const studio = useCreator();
  return <Context.Provider value={studio}>{children}</Context.Provider>;
}
export function useStudio() {
  const value = useContext(Context);
  if (!value) throw new Error("CreatorProvider required");
  return value;
}

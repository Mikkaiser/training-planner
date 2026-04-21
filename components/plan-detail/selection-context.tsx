"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Selection =
  | { id: string }
  | null;

type SelectionContextValue = {
  selection: Selection;
  selectBlock: (id: string) => void;
  clear: () => void;
};

const SelectionContext = createContext<SelectionContextValue | null>(null);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<Selection>(null);

  const selectBlock = useCallback(
    (id: string) => setSelection({ id }),
    []
  );
  const clear = useCallback(() => setSelection(null), []);

  const value = useMemo(
    () => ({ selection, selectBlock, clear }),
    [selection, selectBlock, clear]
  );

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const ctx = useContext(SelectionContext);
  if (!ctx) {
    throw new Error("useSelection must be used within <SelectionProvider>");
  }
  return ctx;
}

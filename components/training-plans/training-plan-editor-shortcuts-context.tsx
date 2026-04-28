"use client";

import * as React from "react";

type SaveInterceptor = () => Promise<boolean> | boolean;

type TrainingPlanEditorShortcutsContextValue = {
  registerSaveInterceptor: (interceptor: SaveInterceptor) => () => void;
  triggerSave: () => Promise<void>;
};

const TrainingPlanEditorShortcutsContext = React.createContext<
  TrainingPlanEditorShortcutsContextValue | null
>(null);

type TrainingPlanEditorShortcutsProviderProps = {
  onSavePlan: () => Promise<void> | void;
  children: React.ReactNode;
};

export function TrainingPlanEditorShortcutsProvider({
  onSavePlan,
  children,
}: TrainingPlanEditorShortcutsProviderProps): React.JSX.Element {
  const interceptorsRef = React.useRef<SaveInterceptor[]>([]);

  const triggerSave = React.useCallback(async () => {
    const interceptors = interceptorsRef.current.slice();
    if (interceptors.length > 0) {
      const topmostInterceptor = interceptors[interceptors.length - 1];
      const shouldContinueToPlanSave = await topmostInterceptor();
      if (shouldContinueToPlanSave) {
        await onSavePlan();
      }
      return;
    }
    await onSavePlan();
  }, [onSavePlan]);

  const registerSaveInterceptor = React.useCallback(
    (interceptor: SaveInterceptor) => {
      interceptorsRef.current.push(interceptor);
      return () => {
        interceptorsRef.current = interceptorsRef.current.filter((item) => item !== interceptor);
      };
    },
    []
  );

  React.useEffect(() => {
    function onWindowKeyDown(event: KeyboardEvent): void {
      const isSaveShortcut =
        (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s";
      if (!isSaveShortcut) return;
      event.preventDefault();
      void triggerSave();
    }

    window.addEventListener("keydown", onWindowKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onWindowKeyDown, true);
    };
  }, [triggerSave]);

  const value = React.useMemo(
    () => ({
      registerSaveInterceptor,
      triggerSave,
    }),
    [registerSaveInterceptor, triggerSave]
  );

  return (
    <TrainingPlanEditorShortcutsContext.Provider value={value}>
      {children}
    </TrainingPlanEditorShortcutsContext.Provider>
  );
}

export function useTrainingPlanEditorShortcuts(): TrainingPlanEditorShortcutsContextValue {
  const context = React.useContext(TrainingPlanEditorShortcutsContext);
  if (!context) {
    throw new Error("useTrainingPlanEditorShortcuts must be used within its provider.");
  }
  return context;
}

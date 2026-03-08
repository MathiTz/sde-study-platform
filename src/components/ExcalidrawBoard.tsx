"use client";

import { useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";

const Excalidraw = dynamic(
  async () => {
    const mod = await import("@excalidraw/excalidraw");
    return mod.Excalidraw;
  },
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center text-muted-foreground">Loading drawing board...</div> }
);

interface ExcalidrawBoardProps {
  onChange?: (sceneData: string) => void;
  initialData?: string;
  fullPage?: boolean;
}

export function ExcalidrawBoard({ onChange, initialData, fullPage }: ExcalidrawBoardProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = useCallback(
    (elements: readonly Record<string, unknown>[]) => {
      if (!onChange) return;
      // Debounce to avoid excessive updates
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        const data = JSON.stringify(
          elements.filter((el) => !el.isDeleted)
        );
        onChange(data);
      }, 500);
    },
    [onChange]
  );

  const parsedInitialData = initialData
    ? (() => {
        try {
          return { elements: JSON.parse(initialData) };
        } catch {
          return undefined;
        }
      })()
    : undefined;

  return (
    <div className={fullPage ? "h-full w-full" : "h-[500px] w-full rounded-lg border border-border overflow-hidden"}>
      <Excalidraw
        onChange={handleChange}
        initialData={parsedInitialData}
        theme="light"
        UIOptions={{
          canvasActions: {
            saveToActiveFile: false,
            loadScene: false,
            export: false,
          },
        }}
      />
    </div>
  );
}

"use client";

import { useState, useCallback, useMemo } from "react";

export interface RequirementsData {
  functional: string[];
  nonFunctional: string[];
  estimation: {
    dau: string;
    readWriteRatio: string;
    avgPayloadKB: string;
  };
}

interface RequirementsEditorProps {
  onChange: (data: RequirementsData) => void;
  initialData?: RequirementsData;
  disabled?: boolean;
}

const DEFAULT_DATA: RequirementsData = {
  functional: [""],
  nonFunctional: [""],
  estimation: {
    dau: "",
    readWriteRatio: "",
    avgPayloadKB: "",
  },
};

export function serializeRequirements(data: RequirementsData): string {
  return JSON.stringify(data);
}

export function deserializeRequirements(raw: string): RequirementsData | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed.functional && parsed.nonFunctional) return parsed;
    return null;
  } catch {
    return null;
  }
}

// ─── Shared list field config ───
type ListField = "functional" | "nonFunctional";

interface ListSectionConfig {
  field: ListField;
  title: string;
  description: string;
  prefix: string;
  placeholder: string;
}

const LIST_SECTIONS: ListSectionConfig[] = [
  {
    field: "functional",
    title: "Functional Requirements",
    description: "What should users/clients be able to do?",
    prefix: "FR",
    placeholder: "Users should be able to...",
  },
  {
    field: "nonFunctional",
    title: "Non-Functional Requirements",
    description: "What quality attributes matter? (availability, latency, consistency, durability, etc.)",
    prefix: "NFR",
    placeholder: "The system should...",
  },
];

const ESTIMATION_FIELDS = [
  { key: "dau" as const, label: "Daily Active Users", placeholder: "e.g. 10000000" },
  { key: "readWriteRatio" as const, label: "Read:Write Ratio", placeholder: "e.g. 100 (100:1)" },
  { key: "avgPayloadKB" as const, label: "Avg Payload (KB)", placeholder: "e.g. 5" },
];

export function RequirementsEditor({
  onChange,
  initialData,
  disabled,
}: RequirementsEditorProps) {
  const resolvedInitial = useMemo(
    () => initialData ?? DEFAULT_DATA,
    [initialData]
  );
  const [data, setData] = useState<RequirementsData>(resolvedInitial);
  const [showEstimation, setShowEstimation] = useState(false);

  const update = useCallback(
    (next: RequirementsData) => {
      setData(next);
      onChange(next);
    },
    [onChange]
  );

  // Generic list operations
  const addItem = (field: ListField) =>
    update({ ...data, [field]: [...data[field], ""] });

  const updateItem = (field: ListField, i: number, value: string) => {
    const next = [...data[field]];
    next[i] = value;
    update({ ...data, [field]: next });
  };

  const removeItem = (field: ListField, i: number) => {
    if (data[field].length <= 1) return;
    update({ ...data, [field]: data[field].filter((_, idx) => idx !== i) });
  };

  const updateEstimation = (field: keyof RequirementsData["estimation"], value: string) => {
    update({ ...data, estimation: { ...data.estimation, [field]: value } });
  };

  // Back-of-envelope calculations
  const dau = parseFloat(data.estimation.dau) || 0;
  const rwRatio = parseFloat(data.estimation.readWriteRatio) || 0;
  const payloadKB = parseFloat(data.estimation.avgPayloadKB) || 0;
  const dailyActions = dau * 10;
  const writeQPS = dailyActions > 0 ? Math.round(dailyActions / 86400) : 0;
  const readQPS = writeQPS * (rwRatio || 1);
  const dailyStorageGB =
    dailyActions > 0 && payloadKB > 0
      ? ((dailyActions * payloadKB) / 1_000_000).toFixed(2)
      : "0";
  const yearlyStorageTB =
    parseFloat(dailyStorageGB) > 0
      ? ((parseFloat(dailyStorageGB) * 365) / 1000).toFixed(2)
      : "0";

  return (
    <div className="space-y-6">
      {LIST_SECTIONS.map((section) => (
        <div key={section.field} className="rounded-lg border border-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">{section.title}</h3>
            <button
              type="button"
              onClick={() => addItem(section.field)}
              disabled={disabled}
              className="rounded border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              + Add
            </button>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            {section.description}
          </p>
          <div className="space-y-2">
            {data[section.field].map((value, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="shrink-0 text-xs text-muted-foreground">
                  {section.prefix}{i + 1}
                </span>
                <input
                  value={value}
                  onChange={(e) => updateItem(section.field, i, e.target.value)}
                  placeholder={section.placeholder}
                  disabled={disabled}
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
                />
                {data[section.field].length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(section.field, i)}
                    disabled={disabled}
                    className="shrink-0 rounded px-1.5 py-1 text-xs text-muted-foreground hover:bg-danger/10 hover:text-danger"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Back-of-Envelope Estimation (Collapsible) */}
      <div className="rounded-lg border border-dashed border-border">
        <button
          type="button"
          onClick={() => setShowEstimation(!showEstimation)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm text-muted-foreground hover:text-foreground"
        >
          <span>📐 Back-of-Envelope Estimation (optional)</span>
          <span>{showEstimation ? "▲" : "▼"}</span>
        </button>
        {showEstimation && (
          <div className="space-y-4 border-t border-dashed border-border px-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              {ESTIMATION_FIELDS.map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    {label}
                  </label>
                  <input
                    value={data.estimation[key]}
                    onChange={(e) => updateEstimation(key, e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              ))}
            </div>

            {dau > 0 && (
              <div className="rounded-md bg-muted/50 px-4 py-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Estimates
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    ["Write QPS", writeQPS.toLocaleString()],
                    ["Read QPS", readQPS.toLocaleString()],
                    ["Daily Storage", `${dailyStorageGB} GB`],
                    ["Yearly Storage", `${yearlyStorageTB} TB`],
                  ].map(([label, value]) => (
                    <div key={label}>
                      {label}: <span className="font-mono font-medium">~{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

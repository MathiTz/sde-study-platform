"use client";

import { useState, useEffect, useRef } from "react";

interface StepTimerProps {
  durationMinutes: number;
}

export function StepTimer({ durationMinutes }: StepTimerProps) {
  const totalSeconds = durationMinutes * 60;
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const remaining = Math.max(0, totalSeconds - elapsed);
  const isOvertime = elapsed > totalSeconds;
  const isWarning = remaining > 0 && remaining <= 60;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const progress = Math.min(100, (elapsed / totalSeconds) * 100);

  return (
    <div className="flex items-center gap-3">
      {/* Progress bar */}
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            isOvertime
              ? "bg-danger"
              : isWarning
                ? "bg-warning"
                : "bg-accent"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Time display */}
      <span
        className={`font-mono text-sm ${
          isOvertime
            ? "font-semibold text-danger"
            : isWarning
              ? "font-semibold text-warning"
              : "text-muted-foreground"
        }`}
      >
        {isOvertime ? (
          <>+{formatTime(elapsed - totalSeconds)} over</>
        ) : (
          <>{formatTime(remaining)} left</>
        )}
      </span>
    </div>
  );
}

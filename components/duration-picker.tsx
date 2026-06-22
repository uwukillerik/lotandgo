"use client";

import { durationToSeconds, formatDurationParts } from "@shared/auction-types";
import { cn } from "@/lib/utils";

export function DurationPicker({
  hours,
  minutes,
  seconds,
  onHoursChange,
  onMinutesChange,
  onSecondsChange,
  className,
}: {
  hours: string;
  minutes: string;
  seconds: string;
  onHoursChange: (v: string) => void;
  onMinutesChange: (v: string) => void;
  onSecondsChange: (v: string) => void;
  className?: string;
}) {
  const total = durationToSeconds(
    parseInt(hours, 10) || 0,
    parseInt(minutes, 10) || 0,
    parseInt(seconds, 10) || 0,
  );

  const fieldClass =
    "input-field h-12 text-center text-lg font-bold tabular-nums";

  return (
    <div className={cn("space-y-2", className)}>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="mb-1 block text-center text-xs font-semibold text-slate-500">
            Часы
          </label>
          <input
            type="number"
            min={0}
            max={168}
            value={hours}
            onChange={(e) => onHoursChange(e.target.value)}
            className={fieldClass}
            inputMode="numeric"
          />
        </div>
        <div>
          <label className="mb-1 block text-center text-xs font-semibold text-slate-500">
            Минуты
          </label>
          <input
            type="number"
            min={0}
            max={59}
            value={minutes}
            onChange={(e) => onMinutesChange(e.target.value)}
            className={fieldClass}
            inputMode="numeric"
          />
        </div>
        <div>
          <label className="mb-1 block text-center text-xs font-semibold text-slate-500">
            Секунды
          </label>
          <input
            type="number"
            min={0}
            max={59}
            value={seconds}
            onChange={(e) => onSecondsChange(e.target.value)}
            className={fieldClass}
            inputMode="numeric"
          />
        </div>
      </div>
      <p className="text-center text-xs text-slate-500">
        {total > 0 ? (
          <>
            Длительность:{" "}
            <span className="font-semibold text-slate-700">
              {formatDurationParts(
                parseInt(hours, 10) || 0,
                parseInt(minutes, 10) || 0,
                parseInt(seconds, 10) || 0,
              )}
            </span>
          </>
        ) : (
          <span className="text-rose-600">Укажите длительность больше 0</span>
        )}
      </p>
    </div>
  );
}

export function computeEndsAtFromDuration(
  start: Date,
  hours: string,
  minutes: string,
  seconds: string,
): Date {
  const total = durationToSeconds(
    parseInt(hours, 10) || 0,
    parseInt(minutes, 10) || 0,
    parseInt(seconds, 10) || 0,
  );
  return new Date(start.getTime() + total * 1000);
}

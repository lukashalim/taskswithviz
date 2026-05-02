"use client";

import {
  computeDaysRemaining,
  type DaysRemaining,
} from "@/lib/tasks/derive";
import type { Task } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

interface DaysRingProps {
  task: Task;
  reference: Date;
}

const SIZE = 44;
const STROKE = 4;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

function ringText(info: DaysRemaining): {
  headline: string;
  sub: string | null;
} {
  if (info.label === "Done") return { headline: "Done", sub: null };
  if (info.label === "-") return { headline: "-", sub: null };
  if (info.label === "Today") return { headline: "Today", sub: null };
  if (info.days !== null && info.days > 0) {
    return { headline: String(info.days), sub: "days left" };
  }
  if (info.days !== null && info.days < 0) {
    return { headline: String(Math.abs(info.days)), sub: "days over" };
  }
  return { headline: "?", sub: null };
}

function toneClasses(tone: DaysRemaining["tone"]) {
  switch (tone) {
    case "success":
      return {
        stroke: "stroke-emerald-500",
        text: "text-emerald-600 dark:text-emerald-400",
      };
    case "warning":
      return {
        stroke: "stroke-amber-500",
        text: "text-amber-600 dark:text-amber-400",
      };
    case "danger":
      return {
        stroke: "stroke-rose-500",
        text: "text-rose-600 dark:text-rose-400",
      };
    default:
      return {
        stroke: "stroke-muted-foreground/40",
        text: "text-muted-foreground",
      };
  }
}

export function DaysRing({ task, reference }: DaysRingProps) {
  const info = computeDaysRemaining(task, reference);
  const { headline, sub } = ringText(info);
  const { stroke, text } = toneClasses(info.tone);
  const dash = info.tone === "muted" ? `${C * 0.15} ${C * 0.1}` : undefined;
  const offset = C * (1 - info.progress);

  return (
    <div
      className="relative shrink-0"
      style={{ width: SIZE, height: SIZE }}
      title={info.label}
      role="img"
      aria-label={info.label}
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-muted-foreground/25"
          strokeDasharray={dash}
        />
        {info.tone !== "muted" ? (
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap="round"
            className={cn("transition-[stroke-dashoffset] duration-300", stroke)}
            strokeDasharray={C}
            strokeDashoffset={offset}
          />
        ) : null}
      </svg>
      <div
        className={cn(
          "pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center leading-none",
          text,
        )}
      >
        <span
          className={cn(
            "font-semibold tabular-nums",
            headline.length > 4 ? "text-[8px]" : "text-[10px]",
          )}
        >
          {headline}
        </span>
        {sub ? (
          <span className="mt-0.5 max-w-[36px] text-[6px] font-medium leading-tight opacity-90">
            {sub}
          </span>
        ) : null}
      </div>
    </div>
  );
}

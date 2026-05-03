"use client";

import {
  computeDaysRemaining,
  effectiveWorkProgress,
  type DaysRemaining,
} from "@/lib/tasks/derive";
import type { Task } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

interface DaysRingProps {
  task: Task;
  reference: Date;
}

const SIZE = 52;
const STROKE_OUTER = 4;
const STROKE_INNER = 3;
const RING_GAP = 2;

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

function formatAriaLabel(
  timeFrac: number | null,
  workFrac: number | null,
  daysInfo: DaysRemaining,
): string {
  const parts: string[] = [];
  if (daysInfo.label === "Done") {
    parts.push("Task complete");
  } else if (timeFrac != null) {
    parts.push(`Time elapsed about ${Math.round(timeFrac * 100)} percent`);
  } else {
    parts.push("No schedule ring");
  }
  if (workFrac != null) {
    parts.push(`work about ${Math.round(workFrac * 100)} percent done`);
  }
  parts.push(daysInfo.label);
  return parts.join(", ");
}

export function DaysRing({ task, reference }: DaysRingProps) {
  const info = computeDaysRemaining(task, reference);
  const workP = effectiveWorkProgress(task);
  const { headline, sub } = ringText(info);
  const { stroke: timeStroke, text } = toneClasses(info.tone);

  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const rOuter = (SIZE - STROKE_OUTER) / 2;
  const rInner = rOuter - STROKE_OUTER / 2 - RING_GAP - STROKE_INNER / 2;

  const cOuter = 2 * Math.PI * rOuter;
  const cInner = 2 * Math.PI * rInner;

  const timeProgress = info.tone === "muted" ? null : info.progress;
  const outerDash = info.tone === "muted" ? `${cOuter * 0.15} ${cOuter * 0.1}` : undefined;
  const outerOffset =
    timeProgress != null ? cOuter * (1 - timeProgress) : cOuter;

  const innerOffset =
    workP != null ? cInner * (1 - workP) : cInner;

  const ariaLabel = formatAriaLabel(timeProgress, workP, info);

  return (
    <div
      className="relative shrink-0"
      style={{ width: SIZE, height: SIZE }}
      role="img"
      aria-label={ariaLabel}
      title="Outer ring: time from created → due. Inner violet: % done."
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={cx}
          cy={cy}
          r={rOuter}
          fill="none"
          strokeWidth={STROKE_OUTER}
          className="stroke-muted-foreground/25"
          strokeDasharray={outerDash}
        />
        {timeProgress != null ? (
          <circle
            cx={cx}
            cy={cy}
            r={rOuter}
            fill="none"
            strokeWidth={STROKE_OUTER}
            strokeLinecap="round"
            className={cn(
              "transition-[stroke-dashoffset] duration-300",
              timeStroke,
            )}
            strokeDasharray={cOuter}
            strokeDashoffset={outerOffset}
          />
        ) : null}

        <circle
          cx={cx}
          cy={cy}
          r={rInner}
          fill="none"
          strokeWidth={STROKE_INNER}
          className="stroke-muted-foreground/20"
        />
        {workP != null ? (
          <circle
            cx={cx}
            cy={cy}
            r={rInner}
            fill="none"
            strokeWidth={STROKE_INNER}
            strokeLinecap="round"
            className="stroke-violet-500 transition-[stroke-dashoffset] duration-300 dark:stroke-violet-400"
            strokeDasharray={cInner}
            strokeDashoffset={innerOffset}
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
          <span className="mt-0.5 max-w-[40px] text-[6px] font-medium leading-tight opacity-90">
            {sub}
          </span>
        ) : null}
      </div>
    </div>
  );
}

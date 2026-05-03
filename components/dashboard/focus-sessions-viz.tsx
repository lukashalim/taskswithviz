"use client";

import { format, startOfDay, subDays } from "date-fns";
import { Timer } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatElapsedFromSeconds,
  elapsedSeconds,
} from "@/lib/tasks/format-elapsed";
import type { CompletedSessionChartRow } from "@/lib/tasks/work-sessions";
import { cn } from "@/lib/utils";

/** Days shown in the bar chart (local calendar days, oldest left). */
export const FOCUS_SESSION_CHART_DAYS = 14;

const ALL_TASKS_VALUE = "__all__";

interface TaskOption {
  id: string;
  title: string;
}

/** Local calendar day keys from (today − n + 1) through today, oldest first. */
function buildLocalDayKeys(numDays: number): string[] {
  const today = startOfDay(new Date());
  return Array.from({ length: numDays }, (_, i) =>
    format(subDays(today, numDays - 1 - i), "yyyy-MM-dd"),
  );
}

interface DayBucket {
  totalSec: number;
  count: number;
}

function aggregateTimeByEndedLocalDay(
  sessions: CompletedSessionChartRow[],
): Map<string, DayBucket> {
  const map = new Map<string, DayBucket>();
  for (const s of sessions) {
    const key = format(new Date(s.ended_at), "yyyy-MM-dd");
    const sec = elapsedSeconds(new Date(s.started_at), new Date(s.ended_at));
    const prev = map.get(key);
    if (prev) {
      prev.totalSec += sec;
      prev.count += 1;
    } else {
      map.set(key, { totalSec: sec, count: 1 });
    }
  }
  return map;
}

interface FocusSessionsVizProps {
  totalCompleted: number;
  sessionsInWindow: CompletedSessionChartRow[];
  tasks: TaskOption[];
  className?: string;
}

export function FocusSessionsViz({
  totalCompleted,
  sessionsInWindow,
  tasks,
  className,
}: FocusSessionsVizProps) {
  const [filterTaskId, setFilterTaskId] = useState<string>(ALL_TASKS_VALUE);

  /** Tasks plus any task ids that appear in session data but not in the list (e.g. deleted tasks). */
  const taskSelectOptions = useMemo(() => {
    const byId = new Map<string, TaskOption>();
    for (const t of tasks) {
      byId.set(t.id, t);
    }
    for (const s of sessionsInWindow) {
      if (!byId.has(s.task_id)) {
        byId.set(s.task_id, {
          id: s.task_id,
          title: `Removed task (${s.task_id.slice(0, 8)}…)`,
        });
      }
    }
    return [...byId.values()].sort((a, b) => a.title.localeCompare(b.title));
  }, [tasks, sessionsInWindow]);

  /** Valid task id or all-tasks; falls back when the id is unknown. */
  const filterTaskIdResolved = useMemo(() => {
    if (filterTaskId === ALL_TASKS_VALUE) return ALL_TASKS_VALUE;
    if (taskSelectOptions.some((t) => t.id === filterTaskId)) return filterTaskId;
    return ALL_TASKS_VALUE;
  }, [filterTaskId, taskSelectOptions]);

  const dayKeys = useMemo(
    () => buildLocalDayKeys(FOCUS_SESSION_CHART_DAYS),
    [],
  );

  const filteredSessions = useMemo(() => {
    if (filterTaskIdResolved === ALL_TASKS_VALUE) return sessionsInWindow;
    return sessionsInWindow.filter((s) => s.task_id === filterTaskIdResolved);
  }, [sessionsInWindow, filterTaskIdResolved]);

  const bucketMap = useMemo(
    () => aggregateTimeByEndedLocalDay(filteredSessions),
    [filteredSessions],
  );

  const bars = useMemo(() => {
    return dayKeys.map((key) => {
      const bucket = bucketMap.get(key) ?? { totalSec: 0, count: 0 };
      const day = new Date(`${key}T12:00:00`);
      return {
        key,
        totalSec: bucket.totalSec,
        count: bucket.count,
        weekday: format(day, "EEE"),
        dayNum: format(day, "d"),
      };
    });
  }, [dayKeys, bucketMap]);

  const maxSec = useMemo(
    () => Math.max(1, ...bars.map((b) => b.totalSec)),
    [bars],
  );

  const taskFilterLabel = useMemo(() => {
    if (filterTaskIdResolved === ALL_TASKS_VALUE) return "All tasks";
    return (
      taskSelectOptions.find((t) => t.id === filterTaskIdResolved)?.title ??
      "All tasks"
    );
  }, [filterTaskIdResolved, taskSelectOptions]);

  return (
    <Card className={cn("border-border/80 shadow-sm", className)}>
      <CardHeader className="space-y-4 pb-2">
        <div className="flex flex-row items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base font-medium">
              Focus time completed
            </CardTitle>
            <CardDescription>
              Last {FOCUS_SESSION_CHART_DAYS} days · by day ended (your local
              time). Bar height is total session duration; hover for session
              count.
            </CardDescription>
          </div>
          <Timer
            className="size-5 shrink-0 text-violet-600 dark:text-violet-400"
            aria-hidden
          />
        </div>
        <div className="flex w-full max-w-full flex-col gap-1.5 sm:max-w-lg">
          <Label
            htmlFor="focus-viz-task"
            className="text-xs text-muted-foreground"
          >
            Task
          </Label>
          <Select
            value={filterTaskIdResolved}
            onValueChange={(v) => {
              if (v != null) setFilterTaskId(v);
            }}
          >
            <SelectTrigger
              id="focus-viz-task"
              size="sm"
              className="h-auto min-h-8 w-full min-w-0 py-1.5 sm:min-w-[12rem] [&_[data-slot=select-value]]:line-clamp-2 [&_[data-slot=select-value]]:whitespace-normal [&_[data-slot=select-value]]:text-left"
            >
              <SelectValue>{taskFilterLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent
              alignItemWithTrigger={false}
              className="max-h-[min(24rem,70vh)] w-[min(36rem,calc(100vw-2rem))] min-w-[min(20rem,calc(100vw-2rem))]"
            >
              <SelectItem value={ALL_TASKS_VALUE}>All tasks</SelectItem>
              {taskSelectOptions.map((t) => (
                <SelectItem
                  key={t.id}
                  value={t.id}
                  className="h-auto min-h-8 items-start whitespace-normal py-2 [&_[data-slot=select-item-text]]:whitespace-normal"
                >
                  {t.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-3xl font-bold tabular-nums">{totalCompleted}</p>
          <p className="text-sm text-muted-foreground">
            Completed sessions (all time)
          </p>
        </div>

        <div
          className="flex h-36 items-end justify-between gap-1 sm:gap-1.5"
          role="img"
          aria-label={`Focus time per day over the last ${FOCUS_SESSION_CHART_DAYS} days`}
        >
          {bars.map(({ key, totalSec, count, weekday, dayNum }) => {
            const pct =
              totalSec === 0 ? 0 : Math.max(8, (totalSec / maxSec) * 100);
            const timeLabel = formatElapsedFromSeconds(totalSec);
            const title =
              totalSec === 0
                ? `${key}: no time`
                : `${key}: ${timeLabel} · ${count} session${count === 1 ? "" : "s"}`;
            const ariaLabel = title;
            return (
              <div
                key={key}
                className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
              >
                <div
                  className="relative flex h-28 w-full max-w-[2rem] flex-col justify-end self-stretch sm:max-w-[2.5rem]"
                  title={title}
                >
                  {totalSec === 0 ? (
                    <div
                      className="h-0.5 w-full rounded-full bg-muted-foreground/20"
                      aria-hidden
                    />
                  ) : (
                    <div
                      className="w-full min-h-1 rounded-t-md bg-violet-500/85 dark:bg-violet-400/75"
                      style={{ height: `${pct}%` }}
                      aria-label={ariaLabel}
                    />
                  )}
                </div>
                <div className="flex flex-col items-center leading-none">
                  <span className="text-[10px] font-medium text-muted-foreground sm:text-xs">
                    {weekday}
                  </span>
                  <span className="text-[9px] tabular-nums text-muted-foreground/80 sm:text-[10px]">
                    {dayNum}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

import { AlertTriangle, CheckCircle2, ListTodo } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardsProps {
  total: number;
  percentComplete: number;
  overdue: number;
  className?: string;
}

export function KpiCards({
  total,
  percentComplete,
  overdue,
  className,
}: KpiCardsProps) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:grid-cols-3",
        className,
      )}
    >
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total tasks</CardTitle>
          <ListTodo className="size-4 text-muted-foreground" aria-hidden />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold tabular-nums">{total}</p>
          <CardDescription>All items in your workspace</CardDescription>
        </CardContent>
      </Card>
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Complete</CardTitle>
          <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold tabular-nums">{percentComplete}%</p>
          <CardDescription>Share of tasks marked done</CardDescription>
        </CardContent>
      </Card>
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          <AlertTriangle className="size-4 text-red-600 dark:text-red-400" aria-hidden />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold tabular-nums">{overdue}</p>
          <CardDescription>Past due and not complete</CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}

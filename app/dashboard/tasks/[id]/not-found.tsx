import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function TaskNotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-lg font-semibold">Task not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        It may have been deleted or you don&apos;t have access.
      </p>
      <Link
        href="/dashboard"
        className={cn(buttonVariants(), "mt-6 inline-flex")}
      >
        Back to dashboard
      </Link>
    </div>
  );
}

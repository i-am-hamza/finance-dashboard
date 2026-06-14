"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteAccount } from "@/lib/services/auth";

export function DangerZone() {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!window.confirm(
      "This will permanently delete your account and all your data. This cannot be undone. Continue?"
    )) return;

    startTransition(async () => {
      const result = await deleteAccount();
      if (result && "error" in result && result.error) {
        toast.error(result.error);
      }
      // On success, deleteAccount redirects to /login
    });
  };

  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
      <div>
        <p className="text-sm font-medium text-foreground">Delete Account</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Permanently removes your account, all financial data, and cannot be undone.
        </p>
      </div>
      <Button
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={isPending}
        className="gap-1.5"
      >
        <Trash2 size={13} />
        {isPending ? "Deleting…" : "Delete Account"}
      </Button>
    </div>
  );
}

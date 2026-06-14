"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateDisplayName } from "@/lib/actions/settings";

interface Props {
  email:       string;
  displayName: string | null;
}

export function ProfileForm({ email, displayName }: Props) {
  const [name, setName]          = useState(displayName ?? "");
  const [isPending, startTransition] = useTransition();

  const isDirty = name.trim() !== (displayName ?? "");

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateDisplayName(name);
      if ("error" in result && result.error) toast.error(result.error);
      else toast.success("Display name updated");
    });
  };

  return (
    <div className="space-y-4">
      {/* Display name */}
      <div className="grid gap-1.5">
        <Label htmlFor="display-name">Display Name</Label>
        <div className="flex items-center gap-2">
          <Input
            id="display-name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            className="max-w-xs"
          />
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || isPending}
          >
            {isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {/* Email — read-only */}
      <div className="grid gap-1.5">
        <Label htmlFor="email" className="text-muted-foreground">
          Email
        </Label>
        <Input
          id="email"
          value={email}
          readOnly
          disabled
          className="max-w-xs"
        />
      </div>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ToastTrigger() {
  return (
    <Button onClick={() => toast.success("shadcn 工作正常")}>
      測試 toast
    </Button>
  );
}

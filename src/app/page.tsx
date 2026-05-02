import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api, HydrateClient } from "@/trpc/server";

import { ToastTrigger } from "./_components/toast-trigger";

export default async function Home() {
  const hello = await api.post.hello({ text: "from tRPC" });

  return (
    <HydrateClient>
      <main className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>T3 Stack + shadcn/ui</CardTitle>
            <CardDescription>{hello.greeting}</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <ToastTrigger />
            <Button variant="outline" asChild>
              <a
                href="https://ui.shadcn.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                shadcn docs
              </a>
            </Button>
          </CardContent>
        </Card>
      </main>
    </HydrateClient>
  );
}

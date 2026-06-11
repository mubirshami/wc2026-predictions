"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "your email address";

  return (
    <Card className="border-border/50">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-7 w-7 text-primary" />
        </div>
        <CardTitle className="text-xl">Check your inbox</CardTitle>
        <CardDescription className="text-base">
          We sent a confirmation link to{" "}
          <span className="font-medium text-foreground">{email}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        <div className="rounded-lg bg-muted/50 border border-border/50 p-4 space-y-2">
          <p className="text-sm font-medium text-foreground">What happens next:</p>
          <ol className="text-sm text-muted-foreground space-y-1.5 list-none">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold shrink-0">1.</span>
              Open the email from WC 2026 Predictions
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold shrink-0">2.</span>
              Click <strong className="text-foreground">&ldquo;Confirm Email Address&rdquo;</strong>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold shrink-0">3.</span>
              You&apos;ll be brought back to set your username and favourite team
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold shrink-0">4.</span>
              Start predicting! ⚽
            </li>
          </ol>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Didn&apos;t receive it? Check your spam folder. The link expires in 24 hours.
        </p>
      </CardContent>

      <CardFooter>
        <Link href="/sign-in" className="w-full">
          <Button variant="outline" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to sign in
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={<div />}>
      <CheckEmailContent />
    </Suspense>
  );
}

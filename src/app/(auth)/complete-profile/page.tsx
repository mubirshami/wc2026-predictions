"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TeamCombobox } from "@/components/team-combobox";

const schema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be 30 characters or less")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
  favoriteTeam: z.string().min(1, "Please select your favourite team"),
});

type FormValues = z.infer<typeof schema>;
type UsernameStatus = "idle" | "checking" | "available" | "taken";

export default function CompleteProfilePage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const usernameValue = watch("username", "");

  useEffect(() => {
    const trimmed = usernameValue?.trim().toLowerCase().replace(/\s+/g, "_") ?? "";

    // Reset if too short or invalid format (let zod handle those errors)
    if (trimmed.length < 3 || !/^[a-z0-9_]+$/.test(trimmed)) {
      setUsernameStatus("idle");
      return;
    }

    setUsernameStatus("checking");

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", trimmed)
        .maybeSingle();

      setUsernameStatus(data ? "taken" : "available");
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [usernameValue]);

  async function onSubmit(values: FormValues) {
    if (usernameStatus === "taken") return;
    setServerError(null);
    const trimmedUsername = values.username.trim().toLowerCase().replace(/\s+/g, "_");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/sign-in");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ username: trimmedUsername, favorite_team: values.favoriteTeam })
      .eq("id", user.id);

    if (error) {
      setServerError(
        error.code === "23505"
          ? "That username is already taken. Try another."
          : error.message
      );
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Complete your profile</CardTitle>
        <CardDescription>Choose a username and your favourite team</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-4">
          {serverError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <Input
                id="username"
                type="text"
                placeholder="e.g. goat_messi"
                autoComplete="username"
                aria-invalid={!!errors.username || usernameStatus === "taken"}
                className={
                  usernameStatus === "available"
                    ? "border-emerald-500 focus-visible:ring-emerald-500"
                    : usernameStatus === "taken"
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }
                {...register("username")}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameStatus === "checking" && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {usernameStatus === "available" && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                )}
                {usernameStatus === "taken" && (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
            </div>

            {errors.username ? (
              <p className="text-xs text-destructive">{errors.username.message}</p>
            ) : usernameStatus === "taken" ? (
              <p className="text-xs text-destructive">Username is already taken</p>
            ) : usernameStatus === "available" ? (
              <p className="text-xs text-emerald-500">Username is available</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Letters, numbers, and underscores — saved as lowercase
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Favourite Team</Label>
            <Controller
              name="favoriteTeam"
              control={control}
              render={({ field }) => (
                <TeamCombobox
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  invalid={!!errors.favoriteTeam}
                />
              )}
            />
            {errors.favoriteTeam && (
              <p className="text-xs text-destructive">{errors.favoriteTeam.message}</p>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || usernameStatus === "taken" || usernameStatus === "checking"}
          >
            {isSubmitting && <Loader2 className="animate-spin" />}
            Start predicting
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

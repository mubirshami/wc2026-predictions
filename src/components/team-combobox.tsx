"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { TEAM_NAMES, getTeamFlagUrl } from "@/lib/constants/teams";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface TeamComboboxProps {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}

export function TeamCombobox({ value, onChange, invalid }: TeamComboboxProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            invalid && "border-destructive focus-visible:ring-destructive"
          )}
        >
          {value ? (
            <span className="flex items-center gap-2">
              <Image
                src={getTeamFlagUrl(value)}
                alt={value}
                width={24}
                height={16}
                className="h-4 w-6 object-cover rounded-sm"
              />
              <span>{value}</span>
            </span>
          ) : (
            "Select your team..."
          )}
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Search team..." />
          <CommandList>
            <CommandEmpty>No team found.</CommandEmpty>
            <CommandGroup>
              {TEAM_NAMES.map((team) => (
                <CommandItem
                  key={team}
                  value={team}
                  onSelect={() => {
                    onChange(team === value ? "" : team);
                    setOpen(false);
                  }}
                >
                  <Image
                    src={getTeamFlagUrl(team)}
                    alt={team}
                    width={24}
                    height={16}
                    className="h-4 w-6 object-cover rounded-sm shrink-0"
                  />
                  <span>{team}</span>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === team ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

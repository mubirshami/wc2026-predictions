"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Loader2 } from "lucide-react";
import { formatMatchDate, getStageLabel } from "@/lib/utils";
import { getTeamFlagUrl, getTeamCode } from "@/lib/constants/teams";
import type { Match, MatchStage } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface AdminMatchesTableProps {
  matches: Match[];
}

export function AdminMatchesTable({ matches: initialMatches }: AdminMatchesTableProps) {
  const [matches, setMatches] = useState(initialMatches);
  const [editMatch, setEditMatch] = useState<Match | null>(null);
  const [saving, setSaving] = useState(false);

  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [status, setStatus] = useState<string>("");
  const [manualWinner, setManualWinner] = useState<string>("");

  function openEdit(match: Match) {
    setEditMatch(match);
    setHomeScore(match.home_score?.toString() ?? "");
    setAwayScore(match.away_score?.toString() ?? "");
    setStatus(match.status);
    setManualWinner(match.winner ?? "auto");
  }

  async function handleSave() {
    if (!editMatch) return;
    setSaving(true);

    try {
      const body = {
        home_score: homeScore !== "" ? parseInt(homeScore) : null,
        away_score: awayScore !== "" ? parseInt(awayScore) : null,
        status,
        manual_winner: manualWinner === "auto" ? null : manualWinner,
      };

      const res = await fetch(`/api/admin/matches/${editMatch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to update match");
        return;
      }

      setMatches((prev) =>
        prev.map((m) => (m.id === editMatch.id ? { ...m, ...data.match } : m))
      );
      toast.success("Match updated");
      setEditMatch(null);
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Match</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="hidden sm:table-cell">Stage</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Score</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.map((match) => (
              <TableRow key={match.id}>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <img src={getTeamFlagUrl(match.home_team)} alt={match.home_team} className="h-4 w-auto rounded-sm" />
                    <span>{getTeamCode(match.home_team)}</span>
                    <span className="text-muted-foreground">vs</span>
                    <span>{getTeamCode(match.away_team)}</span>
                    <img src={getTeamFlagUrl(match.away_team)} alt={match.away_team} className="h-4 w-auto rounded-sm" />
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {formatMatchDate(match.kickoff_at)}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                  {getStageLabel(match.stage as MatchStage)}
                  {match.group_name && ` · G${match.group_name}`}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      match.status === "live"
                        ? "live"
                        : match.status === "completed"
                        ? "completed"
                        : "upcoming"
                    }
                  >
                    {match.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-center font-mono text-sm">
                  {match.home_score !== null
                    ? `${match.home_score}–${match.away_score}`
                    : "—"}
                </TableCell>
                <TableCell>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => openEdit(match)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editMatch} onOpenChange={(open) => !open && setEditMatch(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Match</DialogTitle>
            <DialogDescription>
              {editMatch &&
                `${editMatch.home_team} vs ${editMatch.away_team}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  {editMatch ? getTeamCode(editMatch.home_team) : "Home"} Score
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={99}
                  value={homeScore}
                  onChange={(e) => setHomeScore(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  {editMatch ? getTeamCode(editMatch.away_team) : "Away"} Score
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={99}
                  value={awayScore}
                  onChange={(e) => setAwayScore(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Winner Override</Label>
              <Select value={manualWinner} onValueChange={setManualWinner}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (from score)</SelectItem>
                  <SelectItem value="home">
                    {editMatch ? editMatch.home_team : "Home Team"}
                  </SelectItem>
                  <SelectItem value="away">
                    {editMatch ? editMatch.away_team : "Away Team"}
                  </SelectItem>
                  {editMatch?.stage === "group" && (
                    <SelectItem value="draw">Draw</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Use override for knockout matches that went to penalties
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditMatch(null)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

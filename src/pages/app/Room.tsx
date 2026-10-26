import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Pause,
  Play,
  SkipForward,
  Copy,
  Share2,
  Users,
  Droplets,
  Activity,
  Loader2,
  Home,
  Pencil,
  DoorOpen,
  Check,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RoomRhythmControls } from "@/components/RoomRhythmControls";
import { useT, format } from "@/lib/i18n";
import { track } from "@/lib/analytics";
import { GardenCard } from "@/components/garden/GardenCard";
import type { GardenTheme } from "@/lib/garden/engine";
import { useFocusTimer } from "@/contexts/FocusTimerContext";
import { JOIN_PATHS } from "@/lib/i18n/types";
import { useActiveRoom } from "@/contexts/ActiveRoomContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { readNickname, writeNickname } from "@/lib/activeRoomStorage";

const formatMMSS = (seconds: number): string => {
  const mins = Math.floor(Math.max(0, seconds) / 60);
  const secs = Math.max(0, seconds) % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const NameEntry = ({
  onSubmit,
  initialValue,
}: {
  onSubmit: (name: string) => void;
  initialValue: string;
}) => {
  const { t } = useT();
  const r = t.app.room;
  const [value, setValue] = useState(initialValue);
  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    const name = value.trim();
    if (!name) return;
    onSubmit(name);
  };
  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="font-heading text-xl text-foreground mb-1">{r.title}</h1>
      <p className="text-sm text-muted-foreground mb-6">{r.enterNameHint}</p>
      <form onSubmit={handle} className="space-y-3">
        <label className="text-sm font-medium text-foreground">{r.enterName}</label>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={r.namePlaceholder}
          maxLength={40}
          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
          autoFocus
        />
        <Button type="submit" className="w-full" disabled={!value.trim()}>
          {r.join}
        </Button>
      </form>
    </div>
  );
};

interface RoomViewProps {
  code: string;
  onChangeName: () => void;
}

const RoomView = ({ code, onChangeName }: RoomViewProps) => {
  const { t, lang } = useT();
  const r = t.app.room;
  const { toast } = useToast();
  const navigate = useNavigate();
  const { selectedPreset } = useFocusTimer();
  const active = useActiveRoom();

  const {
    activeRoom,
    info,
    presence,
    state,
    remainingSec,
    myKey,
    pause,
    resume,
    skip,
    setRhythm,
    setCustomRhythm,
    logActivity,
    rename,
    deleteRoom,
    leaveActiveRoom,
  } = active;

  // When the owner-side delete arrives, the live hook flips status to
  // "deleted" and ActiveRoomContext clears the slot. Bounce back to /app and
  // make sure the "ensure active-room slot" effect doesn't re-add the room.
  const roomGoneRef = useRef(false);
  useEffect(() => {
    if (roomGoneRef.current) return;
    if (active.status === "deleted" || active.status === "not_found") {
      roomGoneRef.current = true;
      navigate("/app", { replace: true });
    }
  }, [active.status, navigate]);

  // Ensure the active-room slot is set to this URL. Skip once we've been
  // kicked out so a server-side delete actually sticks.
  useEffect(() => {
    if (roomGoneRef.current) return;
    if (!activeRoom || activeRoom.code !== code) {
      active.setActiveRoom({ code, nickname: readNickname() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, activeRoom?.code]);

  // Prime the broadcast state's rhythm the first time this room is new. Only
  // seeds known preset ids — a "custom" selectedPreset doesn't exist on the
  // personal timer side.
  const primedRef = useRef(false);
  useEffect(() => {
    if (primedRef.current) return;
    if (!state) return;
    if (state.updatedAt > 0) return;
    primedRef.current = true;
    if (selectedPreset === "light" || selectedPreset === "standard" || selectedPreset === "focus") {
      setRhythm(selectedPreset);
    }
  }, [state, selectedPreset, setRhythm]);

  const trackedJoinRef = useRef(false);
  useEffect(() => {
    if (!activeRoom || trackedJoinRef.current) return;
    trackedJoinRef.current = true;
    track("room_joined", { code });
  }, [code, activeRoom]);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const joinPath = JOIN_PATHS[lang];
    return `${window.location.origin}${joinPath}?c=${encodeURIComponent(code)}`;
  }, [code, lang]);

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: r.linkCopied });
      track("room_link_copied", { code });
    } catch {
      /* ignore */
    }
  };

  const handleShare = async () => {
    if (!shareUrl) return;
    const text = format(r.shareText, { url: shareUrl });
    const canShare = typeof navigator !== "undefined" && "share" in navigator;
    if (canShare) {
      try {
        await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share({
          title: r.title,
          text,
          url: shareUrl,
        });
        track("room_link_copied", { code, via: "web_share" });
        return;
      } catch {
        /* user cancelled or feature failed; fall through to copy */
      }
    }
    await handleCopyLink();
  };

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  useEffect(() => {
    setRenameValue(info?.name ?? "");
  }, [info?.name]);
  const [renaming, setRenaming] = useState(false);

  const handleRename = async () => {
    setRenaming(true);
    const ok = await rename(renameValue.trim() || null);
    setRenaming(false);
    if (ok) {
      setRenameOpen(false);
    } else {
      toast({ title: r.createError, variant: "destructive" });
    }
  };

  const handleLeave = () => {
    leaveActiveRoom();
    navigate("/app");
  };

  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    setDeleting(true);
    const ok = await deleteRoom();
    setDeleting(false);
    if (!ok) {
      toast({ title: r.deleteError, variant: "destructive" });
      return;
    }
    toast({ title: r.deleteToastSelf });
    navigate("/app");
  };

  if (!activeRoom) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isRunning = state.isRunning;
  const phaseLabel = state.phase === "focus" ? r.cycleFocus : r.cycleBreak;
  const displayName = info?.name?.trim() || activeRoom.name?.trim() || code;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[520px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-5 flex items-start justify-between gap-2"
      >
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-2xl text-foreground truncate">{displayName}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {r.code}: <span className="font-mono text-foreground">{code}</span>
          </p>
        </div>
        {info?.isOwner && (
          <AlertDialog open={renameOpen} onOpenChange={setRenameOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" data-testid="room-rename-open">
                <Pencil className="h-4 w-4 mr-1" />
                {r.renameEdit}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{r.renameTitle}</AlertDialogTitle>
                <AlertDialogDescription>{r.renamePlaceholder}</AlertDialogDescription>
              </AlertDialogHeader>
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder={r.renamePlaceholder}
                maxLength={40}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                data-testid="room-rename-input"
                autoFocus
              />
              <AlertDialogFooter>
                <AlertDialogCancel>{t.app.dashboard.newDayCancel}</AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button
                    onClick={handleRename}
                    disabled={renaming}
                    data-testid="room-rename-submit"
                  >
                    {renaming ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        {r.renameSave}
                      </>
                    )}
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className={`rounded-2xl border p-6 mb-5 ${
          state.phase === "focus"
            ? "border-primary/30 bg-primary/5"
            : "border-secondary/30 bg-secondary/5"
        }`}
      >
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
          {r.roomTimer}
        </p>
        <p
          className={`text-5xl font-heading tabular-nums ${
            state.phase === "focus" ? "text-primary" : "text-secondary"
          }`}
        >
          {formatMMSS(remainingSec)}
        </p>
        <p className="text-sm text-muted-foreground mt-1">{phaseLabel}</p>

        <div className="flex items-center gap-2 mt-5">
          <Button
            onClick={isRunning ? pause : resume}
            size="lg"
            variant={isRunning ? "outline" : "default"}
            aria-label={isRunning ? r.pause : r.resume}
          >
            {isRunning ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                {r.pause}
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                {r.resume}
              </>
            )}
          </Button>
          <Button onClick={skip} size="lg" variant="outline" aria-label={r.skip}>
            <SkipForward className="h-4 w-4 mr-2" />
            {r.skip}
          </Button>
        </div>

        <RoomRhythmControls
          phaseRunning={isRunning}
          rhythmId={state.rhythmId}
          focusSec={state.focusSec}
          breakSec={state.breakSec}
          onPreset={(id) => setRhythm(id)}
          onCustom={(w, b) => setCustomRhythm(w, b)}
        />
      </motion.div>

      <div className="mb-5 grid grid-cols-2 gap-2">
        <Button onClick={handleCopyLink} variant="outline" size="sm">
          <Copy className="h-4 w-4 mr-2" />
          {r.copyLink}
        </Button>
        <Button onClick={handleShare} variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          {r.share}
        </Button>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-2xl border border-border/30 bg-card p-4 mb-5"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">{r.presentsTitle}</p>
          </div>
          <button
            onClick={onChangeName}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            {r.rejoin}
          </button>
        </div>
        {presence.length === 0 ? (
          <p className="text-xs text-muted-foreground">{r.presentsEmpty}</p>
        ) : (
          <ul className="space-y-1">
            {presence.map((p) => (
              <li
                key={p.key}
                className={`text-sm ${p.key === myKey ? "font-medium text-foreground" : "text-muted-foreground"}`}
              >
                {p.name}
                {p.key === myKey ? ` · ${r.youSuffix}` : ""}
              </li>
            ))}
          </ul>
        )}
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.14 }}
        className="space-y-3"
      >
        <GardenCard
          theme={(info?.gardenTheme ?? "zen") as GardenTheme}
          counts={{
            focus: info?.focusCount ?? 0,
            break: info?.breakCount ?? 0,
            exercise: info?.exerciseCount ?? 0,
            water: info?.waterCount ?? 0,
          }}
          seed={`room:${code}`}
          heading={t.app.garden.roomTitle}
          subheading={t.app.garden.themes[(info?.gardenTheme ?? "zen") as GardenTheme]}
          trackSource="room"
        />
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void logActivity("exercise")}
            className="justify-start h-auto py-2"
          >
            <Activity className="h-4 w-4 mr-2 text-primary" />
            <span className="text-xs">{r.counters.exercise}</span>
            <span className="ml-auto font-heading">{info?.exerciseCount ?? 0}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void logActivity("water")}
            className="justify-start h-auto py-2"
          >
            <Droplets className="h-4 w-4 mr-2 text-primary" />
            <span className="text-xs">{r.counters.water}</span>
            <span className="ml-auto font-heading">{info?.waterCount ?? 0}</span>
          </Button>
        </div>
      </motion.section>

      <div className="mt-6 flex items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to="/app">
            <Home className="h-4 w-4 mr-2" />
            {r.back}
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {info?.isOwner && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  data-testid="room-delete"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {r.deleteCta}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{r.deleteConfirmTitle}</AlertDialogTitle>
                  <AlertDialogDescription>{r.deleteConfirmBody}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>
                    {t.app.dashboard.newDayCancel}
                  </AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={deleting}
                      data-testid="room-delete-confirm"
                    >
                      {deleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        r.deleteConfirmCta
                      )}
                    </Button>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" data-testid="room-leave">
                <DoorOpen className="h-4 w-4 mr-2" />
                {r.leaveConfirmCta}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{r.leaveConfirmTitle}</AlertDialogTitle>
                <AlertDialogDescription>{r.leaveConfirmBody}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t.app.dashboard.newDayCancel}</AlertDialogCancel>
                <AlertDialogAction onClick={handleLeave}>{r.leaveConfirmCta}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};

const Room = () => {
  const { code } = useParams<{ code: string }>();
  const { t } = useT();
  const r = t.app.room;
  const active = useActiveRoom();
  const [name, setName] = useState<string>(() => readNickname());

  // Persist the active room as early as possible so the strip survives a hard
  // reload (and tests don't race the useEffect fired from inside RoomView).
  useEffect(() => {
    if (!code) return;
    if (!name.trim()) return;
    if (active.activeRoom?.code === code && (active.activeRoom?.nickname ?? "") === name.trim()) return;
    active.setActiveRoom({ code, nickname: name.trim() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, name]);

  if (!code) {
    return <div className="p-6 text-center text-muted-foreground">{r.notFound}</div>;
  }

  if (!name.trim()) {
    return (
      <NameEntry
        initialValue=""
        onSubmit={(value) => {
          writeNickname(value);
          setName(value);
        }}
      />
    );
  }

  return (
    <RoomView
      code={code}
      onChangeName={() => {
        writeNickname("");
        setName("");
      }}
    />
  );
};

export default Room;

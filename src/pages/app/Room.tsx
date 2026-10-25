import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useFocusRoom } from "@/hooks/useFocusRoom";
import { useT, format } from "@/lib/i18n";
import { track } from "@/lib/analytics";
import { GardenCard } from "@/components/garden/GardenCard";

const ROOM_NAME_KEY = "calmo_room_name";

const readStoredName = (): string => {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(ROOM_NAME_KEY) ?? "";
  } catch {
    return "";
  }
};

const writeStoredName = (value: string) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ROOM_NAME_KEY, value);
  } catch {
    /* ignore */
  }
};

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
  name: string;
  onChangeName: () => void;
}

const RoomView = ({ code, name, onChangeName }: RoomViewProps) => {
  const { t } = useT();
  const r = t.app.room;
  const { toast } = useToast();

  const {
    status,
    info,
    presence,
    state,
    remainingSec,
    myKey,
    pause,
    resume,
    skip,
    logActivity,
  } = useFocusRoom(code, name);

  const trackedJoinRef = useRef(false);
  useEffect(() => {
    if (status !== "ready" || trackedJoinRef.current) return;
    trackedJoinRef.current = true;
    track("room_joined", { code });
  }, [code, status]);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/app/room/${code}`;
  }, [code]);

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

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === "not_found") {
    return (
      <div className="p-6 max-w-md mx-auto text-center space-y-4">
        <h1 className="font-heading text-xl text-foreground">{r.notFound}</h1>
        <p className="text-sm text-muted-foreground">{r.notFoundDesc}</p>
        <Button asChild variant="outline">
          <Link to="/app">
            <Home className="h-4 w-4 mr-2" />
            {r.back}
          </Link>
        </Button>
      </div>
    );
  }

  const isRunning = state.isRunning;
  const phaseLabel = state.phase === "focus" ? r.cycleFocus : r.cycleBreak;
  const realtimeError = status === "realtime_error";

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[520px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-5"
      >
        <h1 className="font-heading text-2xl text-foreground">{r.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {r.code}: <span className="font-mono text-foreground">{code}</span>
        </p>
      </motion.div>

      {realtimeError && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-400">
          {r.realtimeError}
        </div>
      )}

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
                {p.key === myKey ? " · you" : ""}
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
          theme={info?.gardenTheme ?? "zen"}
          counts={{
            focus: info?.focusCount ?? 0,
            break: info?.breakCount ?? 0,
            exercise: info?.exerciseCount ?? 0,
            water: info?.waterCount ?? 0,
          }}
          seed={`room:${code}`}
          heading={`${phaseLabel} · ${info?.gardenTheme ?? "zen"}`}
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

      <div className="mt-6 text-center">
        <Button asChild variant="ghost" size="sm">
          <Link to="/app">
            <Home className="h-4 w-4 mr-2" />
            {r.back}
          </Link>
        </Button>
      </div>
    </div>
  );
};

const Room = () => {
  const { code } = useParams<{ code: string }>();
  const { t } = useT();
  const r = t.app.room;
  const [name, setName] = useState<string>(() => readStoredName());

  if (!code) {
    return <div className="p-6 text-center text-muted-foreground">{r.notFound}</div>;
  }

  if (!name.trim()) {
    return (
      <NameEntry
        initialValue=""
        onSubmit={(value) => {
          writeStoredName(value);
          setName(value);
        }}
      />
    );
  }

  return (
    <RoomView
      code={code}
      name={name}
      onChangeName={() => {
        writeStoredName("");
        setName("");
      }}
    />
  );
};

export default Room;

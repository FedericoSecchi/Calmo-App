import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users as UsersIcon,
  Loader2,
  Copy,
  Plus,
  ArrowRight,
  DoorOpen,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveRoom } from "@/contexts/ActiveRoomContext";
import { track } from "@/lib/analytics";
import { useT, format } from "@/lib/i18n";
import { JOIN_PATHS } from "@/lib/i18n/types";
import {
  createRoomWithName,
  listMyRooms,
  renameRoom,
  type MyRoom,
} from "@/hooks/useFocusRoom";
import { readVisitedRooms, removeVisit, type VisitedRoomRecord } from "@/lib/activeRoomStorage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CombinedRoom {
  code: string;
  name: string | null;
  isOwner: boolean;
  lastActivityMs: number;
}

const uniqueByCode = (rows: CombinedRoom[]): CombinedRoom[] => {
  const map = new Map<string, CombinedRoom>();
  for (const r of rows) {
    const existing = map.get(r.code);
    if (!existing || r.lastActivityMs > existing.lastActivityMs) {
      map.set(r.code, {
        ...r,
        name: r.name ?? existing?.name ?? null,
        isOwner: r.isOwner || !!existing?.isOwner,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.lastActivityMs - a.lastActivityMs);
};

export const MyRoomsCard = () => {
  const { t, lang } = useT();
  const r = t.app.room;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isGuest, user } = useAuth();
  const { activeRoom, info } = useActiveRoom();

  const [serverRooms, setServerRooms] = useState<MyRoom[]>([]);
  const [visited, setVisited] = useState<VisitedRoomRecord[]>(() => readVisitedRooms());
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [creating, setCreating] = useState(false);
  const [renameTarget, setRenameTarget] = useState<CombinedRoom | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);

  const refreshServer = useMemo(() => {
    return async () => {
      if (isGuest || !user) {
        setServerRooms([]);
        return;
      }
      setLoading(true);
      try {
        setServerRooms(await listMyRooms());
      } finally {
        setLoading(false);
      }
    };
  }, [isGuest, user]);

  useEffect(() => {
    void refreshServer();
  }, [refreshServer]);

  // Dashboard dispatches calmo:openCreateRoom when the user returns from auth
  // via ?create_room=1. Open the dialog automatically.
  useEffect(() => {
    const open = () => setCreateOpen(true);
    window.addEventListener("calmo:openCreateRoom", open);
    return () => window.removeEventListener("calmo:openCreateRoom", open);
  }, []);

  const combined: CombinedRoom[] = useMemo(() => {
    const fromServer = serverRooms.map<CombinedRoom>((row) => ({
      code: row.code,
      name: row.name,
      isOwner: true,
      lastActivityMs: Date.parse(row.lastActiveAt) || 0,
    }));
    const fromLocal = visited.map<CombinedRoom>((row) => ({
      code: row.code,
      name: row.name,
      isOwner: row.isOwner,
      lastActivityMs: row.visitedAt,
    }));
    return uniqueByCode([...fromServer, ...fromLocal]).slice(0, 10);
  }, [serverRooms, visited]);

  const defaultCreateName = useMemo(() => {
    const nickname = (() => {
      try {
        return window.localStorage.getItem("calmo_room_name") ?? "";
      } catch {
        return "";
      }
    })();
    if (!nickname.trim()) return "";
    return format(r.roomDefault, { name: nickname.trim() });
  }, [r.roomDefault]);

  useEffect(() => {
    if (createOpen) {
      setCreateName((cur) => (cur || defaultCreateName) ?? "");
    }
  }, [createOpen, defaultCreateName]);

  const handleCreate = async () => {
    if (isGuest || !user) {
      navigate("/auth?mode=signup&create_room=1");
      return;
    }
    setCreating(true);
    try {
      const code = await createRoomWithName("zen", createName.trim() || null);
      if (!code) {
        toast({ title: r.createError, variant: "destructive" });
        setCreating(false);
        return;
      }
      track("room_created", { code });
      setCreateOpen(false);
      setCreateName("");
      navigate(`/app/room/${code}`);
    } finally {
      setCreating(false);
    }
  };

  const copyLink = async (code: string) => {
    const joinPath = JOIN_PATHS[lang];
    const url = `${window.location.origin}${joinPath}?c=${encodeURIComponent(code)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: r.linkCopied });
      track("room_link_copied", { code, source: "my_rooms" });
    } catch {
      /* ignore */
    }
  };

  const handleRename = async () => {
    if (!renameTarget) return;
    setRenaming(true);
    try {
      const ok = await renameRoom(renameTarget.code, renameValue.trim() || null);
      if (!ok) {
        toast({ title: r.createError, variant: "destructive" });
        return;
      }
      setRenameTarget(null);
      setRenameValue("");
      void refreshServer();
      setVisited(readVisitedRooms());
    } finally {
      setRenaming(false);
    }
  };

  const forgetVisited = (code: string) => {
    removeVisit(code);
    setVisited(readVisitedRooms());
  };

  const activeName = activeRoom?.name?.trim() || info?.name?.trim() || activeRoom?.code;

  return (
    <section
      className="rounded-2xl border border-border/30 bg-card p-4"
      data-testid="my-rooms-card"
    >
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-sm flex items-center gap-2">
            <UsersIcon className="h-4 w-4 text-primary" />
            <span>{r.shareTitle}</span>
          </h3>
          <p className="text-xs text-muted-foreground whitespace-normal break-words">
            {isGuest ? r.createNeedsAccount : r.shareDesc}
          </p>
        </div>
      </div>

      {activeRoom && (
        <Button asChild size="lg" className="w-full mb-3" data-testid="back-to-room">
          <Link to={`/app/room/${activeRoom.code}`}>
            <ArrowRight className="h-4 w-4 mr-2" />
            {format(r.rejoinTitle, { name: activeName ?? "" })}
          </Link>
        </Button>
      )}

      <div className="space-y-2" data-testid="my-rooms-list">
        {loading && combined.length === 0 ? (
          <div className="flex items-center justify-center py-3 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          </div>
        ) : combined.length === 0 ? (
          <p className="text-xs text-muted-foreground">{r.myRoomsEmpty}</p>
        ) : (
          combined.map((room) => (
            <div
              key={room.code}
              className="flex items-center justify-between gap-2 rounded-xl border border-border/30 bg-background px-3 py-2"
              data-testid={`my-room-${room.code}`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {room.name?.trim() || room.code}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {room.isOwner ? r.myRoomsOwner : room.code}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-xs"
                  onClick={() => copyLink(room.code)}
                  aria-label={r.copyLink}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                {room.isOwner && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-xs"
                    onClick={() => {
                      setRenameTarget(room);
                      setRenameValue(room.name ?? "");
                    }}
                    aria-label={r.renameEdit}
                    data-testid={`rename-${room.code}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
                {!room.isOwner && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-xs text-muted-foreground"
                    onClick={() => forgetVisited(room.code)}
                    aria-label={r.leaveConfirmCta}
                  >
                    <DoorOpen className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  size="sm"
                  className="h-8 px-3 text-xs"
                  asChild
                  data-testid={`enter-${room.code}`}
                >
                  <Link to={`/app/room/${room.code}`}>{r.join}</Link>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full mt-3" data-testid="create-room-open">
            <Plus className="h-4 w-4 mr-2" />
            {r.createNewTitle}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{r.createNewTitle}</DialogTitle>
            <DialogDescription>{r.shareDesc}</DialogDescription>
          </DialogHeader>
          <input
            type="text"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            placeholder={r.createNewPlaceholder}
            maxLength={40}
            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
            data-testid="create-room-name"
            autoFocus
          />
          <DialogFooter>
            <Button
              onClick={handleCreate}
              disabled={creating}
              data-testid="create-room-submit"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : r.createNewSubmit}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!renameTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRenameTarget(null);
            setRenameValue("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{r.renameTitle}</DialogTitle>
          </DialogHeader>
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder={r.renamePlaceholder}
            maxLength={40}
            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
            data-testid="rename-input"
            autoFocus
          />
          <DialogFooter>
            <Button onClick={handleRename} disabled={renaming} data-testid="rename-submit">
              {renaming ? <Loader2 className="h-4 w-4 animate-spin" /> : r.renameSave}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

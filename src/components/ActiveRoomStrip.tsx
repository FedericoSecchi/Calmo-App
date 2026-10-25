import { useState } from "react";
import { useLocation } from "react-router-dom";
import { DoorOpen, Users, Home } from "lucide-react";
import { useActiveRoom } from "@/contexts/ActiveRoomContext";
import { Button } from "@/components/ui/button";
import { format, useT } from "@/lib/i18n";
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

// Thin fixed strip shown on every /app screen when a room is active. Keeps
// the user aware they have a shared timer running even when they wander off
// to /app/exercises, /app/pain, etc.
export const ActiveRoomStrip = () => {
  const { t } = useT();
  const r = t.app.room;
  const { activeRoom, info, presence, openActiveRoom, leaveActiveRoom } = useActiveRoom();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  if (!activeRoom) return null;
  // Don't duplicate the strip on the room's own page.
  if (location.pathname.startsWith(`/app/room/${activeRoom.code}`)) return null;

  const displayName = activeRoom.name?.trim() || info?.name?.trim() || activeRoom.code;
  const headcount = presence.length;
  const peopleLabel =
    headcount <= 1
      ? r.activeStrip.peopleAlone
      : headcount === 2
      ? r.activeStrip.peopleOne
      : format(r.activeStrip.peopleMany, { n: headcount - 1 });

  return (
    <div
      className="fixed top-16 left-0 right-0 z-30 border-b border-primary/30 bg-primary/5 px-3 py-1.5"
      role="region"
      aria-label={r.activeStrip.prefix}
      data-testid="active-room-strip"
    >
      <div className="mx-auto flex max-w-screen-md items-center gap-2 text-xs sm:text-sm">
        <DoorOpen className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden />
        <span className="font-medium text-foreground truncate min-w-0 flex-1">
          <span className="text-muted-foreground">{r.activeStrip.prefix} </span>
          <span>{displayName}</span>
        </span>
        <span className="hidden items-center gap-1 text-muted-foreground sm:inline-flex">
          <Users className="h-3 w-3" aria-hidden />
          <span>{peopleLabel}</span>
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs"
          onClick={openActiveRoom}
          data-testid="active-room-open"
        >
          <Home className="h-3 w-3 mr-1" aria-hidden />
          {r.activeStrip.open}
        </Button>
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" data-testid="active-room-leave">
              {r.activeStrip.leave}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{r.leaveConfirmTitle}</AlertDialogTitle>
              <AlertDialogDescription>{r.leaveConfirmBody}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t.app.dashboard.newDayCancel}</AlertDialogCancel>
              <AlertDialogAction onClick={() => leaveActiveRoom()}>
                {r.leaveConfirmCta}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

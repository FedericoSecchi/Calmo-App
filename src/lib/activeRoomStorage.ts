// localStorage shape for the "active room" slot — survives tab close, PWA
// relaunch, and reloads. One active room at a time.

const KEY = "calmo_active_room";
const NICKNAME_KEY = "calmo_room_name";
const VISITS_KEY = "calmo_visited_rooms";

export interface ActiveRoomRecord {
  code: string;
  name: string | null;
  nickname: string;
  visitedAt: number;
  isOwner?: boolean;
}

export interface VisitedRoomRecord {
  code: string;
  name: string | null;
  gardenTheme: string | null;
  visitedAt: number;
  isOwner: boolean;
}

export function readActiveRoom(): ActiveRoomRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ActiveRoomRecord>;
    if (!parsed || typeof parsed.code !== "string" || !/^[a-z0-9]{4,32}$/.test(parsed.code)) {
      return null;
    }
    return {
      code: parsed.code,
      name: typeof parsed.name === "string" ? parsed.name : null,
      nickname: typeof parsed.nickname === "string" ? parsed.nickname : "",
      visitedAt: typeof parsed.visitedAt === "number" ? parsed.visitedAt : Date.now(),
      isOwner: !!parsed.isOwner,
    };
  } catch {
    return null;
  }
}

export function writeActiveRoom(record: ActiveRoomRecord): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(record));
  } catch {
    /* ignore */
  }
}

export function clearActiveRoom(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function readNickname(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(NICKNAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export function writeNickname(value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(NICKNAME_KEY, value);
  } catch {
    /* ignore */
  }
}

// Rooms the user has visited (as creator OR invitee). Used by Mis salas to
// surface a reusable list even when the account layer is empty.
export function readVisitedRooms(): VisitedRoomRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(VISITS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (r): r is VisitedRoomRecord =>
          r && typeof r.code === "string" && typeof r.visitedAt === "number",
      )
      .map((r) => ({
        code: r.code,
        name: typeof r.name === "string" ? r.name : null,
        gardenTheme: typeof r.gardenTheme === "string" ? r.gardenTheme : null,
        visitedAt: r.visitedAt,
        isOwner: !!r.isOwner,
      }));
  } catch {
    return [];
  }
}

export function recordVisit(record: Omit<VisitedRoomRecord, "visitedAt">): void {
  if (typeof window === "undefined") return;
  try {
    const list = readVisitedRooms();
    const filtered = list.filter((r) => r.code !== record.code);
    filtered.unshift({ ...record, visitedAt: Date.now() });
    // Cap at 15 locally; Mis salas UI merges with server-side list_my_rooms
    // and caps to 10 total in the view.
    window.localStorage.setItem(VISITS_KEY, JSON.stringify(filtered.slice(0, 15)));
  } catch {
    /* ignore */
  }
}

export function removeVisit(code: string): void {
  if (typeof window === "undefined") return;
  try {
    const list = readVisitedRooms().filter((r) => r.code !== code);
    window.localStorage.setItem(VISITS_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

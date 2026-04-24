const PLAYER_ID_KEY = "tricon_player_id";
const NICKNAME_KEY = "tricon_nickname";

export interface Identity {
  playerId: string;
  nickname: string;
}

function generatePlayerId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getPlayerId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = generatePlayerId();
    window.localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

export function getNickname(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(NICKNAME_KEY) ?? "";
}

export function setNickname(value: string): string {
  const trimmed = value.trim().slice(0, 16);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(NICKNAME_KEY, trimmed);
  }
  return trimmed;
}

export function getIdentity(): Identity {
  return { playerId: getPlayerId(), nickname: getNickname() };
}

import type { GamePhase } from "../game/state";

export type RoomVisibility = "public" | "private";

export interface GameRoomMetadata {
  phase: GamePhase;
  visibility: RoomVisibility;
  hostName: string;
  playerCount: number;
  humanPlayerCount: number;
  aiPlayerCount: number;
  maxPlayers: number;
  starCount: number;
  turnTimeSeconds: number;
}

export interface PublicRoomSummary extends GameRoomMetadata {
  roomId: string;
  createdAt: string;
}

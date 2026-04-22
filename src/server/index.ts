import { defineRoom, defineServer, matchMaker } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";

import { GameRoom } from "./rooms/GameRoom";
import type { PublicRoomSummary } from "../shared/roomListing";

const transport = new WebSocketTransport({});

const server = defineServer({
  transport,
  express: (app) => {
    app.get("/rooms/public", async (_req, res) => {
      try {
        const rooms = await matchMaker.query<GameRoom>(
          { name: "game_room", private: false, locked: false },
          { createdAt: -1 }
        );

        const payload: PublicRoomSummary[] = rooms.flatMap((room) => {
          if (room.metadata?.phase !== "waiting") {
            return [];
          }

          return [
            {
              roomId: room.roomId,
              createdAt: room.createdAt?.toISOString() ?? new Date().toISOString(),
              phase: room.metadata.phase,
              visibility: room.metadata.visibility,
              hostName: room.metadata.hostName,
              playerCount: room.metadata.playerCount,
              humanPlayerCount: room.metadata.humanPlayerCount,
              aiPlayerCount: room.metadata.aiPlayerCount,
              maxPlayers: room.metadata.maxPlayers,
              starCount: room.metadata.starCount,
              turnTimeSeconds: room.metadata.turnTimeSeconds,
            },
          ];
        });

        res.json({ rooms: payload });
      } catch (error) {
        console.error("Failed to load public rooms", error);
        res.status(500).json({ rooms: [], error: "failed_to_load_public_rooms" });
      }
    });
  },
  rooms: {
    game_room: defineRoom(GameRoom),
  },
});

void server.listen(2567);

import { defineRoom, defineServer } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";

import { GameRoom } from "./rooms/GameRoom";

const server = defineServer({
  transport: new WebSocketTransport({}),
  rooms: {
    game_room: defineRoom(GameRoom),
  },
});

void server.listen(2567);

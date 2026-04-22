import { ArraySchema, MapSchema } from "@colyseus/schema";
import type { Delayed } from "@colyseus/timer";
import { Room, type Client } from "colyseus";

import { chooseMove } from "../../game/ai/easy";
import { generateStars } from "../../game/geometry";
import {
  calculateGameResult,
  checkGameEnd,
  getValidMoves,
  getNextPlayerIndex,
  placeEdge,
  validateEdge,
} from "../../game/rules";
import {
  DEFAULT_SETTINGS,
  MIN_STAR_DISTANCE,
  PLAYER_COLORS,
  type AIDifficulty,
  type GameSettings,
  type GameState,
  type Player,
} from "../../game/state";
import {
  EdgeSchema,
  GameStateSchema,
  PlayerSchema,
  StarSchema,
  TriangleSchema,
} from "../schema/GameState";

type AIPlayerOption = {
  name?: string;
  difficulty?: AIDifficulty;
};

type GameRoomOptions = Partial<
  Pick<GameSettings, "maxPlayers" | "starCount" | "turnTimeSeconds">
> & {
  settings?: Partial<
    Pick<GameSettings, "maxPlayers" | "starCount" | "turnTimeSeconds">
  > & {
    aiPlayers?: number | AIPlayerOption[];
  };
  aiPlayers?: number | AIPlayerOption[];
};

const MESSAGE_ERROR = "action_error";

export class GameRoom extends Room<{ state: GameStateSchema }> {
  private turnTimeout?: Delayed;
  private turnCountdown?: Delayed;
  private aiTimeout?: Delayed;
  private configuredAIPlayers: AIPlayerOption[] = [];

  onCreate(options: GameRoomOptions = {}) {
    const settings = this.resolveSettings(options);

    this.state = new GameStateSchema();
    this.state.settings.maxPlayers = settings.maxPlayers;
    this.state.settings.starCount = settings.starCount;
    this.state.settings.turnTimeSeconds = settings.turnTimeSeconds;
    this.state.turnTimeLeft = settings.turnTimeSeconds;

    this.configuredAIPlayers = this.resolveAIPlayers(options, settings.maxPlayers);
    this.maxClients = Math.max(0, settings.maxPlayers - this.configuredAIPlayers.length);

    this.onMessage("ready", (client) => {
      this.handleReady(client);
    });

    this.onMessage<{ starA: number; starB: number }>(
      "place_edge",
      (client, payload) => {
        this.handlePlaceEdge(client, payload);
      }
    );

    this.onMessage("pass", (client) => {
      this.handlePass(client);
    });
  }

  async onJoin(client: Client, options?: { name?: string }) {
    const player = new PlayerSchema();
    player.id = client.sessionId;
    player.name = options?.name?.trim() || `Player ${this.state.turnOrder.length + 1}`;
    player.color = this.getNextAvailableColor();
    player.connected = true;
    player.ready = false;
    player.isAI = false;
    player.score = 0;

    this.state.players.set(player.id, player);
    this.state.turnOrder.push(player.id);

    this.ensurePlayableOrPause();

    if (this.clients.length >= this.maxClients) {
      await this.lock();
    }
  }

  onDrop(client: Client) {
    const player = this.state.players.get(client.sessionId);
    if (player) {
      player.connected = false;
    }
    this.ensurePlayableOrPause();
  }

  async onLeave(client: Client, code?: number) {
    const consented = code === 4000;

    if (this.state.phase === "waiting") {
      this.state.players.delete(client.sessionId);
      this.removeTurnOrderEntry(client.sessionId);
      if (this.clients.length < this.maxClients) {
        await this.unlock();
      }
      this.disposeIfEmpty();
      return;
    }

    const player = this.state.players.get(client.sessionId);
    if (!player) {
      return;
    }

    player.connected = false;
    this.ensurePlayableOrPause();

    if (consented) {
      if (this.state.phase === "playing" && this.state.currentTurnPlayerId === client.sessionId) {
        this.advanceAfterPass();
      }
      this.disposeIfEmpty();
      return;
    }

    try {
      await this.allowReconnection(client, 60);
      player.connected = true;
      this.ensurePlayableOrPause();
    } catch {
      if (this.state.phase === "playing" && this.state.currentTurnPlayerId === client.sessionId) {
        this.advanceAfterPass();
      }
      this.disposeIfEmpty();
    }
  }

  onDispose() {
    this.clearTurnTimers();
  }

  private disposeIfEmpty() {
    const hasConnectedHuman = Array.from(this.state.players.values()).some(
      (p) => !p.isAI && p.connected
    );
    if (!hasConnectedHuman) {
      this.disconnect();
    }
  }

  private handleReady(client: Client) {
    if (this.state.phase !== "waiting") {
      client.send(MESSAGE_ERROR, { message: "Game already started" });
      return;
    }

    const player = this.state.players.get(client.sessionId);
    if (!player) {
      client.send(MESSAGE_ERROR, { message: "Player not found" });
      return;
    }

    player.ready = true;

    if (this.canStartGame()) {
      void this.startGame();
    }
  }

  private handlePlaceEdge(
    client: Client,
    payload: { starA: number; starB: number }
  ) {
    if (this.state.phase !== "playing") {
      client.send(MESSAGE_ERROR, { message: "Game is not in progress" });
      return;
    }

    if (this.state.currentTurnPlayerId !== client.sessionId) {
      client.send(MESSAGE_ERROR, { message: "Not your turn" });
      return;
    }

    if (
      !payload ||
      !Number.isInteger(payload.starA) ||
      !Number.isInteger(payload.starB)
    ) {
      client.send(MESSAGE_ERROR, { message: "Invalid edge payload" });
      return;
    }

    const plainState = this.toPlainState();
    const error = validateEdge(payload.starA, payload.starB, plainState);
    if (error) {
      client.send(MESSAGE_ERROR, { message: error });
      return;
    }

    const result = placeEdge(payload.starA, payload.starB, client.sessionId, plainState);
    if (!result.success) {
      client.send(MESSAGE_ERROR, { message: result.error ?? "Invalid move" });
      return;
    }

    plainState.consecutivePasses = 0;
    plainState.turnNumber += 1;
    plainState.turnTimeLeft = plainState.settings.turnTimeSeconds;

    if (!result.bonusTurn) {
      plainState.currentTurnIndex = getNextPlayerIndex(plainState);
    }

    if (checkGameEnd(plainState)) {
      plainState.phase = "finished";
      plainState.turnTimeLeft = 0;
      this.syncFromPlainState(plainState);
      this.finishGame();
      return;
    }

    this.syncFromPlainState(plainState);
    this.broadcast("edge_placed", {
      edge: result.edge,
      newTriangles: result.newTriangles,
      bonusTurn: result.bonusTurn,
      currentTurnPlayerId: this.state.currentTurnPlayerId,
      turnNumber: this.state.turnNumber,
    });
    this.startTurnCycle();
  }

  private handlePass(client: Client) {
    if (this.state.phase !== "playing") {
      client.send(MESSAGE_ERROR, { message: "Game is not in progress" });
      return;
    }

    if (this.state.currentTurnPlayerId !== client.sessionId) {
      client.send(MESSAGE_ERROR, { message: "Not your turn" });
      return;
    }

    this.forceRandomMoveOrAdvance();
  }

  private async startGame() {
    if (this.state.phase !== "waiting") {
      return;
    }

    this.addConfiguredAIPlayers();

    const plainState = this.toPlainState();
    plainState.phase = "playing";
    plainState.turnNumber = 1;
    plainState.currentTurnIndex = 0;
    plainState.turnTimeLeft = plainState.settings.turnTimeSeconds;
    plainState.consecutivePasses = 0;
    plainState.stars = generateStars(
      plainState.settings.starCount,
      MIN_STAR_DISTANCE
    );
    plainState.edges = [];
    plainState.triangles = [];
    plainState.scores = Object.fromEntries(
      plainState.players.map((player) => [player.id, 0])
    );

    this.syncFromPlainState(plainState);
    await this.lock();
    this.broadcast("game_started", { currentTurnPlayerId: this.state.currentTurnPlayerId });
    this.ensurePlayableOrPause();
    this.startTurnCycle();
  }

  private advanceAfterPass() {
    const plainState = this.toPlainState();
    if (plainState.phase !== "playing") {
      return;
    }

    const playerId = plainState.players[plainState.currentTurnIndex]?.id ?? "";
    plainState.consecutivePasses += 1;
    plainState.turnNumber += 1;
    plainState.currentTurnIndex = getNextPlayerIndex(plainState);
    plainState.turnTimeLeft = plainState.settings.turnTimeSeconds;

    if (checkGameEnd(plainState)) {
      plainState.phase = "finished";
      plainState.turnTimeLeft = 0;
      this.syncFromPlainState(plainState);
      this.finishGame();
      return;
    }

    this.syncFromPlainState(plainState);
    this.broadcast("turn_passed", {
      playerId,
      currentTurnPlayerId: this.state.currentTurnPlayerId,
      turnNumber: this.state.turnNumber,
    });
    this.startTurnCycle();
  }

  private finishGame() {
    this.clearTurnTimers();

    const plainState = this.toPlainState();
    plainState.phase = "finished";
    plainState.turnTimeLeft = 0;

    this.syncFromPlainState(plainState);
    this.broadcast("game_finished", calculateGameResult(plainState));
  }

  private startTurnCycle() {
    this.clearTurnTimers();

    this.ensurePlayableOrPause();
    if (this.state.phase !== "playing") {
      return;
    }

    const durationMs = this.state.settings.turnTimeSeconds * 1000;
    this.state.turnTimeLeft = this.state.settings.turnTimeSeconds;

    this.turnCountdown = this.clock.setInterval(() => {
      if (this.state.phase !== "playing" || this.state.turnTimeLeft === 0) {
        return;
      }

      this.state.turnTimeLeft -= 1;
    }, 1000);

    this.turnTimeout = this.clock.setTimeout(() => {
      if (this.state.phase === "playing") {
        this.forceRandomMoveOrAdvance();
      }
    }, durationMs);

    const currentPlayer = this.state.players.get(this.state.currentTurnPlayerId);
    if (currentPlayer?.isAI) {
      this.aiTimeout = this.clock.setTimeout(() => {
        if (
          this.state.phase !== "playing" ||
          this.state.currentTurnPlayerId !== currentPlayer.id
        ) {
          return;
        }

        const plainState = this.toPlainState();
        const move = chooseMove(plainState);

        if (move) {
          this.executeAIMove(currentPlayer.id, move[0], move[1]);
          return;
        }

        this.advanceAfterPass();
      }, 1000);
    }
  }

  private executeAIMove(playerId: string, starA: number, starB: number) {
    if (this.state.phase !== "playing" || this.state.currentTurnPlayerId !== playerId) {
      return;
    }

    const plainState = this.toPlainState();
    const error = validateEdge(starA, starB, plainState);
    if (error) {
      this.advanceAfterPass();
      return;
    }

    const result = placeEdge(starA, starB, playerId, plainState);
    if (!result.success) {
      this.advanceAfterPass();
      return;
    }

    plainState.consecutivePasses = 0;
    plainState.turnNumber += 1;
    plainState.turnTimeLeft = plainState.settings.turnTimeSeconds;

    if (!result.bonusTurn) {
      plainState.currentTurnIndex = getNextPlayerIndex(plainState);
    }

    if (checkGameEnd(plainState)) {
      plainState.phase = "finished";
      plainState.turnTimeLeft = 0;
      this.syncFromPlainState(plainState);
      this.finishGame();
      return;
    }

    this.syncFromPlainState(plainState);
    this.broadcast("edge_placed", {
      edge: result.edge,
      newTriangles: result.newTriangles,
      bonusTurn: result.bonusTurn,
      currentTurnPlayerId: this.state.currentTurnPlayerId,
      turnNumber: this.state.turnNumber,
    });
    this.startTurnCycle();
  }

  private clearTurnTimers() {
    this.turnTimeout?.clear();
    this.turnCountdown?.clear();
    this.aiTimeout?.clear();
    this.turnTimeout = undefined;
    this.turnCountdown = undefined;
    this.aiTimeout = undefined;
  }

  private ensurePlayableOrPause() {
    if (this.state.phase !== "playing" && this.state.phase !== "paused") {
      return;
    }

    const connectedPlayers = Array.from(this.state.players.values()).filter((p) => p.connected);
    const canPlay = connectedPlayers.length >= 2;

    if (!canPlay) {
      if (this.state.phase !== "paused") {
        this.clearTurnTimers();
        this.state.phase = "paused";
        this.state.turnTimeLeft = 0;
        this.broadcast("game_paused", { reason: "no_opponent" });
      }
      return;
    }

    if (this.state.phase === "paused") {
      this.state.phase = "playing";
      this.state.turnTimeLeft = this.state.settings.turnTimeSeconds;
      this.broadcast("game_resumed", {});
      this.startTurnCycle();
    }
  }

  private canStartGame() {
    if (this.state.players.size === 0) {
      return false;
    }

    const humanPlayers = Array.from(this.state.players.values()).filter(
      (player) => !player.isAI
    );
    const totalPlayers = humanPlayers.length + this.configuredAIPlayers.length;

    return totalPlayers >= 2 && humanPlayers.every((player) => player.ready);
  }

  private addConfiguredAIPlayers() {
    const slotsAvailable = this.state.settings.maxPlayers - this.state.turnOrder.length;
    const playersToAdd = this.configuredAIPlayers.slice(0, Math.max(0, slotsAvailable));

    playersToAdd.forEach((aiPlayer, index) => {
      const player = new PlayerSchema();
      player.id = `ai-${this.roomId}-${index}`;
      player.name = aiPlayer.name?.trim() || `AI ${index + 1}`;
      player.color = this.getNextAvailableColor();
      player.connected = true;
      player.ready = true;
      player.isAI = true;
      player.aiDifficulty = aiPlayer.difficulty ?? "easy";
      player.score = 0;

      this.state.players.set(player.id, player);
      this.state.turnOrder.push(player.id);
    });
  }

  private resolveSettings(options: GameRoomOptions): Pick<
    GameSettings,
    "maxPlayers" | "starCount" | "turnTimeSeconds"
  > {
    const settings = options.settings ?? {};

    return {
      maxPlayers: this.pickAllowedValue(
        settings.maxPlayers ?? options.maxPlayers,
        [2, 3, 4],
        DEFAULT_SETTINGS.maxPlayers
      ),
      starCount: this.pickAllowedValue(
        settings.starCount ?? options.starCount,
        [30, 40, 50],
        DEFAULT_SETTINGS.starCount
      ),
      turnTimeSeconds: this.pickAllowedValue(
        settings.turnTimeSeconds ?? options.turnTimeSeconds,
        [10, 20, 30],
        DEFAULT_SETTINGS.turnTimeSeconds
      ),
    };
  }


  private forceRandomMoveOrAdvance() {
    const plainState = this.toPlainState();
    if (plainState.phase !== "playing") {
      return;
    }

    const playerId = plainState.players[plainState.currentTurnIndex]?.id;
    if (!playerId) {
      return;
    }

    const validMoves = getValidMoves(plainState);
    if (validMoves.length === 0) {
      this.advanceAfterPass();
      return;
    }

    const move = validMoves[Math.floor(Math.random() * validMoves.length)];
    if (!move) {
      this.advanceAfterPass();
      return;
    }

    this.executeAIMove(playerId, move[0], move[1]);
  }

  private resolveAIPlayers(options: GameRoomOptions, maxPlayers: number): AIPlayerOption[] {
    const aiPlayers = options.aiPlayers ?? options.settings?.aiPlayers;

    if (Array.isArray(aiPlayers)) {
      return aiPlayers.slice(0, maxPlayers).map((player) => ({
        name: player.name,
        difficulty: player.difficulty ?? "easy",
      }));
    }

    if (typeof aiPlayers === "number" && aiPlayers > 0) {
      return Array.from({ length: Math.min(aiPlayers, maxPlayers) }, () => ({
        difficulty: "easy",
      }));
    }

    return [];
  }

  private pickAllowedValue<const T extends number>(
    value: number | undefined,
    allowed: readonly T[],
    fallback: T
  ): T {
    return allowed.includes(value as T) ? (value as T) : fallback;
  }

  private toPlainState(): GameState {
    const orderedPlayers = this.state.turnOrder
      .map((playerId) => this.state.players.get(playerId))
      .filter((player): player is PlayerSchema => Boolean(player));

    const currentTurnIndex = Math.max(
      0,
      orderedPlayers.findIndex((player) => player.id === this.state.currentTurnPlayerId)
    );

    const players: Player[] = orderedPlayers.map((player) => ({
      id: player.id,
      name: player.name,
      color: player.color,
      isAI: player.isAI,
      aiDifficulty: player.aiDifficulty
        ? (player.aiDifficulty as AIDifficulty)
        : undefined,
      connected: player.connected,
      ready: player.ready,
      score: player.score,
    }));

    return {
      phase: this.state.phase as GameState["phase"],
      stars: this.state.stars.map((star) => ({
        id: star.id,
        x: star.x,
        y: star.y,
        connectionCount: star.connectionCount,
      })),
      edges: this.state.edges.map((edge) => ({
        id: edge.id,
        starA: edge.starA,
        starB: edge.starB,
        placedBy: edge.placedBy,
        turnNumber: edge.turnNumber,
      })),
      triangles: this.state.triangles.map((triangle) => ({
        id: triangle.id,
        stars: [triangle.star0, triangle.star1, triangle.star2],
        edges: [triangle.edge0, triangle.edge1, triangle.edge2],
        owner: triangle.owner,
        area: triangle.area,
      })),
      players,
      currentTurnIndex,
      turnNumber: this.state.turnNumber,
      turnTimeLeft: this.state.turnTimeLeft,
      consecutivePasses: this.state.consecutivePasses,
      scores: Object.fromEntries(
        orderedPlayers.map((player) => [player.id, player.score])
      ),
      settings: {
        maxPlayers: this.state.settings.maxPlayers as GameSettings["maxPlayers"],
        starCount: this.state.settings.starCount as GameSettings["starCount"],
        turnTimeSeconds: this.state.settings.turnTimeSeconds as GameSettings["turnTimeSeconds"],
        fieldWidth: DEFAULT_SETTINGS.fieldWidth,
        fieldHeight: DEFAULT_SETTINGS.fieldHeight,
      },
    };
  }

  private syncFromPlainState(state: GameState) {
    this.state.phase = state.phase;
    this.state.turnNumber = state.turnNumber;
    this.state.turnTimeLeft = state.turnTimeLeft;
    this.state.consecutivePasses = state.consecutivePasses;
    this.state.currentTurnPlayerId = state.players[state.currentTurnIndex]?.id ?? "";

    const players = new MapSchema<PlayerSchema>();
    state.players.forEach((player) => {
      const playerSchema = new PlayerSchema();
      playerSchema.id = player.id;
      playerSchema.name = player.name;
      playerSchema.color = player.color;
      playerSchema.isAI = player.isAI;
      playerSchema.aiDifficulty = player.aiDifficulty ?? "";
      playerSchema.connected = player.connected;
      playerSchema.ready = player.ready;
      playerSchema.score = state.scores[player.id] ?? 0;
      players.set(player.id, playerSchema);
    });
    this.state.players = players;

    this.state.turnOrder = new ArraySchema<string>(...state.players.map((player) => player.id));

    this.state.stars = new ArraySchema<StarSchema>(
      ...state.stars.map((star) => {
        const starSchema = new StarSchema();
        starSchema.id = star.id;
        starSchema.x = star.x;
        starSchema.y = star.y;
        starSchema.connectionCount = star.connectionCount;
        return starSchema;
      })
    );

    this.state.edges = new ArraySchema<EdgeSchema>(
      ...state.edges.map((edge) => {
        const edgeSchema = new EdgeSchema();
        edgeSchema.id = edge.id;
        edgeSchema.starA = edge.starA;
        edgeSchema.starB = edge.starB;
        edgeSchema.placedBy = edge.placedBy;
        edgeSchema.turnNumber = edge.turnNumber;
        return edgeSchema;
      })
    );

    this.state.triangles = new ArraySchema<TriangleSchema>(
      ...state.triangles.map((triangle) => {
        const triangleSchema = new TriangleSchema();
        triangleSchema.id = triangle.id;
        triangleSchema.star0 = triangle.stars[0];
        triangleSchema.star1 = triangle.stars[1];
        triangleSchema.star2 = triangle.stars[2];
        triangleSchema.edge0 = triangle.edges[0];
        triangleSchema.edge1 = triangle.edges[1];
        triangleSchema.edge2 = triangle.edges[2];
        triangleSchema.owner = triangle.owner;
        triangleSchema.area = triangle.area;
        return triangleSchema;
      })
    );
  }

  private getNextAvailableColor() {
    const usedColors = new Set(
      Array.from(this.state.players.values()).map((player) => player.color)
    );

    return (
      PLAYER_COLORS.find((color) => !usedColors.has(color)) ??
      PLAYER_COLORS[this.state.players.size % PLAYER_COLORS.length]
    );
  }

  private removeTurnOrderEntry(playerId: string) {
    const nextTurnOrder = this.state.turnOrder.filter((id) => id !== playerId);
    this.state.turnOrder = new ArraySchema<string>(...nextTurnOrder);
  }
}

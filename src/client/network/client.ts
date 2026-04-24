import { Client, JoinOptions, Room } from '@colyseus/sdk';
import { GameStateSchema } from '../../server/schema/GameState';
import { useGameStore } from '../store/gameStore';

const getEndpoint = () => {
  const envUrl = process.env.NEXT_PUBLIC_COLYSEUS_URL?.trim().replace(/\/+$/, '');
  if (envUrl) return envUrl;
  if (typeof window !== 'undefined') {
    const scheme = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${scheme}//${window.location.hostname}:2567`;
  }
  return 'ws://localhost:2567';
};

export const colyseusClient = new Client(getEndpoint());

let currentRoom: Room<GameStateSchema> | null = null;

export const joinOrCreateRoom = async (roomName: string, options: JoinOptions) => {
  try {
    const room = await colyseusClient.joinOrCreate<GameStateSchema>(roomName, options);
    setupRoom(room);
    return room;
  } catch (e) {
    console.error('Join/Create error', e);
    throw e;
  }
};

export const createRoom = async (roomName: string, options: JoinOptions) => {
  try {
    const room = await colyseusClient.create<GameStateSchema>(roomName, options);
    setupRoom(room);
    return room;
  } catch (e) {
    console.error("Create error", e);
    throw e;
  }
};

const RECONNECT_TOKEN_KEY = 'tricon_reconnect_token';

const saveReconnectToken = (room: Room<GameStateSchema>) => {
  try {
    sessionStorage.setItem(RECONNECT_TOKEN_KEY, JSON.stringify({
      token: room.reconnectionToken,
      roomId: room.roomId,
    }));
  } catch {}
};

const clearReconnectToken = () => {
  try { sessionStorage.removeItem(RECONNECT_TOKEN_KEY); } catch {}
};

const getReconnectToken = (roomId: string): string | null => {
  try {
    const raw = sessionStorage.getItem(RECONNECT_TOKEN_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data.roomId === roomId ? data.token : null;
  } catch { return null; }
};

export const reconnectRoom = async (roomId: string) => {
  const token = getReconnectToken(roomId);
  if (!token) throw new Error('No reconnection token');
  const room = await colyseusClient.reconnect<GameStateSchema>(token);
  setupRoom(room);
  return room;
};

export const joinRoomById = async (roomId: string, options?: JoinOptions) => {
  try {
    const room = await colyseusClient.joinById<GameStateSchema>(roomId, options);
    setupRoom(room);
    return room;
  } catch (e) {
    console.error('Join error', e);
    throw e;
  }
};

const setupRoom = (room: Room<GameStateSchema>) => {
  currentRoom = room;
  const store = useGameStore.getState();
  
  store.setMyPlayerId(room.sessionId);
  store.setRoomId(room.roomId);
  saveReconnectToken(room);

  // Initial state setup
  room.onStateChange.once((state) => {
    useGameStore.getState().updateFromServer(state);
  });

  // Listen to state changes
  room.onStateChange((state) => {
    useGameStore.getState().updateFromServer(state);
  });

  // Handle messages
  room.onMessage("game_finished", (message) => {
    useGameStore.getState().updateGameResult(message);
  });

  room.onMessage("error", (message) => {
    console.error("Game error:", message);
  });

  room.onLeave((code) => {
    console.log("Left room", code);
    clearReconnectToken();
    useGameStore.getState().resetGame();
    currentRoom = null;
  });
};

let pendingLeaveTimer: ReturnType<typeof setTimeout> | null = null;

export const leaveRoom = () => {
  cancelPendingLeave();
  if (currentRoom) {
    clearReconnectToken();
    currentRoom.leave();
    currentRoom = null;
  }
};

/**
 * Schedule a deferred leave — gives React Strict Mode's remount
 * a chance to cancel before actually disconnecting.
 */
export const leaveRoomDeferred = (delayMs = 10000) => {
  cancelPendingLeave();
  pendingLeaveTimer = setTimeout(() => {
    pendingLeaveTimer = null;
    leaveRoom();
  }, delayMs);
};

export const cancelPendingLeave = () => {
  if (pendingLeaveTimer !== null) {
    clearTimeout(pendingLeaveTimer);
    pendingLeaveTimer = null;
  }
};

export const sendReady = () => {
  currentRoom?.send('ready');
};

export const sendPlaceEdge = (starA: number, starB: number) => {
  currentRoom?.send('place_edge', { starA, starB });
};

export const sendPass = () => {
  currentRoom?.send('pass');
};

export const getCurrentRoom = () => currentRoom;

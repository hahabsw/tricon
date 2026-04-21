import { create } from 'zustand';
import { GamePhase, Star, Edge, Triangle, Player, GameSettings } from '../../game/state';
import { GameStateSchema, StarSchema, EdgeSchema, TriangleSchema, PlayerSchema } from '../../server/schema/GameState';

export interface UIState {
  myPlayerId: string;
  selectedStar: number | null;
  hoveredStar: number | null;
  roomId: string | null;
}

export interface GameStoreState extends UIState {
  phase: GamePhase;
  stars: Star[];
  edges: Edge[];
  triangles: Triangle[];
  players: Record<string, Player>;
  turnOrder: string[];
  currentTurnPlayerId: string;
  turnNumber: number;
  turnTimeLeft: number;
  consecutivePasses: number;
  settings: GameSettings;
  gameResult: any | null; // From custom messages
  
  // Actions
  setMyPlayerId: (id: string) => void;
  setRoomId: (id: string) => void;
  selectStar: (starId: number | null) => void;
  setHoveredStar: (starId: number | null) => void;
  updateFromServer: (state: GameStateSchema) => void;
  updateGameResult: (result: any) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStoreState>((set) => ({
  myPlayerId: '',
  roomId: null,
  selectedStar: null,
  hoveredStar: null,
  
  phase: 'waiting',
  stars: [],
  edges: [],
  triangles: [],
  players: {},
  turnOrder: [],
  currentTurnPlayerId: '',
  turnNumber: 0,
  turnTimeLeft: 30,
  consecutivePasses: 0,
  settings: {
    maxPlayers: 2,
    starCount: 40,
    turnTimeSeconds: 30,
    fieldWidth: 1,
    fieldHeight: 1
  },
  gameResult: null,

  setMyPlayerId: (id) => set({ myPlayerId: id }),
  setRoomId: (id) => set({ roomId: id }),
  selectStar: (starId) => set({ selectedStar: starId }),
  setHoveredStar: (starId) => set({ hoveredStar: starId }),
  
  updateGameResult: (result) => set({ gameResult: result }),
  
  resetGame: () => set({
    phase: 'waiting',
    stars: [],
    edges: [],
    triangles: [],
    players: {},
    turnOrder: [],
    currentTurnPlayerId: '',
    turnNumber: 0,
    turnTimeLeft: 30,
    consecutivePasses: 0,
    selectedStar: null,
    hoveredStar: null,
    gameResult: null
  }),

  updateFromServer: (state) => {
    // Map schema arrays to basic arrays for easier React rendering
    const mappedStars = Array.from(state.stars || []).map((s: StarSchema) => ({
      id: s.id,
      x: s.x,
      y: s.y,
      connectionCount: s.connectionCount
    }));
    
    const mappedEdges = Array.from(state.edges || []).map((e: EdgeSchema) => ({
      id: e.id,
      starA: e.starA,
      starB: e.starB,
      placedBy: e.placedBy,
      turnNumber: e.turnNumber
    }));
    
    const mappedTriangles = Array.from(state.triangles || []).map((t: TriangleSchema) => ({
      id: t.id,
      stars: [t.star0, t.star1, t.star2] as [number, number, number],
      edges: [t.edge0, t.edge1, t.edge2] as [number, number, number],
      owner: t.owner,
      area: t.area
    }));
    
    const mappedPlayers: Record<string, Player> = {};
    if (state.players) {
      state.players.forEach((p: PlayerSchema, key: string) => {
        mappedPlayers[key] = {
          id: p.id,
          name: p.name,
          color: p.color,
          isAI: p.isAI,
          connected: p.connected,
          ready: p.ready,
          score: p.score,
        };
      });
    }

    set({
      phase: state.phase as GamePhase,
      stars: mappedStars,
      edges: mappedEdges,
      triangles: mappedTriangles,
      players: mappedPlayers,
      turnOrder: Array.from(state.turnOrder || []),
      currentTurnPlayerId: state.currentTurnPlayerId,
      turnNumber: state.turnNumber,
      turnTimeLeft: state.turnTimeLeft,
      consecutivePasses: state.consecutivePasses,
      settings: {
        maxPlayers: state.settings?.maxPlayers as 2|3|4 || 2,
        starCount: state.settings?.starCount as 30|40|50 || 40,
        turnTimeSeconds: state.settings?.turnTimeSeconds as 15|30|60 || 30,
        fieldWidth: 1,
        fieldHeight: 1
      }
    });
  }
}));

import { Schema, MapSchema, ArraySchema, type } from "@colyseus/schema";

export class StarSchema extends Schema {
  @type("uint16") id: number = 0;
  @type("float32") x: number = 0;
  @type("float32") y: number = 0;
  @type("uint8") connectionCount: number = 0;
}

export class EdgeSchema extends Schema {
  @type("uint16") id: number = 0;
  @type("uint16") starA: number = 0;
  @type("uint16") starB: number = 0;
  @type("string") placedBy: string = "";
  @type("uint16") turnNumber: number = 0;
}

export class TriangleSchema extends Schema {
  @type("uint16") id: number = 0;
  @type("uint16") star0: number = 0;
  @type("uint16") star1: number = 0;
  @type("uint16") star2: number = 0;
  @type("uint16") edge0: number = 0;
  @type("uint16") edge1: number = 0;
  @type("uint16") edge2: number = 0;
  @type("string") owner: string = "";
  @type("float32") area: number = 0;
}

export class PlayerSchema extends Schema {
  @type("string") id: string = "";
  @type("string") name: string = "";
  @type("string") color: string = "";
  @type("boolean") isAI: boolean = false;
  @type("string") aiDifficulty: string = "";
  @type("boolean") connected: boolean = true;
  @type("boolean") ready: boolean = false;
  @type("float32") score: number = 0;
}

export class GameSettingsSchema extends Schema {
  @type("uint8") maxPlayers: number = 2;
  @type("uint8") starCount: number = 40;
  @type("uint8") turnTimeSeconds: number = 20;
}

export class GameStateSchema extends Schema {
  @type("string") phase: string = "waiting";
  @type("boolean") isPrivate: boolean = false;
  @type("string") currentTurnPlayerId: string = "";
  @type("uint16") turnNumber: number = 0;
  @type("uint8") turnTimeLeft: number = 20;
  @type("uint8") consecutivePasses: number = 0;

  @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();
  @type([StarSchema]) stars = new ArraySchema<StarSchema>();
  @type([EdgeSchema]) edges = new ArraySchema<EdgeSchema>();
  @type([TriangleSchema]) triangles = new ArraySchema<TriangleSchema>();
  @type(["string"]) turnOrder = new ArraySchema<string>();
  @type(GameSettingsSchema) settings = new GameSettingsSchema();
}

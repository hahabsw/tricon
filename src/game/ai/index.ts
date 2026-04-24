import type { AIDifficulty, GameState } from "../state";
import { chooseMove as chooseEasy } from "./easy";
import { chooseMove as chooseHard } from "./hard";
import { chooseMove as chooseNormal } from "./normal";

export function chooseMove(
  state: GameState,
  difficulty: AIDifficulty = "easy"
): [number, number] | null {
  switch (difficulty) {
    case "hard":
      return chooseHard(state);
    case "normal":
      return chooseNormal(state);
    case "easy":
    default:
      return chooseEasy(state);
  }
}

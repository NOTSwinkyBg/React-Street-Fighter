import { GROUND_Y, JUMP_FORCE, MOVEMENT_SPEED, PUNCH_COOLDOWN } from "../types/constants";
import type { Fighter } from "../types/fighter";

const keysDown: { [key: string]: boolean } = {};

export const InputSystem = (entities: any, { input }: any) => {
  // 1. Събираме информация за натиснати клавиши
  input.forEach((e: any) => {
    if (e.name === "onKeyDown") keysDown[e.payload.key.toLowerCase()] = true;
    if (e.name === "onKeyUp") keysDown[e.payload.key.toLowerCase()] = false;
  });

  const p1: Fighter = entities.player1.fighter;
  const p2: Fighter = entities.player2.fighter;

  // 2. Обработваме движението за двамата играчи
  [p1, p2].forEach(p => {
    // Движение наляво/надясно
    if (keysDown[p.controls.left]) p.vx = -MOVEMENT_SPEED;
    else if (keysDown[p.controls.right]) p.vx = MOVEMENT_SPEED;
    else p.vx = 0; // Спираме, ако няма натиснат клавиш

    // Скок (само ако сме на земята)
    if (keysDown[p.controls.jump] && p.y >= GROUND_Y) {
      p.vy = JUMP_FORCE;
    }

    // Удар (Ако не удряме в момента)
    if (keysDown[p.controls.punch] && p.punchTimer === 0) {
      p.isPunching = true;
      p.punchTimer = PUNCH_COOLDOWN;
    }
  });

  return entities;
};
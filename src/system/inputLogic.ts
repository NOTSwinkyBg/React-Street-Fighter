import { GROUND_Y, JUMP_FORCE, MOVEMENT_SPEED, PUNCH_COOLDOWN } from "../types/constants";
import type { Fighter } from "../types/fighter";

const keysDown: { [key: string]: boolean } = {};

export const resetKeys = () => {
  Object.keys(keysDown).forEach(key => delete keysDown[key]);
};

export const InputSystem = (entities: any, { input }: any) => {
  // 1. Събираме информация за натиснати клавиши
  input.forEach((e: any) => {
    if (e.name === "onKeyDown") keysDown[e.payload.key.toLowerCase()] = true;
    if (e.name === "onKeyUp") keysDown[e.payload.key.toLowerCase()] = false;
  });

  // 2. Вземаме информация за играта и двамата бойци
  const { mode, localPlayerId } = entities.gameInfo;
  const p1: Fighter = entities.player1.fighter;
  const p2: Fighter = entities.player2.fighter;

  // 3. Функция за обработка на локален вход 
  const processLocalInput = (p: Fighter) => {
      if (keysDown[p.controls.left]) p.vx = -MOVEMENT_SPEED;
      else if (keysDown[p.controls.right]) p.vx = MOVEMENT_SPEED;
      else p.vx = 0;

      if (keysDown[p.controls.jump] && p.y >= GROUND_Y) p.vy = JUMP_FORCE;
      if (keysDown[p.controls.punch] && p.punchTimer === 0) {
        p.isPunching = true; p.punchTimer = PUNCH_COOLDOWN;
      }
  };

  if (mode === 'local') {
      processLocalInput(p1);
      processLocalInput(p2);
  } else if (mode === 'ai') {
      processLocalInput(p1); // P2 се управлява от AISystem
  } else if (mode === 'online') {
      // Обработваме само нашия играч
      if (localPlayerId === 'player1') processLocalInput(p1);
      if (localPlayerId === 'player2') processLocalInput(p2);
  }

  return entities;
};
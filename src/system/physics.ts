import { GRAVITY, GROUND_Y } from "../types/constants";
import type { Fighter } from "../types/fighter";

export const PhysicsSystem = (entities: any) => {
  const p1: Fighter = entities.player1.fighter;
  const p2: Fighter = entities.player2.fighter;

  [p1, p2].forEach(p => {
    // 1. Прилагаме Гравитация
    p.vy += GRAVITY;
    p.y += p.vy;

    // 2. Колизия с пода
    if (p.y > GROUND_Y) {
      p.y = GROUND_Y;
      p.vy = 0;
    }

    // В онлайн режим не местим локално другия играч
    if (entities.gameInfo.mode === 'online' && entities.gameInfo.localPlayerId !== p.id) return;

    // 3. Местим героя по X
    p.x += p.vx;

    // 4. Ограничаване в екрана (Екранът е широк около 800px)
    if (p.x < 0) p.x = 0;
    if (p.x > 836) p.x = 836; // Спрямо ширината на контейнера
  });

  // 5. Винаги се обръщат един към друг
  if (p1.x < p2.x) {
    p1.facing = 1;
    p2.facing = -1;
  } else {
    p1.facing = -1;
    p2.facing = 1;
  }

  return entities;
};
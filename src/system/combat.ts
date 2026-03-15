import { HIT_REACH, PUNCH_COOLDOWN, PUNCH_DAMAGE } from "../types/constants";
import type { Fighter } from "../types/fighter";

export const CombatSystem = (entities: any, { dispatch }: any) => {
  const p1: Fighter = entities.player1.fighter;
  const p2: Fighter = entities.player2.fighter;

  [p1, p2].forEach(attacker => {
    if (attacker.punchTimer > 0) {
      attacker.punchTimer--; // Намаляваме таймера на удара

      // Махаме картинката на юмрука по средата на анимацията
      if (attacker.punchTimer < PUNCH_COOLDOWN / 2) {
        attacker.isPunching = false;
      }

      // В онлайн режим само локалният играч може да нанася удари, за да избегнем проблеми със синхронизацията
      const isLocal = entities.gameInfo.mode !== 'online' || entities.gameInfo.localPlayerId === attacker.id;

      // Проверяваме за удар (само в първия кадър на удара)
      if (attacker.punchTimer === PUNCH_COOLDOWN - 1 && isLocal) {
        const defender = attacker.id === 'player1' ? p2 : p1;
        
        // Разстояние по X между двамата
        const distanceX = Math.abs(attacker.x - defender.x);
        // Разстояние по Y (не можеш да удариш някой, който е скочил високо)
        const distanceY = Math.abs(attacker.y - defender.y);

        // Хитбокс логика
        if (distanceX < HIT_REACH && distanceY < attacker.height) {
          defender.health -= PUNCH_DAMAGE;
          
          // Изпращаме събитие към React, за да обнови Health Bar-овете
          dispatch({ type: 'update-health', p1Health: p1.health, p2Health: p2.health });

          // Ефект на отблъскване (Knockback) при удар
          defender.x += attacker.facing * 30;

          if (defender.health <= 0) {
            dispatch({ type: 'game-over', winner: attacker.id });
          }
        }
      }
    }
  });

  return entities;
};
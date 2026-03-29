import { HIT_REACH, PUNCH_COOLDOWN, PUNCH_DAMAGE } from "../types/constants";
import type { Fighter } from "../types/fighter";

export const CombatSystem = (entities: any, { dispatch }: any) => {
  const p1: Fighter = entities.player1.fighter;
  const p2: Fighter = entities.player2.fighter;

  [p1, p2].forEach(attacker => {
    if (attacker.punchTimer > 0) {
      attacker.punchTimer--;
      if (attacker.punchTimer < PUNCH_COOLDOWN / 2) attacker.isPunching = false;

      // Само този, който играе на компютъра, изчислява своите удари
      const isLocal = entities.gameInfo.mode !== 'online' || entities.gameInfo.localPlayerId === attacker.id;

      if (attacker.punchTimer === PUNCH_COOLDOWN - 1 && isLocal) {
        const defender = attacker.id === 'player1' ? p2 : p1;
        const distanceX = Math.abs(attacker.x - defender.x);
        const distanceY = Math.abs(attacker.y - defender.y);

        // УДАР!
        if (distanceX < HIT_REACH && distanceY < attacker.height) {
          defender.health -= PUNCH_DAMAGE;
          defender.x += attacker.facing * 30; // Knockback
          
          dispatch({ type: 'update-health', p1Health: p1.health, p2Health: p2.health });
          
          // НОВО: Ако играем онлайн, изпращаме специално съобщение "УДАРИХ ТЕ!" по мрежата
          if (entities.gameInfo.mode === 'online' && entities.gameInfo.conn) {
              entities.gameInfo.conn.send({ type: 'HIT', damage: PUNCH_DAMAGE, facing: attacker.facing });
          }

          if (defender.health <= 0) dispatch({ type: 'game-over', winner: attacker.id });
        }
      }
    }
  });
  return entities;
};
import { GROUND_Y, HIT_REACH, JUMP_FORCE, MOVEMENT_SPEED, PUNCH_COOLDOWN } from "../types/constants";
import type { Fighter } from "../types/fighter";

export const AISystem = (entities: any, { time }: any) => {
    if (entities.gameInfo.mode !== 'ai') return entities;
    
    const p1: Fighter = entities.player1.fighter;
    const ai: Fighter = entities.player2.fighter;

    if (!ai.lastThink) ai.lastThink = 0;
    
    // AI "мисли" на всеки 150ms (за да не е непобедим)
    if (time.current - ai.lastThink > 150) {
        ai.lastThink = time.current;
        const dist = p1.x - ai.x;
        
        ai.vx = 0;
        if (Math.abs(dist) > HIT_REACH - 10) {
            // Приближава се
            ai.vx = dist > 0 ? MOVEMENT_SPEED * 0.7 : -MOVEMENT_SPEED * 0.7;
        } else {
            // Близо е - Удря! (с лек шанс за пропуск)
            if (ai.punchTimer === 0 && Math.random() > 0.4) {
                ai.isPunching = true;
                ai.punchTimer = PUNCH_COOLDOWN;
            }
        }
        // Случайни скокове за объркване
        if (Math.random() > 0.95 && ai.y >= GROUND_Y) ai.vy = JUMP_FORCE;
    }
    return entities;
};
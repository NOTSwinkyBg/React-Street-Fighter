import { PUNCH_COOLDOWN } from "../types/constants";

export const NetworkSystem = (entities: any, { time, dispatch }: any) => {
    const info = entities.gameInfo;
    if (info.mode !== 'online' || !info.conn) return entities;

    const localFighter = entities[info.localPlayerId].fighter;
    const remoteId = info.localPlayerId === 'player1' ? 'player2' : 'player1';
    const remoteFighter = entities[remoteId].fighter;

    // Изпращаме данни директно по P2P връзката на всеки 30ms (Супер бързо!)
    if (!info.lastSync) info.lastSync = 0;
    if (time.current - info.lastSync > 30) {
        info.lastSync = time.current;
        info.conn.send({
            x: localFighter.x, y: localFighter.y, 
            isPunching: localFighter.isPunching, health: localFighter.health, facing: localFighter.facing
        });
    }

    // Четем данните на другия от Reference обекта, за да не бавим React
    const remoteData = info.remoteStateRef.current;
    if (remoteData) {
        remoteFighter.x = remoteData.x;
        remoteFighter.y = remoteData.y;
        if (remoteData.isPunching && remoteFighter.punchTimer === 0) {
            remoteFighter.isPunching = true;
            remoteFighter.punchTimer = PUNCH_COOLDOWN;
        }
        remoteFighter.facing = remoteData.facing;
        
        // Синхронизираме кръвта, ако има разминаване
        if (remoteFighter.health !== remoteData.health) {
             remoteFighter.health = remoteData.health;
             dispatch({ type: 'force-health-update', p1: entities.player1.fighter.health, p2: entities.player2.fighter.health });
        }
    }

    return entities;
};
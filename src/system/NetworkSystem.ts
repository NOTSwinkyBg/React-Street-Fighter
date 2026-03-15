import { PUNCH_COOLDOWN } from "../types/constants";

export const NetworkSystem = (entities: any, { time }: any) => {
    const info = entities.gameInfo;
    if (info.mode !== 'online' || !info.matchId) return entities;

    const localFighter = entities[info.localPlayerId].fighter;
    const remoteId = info.localPlayerId === 'player1' ? 'player2' : 'player1';
    const remoteFighter = entities[remoteId].fighter;

    // Изпращаме нашите данни на всеки 100ms
    if (!info.lastSync) info.lastSync = 0;
    if (time.current - info.lastSync > 100) {
        info.lastSync = time.current;
        if (info.syncDoc) {
            info.syncDoc({
                x: localFighter.x, y: localFighter.y, 
                isPunching: localFighter.isPunching, health: localFighter.health, facing: localFighter.facing
            });
        }
    }

    // Четем данните на другия (които React компонента е записал в info.remoteState)
    if (info.remoteState) {
        remoteFighter.x = info.remoteState.x;
        remoteFighter.y = info.remoteState.y;
        if (info.remoteState.isPunching && remoteFighter.punchTimer === 0) {
            remoteFighter.isPunching = true;
            remoteFighter.punchTimer = PUNCH_COOLDOWN;
        }
        // За да избегнем десинхронизация на кръвта
        remoteFighter.health = info.remoteState.health;
        remoteFighter.facing = info.remoteState.facing;
    }

    return entities;
};
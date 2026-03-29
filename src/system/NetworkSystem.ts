import { PUNCH_COOLDOWN } from "../types/constants";

export const NetworkSystem = (entities: any, { time, dispatch }: any) => {
    const info = entities.gameInfo;
    if (info.mode !== 'online' || !info.conn) return entities;

    const localFighter = entities[info.localPlayerId].fighter;
    const remoteId = info.localPlayerId === 'player1' ? 'player2' : 'player1';
    const remoteFighter = entities[remoteId].fighter;

    // 1. ОБРАБОТВАМЕ ОПАШКАТА ОТ УДАРИ (Ако са ни ударили по мрежата)
    const hitQueue = info.hitQueueRef.current;
    while(hitQueue.length > 0) {
        const hit = hitQueue.shift(); // Взимаме първия удар
        localFighter.health -= hit.damage; // Сваляме си кръвта
        localFighter.x += hit.facing * 30; // Отхвърчаме назад
        
        dispatch({ type: 'force-health-update', p1: entities.player1.fighter.health, p2: entities.player2.fighter.health });
        if (localFighter.health <= 0) dispatch({ type: 'game-over', winner: remoteId });
    }

    // 2. ИЗПРАЩАМЕ НАШИТЕ КООРДИНАТИ
    if (!info.lastSync) info.lastSync = 0;
    if (time.current - info.lastSync > 30) {
        info.lastSync = time.current;
        info.conn.send({
            x: localFighter.x, y: localFighter.y, 
            isPunching: localFighter.isPunching, health: localFighter.health, facing: localFighter.facing
        });
    }

    // 3. ЧЕТЕМ КООРДИНАТИТЕ НА ДРУГИЯ ИГРАЧ
    const remoteData = info.remoteStateRef.current;
    if (remoteData) {
        remoteFighter.x = remoteData.x;
        remoteFighter.y = remoteData.y;
        if (remoteData.isPunching && remoteFighter.punchTimer === 0) {
            remoteFighter.isPunching = true;
            remoteFighter.punchTimer = PUNCH_COOLDOWN;
        }
        remoteFighter.facing = remoteData.facing;
        
        // ОПРАВЕНО: Приемаме чуждата кръв САМО ако е по-малка от текущата! 
        // Това предотвратява "връщането" на кръвта при лаг.
        if (remoteData.health < remoteFighter.health) {
             remoteFighter.health = remoteData.health;
             dispatch({ type: 'force-health-update', p1: entities.player1.fighter.health, p2: entities.player2.fighter.health });
        }
    }

    return entities;
};
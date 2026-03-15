import { useEffect, useRef, useState } from "react";
import { GROUND_Y } from "./types/constants";
import { FighterRenderer } from "./components/FighterRenderer";
import { GameEngine } from 'react-game-engine';
import { InputSystem } from "./system/inputLogic";
import { PhysicsSystem } from "./system/physics";
import { CombatSystem } from "./system/combat";
import type { PlayerId, Screen, GameMode } from "./types/fighter";
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken } from "firebase/auth";
import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";
import { APP_ID, auth, db } from "./types/firebase";
import { AISystem } from "./system/aiSystem";
import { NetworkSystem } from "./system/NetworkSystem";

declare global {
  var __firebase_config: string | undefined;
  var __app_id: string | undefined;
  var __initial_auth_token: string | undefined;
}

export default function StreetFighter() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('local');

  const [healthInfo, setHealthInfo] = useState({ p1: 100, p2: 100 });
  const [winner, setWinner] = useState<string | null>(null);
  //const [isRunning, setIsRunning] = useState(true); МАХАМЕ, защото вече спираме играта чрез наличието на победител (winner)

  // Онлайн състояния
  const [user, setUser] = useState<any>(null);
  const [matchId, setMatchId] = useState('');
  const [localPlayerRole, setLocalPlayerRole] = useState<PlayerId>('player1');
  const [remoteState, setRemoteState] = useState<any>(null);

  const engineRef = useRef<any>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) { console.error("Firebase Auth Error", e); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- ОНЛАЙН СИНХРОНИЗАЦИЯ (Слушател) ---
  useEffect(() => {
      if (screen !== 'game' || gameMode !== 'online' || !matchId || !user) return;
      
      const remoteRole = localPlayerRole === 'player1' ? 'p2' : 'p1';
      const matchRef = doc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'matches'), matchId);

      const unsub = onSnapshot(matchRef, (snapshot) => {
          if (snapshot.exists()) {
              const data = snapshot.data();
              if (data[remoteRole]) setRemoteState(data[remoteRole]);
          }
      }, (err) => console.error("Sync error", err));

      return () => unsub();
  }, [screen, gameMode, matchId, user, localPlayerRole]);

  // Функция, която Engine-а ще ползва за да праща данни към Firebase
  const syncToCloud = async (playerData: any) => {
      if (!matchId || !user) return;
      const role = localPlayerRole === 'player1' ? 'p1' : 'p2';
      const matchRef = doc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'matches'), matchId);
      await setDoc(matchRef, { [role]: playerData }, { merge: true });
  };

  // Първоначалните обекти (Entities)
  const setupEntities = () => ({
    //NEW
    gameInfo: { 
        mode: gameMode, 
        localPlayerId: localPlayerRole, 
        matchId: matchId,
        syncDoc: syncToCloud,
        remoteState: remoteState 
    },
    player1: {
      fighter: {
        id: 'player1', x: 150, y: GROUND_Y, width: 60, height: 100,
        vx: 0, vy: 0, health: 100, isPunching: false, punchTimer: 0, facing: 1, color: '#3b82f6', // Син
        controls: { left: 'a', right: 'd', jump: 'w', punch: ' ' }
      },
      renderer: <FighterRenderer />
    },
    player2: {
      fighter: {
        id: 'player2', x: 600, y: GROUND_Y, width: 60, height: 100,
        vx: 0, vy: 0, health: 100, isPunching: false, punchTimer: 0, facing: -1, color: '#ef4444', // Червен
        controls: { left: 'arrowleft', right: 'arrowright', jump: 'arrowup', punch: 'enter' }
      },
      renderer: <FighterRenderer />
    }
  });

  useEffect(() => {
      if (engineRef.current && remoteState) {
          engineRef.current.swap({
              ...setupEntities(),
              gameInfo: { ...setupEntities().gameInfo, remoteState }
          });
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteState]);

  // Обработка на събития от Системите
  const onEvent = (e: any) => {
    if (e.type === 'update-health') {
      setHealthInfo({ p1: e.p1Health, p2: e.p2Health });
    } else if (e.type === 'game-over') {
      setWinner(e.winner === 'player1' ? 'ИГРАЧ 1 (СИН)' : 'ИГРАЧ 2 (ЧЕРВЕН)');
    }
  };

  const startGame = (mode: GameMode, role: PlayerId = 'player1') => {
    setGameMode(mode);
    setLocalPlayerRole(role);
    setHealthInfo({ p1: 100, p2: 100 });
    setWinner(null);
    setScreen('game');
  };

  if (screen === 'menu') {
      return (
          <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center font-sans text-white p-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
              <h1 className="text-6xl font-black text-transparent bg-clip-text bg-linear-to-r from-yellow-400 to-red-500 mb-2 drop-shadow-lg">
                  REACT FIGHTER
              </h1>
              <p className="text-gray-400 mb-12 tracking-widest uppercase">Choose your destiny</p>
              
              <div className="flex flex-col space-y-4 w-full max-w-sm">
                  <button onClick={() => startGame('ai')} className="p-4 bg-linear-to-r from-blue-600 to-blue-800 rounded-xl font-bold text-xl shadow-lg hover:scale-105 transition-transform border border-blue-400">
                      🕹️ SINGLE PLAYER (VS AI)
                  </button>
                  <button onClick={() => startGame('local')} className="p-4 bg-linear-to-r from-green-600 to-green-800 rounded-xl font-bold text-xl shadow-lg hover:scale-105 transition-transform border border-green-400">
                      👥 LOCAL CO-OP
                  </button>
                  <button onClick={() => setScreen('lobby')} className="p-4 bg-linear-to-r from-purple-600 to-purple-800 rounded-xl font-bold text-xl shadow-lg hover:scale-105 transition-transform border border-purple-400">
                      🌐 ONLINE MULTIPLAYER
                  </button>
              </div>
          </div>
      )
  }

  // --- ЕКРАН 2: ЛОБИ (ONLINE) ---
  if (screen === 'lobby') {
      return (
          <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center font-sans text-white p-4">
              <h2 className="text-4xl font-bold text-purple-400 mb-8">Онлайн Лоби</h2>
              <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 w-full max-w-md shadow-2xl">
                  
                  <div className="mb-8 border-b border-gray-700 pb-6">
                      <h3 className="font-bold mb-2">Създай Игра (Host)</h3>
                      <button onClick={() => {
                          const code = Math.random().toString(36).substring(2, 8).toUpperCase();
                          setMatchId(code); startGame('online', 'player1');
                      }} className="w-full p-3 bg-blue-600 rounded-lg font-bold hover:bg-blue-500 transition">
                          Създай Стая
                      </button>
                  </div>

                  <div>
                      <h3 className="font-bold mb-2">Влез в Игра (Join)</h3>
                      <input 
                          type="text" placeholder="Въведи Код на стаята..."
                          onChange={(e) => setMatchId(e.target.value.toUpperCase())}
                          className="w-full p-3 rounded-lg bg-gray-900 border border-gray-600 mb-3 focus:ring-purple-500 uppercase font-mono"
                      />
                      <button onClick={() => {
                          if(matchId.length > 3) startGame('online', 'player2');
                      }} className="w-full p-3 bg-purple-600 rounded-lg font-bold hover:bg-purple-500 transition">
                          Влез в Стаята
                      </button>
                  </div>
              </div>
              <button onClick={() => setScreen('menu')} className="mt-8 text-gray-400 hover:text-white underline">Върни се назад</button>
          </div>
      )
  }
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center font-sans p-4 outline-none select-none">
      
      {gameMode === 'online' && (
          <div className="absolute top-4 left-4 bg-gray-800 p-2 rounded border border-gray-700 text-xs text-gray-400">
              Код на стаята: <span className="font-bold text-white tracking-widest">{matchId}</span> 
              <span className="ml-2">| Ти си: {localPlayerRole === 'player1' ? 'P1 (Син)' : 'P2 (Червен)'}</span>
          </div>
      )}

      {/* HEALTH BARS */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-4 px-4 mt-8">
        <div className="w-1/3">
          <p className="text-blue-400 font-bold mb-1 text-lg">ИГРАЧ 1 {localPlayerRole === 'player1' && gameMode==='online' && '(ТИ)'}</p>
          <div className="w-full h-6 bg-gray-700 rounded-md border-2 border-gray-600 overflow-hidden transform rotate-180">
            <div className="h-full bg-blue-500 transition-all duration-200" style={{ width: `${Math.max(0, healthInfo.p1)}%` }}></div>
          </div>
        </div>

        <div className="text-4xl font-black text-yellow-500 italic drop-shadow-md">VS</div>

        <div className="w-1/3 text-right">
          <p className="text-red-400 font-bold mb-1 text-lg">
              {gameMode === 'ai' ? 'КОМПЮТЪР' : `ИГРАЧ 2 ${localPlayerRole === 'player2' && gameMode==='online' ? '(ТИ)' : ''}`}
          </p>
          <div className="w-full h-6 bg-gray-700 rounded-md border-2 border-gray-600 overflow-hidden">
            <div className="h-full bg-red-500 transition-all duration-200" style={{ width: `${Math.max(0, healthInfo.p2)}%` }}></div>
          </div>
        </div>
      </div>

      {/* ИГРАЛНО ПОЛЕ */}
      <div className="relative w-full max-w-4xl h-150 bg-slate-800 rounded-lg border-4 border-slate-700 shadow-2xl overflow-hidden focus:outline-none focus:ring-4 focus:ring-yellow-500/50 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
        <div className="absolute bottom-0 w-full h-25 bg-slate-900 border-t-4 border-slate-700"></div>

        <GameEngine
          ref={engineRef}
          className="w-full h-full outline-none" 
          systems={[InputSystem, AISystem, NetworkSystem, PhysicsSystem, CombatSystem]} // НОВИ СИСТЕМИ
          entities={setupEntities()} 
          running={!winner}
          onEvent={onEvent} 
        />

        {winner && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
            <h2 className="text-6xl font-black text-yellow-500 mb-2 drop-shadow-lg tracking-widest animate-pulse">K.O.</h2>
            <p className="text-3xl text-white mb-8 font-bold">{winner} ПОБЕЖДАВА!</p>
            <div className="flex gap-4">
                <button onClick={() => startGame(gameMode, localPlayerRole)} className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-lg transition-transform hover:scale-105 shadow-lg">
                    РЕВАНШ
                </button>
                <button onClick={() => setScreen('menu')} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-8 rounded-lg transition-transform hover:scale-105 shadow-lg">
                    КЪМ МЕНЮТО
                </button>
            </div>
          </div>
        )}
      </div>

      {/* ЛЕГЕНДА ЗА КОНТРОЛИТЕ */}
      <div className="flex gap-12 mt-6 text-sm text-slate-400 bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700">
          <div>
              <p className="font-bold text-blue-400 mb-2 border-b border-slate-700 pb-1">ИГРАЧ 1 (СИН)</p>
              <p><span className="text-white font-bold">W A S D</span> - Движение / Скок</p>
              <p><span className="text-white font-bold">SPACE</span> - Удар</p>
          </div>
          <div>
              <p className="font-bold text-red-400 mb-2 border-b border-slate-700 pb-1">ИГРАЧ 2 (ЧЕРВЕН)</p>
              <p><span className="text-white font-bold">СТРЕЛКИ</span> - Движение / Скок</p>
              <p><span className="text-white font-bold">ENTER</span> - Удар</p>
          </div>
      </div>

    </div>
  );
}
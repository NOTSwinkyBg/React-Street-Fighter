import { useRef, useState } from "react";
import { GROUND_Y } from "./types/constants";
import { FighterRenderer } from "./components/FighterRenderer";
import { GameEngine } from "react-game-engine";
import { InputSystem, resetKeys } from "./system/inputLogic";
import { PhysicsSystem } from "./system/physics";
import { CombatSystem } from "./system/combat";
import type { PlayerId, Screen, GameMode } from "./types/fighter";
// import {
//   onAuthStateChanged,
//   signInAnonymously,
//   signInWithCustomToken,
// } from "firebase/auth";
// import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";
// import { APP_ID, auth, db } from "./types/firebase";
import { AISystem } from "./system/aiSystem";
import { NetworkSystem } from "./system/NetworkSystem";

import { Peer } from 'peerjs';

declare global {
  var __firebase_config: string | undefined;
  var __app_id: string | undefined;
  var __initial_auth_token: string | undefined;
}

export default function StreetFighterPro() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('local');
  const [healthInfo, setHealthInfo] = useState({ p1: 100, p2: 100 });
  const [winner, setWinner] = useState<string | null>(null);
  
  // Онлайн P2P състояния
  const [peerId, setPeerId] = useState<string>('');
  const [joinId, setJoinId] = useState<string>('');
  const [connection, setConnection] = useState<any>(null);
  const [localPlayerRole, setLocalPlayerRole] = useState<PlayerId>('player1');
  const [status, setStatus] = useState<string>('');
  
  const engineRef = useRef<any>(null);
  const peerRef = useRef<any>(null);
  const remoteStateRef = useRef<any>(null); // Тук пазим данните от мрежата БЕЗ да ререндираме React!

  // Създаване на Хост (Играч 1)
  const createRoom = () => {
      setStatus('Създаване на стая...');
      const peer = new Peer();
      peer.on('open', (id) => {
          setPeerId(id);
          setStatus(`Чакаме противник... Вашият код е: ${id}`);
      });
      peer.on('connection', (conn) => {
          setStatus('Противникът се свърза! Зареждане...');
          setConnection(conn);
          
          conn.on('data', (data: any) => { remoteStateRef.current = data; });
          conn.on('open', () => { startGame('online', 'player1'); });
      });
      peerRef.current = peer;
  };

  // Влизане в стая (Играч 2)
  const joinRoom = () => {
      if (!joinId) return;
      setStatus('Свързване с хоста...');
      const peer = new Peer();
      peer.on('open', () => {
          const conn = peer.connect(joinId);
          setConnection(conn);
          
          conn.on('data', (data) => { remoteStateRef.current = data; });
          conn.on('open', () => { startGame('online', 'player2'); });
      });
      peerRef.current = peer;
  };

  const setupEntities = () => ({
    gameInfo: { 
        mode: gameMode, 
        localPlayerId: localPlayerRole, 
        conn: connection,
        remoteStateRef: remoteStateRef // Подаваме референцията директно към енджина
    },
    player1: {
      fighter: {
        id: 'player1', x: 150, y: GROUND_Y, width: 60, height: 100,
        vx: 0, vy: 0, health: 100, isPunching: false, punchTimer: 0, facing: 1, color: '#3b82f6',
        controls: { left: 'a', right: 'd', jump: 'w', punch: ' ' }
      },
      renderer: <FighterRenderer />
    },
    player2: {
      fighter: {
        id: 'player2', x: 600, y: GROUND_Y, width: 60, height: 100,
        vx: 0, vy: 0, health: 100, isPunching: false, punchTimer: 0, facing: -1, color: '#ef4444',
        controls: { left: 'arrowleft', right: 'arrowright', jump: 'arrowup', punch: 'enter' }
      },
      renderer: <FighterRenderer />
    }
  });

  const onEvent = (e: any) => {
    if (e.type === 'update-health' || e.type === 'force-health-update') {
        setHealthInfo({ p1: e.p1Health || e.p1, p2: e.p2Health || e.p2 });
    }
    else if (e.type === 'game-over') setWinner(e.winner === 'player1' ? 'ИГРАЧ 1 (СИН)' : 'ИГРАЧ 2 (ЧЕРВЕН)');
  };

  const startGame = (mode: GameMode, role: PlayerId = 'player1') => {
    setGameMode(mode);
    setLocalPlayerRole(role);
    setHealthInfo({ p1: 100, p2: 100 });
    setWinner(null);
    setScreen('game');

    resetKeys();
    if(engineRef.current) {
      engineRef.current.swap(setupEntities());
    }
  };

  // --- ЕКРАНИ ---
  if (screen === 'menu') {
      return (
          <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center font-sans text-white p-4">
              <h1 className="text-6xl font-black text-transparent bg-clip-text bg-linear-to-r from-yellow-400 to-red-500 mb-2 drop-shadow-lg">
                  REACT FIGHTER
              </h1>
              <p className="text-gray-400 mb-12 tracking-widest uppercase">P2P Edition</p>
              
              <div className="flex flex-col space-y-4 w-full max-w-sm">
                  <button onClick={() => startGame('ai')} className="p-4 bg-linear-to-r from-blue-600 to-blue-800 rounded-xl font-bold text-xl hover:scale-105 transition-transform border border-blue-400">
                      🕹️ SINGLE PLAYER (VS AI)
                  </button>
                  <button onClick={() => startGame('local')} className="p-4 bg-linear-to-r from-green-600 to-green-800 rounded-xl font-bold text-xl hover:scale-105 transition-transform border border-green-400">
                      👥 LOCAL CO-OP
                  </button>
                  <button onClick={() => { setScreen('lobby'); setStatus(''); }} className="p-4 bg-linear-to-r from-purple-600 to-purple-800 rounded-xl font-bold text-xl hover:scale-105 transition-transform border border-purple-400">
                      🌐 ONLINE MULTIPLAYER
                  </button>
              </div>
          </div>
      )
  }

  if (screen === 'lobby') {
      return (
          <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center font-sans text-white p-4">
              <h2 className="text-4xl font-bold text-purple-400 mb-4">P2P Онлайн Лоби</h2>
              
              {status && <div className="mb-6 px-4 py-2 bg-yellow-900 text-yellow-200 border border-yellow-600 rounded-lg animate-pulse">{status}</div>}

              <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 w-full max-w-md shadow-2xl">
                  <div className="mb-8 border-b border-gray-700 pb-6">
                      <h3 className="font-bold mb-2">Създай Игра (Ти си Играч 1)</h3>
                      <button onClick={createRoom} disabled={!!peerId} className="w-full p-3 bg-blue-600 rounded-lg font-bold hover:bg-blue-500 transition disabled:opacity-50">
                          Създай Стая
                      </button>
                      {peerId && (
                          <div className="mt-4 p-3 bg-gray-900 rounded text-center">
                              <p className="text-sm text-gray-400 mb-1">Кажи този код на приятел:</p>
                              <p className="font-mono text-xl text-green-400 font-bold select-all">{peerId}</p>
                          </div>
                      )}
                  </div>

                  <div>
                      <h3 className="font-bold mb-2">Влез в Игра (Ти си Играч 2)</h3>
                      <input 
                          type="text" placeholder="Въведи Кода тук..."
                          onChange={(e) => setJoinId(e.target.value)}
                          className="w-full p-3 rounded-lg bg-gray-900 border border-gray-600 mb-3 text-white focus:ring-purple-500 font-mono"
                      />
                      <button onClick={joinRoom} disabled={!joinId} className="w-full p-3 bg-purple-600 rounded-lg font-bold hover:bg-purple-500 transition disabled:opacity-50">
                          Влез в Стаята
                      </button>
                  </div>
              </div>
              <button onClick={() => {
                  if (peerRef.current) peerRef.current.destroy();
                  setScreen('menu');
              }} className="mt-8 text-gray-400 hover:text-white underline">Отмени и се върни</button>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center font-sans p-4 outline-none select-none">
      
      {gameMode === 'online' && (
          <div className="absolute top-4 left-4 bg-gray-800 p-2 rounded border border-gray-700 text-xs text-gray-400">
              <span className="text-green-400">● P2P Свързан</span> | Ти си: {localPlayerRole === 'player1' ? 'ИГРАЧ 1 (Син)' : 'ИГРАЧ 2 (Червен)'}
          </div>
      )}

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

      <div className="relative w-full max-w-4xl h-150 bg-slate-800 rounded-lg border-4 border-slate-700 shadow-2xl overflow-hidden focus:outline-none focus:ring-4 focus:ring-yellow-500/50">
        <div className="absolute bottom-0 w-full h-25 bg-slate-900 border-t-4 border-slate-700"></div>

        <GameEngine
          ref={engineRef}
          className="w-full h-full outline-none" 
          systems={[InputSystem, AISystem, NetworkSystem, PhysicsSystem, CombatSystem]} 
          entities={setupEntities()} 
          running={!winner}
          onEvent={onEvent} 
        />

        {winner && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
            <h2 className="text-6xl font-black text-yellow-500 mb-2 drop-shadow-lg tracking-widest animate-pulse">K.O.</h2>
            <p className="text-3xl text-white mb-8 font-bold">{winner} ПОБЕЖДАВА!</p>
            <div className="flex gap-4">
                <button onClick={() => setScreen('menu')} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-8 rounded-lg transition-transform hover:scale-105 shadow-lg">
                    КЪМ МЕНЮТО
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
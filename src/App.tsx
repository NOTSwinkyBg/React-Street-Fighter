import { useRef, useState } from "react";
import { GROUND_Y } from "./types/constants";
import { FighterRenderer } from "./components/FighterRenderer";
import { GameEngine } from 'react-game-engine';
import { InputSystem } from "./system/inputLogic";
import { PhysicsSystem } from "./system/physics";
import { CombatSystem } from "./system/combat";

export default function StreetFighter() {
  const [healthInfo, setHealthInfo] = useState({ p1: 100, p2: 100 });
  const [winner, setWinner] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(true);
  const engineRef = useRef<any>(null);

  // Първоначалните обекти (Entities)
  const setupEntities = () => ({
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

  // Обработка на събития от Системите
  const onEvent = (e: any) => {
    if (e.type === 'update-health') {
      setHealthInfo({ p1: e.p1Health, p2: e.p2Health });
    } else if (e.type === 'game-over') {
      setWinner(e.winner === 'player1' ? 'ИГРАЧ 1 (СИН)' : 'ИГРАЧ 2 (ЧЕРВЕН)');
      setIsRunning(false);
    }
  };

  const resetGame = () => {
    setHealthInfo({ p1: 100, p2: 100 });
    setWinner(null);
    setIsRunning(true);
    if (engineRef.current) {
        engineRef.current.swap(setupEntities());
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center font-sans p-4 outline-none select-none">
      
      {/* HEADER & HEALTH BARS */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-4 px-4">
        {/* P1 Здраве */}
        <div className="w-1/3">
          <p className="text-blue-400 font-bold mb-1 text-lg">ИГРАЧ 1</p>
          <div className="w-full h-6 bg-gray-700 rounded-md border-2 border-gray-600 overflow-hidden transform rotate-180">
            <div 
                className="h-full bg-blue-500 transition-all duration-200" 
                style={{ width: `${Math.max(0, healthInfo.p1)}%` }}
            ></div>
          </div>
        </div>

        <div className="text-4xl font-black text-yellow-500 italic drop-shadow-md">VS</div>

        {/* P2 Здраве */}
        <div className="w-1/3 text-right">
          <p className="text-red-400 font-bold mb-1 text-lg">ИГРАЧ 2</p>
          <div className="w-full h-6 bg-gray-700 rounded-md border-2 border-gray-600 overflow-hidden">
            <div 
                className="h-full bg-red-500 transition-all duration-200" 
                style={{ width: `${Math.max(0, healthInfo.p2)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* ИГРАЛНО ПОЛЕ */}
      <div className="relative w-full max-w-4xl h-150 bg-slate-800 rounded-lg border-4 border-slate-700 shadow-2xl overflow-hidden focus:outline-none focus:ring-4 focus:ring-yellow-500/50 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
        
        {/* Под (Земя) */}
        <div className="absolute bottom-0 w-full h-25 bg-slate-900 border-t-4 border-slate-700"></div>

        <GameEngine
          ref={engineRef}
          className="w-full h-full outline-none" 
          systems={[InputSystem, PhysicsSystem, CombatSystem]} // Регистрираме 3-те системи
          entities={setupEntities()} 
          running={isRunning}
          onEvent={onEvent} 
        />

        {/* GAME OVER ЕКРАН */}
        {!isRunning && winner && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
            <h2 className="text-6xl font-black text-yellow-500 mb-2 drop-shadow-lg tracking-widest animate-pulse">
                K.O.
            </h2>
            <p className="text-3xl text-white mb-8 font-bold">{winner} ПОБЕЖДАВА!</p>
            <button 
              onClick={resetGame}
              className="bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-10 rounded-lg text-xl transition-transform hover:scale-105 shadow-[0_0_20px_rgba(220,38,38,0.8)]"
            >
              РЕВАНШ
            </button>
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
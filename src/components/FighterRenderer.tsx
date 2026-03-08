import type { Fighter } from "../types/fighter";

export const FighterRenderer = (props: any) => {
  const p: Fighter = props.fighter;
  
  return (
    <div
      className="absolute flex items-center justify-center"
      style={{
        left: p.x,
        top: p.y,
        width: p.width,
        height: p.height,
        backgroundColor: p.color,
        border: '3px solid white',
        borderRadius: '8px',
        boxShadow: p.isPunching ? `0 0 20px ${p.color}` : 'none',
        transition: 'none' // Изключваме CSS анимациите, за да не бавят енджина
      }}
    >
      {/* Очички (за да знаем накъде гледа) */}
      <div 
        className="absolute top-2 flex gap-1"
        style={{ [p.facing === 1 ? 'right' : 'left']: '10px' }}
      >
        <div className="w-2 h-2 bg-white rounded-full"></div>
        <div className="w-2 h-2 bg-white rounded-full"></div>
      </div>

      {/* Юмрук (Появява се само когато isPunching е true) */}
      {p.isPunching && (
        <div
          className="absolute bg-yellow-400 border-2 border-white rounded-md z-10"
          style={{
            width: 40,
            height: 20,
            top: 20,
            // Слагаме юмрука отляво или отдясно според това накъде гледа
            [p.facing === 1 ? 'left' : 'right']: p.width - 10,
          }}
        />
      )}
    </div>
  );
};
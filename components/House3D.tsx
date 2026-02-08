
import React from 'react';

interface Props {
  isolation: 'mauvaise' | 'moyenne' | 'bonne';
  surface: number;
}

export const House3D: React.FC<Props> = ({ isolation, surface }) => {
  // Scale factor based on surface (normalized between 0.8 and 1.2)
  const scale = Math.min(1.2, Math.max(0.8, surface / 100));
  
  // Color mapping for isolation
  const colors = {
    mauvaise: {
      wall: '#f87171', // red-400
      roof: '#ef4444', // red-500
      accent: '#fee2e2', // red-100
      glow: 'rgba(239, 68, 68, 0.2)'
    },
    moyenne: {
      wall: '#fbbf24', // amber-400
      roof: '#f59e0b', // amber-500
      accent: '#fef3c7', // amber-100
      glow: 'rgba(245, 158, 11, 0.1)'
    },
    bonne: {
      wall: '#34d399', // emerald-400
      roof: '#10b981', // emerald-500
      accent: '#d1fae5', // emerald-100
      glow: 'rgba(16, 185, 129, 0.2)'
    }
  }[isolation];

  return (
    <div className="relative w-full h-48 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-100 mb-6 overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10" style={{ 
        backgroundImage: 'linear-gradient(#64748b 1px, transparent 1px), linear-gradient(90deg, #64748b 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        transform: 'skewY(-10deg)'
      }} />

      <svg 
        viewBox="0 0 200 200" 
        className="w-40 h-40 drop-shadow-2xl transition-transform duration-700 ease-out"
        style={{ transform: `scale(${scale})` }}
      >
        {/* Glow Effect */}
        <circle cx="100" cy="130" r="40" fill={colors.glow} filter="blur(20px)" />

        {/* Isometric House */}
        <g transform="translate(100, 100)">
          {/* Floor / Shadow */}
          <path d="M-60 0 L0 30 L60 0 L0 -30 Z" fill="rgba(15, 23, 42, 0.05)" />

          {/* Left Wall */}
          <path d="M-50 -10 L0 15 L0 55 L-50 30 Z" fill={colors.wall} />
          
          {/* Right Wall */}
          <path d="M50 -10 L0 15 L0 55 L50 30 Z" fill={colors.wall} className="brightness-90" />
          
          {/* Roof Left */}
          <path d="M-55 -15 L0 -45 L0 -10 L-55 20 Z" fill={colors.roof} />
          
          {/* Roof Right */}
          <path d="M55 -15 L0 -45 L0 -10 L55 20 Z" fill={colors.roof} className="brightness-90" />
          
          {/* Window Left */}
          <rect x="-35" y="5" width="15" height="15" fill={colors.accent} transform="skewY(26)" />
          
          {/* Door Right */}
          <path d="M15 22 L30 30 L30 50 L15 42 Z" fill="#475569" />

          {/* Heat loss indicators (if poor isolation) */}
          {isolation === 'mauvaise' && (
            <g className="animate-bounce">
              <path d="M-20 -50 Q-25 -60 -20 -70" stroke="#ef4444" strokeWidth="2" fill="none" opacity="0.6" />
              <path d="M0 -55 Q5 -65 0 -75" stroke="#ef4444" strokeWidth="2" fill="none" opacity="0.6" />
              <path d="M20 -50 Q15 -60 20 -70" stroke="#ef4444" strokeWidth="2" fill="none" opacity="0.6" />
            </g>
          )}

          {/* Eco particles (if good isolation) */}
          {isolation === 'bonne' && (
             <g className="animate-pulse">
               <circle cx="-30" cy="-60" r="3" fill="#10b981" opacity="0.5" />
               <circle cx="30" cy="-55" r="2" fill="#10b981" opacity="0.8" />
               <circle cx="0" cy="-70" r="4" fill="#34d399" opacity="0.4" />
             </g>
          )}
        </g>
      </svg>
      
      <div className="absolute bottom-2 right-3 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
        Aperçu thermique 3D
      </div>
    </div>
  );
};

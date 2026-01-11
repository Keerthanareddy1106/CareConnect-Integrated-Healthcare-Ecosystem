
import React, { useEffect, useState, useMemo } from 'react';
import { LatLng } from '../types';

interface MapWidgetProps {
  origin: LatLng;
  destination: LatLng;
  movingEntity?: LatLng;
  label?: string;
  isRider?: boolean;
}

const MapWidget: React.FC<MapWidgetProps> = ({ origin, destination, movingEntity, label, isRider }) => {
  const [instructionIndex, setInstructionIndex] = useState(0);
  
  const instructions = useMemo(() => [
    "Head North on Main St towards Hospital Zone",
    "Turn Left onto Hill Road in 400m",
    "Passing MediLife Pharmacy on your right",
    "Continue straight through the intersection",
    "Arriving at Destination in 200m"
  ], []);

  useEffect(() => {
    const interval = setInterval(() => {
      setInstructionIndex(prev => (prev + 1) % instructions.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [instructions.length]);

  // Calculate distance percentage for progress bar
  const progress = useMemo(() => {
    if (!movingEntity) return 0;
    const totalDist = Math.sqrt(Math.pow(destination.lat - origin.lat, 2) + Math.pow(destination.lng - origin.lng, 2));
    const currentDist = Math.sqrt(Math.pow(destination.lat - movingEntity.lat, 2) + Math.pow(destination.lng - movingEntity.lng, 2));
    return Math.max(0, Math.min(100, 100 - (currentDist / totalDist * 100)));
  }, [movingEntity, origin, destination]);

  return (
    <div className="relative w-full h-full bg-[#f1f5f9] rounded-[3.5rem] overflow-hidden border border-slate-200 shadow-inner group">
      
      {/* Dynamic Grid / Map Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      {/* Top HUD - Navigation Instructions */}
      <div className="absolute top-8 left-8 right-8 z-20 flex flex-col gap-3 pointer-events-none">
        <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-2xl flex items-center gap-6 animate-in slide-in-from-top-4 duration-500">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-bold">
            {instructionIndex % 2 === 0 ? '↱' : '↑'}
          </div>
          <div className="flex-grow">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">Upcoming Turn</p>
            <p className="text-lg font-bold tracking-tight leading-tight">{instructions[instructionIndex]}</p>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="bg-white/80 backdrop-blur-xl px-6 py-4 rounded-2xl border border-white/50 shadow-sm flex items-center gap-4">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
          <div className="flex-grow h-1.5 bg-slate-100 rounded-full overflow-hidden">
             <div 
               className="h-full bg-indigo-600 transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(79,70,229,0.5)]" 
               style={{ width: `${progress}%` }}
             ></div>
          </div>
          <span className="text-[10px] font-black text-slate-900">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Map SVG Layer */}
      <svg className="w-full h-full p-20" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>

        {/* Stylized Street Labels (Simulated) */}
        <text x="20" y="30" fontSize="2" fill="#cbd5e1" fontWeight="bold" className="uppercase tracking-widest">Hill Road Parkway</text>
        <text x="60" y="70" fontSize="2" fill="#cbd5e1" fontWeight="bold" className="uppercase tracking-widest">Hospital Bypass</text>

        {/* The Path */}
        <path 
          d={`M ${origin.lat % 1 * 800} ${origin.lng % 1 * 800} L ${destination.lat % 1 * 800} ${destination.lng % 1 * 800}`}
          stroke="url(#routeGradient)" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          fill="none"
          className="opacity-20"
        />
        
        {/* Animated Active Route */}
        <path 
          d={`M ${origin.lat % 1 * 800} ${origin.lng % 1 * 800} L ${destination.lat % 1 * 800} ${destination.lng % 1 * 800}`}
          stroke="#4f46e5" 
          strokeWidth="0.8" 
          strokeDasharray="2 2"
          fill="none"
          className="animate-[dash_20s_linear_infinite]"
        />
        
        {/* Destination Beacon */}
        <g transform={`translate(${destination.lat % 1 * 800}, ${destination.lng % 1 * 800})`}>
          <circle r="6" fill="#10b981" className="animate-ping opacity-20" />
          <circle r="3" fill="#10b981" className="shadow-lg" />
          <text y="-5" fontSize="3" textAnchor="middle" fill="#065f46" fontWeight="bold" className="uppercase tracking-tighter">Emergency Gate</text>
        </g>
        
        {/* User Entity */}
        {movingEntity && (
          <g transform={`translate(${movingEntity.lat % 1 * 800}, ${movingEntity.lng % 1 * 800})`}>
            <circle r="8" fill={isRider ? "#f59e0b" : "#4f46e5"} className="opacity-10 animate-pulse" />
            <path d="M 0 -3 L 3 3 L 0 1 L -3 3 Z" fill={isRider ? "#f59e0b" : "#4f46e5"} className="transition-transform duration-500" transform="rotate(45)" />
          </g>
        )}
      </svg>

      {/* Floating Controls */}
      <div className="absolute top-1/2 right-6 -translate-y-1/2 flex flex-col gap-4">
         <button className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-xl hover:scale-110 active:scale-95 transition-all border border-slate-100">⊕</button>
         <button className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-xl hover:scale-110 active:scale-95 transition-all border border-slate-100">⊖</button>
         <button className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-lg hover:scale-110 active:scale-95 transition-all border border-slate-100">🎯</button>
      </div>

      {/* Bottom Summary Panel */}
      <div className="absolute bottom-8 left-8 right-8 bg-white p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-50 flex flex-col md:flex-row items-center justify-between gap-8 animate-in slide-in-from-bottom-6 duration-700">
         <div className="flex items-center gap-8 w-full md:w-auto">
            <div className={`w-16 h-16 ${isRider ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'} rounded-[1.5rem] flex items-center justify-center text-3xl shadow-sm`}>
               {isRider ? '🛵' : '🏥'}
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Dynamic Arrival Prediction</p>
               <div className="flex items-baseline gap-3">
                 <p className="text-3xl font-black text-slate-900 tracking-tighter">
                   {progress > 95 ? 'Arriving' : `${Math.round(12 * (1 - progress/100))} Mins`}
                 </p>
                 <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md uppercase">Normal Traffic</span>
               </div>
               <p className="text-xs font-medium text-slate-400 mt-1">Routing via Hill Road Parkway • 2.4 km</p>
            </div>
         </div>
         
         <div className="flex items-center gap-4 w-full md:w-auto">
            <button className="flex-grow md:flex-none px-8 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all active:scale-95">
              Recenter
            </button>
            <button className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center text-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm">
              ⚠
            </button>
         </div>
      </div>

      <style>{`
        @keyframes dash {
          to { stroke-dashoffset: -100; }
        }
      `}</style>
    </div>
  );
};

export default MapWidget;

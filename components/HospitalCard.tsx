
import React from 'react';
import { Hospital } from '../types';

interface HospitalCardProps {
  hospital: Hospital;
  onBook: (h: Hospital) => void;
}

const HospitalCard: React.FC<HospitalCardProps> = ({ hospital, onBook }) => {
  const waitTime = hospital.queueLength * hospital.avgConsultationTime;
  
  return (
    <div className="bg-white rounded-[3.5rem] border border-slate-100 overflow-hidden hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] hover:border-indigo-50 transition-all duration-700 flex flex-col h-full group relative">
      <div className="relative h-60 w-full overflow-hidden">
        <img 
          src={hospital.image} 
          alt={hospital.name} 
          className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        <div className="absolute top-6 left-6 bg-white/95 backdrop-blur px-4 py-2 rounded-2xl text-[10px] font-black text-slate-900 uppercase tracking-[0.15em] shadow-lg">
          {hospital.distance} away
        </div>
        <div className="absolute bottom-6 right-6 bg-emerald-500 text-white px-4 py-1.5 rounded-2xl text-[11px] font-black shadow-xl flex items-center gap-1.5 border border-white/20">
          {hospital.rating} <span className="opacity-70 text-[10px]">★</span>
        </div>
      </div>
      
      <div className="p-10 flex flex-col flex-grow">
        <div className="mb-6">
          <h3 className="font-black text-slate-900 text-2xl tracking-tighter leading-tight mb-2 group-hover:text-indigo-600 transition-colors">{hospital.name}</h3>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{hospital.location}</p>
        </div>
        
        <div className="flex flex-wrap gap-2.5 mb-10">
          {hospital.specialties.slice(0, 3).map(s => (
            <span key={s} className="bg-slate-50 text-slate-500 border border-slate-100 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all">
              {s}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-8 border-t border-slate-50 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Live Queue</span>
              <span className={`text-[11px] font-black flex items-center gap-2 px-3 py-1.5 rounded-xl ${hospital.status === 'Open' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                <span className={`w-2 h-2 rounded-full ${hospital.status === 'Open' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                {waitTime} min Wait
              </span>
            </div>
            <div className="text-right flex flex-col">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Hospital Token</span>
              <span className="text-lg font-black text-slate-900 tracking-tight">#{hospital.currentToken}</span>
            </div>
          </div>
          
          <button 
            onClick={() => onBook(hospital)}
            className="w-full bg-slate-900 hover:bg-indigo-600 text-white py-5 rounded-[1.8rem] font-black text-[12px] uppercase tracking-[0.3em] transition-all shadow-xl active:scale-95 group/btn"
          >
            Schedule Visit <span className="inline-block group-hover/btn:translate-x-1 transition-transform ml-2">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HospitalCard;

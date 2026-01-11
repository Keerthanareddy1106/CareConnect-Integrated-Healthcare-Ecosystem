
import React from 'react';
import { Doctor } from '../types';

interface DoctorProfileProps {
  doctor: Doctor;
  onBook: (doctor: Doctor) => void;
}

const DoctorProfile: React.FC<DoctorProfileProps> = ({ doctor, onBook }) => {
  return (
    <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 flex flex-col hover:border-indigo-100 hover:shadow-[0_40px_100px_rgba(79,70,229,0.08)] transition-all group min-w-[340px] relative overflow-hidden">
      <div className="flex items-start justify-between mb-10">
        <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-5xl shadow-sm border border-slate-100 group-hover:bg-indigo-50 transition-all duration-700 group-hover:scale-105">
          👨‍⚕️
        </div>
        <div className="flex flex-col items-end">
          <div className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-3 shadow-sm">
            Clinical Verified
          </div>
          <div className="flex items-center gap-1.5 text-amber-500">
            <span className="text-base font-black tracking-tight">{doctor.rating}</span>
            <span className="text-xs">★</span>
          </div>
        </div>
      </div>

      <div className="mb-10">
        <h4 className="text-2xl font-black text-slate-900 tracking-tighter leading-tight mb-2 group-hover:text-indigo-900 transition-colors">{doctor.name}</h4>
        <p className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.2em]">{doctor.specialization}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="bg-slate-50/50 p-5 rounded-[1.8rem] border border-slate-100 group-hover:bg-white transition-all">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Experience</p>
          <p className="text-sm font-black text-slate-700 tracking-tight">{doctor.experience}</p>
        </div>
        <div className="bg-slate-50/50 p-5 rounded-[1.8rem] border border-slate-100 group-hover:bg-white transition-all">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fee</p>
          <p className="text-sm font-black text-slate-900 tracking-tight">₹{doctor.fee}</p>
        </div>
      </div>

      <button
        onClick={() => onBook(doctor)}
        className="mt-auto w-full bg-slate-900 group-hover:bg-indigo-600 text-white py-5 rounded-[1.8rem] font-black text-[12px] uppercase tracking-[0.3em] transition-all shadow-xl active:scale-95"
      >
        Book Session
      </button>

      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-1000"></div>
    </div>
  );
};

export default DoctorProfile;

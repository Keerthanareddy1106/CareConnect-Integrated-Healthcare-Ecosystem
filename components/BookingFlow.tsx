
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Hospital, Doctor } from '../types';
import { DOCTORS } from '../constants';

interface BookingFlowProps {
  hospital: Hospital;
  onConfirm: (doctor: Doctor, slot: string) => void;
  onCancel: () => void;
  initialDoctorId?: string | null;
}

const RESERVATION_TIME = 300; // 5 minutes in seconds

const BookingFlow: React.FC<BookingFlowProps> = ({ hospital, onConfirm, onCancel, initialDoctorId }) => {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(initialDoctorId || null);
  const [selectedDateIndex, setSelectedDateIndex] = useState<number>(0); // 0 = Today
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(RESERVATION_TIME);
  const [unavailableSlots, setUnavailableSlots] = useState<Set<string>>(new Set());
  const timerRef = useRef<number | null>(null);

  const activeDoctor = DOCTORS.find(d => d.id === selectedDoctorId);

  // Generate 7 days: Today, Tomorrow, and next 5 days
  const bookingDates = useMemo(() => {
    const dates = [];
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push({
        dayLabel: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
        dateNum: d.getDate(),
        month: months[d.getMonth()],
        full: d
      });
    }
    return dates;
  }, []);

  // Standard clinical hours: 9 AM - 1 PM and 3 PM - 7 PM
  const baseHours = useMemo(() => [9, 10, 11, 12, 15, 16, 17, 18], []);

  // Generate 15-minute interval slots
  const allPossibleSlots = useMemo(() => {
    const slots: string[] = [];
    baseHours.forEach(h => {
      [0, 15, 30, 45].forEach(m => {
        const modifier = h >= 12 ? 'PM' : 'AM';
        const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
        const hStr = displayH < 10 ? `0${displayH}` : `${displayH}`;
        const mStr = m < 10 ? `0${m}` : `${m}`;
        slots.push(`${hStr}:${mStr} ${modifier}`);
      });
    });
    return slots;
  }, [baseHours]);

  // Simulate "Real-time" external bookings
  useEffect(() => {
    if (!activeDoctor) return;

    // Initial random "already booked" slots for this view
    const initialBooked = new Set<string>();
    allPossibleSlots.forEach(s => {
      if (Math.random() < 0.2) initialBooked.add(s);
    });
    setUnavailableSlots(initialBooked);

    // Periodically simulate a new booking from "another user"
    const interval = setInterval(() => {
      const available = allPossibleSlots.filter(s => !initialBooked.has(s) && s !== selectedSlot);
      if (available.length > 0) {
        const randomSlot = available[Math.floor(Math.random() * available.length)];
        setUnavailableSlots(prev => new Set(prev).add(randomSlot));
      }
    }, 8000); // New booking every 8 seconds

    return () => clearInterval(interval);
  }, [activeDoctor, selectedDateIndex, allPossibleSlots]);

  const generatedSlots = useMemo(() => {
    if (!activeDoctor) return [];
    
    const now = new Date();
    const isToday = selectedDateIndex === 0;
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    return allPossibleSlots.filter(slot => {
      // Parse slot for time comparison
      const [time, modifier] = slot.split(' ');
      let [h, m] = time.split(':').map(Number);
      if (modifier === 'PM' && h !== 12) h += 12;
      if (modifier === 'AM' && h === 12) h = 0;

      // Real-time filtering for Today (passed times)
      if (isToday) {
        if (h < currentHour) return false;
        if (h === currentHour && m <= currentMin) return false;
      }
      return true;
    }).map(slot => ({
      time: slot,
      isAvailable: !unavailableSlots.has(slot)
    }));
  }, [activeDoctor, selectedDateIndex, allPossibleSlots, unavailableSlots]);

  // Reservation Timer Logic - Releases slot at 0
  useEffect(() => {
    if (selectedSlot) {
      setTimeLeft(RESERVATION_TIME);
      if (timerRef.current) window.clearInterval(timerRef.current);
      
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) window.clearInterval(timerRef.current);
            setSelectedSlot(null); // Automatic release of the locked slot
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) window.clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [selectedSlot]);

  const handleConfirm = () => {
    if (activeDoctor && selectedSlot) {
      onConfirm(activeDoctor, selectedSlot);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.3)] flex flex-col max-h-[92vh] animate-in zoom-in-95 fade-in duration-500">
        
        {/* Navigation Header */}
        <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-white z-20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Priority Clinical Booking</p>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Schedule Consultation</h2>
          </div>
          <button 
            onClick={onCancel} 
            className="w-12 h-12 bg-slate-50 hover:bg-slate-100 hover:text-rose-500 rounded-2xl flex items-center justify-center text-slate-400 transition-all active:scale-90"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-10 custom-scrollbar space-y-12">
          
          {/* STEP 1: DOCTOR SELECTION */}
          <section className="animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-3 mb-6">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">1. Choose Your Specialist</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DOCTORS.filter(d => d.hospitalId === hospital.id).map(doctor => (
                <button
                  key={doctor.id}
                  onClick={() => { setSelectedDoctorId(doctor.id); setSelectedSlot(null); }}
                  className={`relative flex items-center gap-5 p-5 rounded-[2rem] border-2 transition-all duration-300 text-left ${
                    selectedDoctorId === doctor.id 
                    ? 'border-indigo-600 bg-indigo-50/20 ring-4 ring-indigo-50' 
                    : 'border-slate-50 bg-white hover:border-slate-200'
                  }`}
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm border transition-all ${
                    selectedDoctorId === doctor.id ? 'bg-white border-indigo-100 scale-105' : 'bg-slate-50 border-transparent'
                  }`}>
                    👨‍⚕️
                  </div>
                  <div className="flex-grow">
                    <p className={`font-black tracking-tight text-base mb-0.5 ${selectedDoctorId === doctor.id ? 'text-indigo-900' : 'text-slate-900'}`}>
                      {doctor.name}
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{doctor.specialization}</p>
                  </div>
                  {selectedDoctorId === doctor.id && (
                    <div className="absolute top-4 right-4 text-indigo-600 text-xs font-bold animate-in zoom-in">✓</div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* STEP 2: DATE PICKER */}
          {activeDoctor && (
            <section className="animate-in slide-in-from-bottom-6 duration-500">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">2. Select Appointment Date</h3>
                 <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{hospital.location}</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-6 no-scrollbar -mx-2 px-2">
                 {bookingDates.map((d, i) => (
                   <button
                    key={i}
                    onClick={() => { setSelectedDateIndex(i); setSelectedSlot(null); }}
                    className={`flex-shrink-0 w-24 h-32 rounded-[2rem] flex flex-col items-center justify-center gap-1 border-2 transition-all duration-500 ${
                      selectedDateIndex === i 
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-105' 
                      : 'border-slate-50 bg-white text-slate-900 hover:border-slate-200'
                    }`}
                   >
                     <span className={`text-[9px] font-black uppercase tracking-[0.15em] mb-1 ${selectedDateIndex === i ? 'text-indigo-100' : 'text-slate-400'}`}>
                       {d.dayLabel}
                     </span>
                     <span className="text-3xl font-black tracking-tighter leading-none">{d.dateNum}</span>
                     <span className={`text-[10px] font-bold ${selectedDateIndex === i ? 'text-indigo-200' : 'text-slate-300'}`}>{d.month}</span>
                   </button>
                 ))}
              </div>
            </section>
          )}

          {/* STEP 3: TIME SLOTS */}
          {activeDoctor && (
            <section className="animate-in slide-in-from-bottom-8 duration-700">
               <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">3. Pick a 15-Min Slot</h3>
                    <div className="flex gap-2">
                       <div className="flex items-center gap-1.5">
                         <div className="w-2 h-2 rounded-full bg-slate-100 border border-slate-200"></div>
                         <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Booked</span>
                       </div>
                       <div className="flex items-center gap-1.5">
                         <div className="w-2 h-2 rounded-full bg-indigo-100 border border-indigo-200"></div>
                         <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest">Available</span>
                       </div>
                    </div>
                  </div>
                  {selectedSlot && (
                    <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 animate-in fade-in slide-in-from-right-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Locked for {formatTime(timeLeft)}</span>
                    </div>
                  )}
               </div>

               {generatedSlots.length === 0 ? (
                 <div className="bg-slate-50 p-12 rounded-[2.5rem] border-2 border-dashed border-slate-100 text-center animate-in fade-in">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No slots remaining for today</p>
                    <button 
                      onClick={() => setSelectedDateIndex(1)} 
                      className="mt-4 text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:underline"
                    >
                      Check Tomorrow instead?
                    </button>
                 </div>
               ) : (
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {generatedSlots.map(({time, isAvailable}) => (
                    <button
                      key={time}
                      disabled={!isAvailable}
                      onClick={() => setSelectedSlot(time)}
                      className={`group relative flex items-center justify-center py-5 rounded-2xl border-2 transition-all duration-300 ${
                        !isAvailable 
                        ? 'bg-slate-50 border-slate-100 cursor-not-allowed opacity-40' 
                        : selectedSlot === time 
                        ? 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-50 z-10' 
                        : 'border-slate-50 bg-white hover:border-slate-200'
                      }`}
                    >
                      <span className={`text-[13px] font-black tabular-nums transition-colors ${
                        !isAvailable ? 'text-slate-300 line-through' : selectedSlot === time ? 'text-indigo-700' : 'text-slate-600'
                      }`}>
                        {time}
                      </span>
                      {!isAvailable && (
                        <span className="absolute -top-1 -right-1 bg-white border border-slate-100 p-0.5 rounded-full text-[8px] grayscale">🔒</span>
                      )}
                    </button>
                  ))}
                 </div>
               )}
            </section>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-10 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="flex flex-col text-center md:text-left">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Consultation Fee</p>
             <div className="flex items-baseline gap-2">
               <p className="text-4xl font-black text-slate-900 tracking-tighter">₹{activeDoctor?.fee || '0'}</p>
               <span className="text-[10px] font-bold text-slate-300 uppercase">+ Convenience Fee</span>
             </div>
           </div>
           
           <button
             disabled={!selectedSlot}
             onClick={handleConfirm}
             className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white px-16 py-6 rounded-[1.8rem] font-black text-[12px] uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-4"
           >
             Lock My Token
             <span className="text-lg opacity-50 group-hover:translate-x-1 transition-transform">→</span>
           </button>
        </div>
      </div>
    </div>
  );
};

export default BookingFlow;

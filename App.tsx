
import React, { useState, useMemo, useEffect } from 'react';
import { View, Hospital, BookingToken, User, LatLng, Doctor, PharmacyItem, Order, CartItem, PaymentContext, Prescription } from './types';
import { HOSPITALS, PHARMACY_ITEMS, PHYSICAL_PHARMACIES, USER_LOCATION, DOCTORS } from './constants';
import HospitalCard from './components/HospitalCard';
import PharmacyCard from './components/PharmacyCard';
import BookingFlow from './components/BookingFlow';
import PaymentGateway from './components/PaymentGateway';
import MapWidget from './components/MapWidget';
import DoctorProfile from './components/DoctorProfile';
import { getSymptomAdvice, generateDigitalPrescription } from './services/aiService';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [preSelectedDoctorId, setPreSelectedDoctorId] = useState<string | null>(null);
  
  // Navigation & Tracking State
  const [trackingRoute, setTrackingRoute] = useState<{ origin: LatLng; destination: LatLng; moving: LatLng; label: string; isRider: boolean } | null>(null);

  // Booking/Payment State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentTitle, setPaymentTitle] = useState('');
  const [paymentSubtitle, setPaymentSubtitle] = useState('');
  const [paymentContext, setPaymentContext] = useState<PaymentContext | null>(null);
  const [pendingBooking, setPendingBooking] = useState<{ doctor: Doctor; slot: string; hospital: Hospital } | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Core User Clinical State
  const [user, setUser] = useState<User | null>(null);

  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [symptomInput, setSymptomInput] = useState('');
  
  // Digital Prescription Lifecycle
  const [newPrescription, setNewPrescription] = useState<Prescription & { followUp?: string; lifestyleAdvice?: string } | null>(null);
  const [isConsulting, setIsConsulting] = useState(false);

  const cartTotal = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);

  // Live Simulation for Tracking
  useEffect(() => {
    if (trackingRoute) {
      const interval = setInterval(() => {
        setTrackingRoute(prev => {
          if (!prev) return null;
          const step = 0.0008; // Slower, more realistic movement
          const newLat = prev.moving.lat + (prev.destination.lat > prev.moving.lat ? step : -step);
          const newLng = prev.moving.lng + (prev.destination.lng > prev.moving.lng ? step : -step);
          
          const reached = Math.abs(newLat - prev.destination.lat) < 0.0015 && Math.abs(newLng - prev.destination.lng) < 0.0015;
          if (reached) {
            clearInterval(interval);
            return { ...prev, moving: prev.destination };
          }
          return { ...prev, moving: { lat: newLat, lng: newLng } };
        });
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [trackingRoute]);

  const handleLogin = () => {
    setUser({
      name: 'John Doe',
      tokens: [],
      prescriptions: [],
      orders: [],
      labReports: [],
      currentLocation: USER_LOCATION,
      activity: {
        steps: 8240,
        goal: 10000,
        distance: '6.4 km',
        activeMinutes: 42
      }
    });
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setCurrentView(View.DASHBOARD);
    setTrackingRoute(null);
    setCart([]);
    setNewPrescription(null);
  };

  const handleBookingStart = (doctor: Doctor, slot: string) => {
    const hospital = selectedHospital || HOSPITALS.find(h => h.id === doctor.hospitalId);
    if (!hospital) return;

    setPendingBooking({ doctor, slot, hospital });
    setPaymentAmount(doctor.fee);
    setPaymentTitle("Priority Consultation Pay");
    setPaymentSubtitle(`Confirmed slot with ${doctor.name}`);
    setPaymentContext('consultation');
    setSelectedHospital(null);
    setPreSelectedDoctorId(null);
    setIsPaymentOpen(true);
  };

  const handleBookDoctorDirectly = (doctor: Doctor) => {
    const hospital = HOSPITALS.find(h => h.id === doctor.hospitalId);
    if (hospital) {
      setPreSelectedDoctorId(doctor.id);
      setSelectedHospital(hospital);
    }
  };

  const handlePaymentSuccess = () => {
    if (paymentContext === 'consultation' && pendingBooking && user) {
      const newToken: BookingToken = {
        id: `TK-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        hospitalId: pendingBooking.hospital.id,
        hospitalName: pendingBooking.hospital.name,
        doctorName: pendingBooking.doctor.name,
        tokenNumber: pendingBooking.hospital.currentToken + 5,
        currentToken: pendingBooking.hospital.currentToken,
        status: 'Waiting',
        appointmentTime: pendingBooking.slot,
        estimatedArrival: '15 Mins',
        consultationFee: pendingBooking.doctor.fee,
        timestamp: Date.now()
      };
      setUser(prev => prev ? ({ ...prev, tokens: [newToken, ...prev.tokens] }) : null);
      setTrackingRoute({
        origin: user.currentLocation,
        destination: pendingBooking.hospital.coords,
        moving: user.currentLocation,
        label: 'Route to Clinic',
        isRider: false
      });
      setCurrentView(View.TRACKING);
    } else if (paymentContext === 'pharmacy' && user) {
      const store = PHYSICAL_PHARMACIES[0];
      const newOrder: Order = {
        id: `ORD-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        items: [...cart],
        total: cartTotal,
        date: new Date().toLocaleDateString(),
        status: 'Confirmed',
        estimatedDelivery: '25 Mins',
        fulfillingStoreName: store.name,
        storeCoords: store.coords,
        riderCoords: store.coords,
        destinationCoords: user.currentLocation
      };
      setUser(prev => prev ? ({ ...prev, orders: [newOrder, ...prev.orders] }) : null);
      setCart([]);
      setTrackingRoute({
        origin: store.coords,
        destination: user.currentLocation,
        moving: store.coords,
        label: 'Express Rider Incoming',
        isRider: true
      });
      setCurrentView(View.TRACKING);
    }
    setIsPaymentOpen(false);
    setPendingBooking(null);
  };

  const handleCompleteConsultation = async (token: BookingToken) => {
    setIsConsulting(true);
    const doctor = DOCTORS.find(d => d.name === token.doctorName);
    const aiPrescriptionData = await generateDigitalPrescription(
      symptomInput || "Check-up for persistent fatigue and headaches", 
      token.doctorName, 
      doctor?.specialization || "General Physician"
    );

    const prescriptionObj: Prescription & { followUp?: string; lifestyleAdvice?: string } = {
      id: `RX-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      doctor: token.doctorName,
      hospital: token.hospitalName,
      date: new Date().toLocaleDateString(),
      diagnosis: aiPrescriptionData.diagnosis,
      medicines: aiPrescriptionData.medicines,
      lifestyleAdvice: aiPrescriptionData.lifestyleAdvice,
      followUp: aiPrescriptionData.followUp
    };

    setUser(prev => {
      if (!prev) return null;
      const updatedTokens = prev.tokens.map(t => t.id === token.id ? { ...t, status: 'Completed' as const } : t);
      return {
        ...prev,
        tokens: updatedTokens,
        prescriptions: [prescriptionObj, ...prev.prescriptions]
      };
    });

    setNewPrescription(prescriptionObj);
    setIsConsulting(false);
    setTrackingRoute(null);
    setCurrentView(View.PROFILE);
  };

  const handleAiAdvice = async () => {
    if (!symptomInput) return;
    setIsAiLoading(true);
    const advice = await getSymptomAdvice(symptomInput);
    setAiAdvice(advice || "Connection to clinical AI lost. Please retry.");
    setIsAiLoading(false);
  };

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 md:p-12 font-sans">
        <div className="w-full max-w-5xl bg-white rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-1000">
           <div className="w-full md:w-1/2 bg-slate-900 p-16 md:p-24 text-white flex flex-col justify-between">
              <div>
                 <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-3xl font-black mb-10 shadow-xl shadow-indigo-600/20">C</div>
                 <h1 className="text-5xl font-black tracking-tighter mb-4 leading-tight">Your Clinical Super Ecosystem.</h1>
                 <p className="text-slate-400 font-medium leading-relaxed">Integrated hospital discovery, express pharmacy fulfillment, and secure digital records vault.</p>
              </div>
              <div className="space-y-6 pt-12">
                 <div className="flex items-center gap-4 group">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 group-hover:text-white transition-colors">Hyperlocal Hospital Sync</span>
                 </div>
                 <div className="flex items-center gap-4 group">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 group-hover:text-white transition-colors">Digital Prescription Vault</span>
                 </div>
              </div>
           </div>
           
           <div className="w-full md:w-1/2 p-16 md:p-24 flex flex-col justify-center bg-white">
              <div className="max-w-sm mx-auto w-full space-y-10">
                <div className="text-center md:text-left">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">Welcome Back</h2>
                  <p className="text-slate-400 text-sm font-medium uppercase tracking-widest text-[10px]">Authenticate to access ecosystem</p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Clinical Identifier</label>
                    <input type="text" defaultValue="patient.demo@careconnect.com" className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white px-8 py-5 rounded-[1.8rem] outline-none transition-all font-bold text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Secure Password</label>
                    <input type="password" defaultValue="••••••••" className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white px-8 py-5 rounded-[1.8rem] outline-none transition-all font-bold text-sm" />
                  </div>
                </div>

                <button 
                  onClick={handleLogin}
                  className="w-full bg-slate-900 hover:bg-indigo-600 text-white py-6 rounded-[1.8rem] font-black text-[12px] uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95"
                >
                  Enter Platform
                </button>
                
                <p className="text-center text-[9px] font-bold text-slate-300 uppercase tracking-widest cursor-pointer hover:text-slate-500 transition-colors">Reset clinical credentials?</p>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pl-72 bg-[#fcfdff] text-slate-900 font-sans selection:bg-indigo-100 relative">
      
      {/* Sidebar Navigation */}
      <nav className="hidden md:flex flex-col fixed left-0 top-0 h-full w-72 bg-white border-r border-slate-100 p-10 z-50">
        <div className="flex items-center gap-4 mb-14 px-2">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-slate-100">C</div>
          <div>
            <span className="text-xl font-black text-slate-900 tracking-tighter block leading-none">CareConnect</span>
            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-1 block">Clinical Super</span>
          </div>
        </div>
        
        <div className="space-y-2">
          {[
            { id: View.DASHBOARD, label: 'Control Center', icon: '🏠' },
            { id: View.DISCOVERY, label: 'Find Care', icon: '🏥' },
            { id: View.PHARMACY, label: 'Clinical Shop', icon: '💊' },
            { id: View.PROFILE, label: 'Records Vault', icon: '📂' },
            { id: View.TRACKING, label: 'Live Tracking', icon: '📍', hidden: !trackingRoute },
          ].map(item => !item.hidden && (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[13px] font-bold transition-all ${
                currentView === item.id 
                ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 translate-x-1' 
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
            >
              <span className={`text-xl ${currentView === item.id ? 'grayscale-0' : 'grayscale opacity-40'}`}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <button 
          onClick={handleLogout}
          className="mt-8 w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
        >
          <span>⏻</span>
          Sign Out
        </button>
      </nav>

      {/* Modern Global Header */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-slate-50 z-40 px-8 md:px-14 py-8 flex items-center justify-between">
        <div className="animate-in fade-in slide-in-from-left-4">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            {currentView === View.DASHBOARD ? `Control Center: ${user?.name.split(' ')[0]}` : currentView.toUpperCase()}
          </h1>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Real-Time Cloud Sync: Active
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="w-12 h-12 bg-white border border-slate-100 rounded-2xl text-slate-400 relative transition-all active:scale-90 flex items-center justify-center text-xl hover:text-indigo-600 shadow-sm"
          >
            🛒
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-indigo-600 text-white text-[9px] flex items-center justify-center rounded-full font-black border-2 border-white animate-in zoom-in">
                {cart.length}
              </span>
            )}
          </button>
          <div 
            onClick={() => setCurrentView(View.PROFILE)}
            className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm overflow-hidden flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
          >
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`} alt="User" />
          </div>
        </div>
      </header>

      <main className="p-8 md:p-14 animate-in fade-in slide-in-from-bottom-2 duration-500">
        
        {currentView === View.DASHBOARD && (
          <div className="max-w-7xl mx-auto space-y-12">
            
            {/* AI Triage Section */}
            <section className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row gap-12 items-center">
              <div className="lg:w-3/5">
                <span className="inline-block bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-[0.3em] px-4 py-2 rounded-full mb-6">Clinical Triage Engine</span>
                <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tighter">Current health status?</h2>
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    placeholder="Describe symptoms briefly (e.g. Mild chest pain and sweating)..." 
                    className="flex-grow px-8 py-6 bg-slate-50 border-2 border-transparent rounded-[2rem] focus:border-indigo-100 focus:bg-white transition-all text-sm outline-none font-bold shadow-sm"
                    value={symptomInput}
                    onChange={(e) => setSymptomInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAiAdvice()}
                  />
                  <button 
                    onClick={handleAiAdvice}
                    disabled={isAiLoading}
                    className="bg-indigo-600 hover:bg-slate-900 disabled:opacity-50 text-white px-10 py-6 rounded-[2rem] font-black text-[10px] transition-all uppercase tracking-[0.2em] active:scale-95 shadow-xl shadow-indigo-100"
                  >
                    {isAiLoading ? 'Analyzing...' : 'Analyze'}
                  </button>
                </div>
                {aiAdvice && (
                  <div className="mt-8 p-10 bg-slate-50 rounded-[3rem] border border-slate-100 text-sm text-slate-700 leading-relaxed font-medium animate-in slide-in-from-top-4 duration-500 prose prose-slate max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: aiAdvice.replace(/\n/g, '<br/>') }} />
                  </div>
                )}
              </div>
              
              {/* Activity Trackers */}
              <div className="lg:w-2/5 w-full grid grid-cols-2 gap-6">
                 <div className="bg-indigo-50 p-10 rounded-[3rem] flex flex-col justify-between border border-indigo-100 group hover:bg-indigo-600 transition-all duration-700">
                   <div>
                     <p className="text-[10px] font-black text-indigo-400 group-hover:text-indigo-200 uppercase tracking-[0.3em] mb-4">Steps Today</p>
                     <p className="text-5xl font-black text-indigo-900 group-hover:text-white transition-colors">{user?.activity.steps.toLocaleString()}</p>
                   </div>
                   <div className="mt-8">
                      <div className="w-full h-2 bg-indigo-100 group-hover:bg-indigo-500 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 group-hover:bg-white transition-all duration-1000" style={{ width: `${(user?.activity.steps || 0) / (user?.activity.goal || 1) * 100}%` }}></div>
                      </div>
                      <p className="text-[9px] font-black text-indigo-400 group-hover:text-indigo-200 uppercase mt-4 tracking-widest">Target: 10,000</p>
                   </div>
                 </div>

                 <div className="bg-emerald-50 p-10 rounded-[3rem] flex flex-col justify-between border border-emerald-100 group hover:bg-emerald-600 transition-all duration-700">
                   <div>
                     <p className="text-[10px] font-black text-emerald-400 group-hover:text-emerald-200 uppercase tracking-[0.3em] mb-4">Distance</p>
                     <p className="text-5xl font-black text-emerald-900 group-hover:text-white transition-colors">{user?.activity.distance.split(' ')[0]}</p>
                   </div>
                   <div className="mt-8 flex items-center justify-between">
                      <div>
                        <p className="text-xl font-black text-emerald-900 group-hover:text-white">{user?.activity.activeMinutes}</p>
                        <p className="text-[9px] font-black text-emerald-400 group-hover:text-emerald-200 uppercase tracking-widest">Mins Active</p>
                      </div>
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🔥</div>
                   </div>
                 </div>
              </div>
            </section>

            {/* Quick Actions */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-10">
               <div className="md:col-span-2 space-y-8">
                 <div className="flex items-center justify-between">
                    <h3 className="font-black text-slate-900 text-xl tracking-tighter">Recommended Specialists</h3>
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest cursor-pointer">View Directory</span>
                 </div>
                 <div className="flex gap-6 overflow-x-auto pb-10 no-scrollbar -mx-2 px-2">
                    {DOCTORS.map(doctor => (
                      <DoctorProfile key={doctor.id} doctor={doctor} onBook={handleBookDoctorDirectly} />
                    ))}
                 </div>
               </div>

               <div className="space-y-8">
                  <h3 className="font-black text-slate-900 text-xl tracking-tighter">Records Vault Snapshot</h3>
                  <div className="space-y-4">
                    {user?.prescriptions.slice(0, 1).map(rx => (
                      <div key={rx.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex flex-col justify-between h-56 hover:border-indigo-200 transition-all shadow-sm">
                         <div>
                            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">{rx.doctor}</p>
                            <h4 className="font-bold text-slate-800 text-base leading-tight mb-4">{rx.diagnosis}</h4>
                         </div>
                         <button onClick={() => setCurrentView(View.PROFILE)} className="w-full bg-slate-50 text-slate-400 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">Open Full PDF</button>
                      </div>
                    ))}
                    <div onClick={() => setCurrentView(View.DISCOVERY)} className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col justify-between h-56 cursor-pointer hover:scale-[1.02] transition-transform">
                       <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Active System</p>
                       <h4 className="text-xl font-black leading-tight">Find nearby emergency centers in real-time.</h4>
                       <span className="text-2xl">→</span>
                    </div>
                  </div>
               </div>
            </section>
          </div>
        )}

        {currentView === View.DISCOVERY && (
          <div className="max-w-7xl mx-auto space-y-12">
             <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-8">
                <div>
                   <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Clinical Discovery</h2>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Real-time queueing & proximity sync enabled</p>
                </div>
                <div className="relative w-full lg:w-[35rem]">
                   <span className="absolute left-8 top-1/2 -translate-y-1/2 opacity-30 text-xl">🔍</span>
                   <input 
                    type="text" 
                    placeholder="Search by specialty, name, or hospital location..." 
                    className="w-full pl-20 pr-10 py-6 bg-white border border-slate-100 rounded-[2.5rem] font-bold text-sm outline-none focus:border-indigo-600 shadow-sm transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                   />
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
               {HOSPITALS.map(hospital => (
                 <HospitalCard key={hospital.id} hospital={hospital} onBook={() => setSelectedHospital(hospital)} />
               ))}
             </div>
          </div>
        )}

        {currentView === View.PHARMACY && (
          <div className="max-w-7xl mx-auto space-y-12">
             <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Healthcare Shop</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Verified pharmaceutical dispatch via hyperlocal hubs</p>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
               {PHARMACY_ITEMS.map(item => (
                 <PharmacyCard key={item.id} item={item} onAddToCart={(it) => {
                   setCart(prev => [...prev, { ...it, quantity: 1 }]);
                   setIsCartOpen(true);
                 }} />
               ))}
             </div>
          </div>
        )}

        {currentView === View.TRACKING && trackingRoute && (
          <div className="max-w-6xl mx-auto h-[75vh] flex flex-col gap-8">
             <div className="flex items-center justify-between">
                <div>
                   <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{trackingRoute.label}</h2>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Satellite Navigation Engine Active</p>
                </div>
                <button onClick={() => setTrackingRoute(null)} className="text-rose-500 font-black text-[11px] uppercase tracking-widest hover:underline px-6 py-3 bg-rose-50 rounded-xl border border-rose-100">Abort Route</button>
             </div>

             <div className="flex-grow rounded-[4rem] overflow-hidden border border-slate-100 shadow-2xl relative">
               <MapWidget 
                 origin={trackingRoute.origin}
                 destination={trackingRoute.destination}
                 movingEntity={trackingRoute.moving}
                 label={trackingRoute.label}
                 isRider={trackingRoute.isRider}
               />

               {/* Arrived Action Overlay */}
               {!trackingRoute.isRider && (
                 <div className="absolute bottom-12 left-12 right-12 z-30">
                    <div className="bg-white p-10 rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.2)] border border-slate-100 flex items-center justify-between animate-in slide-in-from-bottom-10 duration-700">
                       <div className="flex items-center gap-8">
                          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-[1.8rem] flex items-center justify-center text-3xl shadow-sm">🏨</div>
                          <div>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Clinic Check-in</p>
                             <p className="text-xl font-bold text-slate-900 tracking-tight">You are within 50m of Reception</p>
                          </div>
                       </div>
                       <button 
                         onClick={() => {
                           const token = user?.tokens.find(t => t.status === 'Waiting');
                           if (token) handleCompleteConsultation(token);
                         }}
                         disabled={isConsulting}
                         className="bg-slate-900 hover:bg-indigo-600 text-white px-12 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 disabled:opacity-50"
                       >
                         {isConsulting ? 'Finalizing Records...' : 'Check-in Now'}
                       </button>
                    </div>
                 </div>
               )}
             </div>
          </div>
        )}

        {currentView === View.PROFILE && (
          <div className="max-w-4xl mx-auto space-y-16 pb-32">
             <div className="flex items-center justify-between">
                <div>
                   <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Clinical Vault</h2>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Immutable patient record history</p>
                </div>
                <div className="flex gap-4">
                  <button onClick={handleLogout} className="bg-rose-50 text-rose-500 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-rose-100 shadow-sm hover:bg-rose-500 hover:text-white transition-all">Sign Out</button>
                </div>
             </div>
             
             {/* Digital Prescription Display */}
             <div className="space-y-8">
                <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] ml-1">Secure Prescription Archive</h3>
                {user?.prescriptions.length === 0 ? (
                  <div className="p-20 border-2 border-dashed border-slate-100 rounded-[4rem] text-center opacity-30">
                     <p className="font-bold uppercase tracking-widest text-[11px]">No digital letters found</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {user?.prescriptions.map(rx => (
                      <div key={rx.id} className="bg-white border-2 border-indigo-100 p-12 rounded-[4rem] shadow-2xl relative overflow-hidden group hover:shadow-indigo-100 transition-all">
                        <div className="absolute top-0 right-0 px-10 py-5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-bl-[2.5rem] flex items-center gap-3">
                           <span className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]"></span>
                           E-Verified Record
                        </div>
                        
                        <div className="flex flex-col md:flex-row gap-12 items-start">
                           <div className="flex-grow w-full">
                              <div className="mb-10 pb-10 border-b border-slate-50">
                                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">{rx.hospital}</p>
                                 <h4 className="text-3xl font-black text-slate-900 tracking-tighter mb-1">{rx.doctor}</h4>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dated: {rx.date}</p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                 <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4">Diagnosis Summary</p>
                                    <p className="text-sm font-bold text-slate-800 leading-relaxed">{rx.diagnosis}</p>
                                 </div>
                                 <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100">
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4">Lifestyle Advice</p>
                                    <p className="text-sm font-bold text-emerald-800 leading-relaxed italic">"{(rx as any).lifestyleAdvice || 'Maintain optimal hydration and rest.'}"</p>
                                 </div>
                              </div>

                              <div className="mt-12 space-y-6">
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Prescribed Fulfillment</p>
                                 {rx.medicines.map((med, idx) => (
                                   <div key={idx} className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-3xl group/med hover:border-indigo-200 transition-all">
                                      <div>
                                         <p className="font-black text-slate-900 text-base">{med.name}</p>
                                         <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{med.dosage} • {med.duration} • {med.instructions}</p>
                                      </div>
                                      <button 
                                       onClick={() => {
                                         const sMed = PHARMACY_ITEMS.find(p => p.name.includes(med.name.split(' ')[0]));
                                         if (sMed) setCart(prev => [...prev, { ...sMed, quantity: 1 }]);
                                         setIsCartOpen(true);
                                       }}
                                       className="bg-indigo-50 text-indigo-600 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                      >
                                         Refill Meds
                                      </button>
                                   </div>
                                 ))}
                              </div>
                           </div>
                           
                           <div className="w-full md:w-64 space-y-6 flex-shrink-0">
                              <div className="bg-slate-900 p-10 rounded-[3rem] text-center text-white">
                                 <div className="w-32 h-32 bg-white/10 rounded-3xl mx-auto mb-8 flex items-center justify-center text-4xl shadow-inner border border-white/5">📋</div>
                                 <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-3">Verification Hash</p>
                                 <p className="text-sm font-black tracking-widest font-mono truncate">{rx.id}</p>
                              </div>
                              <button className="w-full bg-white border-2 border-slate-900 text-slate-900 py-5 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-slate-900 hover:text-white transition-all">Download Copy</button>
                              <p className="text-[9px] text-center font-bold text-slate-300 uppercase leading-relaxed px-4">Authorized by HealthCloud Ecosystem Standards</p>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>

             {/* Order & Token History */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <section className="space-y-6">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Appointment Tokens</h3>
                   {user?.tokens.filter(t => t.status !== 'Completed').map(t => (
                     <div key={t.id} className="bg-white p-8 rounded-[3rem] border border-slate-200 flex items-center justify-between">
                        <div>
                           <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1">{t.hospitalName}</p>
                           <h4 className="font-bold text-slate-800 text-lg tracking-tight mb-2">{t.doctorName}</h4>
                           <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 bg-amber-50 text-amber-600 rounded-md border border-amber-100">#{t.tokenNumber} In Queue</span>
                        </div>
                        <button onClick={() => setCurrentView(View.TRACKING)} className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all text-xl">📍</button>
                     </div>
                   ))}
                </section>
                <section className="space-y-6">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Recent Pharmacy Orders</h3>
                   {user?.orders.map(order => (
                     <div key={order.id} className="bg-white p-8 rounded-[3rem] border border-slate-200 flex items-center justify-between group cursor-pointer hover:border-indigo-100 transition-all">
                        <div className="flex items-center gap-6">
                           <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-indigo-50 transition-colors">📦</div>
                           <div>
                              <p className="font-black text-slate-800 text-sm">{order.items.length} Medicines • ₹{order.total}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{order.status} • {order.date}</p>
                           </div>
                        </div>
                        <span className="text-xl text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all">→</span>
                     </div>
                   ))}
                </section>
             </div>
          </div>
        )}
      </main>

      {/* Overlays & Modals */}
      {selectedHospital && (
        <BookingFlow 
          hospital={selectedHospital}
          initialDoctorId={preSelectedDoctorId}
          onConfirm={handleBookingStart}
          onCancel={() => { setSelectedHospital(null); setPreSelectedDoctorId(null); }}
        />
      )}

      {isPaymentOpen && paymentContext && (
        <PaymentGateway 
          amount={paymentAmount}
          title={paymentTitle}
          subtitle={paymentSubtitle}
          context={paymentContext}
          onSuccess={handlePaymentSuccess}
          onCancel={() => { setIsPaymentOpen(false); setPendingBooking(null); }}
        />
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] flex justify-end animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-500">
              <div className="p-12 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Fulfillment Bag</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Sourced via Hyperlocal Network</p>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all active:scale-90">✕</button>
              </div>

              <div className="flex-grow overflow-y-auto p-12 space-y-8 custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                     <span className="text-8xl mb-8">🩺</span>
                     <p className="font-black text-[12px] uppercase tracking-[0.4em]">Empty clinical bag</p>
                  </div>
                ) : cart.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="flex gap-8 group">
                    <div className="w-24 h-24 bg-slate-50 rounded-[2rem] overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-100 p-4">
                      <img src={item.image} alt={item.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-base font-bold text-slate-900 leading-tight line-clamp-1">{item.name}</h4>
                        <button onClick={() => setCart(prev => prev.filter((_, i) => i !== idx))} className="text-slate-200 hover:text-rose-500 transition-colors">✕</button>
                      </div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-6">{item.brand}</p>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-5 bg-slate-50 rounded-2xl px-5 py-2.5 border border-slate-100">
                          <button onClick={() => setCart(prev => prev.map((it, i) => i === idx ? {...it, quantity: Math.max(1, it.quantity - 1)} : it))} className="text-indigo-600 font-black hover:scale-125 transition-transform">-</button>
                          <span className="text-sm font-black text-slate-900 w-4 text-center">{item.quantity}</span>
                          <button onClick={() => setCart(prev => prev.map((it, i) => i === idx ? {...it, quantity: it.quantity + 1} : it))} className="text-indigo-600 font-black hover:scale-125 transition-transform">+</button>
                        </div>
                        <span className="text-xl font-black text-slate-900 tracking-tight">₹{(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {cart.length > 0 && (
                <div className="p-12 border-t border-slate-100 bg-white">
                   <div className="flex justify-between items-end mb-10">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Payable</p>
                        <p className="text-5xl font-black text-slate-900 tracking-tighter">₹{cartTotal}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1 animate-pulse">Priority Express</p>
                         <p className="text-xs font-bold text-slate-500 tracking-tight">Delivery in 25-35 mins</p>
                      </div>
                   </div>
                   <button 
                    onClick={() => { setIsCartOpen(false); setIsPaymentOpen(true); setPaymentContext('pharmacy'); setPaymentAmount(cartTotal); setPaymentTitle("Pharmacy Order"); setPaymentSubtitle(`${cart.length} Prescription Items`); }}
                    className="w-full bg-slate-900 hover:bg-indigo-600 text-white py-6 rounded-[2rem] font-black text-[12px] uppercase tracking-[0.4em] shadow-2xl transition-all active:scale-95"
                  >
                    Confirm Purchase
                  </button>
                </div>
              )}
           </div>
        </div>
      )}

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-3xl border-t border-slate-100 grid grid-cols-4 py-8 z-50 shadow-[0_-20px_60px_rgba(0,0,0,0.1)] rounded-t-[3.5rem] px-4">
        {[
          { id: View.DASHBOARD, label: 'HOME', icon: '🏠' },
          { id: View.DISCOVERY, label: 'CARE', icon: '🏥' },
          { id: View.PHARMACY, label: 'SHOP', icon: '💊' },
          { id: View.PROFILE, label: 'VAULT', icon: '📂' },
        ].map(item => (
          <button key={item.id} onClick={() => setCurrentView(item.id)} className={`flex flex-col items-center gap-2 transition-all duration-300 ${currentView === item.id ? 'text-indigo-600 translate-y-[-8px]' : 'text-slate-300'}`}>
            <span className="text-2xl transition-transform">{item.icon}</span>
            <span className={`text-[9px] font-black tracking-widest transition-opacity ${currentView === item.id ? 'opacity-100' : 'opacity-0'}`}>{item.label}</span>
          </button>
        ))}
      </nav>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        .animate-bounce-slow { animation: bounce-slow 4s ease-in-out infinite; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;

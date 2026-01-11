
import React from 'react';
import { PharmacyItem } from '../types';
import { PHYSICAL_PHARMACIES } from '../constants';

interface PharmacyCardProps {
  item: PharmacyItem;
  onAddToCart: (item: PharmacyItem) => void;
}

const PharmacyCard: React.FC<PharmacyCardProps> = ({ item, onAddToCart }) => {
  const bestStore = PHYSICAL_PHARMACIES.find(s => item.stockAtStoreIds.includes(s.id));
  const discount = item.oldPrice ? Math.round(((item.oldPrice - item.price) / item.oldPrice) * 100) : 0;
  
  return (
    <div className="bg-white p-10 rounded-[3.5rem] border border-slate-50 flex flex-col h-full hover:border-indigo-100 hover:shadow-[0_40px_80px_rgba(79,70,229,0.04)] transition-all duration-700 group relative overflow-hidden">
      <div className="relative mb-10 flex-shrink-0 bg-slate-50 rounded-[2.5rem] p-10 flex items-center justify-center border border-slate-100 group-hover:bg-indigo-50 transition-colors">
        <img src={item.image} alt={item.name} className="w-full h-40 object-contain group-hover:scale-110 transition-transform duration-700" />
        
        <div className="absolute top-6 left-6 flex flex-col gap-2">
          {item.needsPrescription && (
            <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest border border-amber-200 shadow-sm">
              Rx Required
            </span>
          )}
          {discount > 0 && (
            <span className="bg-emerald-500 text-white text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-lg shadow-emerald-500/20">
              {discount}% Saved
            </span>
          )}
        </div>
      </div>
      
      <div className="flex-grow">
        <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.3em] mb-2">{item.brand}</p>
        <h4 className="text-xl font-black text-slate-900 line-clamp-2 leading-tight mb-4 tracking-tighter group-hover:text-indigo-900 transition-colors">{item.name}</h4>
        
        <div className="flex items-baseline gap-3 mb-8">
          <span className="text-3xl font-black text-slate-900 tracking-tighter">₹{item.price}</span>
          {item.oldPrice && (
            <span className="text-sm text-slate-300 line-through font-bold">₹{item.oldPrice}</span>
          )}
        </div>

        {bestStore && (
          <div className="bg-slate-50 p-5 rounded-[2rem] flex items-center gap-5 mb-8 border border-slate-100 group-hover:bg-white transition-colors">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-slate-50 group-hover:border-indigo-100 transition-all">🛵</div>
            <div>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Express Dispatch</p>
              <p className="text-[11px] text-slate-900 font-black tracking-tight">{bestStore.deliveryTime} from {bestStore.name.split(' ')[0]}</p>
            </div>
          </div>
        )}
      </div>

      <button 
        onClick={() => onAddToCart(item)}
        className="w-full py-5 bg-slate-900 hover:bg-indigo-600 text-white rounded-[1.8rem] font-black text-[12px] uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3 group/btn"
      >
        Add To Bag
        <span className="text-lg opacity-40 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all">+</span>
      </button>

      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-1000"></div>
    </div>
  );
};

export default PharmacyCard;

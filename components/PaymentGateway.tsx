
import React, { useState } from 'react';
import { PaymentContext } from '../types';

interface PaymentGatewayProps {
  amount: number;
  title: string;
  subtitle: string;
  context: PaymentContext;
  onSuccess: () => void;
  onCancel: () => void;
}

type PaymentStatus = 'idle' | 'processing_gateway' | 'verifying_backend' | 'failed';

const PaymentGateway: React.FC<PaymentGatewayProps> = ({ amount, title, subtitle, context, onSuccess, onCancel }) => {
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState('upi');

  /**
   * Simulates the actual Razorpay / Gateway interaction
   */
  const simulateGatewayStep = () => {
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        // 95% success rate for the gateway interaction itself
        resolve(Math.random() < 0.95);
      }, 1500);
    });
  };

  /**
   * Simulates backend verification (Checking signature, status with bank, and settlement)
   */
  const simulateBackendVerification = () => {
    return new Promise<{ success: boolean; message?: string }>((resolve) => {
      setTimeout(() => {
        const rand = Math.random();
        
        // High success rate simulation for backend checks (96% success)
        if (rand < 0.96) {
          resolve({ success: true });
        } else if (rand < 0.97) {
          // Scenario 1: Network issue
          resolve({ 
            success: false, 
            message: "Network connectivity lost between clinical servers and bank gateway. Please ensure your internet is stable and try again." 
          });
        } else if (rand < 0.98) {
          // Scenario 2: Duplicate transaction
          resolve({ 
            success: false, 
            message: "Possible duplicate transaction detected for this consultation slot. Please check your 'Records Vault' before attempting again." 
          });
        } else if (rand < 0.99) {
          // Scenario 3: Timeout
          resolve({ 
            success: false, 
            message: "Transaction verification timed out. If money was debited, it will be automatically refunded within 24-48 hours." 
          });
        } else {
          // Scenario 4: Authentication failure
          resolve({ 
            success: false, 
            message: "Bank server authentication failed or credit limit exceeded. Please try a different payment method or contact your bank." 
          });
        }
      }, 2000);
    });
  };

  const handlePaymentInitiation = async () => {
    setErrorMessage(null);
    setStatus('processing_gateway');

    try {
      const gatewaySuccess = await simulateGatewayStep();
      
      if (!gatewaySuccess) {
        setStatus('failed');
        setErrorMessage("Payment was declined by the bank or gateway provider.");
        return;
      }

      setStatus('verifying_backend');
      const backendResult = await simulateBackendVerification();

      if (backendResult.success) {
        // Final handoff to the App-level success handler
        onSuccess();
      } else {
        setStatus('failed');
        setErrorMessage(backendResult.message || "Failed to verify payment signature on the server.");
      }
    } catch (err) {
      setStatus('failed');
      setErrorMessage("An unexpected communication error occurred.");
    }
  };

  if (status === 'processing_gateway' || status === 'verifying_backend') {
    return (
      <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
        <div className="relative mb-12">
          <div className="w-24 h-24 border-[6px] border-slate-50 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        <div className="text-center max-w-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">
            {status === 'processing_gateway' ? 'Connecting to Gateway' : 'Verifying Transaction'}
          </h2>
          <p className="text-slate-400 text-sm font-medium leading-relaxed">
            {status === 'processing_gateway' 
              ? 'Opening secure payment portal. Please do not refresh the page.' 
              : 'Our clinical servers are authenticating your payment signature with the bank.'}
          </p>
        </div>

        <div className="mt-16 flex flex-col items-center gap-4">
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className={`w-1.5 h-1.5 rounded-full ${
                  status === 'verifying_backend' ? 'bg-indigo-600' : 'bg-slate-200'
                } animate-pulse`} 
                style={{ animationDelay: `${i * 0.1}s` }}
              ></div>
            ))}
          </div>
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">
            PCI-DSS LEVEL 1 COMPLIANT
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in slide-in-from-bottom duration-500">
        
        {/* Billing Column */}
        <div className="bg-slate-50 w-full md:w-[360px] p-10 border-r border-slate-100 flex flex-col">
          <button 
            disabled={status !== 'idle' && status !== 'failed'}
            onClick={onCancel} 
            className="text-slate-400 hover:text-slate-900 text-sm font-bold mb-12 flex items-center gap-2 transition-colors disabled:opacity-20"
          >
            ← Cancel Billing
          </button>
          
          <div className="mb-10">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-2 block">Invoice Summary</span>
            <h3 className="text-2xl font-bold text-slate-900 leading-tight mb-2">{title}</h3>
            <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
          </div>

          <div className="space-y-4 py-8 border-y border-dashed border-slate-200">
            <div className="flex justify-between text-xs font-medium text-slate-500">
              <span>Primary Service</span>
              <span className="text-slate-900">₹{amount}</span>
            </div>
            <div className="flex justify-between text-xs font-medium text-slate-500">
              <span>Clinical Tech Fee</span>
              <span className="text-slate-900">₹25</span>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Payable</p>
            <p className="text-5xl font-black text-slate-900 tracking-tighter">₹{amount + 25}</p>
          </div>

          <div className="mt-auto pt-8 flex items-center gap-3 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-default">
             <div className="w-8 h-8 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-xs">🛡️</div>
             <p className="text-[8px] font-bold text-slate-500 uppercase leading-tight tracking-widest">
               Encrypted Bank Grade<br/>Payment Environment
             </p>
          </div>
        </div>

        {/* Payment Selection */}
        <div className="flex-grow p-10 md:p-14">
           <div className="mb-10 flex justify-between items-end">
             <h3 className="text-xl font-bold text-slate-900">Secure Checkout</h3>
             <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Gateway: Active</span>
           </div>
           
           {status === 'failed' && errorMessage && (
             <div className="mb-8 p-5 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-4 animate-in slide-in-from-top-2">
               <span className="text-xl">⚠️</span>
               <div>
                 <p className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-1">Payment Unsuccessful</p>
                 <p className="text-xs text-rose-600 font-medium leading-relaxed">{errorMessage}</p>
               </div>
             </div>
           )}

           <div className="space-y-4 mb-14">
             {[
               { id: 'upi', label: 'Secure UPI Transfer', desc: 'GPay, PhonePe, Paytm' },
               { id: 'card', label: 'Verified Bank Card', desc: 'Visa, Mastercard, Amex' },
               { id: 'nb', label: 'Net Banking', desc: 'All Indian Banks Supported' }
             ].map(method => (
               <button 
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`w-full flex items-center justify-between p-6 rounded-2xl border-2 transition-all text-left ${
                  selectedMethod === method.id ? 'border-indigo-600 bg-indigo-50/20 shadow-lg shadow-indigo-100/20' : 'border-slate-50 hover:border-slate-100'
                }`}
               >
                 <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 bg-white rounded-xl shadow-sm border flex items-center justify-center text-2xl transition-all ${
                      selectedMethod === method.id ? 'border-indigo-200 scale-105' : 'border-slate-100'
                    }`}>
                      {method.id === 'upi' ? '📱' : method.id === 'card' ? '💳' : '🏛️'}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">{method.label}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{method.desc}</span>
                    </div>
                 </div>
                 <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                   selectedMethod === method.id ? 'border-indigo-600 bg-indigo-600' : 'border-slate-200'
                 }`}>
                   {selectedMethod === method.id && <span className="text-white text-[10px] font-bold animate-in zoom-in-50">✓</span>}
                 </div>
               </button>
             ))}
           </div>

           <button 
             onClick={handlePaymentInitiation}
             className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-2xl font-bold text-[13px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 group"
           >
             <span className="group-hover:translate-x-1 transition-transform inline-block">
               {status === 'failed' ? 'Retry Payment' : 'Proceed to Checkout'}
             </span>
           </button>
           
           <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-center gap-10">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/1200px-PayPal.svg.png" className="h-4 grayscale opacity-30" alt="PayPal" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" className="h-3 grayscale opacity-30" alt="Visa" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" className="h-6 grayscale opacity-30" alt="Mastercard" />
           </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentGateway;

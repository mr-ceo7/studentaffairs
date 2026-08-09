import { useState } from 'react';
import { X, Smartphone, CreditCard, Loader2, Check, ChevronRight } from 'lucide-react';
import { getSubscriptionTiers, payMpesa, payPaystack, type SubscriptionTier } from '../services/paymentService';
import { useUser } from '../context/UserContext';
import { useEffect } from 'react';
import Loader from './Loader';
import { AnimatedButton, AnimatedInput } from './AnimatedElements';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const { user, refreshUser } = useUser();
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [duration, setDuration] = useState<2 | 4>(2);
  const [step, setStep] = useState<'tiers' | 'payment' | 'processing' | 'success'>('tiers');
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'paystack' | 'airtel'>('mpesa');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      getSubscriptionTiers().then(setTiers);
      setStep('tiers');
      setError('');
    }
  }, [isOpen]);

  const selectedTierData = tiers.find(t => t.tier_id === selectedTier);
  const price = selectedTierData ? (duration === 2 ? selectedTierData.price_2wk : selectedTierData.price_4wk) : 0;

  const handlePay = async () => {
    if (!selectedTier) return;
    setLoading(true);
    setError('');
    setStep('processing');

    try {
      if (paymentMethod === 'mpesa') {
        if (!phone || phone.length < 9) {
          setError('Enter a valid phone number');
          setStep('payment');
          setLoading(false);
          return;
        }
        await payMpesa(phone, selectedTier, duration);
      } else {
        const response = await payPaystack(selectedTier, duration);
        if (response.access_code) {
          const paystackKey = (import.meta as any).env.VITE_PAYSTACK_PUBLIC_KEY;
          if (!paystackKey) {
            setError("Paystack configuration missing. Contact admin.");
            setStep('payment');
            setLoading(false);
            return;
          }

          const redirectUrl = encodeURIComponent(`${window.location.origin}${window.location.pathname}`);
          const channels = paymentMethod === 'airtel' ? 'mobile_money' : 'card';
          const gatewayUrl = `https://payments.royalmint.app/?access_code=${response.access_code}&public_key=${paystackKey}&reference=${response.reference}&amount=${price}&email=${encodeURIComponent(user?.email || '')}&redirect_url=${redirectUrl}&channels=${channels}`;
          window.location.href = gatewayUrl;
          return;
        }
      }

      await refreshUser();
      setStep('success');
    } catch (e: unknown) {
      const errMsg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Payment failed';
      setError(errMsg);
      setStep('payment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg clay-card rounded-2xl p-6 md:p-8 border border-white/10 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
          <X size={20} />
        </button>

        {step === 'tiers' && (
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-1">Upgrade to VIP</h2>
              <p className="text-slate-400 text-sm">Unlock high-accuracy premium predictions</p>
            </div>

            {/* Duration Toggle */}
            <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-xl">
              <button
                onClick={() => setDuration(2)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  duration === 2 ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400'
                }`}
              >
                2 Weeks
              </button>
              <button
                onClick={() => setDuration(4)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all relative ${
                  duration === 4 ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400'
                }`}
              >
                4 Weeks
                <span className="absolute -top-2 right-2 bg-green-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">SAVE</span>
              </button>
            </div>

            {/* Tier Cards */}
            <div className="grid grid-cols-2 gap-2.5 md:block md:space-y-3 mb-6">
              {tiers.map((tier) => (
                <button
                  key={tier.tier_id}
                  onClick={() => setSelectedTier(tier.tier_id)}
                  className={`w-full p-3 md:p-4 rounded-xl border text-left transition-all group ${
                    selectedTier === tier.tier_id
                      ? 'border-indigo-500/50 bg-indigo-500/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex flex-col md:flex-row justify-between items-start h-full w-full">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="font-bold text-white text-sm md:text-lg truncate">{tier.name}</h3>
                        {tier.popular && (
                          <span className="bg-tertiary-fixed-dim text-on-tertiary-fixed px-1.5 py-0.5 rounded text-[8px] md:text-[10px] font-bold shrink-0">POPULAR</span>
                        )}
                      </div>
                      <p className="text-slate-400 text-[10px] md:text-xs mt-1 leading-normal line-clamp-2 md:line-clamp-none">{tier.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {tier.categories.filter(c => c !== 'free').map((cat) => (
                          <span key={cat} className="bg-white/10 text-slate-300 px-1.5 py-0.5 rounded text-[8px] md:text-[10px] uppercase font-bold shrink-0">
                            {cat === 'over25' ? 'Over 2.5' : cat}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-2.5 md:mt-0 text-left md:text-right w-full md:w-auto shrink-0">
                      <div className="text-base md:text-2xl font-bold text-white">
                        KES {duration === 2 ? tier.price_2wk : tier.price_4wk}
                      </div>
                      <div className="text-[10px] md:text-xs text-slate-400">/{duration}w</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <AnimatedButton
              onClick={() => {
                if (selectedTier) {
                  if (selectedTierData?.currency !== 'KES') {
                    setPaymentMethod('paystack');
                  } else {
                    setPaymentMethod('mpesa');
                  }
                  setStep('payment');
                }
              }}
              disabled={!selectedTier}
            >
              Continue
            </AnimatedButton>
          </>
        )}

        {step === 'payment' && (
          <>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white mb-1">Choose Payment Method</h2>
              <p className="text-slate-400 text-sm">{selectedTierData?.name} — KES {price} / {duration} weeks</p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
            )}

            <div className="space-y-3 mb-6">
              {(selectedTierData?.currency === 'KES' || !selectedTierData) && (
                <>
                  <button
                    onClick={() => setPaymentMethod('mpesa')}
                    className={`w-full p-4 rounded-xl border text-left flex items-center gap-3 transition-all ${
                      paymentMethod === 'mpesa' ? 'border-green-500/50 bg-green-500/10' : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <Smartphone size={24} className="text-green-400" />
                    <div>
                      <div className="font-bold text-white">M-Pesa</div>
                      <div className="text-xs text-slate-400">Pay via Safaricom M-Pesa</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('airtel')}
                    className={`w-full p-4 rounded-xl border text-left flex items-center gap-3 transition-all ${
                      paymentMethod === 'airtel' ? 'border-red-500/50 bg-red-500/10' : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <img src="/airtel.svg" alt="Airtel Money" className="h-6 object-contain" />
                    <div>
                      <div className="font-bold text-white">Airtel Money</div>
                      <div className="text-xs text-slate-400">Pay via Airtel Money (Paystack)</div>
                    </div>
                  </button>
                </>
              )}
              <button
                onClick={() => setPaymentMethod('paystack')}
                className={`w-full p-4 rounded-xl border text-left flex items-center gap-3 transition-all ${
                  paymentMethod === 'paystack' ? 'border-blue-500/50 bg-blue-500/10' : 'border-white/10 bg-white/5'
                }`}
              >
                <CreditCard size={24} className="text-blue-400" />
                <div>
                  <div className="font-bold text-white">Card / Paystack</div>
                  <div className="text-xs text-slate-400">Visa, Mastercard, or Mobile Money</div>
                </div>
              </button>
            </div>             {paymentMethod === 'mpesa' && (
              <div className="pt-2">
                <AnimatedInput
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  labelText="M-Pesa Phone Number"
                />
              </div>
            )}

            <div className="flex gap-4 items-end mt-4">
              <button onClick={() => setStep('tiers')} className="px-6 py-2.5 rounded-xl font-semibold text-slate-400 glass-panel hover:bg-white/10 transition-all text-xs h-[46px] shrink-0">
                Back
              </button>
              <div className="flex-1">
                <AnimatedButton onClick={handlePay} disabled={loading}>
                  {loading ? 'Processing...' : `Pay KES ${price}`}
                </AnimatedButton>
              </div>
            </div>
          </>
        )}

        {step === 'processing' && (
          <div className="text-center py-12">
            <div className="mb-4"><Loader size={48} /></div>
            <h2 className="text-xl font-bold text-white mb-2">Processing Payment</h2>
            <p className="text-slate-400 text-sm">
              {paymentMethod === 'mpesa' ? 'Check your phone for the M-Pesa prompt...' : 'Redirecting to payment gateway...'}
            </p>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Payment Successful!</h2>
            <p className="text-slate-400 text-sm mb-6">You now have access to premium tips. Enjoy!</p>
            <AnimatedButton onClick={onClose}>
              View Premium Tips
            </AnimatedButton>
          </div>
        )}
      </div>
    </div>
  );
}

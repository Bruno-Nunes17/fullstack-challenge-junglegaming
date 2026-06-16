import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from 'react-oidc-context';
import { useGameStore, RoundStatus } from '../stores/useGameStore';
import { api } from '../services/api';
import { soundService } from '../services/sounds';
import { toast } from 'sonner';
import { X, Bot } from 'lucide-react';
import type { AxiosError } from 'axios';

function MultiplierValue({ amount }: { amount: number }) {
  const multiplier = useGameStore(state => state.multiplier);
  return <span>R$ {(amount * multiplier).toFixed(2)}</span>;
}

export function BettingPanel() {
  const [amount, setAmount] = useState<string>('10.00');
  const [autoCashout, setAutoCashout] = useState<string>('');
  const [isAutoBet, setIsAutoBet] = useState(false);
  const [isPending, setIsPending] = useState(false);
  
  const auth = useAuth();
  
  const status = useGameStore(state => state.status);
  const bets = useGameStore(state => state.bets);

  const myBet = bets.find(b => b.playerId === auth.user?.profile.sub);
  const hasBetInRound = !!myBet;
  const cashedOut = myBet?.cashedOut || false;

  const numAmount = parseFloat(amount);
  const numAutoCashout = parseFloat(autoCashout);
  const isAmountValid = !isNaN(numAmount) && numAmount >= 1.00 && numAmount <= 1000.00;
  
  const canBet = status === RoundStatus.WAITING_FOR_BETS && !hasBetInRound && isAmountValid;
  const canCashOut = status === RoundStatus.IN_PROGRESS && hasBetInRound && !cashedOut;

  const handleBet = useCallback(async () => {
    if (!auth.user || isPending) return;
    if (!isAmountValid) {
      toast.error('A aposta deve ser entre R$ 1,00 e R$ 1.000,00');
      return;
    }

    setIsPending(true);
    try {
      await api.post('/games/bet', { 
        amount: numAmount,
        autoCashoutMultiplier: !isNaN(numAutoCashout) && numAutoCashout >= 1.10 ? numAutoCashout : undefined
      }, {
        headers: { Authorization: `Bearer ${auth.user.access_token}` }
      });
      soundService.playBet();
      toast.success('Aposta realizada com sucesso!');
    } catch (e: unknown) {
      const error = e as AxiosError<{ message: string }>;
      toast.error(error?.response?.data?.message || 'Falha ao apostar. Verifique seu saldo.');
      if (isAutoBet) setIsAutoBet(false);
    } finally {
      setIsPending(false);
    }
  }, [auth.user, isPending, isAmountValid, numAmount, numAutoCashout, isAutoBet]);

  useEffect(() => {
    if (status === RoundStatus.WAITING_FOR_BETS && isAutoBet && !hasBetInRound && !isPending) {
      const timer = setTimeout(() => {
        handleBet();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [status, isAutoBet, hasBetInRound, isPending, handleBet]);

  const handleCashOut = async () => {
    if (!auth.user || isPending) return;
    setIsPending(true);
    try {
      await api.post('/games/bet/cashout', {}, {
        headers: { Authorization: `Bearer ${auth.user.access_token}` }
      });
    } catch (e: unknown) {
      const error = e as AxiosError<{ message: string }>;
      toast.error(error?.response?.data?.message || 'Falha no cash out.');
    } finally {
      setIsPending(false);
    }
  };

  const getBetButtonText = () => {
    if (isPending) return 'PROCESSANDO...';
    if (!hasBetInRound) return isAutoBet ? 'AUTO APOSTANDO...' : 'APOSTAR';
    if (cashedOut) return 'SAQUE REALIZADO';
    if (!isNaN(numAutoCashout) && numAutoCashout >= 1.10) return `AUTO @ ${numAutoCashout.toFixed(2)}x`;
    return 'APOSTA FEITA';
  };

  return (
    <div className="bg-[#0c0c0e] p-6 rounded-4xl border border-white/10 shadow-2xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent pointer-events-none opacity-50"></div>
      
      <div className="flex justify-between items-center mb-6 relative z-10">
        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]"></span>
          Controles
        </h2>
        
        <button 
          onClick={() => setIsAutoBet(!isAutoBet)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
            isAutoBet 
              ? 'bg-primary/20 border-primary/50 text-primary shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
              : 'bg-white/5 border-white/10 text-muted-foreground opacity-50 hover:opacity-100'
          }`}
        >
          <Bot size={14} />
          <span className="text-[10px] font-black uppercase tracking-widest">Auto Bet</span>
        </button>
      </div>
      
      <div className="space-y-6 relative z-10">
        <div className="flex flex-col gap-5">
          <div>
            <label className="text-[10px] uppercase font-black text-muted-foreground mb-3 block tracking-widest opacity-60">
              Valor da Aposta (BRL) { !isAmountValid && amount !== '' && <span className="text-red-500 ml-2">Mín: 1 - Máx: 1000</span> }
            </label>
            <div className="relative group/input">
               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-black group-focus-within/input:text-primary transition-colors">R$</span>
               <input 
                 type="number" 
                 value={amount}
                 onChange={(e) => setAmount(e.target.value)}
                 disabled={hasBetInRound || isPending}
                 className={`w-full bg-black/40 border-2 ${!isAmountValid && amount !== '' ? 'border-red-500/50 focus:border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'border-white/5 focus:border-primary shadow-inner'} rounded-2xl pl-12 pr-4 py-4 font-black text-xl outline-none transition-all disabled:opacity-30 disabled:grayscale`}
                 placeholder="0.00" 
               />
            </div>
          </div>
          
          <div>
            <label className="text-[10px] uppercase font-black text-muted-foreground mb-3 block tracking-widest opacity-60">
              Auto Cashout (Opcional)
            </label>
            <div className="flex gap-2">
              <div className="relative group/input flex-1">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-black group-focus-within/input:text-primary transition-colors">x</span>
                 <input 
                   type="number" 
                   step="0.01"
                   value={autoCashout}
                   onChange={(e) => setAutoCashout(e.target.value)}
                   disabled={hasBetInRound || isPending}
                   className="w-full bg-black/40 border-2 border-white/5 focus:border-primary shadow-inner rounded-2xl pl-10 pr-4 py-4 font-black text-xl outline-none transition-all disabled:opacity-30 disabled:grayscale placeholder:opacity-20 placeholder:font-medium"
                   placeholder="0.00" 
                 />
              </div>
              <button
                onClick={() => setAutoCashout('')}
                disabled={hasBetInRound || isPending || !autoCashout}
                className="w-14 h-14 shrink-0 flex items-center justify-center bg-white/5 hover:bg-red-500/20 text-muted-foreground hover:text-red-500 border border-white/5 rounded-2xl transition-all disabled:opacity-0"
              >
                <X size={20} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {canCashOut ? (
             <motion.button 
               key="cashout"
               initial={{ opacity: 0, scale: 0.9, y: 10 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 1.1, y: -10 }}
               whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(16, 185, 129, 0.4)" }}
               whileTap={{ scale: 0.98 }}
               onClick={handleCashOut}
               disabled={isPending}
               className="w-full py-6 bg-green-500 text-white rounded-3xl font-black text-2xl shadow-[0_0_40px_rgba(16,185,129,0.3)] flex flex-col items-center justify-center leading-tight disabled:opacity-50 cursor-pointer overflow-hidden relative group/btn"
             >
               <span className="relative z-10">{isPending ? 'SACANDO...' : 'SACAR'}</span>
               <span className="text-sm opacity-90 font-bold relative z-10">
                 <MultiplierValue amount={numAmount} />
               </span>
             </motion.button>
          ) : (
             <motion.button 
               key="bet"
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               whileHover={canBet ? { scale: 1.02, boxShadow: "0 0 30px rgba(255, 255, 255, 0.2)" } : {}}
               whileTap={canBet ? { scale: 0.98 } : {}}
               onClick={handleBet}
               disabled={!canBet || isPending}
               className={`w-full py-6 rounded-3xl font-black text-2xl transition-all uppercase cursor-pointer disabled:cursor-not-allowed ${
                 hasBetInRound 
                   ? 'bg-white/5 text-muted-foreground border border-white/10' 
                   : 'bg-primary text-primary-foreground shadow-xl'
               }`}
             >
               {getBetButtonText()}
             </motion.button>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 gap-3">
           {[2, 5, 10, 50].map(val => (
             <motion.button 
               whileHover={{ y: -2, backgroundColor: "rgba(255,255,255,0.1)" }}
               whileTap={{ scale: 0.95 }}
               key={val}
               onClick={() => setAmount(val.toFixed(2))}
               disabled={hasBetInRound || isPending}
               className="py-3 bg-white/5 text-muted-foreground border border-white/5 rounded-xl font-black text-[10px] tracking-widest uppercase transition-colors disabled:opacity-20 cursor-pointer"
             >
               R$ {val}
             </motion.button>
           ))}
        </div>
      </div>
    </div>
  );
}

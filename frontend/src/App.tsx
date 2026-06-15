import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useAuth } from "react-oidc-context";
import { socketService } from './services/socket';
import { useGameStore, RoundStatus } from './stores/useGameStore';
import type { Round, Bet, GameHistory } from './stores/useGameStore';
import { CrashCanvas } from './components/CrashCanvas';
import { BettingPanel } from './components/BettingPanel';
import { api, setAuthToken } from './services/api';
import { useWallet } from './hooks/useWallet';
import { Wallet, History, Users, ShieldCheck } from 'lucide-react';

function App() {
  const auth = useAuth();
  
  
  const setRound = useGameStore(state => state.setRound);
  const reset = useGameStore(state => state.reset);
  const updateMultiplier = useGameStore(state => state.updateMultiplier);
  const crash = useGameStore(state => state.crash);
  const addBet = useGameStore(state => state.addBet);
  const updateBetCashout = useGameStore(state => state.updateBetCashout);
  const setHistory = useGameStore(state => state.setHistory);
  
  const bets = useGameStore(state => state.bets);
  const history = useGameStore(state => state.history);
  const serverSeedHash = useGameStore(state => state.serverSeedHash);

  const { data: wallet } = useWallet();

  useEffect(() => {
    if (auth.user) {
      setAuthToken(auth.user.access_token);
    }
  }, [auth.user]);

  useEffect(() => {
    if (!auth.isAuthenticated) return;

    socketService.connect();

    socketService.on<Round>('round_waiting', (data) => {
      reset();
      setRound({ ...data, status: RoundStatus.WAITING_FOR_BETS });
    });

    socketService.on<Round>('round_starting', (data) => {
      setRound({ ...data, status: RoundStatus.STARTING });
    });

    socketService.on<Round>('round_progress_start', (data) => {
      setRound({ ...data, status: RoundStatus.IN_PROGRESS });
    });

    socketService.on<{ multiplier: number }>('multiplier_update', (data) => {
      updateMultiplier(data.multiplier);
    });

    socketService.on<{ multiplier: number, serverSeed: string }>('round_crashed', (data) => {
      crash(data.multiplier, data.serverSeed);
    });

    socketService.on<Bet>('bet_placed', (data) => {
      addBet(data);
    });

    socketService.on<{ betId: string, multiplier: number, payout: number }>('bet_cashed_out', (data) => {
      updateBetCashout(data.betId, data.multiplier, data.payout);
    });

    api.get<Round>('/games/rounds/current').then((res) => {
      if (res.data.id) setRound(res.data);
    }).catch(console.error);

    api.get<GameHistory[]>('/games/rounds/history').then((res) => {
      setHistory(res.data);
    }).catch(console.error);

    return () => {
      socketService.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isAuthenticated]);

  if (auth.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground gap-8 p-4">
        <div className="text-center">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-primary mb-4 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">JUNGLE CRASH</h1>
          <p className="text-muted-foreground text-xl md:text-2xl max-w-md mx-auto">Sinta a emoção do multiplicador. Arrisque tudo ou saque cedo.</p>
        </div>
        <button 
          onClick={() => auth.signinRedirect()}
          className="px-10 py-5 bg-primary text-primary-foreground rounded-2xl font-black text-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_10px_40px_rgba(255,255,255,0.1)]"
        >
          COMEÇAR A JOGAR
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-foreground flex flex-col relative overflow-hidden">
      {}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>

      <header className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-background/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.5)]">
              <span className="text-primary-foreground font-black text-xl">J</span>
           </div>
           <h1 className="text-xl font-black tracking-tighter text-primary hidden sm:block drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">JUNGLE CRASH</h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
             <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Jogador</span>
             <span className="text-sm font-bold">{auth.user?.profile.preferred_username}</span>
          </div>
          <button 
            onClick={() => auth.signoutRedirect()}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-colors border border-white/10"
          >
            Sair
          </button>
        </div>
      </header>
      
      <main className="flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-[1600px] mx-auto w-full relative z-10">
        <div className="lg:col-span-3 space-y-6">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
             {history.map((h: GameHistory, i: number) => (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.5, x: -20 }}
                 animate={{ opacity: 1, scale: 1, x: 0 }}
                 transition={{ type: "spring", stiffness: 500, damping: 30 }}
                 key={h.id || i} 
                 className={`shrink-0 px-3 py-1 rounded-lg text-xs font-black border cursor-default shadow-lg backdrop-blur-sm ${
                   h.multiplier >= 2 ? 'bg-green-500/10 border-green-500/50 text-green-400 shadow-green-500/20' : 'bg-red-500/10 border-red-500/50 text-red-400 shadow-red-500/20'
                 }`}
               >
                 {Number(h.multiplier).toFixed(2)}x
               </motion.div>
             ))}
          </div>

          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="aspect-video bg-[#0c0c0e] rounded-4xl border border-white/10 relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] group ring-1 ring-white/5"
          >
             <div className="absolute inset-0 bg-linear-to-t from-background/80 to-transparent pointer-events-none z-10"></div>
             <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[40px_40px] pointer-events-none"></div>
             <CrashCanvas />
             
             <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/10 z-20">
                <ShieldCheck size={14} className="text-primary" />
                <span className="text-[10px] font-mono text-muted-foreground truncate max-w-30">
                  {serverSeedHash || 'Awaiting next round...'}
                </span>
             </div>
          </motion.div>

          <div className="bg-card/30 rounded-4xl border border-white/5 overflow-hidden">
             <div className="px-8 py-4 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                   <Users size={18} className="text-muted-foreground" />
                   <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Apostas Ativas</h2>
                </div>
                <span className="text-xs font-bold text-primary">{bets.length} Jogadores</span>
             </div>
             <div className="max-h-75 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                   <thead className="sticky top-0 bg-card/80 backdrop-blur-md text-[10px] uppercase text-muted-foreground font-black tracking-widest border-b border-white/5">
                      <tr>
                         <th className="px-8 py-4">Usuário</th>
                         <th className="px-8 py-4">Valor</th>
                         <th className="px-8 py-4">Multiplicador</th>
                         <th className="px-8 py-4 text-right">Pagamento</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                      {bets.length === 0 ? (
                        <tr>
                           <td colSpan={4} className="px-8 py-12 text-center text-muted-foreground text-sm italic">Aguardando apostas...</td>
                        </tr>
                      ) : (
                        bets.map((bet: Bet, i: number) => (
                          <tr key={bet.betId || i} className={`transition-colors group ${bet.cashedOut ? 'bg-green-500/10' : 'hover:bg-white/5'}`}>
                             <td className="px-8 py-4 font-bold text-sm">{bet.userName}</td>
                             <td className="px-8 py-4 text-sm font-mono text-muted-foreground">R$ {Number(bet.amount).toFixed(2)}</td>
                             <td className="px-8 py-4">
                                {bet.cashedOut ? (
                                   <span className="px-2 py-1 rounded bg-green-500/20 text-green-500 text-[10px] font-black">{bet.cashOutMultiplier?.toFixed(2)}x</span>
                                ) : (
                                   <span className="text-muted-foreground text-[10px] uppercase font-black animate-pulse">Jogando</span>
                                )}
                             </td>
                             <td className="px-8 py-4 text-right text-sm font-black">
                                {bet.payout ? (
                                   <span className="text-green-400">+ R$ {(Number(bet.payout) / 100).toFixed(2)}</span>
                                ) : '-'}
                             </td>
                          </tr>
                        ))
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-primary p-8 rounded-4xl text-primary-foreground shadow-[0_20px_50px_rgba(255,255,255,0.1)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-6 opacity-80">
                    <Wallet size={16} />
                    <span className="text-xs font-black uppercase tracking-widest">Saldo Disponível</span>
                 </div>
                 <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold opacity-60">R$</span>
                    <h3 className="text-4xl font-black tracking-tighter">
                       {wallet ? (Number(wallet.balance) / 100).toFixed(2) : '0.00'}
                    </h3>
                 </div>
                 <p className="mt-4 text-[10px] font-bold opacity-50 uppercase tracking-widest">Apenas Créditos de Demonstração</p>
              </div>
           </div>

           <BettingPanel />

           <div className="bg-card/50 p-6 rounded-4xl border border-white/5">
              <div className="flex items-center gap-2 mb-4">
                 <History size={16} className="text-muted-foreground" />
                 <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Como jogar</h2>
              </div>
              <ul className="space-y-4 text-xs text-muted-foreground font-medium">
                 <li className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-secondary shrink-0 flex items-center justify-center text-[10px] font-black text-foreground">1</span>
                    Faça sua aposta antes da rodada começar.
                 </li>
                 <li className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-secondary shrink-0 flex items-center justify-center text-[10px] font-black text-foreground">2</span>
                    Acompanhe o multiplicador subir de 1.00x para cima.
                 </li>
                 <li className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-secondary shrink-0 flex items-center justify-center text-[10px] font-black text-foreground">3</span>
                    Saque antes do multiplicador "crashar" para ganhar.
                 </li>
              </ul>
           </div>
        </div>
      </main>
    </div>
  );
}

export default App;

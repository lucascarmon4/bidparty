import { useEffect, useState } from 'react';

interface Props {
  itemTitle: string;
  newAmount: number;
  onCounter: () => void;
  onDismiss: () => void;
}

const COUNTDOWN = 15;

export default function OutbidOverlay({ itemTitle, newAmount, onCounter, onDismiss }: Props) {
  const [seconds, setSeconds] = useState(COUNTDOWN);

  useEffect(() => {
    const t = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) { clearInterval(t); onDismiss(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const pct = (seconds / COUNTDOWN) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full border-2 border-red-500/20 animate-ping" style={{ animationDuration: '1.5s' }} />
      </div>

      <div className="relative bg-[#1a1b2e] border-2 border-red-500/60 rounded-2xl p-8 w-full max-w-md shadow-2xl shadow-red-900/30 text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-20 h-20 rounded-full bg-red-900/40 border-2 border-red-500/50 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          </div>
        </div>

        <h2 className="text-3xl font-black text-white mb-1">Você foi superado!</h2>
        <p className="text-gray-400 text-sm mb-5">
          Outro participante deu um lance maior em
        </p>

        <div className="bg-[#0d0e1a] border border-[#2a2b45] rounded-xl px-5 py-4 mb-6">
          <p className="text-white font-bold text-base truncate">{itemTitle}</p>
          <p className="text-red-400 font-black text-3xl mt-1">
            R$ {newAmount.toLocaleString('pt-BR')}
          </p>
          <p className="text-gray-500 text-xs mt-1">novo lance mais alto</p>
        </div>

        <div className="mb-6">
          <div className="h-1.5 bg-[#2a2b45] rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full transition-all duration-1000"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-gray-600 text-xs mt-1.5">Fechando em {seconds}s</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onDismiss}
            className="flex-1 py-3 bg-[#0d0e1a] border border-[#2a2b45] hover:border-gray-500 text-gray-400 hover:text-white font-medium rounded-xl transition-colors cursor-pointer"
          >
            Desistir
          </button>
          <button
            onClick={onCounter}
            className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Superar Lance
          </button>
        </div>
      </div>
    </div>
  );
}

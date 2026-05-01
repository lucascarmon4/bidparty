import { useEffect, useState } from 'react';

interface Props {
  itemTitle: string;
  amount: number;
  onDismiss: () => void;
}

export default function WonOverlay({ itemTitle, amount, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Pequeno delay para a animação entrar suave
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] rounded-full border border-yellow-400/10 animate-ping" style={{ animationDuration: '2s' }} />
        <div className="absolute w-[350px] h-[350px] rounded-full border border-yellow-400/20 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }} />
      </div>

      <div
        className={`relative bg-[#1a1b2e] border-2 border-yellow-400/60 rounded-2xl p-8 w-full max-w-md shadow-2xl shadow-yellow-900/30 text-center transition-transform duration-300 ${visible ? 'scale-100' : 'scale-90'}`}
      >
        <div className="flex items-center justify-center mb-5">
          <div className="w-24 h-24 rounded-full bg-yellow-900/40 border-2 border-yellow-400/50 flex items-center justify-center">
            <span className="text-5xl">🏆</span>
          </div>
        </div>

        <h2 className="text-4xl font-black text-white mb-1">Você venceu!</h2>
        <p className="text-yellow-400 font-semibold text-sm mb-6">Parabéns, o item é seu!</p>

        <div className="bg-[#0d0e1a] border border-yellow-400/30 rounded-xl px-5 py-4 mb-7">
          <p className="text-white font-bold text-base truncate">{itemTitle}</p>
          <p className="text-yellow-400 font-black text-3xl mt-1">
            R$ {amount.toLocaleString('pt-BR')}
          </p>
          <p className="text-gray-500 text-xs mt-1">seu lance vencedor</p>
        </div>

        <button
          onClick={handleDismiss}
          className="w-full py-3.5 bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-black font-black text-lg rounded-xl transition-all cursor-pointer"
        >
          Incrível! 🎉
        </button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';

const CATEGORIES: { label: string; image: string }[] = [
  { label: 'Eletrônicos',         image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80' },
  { label: 'Relógios & Joias',    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80' },
  { label: 'Moda & Vestuário',    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80' },
  { label: 'Arte & Antiguidades', image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&q=80' },
  { label: 'Colecionáveis',       image: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&q=80' },
  { label: 'Esportes',            image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&q=80' },
  { label: 'Veículos',            image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&q=80' },
  { label: 'Outros',              image: 'https://images.unsplash.com/photo-1578269174936-2709b6aeb913?w=600&q=80' },
];

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

function getLevel(xp: number) { return Math.floor(xp / 1000) + 1; }
const REQUIRED_LEVEL = 3;

export default function CreatePartyModal({ onClose, onCreated }: Props) {
  const { user } = useAuth();
  if (!user) return null;
  const level = getLevel(user.xp);
  const hasLevel = level >= REQUIRED_LEVEL;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(20);
  const [coverImage, setCoverImage] = useState('');

  const handleCategoryChange = (label: string) => {
    setCategory(label);
    const match = CATEGORIES.find((c) => c.label === label);
    if (match && !coverImage) setCoverImage(match.image);
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const defaultImage = CATEGORIES.find((c) => c.label === category)?.image ?? '';
      const res = await fetch('/api/parties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title,
          category,
          scheduledAt,
          maxParticipants,
          coverImage: coverImage || defaultImage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar party');
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#1a1b2e] border border-[#2a2b45] rounded-2xl w-full max-w-md p-6 shadow-xl">

        {!hasLevel ? (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">Nível insuficiente</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-purple-900/40 border border-purple-500/40 flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold text-base">
                  Você precisa atingir o Nível {REQUIRED_LEVEL} para criar uma Party
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Continue participando de leilões e fazendo lances para acumular XP e desbloquear esta função.
                </p>
              </div>
              <div className="w-full bg-[#0d0e1a] border border-[#2a2b45] rounded-xl p-4 flex justify-between text-sm">
                <div className="text-center">
                  <p className="text-gray-400">Seu nível</p>
                  <p className="text-white font-bold text-xl mt-0.5">{level}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400">Nível necessário</p>
                  <p className="text-purple-400 font-bold text-xl mt-0.5">{REQUIRED_LEVEL}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400">XP faltando</p>
                  <p className="text-yellow-400 font-bold text-xl mt-0.5">
                    {Math.max(0, (REQUIRED_LEVEL - 1) * 1000 - user.xp).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full mt-2 py-2.5 bg-[#0d0e1a] border border-[#2a2b45] hover:border-purple-500 text-gray-300 hover:text-white font-medium rounded-lg transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">Criar Party</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-gray-400 text-sm mb-1.5 block">Título</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Coleção de Relógios Vintage"
                  required
                  className="w-full bg-[#0d0e1a] border border-[#2a2b45] text-white placeholder-gray-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-1.5 block">Categoria</label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  required
                  className="w-full bg-[#0d0e1a] border border-[#2a2b45] text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
                >
                  <option value="" disabled>Selecione uma categoria</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.label} value={c.label}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-1.5 block">Data e horário</label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full bg-[#0d0e1a] border border-[#2a2b45] text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-1.5 block">Máximo de participantes</label>
                <input
                  type="number"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Number(e.target.value))}
                  min={2}
                  max={100}
                  required
                  className="w-full bg-[#0d0e1a] border border-[#2a2b45] text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-1.5 block">
                  URL da imagem de capa <span className="text-gray-600">(opcional)</span>
                </label>
                <input
                  type="url"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#0d0e1a] border border-[#2a2b45] text-white placeholder-gray-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <div className="flex gap-3 mt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-[#0d0e1a] border border-[#2a2b45] hover:border-purple-500 text-gray-300 hover:text-white font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {loading ? 'Criando...' : 'Criar Party'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

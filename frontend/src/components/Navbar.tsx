import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';

interface Props {
  onSearch?: (q: string) => void;
}

export default function Navbar({ onSearch }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const avatarUrl = user?.avatarUrl ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username ?? 'guest'}`;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="bg-[#0d0e1a] border-b border-[#2a2b45] px-6 py-3 flex items-center gap-4 sticky top-0 z-50">
      <div className="flex items-center gap-2 shrink-0 cursor-pointer" onClick={() => navigate('/discover')}>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <span className="text-white font-bold text-lg tracking-tight">BidParty</span>
      </div>

      {onSearch && (
        <div className="flex-1 max-w-xl mx-auto">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar parties, itens, usuários..."
              onChange={(e) => onSearch(e.target.value)}
              className="w-full bg-[#1a1b2e] border border-[#2a2b45] text-gray-300 placeholder-gray-600 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 shrink-0 ml-auto">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/profile')}>
          <div className="text-right">
            <p className="text-white text-sm font-semibold leading-tight">{user?.username ?? 'Guest'}</p>
            <p className="text-gray-500 text-xs">
              <span className="text-purple-400 font-semibold">{(user?.xp ?? 0).toLocaleString('pt-BR')} XP</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-800 border-2 border-purple-500">
            <img src={avatarUrl} alt="avatar" className="w-full h-full" />
          </div>
        </div>

        <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer ml-1" title="Sair">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </nav>
  );
}

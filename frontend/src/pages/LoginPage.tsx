import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import type { AuthUser } from '../types/auth.ts';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const url = tab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = tab === 'login' ? { email, password } : { username, email, password };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Algo deu errado');

      login(data.token, data.user as AuthUser);
      navigate('/discover', { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0e1a] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className="text-white font-bold text-2xl tracking-tight">BidParty</span>
        </div>

        <div className="bg-[#1a1b2e] border border-[#2a2b45] rounded-2xl p-8">
          <div className="flex bg-[#0d0e1a] rounded-lg p-1 mb-6">
            <button onClick={() => { setTab('login'); setError(''); }} className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${tab === 'login' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              Entrar
            </button>
            <button onClick={() => { setTab('signup'); setError(''); }} className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${tab === 'signup' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              Cadastrar
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-white text-xl font-bold">{tab === 'login' ? 'Bem-vindo(a) de volta' : 'Criar conta'}</h2>
            <p className="text-gray-500 text-sm mt-1">{tab === 'login' ? 'Entre para continuar licitando' : 'Junte-se ao BidParty e comece a licitar'}</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {tab === 'signup' && (
              <div>
                <label className="text-gray-400 text-sm mb-1.5 block">Nome de usuário</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="BidMaster3000" required className="w-full bg-[#0d0e1a] border border-[#2a2b45] text-white placeholder-gray-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors" />
              </div>
            )}
            <div>
              <label className="text-gray-400 text-sm mb-1.5 block">E-mail</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" required className="w-full bg-[#0d0e1a] border border-[#2a2b45] text-white placeholder-gray-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors" />
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-gray-400 text-sm">Senha</label>
                {tab === 'login' && <a href="#" className="text-purple-400 text-sm hover:text-purple-300">Esqueceu a senha?</a>}
              </div>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="w-full bg-[#0d0e1a] border border-[#2a2b45] text-white placeholder-gray-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors" />
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button type="submit" disabled={loading} className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors mt-1 cursor-pointer">
              {loading ? 'Aguarde...' : tab === 'login' ? 'Entrar' : 'Criar Conta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

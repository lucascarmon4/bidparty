import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext.tsx';
import Navbar from '../components/Navbar.tsx';
import AddItemModal from '../components/AddItemModal.tsx';
import OutbidOverlay from '../components/OutbidOverlay.tsx';
import WonOverlay from '../components/WonOverlay.tsx';

interface LobbyItem {
  id: string;
  title: string;
  imageUrl: string | null;
  startingBid: number;
  positionOrder: number;
  bids: Array<{ amount: number; user: { id: string; username: string } }>;
}

interface LobbyParty {
  id: string;
  title: string;
  category: string;
  status: string;
  scheduledAt: string;
  host: { id: string; username: string; avatarUrl: string | null };
  items: LobbyItem[];
  registrations: Array<{ user: { id: string; username: string; avatarUrl: string | null; xp: number } }>;
  recentBids: Array<{
    id: string;
    amount: number;
    placedAt: string;
    item: { id: string; title: string };
    user: { username: string };
  }>;
}

interface ChatMessage {
  id: string;
  username: string;
  avatarUrl: string | null;
  content: string;
  sentAt: string;
  isMe: boolean;
}

interface BidLog {
  id: string;
  itemId: string;
  itemTitle: string;
  amount: number;
  username: string;
  at: string;
}

interface OutbidInfo {
  itemId: string;
  itemTitle: string;
  newAmount: number;
}

interface Toast {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success';
}

function getLevel(xp: number) { return Math.floor(xp / 1000) + 1; }

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return '00:00:00';
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
  return `${Math.floor(diff / 3600)}h atrás`;
}

function currentBid(item: LobbyItem): number {
  return item.bids[0]?.amount ?? item.startingBid;
}
function currentBidder(item: LobbyItem): string | null {
  return item.bids[0]?.user.username ?? null;
}

export default function LobbyPage() {
  const { partyId } = useParams<{ partyId: string }>();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [party, setParty] = useState<LobbyParty | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [bidLog, setBidLog] = useState<BidLog[]>([]);
  const [bidInputs, setBidInputs] = useState<Record<string, string>>({});
  const [bidding, setBidding] = useState<string | null>(null);
  const [outbidInfo, setOutbidInfo] = useState<OutbidInfo | null>(null);
  const [wonQueue, setWonQueue] = useState<Array<{ itemId: string; itemTitle: string; amount: number }>>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showAddItem, setShowAddItem] = useState(false);

  // Refs for stale-closure-safe socket handlers
  const partyRef = useRef<LobbyParty | null>(null);
  const userRef = useRef(user);
  const updateUserRef = useRef(updateUser);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const bidLogEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => { partyRef.current = party; }, [party]);
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { updateUserRef.current = updateUser; }, [updateUser]);

  const addToast = (message: string, type: Toast['type'] = 'info') => {
    const id = String(Date.now());
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  useEffect(() => {
    if (!partyId) return;
    const token = localStorage.getItem('token');
    fetch(`/api/parties/${partyId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data: LobbyParty) => {
        setParty(data);
        const secs = Math.floor((new Date(data.scheduledAt).getTime() - Date.now()) / 1000);
        setTimeLeft(Math.max(0, secs));
        setBidLog(
          data.recentBids.map((b) => ({
            id: b.id,
            itemId: b.item.id,
            itemTitle: b.item.title,
            amount: b.amount,
            username: b.user.username,
            at: b.placedAt,
          })),
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [partyId]);

  useEffect(() => {
    const t = setInterval(() => setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!partyId) return;
    const token = localStorage.getItem('token');
    const socket = io('/', { auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_lobby', { partyId });
    });

    socket.on('new_chat_message', (msg: { id: string; username: string; avatarUrl: string | null; content: string; sentAt: string }) => {
      setMessages((prev) => [...prev, { ...msg, isMe: msg.username === userRef.current?.username }]);
    });

    socket.on('bid_updated', ({ itemId, amount, username }: { itemId: string; amount: number; userId: string; username: string }) => {
      const itemTitle = partyRef.current?.items.find((i) => i.id === itemId)?.title ?? 'Item';

      setParty((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.id === itemId
              ? { ...item, bids: [{ amount, user: { id: '', username } }, ...item.bids] }
              : item,
          ),
        };
      });

      setBidLog((prev) => [
        { id: `live-${Date.now()}`, itemId, itemTitle, amount, username, at: new Date().toISOString() },
        ...prev,
      ].slice(0, 100));
    });

    socket.on('outbid_alert', ({ itemId, newAmount }: { message: string; itemId: string; newAmount: number }) => {
      const itemTitle = partyRef.current?.items.find((i) => i.id === itemId)?.title ?? 'Item';
      setOutbidInfo({ itemId, itemTitle, newAmount });
    });

    socket.on('xp_gained', ({ xp }: { xp: number }) => {
      addToast(`+${xp} XP ganhos!`, 'success');
      updateUserRef.current({ xp: (userRef.current?.xp ?? 0) + xp });
    });

    socket.on('party_status_changed', ({ status }: { status: string }) => {
      setParty((prev) => prev ? { ...prev, status } : prev);
      if (status === 'live') addToast('O leilão começou! Faça seus lances 🔥', 'success');
      if (status === 'ended') addToast('O leilão foi encerrado.', 'info');
    });

    socket.on('item_won', ({ itemId, itemTitle, amount }: { itemId: string; itemTitle: string; amount: number }) => {
      setWonQueue((prev) => [...prev, { itemId, itemTitle, amount }]);
    });

    socket.on('error', ({ message }: { message: string }) => {
      addToast(message, 'warning');
    });

    return () => {
      socket.emit('leave_lobby', { partyId });
      socket.disconnect();
    };
  }, [partyId]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { bidLogEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, []);

  const sendMessage = () => {
    if (!chatInput.trim() || !socketRef.current) return;
    socketRef.current.emit('send_chat_message', { partyId, content: chatInput.trim() });
    setChatInput('');
  };

  const placeBid = (itemId: string) => {
    const amount = Number(bidInputs[itemId]);
    if (!amount || !socketRef.current) return;
    setBidding(itemId);
    socketRef.current.emit('place_bid', { itemId, amount });
    setBidInputs((prev) => ({ ...prev, [itemId]: '' }));
    setTimeout(() => setBidding(null), 1200);
  };

  const handleCounter = (itemId: string, newAmount: number) => {
    setBidInputs((prev) => ({ ...prev, [itemId]: String(newAmount + 1) }));
    setOutbidInfo(null);
    document.getElementById(`item-${itemId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const isHost = user?.id === party?.host.id;
  const isLive = party?.status === 'live';
  const isEnded = party?.status === 'ended';

  const chatPanel = (compact = false) => (
    <div className="bg-[#1a1b2e] border border-[#2a2b45] rounded-xl flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2b45] shrink-0">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-white font-semibold text-sm">{isLive ? 'Chat' : 'Chat de Aquecimento'}</span>
        </div>
        <span className="text-gray-500 text-xs">{party?.registrations.length ?? 0} participantes</span>
      </div>

      <div
        className="flex-1 overflow-y-auto p-3 flex flex-col gap-1"
        style={{ maxHeight: compact ? '380px' : '420px', minHeight: '200px' }}
      >
        {messages.length === 0 && (
          <p className="text-gray-600 text-sm text-center mt-8">Nenhuma mensagem ainda. Diga olá! 👋</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-start gap-2 px-2 py-1.5 rounded-lg ${msg.isMe ? 'bg-[#0d0e1a]' : ''}`}>
            <img
              src={msg.avatarUrl ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.username}`}
              alt={msg.username}
              className="w-7 h-7 rounded-full bg-purple-800 shrink-0"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-white text-xs font-semibold">{msg.username}</span>
                <span className="text-gray-600 text-xs">{timeAgo(msg.sentAt)}</span>
              </div>
              <p className="text-gray-300 text-xs mt-0.5">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {!isEnded && (
        <div className="px-3 py-3 border-t border-[#2a2b45] shrink-0 flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-[#0d0e1a] border border-[#2a2b45] text-gray-300 placeholder-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
          />
          <button
            onClick={sendMessage}
            className="w-9 h-9 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center justify-center cursor-pointer shrink-0"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0e1a] text-white">
        <Navbar />
        <div className="flex items-center justify-center py-20 text-gray-500">Carregando lobby...</div>
      </div>
    );
  }

  if (!party) {
    return (
      <div className="min-h-screen bg-[#0d0e1a] text-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-4">
          <p>Party não encontrada.</p>
          <button onClick={() => navigate('/discover')} className="text-purple-400 hover:text-purple-300 text-sm cursor-pointer">
            Voltar para Discover
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0e1a] text-white">
      <Navbar />

      <div className={`text-white text-sm font-medium py-2.5 flex items-center justify-center gap-2 ${isLive ? 'bg-green-600' : isEnded ? 'bg-gray-700' : 'bg-purple-700'}`}>
        {isLive ? (
          <><span className="w-2 h-2 rounded-full bg-white animate-pulse inline-block" /> Leilão ao vivo — faça seus lances!</>
        ) : isEnded ? (
          <>Leilão encerrado</>
        ) : (
          <>Você está dentro! Prepare-se para a party 🎉</>
        )}
      </div>

      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-xl text-sm font-medium shadow-lg max-w-sm ${
              t.type === 'warning' ? 'bg-orange-900/90 text-orange-200 border border-orange-700' :
              t.type === 'success' ? 'bg-green-900/90 text-green-200 border border-green-700' :
              'bg-[#1a1b2e] text-gray-200 border border-[#2a2b45]'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{party.title}</h1>
              {isLive && <span className="bg-green-600 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">AO VIVO</span>}
              {isEnded && <span className="bg-gray-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">ENCERRADO</span>}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">{party.category}</span>
              <span className="text-gray-400 text-sm">por {party.host.username}</span>
            </div>
          </div>

          {isHost && !isLive && !isEnded && (
            <button
              onClick={() => socketRef.current?.emit('start_party', { partyId })}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <span className="w-2 h-2 rounded-full bg-white inline-block" />
              Iniciar Leilão
            </button>
          )}
          {isHost && isLive && (
            <button
              onClick={() => socketRef.current?.emit('end_party', { partyId })}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
            >
              Encerrar Leilão
            </button>
          )}
        </div>

        {isLive || isEnded ? (
          <div className="grid gap-5" style={{ gridTemplateColumns: '1.1fr 1fr 0.9fr' }}>
            <div className="flex flex-col gap-3">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                Itens do Leilão
                <span className="bg-[#2a2b45] text-gray-400 text-xs px-2 py-0.5 rounded-full">{party.items.length}</span>
              </h3>

              {party.items.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhum item neste leilão.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {party.items.map((item) => {
                    const price = currentBid(item);
                    const bidder = currentBidder(item);
                    const minNext = Math.floor(price) + 1;
                    const isBidding = bidding === item.id;
                    return (
                      <div key={item.id} id={`item-${item.id}`} className="bg-[#1a1b2e] border border-[#2a2b45] rounded-xl overflow-hidden">
                        <div className="flex items-center gap-3 p-3">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.title} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-[#2a2b45] shrink-0 flex items-center justify-center text-2xl">📦</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold text-sm truncate">{item.title}</p>
                            <p className="text-yellow-400 font-black text-xl">R$ {price.toLocaleString('pt-BR')}</p>
                            {isEnded ? (
                              bidder ? (
                                <p className="text-green-400 text-xs font-semibold truncate">🏆 {bidder}</p>
                              ) : (
                                <p className="text-gray-500 text-xs">Sem lances</p>
                              )
                            ) : (
                              <p className="text-gray-500 text-xs truncate">
                                {bidder ? `Lance de ${bidder}` : 'Nenhum lance ainda'}
                              </p>
                            )}
                          </div>
                        </div>

                        {!isEnded && (
                          <div className="px-3 pb-3 flex gap-2">
                            <input
                              type="number"
                              value={bidInputs[item.id] ?? ''}
                              onChange={(e) => setBidInputs((prev) => ({ ...prev, [item.id]: e.target.value }))}
                              onKeyDown={(e) => e.key === 'Enter' && placeBid(item.id)}
                              placeholder={`Mín. R$ ${minNext.toLocaleString('pt-BR')}`}
                              min={minNext}
                              className="flex-1 bg-[#0d0e1a] border border-[#2a2b45] text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                            />
                            <button
                              onClick={() => placeBid(item.id)}
                              disabled={isBidding || !bidInputs[item.id]}
                              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm transition-colors cursor-pointer shrink-0"
                            >
                              {isBidding ? '...' : 'Dar Lance'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-[#1a1b2e] border border-[#2a2b45] rounded-xl flex flex-col">
              <div className="px-4 py-3 border-b border-[#2a2b45] flex items-center gap-2 shrink-0">
                <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="text-white font-semibold text-sm">Atividade de Lances</span>
                <span className="ml-auto bg-[#2a2b45] text-gray-400 text-xs px-2 py-0.5 rounded-full">{bidLog.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2" style={{ maxHeight: '500px' }}>
                {bidLog.length === 0 ? (
                  <p className="text-gray-600 text-sm text-center mt-8">Nenhum lance ainda. Seja o primeiro!</p>
                ) : (
                  bidLog.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-2 px-2 py-2 bg-[#0d0e1a] rounded-lg">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.username}`}
                        alt={entry.username}
                        className="w-7 h-7 rounded-full bg-purple-800 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-white text-xs font-semibold truncate">{entry.username}</span>
                          <span className="text-gray-600 text-xs shrink-0">{timeAgo(entry.at)}</span>
                        </div>
                        <p className="text-gray-500 text-xs truncate">{entry.itemTitle}</p>
                        <p className="text-yellow-400 font-bold text-sm">R$ {entry.amount.toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={bidLogEndRef} />
              </div>
            </div>

            {chatPanel(true)}
          </div>

        ) : (
          <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1.6fr 1fr' }}>
            <div className="flex flex-col gap-4">
              <div className="bg-gradient-to-br from-purple-600 to-purple-900 rounded-xl p-6 text-center">
                <div className="flex items-center justify-center gap-2 text-white/70 text-sm mb-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Começa em
                </div>
                <div className="text-4xl font-bold text-white tracking-widest tabular-nums">
                  {formatCountdown(timeLeft)}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold flex items-center gap-2 text-sm">
                    Itens do Leilão
                    <span className="bg-[#2a2b45] text-gray-400 text-xs px-2 py-0.5 rounded-full">{party.items.length}</span>
                  </h3>
                  {isHost && (
                    <button
                      onClick={() => setShowAddItem(true)}
                      className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Adicionar
                    </button>
                  )}
                </div>
                {party.items.length === 0 ? (
                  <p className="text-gray-500 text-sm">Nenhum item adicionado ainda.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {party.items.map((item) => (
                      <div key={item.id} className="bg-[#1a1b2e] border border-[#2a2b45] rounded-xl p-3 flex items-center gap-3 group">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.title} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-[#2a2b45] shrink-0 flex items-center justify-center text-gray-600 text-xl">📦</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{item.title}</p>
                          <p className="text-gray-500 text-xs">Lance inicial</p>
                        </div>
                        <span className="text-yellow-400 font-bold text-sm shrink-0">
                          R$ {item.startingBid.toLocaleString('pt-BR')}
                        </span>
                        {isHost && (
                          <button
                            onClick={async () => {
                              const token = localStorage.getItem('token');
                              await fetch(`/api/parties/${party.id}/items/${item.id}`, {
                                method: 'DELETE',
                                headers: { Authorization: `Bearer ${token}` },
                              });
                              setParty((prev) => prev ? { ...prev, items: prev.items.filter((i) => i.id !== item.id) } : prev);
                            }}
                            className="text-gray-600 hover:text-red-400 transition-colors cursor-pointer opacity-0 group-hover:opacity-100 shrink-0 ml-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {chatPanel(false)}

            <div>
              <h3 className="text-white font-semibold flex items-center gap-2 mb-3 text-sm">
                Participantes
                <span className="bg-[#2a2b45] text-gray-400 text-xs px-2 py-0.5 rounded-full">{party.registrations.length}</span>
              </h3>
              {party.registrations.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhum participante ainda.</p>
              ) : (
                <div className="bg-[#1a1b2e] border border-[#2a2b45] rounded-xl overflow-hidden">
                  {party.registrations.map(({ user: p }, i) => (
                    <div key={p.id} className={`flex items-center gap-3 px-3 py-3 ${i < party.registrations.length - 1 ? 'border-b border-[#2a2b45]' : ''}`}>
                      <img src={p.avatarUrl ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`} alt={p.username} className="w-9 h-9 rounded-full bg-purple-800 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{p.username}</p>
                        <p className="text-gray-500 text-xs">{p.xp.toLocaleString('pt-BR')} XP</p>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">{getLevel(p.xp)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {wonQueue.length > 0 && (
        <WonOverlay
          itemTitle={wonQueue[0].itemTitle}
          amount={wonQueue[0].amount}
          onDismiss={() => setWonQueue((prev) => prev.slice(1))}
        />
      )}

      {outbidInfo && (
        <OutbidOverlay
          itemTitle={outbidInfo.itemTitle}
          newAmount={outbidInfo.newAmount}
          onCounter={() => handleCounter(outbidInfo.itemId, outbidInfo.newAmount)}
          onDismiss={() => setOutbidInfo(null)}
        />
      )}

      {showAddItem && (
        <AddItemModal
          partyId={party.id}
          onClose={() => setShowAddItem(false)}
          onAdded={(item) => {
            setParty((prev) => prev ? { ...prev, items: [...prev.items, { ...item, bids: [] }] } : prev);
            setShowAddItem(false);
          }}
        />
      )}
    </div>
  );
}

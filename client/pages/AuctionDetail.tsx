import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Gavel, ArrowLeft, Clock, TrendingUp, Tag, User, ChevronUp, AlertCircle } from 'lucide-react';
import type { AuctionDetail } from '@shared/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('lotgo_token');
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

function useCountdown(endsAt: string) {
  const [text, setText] = useState('');
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    function update() {
      const diff = Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000));
      if (diff <= 0) { setText('Завершён'); setUrgent(false); return; }
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setUrgent(diff < 300);
      if (h > 0) setText(`${h}ч ${m}м ${s}с`);
      else if (m > 0) setText(`${m}м ${s}с`);
      else setText(`${s}с`);
    }
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [endsAt]);

  return { text, urgent };
}

export default function AuctionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['auction', id],
    queryFn: async () => {
      const res = await fetch(`/api/auctions/${id}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Не найден');
      return (await res.json()).auction as AuctionDetail;
    },
    enabled: !!id,
    refetchInterval: 10_000,
  });

  const bidMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await fetch(`/api/auctions/${id}/bids`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      setBidAmount('');
      setError('');
      queryClient.invalidateQueries({ queryKey: ['auction', id] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const { text: countdown, urgent } = useCountdown(data?.endsAt ?? new Date().toISOString());

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b px-4 py-3">
          <Link to="/catalog" className="flex items-center gap-2 text-[#2563EB] font-semibold w-fit text-sm">
            <ArrowLeft className="w-4 h-4" /> Каталог
          </Link>
        </header>
        <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
          <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
            <div className="h-80 bg-slate-200" />
            <div className="p-8 space-y-4">
              <div className="h-3 bg-slate-200 rounded w-1/6" />
              <div className="h-8 bg-slate-200 rounded w-2/3" />
              <div className="h-4 bg-slate-200 rounded w-full" />
              <div className="h-4 bg-slate-200 rounded w-5/6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const minBid = data.bids.length === 0 ? data.startPrice : data.currentPrice + data.bidStep;
  const imgSrc = data.images[0]?.url ?? data.imageUrl;
  const resolvedImg = imgSrc
    ? imgSrc.startsWith('http') ? imgSrc : `${window.location.origin}${imgSrc}`
    : null;

  function placeBid(amount: number) {
    if (amount < minBid) { setError(`Минимум ${minBid.toLocaleString('ru-RU')} ₽`); return; }
    setError('');
    bidMutation.mutate(amount);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/catalog" className="flex items-center gap-2 text-[#2563EB] font-semibold text-sm hover:text-[#1D4ED8] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Каталог
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Tag className="w-3.5 h-3.5" />
            {data.category}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-5 gap-6">
          {/* Left column */}
          <div className="md:col-span-3 space-y-4">
            <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
              <div className="relative h-72 md:h-96 bg-gradient-to-br from-slate-100 to-slate-200">
                {resolvedImg ? (
                  <img src={resolvedImg} alt={data.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Gavel className="w-20 h-20 text-slate-300" />
                  </div>
                )}
                <span className={`absolute top-4 left-4 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-md ${
                  data.status === 'active' ? 'bg-[#F59E0B]' :
                  data.status === 'scheduled' ? 'bg-[#2563EB]' : 'bg-slate-600'
                }`}>
                  {data.status === 'active' ? '● Идут торги' : data.status === 'scheduled' ? '◷ Скоро' : 'Завершён'}
                </span>
              </div>
              <div className="p-6">
                <p className="text-xs font-bold text-[#F59E0B] uppercase tracking-wider mb-2">{data.category}</p>
                <h1 className="text-2xl font-black text-slate-900 leading-tight mb-4">{data.title}</h1>
                <p className="text-slate-500 leading-relaxed text-sm">{data.description}</p>
              </div>
            </div>

            {/* Bid history */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#2563EB]" />
                История ставок
                {data.bids.length > 0 && (
                  <span className="ml-auto text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                    {data.bids.length}
                  </span>
                )}
              </h2>
              {data.bids.length === 0 ? (
                <div className="text-center py-8">
                  <Gavel className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">Ставок пока нет. Будьте первым!</p>
                </div>
              ) : (
                <ul className="space-y-1">
                  {data.bids.map((bid, i) => (
                    <li key={bid.id} className={`flex items-center justify-between py-2.5 px-3 rounded-xl ${i === 0 ? 'bg-blue-50' : 'hover:bg-slate-50'} transition-colors`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-[#2563EB] text-white' : 'bg-slate-200 text-slate-500'}`}>
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <span className={`text-sm font-semibold ${i === 0 ? 'text-slate-900' : 'text-slate-600'}`}>
                          {bid.userName}
                        </span>
                        {i === 0 && <span className="text-xs text-[#2563EB] font-bold">Лидер</span>}
                      </div>
                      <span className={`font-black text-sm ${i === 0 ? 'text-[#2563EB]' : 'text-slate-700'}`}>
                        {bid.amount.toLocaleString('ru-RU')} ₽
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="md:col-span-2 space-y-4">
            {/* Price card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Текущая цена</p>
              <p className="text-4xl font-black text-[#2563EB] mb-1">
                {data.currentPrice.toLocaleString('ru-RU')} ₽
              </p>
              <p className="text-xs text-slate-400">
                Начальная: {data.startPrice.toLocaleString('ru-RU')} ₽ · Шаг: {data.bidStep.toLocaleString('ru-RU')} ₽
              </p>
            </div>

            {/* Timer */}
            {data.status === 'active' && (
              <div className={`rounded-2xl p-5 flex items-center gap-3 ${urgent ? 'bg-red-50 border border-red-200' : 'bg-slate-50 border border-slate-100'}`}>
                <Clock className={`w-5 h-5 flex-shrink-0 ${urgent ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">До конца торгов</p>
                  <p className={`text-xl font-black tabular-nums ${urgent ? 'text-red-600' : 'text-slate-900'}`}>{countdown}</p>
                </div>
              </div>
            )}

            {/* Bid form */}
            {data.status === 'active' && !data.isSeller && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-bold text-slate-900 mb-4">Сделать ставку</h3>
                {error && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {/* Quick bid buttons */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[minBid, minBid + data.bidStep, minBid + data.bidStep * 2].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setBidAmount(String(amt))}
                      className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                        bidAmount === String(amt)
                          ? 'bg-[#2563EB] border-[#2563EB] text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-[#2563EB] hover:text-[#2563EB]'
                      }`}
                    >
                      {amt.toLocaleString('ru-RU')} ₽
                    </button>
                  ))}
                </div>

                <div className="relative mb-3">
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => { setBidAmount(e.target.value); setError(''); }}
                    placeholder={`Мин. ${minBid.toLocaleString('ru-RU')} ₽`}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent text-sm"
                  />
                </div>
                <button
                  onClick={() => placeBid(parseInt(bidAmount, 10))}
                  disabled={bidMutation.isPending || !bidAmount}
                  className="w-full py-3.5 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ChevronUp className="w-4 h-4" />
                  {bidMutation.isPending ? 'Отправка...' : 'Сделать ставку'}
                </button>
              </div>
            )}

            {data.isSeller && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800 font-semibold text-center">
                Вы продавец этого лота
              </div>
            )}

            {data.status === 'finished' && data.bids.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                <p className="text-xs text-green-600 font-semibold uppercase tracking-wider mb-1">Победитель</p>
                <p className="font-black text-green-900">{data.bids[0].userName}</p>
                <p className="text-xl font-black text-green-700 mt-0.5">{data.bids[0].amount.toLocaleString('ru-RU')} ₽</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

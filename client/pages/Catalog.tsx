import { useState, useEffect } from 'react';
import { Search, Gavel, ArrowRight, Clock, TrendingUp, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LOT_CATEGORIES } from '@shared/categories';
import type { AuctionListItem } from '@shared/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('lotgo_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchAuctions(search: string, category: string) {
  const params = new URLSearchParams({ status: 'all' });
  if (search) params.set('search', search);
  if (category !== 'Все') params.set('category', category);

  const res = await fetch(`/api/auctions?${params}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Не удалось загрузить аукционы');
  const data = await res.json();
  return data.auctions as AuctionListItem[];
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
      if (h > 0) setText(`${h}ч ${m}м`);
      else if (m > 0) setText(`${m}м ${s}с`);
      else setText(`${s}с`);
    }
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [endsAt]);

  return { text, urgent };
}

function AuctionCard({ auction }: { auction: AuctionListItem }) {
  const { text, urgent } = useCountdown(auction.endsAt);
  const imgSrc = auction.imageUrl
    ? auction.imageUrl.startsWith('http')
      ? auction.imageUrl
      : `${window.location.origin}${auction.imageUrl}`
    : null;

  return (
    <Link
      to={`/auction/${auction.id}`}
      className="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
    >
      <div className="relative h-52 bg-gradient-to-br from-slate-100 to-slate-200 flex-shrink-0 overflow-hidden">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={auction.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Gavel className="w-14 h-14 text-slate-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-sm ${
          auction.status === 'active' ? 'bg-[#F59E0B]' :
          auction.status === 'scheduled' ? 'bg-[#2563EB]' : 'bg-slate-500'
        }`}>
          {auction.status === 'active' ? '● Идут торги' : auction.status === 'scheduled' ? '◷ Скоро' : 'Завершён'}
        </span>
        {auction.status === 'active' && (
          <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1 ${
            urgent ? 'bg-red-500 text-white animate-pulse' : 'bg-black/50 text-white backdrop-blur-sm'
          }`}>
            <Clock className="w-3 h-3" />
            {text}
          </span>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <p className="text-xs font-bold text-[#F59E0B] uppercase tracking-wider mb-1.5">{auction.category}</p>
        <h3 className="font-bold text-slate-900 mb-3 line-clamp-2 leading-snug flex-1">{auction.title}</h3>
        <div className="flex items-end justify-between mt-auto pt-3 border-t border-slate-50">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Текущая цена</p>
            <span className="text-xl font-black text-[#2563EB]">
              {auction.currentPrice.toLocaleString('ru-RU')} ₽
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 mb-0.5">Ставок</p>
            <span className="text-sm font-bold text-slate-600 flex items-center gap-1 justify-end">
              <TrendingUp className="w-3.5 h-3.5" />
              {auction.bidsCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm animate-pulse">
      <div className="h-52 bg-slate-200" />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-slate-200 rounded w-1/4" />
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
        <div className="h-6 bg-slate-200 rounded w-2/5 mt-2" />
      </div>
    </div>
  );
}

export default function Catalog() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Все');
  const [showFilters, setShowFilters] = useState(false);

  const { data: auctions = [], isLoading, error } = useQuery({
    queryKey: ['auctions', search, category],
    queryFn: () => fetchAuctions(search, category),
    refetchInterval: 30_000,
  });

  const categories = ['Все', ...LOT_CATEGORIES];
  const active = auctions.filter(a => a.status === 'active').length;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="Lot&Go" className="w-9 h-9 rounded-xl object-contain" />
            <span className="text-xl font-black tracking-tight">
              <span className="text-[#2563EB]">Lot&</span>
              <span className="text-[#F59E0B]">Go</span>
            </span>
          </Link>
          <Link
            to="/auth"
            className="px-4 py-2 bg-[#2563EB] text-white rounded-xl font-semibold text-sm hover:bg-[#1D4ED8] transition-colors"
          >
            Войти
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Каталог аукционов</h1>
            {!isLoading && (
              <p className="text-slate-500 mt-1 text-sm">
                {auctions.length} лотов · {active > 0 && <span className="text-[#F59E0B] font-semibold">{active} активных</span>}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Поиск по названию..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent text-sm shadow-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-colors ${
              showFilters || category !== 'Все'
                ? 'bg-[#2563EB] border-[#2563EB] text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:border-[#2563EB]'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:block">Фильтры</span>
          </button>
        </div>

        {showFilters && (
          <div className="flex gap-2 flex-wrap mb-6 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  category === cat
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-16 bg-white rounded-2xl border border-red-100">
            <p className="text-red-500 font-semibold">Ошибка загрузки</p>
            <p className="text-slate-400 text-sm mt-1">Убедитесь, что API-сервер запущен</p>
          </div>
        )}

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : auctions.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {auctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        ) : !error ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
            <Gavel className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="font-bold text-slate-700 mb-1">Аукционы не найдены</p>
            <p className="text-slate-400 text-sm mb-6">Попробуйте изменить фильтры или поисковый запрос</p>
            {(search || category !== 'Все') && (
              <button
                onClick={() => { setSearch(''); setCategory('Все'); }}
                className="inline-flex items-center gap-2 text-[#2563EB] font-semibold text-sm hover:underline"
              >
                Сбросить фильтры <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}

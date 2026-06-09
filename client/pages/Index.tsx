import { Link } from 'react-router-dom';
import { TrendingUp, Shield, Clock, Bell, Smartphone, Package, ArrowRight, Star, Users, Zap } from 'lucide-react';

export default function Index() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="Lot&Go" className="w-10 h-10 rounded-xl object-contain" />
            <span className="text-2xl font-black tracking-tight">
              <span className="text-[#2563EB]">Lot&</span>
              <span className="text-[#F59E0B]">Go</span>
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              to="/catalog"
              className="hidden md:block text-slate-600 hover:text-[#2563EB] font-semibold transition-colors"
            >
              Каталог
            </Link>
            <Link
              to="/auth"
              className="px-5 py-2.5 bg-[#2563EB] text-white rounded-xl font-bold hover:bg-[#1D4ED8] transition-colors shadow-sm"
            >
              Войти
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-[#0f2460] to-slate-900 text-white">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#2563EB]/20 rounded-full blur-[120px]" />
            <div className="absolute -bottom-20 left-0 w-[500px] h-[500px] bg-[#F59E0B]/15 rounded-full blur-[100px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#1e3a8a]/30 rounded-full blur-[80px]" />
          </div>

          <div className="max-w-7xl mx-auto px-4 py-28 relative z-10">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6 text-sm font-semibold text-white/80 backdrop-blur-sm">
                  <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
                  Торги в реальном времени
                </div>
                <h1 className="text-5xl md:text-6xl font-black leading-[1.1] mb-6 tracking-tight">
                  Аукционы<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#60a5fa] to-[#F59E0B]">
                    частной собственности
                  </span>
                </h1>
                <p className="text-lg text-slate-300 mb-2 leading-relaxed">
                  Создавайте лоты, делайте ставки в реальном времени — всё в Lot&Go
                </p>
                <p className="text-slate-400 mb-10 text-sm">
                  Мебель · Украшения · Живопись · Антиквариат · Коллекционирование · Электроника
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Link
                    to="/catalog"
                    className="group inline-flex items-center gap-2 px-7 py-4 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white rounded-xl font-bold text-base hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all"
                  >
                    Смотреть аукционы
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/auth"
                    className="inline-flex items-center gap-2 px-7 py-4 border border-white/30 text-white rounded-xl font-bold text-base hover:bg-white/10 transition-all backdrop-blur-sm"
                  >
                    Войти в аккаунт
                  </Link>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB]/30 to-[#F59E0B]/30 rounded-3xl blur-2xl scale-110" />
                  <img
                    src="/logo.png"
                    alt="Lot&Go"
                    className="relative w-64 h-64 md:w-80 md:h-80 object-contain drop-shadow-2xl"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 py-5 grid grid-cols-3 gap-4 text-center">
              {[
                { icon: Users, value: '2 000+', label: 'Пользователей' },
                { icon: TrendingUp, value: '500+', label: 'Завершённых торгов' },
                { icon: Star, value: '98%', label: 'Довольных покупателей' },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <Icon className="w-4 h-4 text-[#F59E0B] mb-0.5" />
                  <span className="text-xl font-black text-white">{value}</span>
                  <span className="text-xs text-slate-400 hidden sm:block">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Всё для торгов</h2>
              <p className="text-lg text-slate-500">Полный цикл аукциона в одном приложении</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: TrendingUp, title: 'Ставки live', desc: 'Обновление цены и истории ставок в реальном времени через WebSocket.', color: 'from-blue-500 to-blue-600' },
                { icon: Package, title: 'Создание лотов', desc: 'Фото, описание, категория и параметры торгов — начальная цена, шаг, время.', color: 'from-violet-500 to-violet-600' },
                { icon: Bell, title: 'Уведомления', desc: 'Перебитие ставки, начало и окончание торгов, победа в аукционе.', color: 'from-amber-500 to-orange-500' },
                { icon: Clock, title: 'Авто-завершение', desc: 'Победитель определяется автоматически по истечении времени.', color: 'from-teal-500 to-teal-600' },
                { icon: Shield, title: 'Безопасность', desc: 'JWT-авторизация, хеширование паролей, rate limiting, защита контактов.', color: 'from-green-500 to-green-600' },
                { icon: Smartphone, title: 'Мобильное приложение', desc: 'Expo/React Native — основной клиент Lot&Go для iOS и Android.', color: 'from-pink-500 to-rose-500' },
              ].map(({ icon: Icon, title, desc, color }) => (
                <div
                  key={title}
                  className="group bg-white rounded-2xl p-7 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
                  <p className="text-slate-500 leading-relaxed text-sm">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="bg-gradient-to-br from-[#0f2460] to-[#1D4ED8] rounded-3xl p-14 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#F59E0B]/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
              <div className="relative z-10">
                <h2 className="text-4xl font-black text-white mb-4 tracking-tight">Скачайте Lot&Go</h2>
                <p className="text-white/70 mb-8 text-base">
                  Запустите мобильное приложение:{' '}
                  <code className="bg-white/20 px-2.5 py-1 rounded-lg text-white/90 text-sm font-mono">
                    cd mobile && npm start
                  </code>
                </p>
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-2 px-10 py-4 bg-[#F59E0B] text-white rounded-xl font-bold text-base hover:bg-[#D97706] transition-colors shadow-lg"
                >
                  Зарегистрироваться
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="bg-slate-950 text-slate-500 py-10">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Lot&Go" className="w-8 h-8 rounded-lg" />
              <span className="font-bold text-white">Lot&Go</span>
            </div>
            <p className="text-sm">&copy; 2026 Lot&Go. Аукционы частной собственности.</p>
            <Link to="/catalog" className="text-sm hover:text-white transition-colors">Каталог аукционов</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}

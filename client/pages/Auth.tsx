import { useState } from 'react';
import { Mail, Lock, User, Phone, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!isLogin && formData.password !== formData.confirmPassword) {
        throw new Error('Пароли не совпадают');
      }

      const url = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin
        ? { email: formData.email, password: formData.password }
        : {
            email: formData.email,
            password: formData.password,
            confirmPassword: formData.confirmPassword,
            name: formData.name,
            phone: formData.phone || undefined,
          };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Ошибка авторизации');

      if (data.accessToken) {
        localStorage.setItem('lotgo_token', data.accessToken);
      }

      setSuccess(true);
      setTimeout(() => navigate('/catalog'), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent text-sm transition-all';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-3.5">
          <Link to="/" className="flex items-center gap-2.5 w-fit hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="Lot&Go" className="w-9 h-9 rounded-xl object-contain" />
            <span className="text-xl font-black tracking-tight">
              <span className="text-[#2563EB]">Lot&</span>
              <span className="text-[#F59E0B]">Go</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo/brand above card */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-slate-900">
              {isLogin ? 'Добро пожаловать' : 'Создать аккаунт'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {isLogin ? 'Войдите, чтобы участвовать в торгах' : 'Зарегистрируйтесь — это бесплатно'}
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 p-8 border border-slate-100">
            {success && (
              <div className="mb-5 p-3.5 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="font-semibold text-green-900 text-sm">Успешно! Перенаправление...</p>
              </div>
            )}

            {error && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Tab switcher */}
            <div className="flex gap-1.5 mb-7 bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => { setIsLogin(true); setError(''); }}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                  isLogin ? 'bg-white text-[#2563EB] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Вход
              </button>
              <button
                type="button"
                onClick={() => { setIsLogin(false); setError(''); }}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                  !isLogin ? 'bg-white text-[#2563EB] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Регистрация
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {!isLogin && (
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    name="name"
                    placeholder="Ваше имя"
                    value={formData.name}
                    onChange={handleChange}
                    className={inputClass}
                    required={!isLogin}
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>

              {!isLogin && (
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Телефон (необязательно)"
                    value={formData.phone}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              )}

              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  placeholder="Пароль (мин. 8 символов)"
                  value={formData.password}
                  onChange={handleChange}
                  className={`${inputClass} pr-11`}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {!isLogin && (
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Подтвердите пароль"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={inputClass}
                    required={!isLogin}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading || success}
                className="w-full py-3.5 bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all mt-2 disabled:opacity-50 text-sm"
              >
                {loading ? 'Загрузка...' : isLogin ? 'Войти в аккаунт' : 'Создать аккаунт'}
              </button>
            </form>

            <p className="text-center text-xs text-slate-400 mt-5">
              {isLogin ? 'Нет аккаунта? ' : 'Уже зарегистрированы? '}
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-[#2563EB] font-semibold hover:underline"
              >
                {isLogin ? 'Зарегистрироваться' : 'Войти'}
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

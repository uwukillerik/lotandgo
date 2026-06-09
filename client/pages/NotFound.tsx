import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Gavel, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link to="/" className="flex items-center gap-2 w-fit">
            <Gavel className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold text-slate-900">AuctionHub</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <div className="text-9xl font-bold text-primary/20 mb-4">404</div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Страница не найдена</h1>
          <p className="text-lg text-slate-600 mb-2">
            К сожалению, эта страница еще не заполнена.
          </p>
          <p className="text-slate-500 mb-8">
            {location.pathname === '/auction/:id'
              ? 'Выберите интересующий вас аукцион из каталога.'
              : 'Вернитесь на главную страницу и продолжите просмотр аукционов.'}
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-opacity-90 transition-colors"
            >
              <Home className="w-5 h-5" />
              На главную
            </Link>
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary hover:text-white transition-colors"
            >
              <Gavel className="w-5 h-5" />
              К каталогу
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotFound;

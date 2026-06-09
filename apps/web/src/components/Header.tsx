import { Link } from 'react-router-dom';

export function Header() {
  return (
    <header className="flex items-center justify-between py-6">
      <Link to="/" className="text-2xl font-bold text-main">
        luminotype
      </Link>
      <nav className="flex gap-4 text-sub">
        <Link to="/" className="hover:text-text">
          test
        </Link>
        <Link to="/stats" className="hover:text-text">
          stats
        </Link>
        <Link to="/settings" className="hover:text-text">
          settings
        </Link>
        <Link to="/about" className="hover:text-text">
          about
        </Link>
      </nav>
    </header>
  );
}

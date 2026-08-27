import { Link, NavLink } from 'react-router-dom';
import SearchBox from './SearchBox.jsx';

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true">
            ⚽
          </span>
          <span className="brand-name">Six Degrees of Football</span>
        </Link>
        <nav className="navbar-links">
          <NavLink to="/connections" className={({ isActive }) => (isActive ? 'active' : '')}>
            Connection Finder
          </NavLink>
        </nav>
        <div className="navbar-search">
          <SearchBox />
        </div>
      </div>
    </header>
  );
}

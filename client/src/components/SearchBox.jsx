import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';

// A combined player/club autocomplete search box. Debounces input, shows a
// loading state while a request is in flight, and navigates to the right
// profile page on selection.
export default function SearchBox({ placeholder = 'Search players or clubs…', autoFocus = false }) {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!term.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const data = await api.search(term.trim());
        setResults(data);
        setOpen(true);
        setActiveIndex(-1);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [term]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function goTo(item) {
    setOpen(false);
    setTerm('');
    navigate(item.type === 'player' ? `/players/${item.id}` : `/clubs/${item.id}`);
  }

  function onKeyDown(e) {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      goTo(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="search-box" ref={containerRef}>
      <input
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={term}
        autoFocus={autoFocus}
        onChange={(e) => setTerm(e.target.value)}
        onFocus={() => term.trim() && setOpen(true)}
        onKeyDown={onKeyDown}
        aria-label="Search players or clubs"
        aria-expanded={open}
        role="combobox"
      />
      {loading && <span className="search-spinner" aria-hidden="true" />}
      {open && (
        <ul className="search-results">
          {results.length === 0 && !loading && (
            <li className="search-results-empty">No matches for “{term}”</li>
          )}
          {results.map((item, i) => (
            <li key={`${item.type}-${item.id}`}>
              <button
                type="button"
                className={`search-result${i === activeIndex ? ' active' : ''}`}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => goTo(item)}
              >
                <span className={`badge badge-${item.type}`}>
                  {item.type === 'player' ? '⚽' : '🏟'}
                </span>
                <span>{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

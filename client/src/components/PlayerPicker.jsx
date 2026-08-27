import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client.js';

// Like SearchBox, but scoped to players only and reports the picked
// player back to the parent instead of navigating - used by the
// Connection Finder's two "from"/"to" inputs.
export default function PlayerPicker({ label, value, onChange, placeholder }) {
  const [term, setTerm] = useState(value?.name || '');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setTerm(value?.name || '');
  }, [value]);

  useEffect(() => {
    if (!term.trim() || term === value?.name) {
      setResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const data = await api.search(term.trim());
        setResults(data.filter((r) => r.type === 'player'));
        setOpen(true);
      } catch {
        setResults([]);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [term, value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function pick(item) {
    onChange({ id: item.id, name: item.name });
    setTerm(item.name);
    setOpen(false);
  }

  return (
    <div className="search-box player-picker" ref={containerRef}>
      {label && <label className="field-label">{label}</label>}
      <input
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
          if (value) onChange(null);
        }}
        onFocus={() => results.length && setOpen(true)}
      />
      {open && results.length > 0 && (
        <ul className="search-results">
          {results.map((item) => (
            <li key={item.id}>
              <button type="button" className="search-result" onClick={() => pick(item)}>
                <span className="badge badge-player">⚽</span>
                <span>{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

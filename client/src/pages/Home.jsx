import { useNavigate } from 'react-router-dom';
import SearchBox from '../components/SearchBox.jsx';

const FEATURED_PAIRS = [
  { fromId: 'ronaldo', fromName: 'Cristiano Ronaldo', toId: 'messi', toName: 'Lionel Messi' },
  { fromId: 'ronaldo', fromName: 'Cristiano Ronaldo', toId: 'mbappe', toName: 'Kylian Mbappé' },
  { fromId: 'beckham', fromName: 'David Beckham', toId: 'haaland', toName: 'Erling Haaland' },
  { fromId: 'carvalho', fromName: 'Ricardo Carvalho', toId: 'lewandowski', toName: 'Robert Lewandowski' },
];

const FEATURED_CLUBS = [
  { id: 'real-madrid', name: 'Real Madrid' },
  { id: 'chelsea', name: 'Chelsea' },
  { id: 'psg', name: 'Paris Saint-Germain' },
  { id: 'barcelona', name: 'FC Barcelona' },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="page home">
      <section className="hero">
        <h1>Every career is a path. Find the shortest one.</h1>
        <p className="hero-subtitle">
          Explore a graph of players, clubs and managers built on CognoDB - then find the
          shortest chain of shared dressing rooms connecting any two footballers.
        </p>
        <div className="hero-search">
          <SearchBox placeholder="Search for a player or club to start…" autoFocus />
        </div>
      </section>

      <section className="section">
        <h2>Try a famous connection</h2>
        <p className="section-lead">
          Two players, one question: how many teammates apart are they?
        </p>
        <div className="pair-grid">
          {FEATURED_PAIRS.map((pair) => (
            <button
              key={`${pair.fromId}-${pair.toId}`}
              type="button"
              className="pair-card"
              onClick={() => navigate(`/connections?from=${pair.fromId}&to=${pair.toId}`)}
            >
              <span>{pair.fromName}</span>
              <span className="pair-arrow" aria-hidden="true">
                ⇄
              </span>
              <span>{pair.toName}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Browse a club</h2>
        <p className="section-lead">See a squad, its manager history, and the country it plays in.</p>
        <div className="club-grid">
          {FEATURED_CLUBS.map((club) => (
            <button
              key={club.id}
              type="button"
              className="club-chip"
              onClick={() => navigate(`/clubs/${club.id}`)}
            >
              🏟 {club.name}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

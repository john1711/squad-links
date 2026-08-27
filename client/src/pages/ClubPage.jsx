import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { Loading, ErrorState, EmptyState } from '../components/StateViews.jsx';
import { formatRange } from '../utils/format.js';

export default function ClubPage() {
  const { id } = useParams();
  const [state, setState] = useState({ status: 'loading', data: null, error: null });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading', data: null, error: null });
    api
      .getClub(id)
      .then((data) => !cancelled && setState({ status: 'ready', data, error: null }))
      .catch((err) => !cancelled && setState({ status: 'error', data: null, error: err }));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state.status === 'loading') {
    return (
      <div className="page">
        <Loading label="Loading club…" />
      </div>
    );
  }

  if (state.status === 'error') {
    const notFound = state.error?.status === 404;
    return (
      <div className="page">
        <ErrorState
          message={
            notFound ? 'No club found with that id.' : state.error?.message || 'Failed to load club.'
          }
          onRetry={notFound ? undefined : () => window.location.reload()}
        />
      </div>
    );
  }

  const { club, country, competitions, squad, managers } = state.data;

  return (
    <div className="page club-page">
      <section className="profile-header">
        <span className="profile-avatar" aria-hidden="true">
          🏟
        </span>
        <div>
          <h1>{club.name}</h1>
          <p className="profile-meta">
            {country?.name} · founded {club.founded}
            {competitions.length > 0 && (
              <>
                {' '}
                ·{' '}
                {competitions.map((c) => (
                  <span key={c.id} className="tag">
                    {c.name}
                  </span>
                ))}
              </>
            )}
          </p>
        </div>
      </section>

      <section className="section">
        <h2>Squad ({squad.length})</h2>
        {squad.length === 0 ? (
          <EmptyState title="No recorded players" />
        ) : (
          <ul className="roster">
            {squad.map(({ player, spell }) => (
              <li key={`${player.id}-${spell.from}`} className="roster-item">
                <Link to={`/players/${player.id}`} className="roster-name">
                  {player.name}
                </Link>
                <span className="roster-position">{player.position}</span>
                <span className="roster-range">{formatRange(spell.from, spell.to)}</span>
                <span className="roster-stats">
                  {spell.appearances} apps · {spell.goals} goals
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section">
        <h2>Managers</h2>
        {managers.length === 0 ? (
          <EmptyState title="No recorded managers" />
        ) : (
          <ul className="roster">
            {managers.map(({ manager, spell }) => (
              <li key={`${manager.id}-${spell.from}`} className="roster-item">
                <span className="roster-name">{manager.name}</span>
                <span className="roster-range">{formatRange(spell.from, spell.to)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { Loading, ErrorState, EmptyState } from '../components/StateViews.jsx';
import PlayerCard from '../components/PlayerCard.jsx';
import { formatRange } from '../utils/format.js';

export default function PlayerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ status: 'loading', data: null, error: null });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading', data: null, error: null });
    api
      .getPlayer(id)
      .then((data) => !cancelled && setState({ status: 'ready', data, error: null }))
      .catch((err) => !cancelled && setState({ status: 'error', data: null, error: err }));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state.status === 'loading') {
    return (
      <div className="page">
        <Loading label="Loading player…" />
      </div>
    );
  }

  if (state.status === 'error') {
    const notFound = state.error?.status === 404;
    return (
      <div className="page">
        <ErrorState
          message={
            notFound ? 'No player found with that id.' : state.error?.message || 'Failed to load player.'
          }
          onRetry={notFound ? undefined : () => window.location.reload()}
        />
      </div>
    );
  }

  const { player, nationality, career, teammateCount, suggestions, managerReunions } = state.data;

  return (
    <div className="page player-page">
      <section className="profile-header">
        <span className="profile-avatar" aria-hidden="true">
          ⚽
        </span>
        <div>
          <h1>{player.name}</h1>
          <p className="profile-meta">
            {player.position} · {nationality?.name} · born {player.dob}
          </p>
          <p className="profile-stat">
            <strong>{teammateCount}</strong> direct teammate connection{teammateCount === 1 ? '' : 's'}{' '}
            in this graph
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate(`/connections?from=${player.id}`)}
        >
          Find a connection from here
        </button>
      </section>

      <section className="section">
        <h2>Career</h2>
        {career.length === 0 ? (
          <EmptyState title="No career history recorded" />
        ) : (
          <ol className="timeline">
            {career.map((spell) => (
              <li key={`${spell.club.id}-${spell.from}`} className="timeline-item">
                <span className="timeline-range">{formatRange(spell.from, spell.to)}</span>
                <div className="timeline-content">
                  <Link to={`/clubs/${spell.club.id}`} className="timeline-club">
                    {spell.club.name}
                  </Link>
                  <span className="timeline-stats">
                    {spell.appearances} apps · {spell.goals} goals
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {managerReunions.length > 0 && (
        <section className="section">
          <h2>Followed the manager</h2>
          <p className="section-lead">
            Players sometimes chase a manager across clubs. {player.name} played under the same
            manager at two different clubs:
          </p>
          <ul className="reunion-list">
            {managerReunions.map((r, i) => (
              <li key={i} className="reunion-item">
                Played under <strong>{r.manager.name}</strong> at{' '}
                <Link to={`/clubs/${r.firstClub.id}`}>{r.firstClub.name}</Link>, then again at{' '}
                <Link to={`/clubs/${r.secondClub.id}`}>{r.secondClub.name}</Link>.
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="section">
        <h2>Players you might know</h2>
        <p className="section-lead">
          Never teammates with {player.name} directly, but shared a dressing room with someone who
          was.
        </p>
        {suggestions.length === 0 ? (
          <EmptyState
            icon="🤝"
            title="No two-hop connections found"
            description="Every teammate-of-a-teammate here already played directly with this player, or the graph doesn't reach far enough."
          />
        ) : (
          <div className="suggestion-grid">
            {suggestions.map((s) => (
              <PlayerCard
                key={s.player.id}
                player={s.player}
                nationality={s.nationality}
                subtitle={`${s.mutualTeammates} mutual teammate${s.mutualTeammates === 1 ? '' : 's'}`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

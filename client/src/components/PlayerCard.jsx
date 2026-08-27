import { Link } from 'react-router-dom';

export default function PlayerCard({ player, nationality, subtitle }) {
  if (!player) return null;
  return (
    <Link to={`/players/${player.id}`} className="player-card">
      <span className="player-card-avatar" aria-hidden="true">
        ⚽
      </span>
      <span className="player-card-body">
        <span className="player-card-name">{player.name}</span>
        <span className="player-card-meta">
          {player.position}
          {nationality ? ` · ${nationality.name}` : ''}
        </span>
        {subtitle && <span className="player-card-subtitle">{subtitle}</span>}
      </span>
    </Link>
  );
}

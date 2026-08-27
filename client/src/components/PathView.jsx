import { Link } from 'react-router-dom';
import { formatRange } from '../utils/format.js';

// Renders the chain of players/connectors returned by the connection
// finder as a horizontally-scrollable path: node -> connector -> node.
export default function PathView({ nodes, connectors }) {
  return (
    <div className="path-view" role="list" aria-label="Connection path">
      {nodes.map((node, i) => (
        <div className="path-segment" key={node.id}>
          <Link to={`/players/${node.id}`} className="path-node" role="listitem">
            <span className="path-node-avatar" aria-hidden="true">
              ⚽
            </span>
            <span className="path-node-name">{node.name}</span>
          </Link>
          {i < connectors.length && (
            <div className="path-connector">
              <span className="path-connector-line" aria-hidden="true" />
              <span className="path-connector-label">
                teammates at <Link to={`/clubs/${connectors[i].clubId}`}>{connectors[i].clubName}</Link>
                <br />
                {formatRange(connectors[i].from, connectors[i].to)}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

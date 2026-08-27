import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import PlayerPicker from '../components/PlayerPicker.jsx';
import PathView from '../components/PathView.jsx';
import { Loading, ErrorState, EmptyState } from '../components/StateViews.jsx';

export default function ConnectionFinder() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [fromPlayer, setFromPlayer] = useState(null);
  const [toPlayer, setToPlayer] = useState(null);
  const [state, setState] = useState({ status: 'idle', data: null, error: null });

  const runSearch = useCallback(async (fromId, toId) => {
    setState({ status: 'loading', data: null, error: null });
    try {
      const data = await api.findConnection(fromId, toId);
      setState({ status: 'ready', data, error: null });
    } catch (err) {
      setState({ status: 'error', data: null, error: err });
    }
  }, []);

  // On mount, resolve any ?from=&to= ids in the URL into full player
  // objects (for the picker labels) and kick off a search automatically.
  useEffect(() => {
    const fromId = searchParams.get('from');
    const toId = searchParams.get('to');
    if (!fromId && !toId) return;

    (async () => {
      const [fromData, toData] = await Promise.all([
        fromId ? api.getPlayer(fromId).catch(() => null) : null,
        toId ? api.getPlayer(toId).catch(() => null) : null,
      ]);
      if (fromData) setFromPlayer({ id: fromData.player.id, name: fromData.player.name });
      if (toData) setToPlayer({ id: toData.player.id, name: toData.player.name });
      if (fromData && toData) runSearch(fromData.player.id, toData.player.id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (!fromPlayer || !toPlayer) return;
    setSearchParams({ from: fromPlayer.id, to: toPlayer.id });
    runSearch(fromPlayer.id, toPlayer.id);
  }

  function swap() {
    setFromPlayer(toPlayer);
    setToPlayer(fromPlayer);
  }

  const canSubmit = fromPlayer && toPlayer && fromPlayer.id !== toPlayer.id;

  return (
    <div className="page connection-page">
      <section className="hero hero-compact">
        <h1>Connection Finder</h1>
        <p className="hero-subtitle">
          Pick two players. We'll find the shortest chain of shared clubs connecting them - a
          single <code>shortestPath</code> traversal over the teammate graph.
        </p>
      </section>

      <form className="connection-form" onSubmit={handleSubmit}>
        <PlayerPicker label="From" value={fromPlayer} onChange={setFromPlayer} placeholder="e.g. Cristiano Ronaldo" />
        <button type="button" className="btn btn-icon" onClick={swap} aria-label="Swap players" title="Swap">
          ⇄
        </button>
        <PlayerPicker label="To" value={toPlayer} onChange={setToPlayer} placeholder="e.g. Lionel Messi" />
        <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
          Find connection
        </button>
      </form>

      {fromPlayer && toPlayer && fromPlayer.id === toPlayer.id && (
        <p className="form-hint">Pick two different players.</p>
      )}

      <section className="section">
        {state.status === 'idle' && (
          <EmptyState
            icon="🔗"
            title="Pick two players to get started"
            description="Try Cristiano Ronaldo and Lionel Messi, or browse the examples on the home page."
          />
        )}
        {state.status === 'loading' && <Loading label="Searching the graph…" />}
        {state.status === 'error' && (
          <ErrorState message={state.error?.message || 'Failed to search for a connection.'} />
        )}
        {state.status === 'ready' && state.data.found && (
          <>
            <p className="result-summary">
              <strong>{state.data.from.name}</strong> and <strong>{state.data.to.name}</strong> are{' '}
              <strong>{state.data.hops}</strong> hop{state.data.hops === 1 ? '' : 's'} apart.
            </p>
            <PathView nodes={state.data.nodes} connectors={state.data.connectors} />
          </>
        )}
        {state.status === 'ready' && !state.data.found && (
          <EmptyState
            icon="🚫"
            title="No connection found"
            description={`${state.data.from.name} and ${state.data.to.name} don't share a teammate chain within 6 hops in this dataset.`}
          />
        )}
      </section>
    </div>
  );
}

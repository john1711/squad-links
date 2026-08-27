import { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import PlayerPage from './pages/PlayerPage.jsx';
import ClubPage from './pages/ClubPage.jsx';
import ConnectionFinder from './pages/ConnectionFinder.jsx';
import { api } from './api/client.js';

export default function App() {
  const [apiDown, setApiDown] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .health()
      .then(() => !cancelled && setApiDown(false))
      .catch(() => !cancelled && setApiDown(true));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="app-shell">
      <Navbar />
      {apiDown && (
        <div className="banner banner-error" role="alert">
          Can't reach the API or database right now. Some data may fail to load.
        </div>
      )}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/players/:id" element={<PlayerPage />} />
          <Route path="/clubs/:id" element={<ClubPage />} />
          <Route path="/connections" element={<ConnectionFinder />} />
        </Routes>
      </main>
      <footer className="app-footer">
        Built on <strong>CognoDB</strong> · openCypher over Bolt · a Wexa AI take-home project
      </footer>
    </div>
  );
}

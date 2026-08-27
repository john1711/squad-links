import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { verifyConnectivity, closeDriver } from './db/driver.js';
import { playersRouter } from './routes/players.js';
import { clubsRouter } from './routes/clubs.js';
import { connectionsRouter } from './routes/connections.js';
import { searchRouter } from './routes/search.js';

const app = express();

app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    await verifyConnectivity();
    res.json({ status: 'ok', database: 'reachable' });
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'unreachable', message: err.message });
  }
});

app.use('/api/players', playersRouter);
app.use('/api/clubs', clubsRouter);
app.use('/api/connections', connectionsRouter);
app.use('/api/search', searchRouter);

// Central error handler: any thrown Neo4j/driver error (auth failure,
// connection refused, timeout) surfaces here as a clean 503 instead of
// crashing the process or leaking a stack trace to the client.
app.use((err, req, res, next) => {
  console.error(err);
  const isConnectionIssue =
    /ServiceUnavailable|Neo4jError|connect|ECONNREFUSED|authentication/i.test(
      `${err.name} ${err.message}`
    );
  res.status(isConnectionIssue ? 503 : 500).json({
    error: isConnectionIssue
      ? 'The database is currently unreachable. Please try again shortly.'
      : 'Something went wrong.',
  });
});

const server = app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});

async function shutdown() {
  console.log('Shutting down...');
  server.close();
  await closeDriver();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

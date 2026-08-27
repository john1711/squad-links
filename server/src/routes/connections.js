import { Router } from 'express';
import { runQuery } from '../db/driver.js';
import { toNative } from '../utils/serialize.js';
import { FIND_CONNECTION } from '../queries/connections.js';

export const connectionsRouter = Router();

// Walks a neo4j Path object into an ordered [player, {club, from, to}, player, ...]
// chain the frontend can render as a list of nodes and labeled connectors.
function describePath(path) {
  const nodes = [toNative(path.start)];
  const hops = [];
  for (const segment of path.segments) {
    hops.push(toNative(segment.relationship));
    nodes.push(toNative(segment.end));
  }
  return { nodes, hops };
}

connectionsRouter.get('/', async (req, res, next) => {
  try {
    const fromId = (req.query.from || '').trim();
    const toId = (req.query.to || '').trim();
    if (!fromId || !toId) {
      return res.status(400).json({ error: 'Both "from" and "to" player ids are required' });
    }

    const records = await runQuery(FIND_CONNECTION, { fromId, toId });
    if (records.length === 0 || records[0].get('a') === null || records[0].get('b') === null) {
      return res.status(404).json({ error: 'One or both players were not found' });
    }

    const from = toNative(records[0].get('a'));
    const to = toNative(records[0].get('b'));
    const path = records[0].get('path');

    if (!path) {
      return res.json({ from, to, found: false, hops: 0, nodes: [], connectors: [] });
    }

    const { nodes, hops } = describePath(path);

    // Attach the connecting club's name to each hop for display.
    const clubIds = [...new Set(hops.map((h) => h.clubId))];
    const clubRecords = clubIds.length
      ? await runQuery(
          `UNWIND $ids AS id MATCH (c:Club {id: id}) RETURN c.id AS id, c.name AS name`,
          { ids: clubIds }
        )
      : [];
    const clubNameById = Object.fromEntries(clubRecords.map((r) => [r.get('id'), r.get('name')]));

    const connectors = hops.map((h) => ({
      clubId: h.clubId,
      clubName: clubNameById[h.clubId] || h.clubId,
      from: h.from,
      to: h.to,
    }));

    res.json({ from, to, found: true, hops: connectors.length, nodes, connectors });
  } catch (err) {
    next(err);
  }
});

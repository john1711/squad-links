import { Router } from 'express';
import { runQuery } from '../db/driver.js';
import { toNative } from '../utils/serialize.js';
import { SEARCH_CLUBS, GET_CLUB, GET_CLUB_SQUAD, GET_CLUB_MANAGERS } from '../queries/clubs.js';

export const clubsRouter = Router();

clubsRouter.get('/', async (req, res, next) => {
  try {
    const term = (req.query.q || '').trim();
    if (!term) return res.json([]);
    const records = await runQuery(SEARCH_CLUBS, { term });
    res.json(records.map((r) => toNative(r.get('c'))));
  } catch (err) {
    next(err);
  }
});

clubsRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [clubRecords, squadRecords, managerRecords] = await Promise.all([
      runQuery(GET_CLUB, { id }),
      runQuery(GET_CLUB_SQUAD, { id }),
      runQuery(GET_CLUB_MANAGERS, { id }),
    ]);

    if (clubRecords.length === 0 || clubRecords[0].get('c') === null) {
      return res.status(404).json({ error: 'Club not found' });
    }

    const club = toNative(clubRecords[0].get('c'));
    const country = toNative(clubRecords[0].get('country'));
    const competitions = toNative(clubRecords[0].get('competitions')).filter(Boolean);

    const squad = squadRecords.map((r) => ({
      player: toNative(r.get('p')),
      spell: toNative(r.get('s')),
    }));

    const managers = managerRecords.map((r) => ({
      manager: toNative(r.get('m')),
      spell: toNative(r.get('s')),
    }));

    res.json({ club, country, competitions, squad, managers });
  } catch (err) {
    next(err);
  }
});

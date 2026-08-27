import { Router } from 'express';
import { runQuery } from '../db/driver.js';
import { AUTOCOMPLETE } from '../queries/search.js';

export const searchRouter = Router();

searchRouter.get('/', async (req, res, next) => {
  try {
    const term = (req.query.q || '').trim();
    if (!term) return res.json([]);
    const records = await runQuery(AUTOCOMPLETE, { term });
    res.json(
      records.map((r) => ({
        id: r.get('id'),
        name: r.get('name'),
        type: r.get('type'),
      }))
    );
  } catch (err) {
    next(err);
  }
});

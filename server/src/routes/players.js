import { Router } from 'express';
import { runQuery } from '../db/driver.js';
import { toNative } from '../utils/serialize.js';
import {
  SEARCH_PLAYERS,
  GET_PLAYER,
  GET_PLAYER_CAREER,
  GET_TEAMMATE_COUNT,
  GET_PLAYERS_YOU_MIGHT_KNOW,
  GET_MANAGER_REUNIONS,
} from '../queries/players.js';

export const playersRouter = Router();

playersRouter.get('/', async (req, res, next) => {
  try {
    const term = (req.query.q || '').trim();
    if (!term) return res.json([]);
    const records = await runQuery(SEARCH_PLAYERS, { term });
    res.json(
      records.map((r) => ({
        ...toNative(r.get('p')),
        nationality: toNative(r.get('country')),
      }))
    );
  } catch (err) {
    next(err);
  }
});

playersRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [playerRecords, careerRecords, teammateRecords, suggestionRecords, reunionRecords] =
      await Promise.all([
        runQuery(GET_PLAYER, { id }),
        runQuery(GET_PLAYER_CAREER, { id }),
        runQuery(GET_TEAMMATE_COUNT, { id }),
        runQuery(GET_PLAYERS_YOU_MIGHT_KNOW, { id }),
        runQuery(GET_MANAGER_REUNIONS, { id }),
      ]);

    if (playerRecords.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const player = toNative(playerRecords[0].get('p'));
    const nationality = toNative(playerRecords[0].get('country'));

    const career = careerRecords.map((r) => ({
      ...toNative(r.get('s')),
      club: toNative(r.get('club')),
      clubCountry: toNative(r.get('clubCountry')),
    }));

    const teammateCount = toNative(teammateRecords[0]?.get('teammateCount')) ?? 0;

    const suggestions = suggestionRecords.map((r) => ({
      player: toNative(r.get('fof')),
      nationality: toNative(r.get('country')),
      mutualTeammates: toNative(r.get('mutualTeammates')),
    }));

    const managerReunions = reunionRecords.map((r) => ({
      manager: toNative(r.get('mgr')),
      firstClub: toNative(r.get('c1')),
      secondClub: toNative(r.get('c2')),
    }));

    res.json({ player, nationality, career, teammateCount, suggestions, managerReunions });
  } catch (err) {
    next(err);
  }
});

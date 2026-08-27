import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getDriver, closeDriver } from '../db/driver.js';
import { computeTeammateEdges } from './computeTeammates.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, 'data');

function load(name) {
  return JSON.parse(readFileSync(join(dataDir, `${name}.json`), 'utf-8'));
}

async function main() {
  const countries = load('countries');
  const competitions = load('competitions');
  const clubs = load('clubs');
  const managers = load('managers');
  const managerSpells = load('managerSpells');
  const players = load('players');
  const playerSpells = load('playerSpells');

  const teammateEdges = computeTeammateEdges(playerSpells);

  const driver = getDriver();
  await driver.verifyConnectivity();
  console.log('Connected to CognoDB. Seeding...');

  const session = driver.session();
  try {
    // --- Reset (safe for a demo/seed dataset) ---
    console.log('Clearing existing graph...');
    await session.executeWrite((tx) => tx.run('MATCH (n) DETACH DELETE n'));

    // --- Constraints & indexes ---
    console.log('Creating constraints and indexes...');
    const constraints = [
      'CREATE CONSTRAINT country_id IF NOT EXISTS FOR (n:Country) REQUIRE n.id IS UNIQUE',
      'CREATE CONSTRAINT competition_id IF NOT EXISTS FOR (n:Competition) REQUIRE n.id IS UNIQUE',
      'CREATE CONSTRAINT club_id IF NOT EXISTS FOR (n:Club) REQUIRE n.id IS UNIQUE',
      'CREATE CONSTRAINT manager_id IF NOT EXISTS FOR (n:Manager) REQUIRE n.id IS UNIQUE',
      'CREATE CONSTRAINT player_id IF NOT EXISTS FOR (n:Player) REQUIRE n.id IS UNIQUE',
      'CREATE INDEX player_name IF NOT EXISTS FOR (n:Player) ON (n.name)',
      'CREATE INDEX club_name IF NOT EXISTS FOR (n:Club) ON (n.name)',
      'CREATE INDEX manager_name IF NOT EXISTS FOR (n:Manager) ON (n.name)',
    ];
    for (const c of constraints) {
      await session.executeWrite((tx) => tx.run(c));
    }

    // --- Nodes ---
    console.log(`Loading ${countries.length} countries...`);
    await session.executeWrite((tx) =>
      tx.run(
        `UNWIND $rows AS row
         CREATE (c:Country {id: row.id, name: row.name})`,
        { rows: countries }
      )
    );

    console.log(`Loading ${competitions.length} competitions...`);
    await session.executeWrite((tx) =>
      tx.run(
        `UNWIND $rows AS row
         CREATE (comp:Competition {id: row.id, name: row.name, tier: row.tier})
         WITH comp, row
         MATCH (co:Country {id: row.countryId})
         CREATE (comp)-[:HELD_IN]->(co)`,
        { rows: competitions }
      )
    );

    console.log(`Loading ${clubs.length} clubs...`);
    await session.executeWrite((tx) =>
      tx.run(
        `UNWIND $rows AS row
         CREATE (cl:Club {id: row.id, name: row.name, founded: row.founded})
         WITH cl, row
         MATCH (co:Country {id: row.countryId})
         CREATE (cl)-[:BASED_IN]->(co)
         WITH cl, row
         UNWIND row.competitionIds AS compId
         MATCH (comp:Competition {id: compId})
         CREATE (cl)-[:COMPETES_IN]->(comp)`,
        { rows: clubs }
      )
    );

    console.log(`Loading ${managers.length} managers...`);
    await session.executeWrite((tx) =>
      tx.run(
        `UNWIND $rows AS row
         CREATE (m:Manager {id: row.id, name: row.name})
         WITH m, row
         MATCH (co:Country {id: row.nationalityId})
         CREATE (m)-[:NATIONALITY]->(co)`,
        { rows: managers }
      )
    );

    console.log(`Loading ${players.length} players...`);
    await session.executeWrite((tx) =>
      tx.run(
        `UNWIND $rows AS row
         CREATE (p:Player {id: row.id, name: row.name, dob: date(row.dob), position: row.position})
         WITH p, row
         MATCH (co:Country {id: row.nationalityId})
         CREATE (p)-[:NATIONALITY]->(co)`,
        { rows: players }
      )
    );

    // --- Relationships with temporal + stat properties ---
    console.log(`Loading ${managerSpells.length} manager spells...`);
    await session.executeWrite((tx) =>
      tx.run(
        `UNWIND $rows AS row
         MATCH (m:Manager {id: row.managerId}), (c:Club {id: row.clubId})
         CREATE (m)-[:MANAGED {
           from: date(row.from),
           to: CASE WHEN row.to IS NULL THEN null ELSE date(row.to) END
         }]->(c)`,
        { rows: managerSpells }
      )
    );

    console.log(`Loading ${playerSpells.length} player spells...`);
    await session.executeWrite((tx) =>
      tx.run(
        `UNWIND $rows AS row
         MATCH (p:Player {id: row.playerId}), (c:Club {id: row.clubId})
         CREATE (p)-[:PLAYED_FOR {
           from: date(row.from),
           to: CASE WHEN row.to IS NULL THEN null ELSE date(row.to) END,
           appearances: row.appearances,
           goals: row.goals
         }]->(c)`,
        { rows: playerSpells }
      )
    );

    console.log(`Deriving and loading ${teammateEdges.length} teammate relationships...`);
    await session.executeWrite((tx) =>
      tx.run(
        `UNWIND $rows AS row
         MATCH (a:Player {id: row.playerAId}), (b:Player {id: row.playerBId})
         CREATE (a)-[:TEAMMATE_OF {
           clubId: row.clubId,
           from: date(row.from),
           to: date(row.to)
         }]->(b)`,
        { rows: teammateEdges }
      )
    );

    const counts = await session.executeRead((tx) =>
      tx.run(
        `MATCH (n) WITH count(n) AS nodes
         MATCH ()-[r]->() RETURN nodes, count(r) AS rels`
      )
    );
    const record = counts.records[0];
    console.log(
      `Done. ${record.get('nodes')} nodes, ${record.get('rels')} relationships loaded.`
    );
  } finally {
    await session.close();
    await closeDriver();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exitCode = 1;
});

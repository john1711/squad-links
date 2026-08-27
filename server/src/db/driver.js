import neo4j from 'neo4j-driver';
import { config } from '../config.js';

// Single shared driver instance. The official neo4j-driver package works
// unmodified against CognoDB because CognoDB speaks openCypher over the
// same Bolt protocol (5.0-5.4) that Neo4j drivers expect.
let driver = null;

export function getDriver() {
  if (!driver) {
    driver = neo4j.driver(
      config.cognodb.uri,
      neo4j.auth.basic(config.cognodb.user, config.cognodb.password),
      { maxConnectionPoolSize: 20 }
    );
  }
  return driver;
}

export async function verifyConnectivity() {
  await getDriver().verifyConnectivity();
}

export async function closeDriver() {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

// Runs a single read/write query in its own session and always closes it.
// Every query in this app goes through here with a parameters object -
// never string-concatenated Cypher.
export async function runQuery(cypher, params = {}) {
  const session = getDriver().session();
  try {
    const result = await session.run(cypher, params);
    return result.records;
  } finally {
    await session.close();
  }
}

// Runs a write transaction (used by the seed script for batched writes).
export async function runWrite(cypher, params = {}) {
  const session = getDriver().session();
  try {
    return await session.executeWrite((tx) => tx.run(cypher, params));
  } finally {
    await session.close();
  }
}

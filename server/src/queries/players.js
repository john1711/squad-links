// All queries here are parameterised - `$term`, `$id`, etc. are bound
// through the driver, never string-concatenated into the Cypher text.

export const SEARCH_PLAYERS = `
  MATCH (p:Player)
  WHERE toLower(p.name) CONTAINS toLower($term)
  OPTIONAL MATCH (p)-[:NATIONALITY]->(country:Country)
  RETURN p, country
  ORDER BY p.name
  LIMIT 15
`;

export const GET_PLAYER = `
  MATCH (p:Player {id: $id})
  OPTIONAL MATCH (p)-[:NATIONALITY]->(country:Country)
  RETURN p, country
`;

export const GET_PLAYER_CAREER = `
  MATCH (p:Player {id: $id})-[s:PLAYED_FOR]->(club:Club)
  OPTIONAL MATCH (club)-[:BASED_IN]->(clubCountry:Country)
  RETURN s, club, clubCountry
  ORDER BY s.from ASC
`;

export const GET_TEAMMATE_COUNT = `
  MATCH (p:Player {id: $id})-[:TEAMMATE_OF]-(t:Player)
  RETURN count(DISTINCT t) AS teammateCount
`;

// "Players you might know": a classic 2-hop friend-of-a-friend traversal.
// Finds players who share at least one teammate with the given player but
// were never teammates themselves - awkward in SQL (self-join + anti-join
// over a many-to-many table), a graph pattern here.
//
// Note: this collects direct-neighbor ids into a list and filters with
// NOT ... IN, rather than the more idiomatic `NOT (a)-[:TEAMMATE_OF]-(fof)`
// pattern predicate. On this CognoDB instance that pattern-predicate form
// mis-resolves `fof` when both endpoints of the anti-pattern are already
// bound from an earlier multi-hop MATCH (confirmed by direct testing) -
// the list-containment form sidesteps it and is arguably clearer anyway.
export const GET_PLAYERS_YOU_MIGHT_KNOW = `
  MATCH (a:Player {id: $id})-[:TEAMMATE_OF]-(direct:Player)
  WITH a, collect(DISTINCT direct.id) AS directIds
  MATCH (a)-[:TEAMMATE_OF]-(mutual:Player)-[:TEAMMATE_OF]-(fof:Player)
  WHERE fof.id <> a.id AND NOT fof.id IN directIds
  OPTIONAL MATCH (fof)-[:NATIONALITY]->(country:Country)
  RETURN fof, country, count(DISTINCT mutual) AS mutualTeammates
  ORDER BY mutualTeammates DESC, fof.name ASC
  LIMIT 8
`;

// "Followed the manager": players who played for a manager at one club,
// and later played for the same manager again at a different club. This
// chains PLAYED_FOR and MANAGED with overlapping date ranges across a
// 4-hop pattern - the kind of query that turns into a self-join-heavy,
// index-unfriendly mess in SQL but reads as one graph pattern here.
export const GET_MANAGER_REUNIONS = `
  MATCH (p:Player {id: $id})-[s1:PLAYED_FOR]->(c1:Club)<-[m1:MANAGED]-(mgr:Manager)
                                -[m2:MANAGED]->(c2:Club)<-[s2:PLAYED_FOR]-(p)
  WHERE c1 <> c2
    AND m1.from < m2.from
    AND s1.from <= coalesce(m1.to, date()) AND coalesce(s1.to, date()) >= m1.from
    AND s2.from <= coalesce(m2.to, date()) AND coalesce(s2.to, date()) >= m2.from
  RETURN DISTINCT mgr, c1, c2, m1.from AS firstFrom, m2.from AS secondFrom
  ORDER BY firstFrom ASC
`;

export const SEARCH_CLUBS = `
  MATCH (c:Club)
  WHERE toLower(c.name) CONTAINS toLower($term)
  RETURN c
  ORDER BY c.name
  LIMIT 15
`;

export const GET_CLUB = `
  MATCH (c:Club {id: $id})
  OPTIONAL MATCH (c)-[:BASED_IN]->(country:Country)
  OPTIONAL MATCH (c)-[:COMPETES_IN]->(comp:Competition)
  RETURN c, country, collect(DISTINCT comp) AS competitions
`;

export const GET_CLUB_SQUAD = `
  MATCH (p:Player)-[s:PLAYED_FOR]->(c:Club {id: $id})
  RETURN p, s
  ORDER BY s.from DESC
`;

export const GET_CLUB_MANAGERS = `
  MATCH (m:Manager)-[s:MANAGED]->(c:Club {id: $id})
  RETURN m, s
  ORDER BY s.from DESC
`;

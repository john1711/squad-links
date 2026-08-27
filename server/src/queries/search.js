// Simple UNION across two label types for a single combined search box.
export const AUTOCOMPLETE = `
  MATCH (p:Player)
  WHERE toLower(p.name) CONTAINS toLower($term)
  RETURN p.id AS id, p.name AS name, 'player' AS type
  ORDER BY p.name
  LIMIT 8
  UNION
  MATCH (c:Club)
  WHERE toLower(c.name) CONTAINS toLower($term)
  RETURN c.id AS id, c.name AS name, 'club' AS type
  ORDER BY c.name
  LIMIT 8
`;

// The flagship query: shortest path of teammate relationships between two
// players - the shortest chain of shared dressing rooms linking them. A
// variable-length shortest-path search like this is exactly what graph
// databases are for: in SQL it
// means a recursive CTE with manual cycle detection and no way to stop
// early once the shortest path is found, and it gets slower with every
// added hop. Here it's one line, and CognoDB stops as soon as the
// shortest path is located.
export const FIND_CONNECTION = `
  MATCH (a:Player {id: $fromId}), (b:Player {id: $toId})
  OPTIONAL MATCH path = shortestPath((a)-[:TEAMMATE_OF*1..6]-(b))
  RETURN a, b, path
`;

// Pulls out the clubs that produced each hop of a found path, so the UI
// can label each edge ("teammates at Real Madrid, 2010-2014").
export const EXPAND_PATH_CLUBS = `
  UNWIND $clubIds AS clubId
  MATCH (c:Club {id: clubId})
  RETURN c
`;

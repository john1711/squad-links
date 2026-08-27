import neo4j from 'neo4j-driver';

// Recursively converts values coming back from the neo4j-driver (Integer,
// Date/DateTime, Node, Relationship, arrays, nested objects) into plain
// JSON-serializable values so route handlers can just `res.json(...)`.
export function toNative(value) {
  if (value === null || value === undefined) return value;

  if (neo4j.isInt(value)) {
    return value.inSafeRange() ? value.toNumber() : value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(toNative);
  }

  if (typeof value === 'object') {
    // Neo4j temporal types (Date, DateTime, Duration, ...) stringify to ISO 8601.
    const ctorName = value.constructor && value.constructor.name;
    if (ctorName && /^(Date|DateTime|LocalDateTime|Time|LocalTime|Duration)$/.test(ctorName)) {
      return value.toString();
    }

    // Node / Relationship records carry their data in `.properties`.
    if (value.properties && (value.labels || value.type)) {
      return toNative(value.properties);
    }

    const out = {};
    for (const [key, val] of Object.entries(value)) {
      out[key] = toNative(val);
    }
    return out;
  }

  return value;
}

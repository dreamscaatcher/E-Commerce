import neo4j, { type Driver } from "neo4j-driver";

declare global {
  var neo4jDriver: Driver | undefined;
}

const uri = process.env.NEO4J_URI;
const username = process.env.NEO4J_USERNAME || process.env.NEO4J_USER;
const password = process.env.NEO4J_PASSWORD;

if (!uri || !username || !password) {
  throw new Error(
    "Missing Neo4j env vars: NEO4J_URI, NEO4J_USERNAME (or NEO4J_USER), NEO4J_PASSWORD"
  );
}

const driver: Driver =
  globalThis.neo4jDriver ??
  neo4j.driver(uri, neo4j.auth.basic(username, password));

if (process.env.NODE_ENV !== "production") {
  globalThis.neo4jDriver = driver;
}

export default driver;

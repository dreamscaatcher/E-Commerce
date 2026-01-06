const fs = require("fs");
const path = require("path");

const neo4j = require("neo4j-driver");

function loadEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const equalsIndex = trimmed.indexOf("=");
      if (equalsIndex === -1) continue;

      const key = trimmed.slice(0, equalsIndex).trim();
      if (!key) continue;

      let value = trimmed.slice(equalsIndex + 1).trim();
      if (!value) continue;

      if (
        (value.startsWith("\"") && value.endsWith("\"")) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "ENOENT") return;
    }
    throw error;
  }
}

function isCommentOnly(statement) {
  return statement.split(/\r?\n/).every((line) => {
    const trimmed = line.trim();
    return trimmed === "" || trimmed.startsWith("//");
  });
}

function formatRecords(records) {
  return records.map((record) => {
    const obj = {};
    for (const key of record.keys) {
      const value = record.get(key);
      obj[key] =
        value && typeof value === "object" && typeof value.toNumber === "function"
          ? value.toNumber()
          : value;
    }
    return obj;
  });
}

async function main() {
  loadEnvFile(path.join(process.cwd(), ".env.local"));
  loadEnvFile(path.join(process.cwd(), ".env"));

  const argv = process.argv.slice(2);
  const wantsHelp = argv.includes("--help") || argv.includes("-h");
  const wipe = argv.includes("--wipe");
  const scriptPath = argv.find((arg) => arg && !arg.startsWith("-"));

  if (wantsHelp) {
    console.log(`Usage:
  node scripts/seed.js [path/to/file.cypher] [--wipe]

Options:
  --wipe          Delete all nodes before seeding (DANGEROUS)
  -h, --help      Show this help

Reads Neo4j connection info from .env.local/.env:
  NEO4J_URI, NEO4J_USERNAME (or NEO4J_USER), NEO4J_PASSWORD, optional NEO4J_DATABASE
`);
    return;
  }

  const cypherFile =
    scriptPath || path.join(process.cwd(), "scripts", "seed-synthetic-data.cypher");

  const uri = process.env.NEO4J_URI;
  const username = process.env.NEO4J_USERNAME || process.env.NEO4J_USER;
  const password = process.env.NEO4J_PASSWORD;
  const database = process.env.NEO4J_DATABASE || "neo4j";

  if (!uri || !username || !password) {
    console.error(
      "Missing Neo4j env vars: NEO4J_URI, NEO4J_USERNAME (or NEO4J_USER), NEO4J_PASSWORD"
    );
    process.exit(1);
  }

  if (!fs.existsSync(cypherFile)) {
    console.error(`Cypher seed file not found: ${cypherFile}`);
    process.exit(1);
  }

  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  try {
    await driver.verifyConnectivity();
    const session = driver.session({ database });
    try {
      if (wipe) {
        console.warn("WIPING database contents...");
        await session.run("MATCH (n) DETACH DELETE n");
      }

      const cypher = fs.readFileSync(cypherFile, "utf8");
      const statements = cypher
        .split(";")
        .map((statement) => statement.trim())
        .filter(Boolean)
        .filter((statement) => !isCommentOnly(statement));

      for (const [index, statement] of statements.entries()) {
        const label = `(${index + 1}/${statements.length})`;
        process.stdout.write(`${label} Running... `);
        const result = await session.run(statement);
        if (result.records?.length) {
          console.log("OK", formatRecords(result.records));
        } else {
          console.log("OK");
        }
      }
    } finally {
      await session.close();
    }
  } finally {
    await driver.close();
  }
}

main().catch((error) => {
  console.error("Seed failed:", error?.message || error);
  process.exitCode = 1;
});

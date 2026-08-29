import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const migrationDirectory = path.join(root, "supabase", "migrations");
const expected = ["0008", "0009", "0010", "0011", "0012", "0013", "0014"];
const files = await readdir(migrationDirectory);
for (const prefix of expected) {
  if (!files.some((file) => file.startsWith(`${prefix}_`) && file.endsWith(".sql"))) {
    throw new Error(`Missing rookie migration ${prefix}.`);
  }
}

const schemaSql = (await Promise.all(
  files.filter((file) => expected.some((prefix) => file.startsWith(`${prefix}_`))).map((file) => readFile(path.join(migrationDirectory, file), "utf8")),
)).join("\n");
const declaredTables = [...schemaSql.matchAll(/create table(?: if not exists)? public\.(rookie_[a-z0-9_]+)/gi)].map((match) => match[1]);
const databaseTypes = await readFile(path.join(root, "types", "database.ts"), "utf8");
const missingTypes = declaredTables.filter((table) => !databaseTypes.includes(`${table}: {`));
if (missingTypes.length) throw new Error(`Database types are missing: ${missingTypes.join(", ")}`);
if (databaseTypes.includes("Record<string, never>;\n" ) && databaseTypes.includes("export type Database = Record")) {
  throw new Error("The placeholder Database type is still present.");
}

console.log(`Rookie migration chain ${expected[0]}-${expected.at(-1)} is complete; ${declaredTables.length} tables have contracts.`);

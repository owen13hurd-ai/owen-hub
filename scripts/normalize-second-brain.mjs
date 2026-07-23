import { readFile, readdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { extname, join, relative } from "node:path";

const vault = process.env.OBSIDIAN_VAULT_PATH || join(homedir(), "Documents", "Obsidian Vault");
const changed = [];

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === ".obsidian" || entry.name === ".trash") continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await markdownFiles(path));
    else if (extname(entry.name) === ".md") files.push(path);
  }
  return files;
}

function normalizeFrontmatter(content) {
  if (!content.startsWith("---\n")) return content;
  const closing = content.indexOf("\n---", 4);
  if (closing < 0) return content;
  const lines = content.slice(4, closing).split("\n");
  const blocks = [];
  let current = null;
  for (const line of lines) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_-]*):/);
    if (match) {
      current = { key: match[1], lines: [line] };
      blocks.push(current);
    } else if (current) {
      current.lines.push(line);
    }
  }
  const lastBlockByKey = new Map(blocks.map((block) => [block.key, block]));
  const emitted = new Set();
  const unique = [];
  for (const block of blocks) {
    if (emitted.has(block.key) || lastBlockByKey.get(block.key) !== block) continue;
    emitted.add(block.key);
    unique.push(...block.lines);
  }
  return `---\n${unique.join("\n")}\n---${content.slice(closing + 4)}`;
}

for (const path of await markdownFiles(vault)) {
  const original = await readFile(path, "utf8");
  const next = normalizeFrontmatter(original);
  if (next !== original) {
    await writeFile(path, next);
    changed.push(relative(vault, path));
  }
}

console.log(JSON.stringify({ vault, changed: changed.length, files: changed }, null, 2));

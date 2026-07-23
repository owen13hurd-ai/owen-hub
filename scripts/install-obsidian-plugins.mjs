import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const vault = process.env.OBSIDIAN_VAULT_PATH || join(homedir(), "Documents", "Obsidian Vault");
const pluginsDirectory = join(vault, ".obsidian", "plugins");
const repositories = [
  "blacksmithgu/obsidian-dataview",
  "SilentVoid13/Templater",
  "chhoumann/quickadd",
  "obsidian-tasks-group/obsidian-tasks",
  "liamcain/obsidian-calendar-plugin",
  "liamcain/obsidian-periodic-notes",
  "Vinzent03/obsidian-git",
  "scambier/obsidian-omnisearch",
  "mdelobelle/metadatamenu",
  "mgmeyers/obsidian-kanban",
  "phibr0/obsidian-commander",
  "zsviczian/obsidian-excalidraw-plugin",
  "kepano/obsidian-minimal-settings",
];

async function latestRelease(repository) {
  const response = await fetch(`https://api.github.com/repos/${repository}/releases/latest`, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "owens-second-brain-setup" },
  });
  if (!response.ok) throw new Error(`${repository}: GitHub returned ${response.status}`);
  return response.json();
}

async function download(url, destination) {
  const response = await fetch(url, { headers: { "User-Agent": "owens-second-brain-setup" } });
  if (!response.ok) throw new Error(`${url}: download returned ${response.status}`);
  await writeFile(destination, Buffer.from(await response.arrayBuffer()));
}

await mkdir(pluginsDirectory, { recursive: true });
const installed = [];

for (const repository of repositories) {
  const release = await latestRelease(repository);
  const manifestAsset = release.assets.find((asset) => asset.name === "manifest.json");
  const mainAsset = release.assets.find((asset) => asset.name === "main.js");
  if (!manifestAsset || !mainAsset) throw new Error(`${repository}: release lacks standard Obsidian assets`);

  const manifestResponse = await fetch(manifestAsset.browser_download_url, { headers: { "User-Agent": "owens-second-brain-setup" } });
  if (!manifestResponse.ok) throw new Error(`${repository}: manifest download failed`);
  const manifestText = await manifestResponse.text();
  const manifest = JSON.parse(manifestText);
  const destination = join(pluginsDirectory, manifest.id);
  await mkdir(destination, { recursive: true });
  await writeFile(join(destination, "manifest.json"), manifestText);
  await download(mainAsset.browser_download_url, join(destination, "main.js"));
  const stylesAsset = release.assets.find((asset) => asset.name === "styles.css");
  if (stylesAsset) await download(stylesAsset.browser_download_url, join(destination, "styles.css"));
  installed.push({ id: manifest.id, name: manifest.name, version: manifest.version });
}

const enabledPath = join(vault, ".obsidian", "community-plugins.json");
let enabled = [];
try {
  enabled = JSON.parse(await readFile(enabledPath, "utf8"));
} catch {
  enabled = [];
}
enabled = [...new Set(["obsidian-local-rest-api", ...enabled, ...installed.map((plugin) => plugin.id)])];
await writeFile(enabledPath, `${JSON.stringify(enabled, null, 2)}\n`);

console.log(JSON.stringify({ vault, installed, enabled }, null, 2));

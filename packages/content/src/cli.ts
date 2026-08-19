import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readBundle } from "./io.js";

// 本文件位于 <repo>/packages/content/dist/cli.js，向上三级即仓库根目录
const here = dirname(fileURLToPath(import.meta.url));
const root = process.env.CLARK_TYPER_ROOT ?? resolve(here, "..", "..", "..");

const bundle = readBundle(root);
const outDir = join(root, "apps", "web", "public");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "content.json"), JSON.stringify(bundle), "utf8");

console.log(
  `[content] synced ${bundle.chapters.length} chapters, ${bundle.snapshots.length} snapshots, ${bundle.scienceSettings.length} science settings, ${bundle.characters.length} characters → apps/web/public/content.json`,
);
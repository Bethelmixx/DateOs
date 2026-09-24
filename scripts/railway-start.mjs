import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const src = join(root, "node_modules/@electric-sql/pglite/dist");
const dest = join(root, ".output/server/__libs");

if (existsSync(src)) {
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(src)) {
    if (!name.endsWith(".data") && !name.endsWith(".wasm")) continue;
    copyFileSync(join(src, name), join(dest, name));
  }
}

process.env.HOST = "0.0.0.0";
process.env.NITRO_HOST = "0.0.0.0";

await import(pathToFileURL(join(root, ".output/server/index.mjs")).href);

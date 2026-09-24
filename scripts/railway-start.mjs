import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const src = join(root, "node_modules/@electric-sql/pglite/dist");
const assets = existsSync(src)
  ? readdirSync(src).filter((name) => name.endsWith(".data") || name.endsWith(".wasm"))
  : [];

for (const dest of [
  join(root, ".output/server/_libs"),
  join(root, ".output/server/__libs"),
  join(root, ".output/server/node_modules/@electric-sql/pglite/dist"),
]) {
  mkdirSync(dest, { recursive: true });
  for (const name of assets) {
    copyFileSync(join(src, name), join(dest, name));
  }
}

process.env.HOST = "0.0.0.0";
process.env.NITRO_HOST = "0.0.0.0";

await import(pathToFileURL(join(root, ".output/server/index.mjs")).href);

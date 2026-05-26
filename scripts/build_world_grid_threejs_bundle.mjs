import { readFile, writeFile } from "node:fs/promises";
import { build } from "esbuild";

const outfile = "public/experiences/world-grid/three_scene_bundle.js";

await build({
  entryPoints: ["public/experiences/world-grid/three_scene_entry.js"],
  bundle: true,
  format: "iife",
  globalName: "WorldGridThreeBundle",
  outfile,
  legalComments: "none",
  minify: true,
});

const bundled = await readFile(outfile, "utf8");
const normalized = bundled
  .replace(/[ \t]+$/gm, "")
  .replace(/^[ ]+\t/gm, "\t");

await writeFile(outfile, normalized);

import { readFile, writeFile } from "node:fs/promises";
import { build } from "esbuild";

const outfile = "public/experiences/founders-plot/three_scene_bundle.js";

await build({
  entryPoints: ["public/experiences/founders-plot/three_scene_entry.js"],
  bundle: true,
  format: "iife",
  globalName: "FoundersPlotThreeBundle",
  outfile,
  legalComments: "none",
  minify: true,
});

const bundled = await readFile(outfile, "utf8");
const normalized = bundled
  .replace(/[ \t]+$/gm, "")
  .replace(/^[ ]+\t/gm, "\t");

await writeFile(outfile, normalized);

// Builds fork-demo/dist from fork-docs/release-samples.csv.
// Copies only listed scores, plus the UMD bundle. Does not read demo/ or webpack config.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadReleaseSamples, repoRoot } from "./release-samples-lib.mjs";

export const demoDist = path.join(repoRoot, "fork-demo", "dist");
const bundlePath = path.join(repoRoot, "build", "opensheetmusicdisplay.min.js");

export function buildForkDemo() {
    const samples = loadReleaseSamples();
    fs.rmSync(demoDist, { recursive: true, force: true });
    fs.mkdirSync(demoDist, { recursive: true });
    if (!fs.existsSync(bundlePath)) {
        throw new Error(
            "build/opensheetmusicdisplay.min.js is missing. Run npm run build:webpack before the fork demo build.",
        );
    }
    fs.copyFileSync(bundlePath, path.join(demoDist, "opensheetmusicdisplay.min.js"));
    const entries = [];
    for (const sample of samples) {
        const from = path.join(repoRoot, sample.path);
        if (!fs.existsSync(from)) {
            throw new Error(`listed sample is missing on disk: ${sample.path}`);
        }
        const relative = path.join("samples", sample.path);
        const to = path.join(demoDist, relative);
        fs.mkdirSync(path.dirname(to), { recursive: true });
        fs.copyFileSync(from, to);
        entries.push({
            label: path.basename(sample.path),
            file: relative.split(path.sep).join("/"),
        });
    }
    const samplesJs = `window.RELEASE_SAMPLES = ${JSON.stringify(entries, null, 2)};\n`;
    fs.writeFileSync(path.join(demoDist, "samples.js"), samplesJs);
    fs.writeFileSync(path.join(demoDist, "index.html"), indexHtml());
    return demoDist;
}

function indexHtml() {
    return `<!DOCTYPE html>
<html lang="zh-Hans">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Fork demo (not the official OSMD demo)</title>
  <style>
    body { font-family: sans-serif; margin: 1rem; }
    #note { max-width: 46rem; color: #333; }
    #status { color: #8a1f11; white-space: pre-wrap; }
    #osmdContainer { overflow: auto; }
    select { min-width: 24rem; max-width: 100%; }
  </style>
</head>
<body>
  <h1>Fork demo</h1>
  <p id="note">这不是官方 OSMD demo。下拉列表只包含 <code>fork-docs/release-samples.csv</code> 中的乐谱，页面不会加载上游 <code>demo/</code> 或整个 <code>test/data</code>。</p>
  <p><label for="sample">样例 <select id="sample"></select></label></p>
  <p id="status"></p>
  <div id="osmdContainer"></div>
  <script src="./opensheetmusicdisplay.min.js"></script>
  <script src="./samples.js"></script>
  <script>
    const status = document.getElementById("status");
    const select = document.getElementById("sample");
    const osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay("osmdContainer", { autoResize: false });
    for (const entry of window.RELEASE_SAMPLES) {
      const option = document.createElement("option");
      option.value = entry.file;
      option.textContent = entry.label;
      select.appendChild(option);
    }
    async function showSelected() {
      const file = select.value;
      status.textContent = "Loading " + file;
      const response = await fetch(file);
      if (!response.ok) {
        throw new Error(response.status + " " + file);
      }
      const content = file.toLowerCase().endsWith(".mxl") ? await response.blob() : await response.text();
      await osmd.load(content);
      osmd.render();
      status.textContent = "";
    }
    const requested = new URLSearchParams(location.search).get("sample");
    if (requested) {
      const match = [...select.options].find((option) => {
        return option.value === requested || option.value.endsWith("/" + requested) || option.textContent === requested;
      });
      if (match) {
        select.value = match.value;
      }
    }
    select.addEventListener("change", () => {
      showSelected().catch((error) => {
        status.textContent = String(error && error.message ? error.message : error);
      });
    });
    showSelected().catch((error) => {
      status.textContent = String(error && error.message ? error.message : error);
    });
  </script>
</body>
</html>
`;
}

const isDirectRun = process.argv[1]
    && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
    try {
        const dist = buildForkDemo();
        console.log(`fork demo written to ${dist}`);
    } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

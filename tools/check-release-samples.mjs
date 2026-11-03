// Fails when published scores drift from fork-docs/release-samples.csv.
// 1. Added or modified .xml/.musicxml/.mxl vs upstream/develop must be listed, grade A, and hash-matched.
// 2. npm pack --dry-run must not contain a score file.
// 3. fork-demo/dist must contain only listed scores, with matching SHA-256.
// Also requires git diff --diff-filter=DMR upstream/develop...HEAD -- test/data demo to be empty.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { buildForkDemo, demoDist } from "./build-fork-demo.mjs";
import {
    SCORE_EXTENSION,
    loadReleaseSamples,
    repoRoot,
    sha256Buffer,
    sha256File,
} from "./release-samples-lib.mjs";

const errors = [];

function git(args) {
    return execFileSync("git", args, {
        cwd: repoRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
    });
}

function report(message) {
    errors.push(message);
}

function changedScorePaths() {
    const text = git(["diff", "--name-status", "upstream/develop...HEAD"]);
    const paths = [];
    for (const line of text.split("\n")) {
        if (!line) {
            continue;
        }
        const cells = line.split("\t");
        const status = cells[0];
        const scorePath = status.startsWith("R") || status.startsWith("C")
            ? cells[cells.length - 1]
            : cells[1];
        if ((status.startsWith("A") || status.startsWith("M") || status.startsWith("R") || status.startsWith("C"))
            && SCORE_EXTENSION.test(scorePath)) {
            paths.push(scorePath);
        }
    }
    return paths;
}

function checkList(samples) {
    const byPath = new Map();
    for (const sample of samples) {
        byPath.set(sample.path, sample);
        if (sample.grade !== "A") {
            report(`${sample.path} is grade ${sample.grade}; only grade A may be published`);
        }
        if (!/^[0-9a-f]{64}$/.test(sample.sha256)) {
            report(`${sample.path} has no SHA-256`);
            continue;
        }
        const absolute = path.join(repoRoot, sample.path);
        if (!fs.existsSync(absolute)) {
            report(`listed file is missing: ${sample.path}`);
            continue;
        }
        const actual = sha256File(absolute);
        if (actual !== sample.sha256) {
            report(`${sample.path} SHA-256 is ${actual}, list has ${sample.sha256}`);
        }
    }
    return byPath;
}

function checkUpstreamDiff(byPath) {
    let changed;
    try {
        changed = changedScorePaths();
    } catch (error) {
        report(`cannot diff against upstream/develop: ${error instanceof Error ? error.message : error}`);
        return;
    }
    for (const scorePath of changed) {
        const sample = byPath.get(scorePath);
        if (!sample) {
            report(`added or modified score is not in the release list: ${scorePath}`);
            continue;
        }
        const absolute = path.join(repoRoot, scorePath);
        if (fs.existsSync(absolute) && sha256File(absolute) !== sample.sha256) {
            report(`added or modified score hash does not match the list: ${scorePath}`);
        }
    }
    let renamed;
    try {
        renamed = git([
            "diff",
            "--name-status",
            "--diff-filter=DMR",
            "upstream/develop...HEAD",
            "--",
            "test/data",
            "demo",
        ]);
    } catch (error) {
        report(`cannot check upstream sample paths: ${error instanceof Error ? error.message : error}`);
        return;
    }
    if (renamed.trim()) {
        report(`upstream test/data or demo scores were deleted, modified, or renamed:\n${renamed.trim()}`);
    }
}

function parsePackJson(stdout) {
    const starts = [];
    for (let index = 0; index < stdout.length; index += 1) {
        if (stdout[index] === "[" && (index === 0 || stdout[index - 1] === "\n")) {
            starts.push(index);
        }
    }
    for (let index = starts.length - 1; index >= 0; index -= 1) {
        const slice = stdout.slice(starts[index]);
        const end = slice.lastIndexOf("]");
        if (end < 0) {
            continue;
        }
        try {
            return JSON.parse(slice.slice(0, end + 1));
        } catch {
            // webpack's prepare output can contain brackets before the pack JSON
        }
    }
    return undefined;
}

function checkNpmPack() {
    let stdout;
    try {
        stdout = execFileSync("npm", ["pack", "--dry-run", "--json"], {
            cwd: repoRoot,
            encoding: "utf8",
            stdio: ["ignore", "pipe", "pipe"],
            maxBuffer: 64 * 1024 * 1024,
        });
    } catch (error) {
        report(`npm pack --dry-run failed: ${error instanceof Error ? error.message : error}`);
        return;
    }
    const parsed = parsePackJson(stdout);
    if (!parsed) {
        report("npm pack --dry-run --json did not print JSON");
        return;
    }
    const packs = Array.isArray(parsed) ? parsed : [parsed];
    for (const pack of packs) {
        for (const file of pack.files ?? []) {
            const filePath = typeof file === "string" ? file : file.path;
            if (filePath && SCORE_EXTENSION.test(filePath)) {
                report(`npm pack contains a score file: ${filePath}`);
            }
        }
    }
}

function checkDemoDist(byPath) {
    try {
        buildForkDemo();
    } catch (error) {
        report(`fork demo build failed: ${error instanceof Error ? error.message : error}`);
        return;
    }
    const found = new Set();
    const entries = fs.readdirSync(demoDist, { recursive: true });
    for (const entry of entries) {
        const relative = String(entry).split(path.sep).join("/");
        const absolute = path.join(demoDist, relative);
        if (!fs.statSync(absolute).isFile() || !SCORE_EXTENSION.test(relative)) {
            continue;
        }
        if (!relative.startsWith("samples/")) {
            report(`fork demo has a score outside samples/: ${relative}`);
            continue;
        }
        const listed = relative.slice("samples/".length);
        const sample = byPath.get(listed);
        if (!sample) {
            report(`fork demo has a score that is not in the release list: ${relative}`);
            continue;
        }
        const actual = sha256Buffer(fs.readFileSync(absolute));
        if (actual !== sample.sha256) {
            report(`fork demo copy of ${listed} SHA-256 is ${actual}, list has ${sample.sha256}`);
        }
        found.add(listed);
    }
    for (const listed of byPath.keys()) {
        if (!found.has(listed)) {
            report(`fork demo is missing a listed score: ${listed}`);
        }
    }
}

function main() {
    let samples;
    try {
        samples = loadReleaseSamples();
    } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
    }
    const byPath = checkList(samples);
    checkUpstreamDiff(byPath);
    checkNpmPack();
    checkDemoDist(byPath);
    if (errors.length > 0) {
        for (const message of errors) {
            console.error(message);
        }
        process.exit(1);
    }
    console.log(`check-release-samples: ok (${samples.length} files)`);
}

main();

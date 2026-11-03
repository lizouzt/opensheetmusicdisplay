// Shared reader for fork-docs/release-samples.csv.
// The author cell is the oldest line of:
//   git log --diff-filter=A --format='%an %ad' --date=iso -- <file>

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const COLUMNS = [
    "文件路径",
    "来源",
    "作者/首次提交",
    "等级",
    "判定依据",
    "许可",
    "SHA-256",
];

export const SCORE_EXTENSION = /\.(xml|musicxml|mxl)$/i;

const here = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(here, "..");
export const listPath = path.join(repoRoot, "fork-docs", "release-samples.csv");

export function parseCsv(text) {
    const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;
    for (let i = 0; i < source.length; i += 1) {
        const char = source[i];
        if (inQuotes) {
            if (char === "\"") {
                if (source[i + 1] === "\"") {
                    field += "\"";
                    i += 1;
                } else {
                    inQuotes = false;
                }
            } else {
                field += char;
            }
        } else if (char === "\"") {
            inQuotes = true;
        } else if (char === ",") {
            row.push(field);
            field = "";
        } else if (char === "\n") {
            row.push(field);
            rows.push(row);
            row = [];
            field = "";
        } else if (char !== "\r") {
            field += char;
        }
    }
    if (field.length > 0 || row.length > 0) {
        row.push(field);
        rows.push(row);
    }
    return rows.filter((cells) => cells.some((cell) => cell.length > 0));
}

export function loadReleaseSamples() {
    const text = fs.readFileSync(listPath, "utf8");
    const rows = parseCsv(text);
    if (rows.length === 0) {
        throw new Error("release-samples.csv is empty");
    }
    const header = rows[0];
    if (header.length !== COLUMNS.length || header.some((cell, index) => cell !== COLUMNS[index])) {
        throw new Error(`release-samples.csv header must be: ${COLUMNS.join(",")}`);
    }
    const samples = [];
    const seen = new Set();
    for (let index = 1; index < rows.length; index += 1) {
        const cells = rows[index];
        if (cells.length !== COLUMNS.length) {
            throw new Error(`release-samples.csv line ${index + 1} has ${cells.length} columns`);
        }
        const sample = {
            path: cells[0],
            source: cells[1],
            author: cells[2],
            grade: cells[3],
            basis: cells[4],
            license: cells[5],
            sha256: cells[6].toLowerCase(),
        };
        if (!sample.path || sample.path.startsWith("/") || sample.path.split(/[/\\]/).includes("..")) {
            throw new Error(`release-samples.csv line ${index + 1} has an unsafe path: ${sample.path}`);
        }
        if (seen.has(sample.path)) {
            throw new Error(`release-samples.csv lists ${sample.path} more than once`);
        }
        seen.add(sample.path);
        samples.push(sample);
    }
    if (samples.length === 0) {
        throw new Error("release-samples.csv has no files");
    }
    return samples;
}

export function sha256File(filePath) {
    const data = fs.readFileSync(filePath);
    return createHash("sha256").update(data).digest("hex");
}

export function sha256Buffer(data) {
    return createHash("sha256").update(data).digest("hex");
}

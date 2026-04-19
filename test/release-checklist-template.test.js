import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const templatePath = path.join(repoRoot, "docs", "release-checklist-template.md");
const contributingPath = path.join(repoRoot, "CONTRIBUTING.md");

function readTemplate() {
  return fs.readFileSync(templatePath, "utf-8");
}

test("release checklist template includes all required release gates", () => {
  const template = readTemplate();

  const requiredItems = [
    "Runtime version",
    "package.json version",
    "git tag",
    "npm test",
    "CLI smoke",
    "npm pack --dry-run",
    "publish workflow",
    "release note",
    "commit/tag traceability",
  ];

  for (const item of requiredItems) {
    assert.match(template, new RegExp(item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }
});

test("release checklist template marks version metadata mismatches as blockers", () => {
  const template = readTemplate();

  assert.match(template, /release blocker/i);
  assert.match(template, /runtime version/i);
  assert.match(template, /package\.json version/i);
  assert.match(template, /git tag/i);
  assert.match(template, /NO-GO/);
});

test("release checklist template is reusable and records final release decision", () => {
  const template = readTemplate();

  const reusableFields = [
    "Release version",
    "Target date",
    "Release owner",
    "Evidence",
    "Blocker log",
    "GO/NO-GO",
  ];

  for (const field of reusableFields) {
    assert.match(template, new RegExp(field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }
});

test("contributing release flow requires the release checklist before tag publish", () => {
  const contributing = fs.readFileSync(contributingPath, "utf-8");

  assert.match(contributing, /docs\/release-checklist-template\.md/);
  assert.match(contributing, /release blocker/i);
  assert.match(contributing, /不得.*publish\.yml/);
  assert.match(contributing, /不得.*tag/);
});

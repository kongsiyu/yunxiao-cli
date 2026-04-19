import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";

const evidence = readFileSync(
  new URL("../_bmad-output/implementation-artifacts/v1-2-0-release-evidence-summary.md", import.meta.url),
  "utf8",
);

test("release evidence preserves GO/NO-GO decision and required gate sections", () => {
  const requiredSections = [
    "## GO/NO-GO Decision",
    "## Release Blockers",
    "## Non-blocking Residual Risks",
    "## Post-release Follow-ups",
    "## Verification Evidence",
    "## Version, Tag, and Package Evidence",
    "## Release Note and Publish Workflow Evidence",
    "## PR and Commit Traceability",
    "## Reviewer Handoff",
  ];

  for (const section of requiredSections) {
    assert.match(evidence, new RegExp(section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.match(evidence, /\*\*Decision\*\*: `NO-GO`/);
  assert.match(evidence, /Open release blockers exist/);
});

test("unmerged prerequisite PRs are explicitly classified as release blockers", () => {
  const blockingPrs = [
    "#83",
    "#84",
    "#85",
    "#86",
    "#89",
    "#90",
    "#91",
    "#92",
  ];

  for (const pr of blockingPrs) {
    assert.match(evidence, new RegExp(`\\| ${pr} \\|[^\\n]+\\| Release blocker \\|`));
  }

  assert.match(evidence, /No prerequisite PR listed above is treated as non-blocking while it remains unmerged/);
});

test("release evidence covers tests, smoke, pack dry-run, version, tag, release note, and traceability", () => {
  const requiredMarkers = [
    "npm test",
    "node --test test/v1-2-0-release-evidence-summary.test.js",
    "npm run smoke",
    "npm pack --dry-run",
    "package.json version",
    "runtime version",
    "git tag",
    "v1.2.0",
    "release note",
    "publish workflow",
    "commit traceability",
    "HEAD `89d60a8`",
  ];

  for (const marker of requiredMarkers) {
    assert.match(evidence, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }
});

test("residual risks are separated from blockers and do not override NO-GO", () => {
  assert.match(evidence, /\| R1 \|[^\n]+\| Non-blocking residual risk/);
  assert.match(evidence, /\| B1 \|[^\n]+\| Release blocker/);
  assert.doesNotMatch(evidence, /\*\*Decision\*\*: `GO`/);
});

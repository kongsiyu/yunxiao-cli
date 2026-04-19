# Release Checklist Template

Use this template for every yunxiao-cli release before pushing a release tag or triggering the publish workflow.

## Release Metadata

| Field | Value |
|---|---|
| Release version | `vX.Y.Z` |
| Target date | `YYYY-MM-DD` |
| Release owner | `@owner` |
| Source branch | `master` |
| Release commit | `<commit-sha>` |
| Git tag | `vX.Y.Z` |
| GO/NO-GO decision | `GO` / `NO-GO` |

## Required Release Gates

Each gate must include an owner, timestamp, command or evidence link, and result. Any failed gate must be copied to the Blocker log.

| Gate | Required evidence | Result |
|---|---|---|
| Runtime version | `node src/index.js --version` output equals the release version without the leading `v` | `PASS` / `FAIL` |
| package.json version | `node -p "require('./package.json').version"` output equals the release version without the leading `v` | `PASS` / `FAIL` |
| git tag | `git tag --points-at HEAD` contains exactly the planned `vX.Y.Z` tag before publish, or planned tag is documented before tag push | `PASS` / `FAIL` |
| npm test | `npm test` passes locally or in CI on the release commit | `PASS` / `FAIL` |
| CLI smoke | Required smoke matrix below is executed and recorded | `PASS` / `FAIL` |
| npm pack --dry-run | `npm pack --dry-run` output confirms expected package contents and no secret/test/build artifacts | `PASS` / `FAIL` |
| publish workflow | `.github/workflows/publish.yml` is present, reviewed, and expected to run from `v*` tags with `NPM_TOKEN` configured | `PASS` / `FAIL` |
| release note | Release note exists with user-visible changes, compatibility notes, and known residual risks | `PASS` / `FAIL` |
| commit/tag traceability | Release note, tag, release commit, PRs, and BMAD evidence all point to the same release version and commit | `PASS` / `FAIL` |

## Version Metadata Consistency Gate

The runtime version, package.json version, and git tag must describe the same version:

```text
runtime version == package.json version == git tag without leading "v"
```

If any value differs, record a `Release blocker` in the Blocker log, set the final decision to `NO-GO`, and do not push the tag or trigger `publish.yml`. Fix the metadata mismatch, rerun the checklist, and keep the failed evidence for traceability.

## CLI Smoke Matrix

### No-auth smoke

These checks must run without a PAT or project configuration:

```bash
node src/index.js --version
node src/index.js --help
node src/index.js auth status
```

Expected evidence:

| Command | Expected result | Evidence |
|---|---|---|
| `node src/index.js --version` | stdout is exactly the runtime version | `<link-or-output>` |
| `node src/index.js --help` | stdout includes the command tree and exits 0 | `<link-or-output>` |
| `node src/index.js auth status` | exits 0 and reports authentication status without requiring network access | `<link-or-output>` |

### Manual/live smoke

Run when `YUNXIAO_PAT`, `YUNXIAO_ORG_ID`, and `YUNXIAO_PROJECT_ID` are available. If the release environment has no live tenant, mark these rows as `manual/live-test deferred` with an explicit non-blocking risk or release blocker decision.

```bash
node src/index.js project list --json
node src/index.js wi list --json
node src/index.js sprint list --json
```

Expected evidence:

| Command | Expected result | Evidence |
|---|---|---|
| `node src/index.js project list --json` | stdout is valid JSON and stderr contains only diagnostics/update notices | `<link-or-output>` |
| `node src/index.js wi list --json` | stdout is valid JSON and stderr contains only diagnostics/update notices | `<link-or-output>` |
| `node src/index.js sprint list --json` | stdout is valid JSON and stderr contains only diagnostics/update notices | `<link-or-output>` |

## Package Dry Run

Run:

```bash
npm pack --dry-run
```

Record:

| Check | Expected | Evidence |
|---|---|---|
| Included files | `src/`, `README.md`, `package.json`, and npm-required metadata only | `<link-or-output>` |
| Excluded files | no tokens, local config, `node_modules/`, tests, BMAD artifacts, or generated tarballs | `<link-or-output>` |
| Package version | tarball name and package metadata match the release version | `<link-or-output>` |

## Publish Workflow Gate

Verify before tag push:

| Check | Expected | Evidence |
|---|---|---|
| Trigger | `.github/workflows/publish.yml` publishes on `v*` tags | `<link>` |
| Registry auth | `NPM_TOKEN` is configured for GitHub Actions | `<owner-confirmation>` |
| Install step | workflow runs `npm ci` before publish | `<link>` |
| Publish step | workflow runs `npm publish --access public` | `<link>` |

Do not push the release tag if any publish workflow prerequisite is unknown and the release owner classifies it as a release blocker.

## Release Note Gate

Release note must include:

- Release version and release date.
- Summary of user-visible changes.
- AI workflow contract changes or confirmations.
- Compatibility notes for `--json`, stdout/stderr behavior, and error codes.
- Test evidence summary.
- Known residual risks.
- Links to PRs, issues, release commit, and git tag.

## Blocker Log

| ID | Release blocker | Evidence | Owner | Resolution | Status |
|---|---|---|---|---|---|
| RB-1 | `<runtime/package/tag mismatch or other blocker>` | `<link-or-output>` | `@owner` | `<fix and rerun evidence>` | `open` / `closed` |

Open release blockers require a final `NO-GO` decision. Non-blocking residual risks must be recorded separately and accepted by the release owner.

## Final Decision

| Field | Value |
|---|---|
| GO/NO-GO | `GO` / `NO-GO` |
| Decision time | `YYYY-MM-DD HH:mm TZ` |
| Release owner sign-off | `@owner` |
| Reviewer sign-off | `@reviewer` |
| Evidence bundle | `<link-to-release-evidence>` |

Use `GO` only when every required release gate is `PASS`, every release blocker is closed, and residual risks are explicitly accepted.

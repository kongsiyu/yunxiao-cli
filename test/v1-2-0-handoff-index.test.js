import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

describe('v1.2.0 handoff index', () => {
  test('covers phase map, first batch, later order, review waves, release gate, and deferred scope', () => {
    const index = read('_bmad-output/implementation-artifacts/v1-2-0-handoff-index.md');

    for (const required of [
      'P0',
      'P1',
      'P2',
      'P3',
      'P4',
      'P5',
      '13.1',
      '11.1',
      '12.3',
      '12.1',
      '13.2',
      '11.2',
      '12.2',
      '11.3',
      '13.3',
      '12.4',
      'Wave A',
      'Wave B',
      'Wave C',
      'Release Gate Before `12.4`',
      'Codeup MR merge/comment/approval/diff/commits/discussions',
      'Full-CLI localization beyond the scoped high-frequency commands',
      'Shell completion',
      'Interactive TUI mode',
    ]) {
      assert.match(index, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  });

  test('keeps issue completion separate from open PR state and highlights stale blockers', () => {
    const index = read('_bmad-output/implementation-artifacts/v1-2-0-handoff-index.md');

    for (const required of [
      'PR `#83` is `OPEN (not merged)`',
      'PR `#84` is `OPEN (not merged)`',
      'PR `#85` is `OPEN (not merged)`',
      'PR `#86` is `OPEN (not merged)`',
      'PR `#88` is `OPEN (not merged)`',
      'PR `#89` is `OPEN (not merged)`',
      'PR `#90` is `OPEN (not merged)`',
      'blocked_status_stale',
      'HTH-212',
      'HTH-213',
      'ci_status=no_checks_reported',
      'ci_status=all_checks_passed',
    ]) {
      assert.match(index, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  });
});

describe('v1.2.0 execution tracker', () => {
  test('records issue, PR, merge, CI, and dispatch interpretation fields', () => {
    const tracker = read('_bmad-output/implementation-artifacts/v1-2-0-execution-tracker.yaml');

    for (const required of [
      'issue_done_pr_open',
      'blocked_status_stale',
      'blocked_waiting_dependencies',
      'in_progress_no_pr_yet',
      'paperclip_issue: HTH-196',
      'paperclip_issue: HTH-209',
      'paperclip_issue: HTH-212',
      'paperclip_issue: HTH-213',
      'pr_state: OPEN',
      'merged: false',
      'merge_status: CLEAN',
      'ci_status: all_checks_passed',
      'ci_status: no_checks_reported',
      'pr_state: not_created',
      'next_handoff: Scrum Master -> Developer',
    ]) {
      assert.match(tracker, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  });

  test('captures review waves, release gate inputs, and deferred scope buckets', () => {
    const tracker = read('_bmad-output/implementation-artifacts/v1-2-0-execution-tracker.yaml');

    for (const required of [
      'wave-a-baseline-inputs',
      'wave-b-rollout-contract-handoff',
      'wave-c-release-go-no-go',
      'summary_story: 12.4',
      'npm test',
      'critical CLI smoke evidence',
      'npm pack --dry-run',
      'Codeup MR merge',
      'Codeup MR comment',
      'Codeup MR approval',
      'Codeup MR diff',
      'Codeup MR commits',
      'Codeup MR discussions',
      'Full CLI localization beyond the high-frequency scope',
      'Interactive TUI mode',
    ]) {
      assert.match(tracker, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  });
});

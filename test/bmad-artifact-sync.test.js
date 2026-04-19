import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

describe('BMAD story artifact sync guardrails', () => {
  test('canonical sync rules define done closeout, foundation-only, and conflict authority', () => {
    const rules = read('_bmad-output/implementation-artifacts/story-artifact-sync-rules.md');

    for (const required of [
      'story 文件头 `Status`',
      'Tasks/Subtasks',
      'Dev Agent Record',
      'File List',
      '`sprint-status.yaml`',
      '`foundation-only`',
      'user-visible rollout',
      'release evidence',
      'merged PR',
      'final review',
      '必须回写',
    ]) {
      assert.match(rules, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  });

  test('active create-story template carries delivery scope and closeout checklist', () => {
    const template = read('.agents/skills/bmad-create-story/template.md');

    assert.match(template, /## Delivery Scope/);
    assert.match(template, /Delivery Type/);
    assert.match(template, /Foundation-only/);
    assert.match(template, /User-visible Rollout Follow-up/);
    assert.match(template, /## Artifact Sync Closeout/);
    assert.match(template, /Status/);
    assert.match(template, /Tasks\/Subtasks/);
    assert.match(template, /Dev Agent Record/);
    assert.match(template, /File List/);
    assert.match(template, /sprint-status\.yaml/);
  });

  test('single-repo story workflow requires final done sync and conflict backfill', () => {
    const workflow = read('workflow/story-dev-workflow-single-repo.md');

    assert.match(workflow, /story 文件头 `Status`、Task\/Subtask 勾选、Dev Agent Record、File List/);
    assert.match(workflow, /foundation-only/);
    assert.match(workflow, /user-visible rollout/);
    assert.match(workflow, /release evidence \/ merged PR \/ final review/);
    assert.match(workflow, /回写 story 文件/);
  });
});

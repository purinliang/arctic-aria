import assert from 'node:assert/strict';
import test from 'node:test';
import { progressVisibleOnBranch } from '../feature-visibility.ts';

test('Progress stays hidden on production and development branches pending human review',() => {
  for (const branch of ['main','hotfix/example','develop','feature/personal-tracking-cache','fix/example','unknown']) {
    assert.equal(progressVisibleOnBranch(branch),false);
  }
});

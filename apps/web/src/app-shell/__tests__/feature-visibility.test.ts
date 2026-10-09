import assert from 'node:assert/strict';
import test from 'node:test';
import { progressVisibleOnBranch } from '../feature-visibility.ts';

test('Progress is hidden on development branches without changing production visibility',() => {
  for (const branch of ['develop','feature/personal-tracking-cache','fix/example','unknown']) assert.equal(progressVisibleOnBranch(branch),false);
  for (const branch of ['main','hotfix/example']) assert.equal(progressVisibleOnBranch(branch),true);
});

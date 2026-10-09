import assert from 'node:assert/strict';
import test from 'node:test';
import { menuFocusIndex } from '../action-menu-navigation.ts';

test('menu keyboard navigation wraps through enabled items',() => {
  assert.equal(menuFocusIndex('ArrowDown',0,2),1);
  assert.equal(menuFocusIndex('ArrowDown',1,2),0);
  assert.equal(menuFocusIndex('ArrowUp',0,2),1);
  assert.equal(menuFocusIndex('ArrowUp',1,2),0);
  assert.equal(menuFocusIndex('ArrowDown',-1,2),0);
  assert.equal(menuFocusIndex('ArrowUp',-1,2),1);
});
test('menu Home/End navigate boundaries and unrelated keys remain untouched',() => {
  assert.equal(menuFocusIndex('Home',1,2),0);
  assert.equal(menuFocusIndex('End',0,2),1);
  for (const key of ['Enter','Escape','Tab','a']) assert.equal(menuFocusIndex(key,0,2),null);
  assert.equal(menuFocusIndex('ArrowDown',0,0),null);
});

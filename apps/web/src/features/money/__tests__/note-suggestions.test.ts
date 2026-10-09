import assert from 'node:assert/strict';
import test from 'node:test';
import { noteSuggestions } from '../note-suggestions.ts';

const presets = ['Groceries','Meal / Restaurant','Takeaway','Snacks'];
test('suggestions rank category-specific history and retain unused presets',() => {
  assert.deepEqual(noteSuggestions('food',presets,[
    { categoryId: 'food',note: 'Snacks',count: 3 },
    { categoryId: 'food',note: 'Market',count: 2 },
    { categoryId: 'transport',note: 'Taxi',count: 100 },
  ]),['Snacks','Market','Groceries','Meal / Restaurant','Takeaway']);
});
test('equivalent notes combine usage without duplicating presets',() => {
  assert.deepEqual(noteSuggestions('food',presets,[
    { categoryId: 'food',note: ' groceries ',count: 2 },
    { categoryId: 'food',note: 'GROCERIES',count: 3 },
    { categoryId: 'food',note: 'Snacks',count: 4 },
    { categoryId: 'food',note: ' ',count: 9 },
  ]),['Groceries','Snacks','Meal / Restaurant','Takeaway']);
});
test('frequency ties follow preset order, then deterministic custom note order',() => {
  assert.deepEqual(noteSuggestions('food',presets,[
    { categoryId: 'food',note: 'Snacks',count: 1 },
    { categoryId: 'food',note: 'Groceries',count: 1 },
    { categoryId: 'food',note: 'Zoo',count: 1 },
    { categoryId: 'food',note: 'Market',count: 1 },
  ]),['Groceries','Snacks','Market','Zoo','Meal / Restaurant','Takeaway']);
});
test('custom categories use history only and refreshed counts replace old ranking',() => {
  assert.deepEqual(noteSuggestions('custom',[],[{ categoryId: 'custom',note: ' Book ',count: 2 }]),['Book']);
  assert.deepEqual(noteSuggestions('custom',[],[]),[]);
  assert.deepEqual(noteSuggestions('food',presets,[{ categoryId: 'food',note: 'Snacks',count: 1 }])[0],'Snacks');
  assert.deepEqual(noteSuggestions('food',presets,[]),presets);
});

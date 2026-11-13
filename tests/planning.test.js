import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {addPlanningStatus, matchesPlanningFilter} from '../planning.js';

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const poles = read('../data/poles.geojson').features;
const matches = read('../data/photo-matches.json');
addPlanningStatus(poles, matches);

test('October photo matches partition the field inventory by pole ID', () => {
  const ids = new Set(poles.map(pole => pole.properties.pole_id));
  const classified = [...matches.matched, ...matches.possible];
  assert.equal(new Set(classified).size, classified.length);
  assert(classified.every(id => ids.has(id)));
  const count = filter => poles.filter(pole => matchesPlanningFilter(pole.planning, filter, false)).length;
  assert.equal(count('matched'), 95);
  assert.equal(count('possible'), 9);
  assert.equal(count('missing'), 327);
  assert.equal(count('remaining'), 336);
});

test('the CNB4 filter includes 81 poles and exposes near-edge locations', () => {
  assert.equal(poles.filter(pole => matchesPlanningFilter(pole.planning, 'all', true)).length, 81);
  const byId = id => poles.find(pole => pole.properties.pole_id === id).planning;
  assert.equal(byId('1015').inHeliport, true);
  assert.equal(byId('2855').inHeliport, false);
  assert.equal(byId('1015').nearHeliportBoundary, true);
  assert.equal(byId('2855').nearHeliportBoundary, true);
});

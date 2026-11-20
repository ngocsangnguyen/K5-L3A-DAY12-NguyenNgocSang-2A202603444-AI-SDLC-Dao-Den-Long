import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Campaign} from '../src/core/campaign.js';
import {normalizeSettings,loadSettings,saveSettings} from '../src/settings.js';
const tuning=JSON.parse(readFileSync(new URL('../game.contract.json',import.meta.url))).tuning;
test('campaign advances1→2→3, resets health, sums only won nights, no double credit',()=>{
  const c=new Campaign(tuning);c.startNight();c.game.state='won';c.game.score=100;c.finish();c.finish();assert.equal(c.totalScore,100);c.next();assert.equal(c.night,2);assert.equal(c.game.player.flames,3);c.game.state='lost';c.game.score=500;c.finish();assert.equal(c.totalScore,100);assert.equal(c.next(),null);c.startNight();c.game.state='won';c.game.score=200;c.next();assert.equal(c.night,3);c.game.state='won';c.game.score=300;c.finish();assert.equal(c.totalScore,600);assert.equal(c.next(),null);
});
test('settings normalize and persist; malformed or unavailable storage falls back',()=>{
  const store=new Map(),storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
  saveSettings(storage,{volume:.6,sensitivity:1.7,enabled:true});assert.deepEqual(loadSettings(storage),{volume:.6,sensitivity:1.7,enabled:true});
  assert.deepEqual(normalizeSettings({volume:2,sensitivity:-1}),{volume:1,sensitivity:.2,enabled:false});storage.setItem('dao-den-long.settings','bad');assert.equal(loadSettings(storage).volume,.35);assert.equal(loadSettings({getItem(){throw Error();}}).volume,.35);
});

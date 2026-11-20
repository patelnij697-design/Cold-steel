import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_WEAPONS,
  NEW_WEAPONS,
  EXPANSION_WEAPONS,
  ALL_COMBAT_WEAPONS,
  REPAIR_TOOL_WEAPON,
  RIOT_SHIELD_GEAR,
  BR_PEACE_SECONDS,
  createBRState,
  ejectFromC17,
  stepC17Flight,
  stepParachuteDescent,
  createWeaponCrates,
  lootWeaponCrate,
  stepSafeZone
} from '../src/game/arsenal_and_br.js';

test('new weapons and expansion arsenal are defined with valid combat stats', () => {
  assert.equal(NEW_WEAPONS.length, 4);
  assert.equal(ALL_WEAPONS.length, 15);
  assert.equal(EXPANSION_WEAPONS.length, 6);
  assert.equal(ALL_COMBAT_WEAPONS.length, 21);
  for (const w of [...NEW_WEAPONS, ...EXPANSION_WEAPONS]) {
    assert.ok(w.n.length > 0);
    assert.ok(w.dmg > 0);
    assert.ok(w.rate > 0);
    assert.ok(w.mag > 0);
    assert.ok(w.rel > 0);
  }
  const gl = EXPANSION_WEAPONS.find(w => w.n === 'M79 Thumper');
  assert.equal(gl?.explosive, true);
  assert.ok((gl?.splash || 0) >= 5);
});

test('repair wrench, riot shield gear, and 30s BR peace timer are configured properly', () => {
  assert.equal(BR_PEACE_SECONDS, 30);
  assert.equal(createBRState().peaceTimer, 30);
  assert.equal(REPAIR_TOOL_WEAPON.n, 'Repair Wrench');
  assert.equal(REPAIR_TOOL_WEAPON.type, 'repair');
  assert.equal(REPAIR_TOOL_WEAPON.primaryActionLabel, 'REPAIR');
  assert.ok(REPAIR_TOOL_WEAPON.heal > 0);

  assert.equal(RIOT_SHIELD_GEAR.n, 'Riot Shield');
  assert.equal(RIOT_SHIELD_GEAR.type, 'shield');
  assert.equal(RIOT_SHIELD_GEAR.primaryActionLabel, 'BASH');
  assert.equal(RIOT_SHIELD_GEAR.blockReduction, 0.82);
  assert.equal(RIOT_SHIELD_GEAR.braceReduction, 0.9);
});

test('C-17 drop phase starts in plane, ejects on command, and deploys parachute', () => {
  const br = createBRState();
  assert.equal(br.phase, 'plane');
  assert.equal(ejectFromC17(br), true);
  assert.equal(br.phase, 'freefall');
  assert.equal(ejectFromC17(br), false);

  const highStep = stepParachuteDescent(br, { y: 60 }, -10, 0.5);
  assert.equal(br.parachuteOpen, false);
  assert.equal(highStep.landed, false);

  const lowStep = stepParachuteDescent(br, { y: 30 }, -20, 0.5);
  assert.equal(br.parachuteOpen, true);
  assert.equal(lowStep.landed, false);

  const landStep = stepParachuteDescent(br, { y: 1 }, -7, 0.5);
  assert.equal(landStep.landed, true);
  assert.equal(landStep.y, 0);
  assert.equal(br.phase, 'ground');
});

test('C-17 auto-ejects when flying past map bounds', () => {
  const br = createBRState();
  br.planePos.x = 219;
  br.planePos.z = 219;
  const out = stepC17Flight(br, 1.0);
  assert.equal(out, true);
  assert.equal(br.phase, 'freefall');
});

test('weapon crates scatter across map and equip into empty loadout slots', () => {
  const crates = createWeaponCrates(24, () => 0.5);
  assert.equal(crates.length, 24);
  const loadout = [-1, -1];
  const firstCrate = crates[0];
  const res1 = lootWeaponCrate(crates, { x: firstCrate.x, z: firstCrate.z }, loadout);
  assert.equal(res1.looted, true);
  assert.equal(firstCrate.opened, true);
  assert.equal(loadout[0], firstCrate.weaponIndex);
  assert.equal(loadout[1], -1);

  const secondCrate = crates[1];
  const res2 = lootWeaponCrate(crates, { x: secondCrate.x, z: secondCrate.z }, loadout);
  assert.equal(res2.looted, true);
  assert.equal(loadout[1], secondCrate.weaponIndex);
});

test('safe zone shrinks down to minimum radius', () => {
  const br = createBRState();
  const r1 = stepSafeZone(br, 10);
  assert.ok(r1 < 240);
  br.zoneRadius = 26;
  const r2 = stepSafeZone(br, 10);
  assert.equal(r2, 25);
});

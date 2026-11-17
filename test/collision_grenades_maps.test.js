import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MAPS,
  MAP_IDS,
  isValidMapId,
  tallyVotes,
  resolveWinningVote,
  obbClosestPointXZ,
  pointInRotatedOBB,
  resolveObstacleCollision,
  resolveWalkableSurfaceHeight,
  resolveAllEntityCollisions,
  isSmokeOccludingSegment,
  GRENADE_SPECS,
  stepGrenade,
  computeFragBlast
} from '../src/game/collision_and_physics.js';

test('map registry and vote resolution handle Ironvale and Frostpoint cleanly', () => {
  assert.deepEqual(MAP_IDS, ['ironvale', 'frostport']);
  assert.equal(isValidMapId('ironvale'), true);
  assert.equal(isValidMapId('frostport'), true);
  assert.equal(isValidMapId('unknown_map'), false);
  assert.equal(MAPS.frostport.defaultWeather, 'snow');

  const votes = new Map([
    ['sock1', 'frostport'],
    ['sock2', 'ironvale'],
    ['sock3', 'frostport'],
    ['sock4', 'invalid']
  ]);
  const counts = tallyVotes(votes, MAP_IDS);
  assert.deepEqual(counts, { ironvale: 1, frostport: 2 });
  assert.equal(resolveWinningVote(votes, MAP_IDS, 'ironvale'), 'frostport');
  assert.equal(resolveWinningVote(new Map(), MAP_IDS, 'ironvale'), 'ironvale');
});

test('rotated OBB closest point, containment, and push prevent noclip through angled containers and buildings', () => {
  const ob = { x: 20, z: -15, hw: 4.5, hd: 1.6, minY: 0, h: 3.2, rot: Math.PI / 4 };
  assert.equal(pointInRotatedOBB(20, 1.5, -15, ob, 0, 0), true);
  assert.equal(pointInRotatedOBB(20, 4.5, -15, ob, 0, 0), false);

  const pos = { x: 20.4, y: 0, z: -15.2 };
  const vel = { x: 5, z: -3 };
  resolveObstacleCollision(pos, vel, [ob], 0.55, 1.75, 0.45, 280);
  const cp = obbClosestPointXZ(pos.x, pos.z, ob);
  const dist = Math.hypot(pos.x - cp.x, pos.z - cp.z);
  assert.equal(cp.inside, false);
  assert.ok(dist >= 0.54, `Expected pushed outside OBB by >= 0.54m, got ${dist}`);
});

test('vertical [minY, h] clearance allows walking underneath elevated bridge decks and stepping onto ramps', () => {
  const bridgeArch = { x: 0, z: 0, hw: 8, hd: 6, minY: 3.4, h: 4.6, rot: 0 };
  const underPos = { x: 0, y: 0, z: 0 };
  resolveObstacleCollision(underPos, null, [bridgeArch], 0.55, 1.75, 0.45, 280);
  assert.equal(underPos.x, 0);
  assert.equal(underPos.z, 0);

  const walkables = [
    { x: 0, z: 10, hw: 6, hd: 2.5, y0: 0, y1: 4, rampAxis: 'x', rot: 0 },
    { x: 10, z: 10, hw: 4, hd: 4, y: 4, rot: 0 }
  ];
  const midRampY = resolveWalkableSurfaceHeight(0, 10, 1.8, 0, walkables, 1.6);
  assert.ok(Math.abs(midRampY - 2) < 0.01, `Expected mid-ramp height ~2, got ${midRampY}`);
  const deckY = resolveWalkableSurfaceHeight(10, 10, 3.6, 0, walkables, 1.6);
  assert.equal(deckY, 4);
  const tooHighDeckY = resolveWalkableSurfaceHeight(10, 10, 0.5, 0, walkables, 1.6);
  assert.equal(tooHighDeckY, 0);
});

test('entity-to-entity collision separates infantry and vehicles while excluding driver-vehicle pairs', () => {
  const player = { id: 'p1', x: 10, y: 0, z: 10, radius: 0.55, height: 1.8, mass: 1, vehId: 'v1', alive: true, vel: { x: 0, z: 0 } };
  const ownTank = { id: 'v1', x: 10.1, y: 0, z: 10.1, radius: 2.6, height: 2.4, mass: 8, driverId: 'p1', isVehicle: true, alive: true, vel: { x: 0, z: 0 } };
  const enemyTank = { id: 'v2', x: 12.2, y: 0, z: 10.1, radius: 2.6, height: 2.4, mass: 8, isVehicle: true, alive: true, vel: { x: -4, z: 0 } };
  const bot = { id: 'b1', x: 12.1, y: 0, z: 10.1, radius: 0.55, height: 1.8, mass: 1, alive: true, vel: { x: 0, z: 0 } };

  const count = resolveAllEntityCollisions([player, ownTank, enemyTank, bot], 3);
  assert.ok(count > 0);
  // Player and ownTank must not fight each other directly
  const tankDist = Math.hypot(ownTank.x - enemyTank.x, ownTank.z - enemyTank.z);
  assert.ok(tankDist >= 5.15, `Expected tanks separated >= 5.15m, got ${tankDist}`);
  const botDist = Math.hypot(bot.x - enemyTank.x, bot.z - enemyTank.z);
  assert.ok(botDist >= 3.05, `Expected bot pushed outside tank >= 3.05m, got ${botDist}`);
});

test('grenades bounce off walls/ground, detonate with distance falloff, and smoke clouds block LOS', () => {
  const wall = { x: 5, z: 0, hw: 0.5, hd: 4, minY: 0, h: 4, rot: 0 };
  const g = { type: 'frag', x: 4.1, y: 1.5, z: 0, vx: 12, vy: 2, vz: 0, fuse: 0.5, detonated: false };
  const step1 = stepGrenade(g, 0.08, { obstacles: [wall], walkables: [], getTerrainHeight: () => 0 });
  assert.equal(step1.bounced, true);
  assert.ok(g.vx < 0, `Expected grenade velocity to reflect off wall, got vx=${g.vx}`);

  let hitDetonated = false;
  for (let i = 0; i < 30; i++) {
    const res = stepGrenade(g, 0.05, { obstacles: [wall], walkables: [], getTerrainHeight: () => 0 });
    if (res.detonated) {
      hitDetonated = true;
      break;
    }
  }
  assert.equal(hitDetonated, true);

  const blastHits = computeFragBlast(
    { x: 0, y: 0.5, z: 0 },
    [
      { id: 'closeInf', x: 2, y: 0, z: 0, alive: true, isVehicle: false },
      { id: 'tank', x: 4, y: 0, z: 0, alive: true, isVehicle: true },
      { id: 'farInf', x: 25, y: 0, z: 0, alive: true, isVehicle: false }
    ],
    GRENADE_SPECS.frag
  );
  assert.equal(blastHits.length, 2);
  assert.ok(blastHits[0].damage > 70);
  assert.ok(blastHits[1].damage < blastHits[0].damage);

  const smokes = [{ x: 10, y: 1.5, z: 0, radius: 7.4, life: 10 }];
  assert.equal(isSmokeOccludingSegment(0, 1.5, 0, 20, 1.5, 0, smokes), true);
  assert.equal(isSmokeOccludingSegment(0, 1.5, 15, 20, 1.5, 15, smokes), false);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getWeaponBulletSpeed,
  computeBulletStreakLength,
  computeTouchLookDelta,
  rollWhiteSpawnFaction,
  resolveCrateSpawn,
  stepBRZoneAndStorm,
  nextMobileAimState,
  isTeamFactionMode,
  getSoloNetworkTeam,
  shouldEntityRespawn,
  isEnemyBaseProtectionActive,
  findRepairTargetVehicle,
  applyVehicleRepair,
  applyRiotShieldReduction,
  selectBaseDefenseTarget
} from '../src/game/combat_logic.js';

test('bullet speeds scale realistically by weapon class', () => {
  const sniper = getWeaponBulletSpeed({ type: 'sniper', dmg: 125 });
  const rifle = getWeaponBulletSpeed({ type: 'rifle', dmg: 28 });
  const smg = getWeaponBulletSpeed({ type: 'smg', dmg: 16 });
  const shotgun = getWeaponBulletSpeed({ type: 'shotgun', dmg: 16 });
  assert.equal(sniper, 540);
  assert.equal(rifle, 430);
  assert.equal(smg, 330);
  assert.equal(shotgun, 290);
  assert.ok(sniper > rifle && rifle > smg && smg > shotgun);
  assert.ok(computeBulletStreakLength(sniper) >= computeBulletStreakLength(shotgun));
});

test('touch fire-drag computes look delta and respects toggled scope zoom damping', () => {
  const hip = computeTouchLookDelta(50, -25, { sensitivity: 1, isScoped: false, zoom: 1 });
  const scopedSniper = computeTouchLookDelta(50, -25, { sensitivity: 1, isScoped: true, zoom: 7.0 });
  assert.ok(hip.dYaw < 0);
  assert.ok(hip.dPitch > 0);
  assert.ok(Math.abs(scopedSniper.dYaw) < Math.abs(hip.dYaw));
  assert.equal(scopedSniper.clampFootPitch(3), 1.5);
  assert.equal(scopedSniper.clampFootPitch(-3), -1.5);
});

test('mobile aim button toggles on foot and holds in vehicles', () => {
  let rm = 0;
  rm = nextMobileAimState(rm, { inVehicle: false, eventType: 'down' });
  assert.equal(rm, 1);
  rm = nextMobileAimState(rm, { inVehicle: false, eventType: 'up' });
  assert.equal(rm, 1);
  rm = nextMobileAimState(rm, { inVehicle: false, eventType: 'down' });
  assert.equal(rm, 0);

  let vehRm = 0;
  vehRm = nextMobileAimState(vehRm, { inVehicle: true, eventType: 'down' });
  assert.equal(vehRm, 1);
  vehRm = nextMobileAimState(vehRm, { inVehicle: true, eventType: 'up' });
  assert.equal(vehRm, 0);
});

test('USA vs USSR team factions are disabled in FFA and Battle Royale', () => {
  assert.equal(isTeamFactionMode('tdm'), true);
  assert.equal(isTeamFactionMode('ctf'), true);
  assert.equal(isTeamFactionMode('ffa'), false);
  assert.equal(isTeamFactionMode('br'), false);

  const roster = ['p-charlie', 'p-alpha', 'p-bravo'];
  const tAlpha = getSoloNetworkTeam(roster, 'p-alpha');
  const tBravo = getSoloNetworkTeam(roster, 'p-bravo');
  const tCharlie = getSoloNetworkTeam(roster, 'p-charlie');
  assert.equal(new Set([tAlpha, tBravo, tCharlie]).size, 3);
  assert.ok(tAlpha >= 200);
});

test('Battle Royale eliminated infantry stay eliminated instead of respawning', () => {
  assert.equal(shouldEntityRespawn('inf', 'br', true), false);
  assert.equal(shouldEntityRespawn('inf', 'tdm', false), true);
  assert.equal(shouldEntityRespawn('inf', 'ffa', false), true);
});

test('enemy base protection is disabled in FFA and Battle Royale', () => {
  assert.equal(isEnemyBaseProtectionActive('ffa', false), false);
  assert.equal(isEnemyBaseProtectionActive('br', true), false);
  assert.equal(isEnemyBaseProtectionActive('tdm', false), true);
  assert.equal(isEnemyBaseProtectionActive('ctf', false), true);
});

test('white vehicle spawns roll 50/50 between USSR and USA', () => {
  assert.equal(rollWhiteSpawnFaction(() => 0.2), 'ussr');
  assert.equal(rollWhiteSpawnFaction(() => 0.75), 'usa');
});

test('BR crates spawn on terrain height and avoid blocked obstacles', () => {
  let calls = 0;
  const rand = () => {
    calls++;
    return 0.5;
  };
  const crateGround = resolveCrateSpawn(10, 24, rand, (x, z) => 8.5 + (x + z) * 0.01, () => false);
  assert.equal(crateGround.isAirdrop, false);
  assert.equal(crateGround.startY, crateGround.groundY);

  const crateAir = resolveCrateSpawn(0, 24, rand, () => 12.25, () => false);
  assert.equal(crateAir.isAirdrop, true);
  assert.equal(crateAir.groundY, 12.25);
  assert.ok(crateAir.startY > crateAir.groundY + 70);
  assert.ok(calls > 0);
});

test('BR safe zone holds during peace timer then shrinks and applies storm damage outside', () => {
  const br = { active: true, peaceTimer: 1, zoneRadius: 240, stormTick: 0 };
  const r1 = stepBRZoneAndStorm(br, 0.5, 250, true);
  assert.equal(r1.zoneRadius, 240);
  assert.equal(r1.stormDamage, 0);

  stepBRZoneAndStorm(br, 0.5, 250, true); // peace ends
  const r2 = stepBRZoneAndStorm(br, 0.8, 250, true);
  assert.ok(r2.zoneRadius < 240);
  assert.equal(r2.stormDamage, 6);
});

test('repair tool targets friendly or neutral vehicles, restores HP and ERA, and blocks enemy vehicles', () => {
  const friendlyTank = {
    type: 'tank', tm: 0, dead: false, hp: 1800, mhp: 2250,
    armorType: 'era', reactiveArmor: 2, maxEra: 4,
    p: { x: 0, y: 0, z: -5 }
  };
  const enemyTank = {
    type: 'tank', tm: 1, dead: false, hp: 1200, mhp: 2400,
    p: { x: 0, y: 0, z: -4 }
  };

  const blocked = findRepairTargetVehicle({ x: 0, y: 1.7, z: 0 }, { x: 0, y: 0, z: -1 }, [enemyTank], 0, 8.5);
  assert.equal(blocked.target, null);
  assert.equal(blocked.enemyBlocked, enemyTank);

  const found = findRepairTargetVehicle({ x: 0, y: 1.7, z: 0 }, { x: 0, y: 0, z: -1 }, [enemyTank, friendlyTank], 0, 8.5);
  assert.equal(found.target, friendlyTank);

  const r1 = applyVehicleRepair(friendlyTank, 300);
  assert.equal(r1.repaired, true);
  assert.equal(r1.healed, 300);
  assert.equal(friendlyTank.hp, 2100);
  assert.equal(r1.eraRestored, 0);

  const r2 = applyVehicleRepair(friendlyTank, 300);
  assert.equal(r2.repaired, true);
  assert.equal(friendlyTank.hp, 2250);
  assert.equal(r2.eraRestored, 1);
  assert.equal(friendlyTank.reactiveArmor, 3);
});

test('riot shield reduces frontal damage at hip and braced stances while leaving rear exposed', () => {
  const hipFront = applyRiotShieldReduction({
    damage: 100,
    isShieldEquipped: true,
    isBraced: false,
    attackerPos: { x: 0, z: -10 },
    targetPos: { x: 0, z: 0 },
    targetYaw: 0
  });
  assert.equal(hipFront.blocked, true);
  assert.equal(hipFront.damage, 18);

  const bracedFront = applyRiotShieldReduction({
    damage: 100,
    isShieldEquipped: true,
    isBraced: true,
    attackerPos: { x: 0, z: -10 },
    targetPos: { x: 0, z: 0 },
    targetYaw: 0
  });
  assert.equal(bracedFront.blocked, true);
  assert.equal(bracedFront.damage, 10);

  const rearHit = applyRiotShieldReduction({
    damage: 100,
    isShieldEquipped: true,
    isBraced: true,
    attackerPos: { x: 0, z: 10 },
    targetPos: { x: 0, z: 0 },
    targetYaw: 0
  });
  assert.equal(rearHit.blocked, false);
  assert.equal(rearHit.damage, 100);
});

test('base C-RAM and ground missile defenses engage closest enemy in team modes and stay off in FFA/BR', () => {
  const friendly = { id: 'f', tm: 0, dead: false, hp: 100, p: { x: -220, y: 1, z: -220 } };
  const enemy = { id: 'e', tm: 1, dead: false, hp: 100, p: { x: -200, y: 1, z: -200 } };

  const hit = selectBaseDefenseTarget({
    turretPos: { x: -235, y: 3, z: -235 },
    baseTeam: 0,
    candidates: [friendly, enemy],
    maxRange: 95,
    mode: 'tdm',
    brActive: false
  });
  assert.equal(hit?.target, enemy);

  const ffaDisabled = selectBaseDefenseTarget({
    turretPos: { x: -235, y: 3, z: -235 },
    baseTeam: 0,
    candidates: [friendly, enemy],
    maxRange: 95,
    mode: 'ffa',
    brActive: false
  });
  assert.equal(ffaDisabled, null);
});


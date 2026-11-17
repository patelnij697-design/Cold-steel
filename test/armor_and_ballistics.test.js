import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VEHICLE_VARIANTS,
  CALIBER_PROFILES,
  getVehicleVariantSpec,
  determineHitAspect,
  computeArmorDamage,
  getArmorStateLabel
} from '../src/game/armor_and_ballistics.js';

test('USA and USSR vehicle variants have distinct armor, weapon caliber, and mobility specs', () => {
  for (const type of ['tank', 'car', 'heli', 'sam']) {
    const usa = getVehicleVariantSpec(type, 'usa');
    const ussr = getVehicleVariantSpec(type, 'ussr');
    assert.ok(usa && ussr, `Missing specs for ${type}`);
    assert.notEqual(usa.name, ussr.name);
    assert.notEqual(usa.hp, ussr.hp);
    assert.notEqual(usa.armorType, ussr.armorType);
    assert.notEqual(usa.thicknessMm.front, ussr.thicknessMm.front);
  }

  const abrams = VEHICLE_VARIANTS.tank.usa;
  const t80 = VEHICLE_VARIANTS.tank.ussr;
  assert.equal(abrams.armorType, 'composite');
  assert.equal(abrams.primaryCaliber, '120mm');
  assert.equal(t80.armorType, 'era');
  assert.equal(t80.reactiveArmor, 4);
  assert.equal(t80.primaryCaliber, '125mm');
  assert.ok(t80.accel > abrams.accel);

  assert.equal(VEHICLE_VARIANTS.car.usa.primaryCaliber, '25mm');
  assert.equal(VEHICLE_VARIANTS.car.ussr.primaryCaliber, '14.5mm');
  assert.equal(VEHICLE_VARIANTS.heli.usa.primaryCaliber, '30mm');
  assert.equal(VEHICLE_VARIANTS.heli.ussr.primaryCaliber, '12.7mm');
  assert.equal(VEHICLE_VARIANTS.sam.usa.secondaryCaliber, '20mm');
  assert.equal(VEHICLE_VARIANTS.sam.ussr.secondaryCaliber, '23mm');
});

test('hit aspect resolves front, side, rear, and top relative to vehicle yaw', () => {
  const pos = { x: 0, y: 0, z: 0 };
  const yaw = 0; // forward is +Z
  assert.equal(determineHitAspect(pos, yaw, { x: 0, y: 1, z: 25 }), 'front');
  assert.equal(determineHitAspect(pos, yaw, { x: 0, y: 1, z: -25 }), 'rear');
  assert.equal(determineHitAspect(pos, yaw, { x: 25, y: 1, z: 0 }), 'side');
  assert.equal(determineHitAspect(pos, yaw, { x: 0, y: 30, z: 2 }), 'top');
});

test('larger cannon calibers penetrate tank armor significantly better than smaller calibers', () => {
  const tankPos = { x: 0, y: 0, z: 0 };
  const frontSource = { x: 0, y: 1.5, z: 30 };
  const rearSource = { x: 0, y: 1.5, z: -30 };

  const dmg125Front = computeArmorDamage({
    targetType: 'tank', faction: 'usa', targetPos: tankPos, targetYaw: 0,
    sourcePos: frontSource, baseDamage: CALIBER_PROFILES['125mm'].baseDamage, caliber: '125mm'
  });
  const dmg120Front = computeArmorDamage({
    targetType: 'tank', faction: 'usa', targetPos: tankPos, targetYaw: 0,
    sourcePos: frontSource, baseDamage: CALIBER_PROFILES['120mm'].baseDamage, caliber: '120mm'
  });
  const dmg25Front = computeArmorDamage({
    targetType: 'tank', faction: 'usa', targetPos: tankPos, targetYaw: 0,
    sourcePos: frontSource, baseDamage: 36, caliber: '25mm'
  });
  const dmg25Rear = computeArmorDamage({
    targetType: 'tank', faction: 'usa', targetPos: tankPos, targetYaw: 0,
    sourcePos: rearSource, baseDamage: 36, caliber: '25mm'
  });
  const dmgRifleFront = computeArmorDamage({
    targetType: 'tank', faction: 'usa', targetPos: tankPos, targetYaw: 0,
    sourcePos: frontSource, baseDamage: 28, caliber: 'rifle'
  });

  assert.ok(dmg125Front.finalDamage > dmg120Front.finalDamage, '125mm cannon should out-damage 120mm against frontal composite armor');
  assert.equal(dmg125Front.outcome, 'penetrated');
  assert.equal(dmgRifleFront.outcome, 'ricochet');
  assert.ok(dmgRifleFront.finalDamage <= 2);
  assert.equal(dmg25Front.outcome, 'ricochet');
  assert.ok(dmg25Rear.finalDamage > dmg25Front.finalDamage * 6, '25mm autocannon should deal heavy flank damage to rear tank armor');
});

test('T-80 Kontakt-5 reactive armor absorbs HEAT/cannon hits on front/side and reverts to base armor once depleted', () => {
  const tankPos = { x: 0, y: 0, z: 0 };
  const frontSource = { x: 0, y: 1.5, z: 30 };
  const rearSource = { x: 0, y: 1.5, z: -30 };

  const eraActive = computeArmorDamage({
    targetType: 'tank', faction: 'ussr', targetPos: tankPos, targetYaw: 0,
    sourcePos: frontSource, reactiveArmor: 4,
    baseDamage: 460, caliber: 'at'
  });
  assert.equal(eraActive.eraTriggered, true);
  assert.equal(eraActive.eraRemaining, 3);
  assert.equal(eraActive.armorType, 'era');
  assert.equal(eraActive.outcome, 'era_absorbed');

  const baseExposed = computeArmorDamage({
    targetType: 'tank', faction: 'ussr', targetPos: tankPos, targetYaw: 0,
    sourcePos: frontSource, reactiveArmor: 0,
    baseDamage: 460, caliber: 'at'
  });
  assert.equal(baseExposed.eraTriggered, false);
  assert.equal(baseExposed.armorType, 'base');
  assert.ok(baseExposed.finalDamage > eraActive.finalDamage * 2, 'Depleted base armor takes far more HEAT damage than active ERA');

  // Rear shot bypasses front/side ERA entirely
  const rearShot = computeArmorDamage({
    targetType: 'tank', faction: 'ussr', targetPos: tankPos, targetYaw: 0,
    sourcePos: rearSource, reactiveArmor: 4,
    baseDamage: 460, caliber: 'at'
  });
  assert.equal(rearShot.eraTriggered, false);
  assert.equal(rearShot.eraRemaining, 4);
  assert.equal(rearShot.outcome, 'overmatch');

  // Tandem ATGM bypasses most ERA protection compared to single-stage AT-4 HEAT
  const tandemVsEra = computeArmorDamage({
    targetType: 'tank', faction: 'ussr', targetPos: tankPos, targetYaw: 0,
    sourcePos: frontSource, reactiveArmor: 4,
    baseDamage: 460, caliber: 'agm'
  });
  assert.ok(tandemVsEra.finalDamage > eraActive.finalDamage * 1.8);
});

test('getArmorStateLabel formats ERA charges and base/composite states clearly', () => {
  assert.equal(getArmorStateLabel({ type: 'tank', faction: 'ussr', reactiveArmor: 3 }), 'ERA 3/4');
  assert.equal(getArmorStateLabel({ type: 'tank', faction: 'ussr', reactiveArmor: 0 }), 'BASE ARMOR');
  assert.equal(getArmorStateLabel({ type: 'tank', faction: 'usa' }), 'CHOBHAM COMP');
});

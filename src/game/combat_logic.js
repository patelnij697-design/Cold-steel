export function getWeaponBulletSpeed(weapon) {
  if (!weapon) return 380;
  if (Number.isFinite(weapon.spd)) return weapon.spd;
  if (weapon.type === 'sniper') return weapon.dmg >= 100 ? 540 : 480;
  if (weapon.type === 'rifle') return 430;
  if (weapon.type === 'lmg') return 410;
  if (weapon.type === 'smg') return 330;
  if (weapon.type === 'shotgun') return 290;
  if (weapon.type === 'pistol') return weapon.dmg >= 55 ? 350 : 300;
  return 380;
}

export function computeBulletStreakLength(speed) {
  return Math.max(1.8, Math.min(8.5, speed * 0.02));
}

export function computeTouchLookDelta(dx, dy, {
  sensitivity = 1,
  inVehicle = false,
  vehicleType = null,
  isScoped = false,
  zoom = 1
} = {}) {
  const zoomScale = !inVehicle && isScoped && zoom > 1.5
    ? 1 / Math.min(2.2, Math.sqrt(zoom * 0.7))
    : 1;
  const sens = 0.006 * sensitivity * zoomScale;
  return {
    dYaw: -dx * sens,
    dPitch: -dy * sens,
    clampHeliAimYaw: (ay) => (vehicleType === 'heli' ? Math.max(-1.4, Math.min(1.4, ay)) : ay),
    clampVehiclePitch: (ap) => Math.max(-0.55, Math.min(0.65, ap)),
    clampFootPitch: (pit) => Math.max(-1.5, Math.min(1.5, pit))
  };
}

export function rollWhiteSpawnFaction(randFn = Math.random) {
  return randFn() < 0.5 ? 'ussr' : 'usa';
}

export function resolveCrateSpawn(index, count, randFn, getTerrainHeightFn, isBlockedFn) {
  let x = 0;
  let z = 0;
  for (let attempt = 0; attempt < 15; attempt++) {
    const angle = (index / count) * Math.PI * 2 + (randFn() - 0.5) * 0.35;
    const dist = 28 + randFn() * 175;
    x = Math.cos(angle) * dist;
    z = Math.sin(angle) * dist;
    if (!isBlockedFn || !isBlockedFn(x, z)) break;
  }
  const groundY = getTerrainHeightFn(x, z);
  const isAirdrop = index < 8;
  const startY = isAirdrop ? groundY + 75 + randFn() * 45 : groundY;
  return { x, z, groundY, startY, isAirdrop };
}

export function stepBRZoneAndStorm(brState, dt, playerDistFromCenter, isGroundedAlive) {
  if (!brState || !brState.active) return { stormDamage: 0, zoneRadius: brState?.zoneRadius ?? 0 };
  if (brState.peaceTimer > 0) {
    brState.peaceTimer = Math.max(0, brState.peaceTimer - dt);
    return { stormDamage: 0, zoneRadius: brState.zoneRadius };
  }
  brState.zoneRadius = Math.max(25, brState.zoneRadius - 1.6 * dt);
  brState.stormTick = (brState.stormTick || 0) + dt;
  let stormDamage = 0;
  if (brState.stormTick >= 0.75) {
    brState.stormTick = 0;
    if (isGroundedAlive && playerDistFromCenter > brState.zoneRadius) {
      stormDamage = 6;
    }
  }
  return { stormDamage, zoneRadius: brState.zoneRadius };
}

export function nextMobileAimState(currentRm, { inVehicle = false, eventType = 'down' } = {}) {
  if (inVehicle) return eventType === 'down' ? 1 : 0;
  if (eventType === 'down') return currentRm ? 0 : 1;
  return currentRm ? 1 : 0;
}

export function isTeamFactionMode(mode) {
  return mode !== 'ffa' && mode !== 'br';
}

export function getSoloNetworkTeam(rosterIds, playerId) {
  if (!Array.isArray(rosterIds) || !rosterIds.length || !playerId) return 0;
  const sorted = [...rosterIds].sort();
  const idx = sorted.indexOf(playerId);
  return idx >= 0 ? 200 + idx : 0;
}

export function shouldEntityRespawn(entityType, mode, brActive = false) {
  if ((mode === 'br' || brActive) && entityType === 'inf') return false;
  return true;
}

export function isEnemyBaseProtectionActive(mode, brActive = false) {
  if (mode === 'ffa' || mode === 'br' || brActive) return false;
  return true;
}

const VEHICLE_REPAIR_TYPES = new Set(['tank', 'heli', 'car', 'sam']);

export function isFriendlyVehicleForRepair(vehicle, playerTeam) {
  if (!vehicle || vehicle.dead || vehicle.hp <= 0 || !VEHICLE_REPAIR_TYPES.has(vehicle.type)) {
    return false;
  }
  return vehicle.tm === playerTeam || vehicle.tm < 0;
}

export function findRepairTargetVehicle(origin, dir, entities, playerTeam, maxRange = 8.5) {
  if (!origin || !dir || !Array.isArray(entities)) return { target: null, enemyBlocked: null };
  const dLen = Math.hypot(dir.x || 0, dir.y || 0, dir.z || 0) || 1;
  const dx = (dir.x || 0) / dLen;
  const dy = (dir.y || 0) / dLen;
  const dz = (dir.z || 0) / dLen;

  let bestFriendly = null;
  let bestFriendlyScore = Infinity;
  let nearestEnemy = null;
  let nearestEnemyDist = Infinity;

  for (const entity of entities) {
    if (!entity || entity.dead || entity.hp <= 0 || !VEHICLE_REPAIR_TYPES.has(entity.type) || !entity.p) continue;
    const hitRadius = entity.type === 'heli' ? 3.2 : entity.type === 'tank' ? 3.0 : 2.6;
    const tx = entity.p.x - origin.x;
    const ty = (entity.p.y + (entity.type === 'heli' ? 1.5 : 1.2)) - origin.y;
    const tz = entity.p.z - origin.z;
    const dist = Math.hypot(tx, ty, tz);
    if (dist > maxRange + hitRadius) continue;

    const inv = 1 / (dist || 1);
    const dot = tx * inv * dx + ty * inv * dy + tz * inv * dz;
    if (dot < 0.45 && dist > hitRadius + 1.2) continue;

    if (isFriendlyVehicleForRepair(entity, playerTeam)) {
      const score = dist - dot * 2.5;
      if (score < bestFriendlyScore) {
        bestFriendlyScore = score;
        bestFriendly = entity;
      }
    } else if (dist < nearestEnemyDist) {
      nearestEnemyDist = dist;
      nearestEnemy = entity;
    }
  }

  return { target: bestFriendly, enemyBlocked: bestFriendly ? null : nearestEnemy };
}

export function applyVehicleRepair(vehicle, healAmount, { restoreEra = true } = {}) {
  if (!vehicle || vehicle.dead || vehicle.hp <= 0 || !Number.isFinite(healAmount) || healAmount <= 0) {
    return { repaired: false, healed: 0, eraRestored: 0, hp: vehicle?.hp ?? 0, mhp: vehicle?.mhp ?? 0, full: false };
  }
  const prevHp = vehicle.hp;
  const mhp = vehicle.mhp || prevHp;
  const hpMissing = Math.max(0, mhp - prevHp);
  const healed = Math.min(hpMissing, healAmount);
  vehicle.hp = Math.min(mhp, prevHp + healed);

  let eraRestored = 0;
  if (
    restoreEra &&
    vehicle.armorType === 'era' &&
    vehicle.hp >= mhp &&
    Number.isFinite(vehicle.maxEra) &&
    (vehicle.reactiveArmor || 0) < vehicle.maxEra
  ) {
    vehicle.reactiveArmor = (vehicle.reactiveArmor || 0) + 1;
    eraRestored = 1;
  }

  const repaired = healed > 0 || eraRestored > 0;
  const full = vehicle.hp >= mhp && (!vehicle.maxEra || (vehicle.reactiveArmor || 0) >= vehicle.maxEra);
  return { repaired, healed, eraRestored, hp: vehicle.hp, mhp, full };
}



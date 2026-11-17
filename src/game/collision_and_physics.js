export const MAPS = Object.freeze({
  ironvale: Object.freeze({
    id: 'ironvale',
    name: 'Ironvale Canyon',
    shortName: 'IRONVALE',
    subtitle: 'Alpine valley, twin airfields & river crossings',
    badge: 'ALPINE VALLEY',
    accent: '#f59e0b',
    defaultWeather: 'clear',
    bounds: 280
  }),
  frostport: Object.freeze({
    id: 'frostport',
    name: 'Frostpoint Harbor',
    shortName: 'FROSTPOINT',
    subtitle: 'Frozen fjord shipyard, twin piers & crane gantries',
    badge: 'ARCTIC FJORD',
    accent: '#38bdf8',
    defaultWeather: 'snow',
    bounds: 280
  })
});

export const MAP_IDS = Object.freeze(Object.keys(MAPS));

export function isValidMapId(mapId) {
  return typeof mapId === 'string' && Object.prototype.hasOwnProperty.call(MAPS, mapId);
}

export function tallyVotes(voteMap, validIds) {
  const counts = {};
  if (Array.isArray(validIds)) {
    for (const id of validIds) counts[id] = 0;
  }
  if (!voteMap || typeof voteMap.forEach !== 'function') return counts;
  voteMap.forEach((choice) => {
    if (typeof choice === 'string' && (!validIds || validIds.includes(choice))) {
      counts[choice] = (counts[choice] || 0) + 1;
    }
  });
  return counts;
}

export function resolveWinningVote(voteMap, validIds, fallbackChoice) {
  const counts = tallyVotes(voteMap, validIds);
  let best = fallbackChoice;
  let bestCount = -1;
  const candidates = Array.isArray(validIds) && validIds.length ? validIds : Object.keys(counts);
  for (const id of candidates) {
    const c = counts[id] || 0;
    if (c > bestCount) {
      bestCount = c;
      best = id;
    }
  }
  if (bestCount <= 0) return fallbackChoice;
  return best || fallbackChoice;
}

export function obbClosestPointXZ(px, pz, ob) {
  const cx = ob.x || 0;
  const cz = ob.z || 0;
  const hw = ob.hw || 0;
  const hd = ob.hd || 0;
  const rot = ob.rot || 0;
  const dx = px - cx;
  const dz = pz - cz;
  let lx = dx;
  let lz = dz;
  if (rot !== 0) {
    const c = Math.cos(-rot);
    const s = Math.sin(-rot);
    lx = dx * c - dz * s;
    lz = dx * s + dz * c;
  }
  const clx = Math.max(-hw, Math.min(hw, lx));
  const clz = Math.max(-hd, Math.min(hd, lz));
  let wx = clx;
  let wz = clz;
  if (rot !== 0) {
    const c = Math.cos(rot);
    const s = Math.sin(rot);
    wx = clx * c - clz * s;
    wz = clx * s + clz * c;
  }
  return {
    x: cx + wx,
    z: cz + wz,
    lx,
    lz,
    clx,
    clz,
    inside: Math.abs(lx) < hw && Math.abs(lz) < hd
  };
}

export function pointInRotatedOBB(px, py, pz, ob, padXZ = 0, padY = 0) {
  if (!ob) return false;
  const minY = (ob.minY !== undefined ? ob.minY : -2) - padY;
  const maxY = (ob.h !== undefined ? ob.h : 10) + padY;
  if (py < minY || py > maxY) return false;
  const hw = (ob.hw || 0) + padXZ;
  const hd = (ob.hd || 0) + padXZ;
  const dx = px - (ob.x || 0);
  const dz = pz - (ob.z || 0);
  const rot = ob.rot || 0;
  let lx = dx;
  let lz = dz;
  if (rot !== 0) {
    const c = Math.cos(-rot);
    const s = Math.sin(-rot);
    lx = dx * c - dz * s;
    lz = dx * s + dz * c;
  }
  return Math.abs(lx) <= hw && Math.abs(lz) <= hd;
}

export function resolveObstacleCollision(pos, vel, obstacles, radius = 0.55, height = 1.7, stepHeight = 0.48, bounds = 280) {
  if (!pos) return pos;
  const list = Array.isArray(obstacles) ? obstacles : [];
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < list.length; i++) {
      const o = list[i];
      if (!o || o.noCollide) continue;
      const minY = o.minY !== undefined ? o.minY : -2;
      const maxY = o.h !== undefined ? o.h : 10;
      if (pos.y + height <= minY + 0.04) continue;
      if (pos.y >= maxY - stepHeight) continue;

      const cp = obbClosestPointXZ(pos.x, pos.z, o);
      let dx = pos.x - cp.x;
      let dz = pos.z - cp.z;
      let d2 = dx * dx + dz * dz;

      if (d2 === 0 || cp.inside) {
        const penX = o.hw - Math.abs(cp.lx);
        const penZ = o.hd - Math.abs(cp.lz);
        let nlx = cp.lx;
        let nlz = cp.lz;
        if (penX <= penZ) {
          nlx = (cp.lx >= 0 ? 1 : -1) * (o.hw + radius);
        } else {
          nlz = (cp.lz >= 0 ? 1 : -1) * (o.hd + radius);
        }
        const rot = o.rot || 0;
        const c = rot !== 0 ? Math.cos(rot) : 1;
        const s = rot !== 0 ? Math.sin(rot) : 0;
        const wx = nlx * c - nlz * s;
        const wz = nlx * s + nlz * c;
        const pushDx = (o.x + wx) - pos.x;
        const pushDz = (o.z + wz) - pos.z;
        const pushLen = Math.hypot(pushDx, pushDz) || 1;
        pos.x = o.x + wx;
        pos.z = o.z + wz;
        if (vel) {
          const nx = pushDx / pushLen;
          const nz = pushDz / pushLen;
          const vn = vel.x * nx + vel.z * nz;
          if (vn < 0) {
            vel.x -= nx * vn;
            vel.z -= nz * vn;
          }
        }
        continue;
      }

      if (d2 < radius * radius) {
        const d = Math.sqrt(d2);
        const nx = dx / d;
        const nz = dz / d;
        const push = radius - d;
        pos.x += nx * push;
        pos.z += nz * push;
        if (vel) {
          const vn = vel.x * nx + vel.z * nz;
          if (vn < 0) {
            vel.x -= nx * vn;
            vel.z -= nz * vn;
          }
        }
      }
    }
  }
  if (bounds > 0) {
    pos.x = Math.max(-bounds, Math.min(bounds, pos.x));
    pos.z = Math.max(-bounds, Math.min(bounds, pos.z));
  }
  return pos;
}

export function resolveWalkableSurfaceHeight(x, z, currentY, terrainY, walkables, maxStepUp = 1.6) {
  let best = Number.isFinite(terrainY) ? terrainY : 0;
  if (!Array.isArray(walkables) || !walkables.length) return best;
  const footLimit = (Number.isFinite(currentY) ? currentY : best) + maxStepUp;

  for (let i = 0; i < walkables.length; i++) {
    const w = walkables[i];
    if (!w) continue;
    const dx = x - (w.x || 0);
    const dz = z - (w.z || 0);
    const rot = w.rot || 0;
    let lx = dx;
    let lz = dz;
    if (rot !== 0) {
      const c = Math.cos(-rot);
      const s = Math.sin(-rot);
      lx = dx * c - dz * s;
      lz = dx * s + dz * c;
    }
    const pad = w.pad || 0;
    if (Math.abs(lx) > (w.hw || 0) + pad || Math.abs(lz) > (w.hd || 0) + pad) continue;

    let surfY = w.y !== undefined ? w.y : best;
    if (w.rampAxis === 'x' && w.hw > 0) {
      const t = Math.max(0, Math.min(1, (lx + w.hw) / (w.hw * 2)));
      surfY = (w.y0 !== undefined ? w.y0 : surfY) + t * ((w.y1 !== undefined ? w.y1 : surfY) - (w.y0 !== undefined ? w.y0 : surfY));
    } else if (w.rampAxis === 'z' && w.hd > 0) {
      const t = Math.max(0, Math.min(1, (lz + w.hd) / (w.hd * 2)));
      surfY = (w.y0 !== undefined ? w.y0 : surfY) + t * ((w.y1 !== undefined ? w.y1 : surfY) - (w.y0 !== undefined ? w.y0 : surfY));
    }

    if (surfY <= footLimit && surfY > best) {
      best = surfY;
    }
  }
  return best;
}

export function resolveEntityPairCollision(a, b) {
  if (!a || !b || a === b) return false;
  if (a.alive === false || b.alive === false) return false;
  if (a.inPlane || b.inPlane) return false;
  if (a.driverId && a.driverId === b.id) return false;
  if (b.driverId && b.driverId === a.id) return false;
  if (a.vehId && a.vehId === b.id) return false;
  if (b.vehId && b.vehId === a.id) return false;

  const ay = a.y !== undefined ? a.y : 0;
  const by = b.y !== undefined ? b.y : 0;
  const ah = a.height !== undefined ? a.height : 1.8;
  const bh = b.height !== undefined ? b.height : 1.8;
  if (ay + ah <= by + 0.1 || by + bh <= ay + 0.1) return false;

  const ar = a.radius || 0.55;
  const br = b.radius || 0.55;
  const minDist = ar + br;
  let dx = b.x - a.x;
  let dz = b.z - a.z;
  let d2 = dx * dx + dz * dz;
  if (d2 >= minDist * minDist) return false;

  let nx = 1;
  let nz = 0;
  let dist = Math.sqrt(d2);
  if (dist > 1e-4) {
    nx = dx / dist;
    nz = dz / dist;
  }
  const overlap = minDist - dist;
  const ma = a.mass !== undefined ? a.mass : 1;
  const mb = b.mass !== undefined ? b.mass : 1;
  const invA = a.immovable ? 0 : (1 / Math.max(0.1, ma));
  const invB = b.immovable ? 0 : (1 / Math.max(0.1, mb));
  const invSum = invA + invB;
  if (invSum <= 0) return false;

  const shareA = invA / invSum;
  const shareB = invB / invSum;
  a.x -= nx * overlap * shareA;
  a.z -= nz * overlap * shareA;
  b.x += nx * overlap * shareB;
  b.z += nz * overlap * shareB;

  if (a.vel && b.vel) {
    const rvx = b.vel.x - a.vel.x;
    const rvz = b.vel.z - a.vel.z;
    const vn = rvx * nx + rvz * nz;
    if (vn < 0) {
      const restitution = (a.isVehicle && b.isVehicle) ? 0.18 : 0.05;
      const j = -(1 + restitution) * vn / invSum;
      a.vel.x -= nx * j * invA;
      a.vel.z -= nz * j * invA;
      b.vel.x += nx * j * invB;
      b.vel.z += nz * j * invB;
    }
  }
  return true;
}

export function resolveAllEntityCollisions(entities, passes = 2) {
  if (!Array.isArray(entities) || entities.length < 2) return 0;
  let resolved = 0;
  for (let p = 0; p < passes; p++) {
    for (let i = 0; i < entities.length; i++) {
      const a = entities[i];
      if (!a || a.alive === false) continue;
      for (let j = i + 1; j < entities.length; j++) {
        const b = entities[j];
        if (!b || b.alive === false) continue;
        if (resolveEntityPairCollision(a, b)) resolved++;
      }
    }
  }
  return resolved;
}

export function isSmokeOccludingSegment(ax, ay, az, bx, by, bz, smokes) {
  if (!Array.isArray(smokes) || !smokes.length) return false;
  const abx = bx - ax;
  const aby = by - ay;
  const abz = bz - az;
  const abLenSq = abx * abx + aby * aby + abz * abz;
  if (abLenSq < 1e-6) return false;

  for (let i = 0; i < smokes.length; i++) {
    const s = smokes[i];
    if (!s || s.life <= 0) continue;
    const r = s.radius !== undefined ? s.radius : 6.8;
    const t = Math.max(0, Math.min(1, ((s.x - ax) * abx + (s.y - ay) * aby + (s.z - az) * abz) / abLenSq));
    const cx = ax + abx * t;
    const cy = ay + aby * t;
    const cz = az + abz * t;
    const dx = cx - s.x;
    const dy = cy - s.y;
    const dz = cz - s.z;
    if (dx * dx + dy * dy + dz * dz <= r * r) {
      return true;
    }
  }
  return false;
}

export const GRENADE_SPECS = Object.freeze({
  frag: Object.freeze({
    type: 'frag',
    fuse: 2.35,
    radius: 13.5,
    maxDamage: 118,
    vehicleMultiplier: 0.48,
    throwSpeed: 23,
    upBoost: 5.8,
    gravity: 20,
    restitution: 0.42
  }),
  smoke: Object.freeze({
    type: 'smoke',
    fuse: 1.35,
    cloudRadius: 7.4,
    cloudDuration: 14.0,
    throwSpeed: 21,
    upBoost: 5.0,
    gravity: 20,
    restitution: 0.35
  })
});

export function stepGrenade(g, dt, env = {}) {
  if (!g || g.detonated) return { detonated: false, bounced: false };
  const spec = GRENADE_SPECS[g.type] || GRENADE_SPECS.frag;
  const grav = env.gravity !== undefined ? env.gravity : spec.gravity;
  const rest = env.restitution !== undefined ? env.restitution : spec.restitution;
  let bounced = false;

  const speed = Math.hypot(g.vx, g.vy, g.vz);
  const subSteps = Math.max(1, Math.min(8, Math.ceil((speed * dt) / 0.22)));
  const subDt = dt / subSteps;

  for (let step = 0; step < subSteps; step++) {
    g.vy -= grav * subDt;
    g.x += g.vx * subDt;
    g.y += g.vy * subDt;
    g.z += g.vz * subDt;

    const bounds = env.bounds !== undefined ? env.bounds : 284;
    if (Math.abs(g.x) > bounds) {
      g.x = Math.sign(g.x) * bounds;
      g.vx *= -rest;
      bounced = true;
    }
    if (Math.abs(g.z) > bounds) {
      g.z = Math.sign(g.z) * bounds;
      g.vz *= -rest;
      bounced = true;
    }

    const obstacles = env.obstacles;
    if (Array.isArray(obstacles)) {
      const r = 0.22;
      for (let i = 0; i < obstacles.length; i++) {
        const o = obstacles[i];
        if (!o || o.noCollide) continue;
        const minY = o.minY !== undefined ? o.minY : -2;
        const maxY = o.h !== undefined ? o.h : 10;
        if (g.y + r < minY || g.y - r > maxY) continue;
        const cp = obbClosestPointXZ(g.x, g.z, o);
        const dx = g.x - cp.x;
        const dz = g.z - cp.z;
        const d2 = dx * dx + dz * dz;
        if (cp.inside || d2 < r * r) {
          if (g.vy < 0 && g.y >= maxY - 0.55) {
            g.y = maxY + r;
            g.vy = Math.abs(g.vy) * rest;
            g.vx *= 0.72;
            g.vz *= 0.72;
            bounced = true;
          } else {
            let nx = 1;
            let nz = 0;
            const d = Math.sqrt(d2);
            if (d > 1e-4) {
              nx = dx / d;
              nz = dz / d;
            } else {
              const penX = o.hw - Math.abs(cp.lx);
              const penZ = o.hd - Math.abs(cp.lz);
              const rot = o.rot || 0;
              const c = Math.cos(rot);
              const s = Math.sin(rot);
              const lx = penX <= penZ ? (cp.lx >= 0 ? 1 : -1) : 0;
              const lz = penX <= penZ ? 0 : (cp.lz >= 0 ? 1 : -1);
              nx = lx * c - lz * s;
              nz = lx * s + lz * c;
            }
            g.x = cp.x + nx * (r + 0.02);
            g.z = cp.z + nz * (r + 0.02);
            const vn = g.vx * nx + g.vz * nz;
            if (vn < 0) {
              g.vx -= (1 + rest) * vn * nx;
              g.vz -= (1 + rest) * vn * nz;
            }
            bounced = true;
          }
        }
      }
    }

    const terrainY = typeof env.getTerrainHeight === 'function' ? env.getTerrainHeight(g.x, g.z) : 0;
    const floorY = resolveWalkableSurfaceHeight(g.x, g.z, g.y + 0.35, terrainY, env.walkables, 0.75);
    if (g.y <= floorY + 0.16) {
      g.y = floorY + 0.16;
      if (Math.abs(g.vy) > 1.2) {
        g.vy = Math.abs(g.vy) * rest;
        bounced = true;
      } else {
        g.vy = 0;
      }
      g.vx *= 0.76;
      g.vz *= 0.76;
    }
  }

  g.fuse -= dt;
  const detonated = g.fuse <= 0;
  if (detonated) g.detonated = true;
  return { detonated, bounced };
}

export function computeFragBlast(origin, targets, spec = GRENADE_SPECS.frag) {
  const hits = [];
  if (!origin || !Array.isArray(targets)) return hits;
  const radius = spec.radius || 13.5;
  const maxDmg = spec.maxDamage || 118;

  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    if (!t || t.alive === false) continue;
    const dx = t.x - origin.x;
    const dy = ((t.y || 0) + (t.centerOffsetY || 0.8)) - origin.y;
    const dz = t.z - origin.z;
    const d = Math.hypot(dx, dy, dz);
    if (d > radius) continue;

    const falloff = Math.max(0.08, 1 - Math.pow(d / radius, 1.35));
    const mult = t.isVehicle ? (spec.vehicleMultiplier || 0.48) : 1;
    const damage = Math.round(maxDmg * falloff * mult);
    const invD = d > 1e-4 ? 1 / d : 0;
    const impulse = falloff * (t.isVehicle ? 6 : 11);
    hits.push({
      id: t.id,
      target: t,
      distance: d,
      damage,
      impulseX: (d > 1e-4 ? dx * invD : 0) * impulse,
      impulseY: Math.max(0.3, (d > 1e-4 ? dy * invD : 1)) * impulse * 0.6,
      impulseZ: (d > 1e-4 ? dz * invD : 0) * impulse
    });
  }
  return hits;
}

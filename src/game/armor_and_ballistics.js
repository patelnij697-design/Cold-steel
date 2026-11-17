export const VEHICLE_VARIANTS = {
  tank: {
    usa: {
      name: 'M1A2 ABRAMS',
      hp: 2400,
      armorType: 'composite',
      armorLabel: 'CHOBHAM COMP',
      thicknessMm: { front: 680, side: 320, rear: 140, top: 110 },
      reactiveArmor: 0,
      maxEra: 0,
      accel: 15,
      steerSpeed: 1.1,
      mag: 1,
      reloadTime: 3.0,
      mgMag: 75,
      mgReloadTime: 2.6,
      primaryCaliber: '120mm',
      primaryLabel: '120MM CANNON',
      primaryShort: '120MM',
      missileType: 'shell_120',
      coaxCaliber: 'coax_762',
      coaxLabel: 'COAXIAL MG'
    },
    ussr: {
      name: 'T-80U',
      hp: 2250,
      armorType: 'era',
      armorLabel: 'KONTAKT-5 ERA',
      thicknessMm: { front: 540, side: 250, rear: 120, top: 95 },
      reactiveArmor: 4,
      maxEra: 4,
      accel: 17.5,
      steerSpeed: 1.25,
      mag: 1,
      reloadTime: 3.2,
      mgMag: 75,
      mgReloadTime: 2.5,
      primaryCaliber: '125mm',
      primaryLabel: '125MM CANNON',
      primaryShort: '125MM',
      missileType: 'shell_125',
      coaxCaliber: 'coax_762',
      coaxLabel: '7.62MM PKT COAX'
    }
  },
  car: {
    usa: {
      name: 'COMMAND APC',
      hp: 1100,
      armorType: 'rolled_steel',
      armorLabel: 'COMPOSITE HULL',
      thicknessMm: { front: 95, side: 65, rear: 45, top: 30 },
      reactiveArmor: 0,
      maxEra: 0,
      accel: 18,
      steerSpeed: 1.7,
      mag: 45,
      reloadTime: 2.4,
      fireRate: 0.08,
      primaryDmg: 36,
      primaryCaliber: '25mm',
      primaryLabel: '25MM AUTOCANNON',
      primaryShort: '25MM'
    },
    ussr: {
      name: 'BTR-80A',
      hp: 960,
      armorType: 'light_steel',
      armorLabel: 'AMPHIB STEEL',
      thicknessMm: { front: 75, side: 50, rear: 35, top: 25 },
      reactiveArmor: 0,
      maxEra: 0,
      accel: 21.5,
      steerSpeed: 1.95,
      mag: 65,
      reloadTime: 2.1,
      fireRate: 0.052,
      primaryDmg: 26,
      primaryCaliber: '14.5mm',
      primaryLabel: '14.5MM KPVT',
      primaryShort: '14.5MM'
    }
  },
  heli: {
    usa: {
      name: 'AH-64 APACHE',
      hp: 600,
      armorType: 'light_alloy',
      armorLabel: 'ALLOY AIRFRAME',
      thicknessMm: { front: 45, side: 30, rear: 25, top: 20 },
      reactiveArmor: 0,
      maxEra: 0,
      accel: 32,
      steerSpeed: 1.65,
      mag: 120,
      reloadTime: 3.0,
      fireRate: 0.075,
      primaryDmg: 34,
      primaryCaliber: '30mm',
      primaryLabel: '30MM CHAIN GUN',
      primaryShort: '30MM',
      mMag: 4,
      mReloadTime: 5.0
    },
    ussr: {
      name: 'MI-24 HIND',
      hp: 720,
      armorType: 'titanium_tub',
      armorLabel: 'TITANIUM TUB',
      thicknessMm: { front: 65, side: 50, rear: 38, top: 32 },
      reactiveArmor: 0,
      maxEra: 0,
      accel: 35,
      steerSpeed: 1.45,
      mag: 160,
      reloadTime: 2.8,
      fireRate: 0.042,
      primaryDmg: 22,
      primaryCaliber: '12.7mm',
      primaryLabel: '12.7MM YAK-B',
      primaryShort: '12.7MM',
      mMag: 4,
      mReloadTime: 4.8
    }
  },
  sam: {
    usa: {
      name: 'M901 SAM TRUCK',
      hp: 850,
      armorType: 'rolled_steel',
      armorLabel: 'ARMORED CAB',
      thicknessMm: { front: 60, side: 45, rear: 35, top: 25 },
      reactiveArmor: 0,
      maxEra: 0,
      accel: 16,
      steerSpeed: 1.3,
      mag: 120,
      reloadTime: 2.4,
      fireRate: 0.055,
      secondaryDmg: 20,
      secondaryCaliber: '20mm',
      secondaryLabel: '20MM CIWS',
      mMag: 4,
      mReloadTime: 3.6,
      missileType: 'sam'
    },
    ussr: {
      name: '2K12 KUB SAM',
      hp: 1000,
      armorType: 'tracked_steel',
      armorLabel: 'TRACKED CHASSIS',
      thicknessMm: { front: 95, side: 70, rear: 45, top: 35 },
      reactiveArmor: 0,
      maxEra: 0,
      accel: 15,
      steerSpeed: 1.4,
      mag: 90,
      reloadTime: 2.6,
      fireRate: 0.072,
      secondaryDmg: 26,
      secondaryCaliber: '23mm',
      secondaryLabel: '23MM AA GUN',
      mMag: 3,
      mReloadTime: 3.4,
      missileType: 'sam_kub'
    }
  }
};

export const CALIBER_PROFILES = {
  pistol: { caliberMm: 9, penetrationMm: 10, kind: 'kinetic', label: '9MM PISTOL' },
  pistol_50: { caliberMm: 12.7, penetrationMm: 30, kind: 'kinetic', label: '.50 AE' },
  smg: { caliberMm: 9, penetrationMm: 12, kind: 'kinetic', label: '9MM SMG' },
  shotgun: { caliberMm: 18, penetrationMm: 14, kind: 'kinetic', label: '12G BUCK' },
  rifle: { caliberMm: 5.56, penetrationMm: 22, kind: 'kinetic', label: '5.56MM NATO' },
  battle_rifle: { caliberMm: 7.62, penetrationMm: 32, kind: 'kinetic', label: '7.62MM AP' },
  lmg: { caliberMm: 5.56, penetrationMm: 24, kind: 'kinetic', label: '5.56MM LMG' },
  dmr: { caliberMm: 7.62, penetrationMm: 36, kind: 'kinetic', label: '7.62MM MATCH' },
  sniper_50: { caliberMm: 12.7, penetrationMm: 45, kind: 'kinetic', label: '.50 BMG AP' },
  coax_762: { caliberMm: 7.62, penetrationMm: 22, kind: 'kinetic', label: '7.62MM COAX' },
  '12.7mm': { caliberMm: 12.7, penetrationMm: 38, kind: 'kinetic', label: '12.7MM YAK-B' },
  '14.5mm': { caliberMm: 14.5, penetrationMm: 48, kind: 'kinetic', label: '14.5MM KPVT' },
  '20mm': { caliberMm: 20, penetrationMm: 62, kind: 'kinetic', label: '20MM CIWS' },
  '23mm': { caliberMm: 23, penetrationMm: 76, kind: 'kinetic', label: '23MM AP' },
  '25mm': { caliberMm: 25, penetrationMm: 88, kind: 'kinetic', label: '25MM APDS' },
  '30mm': { caliberMm: 30, penetrationMm: 105, kind: 'kinetic', label: '30MM HEDP' },
  '120mm': { caliberMm: 120, penetrationMm: 620, kind: 'kinetic', baseDamage: 520, label: '120MM APFSDS' },
  '125mm': { caliberMm: 125, penetrationMm: 660, kind: 'kinetic', baseDamage: 560, label: '125MM APFSDS' },
  shell_120: { caliberMm: 120, penetrationMm: 620, kind: 'kinetic', baseDamage: 520, label: '120MM APFSDS' },
  shell_125: { caliberMm: 125, penetrationMm: 660, kind: 'kinetic', baseDamage: 560, label: '125MM APFSDS' },
  at: { caliberMm: 84, penetrationMm: 440, kind: 'shaped', baseDamage: 460, label: '84MM HEAT' },
  agm: { caliberMm: 152, penetrationMm: 760, kind: 'tandem', baseDamage: 540, label: 'TANDEM ATGM' },
  sam: { caliberMm: 140, penetrationMm: 220, kind: 'sam', baseDamage: 550, label: 'SAM WARHEAD' },
  sam_kub: { caliberMm: 170, penetrationMm: 270, kind: 'sam', baseDamage: 650, label: '3M9 KUB SAM' },
  aa: { caliberMm: 70, penetrationMm: 140, kind: 'sam', baseDamage: 420, label: 'STINGER AA' },
  frag: { caliberMm: 60, penetrationMm: 28, kind: 'explosive', label: 'M67 FRAG' }
};

export function getVehicleVariantSpec(type, faction = 'usa') {
  const group = VEHICLE_VARIANTS[type];
  if (!group) return null;
  const key = faction === 'ussr' ? 'ussr' : 'usa';
  return group[key];
}

export function getCaliberProfile(caliber) {
  if (caliber && typeof caliber === 'object' && Number.isFinite(caliber.penetrationMm)) {
    return caliber;
  }
  return CALIBER_PROFILES[caliber] || CALIBER_PROFILES.rifle;
}

export function determineHitAspect(targetPos, targetYaw = 0, sourcePos = null) {
  if (!targetPos || !sourcePos || !Number.isFinite(sourcePos.x) || !Number.isFinite(sourcePos.z)) {
    return 'side';
  }
  const dx = sourcePos.x - targetPos.x;
  const dz = sourcePos.z - targetPos.z;
  const hDist = Math.hypot(dx, dz);
  const dy = Number.isFinite(sourcePos.y) ? (sourcePos.y - ((targetPos.y || 0) + 1.2)) : 0;
  if (hDist < 0.1 || (hDist > 0.01 && dy / hDist > 0.72)) {
    return 'top';
  }
  const fx = Math.sin(targetYaw || 0);
  const fz = Math.cos(targetYaw || 0);
  const dot = (dx * fx + dz * fz) / hDist;
  if (dot >= 0.48) return 'front';
  if (dot <= -0.48) return 'rear';
  return 'side';
}

export function computeArmorDamage({
  targetType,
  faction = 'usa',
  targetPos = null,
  targetYaw = 0,
  sourcePos = null,
  reactiveArmor = null,
  baseDamage = 25,
  caliber = 'rifle',
  penetrationMm = null,
  projectileKind = null
} = {}) {
  const spec = getVehicleVariantSpec(targetType, faction);
  if (!spec) {
    return {
      finalDamage: Math.max(0, baseDamage),
      aspect: 'side',
      armorType: 'none',
      effectiveArmorMm: 0,
      penetrationRatio: 1,
      eraTriggered: false,
      eraRemaining: 0,
      outcome: 'penetrated',
      modifierLabel: 'DIRECT HIT'
    };
  }

  const profile = getCaliberProfile(caliber);
  const penMm = Number.isFinite(penetrationMm) ? penetrationMm : profile.penetrationMm;
  const kind = projectileKind || profile.kind || 'kinetic';
  const aspect = determineHitAspect(targetPos, targetYaw, sourcePos);
  const baseThickness = spec.thicknessMm[aspect] ?? spec.thicknessMm.side;

  const currentEra = Number.isFinite(reactiveArmor) ? Math.max(0, reactiveArmor) : (spec.reactiveArmor || 0);
  const hasEraProtection = spec.armorType === 'era' && currentEra > 0;
  const activeArmorType = hasEraProtection ? 'era' : (spec.armorType === 'era' ? 'base' : spec.armorType);

  let eraTriggered = false;
  let eraRemaining = currentEra;
  let eraMult = 1;
  let typeMult = 1;
  let effectiveArmorMm = baseThickness;

  // Exposed rear & top roof are not covered by forward/side Kontakt-5 ERA bricks
  if (hasEraProtection && (aspect === 'front' || aspect === 'side') && (penMm >= 100 || kind === 'shaped' || kind === 'tandem' || kind === 'sam')) {
    eraTriggered = true;
    eraRemaining = Math.max(0, currentEra - 1);
    effectiveArmorMm = Math.round(baseThickness * 1.25);
    if (kind === 'shaped') {
      eraMult = 0.42;
    } else if (kind === 'tandem') {
      eraMult = 0.85;
    } else if (kind === 'sam') {
      eraMult = 0.55;
    } else {
      // Kontakt-5 heavy ERA still degrades kinetic APFSDS rounds significantly
      eraMult = 0.68;
    }
  } else if (activeArmorType === 'composite') {
    if (kind === 'shaped') typeMult = 0.82;
    else if (kind === 'sam') typeMult = 0.72;
  } else if (activeArmorType === 'titanium_tub') {
    if (penMm <= 25 && kind === 'kinetic') typeMult = 0.65;
  }

  // Dedicated AA/SAM missiles stay devastating against helicopters, reduced vs heavy ground armor
  if (kind === 'sam' && targetType !== 'heli') {
    typeMult *= targetType === 'tank' ? 0.35 : 0.65;
  }

  const penRatio = penMm / Math.max(1, baseThickness);
  let penMult;
  let outcome;

  if (penRatio >= 1.25) {
    penMult = Math.min(1.22, 1.0 + (penRatio - 1.25) * 0.12);
    outcome = eraTriggered ? 'era_absorbed' : 'overmatch';
  } else if (penRatio >= 0.90) {
    penMult = 0.88 + ((penRatio - 0.90) / 0.35) * 0.12;
    outcome = eraTriggered ? 'era_absorbed' : 'penetrated';
  } else if (penRatio >= 0.45) {
    penMult = 0.32 + ((penRatio - 0.45) / 0.45) * 0.56;
    outcome = eraTriggered ? 'era_absorbed' : 'partial';
  } else if (penRatio >= 0.14) {
    penMult = 0.08 + ((penRatio - 0.14) / 0.31) * 0.24;
    outcome = eraTriggered ? 'era_absorbed' : (penRatio < 0.2 ? 'ricochet' : 'partial');
  } else {
    penMult = Math.max(0.02, penRatio * 0.35);
    outcome = 'ricochet';
  }

  const rawFinal = baseDamage * penMult * typeMult * eraMult;
  const finalDamage = baseDamage <= 0 ? 0 : Math.max(1, Math.round(rawFinal));

  const aspectUpper = aspect.toUpperCase();
  const modifierLabel = eraTriggered
    ? `ERA DETONATED (${eraRemaining}/${spec.maxEra} LEFT) · ${aspectUpper}`
    : outcome === 'overmatch'
      ? `CRIT PENETRATION · ${aspectUpper} ARMOR`
      : outcome === 'penetrated'
        ? `ARMOR PENETRATED · ${aspectUpper}`
        : outcome === 'partial'
          ? `PARTIAL PEN · ${aspectUpper}`
          : `RICOCHET · ${aspectUpper} TOO THICK`;

  return {
    finalDamage,
    aspect,
    armorType: activeArmorType,
    effectiveArmorMm,
    penetrationRatio: Number(penRatio.toFixed(3)),
    eraTriggered,
    eraRemaining,
    outcome,
    modifierLabel
  };
}

export function getArmorStateLabel(vehicle) {
  if (!vehicle) return '';
  const spec = getVehicleVariantSpec(vehicle.type, vehicle.faction);
  if (!spec) return '';
  if (spec.armorType === 'era') {
    const era = Number.isFinite(vehicle.reactiveArmor) ? vehicle.reactiveArmor : spec.reactiveArmor;
    return era > 0 ? `ERA ${era}/${spec.maxEra}` : 'BASE ARMOR';
  }
  return spec.armorLabel;
}

export const TUTORIAL_XP_REWARD = 150;

export const TUTORIAL_STEPS = [
  {
    id: 'move_slide',
    title: 'MOBILITY & SLIDE',
    summary: 'Move around the training yard and trigger a tactical slide to dodge fire.',
    tasks: [
      { key: 'moved', label: 'Move 4m using WASD or Left Stick' },
      { key: 'slid', label: 'Press [C] / SLIDE to tactical slide' }
    ]
  },
  {
    id: 'aim_fire',
    title: 'AIM & ENGAGE',
    summary: 'Toggle aim down sights for pinpoint accuracy and eliminate a range target.',
    tasks: [
      { key: 'aimed', label: 'Toggle Aim with [RMB] or AIM' },
      { key: 'targetHit', label: 'Fire [LMB] and hit a training target downrange' }
    ]
  },
  {
    id: 'arsenal_grenade',
    title: 'LOADOUT & ORDNANCE',
    summary: 'Swap between primary and secondary slots and throw a tactical grenade.',
    tasks: [
      { key: 'swapped', label: 'Swap slots with [1]/[2]/[Q] or SWAP' },
      { key: 'grenade', label: 'Throw a Frag [G] or Smoke [V] grenade' }
    ]
  },
  {
    id: 'repair_wrench',
    title: 'FIELD ENGINEERING',
    summary: 'Equip your Repair Wrench and weld the damaged friendly M1A2 Abrams.',
    tasks: [
      { key: 'wrenchEquipped', label: 'Select the Repair Wrench in Slot 2' },
      { key: 'repaired', label: 'Hold [LMB] / REPAIR on the damaged tank' }
    ]
  },
  {
    id: 'vehicle_command',
    title: 'ARMORED COMMAND',
    summary: 'Board a friendly armored vehicle, test its cannon or drive, then dismount.',
    tasks: [
      { key: 'boarded', label: 'Approach a vehicle and press [E] / USE' },
      { key: 'operated', label: 'Fire cannon [LMB] or drive 4m inside' }
    ]
  },
  {
    id: 'tactical_readiness',
    title: 'FIELD BRIEFING',
    summary: 'Base C-RAM turrets intercept missiles in TDM/CTF. BR grants 30s looting peace before zone shrink.',
    tasks: [
      { key: 'acknowledged', label: 'Click COMPLETE TRAINING to claim +150 XP' }
    ]
  }
];

export function createTutorialState() {
  return {
    active: true,
    stepIndex: 0,
    completed: false,
    rewardClaimed: false,
    distanceMoved: 0,
    vehicleDistance: 0,
    flags: {
      moved: false,
      slid: false,
      aimed: false,
      targetHit: false,
      swapped: false,
      grenade: false,
      wrenchEquipped: false,
      repaired: false,
      boarded: false,
      operated: false,
      acknowledged: false
    }
  };
}

export function getCurrentTutorialStep(state) {
  if (!state) return TUTORIAL_STEPS[0];
  const idx = Math.max(0, Math.min(TUTORIAL_STEPS.length - 1, state.stepIndex || 0));
  return TUTORIAL_STEPS[idx];
}

export function isTutorialStepComplete(state, stepIndex = state?.stepIndex) {
  if (!state) return false;
  const step = TUTORIAL_STEPS[stepIndex];
  if (!step) return false;
  return step.tasks.every(t => Boolean(state.flags[t.key]));
}

export function advanceTutorialStep(state) {
  if (!state || !state.active || state.completed) return { state, advanced: false, finished: Boolean(state?.completed), rewardXp: 0 };
  if (state.stepIndex < TUTORIAL_STEPS.length - 1) {
    state.stepIndex += 1;
    return { state, advanced: true, finished: false, rewardXp: 0 };
  }
  state.flags.acknowledged = true;
  state.completed = true;
  const rewardXp = state.rewardClaimed ? 0 : TUTORIAL_XP_REWARD;
  state.rewardClaimed = true;
  return { state, advanced: true, finished: true, rewardXp };
}

export function recordTutorialEvent(state, eventType, payload = {}) {
  if (!state || !state.active || state.completed) {
    return { state, stepAdvanced: false, finished: Boolean(state?.completed), rewardXp: 0 };
  }
  const currentStep = getCurrentTutorialStep(state);
  const f = state.flags;

  if (eventType === 'move') {
    const dist = Math.max(0, Number(payload.distance) || 0);
    state.distanceMoved += dist;
    if (state.distanceMoved >= 4) f.moved = true;
  } else if (eventType === 'slide') {
    f.slid = true;
  } else if (eventType === 'aim') {
    f.aimed = true;
  } else if (eventType === 'hit') {
    f.targetHit = true;
  } else if (eventType === 'swap') {
    f.swapped = true;
    if (payload.weaponType === 'repair') f.wrenchEquipped = true;
  } else if (eventType === 'grenade') {
    f.grenade = true;
  } else if (eventType === 'equip_repair') {
    f.wrenchEquipped = true;
  } else if (eventType === 'repair') {
    f.wrenchEquipped = true;
    f.repaired = true;
  } else if (eventType === 'vehicle_enter') {
    f.boarded = true;
  } else if (eventType === 'vehicle_move') {
    const dist = Math.max(0, Number(payload.distance) || 0);
    state.vehicleDistance += dist;
    if (state.vehicleDistance >= 4) f.operated = true;
  } else if (eventType === 'vehicle_fire') {
    f.boarded = true;
    f.operated = true;
  } else if (eventType === 'complete') {
    f.acknowledged = true;
  }

  let stepAdvanced = false;
  let finished = false;
  let rewardXp = 0;

  if (currentStep.id !== 'tactical_readiness' && isTutorialStepComplete(state, state.stepIndex)) {
    const res = advanceTutorialStep(state);
    stepAdvanced = res.advanced;
    finished = res.finished;
    rewardXp = res.rewardXp;
  } else if (currentStep.id === 'tactical_readiness' && f.acknowledged) {
    const res = advanceTutorialStep(state);
    stepAdvanced = res.advanced;
    finished = res.finished;
    rewardXp = res.rewardXp;
  }

  return { state, stepAdvanced, finished, rewardXp };
}

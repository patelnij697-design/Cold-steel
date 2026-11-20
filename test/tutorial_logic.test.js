import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TUTORIAL_STEPS,
  TUTORIAL_XP_REWARD,
  createTutorialState,
  getCurrentTutorialStep,
  recordTutorialEvent,
  advanceTutorialStep
} from '../src/game/tutorial_logic.js';

test('interactive tutorial defines 6 ordered steps and rewards +150 XP upon completion', () => {
  assert.equal(TUTORIAL_STEPS.length, 6);
  const state = createTutorialState();
  assert.equal(state.active, true);
  assert.equal(state.stepIndex, 0);
  assert.equal(getCurrentTutorialStep(state).id, 'move_slide');

  // Step 1: move >= 4m and slide
  let res = recordTutorialEvent(state, 'move', { distance: 4.5 });
  assert.equal(res.stepAdvanced, false);
  res = recordTutorialEvent(state, 'slide');
  assert.equal(res.stepAdvanced, true);
  assert.equal(getCurrentTutorialStep(state).id, 'aim_fire');

  // Step 2: aim and hit target
  recordTutorialEvent(state, 'aim');
  res = recordTutorialEvent(state, 'hit');
  assert.equal(res.stepAdvanced, true);
  assert.equal(getCurrentTutorialStep(state).id, 'arsenal_grenade');

  // Step 3: swap weapon slot & throw grenade
  recordTutorialEvent(state, 'swap', { weaponType: 'pistol' });
  res = recordTutorialEvent(state, 'grenade');
  assert.equal(res.stepAdvanced, true);
  assert.equal(getCurrentTutorialStep(state).id, 'repair_wrench');

  // Step 4: equip repair wrench & repair tank
  recordTutorialEvent(state, 'equip_repair');
  res = recordTutorialEvent(state, 'repair');
  assert.equal(res.stepAdvanced, true);
  assert.equal(getCurrentTutorialStep(state).id, 'vehicle_command');

  // Step 5: enter vehicle & fire/drive
  recordTutorialEvent(state, 'vehicle_enter');
  res = recordTutorialEvent(state, 'vehicle_fire');
  assert.equal(res.stepAdvanced, true);
  assert.equal(getCurrentTutorialStep(state).id, 'tactical_readiness');

  // Step 6: acknowledge briefing and claim XP reward once
  res = recordTutorialEvent(state, 'complete');
  assert.equal(res.finished, true);
  assert.equal(res.rewardXp, TUTORIAL_XP_REWARD);

  const dup = advanceTutorialStep(state);
  assert.equal(dup.rewardXp, 0);
});

test('tutorial step skip helper advances cleanly without premature completion', () => {
  const state = createTutorialState();
  const skipRes = advanceTutorialStep(state);
  assert.equal(skipRes.advanced, true);
  assert.equal(skipRes.finished, false);
  assert.equal(state.stepIndex, 1);
});

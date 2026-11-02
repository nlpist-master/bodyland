import * as hub from './hub.js';
import * as energy from './energy.js';
import * as construction from './construction.js';
import * as jungle from './jungle.js';
import * as water from './water.js';
import * as life from './life.js';

// Gameplay layered on top of each zone: pickups, machines, gates and
// challenges. Each module exports setup(ctx, zone) -> { update? }.
export const MISSIONS = { hub, energy, construction, jungle, water, life };

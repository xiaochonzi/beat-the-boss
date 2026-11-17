import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createExperiment} from '../src/physics.js'
function settle(s){for(let i=0;i<1200&&s.moving;i++)s.step();assert.equal(s.moving,false);return s.snapshot()}
function hit(s,b,x,y=0){assert.equal(s.strike(b,{...b.position},x,y),true);return settle(s)}
test('level 2: gate blocks a direct strike, and opening it leaves the boss in place',()=>{const blocked=createExperiment(2);const r=hit(blocked,blocked.torso,94,-10);assert.equal(r.gateOpen,false);assert.ok(r.torso.x<440);const s=createExperiment(2);const opened=hit(s,s.gate,94);assert.equal(opened.gateOpen,true);assert.ok(Math.abs(opened.torso.x-250)<1)})
test('level 2: gate settles without snapping to a new position',()=>{const s=createExperiment(2);s.strike(s.gate,s.gate.position,94,0);let previous={...s.gate.position},maxJump=0;while(s.moving){s.step();maxJump=Math.max(maxJump,Math.hypot(s.gate.position.x-previous.x,s.gate.position.y-previous.y));previous={...s.gate.position}}assert.equal(s.snapshot().gateOpen,true);assert.ok(maxJump<20,`gate moved ${maxJump} in one frame`)})
test('level 2: opening gate then striking boss succeeds repeatedly',()=>{for(let i=0;i<3;i++){const s=createExperiment(2);hit(s,s.gate,94);assert.equal(hit(s,s.torso,94,-10).state,'won')}})
test('level 3: direct hit and rolling object are separate repeatable routes',()=>{for(let i=0;i<3;i++){const direct=createExperiment(3),rolling=createExperiment(3);assert.equal(hit(direct,direct.torso,94,-15).state,'won');assert.equal(hit(rolling,rolling.ball,94).state,'won');assert.equal(rolling.snapshot().lastPart,'滚轮')}})

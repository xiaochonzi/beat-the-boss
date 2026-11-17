import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createExperiment,TARGET} from '../src/physics.js'
function settle(s){for(let i=0;i<1200&&s.moving;i++)s.step();assert.equal(s.moving,false,'must settle within 20 simulated seconds');return s.snapshot()}
test('tiny gesture cancels without spending a shot',()=>{const s=createExperiment();assert.equal(s.strike(s.torso,s.torso.position,5,0),false);assert.equal(s.shots,2)})
test('medium rightward body strike reaches broad target',()=>{for(const force of [70,94,120]){const s=createExperiment();s.strike(s.torso,{...s.torso.position},force,-10);const r=settle(s);assert.equal(r.state,'won');assert.ok(r.torso.x>=TARGET[0]&&r.torso.x<=TARGET[1])}})
test('cannot fire again while moving',()=>{const s=createExperiment();s.strike(s.head,s.head.position,70,0);assert.equal(s.strike(s.torso,s.torso.position,70,0),false);assert.equal(s.shots,1)})
test('two weak shots can fail without premature result',()=>{const s=createExperiment();s.strike(s.torso,s.torso.position,20,0);assert.equal(s.state,'ready');settle(s);s.strike(s.torso,s.torso.position,-20,0);assert.equal(s.state,'ready');assert.equal(settle(s).state,'lost')})
test('reset and same input reproduce stable outcome',()=>{const outcomes=Array.from({length:3},()=>{const s=createExperiment();s.strike(s.torso,s.torso.position,94,-10);return settle(s).torso.x});assert.ok(Math.max(...outcomes)-Math.min(...outcomes)<.01)})
test('head and legs produce distinct physical motion',()=>{const values=['head','ll'].map(part=>{const s=createExperiment();s.strike(s[part],s[part].position,94,-10);for(let i=0;i<20;i++)s.step();return s.snapshot().parts.find(b=>b.name==='头部').angle});assert.ok(Math.abs(values[0]-values[1])>.05)})

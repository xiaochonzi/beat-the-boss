import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createStealthGame, cellCenter, T_FLOOR, T_GATE } from '../src/stealthGame.js'

test('1. sprint noise and microwave lure pull boss into investigate', () => {
  const g = createStealthGame(1)
  const boss = g.guards[0]

  // Place player on normal floor (7,9) outside Boss vision cone (facing left from 9,6) and 144px away
  const pPos = cellCenter(7, 9)
  g.player.x = pPos.x
  g.player.y = pPos.y
  g.player.col = 7
  g.player.row = 9
  boss.dirAngle = 0 // facing away (right) so vision isn't triggered

  // Walking quietly on T_FLOOR should NOT pull boss
  g.step(1 / 60, { dx: 0, dy: -1, sprint: false })
  assert.equal(boss.state, 'patrol')

  // Sprinting emits 145px noise ripple and pulls boss into investigate!
  g.step(1 / 60, { dx: 0, dy: -1, sprint: true })
  assert.equal(boss.state, 'investigate')

  // Reset and test microwave distraction from Pantry (2,1)
  const g2 = createStealthGame(1)
  const mw = g2.objects.find(o => o.type === 'microwave')
  g2.player.x = mw.x
  g2.player.y = mw.y
  g2.player.col = mw.col
  g2.player.row = mw.row
  assert.equal(g2.interactNearest(), true)

  // Step 2.2 seconds until microwave pops and emits 380px lure
  for (let i = 0; i < 140; i++) g2.step(1 / 60)
  const boss2 = g2.guards[0]
  assert.equal(boss2.state, 'investigate')
  assert.equal(boss2.investigateTarget.col, mw.col)
  assert.equal(boss2.investigateTarget.row, mw.row)
})

test('2. level 1 full stealth flow: lure boss -> clock in -> reach workstation -> win', () => {
  const g = createStealthGame(1)
  // Trigger microwave to pull boss to pantry
  const mw = g.objects.find(o => o.type === 'microwave')
  g.player.x = mw.x
  g.player.y = mw.y
  g.player.col = mw.col
  g.player.row = mw.row
  g.interactNearest()
  // Step until microwave pops AND boss walks away from lobby into pantry (col <= 5)
  for (let i = 0; i < 400 && (g.guards[0].col > 5 || g.guards[0].state !== 'investigate'); i++) {
    g.step(1 / 60)
  }
  assert.ok(g.guards[0].col <= 5, 'boss should be lured into pantry')

  // Move to clock_in and hold to finish 0.85s recognition bar
  const clk = g.objects.find(o => o.type === 'clock_in')
  g.player.x = clk.x
  g.player.y = clk.y
  g.player.col = clk.col
  g.player.row = clk.row
  g.interactNearest()
  for (let i = 0; i < 60; i++) g.step(1 / 60)
  assert.equal(g.player.clockedIn, true)

  // Reach workstation (15,2) and interact to finish work hold
  const ws = g.objects.find(o => o.type === 'workstation')
  g.player.x = ws.x
  g.player.y = ws.y
  g.player.col = ws.col
  g.player.row = ws.row
  g.interactNearest()
  for (let i = 0; i < 45; i++) g.step(1 / 60)

  assert.equal(g.gameState, 'won')
})

test('3. raycast occlusion (T_WALL blocks, T_GLASS transparent) and carton disguise', () => {
  const g = createStealthGame(1)
  const boss = g.guards[0]

  // Place boss in CEO office looking down through glass (8,4) at player at (8,5)
  const bPos = cellCenter(8, 3)
  boss.x = bPos.x
  boss.y = bPos.y
  boss.col = 8
  boss.row = 3
  boss.dirAngle = Math.PI / 2 // facing down through T_GLASS at (8,4)

  const pGlass = cellCenter(8, 5)
  g.player.x = pGlass.x
  g.player.y = pGlass.y
  g.player.col = 8
  g.player.row = 5
  g.player.hiding = false
  g.player.carton = false
  g.player.isMoving = false
  assert.equal(g.canObserverSeePlayer(boss), true, 'T_GLASS must NOT block sight')

  // Stationary carton disguise hides player inside Boss FOV!
  g.toggleCarton()
  assert.equal(g.canObserverSeePlayer(boss), false, 'stationary carton hides player')
  g.toggleCarton()

  // Move boss to (6,2) and player to (6,5) separated directly by solid T_WALL at (6,4)
  const bWall = cellCenter(6, 2)
  boss.x = bWall.x
  boss.y = bWall.y
  boss.col = 6
  boss.row = 2
  boss.dirAngle = Math.PI / 2

  const pWall = cellCenter(6, 5)
  g.player.x = pWall.x
  g.player.y = pWall.y
  g.player.col = 6
  g.player.row = 5
  assert.equal(g.canObserverSeePlayer(boss), false, 'T_WALL must block sight')
})

test('4. soap puddle and rolling office chair prank stun boss and increment bossPranked', () => {
  const g = createStealthGame(1)
  const boss = g.guards[0]

  // Test Soap Puddle slip -> wall crash -> stunned
  const sPos = cellCenter(7, 5)
  g.player.x = sPos.x
  g.player.y = sPos.y
  g.player.col = 7
  g.player.row = 5
  g.player.inventory.push({ id: 'soap', icon: '🧼', name: '洗洁精', desc: '' })
  assert.equal(g.useInventoryItem(0), true)

  boss.x = sPos.x
  boss.y = sPos.y
  boss.dirAngle = 0
  g.step(1 / 60)
  assert.equal(boss.state, 'slipping')
  for (let i = 0; i < 90 && boss.state === 'slipping'; i++) g.step(1 / 60)
  assert.equal(boss.state, 'stunned')
  assert.equal(g.snapshot().bossPranked, 1)

  // Test Rolling Chair bowling over HR/Boss
  const g2 = createStealthGame(1)
  const ch = g2.chairs[0] // at (12, 5)
  g2.player.x = ch.x - 24
  g2.player.y = ch.y
  g2.player.col = ch.col - 1
  g2.player.row = ch.row
  g2.player.angle = 0

  const b2 = g2.guards[0]
  b2.x = ch.x + 80
  b2.y = ch.y
  b2.state = 'patrol'

  assert.equal(g2.interactNearest(), true)
  assert.equal(ch.sliding, true)
  for (let i = 0; i < 40; i++) g2.step(1 / 60)
  assert.equal(b2.state, 'stunned')
  assert.equal(g2.snapshot().bossPranked, 1)
})

test('5. level 2 takeout odor suppression by fan_switch & level 3 keycard gate unlock', () => {
  // Level 2: carrying takeout emits odor unless fan_switch is active
  const g2 = createStealthGame(2)
  const boss2 = g2.guards[0]
  boss2.x = cellCenter(5, 11).x
  boss2.y = cellCenter(5, 11).y
  boss2.col = 5
  boss2.row = 11
  boss2.dirAngle = 0 // facing away so only odor pulls boss, not sight
  boss2.waitTimer = 5 // standing still until odor triggers

  const to = g2.objects.find(o => o.type === 'takeout')
  g2.player.x = to.x
  g2.player.y = to.y
  g2.player.col = to.col
  g2.player.row = to.row
  g2.interactNearest()
  assert.equal(g2.player.carryingTakeout, true)

  // Step 0.5s -> odor ripple immediately triggers investigate without waiting long enough to turn & spot
  for (let i = 0; i < 15; i++) g2.step(1 / 60)
  assert.equal(boss2.state, 'investigate')

  // Activate fan_switch -> exhaustTimer > 0 suppresses odor ripples
  const fan = g2.objects.find(o => o.type === 'fan_switch')
  g2.player.x = fan.x
  g2.player.y = fan.y
  g2.interactNearest()
  assert.ok(g2.player.exhaustTimer > 5)

  // Level 3: keycard unlocks T_GATE turnstiles and allows reaching elevator_exit to win
  const g3 = createStealthGame(3)
  assert.equal(g3.grid[6][6], T_GATE)
  const key = g3.pickups.find(p => p.type === 'keycard')
  g3.player.x = key.x
  g3.player.y = key.y
  g3.player.col = key.col
  g3.player.row = key.row
  g3.step(1 / 60)
  assert.equal(g3.player.hasKeycard, true)
  assert.equal(g3.grid[6][6], T_FLOOR)

  const exitObj = g3.objects.find(o => o.type === 'elevator_exit')
  g3.player.x = exitObj.x
  g3.player.y = exitObj.y
  g3.player.col = exitObj.col
  g3.player.row = exitObj.row
  g3.interactNearest()
  assert.equal(g3.gameState, 'won')
})

test('6. snitch coworker alarm summons guards; carton uses are limited; hiding in front of a chaser fails', () => {
  const g = createStealthGame(1)
  const sn = g.snitches[0]
  // Snitch looks right (angle 0) -> place player 2 tiles to its right
  sn.dirAngle = 0
  sn.lookTimer = 99
  sn.lookIndex = 1
  const p = cellCenter(sn.col + 2, sn.row)
  Object.assign(g.player, { x: p.x, y: p.y, col: sn.col + 2, row: sn.row })
  for (let i = 0; i < 30; i++) g.step(1 / 60)
  assert.ok(g.snapshot().spottedCount >= 1, 'snitch should raise an alarm')
  assert.equal(g.guards[0].state === 'investigate' || g.guards[0].state === 'chase', true)

  // Carton uses
  const g2 = createStealthGame(3)
  assert.equal(g2.player.cartonUses, 1)
  assert.equal(g2.toggleCarton(), true)
  g2.toggleCarton()
  assert.equal(g2.toggleCarton(), false, 'no carton left')

  // Hide blown when entering a plant right under a chaser's eyes
  const g3 = createStealthGame(1)
  const boss = g3.guards[0]
  const plant = cellCenter(3, 7) // T_HIDE
  const next = cellCenter(4, 7)
  Object.assign(g3.player, { x: next.x, y: next.y, col: 4, row: 7 })
  boss.state = 'chase'
  boss.lastSeenAt = 0
  boss.x = cellCenter(8, 7).x
  boss.y = cellCenter(8, 7).y
  boss.dirAngle = Math.PI
  g3.step(1 / 60)
  Object.assign(g3.player, { x: plant.x, y: plant.y, col: 3, row: 7 })
  g3.step(1 / 60, { dx: -0.0001, dy: 0 })
  assert.equal(g3.player.hideBlown, true)
  assert.equal(g3.player.hiding, false)
})

test('7. guards turn to face their walking direction', () => {
  const g = createStealthGame(1)
  const boss = g.guards[0]
  boss.dirAngle = Math.PI
  for (let i = 0; i < 200; i++) g.step(1 / 60)
  // after walking toward later waypoints the facing should have changed from the initial value
  assert.notEqual(Math.round(boss.dirAngle * 100), Math.round(Math.PI * 100))
})

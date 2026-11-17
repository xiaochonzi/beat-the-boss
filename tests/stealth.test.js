import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  CHAPTERS,
  TOTAL_LEVELS,
  LEVEL_CONFIGS,
  COLS,
  ROWS,
  T_FLOOR,
  T_WALL,
  T_GLASS,
  T_GATE,
  buildGrid,
  cellCenter,
  worldToCell,
  createStealthGame
} from '../src/stealthGame.js'

test('campaign exports 5 chapters, 16 levels, and 5 distinct valid 18x13 layouts', () => {
  assert.equal(TOTAL_LEVELS, 16)
  assert.equal(CHAPTERS.length, 5)
  const allLevelNums = CHAPTERS.flatMap(ch => ch.levels)
  assert.deepEqual(allLevelNums, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])

  const layouts = ['classic', 'open_arena', 'conference', 'cubicle_maze', 'vault_floor']
  const signatures = new Set()
  for (const layout of layouts) {
    const g = buildGrid(1, layout)
    assert.equal(g.length, ROWS)
    for (const row of g) {
      assert.equal(row.length, COLS)
    }
    signatures.add(JSON.stringify(g))
  }
  assert.equal(signatures.size, 5, 'all 5 office layouts must have distinct tile geometry')
})

test('all 16 levels initialize cleanly, step without errors, and expose action descriptors', () => {
  for (let lvl = 1; lvl <= TOTAL_LEVELS; lvl++) {
    assert.ok(LEVEL_CONFIGS[lvl], `LEVEL_CONFIGS[${lvl}] exists`)
    const g = createStealthGame(lvl)
    const pCell = worldToCell(g.player.x, g.player.y)
    assert.notEqual(g.grid[pCell.row][pCell.col], T_WALL, `level ${lvl} player spawn must not be inside T_WALL`)

    const desc0 = g.getActionDescriptor()
    assert.equal(typeof desc0.icon, 'string')
    assert.equal(typeof desc0.label, 'string')
    assert.equal(typeof desc0.canAct, 'boolean')
    assert.equal(typeof desc0.accent, 'string')

    // Run 30 frames + secondary action + snapshot
    for (let i = 0; i < 30; i++) {
      g.step(1 / 60, { dx: 0.5, dy: 0, sprint: false })
    }
    g.triggerSecondaryAction()
    const snap = g.snapshot()
    assert.equal(snap.level, lvl)
    assert.equal(snap.gameState, 'playing')
    assert.ok(!Number.isNaN(snap.player.x) && !Number.isNaN(snap.player.y))
  }
})

test('Lv4-6 prank_hunt modes: wig blow photo snap, 3x bowling blitz, and 3-in-1 dark brew', () => {
  // Lv4: Activate industrial fan -> blow off Boss wig -> snap photo -> win
  const g4 = createStealthGame(4)
  const fan = g4.objects.find(o => o.id === 'fan_blower')
  const boss4 = g4.guards.find(g => g.role === 'boss')
  g4.player.x = fan.x
  g4.player.y = fan.y
  assert.equal(g4.interactNearest(), true)

  // Place boss in front of the blowing fan stream
  boss4.x = fan.x + 120
  boss4.y = fan.y
  g4.step(1 / 60)
  assert.equal(boss4.wigLost, true)
  assert.equal(boss4.state, 'stunned')

  // Move player near bald Boss -> descriptor shows 📸抓拍秃头 -> interact wins
  g4.player.x = boss4.x - 30
  g4.player.y = boss4.y
  assert.equal(g4.getActionDescriptor().icon, '📸')
  assert.equal(g4.interactNearest(), true)
  assert.equal(g4.gameState, 'won')

  // Lv5: 3 pranks via soap/rolling chairs win immediately
  const g5 = createStealthGame(5)
  for (let i = 0; i < 3; i++) {
    const targetGuard = g5.guards[i]
    const ch = g5.chairs[i]
    ch.x = targetGuard.x - 40
    ch.y = targetGuard.y
    ch.sliding = false
    g5.player.x = ch.x - 20
    g5.player.y = ch.y
    g5.player.angle = 0
    g5.interactNearest()
    for (let s = 0; s < 20 && g5.gameState === 'playing'; s++) g5.step(1 / 60)
  }
  assert.equal(g5.gameState, 'won')

  // Lv6: Collect 3 dark brew ingredients -> spike podium thermos -> Boss drinks -> win
  const g6 = createStealthGame(6)
  for (const ingType of ['chili', 'iced_americano', 'laxative']) {
    const pk = g6.pickups.find(p => p.type === ingType)
    g6.player.x = pk.x
    g6.player.y = pk.y
    g6.step(1 / 60)
  }
  assert.equal(g6.player.brewIngredients.length, 3)

  const thermos = g6.objects.find(o => o.id === 'podium_thermos')
  g6.player.x = thermos.x
  g6.player.y = thermos.y + 24
  assert.equal(g6.interactNearest(), true)
  assert.equal(thermos.spiked, true)

  // Move player out of sight and let Boss walk 1 tile to drink spiked thermos
  g6.player.x = cellCenter(2, 11).x
  g6.player.y = cellCenter(2, 11).y
  for (let i = 0; i < 240 && g6.gameState === 'playing'; i++) g6.step(1 / 60)
  assert.equal(g6.gameState, 'won')
})

test('Lv7-8 chair_derby: nitro drift chair bowls guards without dying and smashes all targets', () => {
  const g7 = createStealthGame(7)
  assert.equal(g7.player.ridingChair, true)
  assert.equal(g7.getActionDescriptor().icon, '🚀')

  // Trigger nitro and bowl over Boss without dying
  const boss7 = g7.guards.find(g => g.role === 'boss')
  g7.player.x = boss7.x - 20
  g7.player.y = boss7.y
  g7.player.angle = 0
  assert.equal(g7.triggerSecondaryAction(), true)
  g7.step(1 / 60, { dx: 1, dy: 0, sprint: true })
  assert.equal(boss7.state, 'stunned')
  assert.equal(g7.gameState, 'playing')

  // Smash all 8 contract piles
  const piles = g7.objects.filter(o => o.type === 'contract_pile')
  assert.equal(piles.length, 8)
  for (const cp of piles) {
    g7.player.x = cp.x
    g7.player.y = cp.y
    g7.step(1 / 60, { dx: 1, dy: 0, sprint: false })
  }
  assert.equal(g7.gameState, 'won')

  // Lv8: Smash glass with nitro and destroy all 3 brainwashing projectors
  const g8 = createStealthGame(8)
  assert.equal(g8.grid[4][4], T_GLASS)
  const glassPos = cellCenter(4, 4)
  g8.player.x = glassPos.x
  g8.player.y = glassPos.y + 24
  g8.player.angle = -Math.PI / 2
  g8.player.nitroCooldown = 0
  g8.triggerSecondaryAction()
  for (let i = 0; i < 8; i++) g8.step(1 / 60, { dx: 0, dy: -1, sprint: true })
  assert.equal(g8.grid[4][4], T_FLOOR, 'nitro chair smashes conference glass')

  for (const proj of g8.objects.filter(o => o.type === 'projector')) {
    g8.player.x = proj.x
    g8.player.y = proj.y
    g8.step(1 / 60)
  }
  assert.equal(g8.gameState, 'won')
})

test('Lv9 pot_pong: boss fires pots, pan swing reflects them to deplete 5 Boss HP', () => {
  const g9 = createStealthGame(9)
  assert.equal(g9.bossMaxHp, 5)
  assert.equal(g9.bossHp, 5)

  // Step until Boss spawns at least one pot projectile
  for (let i = 0; i < 60 && g9.projectiles.length === 0; i++) g9.step(1 / 60)
  assert.ok(g9.projectiles.length >= 1)
  assert.equal(g9.projectiles[0].type, 'pot')

  // Reflect 5 pots into Boss
  const boss9 = g9.guards.find(g => g.role === 'boss')
  for (let hit = 0; hit < 5; hit++) {
    g9.projectiles.length = 0
    g9.projectiles.push({
      id: `test_pot_${hit}`,
      type: 'pot',
      kind: 'black_pot',
      x: g9.player.x,
      y: g9.player.y - 24,
      vx: 0,
      vy: 180,
      radius: 15,
      reflected: false,
      fromId: 'boss',
      life: 4
    })
    g9.player.swingCooldown = 0
    assert.equal(g9.interactNearest(), true)
    assert.equal(g9.projectiles[0].reflected, true)
    // Place reflected pot near Boss so it lands cleanly
    g9.projectiles[0].x = boss9.x
    g9.projectiles[0].y = boss9.y + 10
    g9.step(1 / 60)
  }
  assert.equal(g9.bossHp, 0)
  assert.equal(g9.gameState, 'won')
})

test('Lv10 wake_coworkers & Lv11 be_the_boss: coworker rescue survival and role-reversal slacker hunt', () => {
  // Lv10: Wake sleepy coworker & survive timer to win
  const g10 = createStealthGame(10)
  assert.equal(g10.coworkers.length, 6)
  const cw = g10.coworkers[0]
  cw.sleepMeter = 88
  g10.player.x = cw.x
  g10.player.y = cw.y
  assert.equal(g10.getActionDescriptor().icon, '👋')
  assert.equal(g10.interactNearest(), true)
  assert.equal(cw.sleepMeter, 0)

  // Stun boss and fast-forward remaining survival timer -> won!
  g10.guards[0].state = 'stunned'
  g10.guards[0].stunTimer = 999
  g10.step(46)
  assert.equal(g10.gameState, 'won')

  // Lv11: Role reversal as Boss Wang catching all 7 hidden slackers
  const g11 = createStealthGame(11)
  assert.equal(g11.playerRole, 'boss')
  assert.equal(g11.hidingSpots.length, 12)
  const slackerSpots = g11.hidingSpots.filter(hs => hs.hasSlacker)
  assert.equal(slackerSpots.length, 7)

  for (const spot of slackerSpots) {
    g11.player.x = spot.x
    g11.player.y = spot.y
    assert.equal(g11.interactNearest(), true)
  }
  assert.equal(g11.gameState, 'won')
})

test('Lv12 desk_defense, Lv13 shredder_race, Lv14 vault_heist, Lv15 blackout_escape, Lv16 final_boss', () => {
  // Lv12: Keyboard smack & coffee slow puddle defend golden desk until 18:00
  const g12 = createStealthGame(12)
  assert.equal(g12.deskMaxHp, 5)
  assert.ok(g12.invaders.length >= 1)
  const inv = g12.invaders[0]
  g12.player.x = inv.x
  g12.player.y = inv.y
  g12.player.swingCooldown = 0
  assert.equal(g12.interactNearest(), true)
  assert.equal(inv.defeated, true)

  // Pour coffee slow puddle
  g12.player.inventory.push({ id: 'coffee', icon: '☕', name: '冰美式', desc: '' })
  assert.equal(g12.useInventoryItem(0), true)
  assert.equal(g12.coffeePuddles.length, 1)
  g12.step(46)
  assert.equal(g12.gameState, 'won')

  // Lv13: Collect 6 paycut contracts (3 per trip) and shred them
  const g13 = createStealthGame(13)
  const shredder = g13.objects.find(o => o.type === 'shredder')
  const docs = g13.pickups.filter(p => p.type === 'paycut_contract')
  for (let batch = 0; batch < 2; batch++) {
    for (let j = 0; j < 3; j++) {
      const doc = docs[batch * 3 + j]
      g13.player.x = doc.x
      g13.player.y = doc.y
      g13.step(1 / 60)
    }
    assert.equal(g13.player.carryingContracts, 3)
    g13.player.x = shredder.x
    g13.player.y = shredder.y
    assert.equal(g13.interactNearest(), true)
    assert.equal(g13.player.carryingContracts, 0)
  }
  assert.equal(g13.gameState, 'won')

  // Lv14: Push/place chairs onto 3 pressure pads -> unlock T_GATE -> steal vault_box -> exit elevator
  const g14 = createStealthGame(14)
  assert.equal(g14.grid[4][8], T_GATE)
  const pads = g14.objects.filter(o => o.type === 'pressure_pad')
  pads.forEach((pad, idx) => {
    g14.chairs[idx].x = pad.x
    g14.chairs[idx].y = pad.y
  })
  g14.step(1 / 60)
  assert.equal(g14.grid[4][8], T_FLOOR, 'all 3 pressure pads unlock vault gate')

  const vbox = g14.objects.find(o => o.type === 'vault_box')
  g14.player.x = vbox.x
  g14.player.y = vbox.y
  g14.interactNearest()
  assert.equal(g14.player.carryingVault, true)

  const exit14 = g14.objects.find(o => o.type === 'elevator_exit')
  g14.player.x = exit14.x
  g14.player.y = exit14.y
  g14.interactNearest()
  assert.equal(g14.gameState, 'won')

  // Lv15: Pull 3 power switches -> trigger blackout -> shrink guard sight -> exit elevator
  const g15 = createStealthGame(15)
  const exit15 = g15.objects.find(o => o.type === 'elevator_exit')
  g15.player.x = exit15.x
  g15.player.y = exit15.y
  g15.interactNearest()
  assert.equal(g15.gameState, 'playing', 'elevator locked before blackout')

  for (const sw of g15.objects.filter(o => o.type === 'power_switch')) {
    g15.player.x = sw.x
    g15.player.y = sw.y
    g15.interactNearest()
  }
  assert.equal(g15.blackout, true)
  assert.ok(g15.guards[0].viewDist <= 100, 'guard sight shrinks to flashlight range in blackout')

  g15.player.x = exit15.x
  g15.player.y = exit15.y
  g15.interactNearest()
  assert.equal(g15.gameState, 'won')

  // Lv16: 3-phase Final Boss (9 HP): shredder charge trap (-2 HP) + chair hits + reflected pots -> finisher notice -> win!
  const g16 = createStealthGame(16)
  assert.equal(g16.bossMaxHp, 9)
  const boss16 = g16.guards[0]
  const trapShredder = g16.objects.find(o => o.type === 'shredder')

  // Lure charging Boss into shredder trap (-2 HP -> 7 HP)
  boss16.state = 'charging'
  boss16.chargeActiveTimer = 1.0
  boss16.x = trapShredder.x - 20
  boss16.y = trapShredder.y
  boss16.chargeVx = 240
  boss16.chargeVy = 0
  g16.step(1 / 60)
  assert.equal(g16.bossHp, 7)

  // Deplete remaining 7 HP via reflected pots (include active pie projectiles on final blow to test multi-projectile cleanup)
  for (let h = 0; h < 7; h++) {
    if (h === 6) {
      g16.projectiles.push(
        { id: 'pie_0', type: 'pie', kind: 'big_pie', x: boss16.x - 40, y: boss16.y + 40, vx: 0, vy: 120, radius: 16, reflected: false, fromId: 'boss', life: 3 },
        { id: 'pie_1', type: 'pie', kind: 'big_pie', x: boss16.x + 40, y: boss16.y + 40, vx: 0, vy: 120, radius: 16, reflected: false, fromId: 'boss', life: 3 }
      )
    }
    g16.projectiles.push({
      id: `final_pot_${h}`,
      type: 'pot',
      kind: 'black_pot',
      x: boss16.x,
      y: boss16.y,
      vx: 0,
      vy: -200,
      radius: 15,
      reflected: true,
      fromId: 'boss',
      life: 3
    })
    g16.step(1 / 60)
  }
  assert.equal(g16.bossHp, 0)
  assert.equal(boss16.wigLost, true)
  assert.equal(g16.gameState, 'playing', 'requires slapping termination notice finisher')

  g16.player.x = boss16.x
  g16.player.y = boss16.y + 30
  assert.equal(g16.getActionDescriptor().icon, '📄')
  assert.equal(g16.interactNearest(), true)
  assert.equal(g16.gameState, 'won')
})

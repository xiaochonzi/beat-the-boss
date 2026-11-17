// 《牛马求生记：反坑大老板》 — 16关多元职场动作 × 潜行整蛊 × 物理狂欢核心引擎
import {
  CHAPTERS,
  TOTAL_LEVELS,
  CAMPAIGN_LEVELS,
  LAYOUT_TEMPLATES,
  getCampaignLevel
} from './campaignLevels.js'

export { CHAPTERS, TOTAL_LEVELS, CAMPAIGN_LEVELS, LAYOUT_TEMPLATES, getCampaignLevel }

export const W = 960
export const H = 620
export const COLS = 18
export const ROWS = 13
export const TILE = 40
export const MAP_X = 24
export const MAP_Y = 52
export const MAP_W = COLS * TILE // 720
export const MAP_H = ROWS * TILE // 520

export const T_FLOOR = 0
export const T_WALL = 1
export const T_CARPET = 2 // 踩上去会沙沙作响，容易惊动附近Boss
export const T_HIDE = 3   // 发财树/桌底躲藏点：站在格子上隐身
export const T_GLASS = 4  // 透明玻璃隔断：挡人移动，但不挡视线！
export const T_GATE = 5   // 门禁闸机：需要总裁门禁卡或重力机关才能通过

export const ITEM_DEFS = {
  soap: { id: 'soap', icon: '🧼', name: '洗洁精', desc: '涂在地上让老板/需求怪滑倒飞出' },
  coffee: { id: 'coffee', icon: '☕', name: '冰美式', desc: '移速暴涨+无限体力（塔防关可泼洒减速滩）' },
  frog: { id: 'frog', icon: '🐸', name: '发条青蛙', desc: '朝前方扔出，呱呱叫5秒引开巡逻' },
  laxative: { id: 'laxative', icon: '🌶️', name: '魔鬼泻药', desc: '靠近老板枸杞壶下药，逼他狂奔厕所' },
  chili: { id: 'chili', icon: '🌶️', name: '魔鬼辣椒素', desc: '暗黑特调核心配料之一' },
  iced_americano: { id: 'iced_americano', icon: '☕', name: '隔夜冰美式', desc: '暗黑特调核心配料之一' },
  paycut_contract: { id: 'paycut_contract', icon: '📄', name: '降薪协议', desc: '抱去高速碎纸机粉碎！' }
}

export const ZONES = [
  { name: '🍵 茶水间', c1: 1, r1: 1, c2: 5, r2: 4, color: '#edf7f1' },
  { name: '👑 总裁室', c1: 6, r1: 1, c2: 10, r2: 4, color: '#fdf2f2' },
  { name: '💻 牛马工位区', c1: 11, r1: 1, c2: 16, r2: 6, color: '#eff6ff' },
  { name: '🛗 电梯大厅 & 前台', c1: 1, r1: 5, c2: 11, r2: 11, color: '#f8fafc' },
  { name: '🚻 洗手间 & 走廊', c1: 12, r1: 7, c2: 16, r2: 11, color: '#fefce8' }
]

export function cellCenter(col, row) {
  return {
    x: MAP_X + col * TILE + TILE / 2,
    y: MAP_Y + row * TILE + TILE / 2
  }
}

export function worldToCell(x, y) {
  return {
    col: Math.max(0, Math.min(COLS - 1, Math.floor((x - MAP_X) / TILE))),
    row: Math.max(0, Math.min(ROWS - 1, Math.floor((y - MAP_Y) / TILE)))
  }
}

export function parseGrid(template) {
  const charMap = {
    '.': T_FLOOR,
    '#': T_WALL,
    ',': T_CARPET,
    H: T_HIDE,
    G: T_GLASS,
    D: T_GATE
  }
  return template.map(row => row.split('').map(ch => charMap[ch] ?? T_FLOOR))
}

// 支持5大室内布局变体 ('classic' | 'open_arena' | 'conference' | 'cubicle_maze' | 'vault_floor')
// 同时严格保留 Lv1~3 的经典地图细节，100% 兼容原有路径与视线单测
export function buildGrid(levelNum = 1, layout = null) {
  const raw = CAMPAIGN_LEVELS[levelNum] || CAMPAIGN_LEVELS[1]
  const targetLayout = layout || raw.layout || 'classic'

  if (!layout || targetLayout === raw.layout) {
    if (Array.isArray(raw.template) && raw.template.length === ROWS) {
      return parseGrid(raw.template)
    }
  }

  if (targetLayout === 'classic') {
    if (levelNum === 2) return parseGrid(LAYOUT_TEMPLATES.classic_2)
    if (levelNum === 3) return parseGrid(LAYOUT_TEMPLATES.classic_3)
    return parseGrid(LAYOUT_TEMPLATES.classic)
  }

  const tpl = LAYOUT_TEMPLATES[targetLayout] || raw.template || LAYOUT_TEMPLATES.classic
  return parseGrid(tpl)
}

function normalizeLevelConfig(raw) {
  const lvl = raw.level ?? raw.id ?? 1
  const spawn = raw.playerSpawn || raw.playerStart || { col: 8, row: 10 }
  const hints = Array.isArray(raw.hints) && raw.hints.length > 0 ? raw.hints : [raw.hint || raw.subtitle || '']
  return {
    ...raw,
    id: lvl,
    level: lvl,
    chapter: raw.chapter || Math.min(5, Math.ceil(lvl / 3.3)),
    mode: raw.mode || 'stealth',
    modeBadge: raw.modeBadge || '潜行摸鱼',
    title: raw.title || raw.name || `第${lvl}关`,
    name: raw.name || `第${lvl}关 · ${raw.title || ''}`,
    boss_quote: raw.boss_quote || raw.story || raw.subtitle || '',
    story: raw.story || raw.boss_quote || raw.subtitle || '',
    newMechanic: raw.newMechanic || `【${raw.modeBadge || '新玩法'}】${hints[0] || ''}`,
    subtitle: raw.subtitle || '',
    hint: raw.hint || `💡 ${hints.join(' ')}`,
    hints,
    objectives: raw.objectives || [],
    deadline: raw.deadline || 18 * 3600,
    timeLimit: raw.timeLimit || 45,
    parTime: raw.parTime || Math.round((raw.timeLimit || 45) * 0.6),
    cartonUses: raw.cartonUses ?? (raw.mode === 'stealth' ? 2 : 0),
    layout: raw.layout || 'classic',
    sceneTheme: raw.sceneTheme || 'full_office',
    sceneName: raw.sceneName || '全公司综合办公区全景',
    playerStart: { col: spawn.col, row: spawn.row },
    playerSpawn: { col: spawn.col, row: spawn.row },
    guards: raw.guards || [],
    snitches: raw.snitches || [],
    cameras: raw.cameras || [],
    pickups: raw.pickups || [],
    chairs: raw.chairs || [],
    objects: raw.objects || [],
    modeConfig: raw.modeConfig || {}
  }
}

export const LEVEL_CONFIGS = Object.fromEntries(
  Object.entries(CAMPAIGN_LEVELS).map(([k, v]) => [k, normalizeLevelConfig(v)])
)

export function formatClock(totalSec) {
  const s = Math.max(0, Math.floor(totalSec))
  const hh = String(Math.floor(s / 3600) % 24).padStart(2, '0')
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

export function createStealthGame(levelNum = 1) {
  const cfg = LEVEL_CONFIGS[levelNum] || LEVEL_CONFIGS[1]
  const mode = cfg.mode || 'stealth'
  const mc = cfg.modeConfig || {}
  const grid = buildGrid(cfg.level, cfg.layout)

  const pStart = cellCenter(cfg.playerStart.col, cfg.playerStart.row)
  const playerRole = mc.playerRole || 'worker'
  const ridingChairInit = Boolean(mc.ridingChair || mode === 'chair_derby')

  const player = {
    x: pStart.x,
    y: pStart.y,
    col: cfg.playerStart.col,
    row: cfg.playerStart.row,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    role: playerRole,
    ridingChair: ridingChairInit,
    stamina: 100,
    maxStamina: 100,
    sprinting: false,
    boosting: false,
    nitroTimer: 0,
    nitroCooldown: 0,
    swingTimer: 0,
    swingCooldown: 0,
    weapon: mode === 'desk_defense' ? 'keyboard' : 'pan',
    dashTimer: 0,
    dashCooldown: 0,
    hornTimer: 0,
    stunTimer: 0,
    bumpInvuln: 0,
    carton: false,
    cartonUses: cfg.cartonUses ?? 2,
    hideBlown: false,
    wasOnHide: false,
    isMoving: false,
    inventory: [], // Max 2 active items from ITEM_DEFS
    brewIngredients: [], // Lv6 dark brew 3-in-1 ingredients
    carryingContracts: 0, // Lv13 stacked paycut contracts
    contractsHeld: 0,
    carryingVault: false, // Lv14 bonus chest
    hasVaultBox: false,
    activeBuffTimer: 0, // iced coffee buff
    exhaustTimer: 0, // fan_switch odor suppression
    clockedIn: false,
    carryingTakeout: false,
    hasKeycard: false,
    hiding: false,
    path: [],
    pendingObjId: null,
    workObj: null,
    workProgress: 0,
    workDuration: 1.0,
    odorCooldown: 0,
    noiseCooldown: 0
  }

  const guards = cfg.guards.map((g, idx) => {
    const pos = cellCenter(g.start.col, g.start.row)
    return {
      ...g,
      x: pos.x,
      y: pos.y,
      col: g.start.col,
      row: g.start.row,
      dirAngle: Math.PI,
      fov: ((g.fovDeg || 78) * Math.PI) / 180,
      baseViewDist: g.viewDist || 200,
      state: 'patrol', // 'patrol' | 'investigate' | 'chase' | 'slipping' | 'stunned' | 'toilet_panic' | 'charge_prep' | 'charging'
      wpIndex: 0,
      waitTimer: 0.6,
      investigateTarget: null,
      investigateTimer: 0,
      chaseLoseTimer: 0,
      lastSeenX: pos.x,
      lastSeenY: pos.y,
      suspicion: 0,
      stunTimer: 0,
      slideVx: 0,
      slideVy: 0,
      path: [],
      repathTimer: 0,
      lastSeenAt: -10,
      wigLost: false,
      wigPos: null,
      defeated: false,
      enraged: false,
      carryingDoc: false,
      fireTimer: idx === 0 ? 0.65 : 1.35,
      pieTimer: 1.8,
      chargeTimer: 3.6,
      chargePrepTimer: 0,
      chargeActiveTimer: 0,
      chargeVx: 0,
      chargeVy: 0
    }
  })

  const cameras = cfg.cameras.map(c => {
    const pos = cellCenter(c.col, c.row)
    return {
      ...c,
      x: pos.x,
      y: pos.y,
      dirAngle: c.baseAngle,
      fov: (c.fovDeg * Math.PI) / 180,
      disabledTimer: 0,
      suspicion: 0,
      alertCooldown: 0
    }
  })

  const snitches = (cfg.snitches || []).map(sn => {
    const pos = cellCenter(sn.col, sn.row)
    return {
      ...sn,
      x: pos.x,
      y: pos.y,
      dirAngle: sn.angles[0],
      lookIndex: 0,
      lookTimer: sn.period,
      fov: (sn.fovDeg * Math.PI) / 180,
      suspicion: 0,
      alarmCooldown: 0,
      stunTimer: 0,
      distractTimer: 0
    }
  })

  const pickups = cfg.pickups.map(p => {
    const pos = cellCenter(p.col, p.row)
    return { ...p, x: pos.x, y: pos.y, collected: false }
  })

  const chairs = cfg.chairs.map(ch => {
    const pos = cellCenter(ch.col, ch.row)
    return {
      ...ch,
      x: pos.x,
      y: pos.y,
      homeX: pos.x,
      homeY: pos.y,
      vx: 0,
      vy: 0,
      sliding: false,
      lockedOnPad: false
    }
  })

  const objects = cfg.objects.map(o => {
    const pos = cellCenter(o.col, o.row)
    return { ...o, x: pos.x, y: pos.y }
  })

  // Moving water delivery cart cover
  const movingCart = (() => {
    if (cfg.movingCart && typeof cfg.movingCart === 'object') {
      const mcDef = cfg.movingCart
      const cPos = cellCenter(mcDef.col ?? 4, mcDef.row ?? 6)
      return {
        x: cPos.x,
        y: cPos.y,
        minX: cellCenter(mcDef.minCol ?? 3, mcDef.row ?? 6).x,
        maxX: cellCenter(mcDef.maxCol ?? 12, mcDef.row ?? 6).x,
        dir: mcDef.dir ?? 1,
        speed: mcDef.speed ?? 58
      }
    }
    if (cfg.hasCart) {
      return {
        x: cellCenter(4, 6).x,
        y: cellCenter(4, 6).y,
        minX: cellCenter(3, 6).x,
        maxX: cellCenter(12, 6).x,
        dir: 1,
        speed: 58
      }
    }
    return null
  })()

  // Mode-specific dynamic entity collections
  const projectiles = [] // { id, type: 'pot'|'pie', kind: 'black_pot'|'big_pie', x, y, vx, vy, radius, reflected, fromId, life }
  const coworkers = (mc.coworkers || []).map((cw, idx) => {
    const pos = cellCenter(cw.col, cw.row)
    const initSleep = [22, 46, 14, 52, 30, 8][idx % 6]
    const rate = (mc.sleepRateMin || 14) + ((idx * 3.7) % ((mc.sleepRateMax || 23) - (mc.sleepRateMin || 14) + 1))
    return {
      ...cw,
      x: pos.x,
      y: pos.y,
      sleepMeter: initSleep,
      sleepRate: rate,
      sleeping: initSleep >= 45,
      critical: false,
      caught: false,
      safeTimer: 0
    }
  })

  const hidingSpots = (mc.hidingSpots || []).map(hs => {
    const pos = cellCenter(hs.col, hs.row)
    return {
      ...hs,
      x: pos.x,
      y: pos.y,
      searched: false,
      revealed: false,
      opened: false,
      caught: false
    }
  })

  const invaders = [] // Lv12 desk_defense demand invaders
  const coffeePuddles = [] // Lv12 iced americano slow zones
  const soapPuddles = []
  const frogs = [] // { x, y, timer, soundTimer }
  const ripples = [] // { x, y, radius, maxRadius, kind: 'sound' | 'odor' | 'shock', life, maxLife }
  const events = [] // { type, text, x, y, at }

  let timeLeft = cfg.timeLimit
  let clock = 0
  let gameState = 'playing' // 'playing' | 'won' | 'lost'
  let failReason = ''
  let spottedCount = 0
  let bossPranked = 0
  let companyLoss = 0
  let statusText = cfg.subtitle

  let blackout = Boolean(mc.startInDarkness)
  let bossMaxHp = mc.bossMaxHp || 0
  let bossHp = bossMaxHp
  let bossPhase = bossMaxHp > 0 ? 1 : 0
  let deskMaxHp = mc.deskMaxHp || 0
  let deskHp = deskMaxHp

  let photoSnapped = false
  let windTimer = 0
  let wokenCount = 0
  let caughtCoworkers = 0
  let caughtSlackers = 0
  let shreddedCount = 0
  let hrStolenCount = 0
  let activatedPads = 0
  let vaultUnlocked = false
  let pulledSwitches = 0
  let respawnTimer = 0
  let invaderSpawnTimer = 0.45
  let invaderSeq = 0
  let projSeq = 0

  if (mode === 'desk_defense') {
    spawnInvaderWave(2)
  }

  function pushEvent(type, text, x, y) {
    events.push({ type, text, x, y, at: clock })
  }

  function spawnInvaderWave(count = 1) {
    const pts = mc.spawnPoints || [
      { col: 1, row: 3 },
      { col: 16, row: 3 },
      { col: 1, row: 9 },
      { col: 16, row: 9 }
    ]
    const types = mc.invaderTypes || [
      { role: 'pm', name: '提需求PM', tag: '改18版!', hp: 1, speed: 62 }
    ]
    for (let i = 0; i < count; i++) {
      const sp = pts[(invaderSeq + i) % pts.length]
      const tp = types[(invaderSeq + i) % types.length]
      const pos = cellCenter(sp.col, sp.row)
      invaderSeq++
      invaders.push({
        id: `inv_${invaderSeq}`,
        role: tp.role || 'pm',
        name: tp.name || '提需求PM',
        tag: tp.tag || '改18版!',
        label: tp.tag || '改18版!',
        x: pos.x,
        y: pos.y,
        col: sp.col,
        row: sp.row,
        angle: 0,
        speed: tp.speed || mc.invaderSpeed || 62,
        hp: tp.hp || 1,
        slowTimer: 0,
        dead: false,
        defeated: false
      })
    }
  }

  function isWalkBlocked(col, row, allowGate = false, smashGlass = false) {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return true
    const t = grid[row][col]
    if (t === T_WALL) return true
    if (t === T_GLASS) return !smashGlass
    if (t === T_GATE && !allowGate) return true
    return false
  }

  function isOpaqueTile(col, row) {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return true
    return grid[row][col] === T_WALL
  }

  function isPointBlocked(x, y, radius, allowGate, smashGlass = false) {
    const offsets = [
      [-radius, -radius],
      [radius, -radius],
      [-radius, radius],
      [radius, radius]
    ]
    for (const [ox, oy] of offsets) {
      const c = worldToCell(x + ox, y + oy)
      if (isWalkBlocked(c.col, c.row, allowGate, smashGlass)) return true
    }
    return false
  }

  function moveCircle(ent, dx, dy, speed, dt, allowGate) {
    if (dx === 0 && dy === 0) return false
    const len = Math.hypot(dx, dy)
    const nx = dx / len
    const ny = dy / len
    ent.angle = Math.atan2(ny, nx)
    if (ent.dirAngle !== undefined) {
      let diff = ent.angle - ent.dirAngle
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      ent.dirAngle += Math.sign(diff) * Math.min(Math.abs(diff), 9 * dt)
    }
    const dist = speed * dt
    const r = 13

    let moved = false
    const tryX = ent.x + nx * dist
    if (!isPointBlocked(tryX, ent.y, r, allowGate)) {
      ent.x = tryX
      moved = true
    } else if (Math.abs(ny) < 0.25) {
      const curRowY = cellCenter(0, worldToCell(ent.x, ent.y).row).y
      const nudge = Math.sign(curRowY - ent.y) * Math.min(Math.abs(curRowY - ent.y), dist * 0.7)
      if (nudge !== 0 && !isPointBlocked(ent.x, ent.y + nudge, r, allowGate)) {
        ent.y += nudge
      }
    }

    const tryY = ent.y + ny * dist
    if (!isPointBlocked(ent.x, tryY, r, allowGate)) {
      ent.y = tryY
      moved = true
    } else if (Math.abs(nx) < 0.25) {
      const curColX = cellCenter(worldToCell(ent.x, ent.y).col, 0).x
      const nudge = Math.sign(curColX - ent.x) * Math.min(Math.abs(curColX - ent.x), dist * 0.7)
      if (nudge !== 0 && !isPointBlocked(ent.x + nudge, ent.y, r, allowGate)) {
        ent.x += nudge
      }
    }

    const cell = worldToCell(ent.x, ent.y)
    ent.col = cell.col
    ent.row = cell.row
    return moved
  }

  function computeVisionPolygon(ox, oy, dirAngle, fov, maxDist, rayCount = 32) {
    const pts = [{ x: ox, y: oy }]
    const oc = worldToCell(ox, oy)
    const startA = dirAngle - fov / 2
    for (let i = 0; i <= rayCount; i++) {
      const a = startA + (fov * i) / rayCount
      const cos = Math.cos(a)
      const sin = Math.sin(a)
      let hitX = ox + cos * maxDist
      let hitY = oy + sin * maxDist
      for (let d = 8; d <= maxDist; d += 7) {
        const px = ox + cos * d
        const py = oy + sin * d
        const c = worldToCell(px, py)
        if (isOpaqueTile(c.col, c.row) && !(c.col === oc.col && c.row === oc.row)) {
          hitX = px
          hitY = py
          break
        }
        if (movingCart && Math.hypot(px - movingCart.x, py - movingCart.y) < 22) {
          hitX = px
          hitY = py
          break
        }
      }
      pts.push({ x: hitX, y: hitY })
    }
    return pts
  }

  function hasClearVisionRay(x1, y1, x2, y2) {
    const dist = Math.hypot(x2 - x1, y2 - y1)
    const steps = Math.ceil(dist / 7)
    const oc = worldToCell(x1, y1)
    for (let i = 1; i < steps; i++) {
      const t = i / steps
      const px = x1 + (x2 - x1) * t
      const py = y1 + (y2 - y1) * t
      const c = worldToCell(px, py)
      if (isOpaqueTile(c.col, c.row) && !(c.col === oc.col && c.row === oc.row)) return false
      if (movingCart && Math.hypot(px - movingCart.x, py - movingCart.y) < 22) return false
    }
    return true
  }

  function normalizeAngleDiff(a, b) {
    let diff = a - b
    while (diff > Math.PI) diff -= Math.PI * 2
    while (diff < -Math.PI) diff += Math.PI * 2
    return Math.abs(diff)
  }

  function canObserverSeePlayer(obs) {
    if (playerRole === 'boss') return false
    if (player.hiding) return false
    const dist = Math.hypot(player.x - obs.x, player.y - obs.y)
    if (player.carton && !player.isMoving && dist > 32) return false
    if (dist > obs.viewDist) return false
    const angToPlayer = Math.atan2(player.y - obs.y, player.x - obs.x)
    if (normalizeAngleDiff(angToPlayer, obs.dirAngle) > obs.fov / 2) return false
    return hasClearVisionRay(obs.x, obs.y, player.x, player.y)
  }

  function findGridPath(startCol, startRow, goalCol, goalRow, allowGate = false) {
    if (startCol === goalCol && startRow === goalRow) return []
    const q = [{ col: startCol, row: startRow, path: [] }]
    const visited = new Set([`${startCol},${startRow}`])
    const dirs = [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0]
    ]
    while (q.length > 0) {
      const cur = q.shift()
      for (const [dc, dr] of dirs) {
        const nc = cur.col + dc
        const nr = cur.row + dr
        const key = `${nc},${nr}`
        if (visited.has(key)) continue
        if (isWalkBlocked(nc, nr, allowGate)) continue
        const nextPath = [...cur.path, { col: nc, row: nr }]
        if (nc === goalCol && nr === goalRow) return nextPath
        visited.add(key)
        q.push({ col: nc, row: nr, path: nextPath })
      }
    }
    return []
  }

  function emitNoise(x, y, maxRadius, kind = 'sound', priorityLure = false) {
    ripples.push({ x, y, radius: 10, maxRadius, kind, life: 0.6, maxLife: 0.6 })
    if (mode === 'chair_derby' || mode === 'pot_pong' || mode === 'final_boss' || mode === 'be_the_boss' || mode === 'desk_defense') return
    if (priorityLure) {
      for (const sn of snitches) {
        if (sn.stunTimer <= 0 && Math.hypot(sn.x - x, sn.y - y) <= maxRadius) {
          sn.distractTimer = 3.2
          sn.dirAngle = Math.atan2(y - sn.y, x - sn.x)
        }
      }
    }
    for (const g of guards) {
      if (g.state === 'stunned' || g.state === 'slipping' || g.state === 'toilet_panic') continue
      if (mode === 'shredder_race' && g.id === 'hr_runner' && !priorityLure) continue
      const d = Math.hypot(g.x - x, g.y - y)
      if (d <= maxRadius && (priorityLure || g.state !== 'chase')) {
        const targetCell = worldToCell(x, y)
        g.state = 'investigate'
        g.investigateTarget = { x, y, col: targetCell.col, row: targetCell.row }
        g.investigateTimer = priorityLure ? 5.5 : 3.2
        g.path = findGridPath(g.col, g.row, targetCell.col, targetCell.row, true)
        g.thought =
          kind === 'odor'
            ? '🤢 哪来的螺蛳粉味？！谁敢偷吃？！'
            : priorityLure
              ? '❗ 怎么回事？！过去看看！'
              : '👂 什么动静？！过去看看！'
      }
    }
  }

  function damageBoss(amount, msg, eventType = 'reflect_hit') {
    if (bossMaxHp <= 0 || bossHp <= 0) return
    const boss = guards.find(g => g.role === 'boss') || guards[0]
    bossHp = Math.max(0, bossHp - amount)
    bossPranked += amount
    companyLoss += amount * 5500
    if (boss) {
      if (bossHp <= 0) {
        boss.wigLost = true
        boss.wigPos = { x: boss.x - 24, y: boss.y + 16 }
        boss.defeated = true
        boss.enraged = false
        boss.state = 'stunned'
        boss.stunTimer = 999
        projectiles.length = 0
        if (mode === 'pot_pong' || !mc.finisherRequired) {
          gameState = 'won'
          boss.thought = '🏳️ 别砸了别砸了！这黑锅我背还不行吗！！'
          statusText = '🎉 绝杀！王总被自己甩出的大黑锅砸得眼冒金星，彻底认怂！'
          pushEvent('wig_off', '🏆 击败甩锅王总！完美过关！', boss.x, boss.y - 30)
        } else {
          boss.thought = '🏳️ 别打了...假发都飞了...公司归你管...'
          statusText = '👑 王总9格血条清零瘫倒！快冲到他身边按主按钮拍下【📄炒老板鱿鱼通知书】！'
          pushEvent('wig_off', '💥 王总彻底瘫倒！快上前拍《炒鱿鱼通知书》！', boss.x, boss.y - 30)
        }
      } else {
        if (mode === 'final_boss') {
          bossPhase = bossHp <= 3 ? 3 : bossHp <= 6 ? 2 : 1
          boss.enraged = bossPhase >= 2
          if (bossHp <= 3 && !boss.wigLost) {
            boss.wigLost = true
            boss.wigPos = { x: boss.x + 24, y: boss.y - 12 }
          }
        }
        boss.thought = `😵 哎哟！！还剩 ${bossHp} 格血，气死我了！`
        pushEvent(eventType, msg || `💥 命中王总！剩余 ${bossHp}/${bossMaxHp} HP`, boss.x, boss.y - 28)
        statusText = `${msg || '💥 漂亮反击！'}（王总剩余血量 ${bossHp}/${bossMaxHp}）`
      }
    }
  }

  function toggleCarton() {
    if (gameState !== 'playing') return false
    if (player.ridingChair || playerRole === 'boss') return false
    if (!player.carton) {
      if (player.cartonUses <= 0) {
        statusText = '📦 纸箱用完了！只能靠走位、草丛和道具了！'
        pushEvent('warn', '📦 纸箱已用完', player.x, player.y - 24)
        return false
      }
      player.cartonUses--
    }
    player.carton = !player.carton
    player.workObj = null
    player.workProgress = 0
    pushEvent(
      'info',
      player.carton ? '📦 套上顺丰纸箱！(站定隐身)' : '📦 掀开纸箱',
      player.x,
      player.y - 24
    )
    statusText = player.carton
      ? '📦 已躲进快递纸箱！原地站住不动时老板扫过也发现不了你！'
      : '📦 已脱下纸箱，恢复正常潜行速度！'
    return true
  }

  function activateNitro() {
    if (gameState !== 'playing') return false
    if (player.nitroCooldown > 0) {
      statusText = `⏳ 氮气增压充能中（${player.nitroCooldown.toFixed(1)}s）！`
      return false
    }
    player.nitroTimer = mc.nitroDuration || 1.4
    player.nitroCooldown = mc.nitroCooldown || 2.1
    player.boosting = true
    const boostSpd = mc.nitroBoostSpeed || 335
    player.vx = Math.cos(player.angle) * boostSpd
    player.vy = Math.sin(player.angle) * boostSpd
    ripples.push({ x: player.x, y: player.y, radius: 8, maxRadius: 75, kind: 'shock', life: 0.35, maxLife: 0.35 })
    pushEvent('chair', '🚀 氮气尾焰全开！无敌冲撞！', player.x, player.y - 22)
    statusText = '🚀 氮气喷射狂飙中！撞碎一切加班合同山、投影仪与拦路保安！'
    return true
  }

  function activateDash() {
    if (gameState !== 'playing') return false
    if (player.dashCooldown > 0) return false
    player.dashTimer = 0.32
    player.dashCooldown = 1.15
    player.stamina = Math.min(player.maxStamina, player.stamina + 20)
    ripples.push({ x: player.x, y: player.y, radius: 6, maxRadius: 56, kind: 'shock', life: 0.3, maxLife: 0.3 })
    pushEvent('buff', '⚡ 极速闪身冲刺！', player.x, player.y - 20)
    return true
  }

  function triggerSecondaryAction() {
    if (gameState !== 'playing') return false
    if (mode === 'chair_derby') return activateNitro()
    if (cfg.cartonUses > 0 && ['stealth', 'prank_hunt', 'vault_heist', 'blackout_escape'].includes(mode)) {
      return toggleCarton()
    }
    return activateDash()
  }

  function spikeThermos(thermos) {
    thermos.spiked = true
    bossPranked++
    companyLoss += 2500
    pushEvent('prank', '🌶️ 已在保温壶注入暗黑泻药！', thermos.x, thermos.y - 24)
    statusText = '🌶️ 下药成功！王总马上口渴过来喝这口灵魂特调...'
    const boss = guards.find(g => g.role === 'boss')
    if (boss && boss.state !== 'stunned') {
      boss.state = 'investigate'
      boss.investigateTarget = { x: thermos.x, y: thermos.y, col: thermos.col, row: thermos.row, isThermos: true }
      boss.investigateTimer = 4.5
      boss.path = findGridPath(boss.col, boss.row, thermos.col, thermos.row, true)
      boss.thought = '🫖 嘶...喊累了，回屋喝口养生水润润嗓子...'
    }
  }

  function useInventoryItem(slotIdx = 0) {
    if (gameState !== 'playing') return false
    if (player.inventory.length === 0) {
      statusText = '🎒 背包空空的，快去地图上拾取【🧼洗洁精 / ☕冰美式 / 🐸青蛙】！'
      return false
    }
    const idx = Math.min(slotIdx, player.inventory.length - 1)
    const item = player.inventory[idx]

    if (item.id === 'laxative') {
      const thermos = objects.find(o => o.type === 'thermos')
      if (thermos && Math.hypot(player.x - thermos.x, player.y - thermos.y) < 62 && !thermos.spiked) {
        spikeThermos(thermos)
        player.inventory.splice(idx, 1)
        return true
      }
      statusText = '🌶️ 请走到【🫖王总保温壶】旁边再使用泻药！'
      return false
    }

    player.inventory.splice(idx, 1)

    if (item.id === 'soap') {
      soapPuddles.push({ x: player.x, y: player.y, col: player.col, row: player.row })
      pushEvent('soap', '🧼 地板涂满洗洁精!', player.x, player.y - 20)
      statusText = '🧼 已在脚下涂满滑溜洗洁精！引诱敌人踩上来劈叉滑飞！'
      return true
    }

    if (item.id === 'coffee') {
      player.activeBuffTimer = 4.5
      player.stamina = 100
      player.nitroCooldown = 0
      if (mode === 'desk_defense') {
        coffeePuddles.push({ x: player.x, y: player.y, radius: 46, life: 12.0 })
        pushEvent('buff', '☕ 泼洒冰美式减速滩 + 移速暴涨！', player.x, player.y - 24)
        statusText = '☕ 冰美式泼洒成功！经过的需求怪将被黏住大幅减速！'
      } else {
        pushEvent('buff', '☕ 咖啡因暴走！移速+55%！', player.x, player.y - 24)
        statusText = '☕ 干了这杯特浓冰美式！4.5秒内无限体力狂飙！'
      }
      return true
    }

    if (item.id === 'frog') {
      const tx = Math.max(MAP_X + TILE * 1.5, Math.min(MAP_X + MAP_W - TILE * 1.5, player.x + Math.cos(player.angle) * 105))
      const ty = Math.max(MAP_Y + TILE * 1.5, Math.min(MAP_Y + MAP_H - TILE * 1.5, player.y + Math.sin(player.angle) * 105))
      const dest = isPointBlocked(tx, ty, 10, false) ? { x: player.x, y: player.y } : { x: tx, y: ty }
      frogs.push({ x: dest.x, y: dest.y, timer: 5.0, soundTimer: 0.05 })
      pushEvent('lure', '🐸 抛出机械发条青蛙！', dest.x, dest.y - 20)
      statusText = '🐸 发条青蛙正在呱呱乱跳！附近的巡逻马上会被引过去！'
      return true
    }

    return false
  }

  function kickNearestChair() {
    const ch = chairs.find(c => !c.sliding && !c.lockedOnPad && Math.hypot(c.x - player.x, c.y - player.y) < 52)
    if (!ch) return false
    const dx = ch.x - player.x
    const dy = ch.y - player.y
    const useVec = Math.hypot(dx, dy) > 8 ? { x: dx, y: dy } : { x: Math.cos(player.angle), y: Math.sin(player.angle) }
    const spd = mode === 'vault_heist' ? 250 : 350
    if (Math.abs(useVec.x) >= Math.abs(useVec.y)) {
      ch.vx = Math.sign(useVec.x || 1) * spd
      ch.vy = 0
    } else {
      ch.vx = 0
      ch.vy = Math.sign(useVec.y || 1) * spd
    }
    ch.sliding = true
    pushEvent('chair', mode === 'vault_heist' ? '🪑 推动办公椅滑向重力板！' : '🪑 一脚踹飞人体工学椅！', ch.x, ch.y - 22)
    statusText = mode === 'vault_heist'
      ? '🪑 办公椅正在滑向重力感应板，压中即刻锁定解锁金库！'
      : '🪑 保龄球启动！滑轮转椅高速冲出，撞上敌人直接眼冒金星！'
    return true
  }
  function unlockAllGates(msg = '💳 刷卡成功！全司门禁闸机已打开！') {
    let unlocked = 0
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c] === T_GATE) {
          grid[r][c] = T_FLOOR
          unlocked++
        }
      }
    }
    if (unlocked > 0) {
      pushEvent('success', msg, player.x, player.y - 24)
    }
    return unlocked
  }

  function unlockGatesIfHasCard() {
    if (!player.hasKeycard) return
    const unlocked = unlockAllGates('💳 刷卡成功！全司门禁闸机已打开！')
    if (unlocked > 0) {
      statusText = '💳 全司门禁闸机已解锁！快冲进左下角【🛗 下班电梯】准点跑路！'
    }
  }

  function triggerBlackout() {
    if (blackout) return
    blackout = true
    for (const cam of cameras) {
      cam.disabledTimer = 999
      cam.suspicion = 0
    }
    const nightDist = mc.blackoutGuardViewDist || 92
    for (const g of guards) {
      g.viewDist = nightDist
      g.fov = (54 * Math.PI) / 180
      g.suspicion = 0
      if (g.state === 'chase') g.state = 'patrol'
      g.thought = '🌑 停电了？！快打开手电筒照着巡逻！'
    }
    const elev = objects.find(o => o.type === 'elevator_exit')
    if (elev) {
      elev.lockedUntilBlackout = false
      elev.unlocked = true
      elev.open = true
    }
    pushEvent('boom', '🌑 啪！！全公司拉闸断电！黄金电梯已解锁！', player.x, player.y - 26)
    statusText = '🌑 大停电达成！监控全灭、王总只剩手电筒光束，快借夜色冲进左下【🛗黄金电梯】！'
  }

  function smashDestructibleObject(obj) {
    if (!obj || obj.smashed || obj.done) return false
    obj.smashed = true
    obj.destroyed = true
    obj.done = true
    bossPranked++
    const isProj = obj.type === 'projector'
    companyLoss += isProj ? 12800 : 3200
    emitNoise(obj.x, obj.y, 180, 'shock', false)
    pushEvent(
      'smash',
      isProj ? `💥 砸烂【${obj.name}】！(+$12,800)` : `📚 撞碎【${obj.name}】！漫天纸花！`,
      obj.x,
      obj.y - 24
    )

    if (mode === 'chair_derby') {
      const targetTp = mc.targetType || 'contract_pile'
      const targetTotal = mc.targetCount || objects.filter(o => o.type === targetTp).length
      const smashedNow = objects.filter(o => o.type === targetTp && o.smashed).length
      if (smashedNow >= targetTotal) {
        gameState = 'won'
        statusText = isProj
          ? '🎉 3台洗脑8K投影仪全部干碎！全员大会当场解散下班！'
          : '🎉 8座周末加班合同山彻底粉碎！工位秋名山车神非你莫属！'
        pushEvent('success', '🏆 全场拆家目标达成！爽快通关！', player.x, player.y - 28)
      } else {
        statusText = `🚀 爽！已粉碎 ${smashedNow}/${targetTotal} 个目标，继续飙椅冲撞！`
      }
    }
    return true
  }

  function reflectProjectile(pr) {
    if (!pr || pr.reflected || pr.type === 'pie' || pr.type === 'big_pie') return false
    const boss = guards.find(g => g.role === 'boss') || guards[0]
    pr.reflected = true
    const spd = (mc.potSpeed || 195) * (mc.reflectSpeedMultiplier || 1.75)
    if (boss) {
      const dx = boss.x - pr.x
      const dy = boss.y - pr.y
      const len = Math.hypot(dx, dy) || 1
      pr.vx = (dx / len) * spd
      pr.vy = (dy / len) * spd
      player.angle = Math.atan2(dy, dx)
    } else {
      pr.vx = -pr.vx * 1.6
      pr.vy = -pr.vy * 1.6
    }
    pr.life = 4.0
    ripples.push({ x: pr.x, y: pr.y, radius: 8, maxRadius: 58, kind: 'shock', life: 0.3, maxLife: 0.3 })
    pushEvent('reflect_hit', '🍳 啪！！精准反扣黑锅直轰王总！', pr.x, pr.y - 20)
    return true
  }

  function swingWeapon() {
    if (player.swingCooldown > 0) return false
    player.swingTimer = mc.swingDuration || 0.3
    player.swingCooldown = mc.swingCooldown || mc.smackCooldown || 0.28

    if (mode === 'desk_defense') {
      player.weapon = 'keyboard'
      const rad = mc.smackRadius || 68
      let hitCount = 0
      for (const inv of invaders) {
        if (inv.dead || inv.defeated) continue
        if (Math.hypot(inv.x - player.x, inv.y - player.y) <= rad) {
          inv.dead = true
          inv.defeated = true
          hitCount++
          bossPranked++
          companyLoss += 900
          pushEvent('reflect_hit', `⌨️ 键盘拍飞【${inv.name}】！`, inv.x, inv.y - 22)
        }
      }
      statusText = hitCount > 0
        ? `⌨️ 机械键盘暴击拍飞 ${hitCount} 名需求怪！死守18:00下班线！`
        : '⌨️ 挥舞键盘！等需求怪靠近工位一拍一个准！'
      return true
    }

    // Pot reflection in pot_pong / final_boss
    player.weapon = 'pan'
    const rad = (mc.swingRadius || 68) + 10
    let reflectedAny = false
    for (const pr of projectiles) {
      if (!pr.reflected && pr.type !== 'pie' && Math.hypot(pr.x - player.x, pr.y - player.y) <= rad) {
        if (reflectProjectile(pr)) reflectedAny = true
      }
    }
    if (!reflectedAny) {
      statusText = '🍳 挥动平底锅！看准飞来的黑色铁锅靠近瞬间反拍！'
    }
    return true
  }

  function completeObjectInteraction(obj) {
    if (obj.type === 'microwave') {
      if (obj.cooldown > 0 || obj.timer > 0) return
      obj.timer = 2.0
      pushEvent('lure', '🔥 微波炉定时2秒：即将爆炸引怪！', obj.x, obj.y - 20)
      statusText = '🔥 已按下微波炉高火键！2秒后“叮！”一声巨响把王总骗进茶水间！'
    } else if (obj.type === 'phone') {
      if (obj.cooldown > 0) return
      obj.cooldown = 8.0
      emitNoise(obj.x, obj.y, 420, 'sound', true)
      pushEvent('lure', '☎️ 叮铃铃！内线电话响了！', obj.x, obj.y - 20)
      statusText = '☎️ 拨通了匿名引诱电话！巡逻正赶来接电话！'
    } else if (obj.type === 'clock_in') {
      if (player.clockedIn) return
      player.clockedIn = true
      obj.done = true
      emitNoise(obj.x, obj.y, 175, 'sound', false)
      pushEvent('success', '⏰ 滴！09:00:58 压哨打卡成功！', obj.x, obj.y - 24)
      statusText = '⏰ 打卡成功！！但机器“滴”了一声巨响！快逃回右上【💻7号工位】坐下装作早就到了！'
    } else if (obj.type === 'takeout') {
      if (player.carryingTakeout) return
      player.carryingTakeout = true
      obj.done = true
      pushEvent('success', '🍜 到手！顶级豪华加臭螺蛳粉！', obj.x, obj.y - 24)
      statusText = '🍜 拿到螺蛳粉了！臭味正在不断飘出引怪！快开【🌀换气扇】压味并带回右上【💻7号工位】开吃！'
    } else if (obj.type === 'fan_switch' || obj.type === 'industrial_fan' || obj.type === 'fanBlower') {
      if (obj.subtype === 'industrial_fan' || obj.id === 'fan_blower' || mc.subMode === 'wig_blow') {
        if (windTimer > 0 && obj.cooldown > 0) return
        const dur = mc.fanBlower?.activeDuration || 8.0
        windTimer = dur
        obj.cooldown = 2.0
        obj.active = true
        obj.blowing = true
        obj.dirAngle = 0
        emitNoise(obj.x + 120, obj.y, 260, 'sound', true)
        pushEvent('buff', '🌀 十级工业狂风启动！吹向右侧走廊！', obj.x, obj.y - 24)
        statusText = '🌀 强风带已开启！等王总走进第6行风口吹飞他的假发，再冲上去抓拍！'
        return
      }
      if (obj.cooldown > 0) return
      obj.cooldown = 12.0
      player.exhaustTimer = 12.0
      pushEvent('buff', '🌀 排风全开！(12秒无味)', obj.x, obj.y - 22)
      statusText = '🌀 排风开到最大！12秒内身上的螺蛳粉臭味完全不会引来老板！冲鸭！'
    } else if (obj.type === 'thermos') {
      if (mc.subMode === 'dark_brew') {
        if (obj.spiked) {
          statusText = '🫖 演讲杯已注入三合一暗黑特调，坐等王总上台喝水社死！'
          return
        }
        let addedNow = 0
        if (player.brewIngredients.length > 0) {
          addedNow += player.brewIngredients.length
          player.brewIngredients = []
        }
        const laxIdx = player.inventory.findIndex(it => it.id === 'laxative' || it.id === 'chili' || it.id === 'iced_americano')
        if (laxIdx !== -1) {
          player.inventory.splice(laxIdx, 1)
          addedNow++
        }
        if (addedNow > 0) {
          obj.ingredientsAdded = (obj.ingredientsAdded || 0) + addedNow
          const req = obj.requiredCount || mc.targetIngredients || 3
          if (obj.ingredientsAdded >= req) {
            spikeThermos(obj)
            statusText = '🧪 三合一暗黑特调大功告成！王总正走回讲台准备畅饮！！'
          } else {
            pushEvent('prank', `🧪 已投入配料 (${obj.ingredientsAdded}/${req})！`, obj.x, obj.y - 22)
            statusText = `🧪 已投入 ${obj.ingredientsAdded}/${req} 种配料！快去收集剩下的暗黑原料！`
          }
        } else {
          statusText = `🫖 王总演讲保温杯（当前配料 ${obj.ingredientsAdded || 0}/3），快去四角拾取辣椒素/冰美式/泻药！`
        }
        return
      }
      const laxIdx = player.inventory.findIndex(it => it.id === 'laxative')
      if (laxIdx !== -1 && !obj.spiked) {
        player.inventory.splice(laxIdx, 1)
        spikeThermos(obj)
      } else {
        statusText = obj.spiked ? '🫖 枸杞壶已加满魔鬼泻药，坐等王总喝！' : '🫖 王总最爱的枸杞保温壶，可惜身上没有【🌶️泻药】！'
      }
    } else if (obj.type === 'workstation') {
      if (mode === 'desk_defense') {
        statusText = `💻 黄金下班工位防线稳固（耐久 ${deskHp}/${deskMaxHp}），快拍飞靠近的需求怪！`
        return
      }
      if ((cfg.id === 1 || mc.requireClockIn) && !player.clockedIn) {
        statusText = '⚠️ 还没打卡呢！直接回工位月底全勤奖要扣光的，先去中间大厅刷【⏰考勤机】！'
        return
      }
      if ((cfg.id === 2 || mc.requireTakeout) && !player.carryingTakeout) {
        statusText = '⚠️ 螺蛳粉还没拿呢！先溜去左下角前台抢回【🍜螺蛳粉外卖】！'
        return
      }
      obj.done = true
      gameState = 'won'
      statusText =
        cfg.id === 1
          ? '🎉 压哨打卡+瞬间切出Excel假装加班，王总愣是一点破绽没看出来！'
          : '🎉 成功把螺蛳粉带回工位偷吃完毕还消灭了包装盒，真香！'
      pushEvent('success', '🎉 完美过关！', obj.x, obj.y - 26)
    } else if (obj.type === 'shredder') {
      if (player.carryingContracts > 0) {
        const count = player.carryingContracts
        player.carryingContracts = 0
        player.contractsHeld = 0
        shreddedCount += count
        bossPranked += count
        companyLoss += count * 4800
        const target = mc.targetShredCount || 6
        pushEvent('shred', `🗑️ 咔嚓粉碎 ${count} 份降薪协议！(${shreddedCount}/${target})`, obj.x, obj.y - 26)
        if (shreddedCount >= target) {
          gameState = 'won'
          statusText = `🎉 爽翻！${shreddedCount} 份《全员降薪协议》全部化作漫天纸屑，保住全员薪资！`
        } else {
          statusText = `🗑️ 粉碎成功（${shreddedCount}/${target}）！快继续抢在HR前面捡剩下的协议！`
        }
      } else {
        statusText = '🗑️ 高速碎纸机待命中！先去地上抱起【📄全员降薪协议】再来粉碎！'
      }
    } else if (obj.type === 'vault_box') {
      if (obj.done || obj.stolen) return
      obj.done = true
      obj.stolen = true
      obj.collected = true
      player.carryingVault = true
      player.hasVaultBox = true
      bossPranked++
      companyLoss += 1000000
      pushEvent('loot', '💎 夺回《百万年终奖宝箱》！快冲向左下电梯！', obj.x, obj.y - 26)
      statusText = '💎 年终奖到手！全员十三薪就在怀里，快冲进左下角【🛗直达电梯】撤离！'
    } else if (obj.type === 'power_switch') {
      if (obj.pulled || obj.done) return
      obj.pulled = true
      obj.done = true
      obj.off = true
      pulledSwitches++
      bossPranked++
      companyLoss += 2200
      emitNoise(obj.x, obj.y, 170, 'sound', false)
      const req = mc.requiredSwitches || 3
      pushEvent('success', `⚡ 拉断配电闸 (${pulledSwitches}/${req})！`, obj.x, obj.y - 24)
      if (pulledSwitches >= req) {
        triggerBlackout()
      } else {
        statusText = `⚡ 已拉断 ${pulledSwitches}/${req} 处电闸！继续前往下一处配电箱！`
      }
    } else if (obj.type === 'elevator_exit') {
      if (mode === 'vault_heist' && !player.carryingVault) {
        statusText = '⚠️ 还没拿到《百万年终奖宝箱》呢！先压住3块重力板打开顶层金库！'
        pushEvent('warn', '💎 先去金库拿年终奖！', obj.x, obj.y - 22)
        return
      }
      if (mode === 'blackout_escape' && !blackout) {
        statusText = `🔒 电梯门禁通电锁死中！先拉下全层 3 个【⚡总电闸】断电解锁（${pulledSwitches}/3）！`
        pushEvent('warn', '⚡ 需先拉下3处电闸！', obj.x, obj.y - 22)
        return
      }
      obj.done = true
      gameState = 'won'
      statusText =
        mode === 'vault_heist'
          ? '🎉 携百万年终奖潇洒乘梯撤离！打工人的血汗钱一分不少！'
          : mode === 'blackout_escape'
            ? '🎉 物理拉闸断电准点下班！王总还在黑夜里拿手电筒找人呢！'
            : '🎉 18:00 准点乘上电梯完美跑路！把老板的周末加班单撕得粉碎！'
      pushEvent('success', '🛗 准点下班跑路成功！', obj.x, obj.y - 26)
    } else if (obj.type === 'contract_pile' || obj.type === 'projector') {
      smashDestructibleObject(obj)
    }
  }

  function interactNearest() {
    if (gameState !== 'playing') return false
    const boss = guards.find(g => g.role === 'boss') || guards[0]

    // 1. Lv16 Final Boss Finisher: slap termination notice on defeated bald boss!
    if (mode === 'final_boss' && bossHp <= 0 && boss) {
      if (Math.hypot(boss.x - player.x, boss.y - player.y) <= 80) {
        boss.firedNotice = true
        bossPranked += 3
        companyLoss += 888888
        gameState = 'won'
        pushEvent('wig_off', '📄 啪！！《炒老板鱿鱼通知书》贴上王总脑门！', boss.x, boss.y - 32)
        statusText = '🏆 恭喜通关全16关！成功把画饼王总炒了鱿鱼，荣升反卷传奇！'
        return true
      }
    }

    // 2. Lv4 Prank Hunt: Snap embarrassing photo of bald Boss after wig blown off!
    if (mode === 'prank_hunt' && mc.requirePhotoSnap && boss && boss.wigLost) {
      if (Math.hypot(boss.x - player.x, boss.y - player.y) <= 78) {
        photoSnapped = true
        bossPranked += 2
        companyLoss += 8888
        gameState = 'won'
        pushEvent('wig_off', '📸 咔嚓！王总地中海反光社死照全司置顶！', boss.x, boss.y - 30)
        statusText = '🎉 抓拍成功！王总捂着亮晶晶的地中海连夜宣布取消早会！'
        return true
      }
    }

    // 3. Lv11 Be The Boss: Megaphone search hiding spots!
    if (mode === 'be_the_boss') {
      player.hornTimer = 0.35
      ripples.push({ x: player.x, y: player.y, radius: 10, maxRadius: 72, kind: 'shock', life: 0.35, maxLife: 0.35 })
      const rad = mc.hornRadius || 66
      const spot = hidingSpots
        .filter(hs => !hs.searched && Math.hypot(hs.x - player.x, hs.y - player.y) <= rad)
        .sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y))[0]
      if (!spot) {
        statusText = '📣 拿着大喇叭靠近微微发抖的纸箱、盆栽、桌底或隔间再按搜查！'
        return false
      }
      spot.searched = true
      spot.revealed = true
      spot.opened = true
      if (spot.hasSlacker) {
        spot.caught = true
        caughtSlackers++
        bossPranked++
        companyLoss += 1800
        const target = mc.targetSlackers || 7
        pushEvent('catch_slacker', `📣 揪出【${spot.slackerName}】！(${caughtSlackers}/${target})`, spot.x, spot.y - 26)
        if (caughtSlackers >= target) {
          gameState = 'won'
          statusText = `🎉 7名奇葩摸鱼员工全部捉拿归案！今天当王总实在太过瘾了！`
        } else {
          statusText = `📣 抓获【${spot.slackerName}】！还差 ${target - caughtSlackers} 个摸鱼怪，继续搜发抖掩体！`
        }
      } else {
        pushEvent('info', '💨 空掩体！换个冒小眼睛发抖的地方搜！', spot.x, spot.y - 20)
        statusText = `💨【${spot.name}】里没人！仔细看哪些掩体在微微发抖冒眼睛！`
      }
      return true
    }

    // 4. Lv10 Wake Coworkers: Slap sleepy coworker awake back to Excel!
    if (mode === 'wake_coworkers') {
      const wakeRad = mc.wakeInteractRadius || 64
      const sleepy = coworkers
        .filter(cw => !cw.caught && cw.sleepMeter > 5 && Math.hypot(cw.x - player.x, cw.y - player.y) <= wakeRad)
        .sort((a, b) => b.sleepMeter - a.sleepMeter)[0]
      if (sleepy) {
        sleepy.sleepMeter = 0
        sleepy.sleeping = false
        sleepy.critical = false
        sleepy.safeTimer = 4.2
        wokenCount++
        bossPranked++
        companyLoss += 600
        pushEvent('success', `👋 拍醒【${sleepy.name}】秒切Excel！`, sleepy.x, sleepy.y - 24)
        statusText = `👋 好险！【${sleepy.name}】瞬间切回绿色Excel报表，继续盯紧其他打瞌睡队友！`
        return true
      }
    }

    // 5. Lv7-8 Chair Derby: Smash nearby target or trigger Nitro Boost!
    if (mode === 'chair_derby') {
      const smashTarget = objects.find(
        o => (o.type === 'contract_pile' || o.type === 'projector') && !o.smashed && Math.hypot(o.x - player.x, o.y - player.y) <= 56
      )
      if (smashTarget) {
        smashDestructibleObject(smashTarget)
      }
      return activateNitro() || Boolean(smashTarget)
    }

    // 6. Lv9 Pot Pong & Lv16 Final Boss: Pan Swing (or kick chair if right next to chair & no pot super close)
    if (mode === 'pot_pong' || mode === 'final_boss') {
      const potNear = projectiles.some(pr => !pr.reflected && pr.type !== 'pie' && Math.hypot(pr.x - player.x, pr.y - player.y) <= 76)
      if (!potNear && kickNearestChair()) return true
      return swingWeapon()
    }

    // 7. Lv12 Desk Defense: Kick rolling chair OR swing keyboard to smack invaders!
    if (mode === 'desk_defense') {
      if (kickNearestChair()) return true
      return swingWeapon()
    }

    // 8. Lv13 Shredder Race: Prioritize feeding shredder when holding contracts!
    if (mode === 'shredder_race' && player.carryingContracts > 0) {
      const nearShredder = objects.find(o => o.type === 'shredder' && Math.hypot(o.x - player.x, o.y - player.y) <= 60)
      if (nearShredder) {
        completeObjectInteraction(nearShredder)
        return true
      }
    }

    // 9. Standard rolling chair kick
    if (kickNearestChair()) return true

    // 10. Interactive object within 56px
    const near = objects
      .filter(o => o.type !== 'pressure_pad' && o.type !== 'archive_cabinet')
      .map(o => ({ o, d: Math.hypot(o.x - player.x, o.y - player.y) }))
      .filter(entry => entry.d <= 56)
      .sort((a, b) => a.d - b.d)[0]?.o

    if (!near) {
      statusText = '附近没有可互动的目标！靠近机器、转椅或任务点再按主按钮！'
      return false
    }

    if (near.type === 'clock_in' && !player.clockedIn) {
      player.workObj = near
      player.workProgress = 0
      player.workDuration = 0.85
      statusText = '⏳ 正在人脸识别打卡中（0.85秒）...千万稳住别被看到！'
      return true
    }

    if (
      near.type === 'workstation' &&
      mode === 'stealth' &&
      ((cfg.id === 1 && player.clockedIn) || (cfg.id === 2 && player.carryingTakeout))
    ) {
      player.workObj = near
      player.workProgress = 0
      player.workDuration = 0.55
      statusText = '💻 正在迅速打开Excel表格伪装努力工作...'
      return true
    }

    completeObjectInteraction(near)
    return true
  }

  function commandMoveTo(wx, wy, objId = null) {
    if (gameState !== 'playing') return false
    if (mode === 'chair_derby') {
      player.angle = Math.atan2(wy - player.y, wx - player.x)
      player.vx = Math.cos(player.angle) * (mc.baseChairSpeed || 195)
      player.vy = Math.sin(player.angle) * (mc.baseChairSpeed || 195)
      return true
    }
    const c = worldToCell(wx, wy)
    const allowGate = player.hasKeycard || vaultUnlocked
    const path = findGridPath(player.col, player.row, c.col, c.row, allowGate)
    if (path.length > 0) {
      player.path = path
      player.pendingObjId = objId || 'auto'
      return true
    }
    if (objId) {
      const obj =
        objects.find(o => o.id === objId) ||
        hidingSpots.find(h => h.id === objId) ||
        coworkers.find(cw => cw.id === objId)
      if (obj && Math.hypot(obj.x - player.x, obj.y - player.y) <= 62) {
        interactNearest()
        return true
      }
    }
    if (grid[c.row]?.[c.col] === T_GATE && !allowGate) {
      statusText = mode === 'vault_heist'
        ? '🚧 金库电门紧锁！先把大厅 3 把办公椅推上【🟩重力感应板】解锁！'
        : '🚧 前方门禁闸机已锁定！去总裁室拿【💳门禁卡】，或给王总下泻药逼他掉卡！'
    }
    return false
  }
  function checkPressurePads() {
    if (mode !== 'vault_heist') return
    const snapR = mc.padSnapRadius || 36
    let count = 0
    for (const pad of objects) {
      if (pad.type !== 'pressure_pad') continue
      if (!pad.activated) {
        const hitChair = chairs.find(ch => Math.hypot(ch.x - pad.x, ch.y - pad.y) <= snapR)
        if (hitChair) {
          hitChair.x = pad.x
          hitChair.y = pad.y
          hitChair.vx = 0
          hitChair.vy = 0
          hitChair.sliding = false
          hitChair.lockedOnPad = true
          pad.activated = true
          pad.pressed = true
          pad.active = true
          pad.done = true
          bossPranked++
          companyLoss += 3000
          pushEvent('success', `🟩 咔哒！【${pad.name}】已压住锁定！`, pad.x, pad.y - 24)
        }
      }
      if (pad.activated) count++
    }
    activatedPads = count
    const req = mc.requiredPads || 3
    if (!vaultUnlocked && activatedPads >= req) {
      vaultUnlocked = true
      unlockAllGates('🔓 三块重力感应板全部激活！顶层金库激光闸门已打开！')
      statusText = '🔓 金库大门已敞开！快冲进上方金库抱走【💎百万年终奖宝箱】！'
    }
  }

  function updatePickupsAndFrogs(dt) {
    for (const pk of pickups) {
      if (pk.collected) continue
      if (Math.hypot(pk.x - player.x, pk.y - player.y) < 30) {
        if (pk.type === 'keycard') {
          pk.collected = true
          player.hasKeycard = true
          unlockGatesIfHasCard()
        } else if (pk.type === 'paycut_contract' || pk.type === 'contract') {
          const maxCarry = mc.maxCarry || 3
          if (player.carryingContracts < maxCarry) {
            pk.collected = true
            player.carryingContracts++
            player.contractsHeld = player.carryingContracts
            pushEvent('loot', `📄 抢到降薪协议 (怀抱 ${player.carryingContracts}/${maxCarry})`, pk.x, pk.y - 18)
            statusText = `📄 已抱起 ${player.carryingContracts} 份降薪协议！快冲向【🗑️高速碎纸机】粉碎！`
          } else {
            statusText = `📄 怀里已抱满 ${maxCarry} 份协议！先塞进【🗑️高速碎纸机】再来捡！`
          }
        } else if (mc.subMode === 'dark_brew' && ['chili', 'iced_americano', 'laxative'].includes(pk.type)) {
          pk.collected = true
          player.brewIngredients.push(pk.type)
          const def = ITEM_DEFS[pk.type] || { icon: pk.icon || '🧪', name: pk.name || '特调配料' }
          pushEvent('loot', `🧪 获得特调原料：${def.icon} ${def.name}`, pk.x, pk.y - 18)
          statusText = `🧪 已拿到【${def.name}】！快去上方舞台注入【🫖王总演讲保温杯】！`
        } else if (mode === 'chair_derby' && pk.type === 'coffee') {
          pk.collected = true
          player.activeBuffTimer = 4.5
          player.nitroCooldown = 0
          player.nitroTimer = Math.max(player.nitroTimer, 1.4)
          pushEvent('buff', '☕ 氮气瞬满！冰美式狂飙加速！', pk.x, pk.y - 20)
        } else if (player.inventory.length < 2 && ITEM_DEFS[pk.type]) {
          pk.collected = true
          player.inventory.push(ITEM_DEFS[pk.type])
          pushEvent('loot', `拾取 ${ITEM_DEFS[pk.type].icon} ${ITEM_DEFS[pk.type].name}`, pk.x, pk.y - 18)
          statusText = `🎒 获得【${ITEM_DEFS[pk.type].icon} ${ITEM_DEFS[pk.type].name}】：${ITEM_DEFS[pk.type].desc}`
        }
      }
    }

    // Lv4 Industrial Fan Wind Zone -> Blow off Boss's Wig!
    if (windTimer > 0) {
      windTimer = Math.max(0, windTimer - dt)
      const fanObj = objects.find(o => o.id === (mc.fanBlower?.objectId || 'fan_blower') || o.subtype === 'industrial_fan')
      if (fanObj) {
        const rangePx = mc.fanBlower?.rangePx || 245
        const dirX = mc.fanBlower?.dirX ?? 1
        for (const g of guards) {
          if (g.role !== 'boss' || g.wigLost) continue
          const relX = (g.x - fanObj.x) * (dirX || 1)
          const relY = Math.abs(g.y - fanObj.y)
          if (relX >= -12 && relX <= rangePx && relY <= 38) {
            g.wigLost = true
            g.wigPos = { x: Math.min(MAP_X + MAP_W - 32, g.x + 52), y: g.y - 8 }
            g.state = 'stunned'
            g.stunTimer = mc.fanBlower?.wigStunDuration || 8.5
            g.suspicion = 0
            bossPranked++
            companyLoss += 5000
            g.thought = '😱 哇啊啊我的9块9包邮假发飞啦！！别拍我！！'
            pushEvent('wig_off', '💨 狂风吹飞王总假发！快冲上去【📸抓拍社死照】！', g.x, g.y - 28)
            statusText = '📸 王总秃头反光捂脸眩晕中！快跑到王总身边按主按钮【📸抓拍秃头】过关！'
          }
        }
        if (windTimer <= 0) {
          fanObj.active = false
          fanObj.blowing = false
        }
      }
    }

    // Update ticking microwave timers & cooldowns
    for (const obj of objects) {
      if (obj.cooldown > 0) obj.cooldown = Math.max(0, obj.cooldown - dt)
      if (obj.type === 'microwave' && obj.timer > 0) {
        obj.timer -= dt
        if (obj.timer <= 0) {
          obj.timer = 0
          obj.cooldown = 10.0
          emitNoise(obj.x, obj.y, 520, 'sound', true)
          pushEvent('boom', '💥 叮！！微波炉爆米花炸炉啦！', obj.x, obj.y - 24)
          statusText = '💥 微波炉炸炉巨响！王总气冲冲往茶水间赶去了，趁现在行动！'
        }
      }
    }

    // Update wind-up frogs
    for (let i = frogs.length - 1; i >= 0; i--) {
      const f = frogs[i]
      f.timer -= dt
      f.soundTimer -= dt
      if (f.soundTimer <= 0) {
        f.soundTimer = 1.25
        emitNoise(f.x, f.y, 285, 'sound', true)
      }
      if (f.timer <= 0) frogs.splice(i, 1)
    }

    // Update coffee slow puddles
    for (let i = coffeePuddles.length - 1; i >= 0; i--) {
      coffeePuddles[i].life -= dt
      if (coffeePuddles[i].life <= 0) coffeePuddles.splice(i, 1)
    }

    // Update sliding rolling chairs!
    for (const ch of chairs) {
      if (!ch.sliding) continue
      const nx = ch.x + ch.vx * dt
      const ny = ch.y + ch.vy * dt
      for (const sn of snitches) {
        if (sn.stunTimer > 0) continue
        if (Math.hypot(sn.x - nx, sn.y - ny) < 28) {
          sn.stunTimer = 7
          sn.suspicion = 0
          bossPranked++
          companyLoss += 1200
          pushEvent('prank', `🪑 转椅撞翻 ${sn.name}！(7秒没法告密)`, sn.x, sn.y - 28)
          ch.vx *= 0.35
          ch.vy *= 0.35
        }
      }
      // Bowl over invaders in Lv12 desk_defense!
      for (const inv of invaders) {
        if (inv.dead || inv.defeated) continue
        if (Math.hypot(inv.x - nx, inv.y - ny) < 30) {
          inv.dead = true
          inv.defeated = true
          bossPranked++
          companyLoss += 1200
          pushEvent('smash', `🪑 保龄球撞飞【${inv.name}】！`, inv.x, inv.y - 22)
        }
      }
      // Collision with guards
      for (const g of guards) {
        if (g.state === 'stunned' && mode !== 'final_boss') continue
        if (Math.hypot(g.x - nx, g.y - ny) < 28) {
          if (mode === 'final_boss' && g.role === 'boss') {
            if (bossHp > 0) {
              g.state = 'stunned'
              g.stunTimer = 1.6
              damageBoss(mc.chairHitDamage || 1, '🪑 旋转椅暴击王总！HP -1', 'smash')
            }
            ch.vx = 0
            ch.vy = 0
            ch.sliding = false
            break
          }
          g.state = 'stunned'
          g.stunTimer = 5.5
          g.suspicion = 0
          bossPranked++
          companyLoss += 2800
          if (g.carryingDoc) {
            g.carryingDoc = false
            pickups.push({
              id: `dropped_doc_${clock.toFixed(2)}`,
              type: 'paycut_contract',
              name: '掉落的降薪协议',
              icon: '📄',
              col: g.col,
              row: g.row,
              x: g.x,
              y: g.y,
              collected: false
            })
            pushEvent('loot', '📄 HR被撞晕，降薪协议掉出来了！', g.x, g.y - 36)
          }
          g.thought = '💫 哎哟！！谁的转椅把我撞飞了？！'
          pushEvent('prank', `🪑 转椅暴击撞晕 ${g.name}！(+$2800损毁)`, g.x, g.y - 28)
          statusText = `💥 漂亮！转椅保龄球精准撞晕了 ${g.name}！`
          ch.vx *= 0.35
          ch.vy *= 0.35

          if (mode === 'prank_hunt' && mc.subMode === 'bowling_blitz' && bossPranked >= (mc.targetPranks || 3)) {
            gameState = 'won'
            statusText = `🎉 连环保龄球 ${bossPranked}/${mc.targetPranks} 次达成！王总巡视团全员人仰马翻！`
            return
          }
        }
      }

      if (!ch.sliding) continue
      if (!isPointBlocked(nx, ny, 12, true)) {
        ch.x = nx
        ch.y = ny
        checkPressurePads()
      } else {
        ch.vx = 0
        ch.vy = 0
        ch.sliding = false
        emitNoise(ch.x, ch.y, 180, 'sound', false)
      }
    }

    // Periodic tactical supply & chair respawns for action levels
    if (
      (mode === 'prank_hunt' && mc.respawnSoap) ||
      mode === 'desk_defense' ||
      mode === 'final_boss'
    ) {
      respawnTimer += dt
      const interval = mc.respawnSoapInterval || mc.respawnChairInterval || 6.0
      if (respawnTimer >= interval) {
        respawnTimer = 0
        for (const pk of pickups) {
          if (pk.collected && (pk.type === 'soap' || pk.type === 'coffee')) {
            pk.collected = false
          }
        }
        for (const ch of chairs) {
          if (!ch.sliding && !ch.lockedOnPad) {
            ch.x = ch.homeX
            ch.y = ch.homeY
          }
        }
      }
    }

    // Update ripples
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rp = ripples[i]
      rp.life -= dt
      rp.radius = rp.maxRadius * (1 - rp.life / rp.maxLife)
      if (rp.life <= 0) ripples.splice(i, 1)
    }
  }

  function spawnProjectile(fromGuard, type = 'pot', angleOffset = 0, speedOverride = 0) {
    const baseAng = Math.atan2(player.y - fromGuard.y, player.x - fromGuard.x) + angleOffset
    const spd = speedOverride || mc.potSpeed || (type === 'pie' ? 175 : 195)
    projSeq++
    projectiles.push({
      id: `proj_${projSeq}`,
      type,
      kind: type === 'pie' ? 'big_pie' : 'black_pot',
      x: fromGuard.x + Math.cos(baseAng) * 18,
      y: fromGuard.y + Math.sin(baseAng) * 18,
      vx: Math.cos(baseAng) * spd,
      vy: Math.sin(baseAng) * spd,
      radius: type === 'pie' ? 16 : 15,
      reflected: false,
      fromId: fromGuard.id,
      life: 5.5
    })
  }

  function updateProjectilesAndBossCombat(dt) {
    if (mode !== 'pot_pong' && mode !== 'final_boss') return

    // Active pan swing auto-reflects incoming pots entering arc!
    if (player.swingTimer > 0) {
      const rad = (mc.swingRadius || 68) + 8
      for (const pr of projectiles) {
        if (!pr.reflected && pr.type !== 'pie' && Math.hypot(pr.x - player.x, pr.y - player.y) <= rad) {
          reflectProjectile(pr)
        }
      }
    }

    const boss = guards.find(g => g.role === 'boss') || guards[0]

    // Spawn projectiles in pot_pong
    if (mode === 'pot_pong' && bossHp > 0) {
      for (const g of guards) {
        if (g.state === 'stunned') continue
        g.fireTimer -= dt
        if (g.fireTimer <= 0) {
          g.fireTimer = g.role === 'boss' ? mc.fireInterval || 1.35 : mc.helperFireInterval || 2.4
          g.dirAngle = Math.atan2(player.y - g.y, player.x - g.x)
          spawnProjectile(g, 'pot', 0, mc.potSpeed || 195)
          g.thought = g.role === 'boss' ? '💣 看锅！线上崩盘全怪你！' : '💣 这锅我不背，甩给你！'
        }
      }
    }

    // Spawn multi-phase attacks in Lv16 final_boss
    if (mode === 'final_boss' && boss && bossHp > 0 && boss.state !== 'stunned') {
      const phases = mc.phases || [
        { phase: 1, minHp: 7, potInterval: 1.4, pieInterval: 2.6, pieSpread: 3, chargeInterval: 0 },
        { phase: 2, minHp: 4, potInterval: 1.2, pieInterval: 2.1, pieSpread: 4, chargeInterval: 5.2, chargeSpeed: 245 },
        { phase: 3, minHp: 1, potInterval: 0.95, pieInterval: 1.7, pieSpread: 5, chargeInterval: 4.0, chargeSpeed: 275 }
      ]
      const pCfg = phases.find(p => bossHp >= p.minHp) || phases[phases.length - 1]
      bossPhase = pCfg.phase

      if (boss.state === 'charge_prep') {
        boss.chargePrepTimer -= dt
        boss.dirAngle = Math.atan2(boss.chargeVy, boss.chargeVx)
        if (boss.chargePrepTimer <= 0) {
          boss.state = 'charging'
          boss.chargeActiveTimer = 1.25
          pushEvent('warn', '💢 王总红温暴走冲锋！引他撞两侧碎纸机！', boss.x, boss.y - 28)
        }
      } else if (boss.state === 'charging') {
        boss.chargeActiveTimer -= dt
        const nx = boss.x + boss.chargeVx * dt
        const ny = boss.y + boss.chargeVy * dt
        // Check collision with shredder trap!
        const hitShredder = objects.find(o => o.type === 'shredder' && Math.hypot(o.x - nx, o.y - ny) < 38)
        if (hitShredder) {
          boss.state = 'stunned'
          boss.stunTimer = 2.6
          damageBoss(mc.shredderTrapDamage || 2, '🗑️ 王总一头栽进碎纸机！领带被绞狂扣 2 HP！！', 'shred')
        } else if (!isPointBlocked(nx, ny, 14, true)) {
          boss.x = nx
          boss.y = ny
          const bc = worldToCell(nx, ny)
          boss.col = bc.col
          boss.row = bc.row
          if (Math.hypot(boss.x - player.x, boss.y - player.y) < 28 && player.dashTimer <= 0 && player.bumpInvuln <= 0) {
            player.bumpInvuln = 1.1
            timeLeft = Math.max(0.5, timeLeft - 2.0)
            pushEvent('warn', '💥 被红温王总撞飞！-2秒！', player.x, player.y - 24)
          }
        } else {
          boss.state = 'stunned'
          boss.stunTimer = 1.5
          boss.thought = '💫 咚！！撞墙脑瓜子嗡嗡的...'
        }
        if (boss.state === 'charging' && boss.chargeActiveTimer <= 0) {
          boss.state = 'patrol'
        }
      } else {
        // Normal phase firing
        boss.fireTimer -= dt
        if (boss.fireTimer <= 0) {
          boss.fireTimer = pCfg.potInterval || 1.25
          spawnProjectile(boss, 'pot', 0, 205)
        }
        boss.pieTimer -= dt
        if (boss.pieTimer <= 0) {
          boss.pieTimer = pCfg.pieInterval || 2.2
          const spread = pCfg.pieSpread || 3
          for (let i = 0; i < spread; i++) {
            const off = (i - (spread - 1) / 2) * 0.28
            spawnProjectile(boss, 'pie', off, 165)
          }
          boss.thought = '🫓 吃我十万吨感恩大饼弹幕！！'
        }
        if (pCfg.chargeInterval > 0) {
          boss.chargeTimer -= dt
          if (boss.chargeTimer <= 0) {
            boss.chargeTimer = pCfg.chargeInterval
            const ang = Math.atan2(player.y - boss.y, player.x - boss.x)
            const cSpd = pCfg.chargeSpeed || 255
            boss.chargeVx = Math.cos(ang) * cSpd
            boss.chargeVy = Math.sin(ang) * cSpd
            boss.state = 'charge_prep'
            boss.chargePrepTimer = 0.55
            boss.thought = '💢 红温蓄力！！我要创飞你！！'
          }
        }
      }
    }

    // Move projectiles & check hits
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const pr = projectiles[i]
      if (!pr) continue
      pr.life -= dt
      if (pr.life <= 0) {
        projectiles.splice(i, 1)
        continue
      }

      // Gentle homing on reflected pots so player's counter-swings feel ultra-satisfying
      if (pr.reflected && boss && bossHp > 0) {
        const curSpd = Math.hypot(pr.vx, pr.vy) || 320
        const toBossX = boss.x - pr.x
        const toBossY = boss.y - pr.y
        const d = Math.hypot(toBossX, toBossY) || 1
        pr.vx = pr.vx * 0.88 + (toBossX / d) * curSpd * 0.12
        pr.vy = pr.vy * 0.88 + (toBossY / d) * curSpd * 0.12
      }

      pr.x += pr.vx * dt
      pr.y += pr.vy * dt

      const c = worldToCell(pr.x, pr.y)
      if (c.col <= 0 || c.col >= COLS - 1 || c.row <= 0 || c.row >= ROWS - 1 || grid[c.row]?.[c.col] === T_WALL) {
        projectiles.splice(i, 1)
        continue
      }

      if (pr.reflected) {
        if (boss && bossHp > 0 && Math.hypot(pr.x - boss.x, pr.y - boss.y) < 32) {
          projectiles.splice(i, 1)
          damageBoss(mc.reflectPotDamage || 1, '🍳 黑锅暴击扣在王总头上！HP -1', 'reflect_hit')
          if (gameState !== 'playing') return
          if (bossHp <= 0) break
          continue
        }
        for (const g of guards) {
          if (g === boss || g.state === 'stunned') continue
          if (Math.hypot(pr.x - g.x, pr.y - g.y) < 26) {
            g.state = 'stunned'
            g.stunTimer = 3.2
            g.thought = '😵 哎哟！怎么连我也砸！'
          }
        }
      } else {
        if (Math.hypot(pr.x - player.x, pr.y - player.y) < 22) {
          if (pr.type !== 'pie' && player.swingTimer > 0) {
            reflectProjectile(pr)
            continue
          }
          if (player.dashTimer > 0 || player.bumpInvuln > 0) continue
          projectiles.splice(i, 1)
          player.stunTimer = mc.playerStunOnHit || 0.45
          player.bumpInvuln = 0.8
          spottedCount++
          const pen = mc.timePenaltyOnHit || 1.8
          timeLeft = Math.max(0.5, timeLeft - pen)
          pushEvent(
            'warn',
            pr.type === 'pie' ? `🫓 被大饼弹幕砸中！-${pen}秒` : `💣 惨遭扣黑锅！-${pen}秒（看准按反拍！）`,
            player.x,
            player.y - 24
          )
        }
      }
    }
  }

  function updateWakeCoworkers(dt) {
    if (mode !== 'wake_coworkers') return
    const boss = guards.find(g => g.role === 'boss') || guards[0]
    for (const cw of coworkers) {
      if (cw.caught) continue
      if (cw.safeTimer > 0) {
        cw.safeTimer = Math.max(0, cw.safeTimer - dt)
        cw.sleeping = false
        cw.critical = false
        continue
      }
      cw.sleepMeter = Math.min(100, cw.sleepMeter + cw.sleepRate * dt)
      cw.sleeping = cw.sleepMeter >= 45
      cw.critical = cw.sleepMeter >= 100

      // Boss catches coworker whose sleepMeter reached 100!
      if (cw.sleepMeter >= 100 && boss && boss.state !== 'stunned' && boss.state !== 'slipping') {
        const dist = Math.hypot(boss.x - cw.x, boss.y - cw.y)
        if (dist < 64 || (dist < 165 && hasClearVisionRay(boss.x, boss.y, cw.x, cw.y))) {
          cw.caught = true
          cw.sleeping = false
          caughtCoworkers++
          spottedCount++
          const maxAllowed = mc.maxCaughtAllowed ?? 2
          boss.thought = `😡 抓到了！！${cw.name} 居然敢上班${cw.slackingType}！`
          pushEvent('warn', `🚨 ${cw.name} 被抓现行！(${caughtCoworkers}/${maxAllowed + 1})`, cw.x, cw.y - 26)
          statusText = `🚨 糟了！【${cw.name}】摸鱼被王总当场抓包（已抓 ${caughtCoworkers} 人，超过 ${maxAllowed} 人即失败）！`
          if (caughtCoworkers > maxAllowed) {
            gameState = 'lost'
            failReason = `部门累计 ${caughtCoworkers} 名同事摸鱼被王总抓现行，全组惨遭团灭通报！`
            statusText = `🚨 失败！${failReason}`
            return
          }
        }
      }
    }
  }

  function updateDeskDefense(dt) {
    if (mode !== 'desk_defense') return
    const desk = objects.find(o => o.id === 'golden_desk' || o.type === 'workstation')
    if (!desk) return

    invaderSpawnTimer -= dt
    if (invaderSpawnTimer <= 0) {
      const progressRatio = 1 - timeLeft / (cfg.timeLimit || 45)
      invaderSpawnTimer = Math.max(1.25, (mc.spawnInterval || 2.2) - progressRatio * 0.7)
      spawnInvaderWave(1)
    }

    for (const inv of invaders) {
      if (inv.dead || inv.defeated) continue
      // Check soap puddle slip!
      const sIdx = soapPuddles.findIndex(sp => Math.hypot(sp.x - inv.x, sp.y - inv.y) < 24)
      if (sIdx !== -1) {
        soapPuddles.splice(sIdx, 1)
        inv.dead = true
        inv.defeated = true
        bossPranked++
        companyLoss += 1100
        pushEvent('prank', `🧼 ${inv.name} 踩肥皂滑出办公室！`, inv.x, inv.y - 22)
        continue
      }

      // Check coffee puddle slow!
      const inCoffee = coffeePuddles.some(cp => Math.hypot(cp.x - inv.x, cp.y - inv.y) <= (cp.radius || 46))
      inv.slowTimer = inCoffee ? 0.4 : Math.max(0, (inv.slowTimer || 0) - dt)
      const spd = inv.speed * (inv.slowTimer > 0 ? 0.38 : 1.0)

      const dx = desk.x - inv.x
      const dy = desk.y - inv.y
      const dist = Math.hypot(dx, dy) || 1
      inv.angle = Math.atan2(dy, dx)
      if (!moveCircle(inv, dx, dy, spd, dt, true)) {
        inv.x += (dx / dist) * spd * dt
        inv.y += (dy / dist) * spd * dt
      }

      if (Math.hypot(desk.x - inv.x, desk.y - inv.y) < 26) {
        inv.dead = true
        inv.defeated = true
        deskHp = Math.max(0, deskHp - 1)
        desk.hp = deskHp
        spottedCount++
        pushEvent('warn', `📄 紧急需求拍在工位上！耐久 ${deskHp}/${deskMaxHp}`, desk.x, desk.y - 26)
        statusText = `🚨 警告！【${inv.name}】把需求塞进工位了！工位剩余防线 ${deskHp}/${deskMaxHp}！`
        if (deskHp <= 0) {
          gameState = 'lost'
          failReason = '17:59:59 黄金下班工位被塞满第18版需求，被迫通宵加班！'
          statusText = `😭 守卫失败！${failReason}`
          return
        }
      }
    }
  }

  function updateGuardsAndCameras(dt) {
    if (mode === 'be_the_boss' || mode === 'desk_defense') return

    for (const cam of cameras) {
      if (cam.disabledTimer > 0) {
        cam.disabledTimer -= dt
        continue
      }
      cam.dirAngle = cam.baseAngle + Math.sin(clock * cam.speed) * cam.sweep
      if (cam.alertCooldown > 0) cam.alertCooldown -= dt
      if (canObserverSeePlayer(cam)) {
        const camRate = cfg.id <= 2 ? 135 : cfg.id <= 6 ? 170 : 220
        cam.suspicion = Math.min(100, cam.suspicion + camRate * dt)
        if (cam.suspicion >= 100 && cam.alertCooldown <= 0) {
          cam.suspicion = 0
          cam.alertCooldown = 3.5
          spottedCount++
          emitNoise(player.x, player.y, 320, 'sound', true)
          pushEvent('warn', '📹 监控拍到你了！保安室已呼叫！', cam.x, cam.y + 20)
          statusText = '📹 被监控拍到啦！附近的巡逻正朝这里包抄过来！'
        }
      } else {
        cam.suspicion = Math.max(0, cam.suspicion - 110 * dt)
      }
    }

    for (const sn of snitches) {
      if (sn.alarmCooldown > 0) sn.alarmCooldown -= dt
      if (sn.stunTimer > 0) {
        sn.stunTimer -= dt
        sn.suspicion = 0
        continue
      }
      if (sn.distractTimer > 0) {
        sn.distractTimer -= dt
      } else {
        sn.lookTimer -= dt
        if (sn.lookTimer <= 0) {
          sn.lookIndex = (sn.lookIndex + 1) % sn.angles.length
          sn.lookTimer = sn.period
        }
        let diff = sn.angles[sn.lookIndex] - sn.dirAngle
        while (diff > Math.PI) diff -= Math.PI * 2
        while (diff < -Math.PI) diff += Math.PI * 2
        sn.dirAngle += Math.sign(diff) * Math.min(Math.abs(diff), 5 * dt)
      }
      if (sn.alarmCooldown <= 0 && canObserverSeePlayer(sn)) {
        const d = Math.hypot(player.x - sn.x, player.y - sn.y)
        sn.suspicion = Math.min(100, sn.suspicion + (d < 100 ? 380 : 260) * dt)
        if (sn.suspicion >= 100) {
          sn.suspicion = 0
          sn.alarmCooldown = 4.5
          spottedCount++
          emitNoise(player.x, player.y, 480, 'sound', true)
          pushEvent('warn', `📣 ${sn.name}：王总！这有人摸鱼！`, sn.x, sn.y - 26)
          statusText = `📣 被【${sn.name}】告密了！全公司巡逻都往你这边赶，快换路线躲起来！`
        }
      } else {
        sn.suspicion = Math.max(0, sn.suspicion - 60 * dt)
      }
    }

    for (const g of guards) {
      if (g.state === 'charge_prep' || g.state === 'charging') continue

      if (g.state === 'stunned') {
        g.stunTimer -= dt
        if (g.stunTimer <= 0 && !g.defeated) {
          g.state = 'patrol'
          g.thought = '嘶...刚才绝对有人暗算我！！'
        }
        continue
      }

      if (g.state === 'toilet_panic') {
        const toilet = objects.find(o => o.type === 'toilet') || { x: cellCenter(15, 10).x, y: cellCenter(15, 10).y, col: 15, row: 10 }
        g.stunTimer -= dt
        if (Math.hypot(g.x - toilet.x, g.y - toilet.y) > 18) {
          moveCircle(g, toilet.x - g.x, toilet.y - g.y, 200, dt, true)
          g.thought = '🤢 忍不了了！！让开让开我要蹲厕所！！'
        } else {
          g.thought = '🚽 呜呜呜...谁往我杯子里放的变态泻药...'
        }
        if (g.stunTimer <= 0) {
          g.state = 'patrol'
        }
        continue
      }

      // Check soap puddle slip!
      const puddleIdx = soapPuddles.findIndex(p => Math.hypot(p.x - g.x, p.y - g.y) < 25)
      if (puddleIdx !== -1 && g.state !== 'slipping') {
        soapPuddles.splice(puddleIdx, 1)
        g.state = 'slipping'
        g.slideVx = Math.cos(g.dirAngle) * 330
        g.slideVy = Math.sin(g.dirAngle) * 330
        g.suspicion = 0
        bossPranked++
        companyLoss += 3500
        if (g.carryingDoc) {
          g.carryingDoc = false
          pickups.push({
            id: `soap_doc_${clock.toFixed(2)}`,
            type: 'paycut_contract',
            name: '滑落的降薪协议',
            icon: '📄',
            col: g.col,
            row: g.row,
            x: g.x,
            y: g.y,
            collected: false
          })
        }
        g.thought = '🧼 哇啊啊脚底打滑刹不住了！！'
        pushEvent('prank', `🧼 ${g.name} 踩中洗洁精暴走滑飞！`, g.x, g.y - 26)
        statusText = `🧼 绝杀！${g.name} 一脚踩滑顺着走廊飞出去了！`

        if (mode === 'prank_hunt' && mc.subMode === 'bowling_blitz' && bossPranked >= (mc.targetPranks || 3)) {
          gameState = 'won'
          statusText = `🎉 连环滑铁卢 ${bossPranked}/${mc.targetPranks} 次达成！高管全员劈叉社死！`
          return
        }
        continue
      }

      if (g.state === 'slipping') {
        const nx = g.x + g.slideVx * dt
        const ny = g.y + g.slideVy * dt
        const clockObj = objects.find(o => o.type === 'clock_in')
        if (clockObj && Math.hypot(nx - clockObj.x, ny - clockObj.y) < 32 && !clockObj.bossSlipped) {
          clockObj.bossSlipped = true
          companyLoss += 500
          pushEvent('prank', '⏰ 语音播报：王总本人迟到，倒扣500！', clockObj.x, clockObj.y - 30)
        }
        if (mode === 'final_boss' && g.role === 'boss') {
          const hitShred = objects.find(o => o.type === 'shredder' && Math.hypot(o.x - nx, o.y - ny) < 36)
          if (hitShred) {
            g.state = 'stunned'
            g.stunTimer = 2.5
            damageBoss(mc.shredderTrapDamage || 2, '🗑️ 洗洁精把王总滑进碎纸机！狂扣 2 HP！', 'shred')
            continue
          }
        }
        if (!isPointBlocked(nx, ny, 13, true)) {
          g.x = nx
          g.y = ny
          const c = worldToCell(g.x, g.y)
          g.col = c.col
          g.row = c.row
        } else {
          g.state = 'stunned'
          g.stunTimer = mode === 'final_boss' ? 2.0 : 5.5
          g.thought = '💥 咚！！腰闪断了...别走让我抓到你...'
          pushEvent('prank', `💫 ${g.name} 一头撞墙昏厥！`, g.x, g.y - 26)
        }
        continue
      }

      // Non-lethal guard bump / nitro bowl-over in chair_derby & shredder_race (checked regardless of patrol/investigate!)
      if (mode === 'chair_derby' && Math.hypot(g.x - player.x, g.y - player.y) < 30) {
        const speedNow = Math.hypot(player.vx, player.vy)
        if (player.nitroTimer > 0 || speedNow > 235) {
          g.state = 'stunned'
          g.stunTimer = 4.2
          bossPranked++
          companyLoss += 3000
          g.thought = '💫 呜哇！！这把喷火转椅撞死我了！！'
          pushEvent('smash', `🚀 氮气漂移撞飞【${g.name}】！`, g.x, g.y - 26)
          continue
        } else if (player.bumpInvuln <= 0) {
          player.bumpInvuln = 1.1
          const pushAng = Math.atan2(player.y - g.y, player.x - g.x)
          player.vx = Math.cos(pushAng) * 210
          player.vy = Math.sin(pushAng) * 210
          const pen = mc.bossBumpPenaltySec || 1.5
          timeLeft = Math.max(0.5, timeLeft - pen)
          pushEvent('warn', `💥 被拦了一下 -${pen}秒！按氮气直接撞飞他！`, player.x, player.y - 22)
        }
      } else if (mode === 'shredder_race' && g.role === 'boss' && Math.hypot(g.x - player.x, g.y - player.y) < 26 && player.bumpInvuln <= 0) {
        player.bumpInvuln = 1.3
        if (player.carryingContracts > 0) {
          player.carryingContracts--
          player.contractsHeld = player.carryingContracts
          pickups.push({
            id: `boss_bump_doc_${clock.toFixed(2)}`,
            type: 'paycut_contract',
            name: '震落的降薪协议',
            icon: '📄',
            col: player.col,
            row: player.row,
            x: player.x,
            y: player.y,
            collected: false
          })
          pushEvent('warn', '📄 被王总撞掉1份协议！快捡回来！', player.x, player.y - 24)
        }
      }

      // Lv13 Shredder Race: HR Runner dedicated contract-stealing AI!
      if (mode === 'shredder_race' && g.id === 'hr_runner') {
        const cab = objects.find(o => o.type === 'archive_cabinet') || { x: cellCenter(15, 2).x, y: cellCenter(15, 2).y, col: 15, row: 2 }
        if (g.carryingDoc) {
          g.repathTimer -= dt
          if (g.repathTimer <= 0 || g.path.length === 0) {
            g.repathTimer = 0.5
            g.path = findGridPath(g.col, g.row, cab.col, cab.row, true)
          }
          if (g.path.length > 0) {
            const np = cellCenter(g.path[0].col, g.path[0].row)
            if (Math.hypot(np.x - g.x, np.y - g.y) < 8) g.path.shift()
            else moveCircle(g, np.x - g.x, np.y - g.y, g.speed * 1.05, dt, true)
          } else {
            moveCircle(g, cab.x - g.x, cab.y - g.y, g.speed * 1.05, dt, true)
          }
          if (Math.hypot(cab.x - g.x, cab.y - g.y) < 26) {
            g.carryingDoc = false
            hrStolenCount++
            const maxStolen = mc.maxHrStolen || 3
            pushEvent('warn', `🗄️ HR锁进1份降薪协议！(${hrStolenCount}/${maxStolen})`, cab.x, cab.y - 24)
            statusText = `🚨 警告！HR已抢走锁进 ${hrStolenCount}/${maxStolen} 份协议！快加速抢合同塞碎纸机！`
            if (hrStolenCount >= maxStolen) {
              gameState = 'lost'
              failReason = `HR抢先将 ${hrStolenCount} 份《全员降薪协议》锁入机密档案柜，降薪生效！`
              statusText = `😭 抢救失败！${failReason}`
              return
            }
          }
          continue
        } else {
          const targetDoc = pickups
            .filter(pk => !pk.collected && (pk.type === 'paycut_contract' || pk.type === 'contract'))
            .sort((a, b) => Math.hypot(a.x - g.x, a.y - g.y) - Math.hypot(b.x - g.x, b.y - g.y))[0]
          if (targetDoc) {
            g.repathTimer -= dt
            if (g.repathTimer <= 0 || g.path.length === 0) {
              g.repathTimer = 0.5
              g.path = findGridPath(g.col, g.row, targetDoc.col, targetDoc.row, true)
            }
            if (g.path.length > 0) {
              const np = cellCenter(g.path[0].col, g.path[0].row)
              if (Math.hypot(np.x - g.x, np.y - g.y) < 8) g.path.shift()
              else moveCircle(g, np.x - g.x, np.y - g.y, g.speed, dt, true)
            } else {
              moveCircle(g, targetDoc.x - g.x, targetDoc.y - g.y, g.speed, dt, true)
            }
            if (Math.hypot(targetDoc.x - g.x, targetDoc.y - g.y) < 24) {
              targetDoc.collected = true
              g.carryingDoc = true
              g.path = []
              g.thought = '📄 捡到一份降薪协议！快送回档案柜锁死！'
            }
            continue
          }
        }
      }

      // Non-stealth combat/action modes skip lethal sight chase!
      const lethalStealthMode = ['stealth', 'prank_hunt', 'vault_heist', 'blackout_escape'].includes(mode)

      if (lethalStealthMode) {
        const sees = canObserverSeePlayer(g)
        if (sees) {
          const dist = Math.hypot(player.x - g.x, player.y - g.y)
          const lvScale = cfg.id === 1 ? 0.45 : cfg.id === 2 ? 0.52 : cfg.id <= 4 ? 0.62 : cfg.id <= 6 ? 0.72 : 0.85
          const fillRate = (dist < 90 ? 290 : 175) * lvScale
          g.suspicion = Math.min(100, g.suspicion + fillRate * dt)
          g.lastSeenX = player.x
          g.lastSeenY = player.y
          g.chaseLoseTimer = cfg.id <= 3 ? 2.1 : 2.8
          g.lastSeenAt = clock
          if (g.suspicion >= 100 && g.state !== 'chase') {
            g.state = 'chase'
            spottedCount++
            g.thought = '🚨 站住！！还敢乱跑？！今天扣光全勤！'
            pushEvent('warn', `🚨 被 ${g.name} 发现！快绕墙逃跑或钻掩体！`, g.x, g.y - 24)
            const tc = worldToCell(player.x, player.y)
            for (const o of guards) {
              if (o === g || (o.state !== 'patrol' && o.state !== 'investigate')) continue
              if (Math.hypot(o.x - g.x, o.y - g.y) > 340) continue
              o.state = 'investigate'
              o.investigateTarget = { x: player.x, y: player.y, col: tc.col, row: tc.row }
              o.investigateTimer = 4
              o.path = findGridPath(o.col, o.row, tc.col, tc.row, true)
              o.thought = '📢 收到！马上过去堵他！'
            }
          }
        } else {
          g.suspicion = Math.max(0, g.suspicion - 55 * dt)
        }

        if (g.state === 'chase') {
          if (!sees) {
            g.chaseLoseTimer -= dt
            if (g.chaseLoseTimer <= 0) {
              g.state = 'patrol'
              g.path = []
              g.thought = '奇了怪了...刚那人跑哪儿去了？'
              continue
            }
          }
          g.repathTimer -= dt
          if (g.repathTimer <= 0 || g.path.length === 0) {
            g.repathTimer = 0.35
            const targetCell = worldToCell(g.lastSeenX, g.lastSeenY)
            g.path = findGridPath(g.col, g.row, targetCell.col, targetCell.row, true)
          }
          if (g.path.length > 0) {
            const nextPos = cellCenter(g.path[0].col, g.path[0].row)
            const dx = nextPos.x - g.x
            const dy = nextPos.y - g.y
            if (Math.hypot(dx, dy) < 8) g.path.shift()
            else moveCircle(g, dx, dy, g.chaseSpeed, dt, true)
          } else {
            moveCircle(g, g.lastSeenX - g.x, g.lastSeenY - g.y, g.chaseSpeed, dt, true)
          }

          if (!player.hiding && Math.hypot(g.x - player.x, g.y - player.y) < 27) {
            gameState = 'lost'
            failReason = `被【${g.name}】在公司走廊堵了个正着，行动彻底败露！`
            statusText = `🚨 糟糕！${failReason}`
            return
          }
          continue
        }
      }

      if (g.state === 'investigate' && g.investigateTarget) {
        const tgt = g.investigateTarget
        if (g.path.length > 0) {
          const np = cellCenter(g.path[0].col, g.path[0].row)
          const dx = np.x - g.x
          const dy = np.y - g.y
          if (Math.hypot(dx, dy) < 8) g.path.shift()
          else moveCircle(g, dx, dy, g.speed * 1.15, dt, true)
        } else {
          const dx = tgt.x - g.x
          const dy = tgt.y - g.y
          if (Math.hypot(dx, dy) > 12) {
            moveCircle(g, dx, dy, g.speed * 1.15, dt, true)
          } else {
            if (tgt.isThermos) {
              g.state = 'toilet_panic'
              g.stunTimer = 10.0
              if (mc.subMode === 'dark_brew') {
                bossPranked += 2
                companyLoss += 9999
                gameState = 'won'
                pushEvent('prank', '🌋 三合一暗黑特调发作！王总当众捂臀狂奔厕所！', g.x, g.y - 28)
                statusText = '🎉 演讲台暗黑特调大成功！全员洗脑大会因王总拉肚子紧急取消！'
                return
              }
              if (cfg.id === 3 && !player.hasKeycard) {
                player.hasKeycard = true
                unlockGatesIfHasCard()
                pushEvent('loot', '💳 趁王总奔厕抢到掉落的门禁卡！', g.x, g.y - 26)
              }
              continue
            }
            g.investigateTimer -= dt
            g.dirAngle += Math.sin(clock * 3.5) * 1.6 * dt
            if (g.investigateTimer <= 0) {
              g.state = 'patrol'
              g.investigateTarget = null
              g.thought = '莫名其妙...继续回去巡逻！'
            }
          }
        }
        continue
      }

      // Patrol waypoints
      if (!g.waypoints || g.waypoints.length === 0) continue
      const wp = g.waypoints[g.wpIndex % g.waypoints.length]
      const wpPos = cellCenter(wp.col, wp.row)
      const dx = wpPos.x - g.x
      const dy = wpPos.y - g.y
      if (Math.hypot(dx, dy) > 8) {
        if (g.path.length === 0) {
          g.path = findGridPath(g.col, g.row, wp.col, wp.row, true)
        }
        if (g.path.length > 0) {
          const np = cellCenter(g.path[0].col, g.path[0].row)
          const ndx = np.x - g.x
          const ndy = np.y - g.y
          if (Math.hypot(ndx, ndy) < 8) g.path.shift()
          else moveCircle(g, ndx, ndy, g.speed, dt, true)
        } else {
          moveCircle(g, dx, dy, g.speed, dt, true)
        }
      } else {
        g.waitTimer -= dt
        g.dirAngle += Math.sin(clock * 2 + g.wpIndex) * 0.7 * dt
        if (g.waitTimer <= 0) {
          g.wpIndex = (g.wpIndex + 1) % g.waypoints.length
          g.waitTimer = g.waypoints[g.wpIndex].wait
          g.path = findGridPath(g.col, g.row, g.waypoints[g.wpIndex].col, g.waypoints[g.wpIndex].row, true)
        }
      }
    }
  }

  function updateChairDerbyMovement(dt, moveDx, moveDy, sprintInput) {
    if (sprintInput && player.nitroCooldown <= 0 && (moveDx !== 0 || moveDy !== 0)) {
      activateNitro()
    }
    const maxSpd = player.nitroTimer > 0
      ? mc.nitroBoostSpeed || 335
      : player.activeBuffTimer > 0
        ? (mc.baseChairSpeed || 195) * 1.28
        : mc.baseChairSpeed || 195
    const accel = player.nitroTimer > 0 ? 960 : 680

    if (moveDx !== 0 || moveDy !== 0) {
      const len = Math.hypot(moveDx, moveDy)
      const nx = moveDx / len
      const ny = moveDy / len
      player.vx += nx * accel * dt
      player.vy += ny * accel * dt
      player.angle = Math.atan2(player.vy, player.vx)
    } else {
      const damp = Math.pow(mc.driftFriction || 0.92, dt * 60)
      player.vx *= damp
      player.vy *= damp
    }

    const curSpd = Math.hypot(player.vx, player.vy)
    if (curSpd > maxSpd) {
      player.vx = (player.vx / curSpd) * maxSpd
      player.vy = (player.vy / curSpd) * maxSpd
    }

    const canSmashGlass = Boolean(mc.smashGlassAllowed && (player.nitroTimer > 0 || curSpd > 210))
    const nx = player.x + player.vx * dt
    const ny = player.y + player.vy * dt

    if (canSmashGlass) {
      for (const [gx, gy] of [[0, 0], [-14, 0], [14, 0], [0, -14], [0, 14]]) {
        const checkCell = worldToCell(nx + gx, ny + gy)
        if (grid[checkCell.row]?.[checkCell.col] === T_GLASS) {
          grid[checkCell.row][checkCell.col] = T_FLOOR
          companyLoss += 2000
          pushEvent('smash', '💎 飙椅撞碎钢化玻璃隔断！', nx + gx, ny + gy - 20)
        }
      }
    }

    if (!isPointBlocked(nx, player.y, 13, true, canSmashGlass)) {
      player.x = nx
    } else {
      player.vx *= -0.45
    }
    if (!isPointBlocked(player.x, ny, 13, true, canSmashGlass)) {
      player.y = ny
    } else {
      player.vy *= -0.45
    }

    const pc = worldToCell(player.x, player.y)
    player.col = pc.col
    player.row = pc.row
    player.isMoving = Math.hypot(player.vx, player.vy) > 18
    player.sprinting = player.nitroTimer > 0

    // Smash contract piles & projectors on impact!
    for (const obj of objects) {
      if ((obj.type === 'contract_pile' || obj.type === 'projector') && !obj.smashed) {
        if (Math.hypot(obj.x - player.x, obj.y - player.y) < 34) {
          smashDestructibleObject(obj)
          if (gameState !== 'playing') return
        }
      }
    }
  }

  function step(dt = 1 / 60, input = { dx: 0, dy: 0, sprint: false }) {
    if (gameState !== 'playing') return
    clock += dt
    timeLeft = Math.max(0, timeLeft - dt)

    if (timeLeft <= 0) {
      if (mode === 'wake_coworkers') {
        gameState = 'won'
        statusText = '🎉 成功撑满45秒！全组摸鱼队友在你的神级掩护下零裁员过关！'
        pushEvent('success', '🏆 全员存活！完美救场过关！', player.x, player.y - 26)
        return
      }
      if (mode === 'desk_defense') {
        gameState = 'won'
        statusText = '🎉 18:00:00 下班铃声敲响！成功击退所有需求怪准点关机走人！'
        pushEvent('success', '🔔 18:00 准点下班保卫战胜利！', player.x, player.y - 26)
        return
      }
      gameState = 'lost'
      failReason =
        cfg.id === 1
          ? '09:01:00 迟到警报响起！全勤奖500元飞了！'
          : cfg.id === 2
            ? '午休结束了还没吃完螺蛳粉，被记了警告！'
            : `未能在限时内完成【${cfg.title}】目标，被迫留下来通宵对齐颗粒度！`
      statusText = `⏰ 时间到！${failReason}`
      return
    }

    // Tick player timers
    if (player.activeBuffTimer > 0) player.activeBuffTimer = Math.max(0, player.activeBuffTimer - dt)
    if (player.exhaustTimer > 0) player.exhaustTimer = Math.max(0, player.exhaustTimer - dt)
    if (player.nitroTimer > 0) {
      player.nitroTimer = Math.max(0, player.nitroTimer - dt)
      player.boosting = player.nitroTimer > 0
    }
    if (player.nitroCooldown > 0) player.nitroCooldown = Math.max(0, player.nitroCooldown - dt)
    if (player.swingTimer > 0) player.swingTimer = Math.max(0, player.swingTimer - dt)
    if (player.swingCooldown > 0) player.swingCooldown = Math.max(0, player.swingCooldown - dt)
    if (player.dashTimer > 0) player.dashTimer = Math.max(0, player.dashTimer - dt)
    if (player.dashCooldown > 0) player.dashCooldown = Math.max(0, player.dashCooldown - dt)
    if (player.hornTimer > 0) player.hornTimer = Math.max(0, player.hornTimer - dt)
    if (player.stunTimer > 0) player.stunTimer = Math.max(0, player.stunTimer - dt)
    if (player.bumpInvuln > 0) player.bumpInvuln = Math.max(0, player.bumpInvuln - dt)

    // Update moving cover cart
    if (movingCart) {
      movingCart.x += movingCart.dir * movingCart.speed * dt
      if (movingCart.x >= movingCart.maxX) {
        movingCart.x = movingCart.maxX
        movingCart.dir = -1
      } else if (movingCart.x <= movingCart.minX) {
        movingCart.x = movingCart.minX
        movingCart.dir = 1
      }
    }

    // Handle active hold-progress interaction (clock_in / workstation)
    if (player.workObj) {
      if (input.dx !== 0 || input.dy !== 0) {
        player.workObj = null
        player.workProgress = 0
      } else {
        player.workProgress += dt / player.workDuration
        if (player.workProgress >= 1) {
          const doneObj = player.workObj
          player.workObj = null
          player.workProgress = 0
          completeObjectInteraction(doneObj)
          if (gameState !== 'playing') return
        }
      }
    }

    // Movement: keyboard/joystick input overrides BFS click path
    let moveDx = player.stunTimer > 0 ? 0 : input.dx
    let moveDy = player.stunTimer > 0 ? 0 : input.dy
    if (moveDx !== 0 || moveDy !== 0) {
      player.path = []
      player.pendingObjId = null
    } else if (player.stunTimer <= 0 && player.path.length > 0) {
      const next = cellCenter(player.path[0].col, player.path[0].row)
      moveDx = next.x - player.x
      moveDy = next.y - player.y
      if (Math.hypot(moveDx, moveDy) < 7) {
        player.path.shift()
        if (player.path.length === 0 && player.pendingObjId) {
          player.pendingObjId = null
          interactNearest()
        }
        moveDx = 0
        moveDy = 0
      }
    }

    if (mode === 'chair_derby') {
      updateChairDerbyMovement(dt, moveDx, moveDy, Boolean(input.sprint))
      if (gameState !== 'playing') return
    } else {
      const wantsMove = moveDx !== 0 || moveDy !== 0
      const buffSprint = player.activeBuffTimer > 0 || player.dashTimer > 0
      const canSprint = (input.sprint && player.stamina > 3) || buffSprint
      player.sprinting = wantsMove && !player.carton && canSprint

      if (player.sprinting && !buffSprint) {
        player.stamina = Math.max(0, player.stamina - 40 * dt)
      } else {
        player.stamina = Math.min(player.maxStamina, player.stamina + 26 * dt)
      }

      const roleMult = playerRole === 'boss' ? mc.playerSpeedMultiplier || 1.25 : 1.0
      let spd = player.carton
        ? 55
        : player.sprinting
          ? buffSprint
            ? 250
            : 225
          : 138
      spd *= roleMult
      if (player.dashTimer > 0) spd += 95

      const allowGate = player.hasKeycard || vaultUnlocked
      player.isMoving = wantsMove ? moveCircle(player, moveDx, moveDy, spd, dt, allowGate) : false

      // Gentle push on chairs in Lv14 vault_heist when walking into them
      if (mode === 'vault_heist' && player.isMoving) {
        for (const ch of chairs) {
          if (ch.sliding || ch.lockedOnPad) continue
          if (Math.hypot(ch.x - player.x, ch.y - player.y) < 28) {
            moveCircle(ch, moveDx, moveDy, spd * 0.95, dt, true)
            checkPressurePads()
          }
        }
      }
    }

    // Hiding in plant tile
    const onHide = !player.carton && !player.ridingChair && playerRole !== 'boss' && grid[player.row]?.[player.col] === T_HIDE
    if (onHide && !player.wasOnHide && guards.some(g => g.state === 'chase' && clock - g.lastSeenAt < 0.4)) {
      player.hideBlown = true
      pushEvent('warn', '👀 当着老板的面钻草丛？没用！', player.x, player.y - 24)
    }
    if (!onHide) player.hideBlown = false
    player.wasOnHide = onHide
    player.hiding = onHide && !player.hideBlown

    // Footstep sound & noisy carpet mechanics!
    player.noiseCooldown = Math.max(0, player.noiseCooldown - dt)
    if (player.isMoving && player.noiseCooldown <= 0 && !player.ridingChair && playerRole !== 'boss') {
      const onCarpet = grid[player.row]?.[player.col] === T_CARPET
      const quietFactor = player.activeBuffTimer > 0 ? 0.45 : 1.0
      if (player.sprinting) {
        player.noiseCooldown = 0.28
        emitNoise(player.x, player.y, (onCarpet ? 215 : 145) * quietFactor, 'sound', false)
      } else if (onCarpet && !player.carton) {
        player.noiseCooldown = 0.45
        emitNoise(player.x, player.y, 115 * quietFactor, 'sound', false)
      }
    }

    // Level 2 Takeout Odor Emission!
    if (player.carryingTakeout && player.exhaustTimer <= 0) {
      player.odorCooldown -= dt
      if (player.odorCooldown <= 0) {
        player.odorCooldown = 1.1
        emitNoise(player.x, player.y, mc.odorRadius || 125, 'odor', false)
      }
    }

    updatePickupsAndFrogs(dt)
    if (gameState !== 'playing') return
    checkPressurePads()
    updateProjectilesAndBossCombat(dt)
    if (gameState !== 'playing') return
    updateWakeCoworkers(dt)
    if (gameState !== 'playing') return
    updateDeskDefense(dt)
    if (gameState !== 'playing') return
    updateGuardsAndCameras(dt)
  }

  function getModeStats() {
    if (mode === 'chair_derby') {
      const targetTp = mc.targetType || 'contract_pile'
      const target = mc.targetCount || objects.filter(o => o.type === targetTp).length
      const done = objects.filter(o => o.type === targetTp && o.smashed).length
      return { progress: done, target, label: `粉碎进度 ${done}/${target}` }
    }
    if (mode === 'prank_hunt') {
      if (mc.subMode === 'wig_blow') {
        const boss = guards.find(g => g.role === 'boss')
        const done = photoSnapped ? 2 : boss?.wigLost ? 1 : 0
        return { progress: done, target: 2, label: boss?.wigLost ? '快上前抓拍秃头！' : '吹飞假发 0/1' }
      }
      if (mc.subMode === 'bowling_blitz') {
        const target = mc.targetPranks || 3
        return { progress: Math.min(target, bossPranked), target, label: `击倒高管 ${Math.min(target, bossPranked)}/${target}` }
      }
      if (mc.subMode === 'dark_brew') {
        const th = objects.find(o => o.type === 'thermos')
        const total = (th?.ingredientsAdded || 0) + player.brewIngredients.length
        return { progress: Math.min(3, total), target: 3, label: th?.spiked ? '等王总喝下特调！' : `暗黑配料 ${Math.min(3, total)}/3` }
      }
    }
    if (mode === 'pot_pong' || mode === 'final_boss') {
      return { progress: bossMaxHp - bossHp, target: bossMaxHp, label: `王总血量 ${bossHp}/${bossMaxHp}` }
    }
    if (mode === 'wake_coworkers') {
      const maxAllowed = mc.maxCaughtAllowed ?? 2
      return { progress: wokenCount, target: maxAllowed + 1, label: `已救 ${wokenCount} 次 · 被抓 ${caughtCoworkers}/${maxAllowed}` }
    }
    if (mode === 'be_the_boss') {
      const target = mc.targetSlackers || 7
      return { progress: caughtSlackers, target, label: `揪出摸鱼怪 ${caughtSlackers}/${target}` }
    }
    if (mode === 'desk_defense') {
      return { progress: deskHp, target: deskMaxHp, label: `工位防线 ${deskHp}/${deskMaxHp}` }
    }
    if (mode === 'shredder_race') {
      const target = mc.targetShredCount || 6
      return { progress: shreddedCount, target, label: `已碎 ${shreddedCount}/${target} · HR抢 ${hrStolenCount}/${mc.maxHrStolen || 3}` }
    }
    if (mode === 'vault_heist') {
      const req = mc.requiredPads || 3
      return { progress: activatedPads, target: req, label: vaultUnlocked ? (player.carryingVault ? '冲向电梯！' : '夺取宝箱！') : `重力机关 ${activatedPads}/${req}` }
    }
    if (mode === 'blackout_escape') {
      const req = mc.requiredSwitches || 3
      return { progress: pulledSwitches, target: req, label: blackout ? '黑夜冲进电梯！' : `拉断电闸 ${pulledSwitches}/${req}` }
    }
    return { progress: gameState === 'won' ? 1 : 0, target: 1, label: cfg.modeBadge }
  }

  function computeCurrentTarget() {
    const boss = guards.find(g => g.role === 'boss') || guards[0]
    const findObj = t => objects.find(o => o.type === t && !o.done && !o.smashed && !o.pulled)
    if (mode === 'stealth') {
      if (cfg.id === 1) return player.clockedIn ? objects.find(o => o.type === 'workstation') : objects.find(o => o.type === 'clock_in')
      if (cfg.id === 2) return player.carryingTakeout ? objects.find(o => o.type === 'workstation') : objects.find(o => o.type === 'takeout')
      if (!player.hasKeycard) return pickups.find(k => k.type === 'keycard' && !k.collected) || objects.find(o => o.type === 'thermos')
      return objects.find(o => o.type === 'elevator_exit')
    }
    if (mode === 'prank_hunt') {
      if (mc.subMode === 'wig_blow') return boss?.wigLost ? boss : objects.find(o => o.id === 'fan_blower') || objects[0]
      if (mc.subMode === 'dark_brew') {
        const nextIng = pickups.find(p => !p.collected && ['chili', 'iced_americano', 'laxative'].includes(p.type))
        return nextIng || objects.find(o => o.type === 'thermos')
      }
      return chairs.find(c => !c.sliding) || boss
    }
    if (mode === 'chair_derby') {
      const tp = mc.targetType || 'contract_pile'
      return objects.find(o => o.type === tp && !o.smashed)
    }
    if (mode === 'pot_pong' || mode === 'final_boss') return boss
    if (mode === 'wake_coworkers') {
      const drowsy = coworkers.filter(cw => !cw.caught && cw.sleepMeter >= 35).sort((a, b) => b.sleepMeter - a.sleepMeter)[0]
      return drowsy || coworkers.filter(cw => !cw.caught).sort((a, b) => b.sleepMeter - a.sleepMeter)[0] || null
    }
    if (mode === 'be_the_boss') {
      return hidingSpots.find(hs => !hs.searched && hs.hasSlacker) || hidingSpots.find(hs => !hs.searched)
    }
    if (mode === 'desk_defense') {
      return invaders.find(inv => !inv.dead && !inv.defeated) || objects.find(o => o.id === 'golden_desk')
    }
    if (mode === 'shredder_race') {
      if (player.carryingContracts > 0) return objects.find(o => o.type === 'shredder')
      return pickups.find(p => !p.collected && p.type === 'paycut_contract') || objects.find(o => o.type === 'shredder')
    }
    if (mode === 'vault_heist') {
      if (!vaultUnlocked) return objects.find(o => o.type === 'pressure_pad' && !o.activated)
      if (!player.carryingVault) return objects.find(o => o.type === 'vault_box')
      return objects.find(o => o.type === 'elevator_exit')
    }
    if (mode === 'blackout_escape') {
      if (!blackout) return findObj('power_switch')
      return objects.find(o => o.type === 'elevator_exit')
    }
    return null
  }

  function computeTaskText() {
    if (mode === 'stealth') {
      if (cfg.id === 1) return player.clockedIn ? '② 溜回 💻7号工位 装忙' : '① 刷 ⏰考勤机 打卡'
      if (cfg.id === 2) return player.carryingTakeout ? '② 开🌀排风 带回💻工位' : '① 潜到前台拿 🍜螺蛳粉'
      return player.hasKeycard ? '② 冲进左下 🛗下班电梯' : '① 偷💳门禁卡 或 下🌶️泻药'
    }
    return getModeStats().label
  }

  function getActionDescriptor() {
    const boss = guards.find(g => g.role === 'boss') || guards[0]
    const nearChair = chairs.find(c => !c.sliding && !c.lockedOnPad && Math.hypot(c.x - player.x, c.y - player.y) < 52)
    const nearObj = objects
      .filter(o => o.type !== 'pressure_pad' && o.type !== 'archive_cabinet')
      .find(o => Math.hypot(o.x - player.x, o.y - player.y) <= 56)

    if (mode === 'final_boss') {
      if (bossHp <= 0 && boss) {
        const can = Math.hypot(boss.x - player.x, boss.y - player.y) <= 80
        return { icon: '📄', label: '炒掉王总', canAct: can, accent: '#ff006e' }
      }
      const potClose = projectiles.some(pr => !pr.reflected && pr.type !== 'pie' && Math.hypot(pr.x - player.x, pr.y - player.y) <= 80)
      if (!potClose && nearChair) return { icon: '🪑', label: '踢椅暴击', canAct: true, accent: '#3a86ff' }
      return { icon: '🏏', label: '反拍黑锅', canAct: player.swingCooldown <= 0, accent: '#e63946' }
    }

    if (mode === 'pot_pong') {
      return { icon: '🏏', label: '反拍黑锅', canAct: player.swingCooldown <= 0, accent: '#e63946' }
    }

    if (mode === 'chair_derby') {
      return { icon: '🚀', label: '氮气冲撞', canAct: player.nitroCooldown <= 0, accent: '#fb5607' }
    }

    if (mode === 'be_the_boss') {
      const can = hidingSpots.some(hs => !hs.searched && Math.hypot(hs.x - player.x, hs.y - player.y) <= (mc.hornRadius || 66))
      return { icon: '📣', label: '揪出摸鱼', canAct: can, accent: '#ff006e' }
    }

    if (mode === 'wake_coworkers') {
      const can = coworkers.some(cw => !cw.caught && cw.sleepMeter > 5 && Math.hypot(cw.x - player.x, cw.y - player.y) <= (mc.wakeInteractRadius || 64))
      if (can) return { icon: '👋', label: '拍醒队友', canAct: true, accent: '#2a9d8f' }
      if (nearChair) return { icon: '🪑', label: '踢飞转椅', canAct: true, accent: '#3a86ff' }
      return { icon: '👋', label: '靠近拍醒', canAct: false, accent: '#80b918' }
    }

    if (mode === 'desk_defense') {
      if (nearChair) return { icon: '🪑', label: '保龄清场', canAct: true, accent: '#3a86ff' }
      return { icon: '⌨️', label: '键盘拍飞', canAct: player.swingCooldown <= 0, accent: '#8338ec' }
    }

    if (mode === 'shredder_race') {
      const nearShred = objects.find(o => o.type === 'shredder' && Math.hypot(o.x - player.x, o.y - player.y) <= 60)
      if (nearShred && player.carryingContracts > 0) {
        return { icon: '📄', label: '塞碎纸机', canAct: true, accent: '#e63946' }
      }
      if (nearChair) return { icon: '🪑', label: '踢椅截胡', canAct: true, accent: '#3a86ff' }
      return {
        icon: '📄',
        label: player.carryingContracts > 0 ? `抱${player.carryingContracts}份去碎` : '去捡协议',
        canAct: false,
        accent: '#f77f00'
      }
    }

    if (mode === 'vault_heist') {
      if (nearObj?.type === 'vault_box' && !nearObj.done) {
        return { icon: '💎', label: '抱年终奖', canAct: true, accent: '#ffbe0b' }
      }
      if (nearObj?.type === 'elevator_exit' && player.carryingVault) {
        return { icon: '🛗', label: '携款撤离', canAct: true, accent: '#38b000' }
      }
      if (nearChair) return { icon: '🪑', label: '推向机关', canAct: true, accent: '#3a86ff' }
      return { icon: '🟩', label: vaultUnlocked ? '去拿宝箱' : '推椅压板', canAct: false, accent: '#2a9d8f' }
    }

    if (mode === 'blackout_escape') {
      if (nearObj?.type === 'power_switch' && !nearObj.pulled) {
        return { icon: '⚡', label: '拉断电闸', canAct: true, accent: '#ffbe0b' }
      }
      if (nearObj?.type === 'elevator_exit' && blackout) {
        return { icon: '🛗', label: '摸黑跑路', canAct: true, accent: '#38b000' }
      }
    }

    if (mode === 'prank_hunt' && mc.requirePhotoSnap && boss?.wigLost) {
      const can = Math.hypot(boss.x - player.x, boss.y - player.y) <= 78
      if (can) return { icon: '📸', label: '抓拍秃头', canAct: true, accent: '#ff006e' }
    }

    if (mode === 'prank_hunt' && mc.subMode === 'dark_brew' && nearObj?.type === 'thermos' && player.brewIngredients.length > 0) {
      return { icon: '🧪', label: '注入特调', canAct: true, accent: '#9d4edd' }
    }

    if (nearChair) return { icon: '🦶', label: '踢飞转椅', canAct: true, accent: '#3a86ff' }
    if (nearObj) return { icon: nearObj.icon || '✋', label: '立即互动', canAct: true, accent: '#38b000' }
    return { icon: '✋', label: '互动', canAct: false, accent: '#80b918' }
  }

  function snapshot() {
    const boss = guards.find(g => g.role === 'boss') || guards[0]
    const stats = getModeStats()
    let stars = 0
    if (gameState === 'won') {
      const fastClear = cfg.timeLimit - timeLeft <= (cfg.parTime || cfg.timeLimit * 0.65)
      if (['pot_pong', 'chair_derby', 'be_the_boss', 'shredder_race', 'final_boss'].includes(mode)) {
        stars = 1 + (spottedCount <= 1 ? 1 : 0) + (fastClear || bossPranked >= 3 ? 1 : 0)
      } else if (['wake_coworkers', 'desk_defense'].includes(mode)) {
        stars = 1 + (spottedCount === 0 ? 1 : 0) + (bossPranked > 0 || deskHp === deskMaxHp ? 1 : 0)
      } else {
        stars = 1 + (spottedCount === 0 ? 1 : 0) + (bossPranked > 0 ? 1 : 0)
      }
      stars = Math.min(3, Math.max(1, stars))
    }
    return {
      level: cfg.id,
      chapter: cfg.chapter,
      mode,
      modeBadge: cfg.modeBadge,
      levelName: cfg.name,
      gameState,
      failReason,
      statusText,
      timeLeft: Number(timeLeft.toFixed(1)),
      clockText: formatClock(cfg.deadline - timeLeft),
      clock: Number(clock.toFixed(2)),
      spottedCount,
      bossPranked,
      companyLoss,
      stars,
      blackout,
      playerRole,
      bossHp,
      bossMaxHp,
      bossPhase,
      deskHp,
      deskMaxHp,
      modeProgress: stats.progress,
      modeTarget: stats.target,
      modeLabel: stats.label,
      taskText: computeTaskText(),
      player: {
        x: Math.round(player.x),
        y: Math.round(player.y),
        col: player.col,
        row: player.row,
        role: player.role,
        ridingChair: player.ridingChair,
        stamina: Math.round(player.stamina),
        sprinting: player.sprinting,
        carton: player.carton,
        hiding: player.hiding,
        clockedIn: player.clockedIn,
        carryingTakeout: player.carryingTakeout,
        carryingContracts: player.carryingContracts,
        carryingVault: player.carryingVault,
        brewIngredients: [...player.brewIngredients],
        hasKeycard: player.hasKeycard,
        cartonUses: player.cartonUses,
        hideBlown: player.hideBlown,
        exhaustTimer: Number(player.exhaustTimer.toFixed(1)),
        inventory: player.inventory.map(it => it.id)
      },
      boss: boss
        ? {
            x: Math.round(boss.x),
            y: Math.round(boss.y),
            col: boss.col,
            row: boss.row,
            state: boss.state,
            wigLost: Boolean(boss.wigLost),
            suspicion: Math.round(boss.suspicion),
            thought: boss.thought
          }
        : null,
      guards: guards.map(g => ({
        id: g.id,
        name: g.name,
        x: Math.round(g.x),
        y: Math.round(g.y),
        state: g.state,
        wigLost: Boolean(g.wigLost),
        suspicion: Math.round(g.suspicion)
      })),
      objects: objects.map(o => ({
        id: o.id,
        type: o.type,
        done: Boolean(o.done),
        smashed: Boolean(o.smashed),
        pulled: Boolean(o.pulled),
        activated: Boolean(o.activated),
        spiked: Boolean(o.spiked),
        timer: Number((o.timer || 0).toFixed(1))
      }))
    }
  }

  return {
    cfg,
    chapter: cfg.chapter,
    mode,
    modeBadge: cfg.modeBadge,
    grid,
    player,
    playerRole,
    guards,
    cameras,
    snitches,
    pickups,
    chairs,
    objects,
    movingCart,
    projectiles,
    coworkers,
    hidingSpots,
    invaders,
    coffeePuddles,
    soapPuddles,
    frogs,
    ripples,
    events,
    step,
    toggleCarton,
    triggerSecondaryAction,
    getActionDescriptor,
    useInventoryItem,
    interactNearest,
    commandMoveTo,
    emitNoise,
    canObserverSeePlayer,
    computeVisionPolygon,
    snapshot,
    get clock() {
      return clock
    },
    get timeLeft() {
      return timeLeft
    },
    get gameState() {
      return gameState
    },
    get statusText() {
      return statusText
    },
    get blackout() {
      return blackout
    },
    set blackout(v) {
      blackout = Boolean(v)
    },
    get ridingChair() {
      return player.ridingChair
    },
    get bossHp() {
      return bossHp
    },
    get bossMaxHp() {
      return bossMaxHp
    },
    get bossPhase() {
      return bossPhase
    },
    get deskHp() {
      return deskHp
    },
    get deskMaxHp() {
      return deskMaxHp
    },
    get modeProgress() {
      return getModeStats().progress
    },
    get modeTarget() {
      return getModeStats().target
    },
    get modeLabel() {
      return getModeStats().label
    },
    get currentTarget() {
      return computeCurrentTarget()
    },
    get taskText() {
      return computeTaskText()
    }
  }
}

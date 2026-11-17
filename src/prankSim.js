// Top-Down Office Bomberman + Trap Chain Engine (《办公室炸弹人：俯视整蛊大作战》)

export const W = 960
export const H = 620
export const COLS = 15
export const ROWS = 11
export const TILE = 48
export const MAP_X = 40
export const MAP_Y = 58
export const MAP_W = COLS * TILE // 720
export const MAP_H = ROWS * TILE // 528

// Tile constants
export const T_EMPTY = 0
export const T_WALL = 1
export const T_CRATE = 2
export const T_PLANT = 3 // Stealth hiding bush / potted plant

export const ITEM_TYPES = [
  { id: 'bomb_up', icon: '💣', name: '+1 咖啡炸弹上限', color: '#f97316' },
  { id: 'range_up', icon: '🔥', name: '+1 十字冲击波范围', color: '#ef4444' },
  { id: 'speed_up', icon: '👟', name: '+1 摸鱼滑板鞋加速', color: '#06b6d4' },
  { id: 'kick', icon: '🥾', name: '飞踢靴(碰撞可踢飞炸弹)', color: '#8b5cf6' },
  { id: 'soap_ammo', icon: '🧼', name: '+2 强力洗洁精陷阱', color: '#3b82f6' },
  { id: 'shield', icon: '📗', name: '《劳动法》护体免伤+1', color: '#10b981' }
]

export const LEVEL_DEFS = {
  1: {
    id: 1,
    name: '第一关 · 开放办公区整蛊战',
    subtitle: 'WASD/方向键移动，空格放【咖啡炸弹】炸箱子捡道具，用十字冲击波与肥皂陷阱轰飞王总！',
    bossName: '画饼王总',
    bossMaxHp: 100,
    bossSpeed: 96,
    hasMinion: false
  },
  2: {
    id: 2,
    name: '第二关 · 考勤主管老张围剿',
    subtitle: '小心！考勤主管老张加入巡逻！利用格子间绕视野，用连环炸弹+踢炸弹封路绝杀！',
    bossName: '画饼王总',
    bossMaxHp: 130,
    bossSpeed: 108,
    hasMinion: true,
    minionName: '考勤老张'
  },
  3: {
    id: 3,
    name: '第三关 · 顶层董事会终极爆破',
    subtitle: '高密文件山与双Boss高速巡视！吃满火焰范围与多颗炸弹，引爆全屏十字连环雷！',
    bossName: '资本大鳄董事长',
    bossMaxHp: 160,
    bossSpeed: 118,
    hasMinion: true,
    minionName: '冷面HR总监'
  }
}

// Zone definitions for visual floor rendering
export const OFFICE_ZONES = [
  { name: '🍵 茶水休息区', c1: 1, r1: 1, c2: 5, r2: 4, bg: '#e8f3ee', accent: '#cbd5e1' },
  { name: '👑 总裁办公室', c1: 9, r1: 1, c2: 13, r2: 4, bg: '#f7ebe8', accent: '#fecdd3' },
  { name: '📊 中央会议大厅', c1: 6, r1: 1, c2: 8, r2: 5, bg: '#f1f5f9', accent: '#e2e8f0' },
  { name: '💻 格子间工位区', c1: 1, r1: 5, c2: 7, r2: 9, bg: '#eff6ff', accent: '#dbeafe' },
  { name: '🖨️ 档案与快递室', c1: 8, r1: 5, c2: 13, r2: 9, bg: '#fefce8', accent: '#fef08a' }
]

export function cellToWorld(col, row) {
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

function buildGrid(levelNum) {
  const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(T_EMPTY))
  const crateMeta = {} // key "c,r" -> { kind: 'box' | 'files' | 'printer', drop: itemId | null }

  // Outer perimeter walls
  for (let c = 0; c < COLS; c++) {
    grid[0][c] = T_WALL
    grid[ROWS - 1][c] = T_WALL
  }
  for (let r = 0; r < ROWS; r++) {
    grid[r][0] = T_WALL
    grid[r][COLS - 1] = T_WALL
  }

  // Classic Bomberman alternating pillars + office partition walls
  for (let r = 2; r < ROWS - 1; r += 2) {
    for (let c = 2; c < COLS - 1; c += 2) {
      grid[r][c] = T_WALL
    }
  }

  // Extra office room dividers with doorways
  grid[1][8] = T_WALL // CEO room divider top
  grid[3][8] = T_WALL // CEO room doorway at row 2

  // Stealth potted plants (safe hiding spots at key intersections)
  const plantCoords = [
    [3, 1],
    [7, 3],
    [11, 3],
    [3, 7],
    [9, 7]
  ]
  for (const [c, r] of plantCoords) {
    if (grid[r][c] === T_EMPTY) grid[r][c] = T_PLANT
  }

  // Deterministic pseudo-random generator per level so layouts are rich and reproducible
  let seed = levelNum * 9973 + 1337
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }

  // Safe spawn zones (keep clear of crates):
  // Player starts at (1, 9) bottom-left; Boss starts at (13, 1) top-right; Minion at (13, 9)
  const keepClear = new Set([
    '1,9', '2,9', '1,8', '1,7',
    '13,1', '12,1', '13,2', '11,1',
    '13,9', '12,9', '13,8',
    '7,5', '6,5', '8,5'
  ])

  const dropPool = [
    'bomb_up', 'range_up', 'speed_up', 'kick', 'soap_ammo', 'shield',
    'bomb_up', 'range_up', 'speed_up', 'soap_ammo', 'kick', 'bomb_up', 'range_up'
  ]
  let dropIdx = 0

  const crateKinds = ['box', 'files', 'printer']
  for (let r = 1; r < ROWS - 1; r++) {
    for (let c = 1; c < COLS - 1; c++) {
      const key = `${c},${r}`
      if (grid[r][c] !== T_EMPTY || keepClear.has(key)) continue
      const density = levelNum === 1 ? 0.42 : levelNum === 2 ? 0.48 : 0.54
      if (rand() < density) {
        grid[r][c] = T_CRATE
        const hasDrop = rand() < 0.68
        const drop = hasDrop ? dropPool[dropIdx++ % dropPool.length] : null
        const kind = crateKinds[(c + r) % crateKinds.length]
        crateMeta[key] = { kind, drop }
      }
    }
  }

  // Ensure guaranteed early crates right next to player spawn so first bomb always drops a fun item!
  const guaranteedCrates = [
    [3, 9, 'bomb_up', 'box'],
    [1, 6, 'range_up', 'files'],
    [4, 7, 'kick', 'printer']
  ]
  for (const [c, r, drop, kind] of guaranteedCrates) {
    grid[r][c] = T_CRATE
    crateMeta[`${c},${r}`] = { kind, drop }
  }

  return { grid, crateMeta }
}

export function createPrankGame(levelNum = 1) {
  const cfg = LEVEL_DEFS[levelNum] || LEVEL_DEFS[1]
  const { grid, crateMeta } = buildGrid(cfg.id)

  const startPos = cellToWorld(1, 9)
  const player = {
    x: startPos.x,
    y: startPos.y,
    col: 1,
    row: 9,
    dirX: 0,
    dirY: -1,
    speed: 155,
    maxBombs: 1,
    activeBombs: 0,
    blastRange: 2,
    canKick: false,
    soapCount: 2,
    shields: 1,
    invulnTimer: 0,
    hiding: false,
    path: [], // BFS auto-walk waypoints [{col, row}]
    score: 0
  }

  const bossStart = cellToWorld(13, 1)
  const boss = {
    id: 'boss',
    name: cfg.bossName,
    x: bossStart.x,
    y: bossStart.y,
    col: 13,
    row: 1,
    dirX: -1,
    dirY: 0,
    speed: cfg.bossSpeed,
    hp: cfg.bossMaxHp,
    maxHp: cfg.bossMaxHp,
    rage: 0,
    combo: 0,
    maxCombo: 0,
    state: 'patrol', // 'patrol' | 'chase' | 'sliding' | 'stunned' | 'defeated'
    stateTimer: 0,
    invulnTimer: 0,
    thought: '巡视工位，看谁敢摸鱼！',
    slideDirX: 0,
    slideDirY: 0,
    targetCell: null
  }

  const enemies = [boss]
  if (cfg.hasMinion) {
    const mStart = cellToWorld(13, 9)
    enemies.push({
      id: 'minion',
      name: cfg.minionName,
      x: mStart.x,
      y: mStart.y,
      col: 13,
      row: 9,
      dirX: -1,
      dirY: 0,
      speed: cfg.bossSpeed * 0.88,
      hp: 60,
      maxHp: 60,
      state: 'patrol',
      stateTimer: 0,
      invulnTimer: 0,
      thought: '查考勤抓迟到！',
      slideDirX: 0,
      slideDirY: 0,
      targetCell: null
    })
  }

  let bombs = [] // { id, col, row, x, y, timer, range, vx, vy, owner }
  let blasts = [] // { col, row, timer, maxTimer, dir }
  let soaps = [] // { col, row, armed }
  let items = [] // { col, row, type, icon, name, color, bob }
  let events = [] // { type, text, x, y, at }
  let bombSeq = 1
  let clock = 0
  let gameState = 'playing' // 'playing' | 'won' | 'caught'
  let statusText = '🎮 WASD/方向键移动，按【空格】放咖啡炸弹，按【E】涂洗洁精陷阱！炸箱子爆强力道具！'

  function pushEvent(type, text, x, y) {
    events.push({ type, text, x, y, at: clock })
  }

  function isCellBlockedForWalk(col, row, ignoreBombAt = null) {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return true
    const t = grid[row][col]
    if (t === T_WALL || t === T_CRATE) return true
    const hasBomb = bombs.some(
      b => b.col === col && b.row === row && !(ignoreBombAt && ignoreBombAt.col === col && ignoreBombAt.row === row)
    )
    return hasBomb
  }

  // Smooth 2D grid movement with Bomberman corner-sliding assistance
  function moveEntity(ent, dx, dy, dt, isPlayer = false) {
    if (dx === 0 && dy === 0) return
    const len = Math.hypot(dx, dy)
    const nx = dx / len
    const ny = dy / len
    ent.dirX = nx
    ent.dirY = ny

    const curCell = worldToCell(ent.x, ent.y)
    const ignoreBomb = isPlayer ? { col: curCell.col, row: curCell.row } : null

    const stepDist = ent.speed * dt
    const radius = TILE * 0.34

    // Try moving X
    if (Math.abs(nx) > 0.01) {
      const nextX = ent.x + nx * stepDist
      const checkCol = Math.floor((nextX + Math.sign(nx) * radius - MAP_X) / TILE)
      const topRow = Math.floor((ent.y - radius * 0.75 - MAP_Y) / TILE)
      const botRow = Math.floor((ent.y + radius * 0.75 - MAP_Y) / TILE)

      // Check if player kicks a bomb!
      if (isPlayer && player.canKick) {
        const hitBomb = bombs.find(b => b.col === checkCol && b.row === curCell.row && b.vx === 0 && b.vy === 0)
        if (hitBomb && !(curCell.col === hitBomb.col && curCell.row === hitBomb.row)) {
          hitBomb.vx = Math.sign(nx) * 260
          hitBomb.vy = 0
          pushEvent('kick', '🥾 飞踢咖啡炸弹！', hitBomb.x, hitBomb.y - 20)
        }
      }

      if (!isCellBlockedForWalk(checkCol, topRow, ignoreBomb) && !isCellBlockedForWalk(checkCol, botRow, ignoreBomb)) {
        ent.x = nextX
      } else if (isPlayer) {
        // Corner slide Y toward center of current row if destination row is free
        const centerRowY = cellToWorld(curCell.col, curCell.row).y
        if (!isCellBlockedForWalk(checkCol, curCell.row, ignoreBomb) && Math.abs(ent.y - centerRowY) > 2) {
          ent.y += Math.sign(centerRowY - ent.y) * Math.min(Math.abs(centerRowY - ent.y), stepDist * 0.85)
        }
      }
    }

    // Try moving Y
    if (Math.abs(ny) > 0.01) {
      const nextY = ent.y + ny * stepDist
      const checkRow = Math.floor((nextY + Math.sign(ny) * radius - MAP_Y) / TILE)
      const leftCol = Math.floor((ent.x - radius * 0.75 - MAP_X) / TILE)
      const rightCol = Math.floor((ent.x + radius * 0.75 - MAP_X) / TILE)

      if (isPlayer && player.canKick) {
        const hitBomb = bombs.find(b => b.col === curCell.col && b.row === checkRow && b.vx === 0 && b.vy === 0)
        if (hitBomb && !(curCell.col === hitBomb.col && curCell.row === hitBomb.row)) {
          hitBomb.vx = 0
          hitBomb.vy = Math.sign(ny) * 260
          pushEvent('kick', '🥾 飞踢咖啡炸弹！', hitBomb.x, hitBomb.y - 20)
        }
      }

      if (!isCellBlockedForWalk(leftCol, checkRow, ignoreBomb) && !isCellBlockedForWalk(rightCol, checkRow, ignoreBomb)) {
        ent.y = nextY
      } else if (isPlayer) {
        // Corner slide X toward center of current col if destination col is free
        const centerColX = cellToWorld(curCell.col, curCell.row).x
        if (!isCellBlockedForWalk(curCell.col, checkRow, ignoreBomb) && Math.abs(ent.x - centerColX) > 2) {
          ent.x += Math.sign(centerColX - ent.x) * Math.min(Math.abs(centerColX - ent.x), stepDist * 0.85)
        }
      }
    }

    const updated = worldToCell(ent.x, ent.y)
    ent.col = updated.col
    ent.row = updated.row
  }

  // Place Bomberman coffee bomb at player's current cell
  function placeBomb() {
    if (gameState !== 'playing') return false
    const { col, row } = worldToCell(player.x, player.y)
    if (bombs.some(b => b.col === col && b.row === row)) {
      statusText = '当前格子已经有炸弹了！快走开或放洗洁精陷阱！'
      return false
    }
    if (player.activeBombs >= player.maxBombs) {
      statusText = `已达到同时放置上限 (${player.maxBombs}颗)！炸箱子捡【💣+1炸弹】可放更多！`
      return false
    }
    const pos = cellToWorld(col, row)
    bombs.push({
      id: bombSeq++,
      col,
      row,
      x: pos.x,
      y: pos.y,
      timer: 2.2,
      maxTimer: 2.2,
      range: player.blastRange,
      vx: 0,
      vy: 0
    })
    player.activeBombs++
    player.path = []
    pushEvent('arm', '💣 高压咖啡雷!', pos.x, pos.y - 18)
    statusText = '💣 已安放【高压特浓咖啡炸弹】！2.2秒后十字引爆，注意躲避冲击波！'
    return true
  }

  // Place slippery dish soap trap at player's current cell
  function placeSoap() {
    if (gameState !== 'playing') return false
    if (player.soapCount <= 0) {
      statusText = '🧼 洗洁精用完啦！炸开办公室箱子可补充【🧼 强力洗洁精】！'
      return false
    }
    const { col, row } = worldToCell(player.x, player.y)
    if (soaps.some(s => s.col === col && s.row === row)) {
      statusText = '这里已经涂过洗洁精啦！'
      return false
    }
    soaps.push({ col, row })
    player.soapCount--
    const pos = cellToWorld(col, row)
    pushEvent('soap', '🧼 涂满洗洁精!', pos.x, pos.y - 18)
    statusText = `🧼 已布置【洗洁精滑道】（剩余 ${player.soapCount} 瓶）！老板踩中会失控滑向走廊尽头！`
    return true
  }

  function triggerBombExplosion(bomb) {
    const idx = bombs.indexOf(bomb)
    if (idx === -1) return
    bombs.splice(idx, 1)
    player.activeBombs = Math.max(0, player.activeBombs - 1)

    const hitCells = [{ col: bomb.col, row: bomb.row, dir: 'center' }]
    const dirs = [
      { dc: 0, dr: -1, dir: 'up' },
      { dc: 0, dr: 1, dir: 'down' },
      { dc: -1, dr: 0, dir: 'left' },
      { dc: 1, dr: 0, dir: 'right' }
    ]

    for (const { dc, dr, dir } of dirs) {
      for (let step = 1; step <= bomb.range; step++) {
        const c = bomb.col + dc * step
        const r = bomb.row + dr * step
        if (c < 0 || c >= COLS || r < 0 || r >= ROWS) break
        const tile = grid[r][c]
        if (tile === T_WALL) break

        hitCells.push({ col: c, row: r, dir })

        if (tile === T_CRATE) {
          // Destroy crate and spawn item if any!
          grid[r][c] = T_EMPTY
          const key = `${c},${r}`
          const meta = crateMeta[key]
          if (meta?.drop) {
            const def = ITEM_TYPES.find(it => it.id === meta.drop)
            if (def) {
              items.push({ col: c, row: r, ...def, bob: 0 })
            }
          }
          player.score += 50
          const p = cellToWorld(c, r)
          pushEvent('break', '📦 炸碎杂物!', p.x, p.y - 10)
          break // Stop blast propagation in this direction after breaking crate
        }

        // Chain detonate any bomb in this cell!
        const chainedBomb = bombs.find(b => b.col === c && b.row === r)
        if (chainedBomb) {
          triggerBombExplosion(chainedBomb)
        }
      }
    }

    for (const hc of hitCells) {
      blasts.push({ col: hc.col, row: hc.row, dir: hc.dir, timer: 0.48, maxTimer: 0.48 })
    }

    const centerPos = cellToWorld(bomb.col, bomb.row)
    pushEvent('boom', '💥 咖啡冲击波!', centerPos.x, centerPos.y - 22)
    applyBlastDamage(hitCells)
  }

  function applyBlastDamage(hitCells) {
    // Check Enemies hit
    for (const en of enemies) {
      if (en.state === 'defeated' || en.invulnTimer > 0) continue
      const isHit = hitCells.some(hc => hc.col === en.col && hc.row === en.row)
      if (isHit) {
        const wasSliding = en.state === 'sliding' || en.state === 'stunned'
        const baseDmg = en.id === 'boss' ? 35 : 40
        const dmg = wasSliding ? Math.round(baseDmg * 1.6) : baseDmg
        en.hp = Math.max(0, en.hp - dmg)
        en.invulnTimer = 0.85

        if (en.id === 'boss') {
          boss.combo += wasSliding ? 2 : 1
          boss.maxCombo = Math.max(boss.maxCombo, boss.combo)
          boss.rage = Math.min(100, Math.round(((boss.maxHp - boss.hp) / boss.maxHp) * 100))
        }

        if (en.hp <= 0) {
          en.state = 'defeated'
          en.thought = '🏳️ 别炸了！我准点下班批年假！！'
          pushEvent('ko', `🎉 炸翻${en.name}！`, en.x, en.y - 28)
          if (en.id === 'boss') {
            gameState = 'won'
            statusText = `🎉 大获全胜！${boss.name}被十字连环咖啡雷彻底炸服，全员准点下班！`
          } else {
            statusText = `💥 考勤老张被炸晕出局！继续集中火力轰炸${boss.name}！`
          }
        } else {
          en.state = 'stunned'
          en.stateTimer = 2.0
          en.thought = wasSliding
            ? '🔥 肥皂滑铲接咖啡炸弹？！连环暴击痛死我了！！'
            : '☕ 咳咳咳！烫死我了！谁放的高压咖啡雷？！'
          pushEvent(
            'prank',
            `${wasSliding ? '🔥 连环暴击' : '💥 炸中'}${en.name} -${dmg}HP!`,
            en.x,
            en.y - 26
          )
          statusText = `💥 漂亮！炸中${en.name}（剩余HP: ${en.hp}/${en.maxHp}）！快趁他眩晕再来一发！`
        }
      }
    }

    // Check Player self-blast (unless invulnerable)
    if (player.invulnTimer <= 0) {
      const playerHit = hitCells.some(hc => hc.col === player.col && hc.row === player.row)
      if (playerHit) {
        if (player.shields > 0) {
          player.shields--
          player.invulnTimer = 1.8
          pushEvent('shield', '📗 《劳动法》挡下爆炸！', player.x, player.y - 24)
          statusText = '📗 险些炸到自己！幸好《劳动法》护盾帮你挡下了一次冲击波！'
        } else {
          player.invulnTimer = 1.5
          pushEvent('warn', '😵 被自己的咖啡波及！', player.x, player.y - 24)
          statusText = '😵 哎呀！被自己的咖啡冲击波溅到了，放完炸弹记得拐进十字路口躲避！'
        }
      }
    }
  }

  // BFS Pathfinding for click-to-move on the top-down map
  function findPath(startCol, startRow, goalCol, goalRow) {
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
        // Allow walking into target cell even if it's a crate (stop adjacent)
        if (isCellBlockedForWalk(nc, nr)) continue
        const nextPath = [...cur.path, { col: nc, row: nr }]
        if (nc === goalCol && nr === goalRow) return nextPath
        visited.add(key)
        q.push({ col: nc, row: nr, path: nextPath })
      }
    }
    return []
  }

  function commandPlayerToCell(col, row) {
    if (gameState !== 'playing') return false
    const clampedCol = Math.max(1, Math.min(COLS - 2, col))
    const clampedRow = Math.max(1, Math.min(ROWS - 2, row))
    const path = findPath(player.col, player.row, clampedCol, clampedRow)
    if (path.length > 0) {
      player.path = path
      return true
    }
    return false
  }

  function hasLineOfSight(c1, r1, c2, r2) {
    if (player.hiding) return false
    if (c1 === c2) {
      const minR = Math.min(r1, r2)
      const maxR = Math.max(r1, r2)
      if (maxR - minR > 5) return false
      for (let r = minR + 1; r < maxR; r++) {
        if (grid[r][c1] === T_WALL || grid[r][c1] === T_CRATE) return false
      }
      return true
    }
    if (r1 === r2) {
      const minC = Math.min(c1, c2)
      const maxC = Math.max(c1, c2)
      if (maxC - minC > 6) return false
      for (let c = minC + 1; c < maxC; c++) {
        if (grid[r1][c] === T_WALL || grid[r1][c] === T_CRATE) return false
      }
      return true
    }
    return false
  }

  function pickNextEnemyCell(en) {
    const dirs = [
      { dc: 0, dr: -1 },
      { dc: 0, dr: 1 },
      { dc: -1, dr: 0 },
      { dc: 1, dr: 0 }
    ]
    // Avoid cells with active bombs if possible!
    const valid = dirs
      .map(d => ({ col: en.col + d.dc, row: en.row + d.dr, dc: d.dc, dr: d.dr }))
      .filter(n => !isCellBlockedForWalk(n.col, n.row))

    if (valid.length === 0) return null

    // If chasing player, pick neighbor closest to player
    if (en.state === 'chase') {
      valid.sort(
        (a, b) =>
          Math.hypot(a.col - player.col, a.row - player.row) -
          Math.hypot(b.col - player.col, b.row - player.row)
      )
      return valid[0]
    }

    // Prefer continuing forward or turning at intersections
    const forward = valid.find(v => v.dc === Math.round(en.dirX) && v.dr === Math.round(en.dirY))
    if (forward && valid.length <= 2) return forward
    const nonReverse = valid.filter(
      v => !(v.dc === -Math.round(en.dirX) && v.dr === -Math.round(en.dirY))
    )
    const pool = nonReverse.length > 0 ? nonReverse : valid
    return pool[Math.floor((clock * 17 + en.col * 7 + en.row * 13) % pool.length)]
  }

  function updateEnemies(dt) {
    for (const en of enemies) {
      if (en.state === 'defeated') continue
      if (en.invulnTimer > 0) en.invulnTimer = Math.max(0, en.invulnTimer - dt)

      if (en.state === 'stunned') {
        en.stateTimer -= dt
        if (en.stateTimer <= 0) {
          en.state = 'patrol'
          en.targetCell = null
          en.thought = '可恶！别让我抓到是谁干的！'
          if (en.id === 'boss') boss.combo = 0
        }
        continue
      }

      // Check if enemy steps on a soap trap!
      const soapIdx = soaps.findIndex(s => s.col === en.col && s.row === en.row)
      if (soapIdx !== -1 && en.state !== 'sliding') {
        soaps.splice(soapIdx, 1)
        en.state = 'sliding'
        // Slide along current movement direction (or toward nearest open hallway)
        let sdx = Math.abs(en.dirX) >= Math.abs(en.dirY) ? Math.sign(en.dirX || -1) : 0
        let sdy = sdx === 0 ? Math.sign(en.dirY || 1) : 0
        if (isCellBlockedForWalk(en.col + sdx, en.row + sdy)) {
          const alt = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]
          ].find(([dc, dr]) => !isCellBlockedForWalk(en.col + dc, en.row + dr))
          if (alt) {
            sdx = alt[0]
            sdy = alt[1]
          }
        }
        en.slideDirX = sdx
        en.slideDirY = sdy
        en.thought = '🧼 哇啊啊踩到洗洁精滑倒了！！'
        if (en.id === 'boss') {
          boss.combo += 1
          boss.maxCombo = Math.max(boss.maxCombo, boss.combo)
        }
        pushEvent('soap', `🧼 ${en.name}脚底打滑！`, en.x, en.y - 24)
        continue
      }

      if (en.state === 'sliding') {
        const slideSpd = 290
        const nextX = en.x + en.slideDirX * slideSpd * dt
        const nextY = en.y + en.slideDirY * slideSpd * dt
        const checkCol = Math.floor((nextX + en.slideDirX * (TILE * 0.36) - MAP_X) / TILE)
        const checkRow = Math.floor((nextY + en.slideDirY * (TILE * 0.36) - MAP_Y) / TILE)
        if (!isCellBlockedForWalk(checkCol, checkRow)) {
          en.x = nextX
          en.y = nextY
          const c = worldToCell(en.x, en.y)
          en.col = c.col
          en.row = c.row
        } else {
          // Crashed into wall or bomb at end of slide!
          const center = cellToWorld(en.col, en.row)
          en.x = center.x
          en.y = center.y
          en.state = 'stunned'
          en.stateTimer = 1.8
          en.hp = Math.max(1, en.hp - 12)
          if (en.id === 'boss') {
            boss.rage = Math.min(100, Math.round(((boss.maxHp - boss.hp) / boss.maxHp) * 100))
          }
          en.thought = '💫 咚！一头撞在墙上眼冒金星...'
          pushEvent('prank', `💫 滑铲撞墙 -12HP!`, en.x, en.y - 24)
        }
        continue
      }

      // Check Line of Sight to player
      if (hasLineOfSight(en.col, en.row, player.col, player.row)) {
        if (en.state !== 'chase') {
          en.state = 'chase'
          en.thought = '❗ 抓到你到处乱窜了！给我站住！'
        }
      } else if (en.state === 'chase') {
        en.state = 'patrol'
        en.thought = '咦？人躲哪去了？继续巡视！'
      }

      // Move toward targetCell center
      if (!en.targetCell || isCellBlockedForWalk(en.targetCell.col, en.targetCell.row)) {
        en.targetCell = pickNextEnemyCell(en)
      }

      if (en.targetCell) {
        const targetPos = cellToWorld(en.targetCell.col, en.targetCell.row)
        const dx = targetPos.x - en.x
        const dy = targetPos.y - en.y
        const dist = Math.hypot(dx, dy)
        const spd = en.state === 'chase' ? en.speed * 1.18 : en.speed
        if (dist > 3) {
          en.dirX = dx / dist
          en.dirY = dy / dist
          en.x += en.dirX * Math.min(dist, spd * dt)
          en.y += en.dirY * Math.min(dist, spd * dt)
          const c = worldToCell(en.x, en.y)
          en.col = c.col
          en.row = c.row
        } else {
          en.x = targetPos.x
          en.y = targetPos.y
          en.col = en.targetCell.col
          en.row = en.targetCell.row
          en.targetCell = pickNextEnemyCell(en)
        }
      }

      // Check collision with player (if not hiding & not invulnerable)
      if (!player.hiding && player.invulnTimer <= 0) {
        const dPlayer = Math.hypot(en.x - player.x, en.y - player.y)
        if (dPlayer < TILE * 0.56) {
          if (player.shields > 0) {
            player.shields--
            player.invulnTimer = 2.0
            en.state = 'stunned'
            en.stateTimer = 1.4
            en.thought = '📗 哎哟！拿《劳动法》顶我？！'
            pushEvent('shield', '📗 劳动法护盾弹开老板！', player.x, player.y - 24)
            statusText = '📗 触发《劳动法》护盾弹晕了老板！趁现在放咖啡炸弹反击！'
          } else {
            gameState = 'caught'
            en.thought = '🚨 抓到你现行了！今晚通宵改100版方案！'
            statusText = `🚨 被${en.name}当场逮住了！利用十字过道放炸弹封路，或躲进【🌿绿植】避开视线！`
            pushEvent('caught', '🚨 被抓去通宵加班！', player.x, player.y - 24)
          }
        }
      }
    }
  }

  function updateBombsAndItems(dt) {
    // Update sliding/ticking bombs
    for (const b of [...bombs]) {
      if (b.vx !== 0 || b.vy !== 0) {
        const nx = b.x + b.vx * dt
        const ny = b.y + b.vy * dt
        const checkCol = Math.floor((nx + Math.sign(b.vx) * (TILE * 0.38) - MAP_X) / TILE)
        const checkRow = Math.floor((ny + Math.sign(b.vy) * (TILE * 0.38) - MAP_Y) / TILE)
        const hitEnemy = enemies.find(
          e => e.state !== 'defeated' && Math.hypot(e.x - nx, e.y - ny) < TILE * 0.55
        )
        if (!isCellBlockedForWalk(checkCol, checkRow, b) && !hitEnemy) {
          b.x = nx
          b.y = ny
          const c = worldToCell(b.x, b.y)
          b.col = c.col
          b.row = c.row
        } else {
          b.vx = 0
          b.vy = 0
          const center = cellToWorld(b.col, b.row)
          b.x = center.x
          b.y = center.y
        }
      }

      b.timer -= dt
      if (b.timer <= 0) {
        triggerBombExplosion(b)
      }
    }

    // Update blasts
    for (const bl of blasts) {
      bl.timer -= dt
    }
    blasts = blasts.filter(bl => bl.timer > 0)

    // Check player picking up dropped power-ups
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i]
      it.bob += dt * 5
      if (it.col === player.col && it.row === player.row) {
        items.splice(i, 1)
        player.score += 100
        if (it.id === 'bomb_up') player.maxBombs = Math.min(5, player.maxBombs + 1)
        else if (it.id === 'range_up') player.blastRange = Math.min(6, player.blastRange + 1)
        else if (it.id === 'speed_up') player.speed = Math.min(235, player.speed + 22)
        else if (it.id === 'kick') player.canKick = true
        else if (it.id === 'soap_ammo') player.soapCount += 2
        else if (it.id === 'shield') player.shields += 1

        const pos = cellToWorld(it.col, it.row)
        pushEvent('loot', `🎁 ${it.icon} ${it.name}`, pos.x, pos.y - 20)
        statusText = `🎁 捡到整蛊道具：【${it.icon} ${it.name}】！战斗力大幅提升！`
      }
    }
  }

  function updatePlayerAutoPath(dt) {
    if (player.path.length === 0) return
    const nextCell = player.path[0]
    const targetPos = cellToWorld(nextCell.col, nextCell.row)
    const dx = targetPos.x - player.x
    const dy = targetPos.y - player.y
    const dist = Math.hypot(dx, dy)
    if (dist > 4) {
      moveEntity(player, dx, dy, dt, true)
    } else {
      player.x = targetPos.x
      player.y = targetPos.y
      player.col = nextCell.col
      player.row = nextCell.row
      player.path.shift()
    }
  }

  function step(dt = 1 / 60, inputDir = { dx: 0, dy: 0 }) {
    if (gameState !== 'playing') return
    clock += dt
    if (player.invulnTimer > 0) player.invulnTimer = Math.max(0, player.invulnTimer - dt)

    if (inputDir.dx !== 0 || inputDir.dy !== 0) {
      player.path = []
      moveEntity(player, inputDir.dx, inputDir.dy, dt, true)
    } else {
      updatePlayerAutoPath(dt)
    }

    // Player is hidden when standing on a T_PLANT tile
    player.hiding = grid[player.row]?.[player.col] === T_PLANT

    updateBombsAndItems(dt)
    updateEnemies(dt)
  }

  // One-click demo: sets up a glorious chain of soap + multi-bombs right around the Boss!
  function armAllChainDemo() {
    if (gameState !== 'playing') return
    player.maxBombs = 4
    player.blastRange = 4
    player.canKick = true

    // Clear area around center meeting hall (7, 3) and place Boss + soap + 3 chained coffee bombs!
    for (let c = 5; c <= 9; c++) {
      if (grid[3][c] === T_CRATE) grid[3][c] = T_EMPTY
    }
    const bossPos = cellToWorld(6, 3)
    boss.x = bossPos.x
    boss.y = bossPos.y
    boss.col = 6
    boss.row = 3
    boss.dirX = 1
    boss.dirY = 0
    boss.hp = 60
    boss.state = 'patrol'

    // Put soap at (6, 3) so boss immediately slips rightward into (7,3) & (8,3) where 3 bombs are waiting!
    soaps.push({ col: 6, row: 3 })
    for (const bc of [7, 8, 9]) {
      const bp = cellToWorld(bc, 3)
      bombs.push({
        id: bombSeq++,
        col: bc,
        row: 3,
        x: bp.x,
        y: bp.y,
        timer: 0.65,
        maxTimer: 2.2,
        range: 4,
        vx: 0,
        vy: 0
      })
    }

    // Put player safely in nearby plant (7, 5)
    const safePos = cellToWorld(3, 1)
    player.x = safePos.x
    player.y = safePos.y
    player.col = 3
    player.row = 1
    player.hiding = true
    statusText = '🎬 连环爆破大戏上演：老板踩中【洗洁精滑道】直冲【3颗特浓咖啡连环雷】！'
  }

  function snapshot() {
    let crateCount = 0
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c] === T_CRATE) crateCount++
      }
    }
    return {
      level: cfg.id,
      levelName: cfg.name,
      gameState,
      statusText,
      clock: Number(clock.toFixed(2)),
      crateCount,
      player: {
        col: player.col,
        row: player.row,
        x: Math.round(player.x),
        y: Math.round(player.y),
        maxBombs: player.maxBombs,
        activeBombs: player.activeBombs,
        blastRange: player.blastRange,
        canKick: player.canKick,
        soapCount: player.soapCount,
        shields: player.shields,
        hiding: player.hiding,
        score: player.score
      },
      boss: {
        col: boss.col,
        row: boss.row,
        x: Math.round(boss.x),
        y: Math.round(boss.y),
        hp: boss.hp,
        maxHp: boss.maxHp,
        rage: boss.rage,
        combo: boss.combo,
        maxCombo: boss.maxCombo,
        state: boss.state,
        thought: boss.thought
      },
      bombs: bombs.map(b => ({ col: b.col, row: b.row, timer: Number(b.timer.toFixed(2)) })),
      soaps: soaps.map(s => ({ col: s.col, row: s.row })),
      items: items.map(it => ({ col: it.col, row: it.row, id: it.id, name: it.name }))
    }
  }

  return {
    cfg,
    grid,
    crateMeta,
    player,
    boss,
    enemies,
    bombs,
    blasts,
    soaps,
    items,
    events,
    step,
    placeBomb,
    placeSoap,
    commandPlayerToCell,
    armAllChainDemo,
    snapshot,
    get gameState() {
      return gameState
    },
    get statusText() {
      return statusText
    }
  }
}

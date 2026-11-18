import {
  COLS,
  ROWS,
  TILE,
  MAP_X,
  MAP_Y,
  T_WALL,
  T_CARPET,
  T_HIDE,
  T_GLASS,
  T_GATE,
  ZONES,
  cellCenter as defaultCellCenter
} from './stealthGame.js'

const CHAPTER_PALETTES = {
  1: ['#fff7d6', '#ffe1b5', '#ffc2b4'], // 晨间薄荷暖黄
  2: ['#fff0c4', '#ffd0a6', '#ffacac'], // 午后蜜桃暖阳
  3: ['#ffefc2', '#ffbe98', '#ff9ebb'], // 狂飙珊瑚橙粉
  4: ['#fde6cf', '#f3c4fb', '#cddafd'], // 傍晚薰衣草霞光
  5: ['#e5d4ff', '#ffc6ff', '#ffd6a5']  // 终章霓虹紫金
}

const ZONE_META = [
  { key: 'tea', c1: 1, r1: 1, c2: 5, r2: 4, bg: '#eefaf2', label: '☕ 茶水间', lc: 1, lr: 1 },
  { key: 'ceo', c1: 6, r1: 1, c2: 10, r2: 4, bg: '#fbf0df', label: '👑 王总室', lc: 6, lr: 1 },
  { key: 'cubicles', c1: 11, r1: 1, c2: 16, r2: 6, bg: '#eef3fc', label: '💻 工位区', lc: 11, lr: 1 },
  { key: 'lobby', c1: 1, r1: 5, c2: 11, r2: 11, bg: '#fffaf0', label: '🏢 前台大厅', lc: 1, lr: 5 },
  { key: 'restroom', c1: 12, r1: 7, c2: 16, r2: 11, bg: '#e6f7fc', label: '🚽 摸鱼厕', lc: 12, lr: 7 }
]

const FOCUS_ZONE_RECTS = {
  tea: { c1: 1, r1: 1, c2: 5, r2: 4 },
  ceo: { c1: 6, r1: 1, c2: 10, r2: 4 },
  cubicles: { c1: 11, r1: 1, c2: 16, r2: 6 },
  lobby: { c1: 1, r1: 5, c2: 11, r2: 11 },
  restroom: { c1: 12, r1: 7, c2: 16, r2: 11 }
}

function zoneKeyAt(col, row) {
  for (const [key, zz] of Object.entries(FOCUS_ZONE_RECTS)) {
    if (col >= zz.c1 && col <= zz.c2 && row >= zz.r1 && row <= zz.r2) return key
  }
  return null
}

function hash01(a, b, seed = 0) {
  const n = Math.sin(a * 127.1 + b * 311.7 + seed * 74.7) * 43758.5453
  return n - Math.floor(n)
}

export function createOfficeRenderer(ctx, geo = {}) {
  const VW = geo.VW ?? 390
  const VH = geo.VH ?? 844
  const T = geo.T ?? 28
  const S = geo.S ?? T / TILE
  const OX = geo.OX ?? Math.round((VW - ROWS * T) / 2)
  const OY = geo.OY ?? 84
  const MAP_SW = geo.MAP_SW ?? ROWS * T
  const MAP_SH = geo.MAP_SH ?? COLS * T
  const INK = geo.INK ?? '#2b2d42'
  const FONT = geo.FONT ?? ((size, w = 900) => `${w} ${size}px "PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif`)
  const P = geo.P ?? ((x, y) => ({ x: OX + (y - MAP_Y) * S, y: OY + (x - MAP_X) * S }))
  const A = geo.A ?? (a => Math.PI / 2 - a)
  const tileRect = geo.tileRect ?? ((c, r) => ({ x: OX + r * T, y: OY + c * T }))
  const cellCenter = geo.cellCenter ?? defaultCellCenter

  let lastGame = null
  let lastClock = 0
  const localThoughtSeen = new Map()
  let pillBoxes = []
  let lightCanvas = null
  let lightCtx = null

  // 玩家自定义老板形象配置
  let bossProfile = {
    name: '王总',
    catchphrase: '今天简单讲两句！',
    hair: 'combover',   // 'combover' | 'slick' | 'afro' | 'bald' | 'perm' | 'bun'
    glasses: 'shades',  // 'shades' | 'gold_rim' | 'thick_frame' | 'monocle' | 'sharp'
    suit: 'navy_gold',  // 'navy_gold' | 'burgundy' | 'polo' | 'tech_vest' | 'queen_red' | 'white_chain'
    beard: 'mustache',  // 'mustache' | 'goatee' | 'full_beard' | 'lipstick' | 'clean'
    bodyShape: 'chubby' // 'chubby' | 'normal' | 'wide'
  }

  const SUIT_STYLES = {
    navy_gold: { body: '#2b2d42', tie: '#ffbe0b' },
    burgundy: { body: '#800f2f', tie: '#2b2d42' },
    polo: { body: '#2d6a4f', tie: null, polo: true },
    tech_vest: { body: '#495057', tie: '#4cc9f0' },
    queen_red: { body: '#d90429', tie: null, pearls: true },
    white_chain: { body: '#f8f9fa', tie: null, goldChain: true }
  }

  function setBossProfile(next = {}) {
    bossProfile = { ...bossProfile, ...next }
    const st = SUIT_STYLES[bossProfile.suit] || SUIT_STYLES.navy_gold
    LOOKS.boss.body = st.body
    LOOKS.boss.tie = st.tie
    LOOKS.boss.polo = Boolean(st.polo)
    LOOKS.boss.pearls = Boolean(st.pearls)
    LOOKS.boss.goldChain = Boolean(st.goldChain)
    LOOKS.boss.belly = bossProfile.bodyShape !== 'normal'
    LOOKS.boss.wide = bossProfile.bodyShape === 'wide'
  }

  function sync(a, b) {
    if (a && typeof a === 'object' && ('grid' in a || 'player' in a || 'objects' in a)) {
      lastGame = a
      if (typeof b === 'number') lastClock = b
      else if (typeof a.clock === 'number') lastClock = a.clock
    } else if (typeof a === 'number') {
      lastClock = a
      if (b && typeof b === 'object' && ('grid' in b || 'player' in b)) lastGame = b
    }
    if (!lastGame && geo.getGame) lastGame = geo.getGame()
    if (geo.getClock && typeof a !== 'number' && typeof b !== 'number') lastClock = geo.getClock()
    return { game: lastGame, clock: lastClock }
  }

  const tileAt = (game, c, r) => game?.grid?.[r]?.[c]

  // ================= 基础卡通矢量图元 =================
  function rr(x, y, w, h, r, fill, stroke = INK, lw = 2.2) {
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, r)
    if (fill) {
      ctx.fillStyle = fill
      ctx.fill()
    }
    if (stroke && lw > 0) {
      ctx.strokeStyle = stroke
      ctx.lineWidth = lw
      ctx.stroke()
    }
  }

  function circle(x, y, r, fill, stroke = INK, lw = 2.2) {
    if (r <= 0) return
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    if (fill) {
      ctx.fillStyle = fill
      ctx.fill()
    }
    if (stroke && lw > 0) {
      ctx.strokeStyle = stroke
      ctx.lineWidth = lw
      ctx.stroke()
    }
  }

  function ellipse(x, y, rx, ry, rot = 0, fill = null, stroke = null, lw = 2) {
    ctx.beginPath()
    ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2)
    if (fill) {
      ctx.fillStyle = fill
      ctx.fill()
    }
    if (stroke && lw > 0) {
      ctx.strokeStyle = stroke
      ctx.lineWidth = lw
      ctx.stroke()
    }
  }

  const replaceBossName = s => {
    const str = String(s ?? '')
    return bossProfile.name && bossProfile.name !== '王总' ? str.replaceAll('王总', bossProfile.name) : str
  }

  function text(t, x, y, { size = 11, weight = 900, color = INK, align = 'left', stroke = null, sw = 3.5, base = 'alphabetic', max } = {}) {
    if (t === undefined || t === null || t === '') return
    const str = replaceBossName(t)
    ctx.font = FONT(size, weight)
    ctx.textAlign = align
    ctx.textBaseline = base
    if (stroke) {
      ctx.lineJoin = 'round'
      ctx.strokeStyle = stroke
      ctx.lineWidth = sw
      ctx.strokeText(str, x, y, max)
    }
    ctx.fillStyle = color
    ctx.fillText(str, x, y, max)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
  }

  function star4(cx, cy, rOuter, rInner, fill = '#ffffff', stroke = null, lw = 1.2) {
    ctx.beginPath()
    for (let i = 0; i < 8; i++) {
      const r = i % 2 === 0 ? rOuter : rInner
      const ang = (i * Math.PI) / 4
      const px = cx + Math.cos(ang) * r
      const py = cy + Math.sin(ang) * r
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    if (fill) {
      ctx.fillStyle = fill
      ctx.fill()
    }
    if (stroke) {
      ctx.strokeStyle = stroke
      ctx.lineWidth = lw
      ctx.stroke()
    }
  }

  function burstShape(x, y, r1, r2, n, fill, stroke = INK, lw = 2.2) {
    ctx.beginPath()
    for (let i = 0; i < n * 2; i++) {
      const r = i % 2 ? r2 : r1
      const a = (Math.PI * i) / n - Math.PI / 2
      if (i === 0) ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r)
      else ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r)
    }
    ctx.closePath()
    if (fill) {
      ctx.fillStyle = fill
      ctx.fill()
    }
    if (stroke) {
      ctx.strokeStyle = stroke
      ctx.lineWidth = lw
      ctx.stroke()
    }
  }

  function wrapLines(t, maxW, size) {
    if (!t) return []
    ctx.font = FONT(size)
    const lines = []
    let line = ''
    for (const ch of replaceBossName(t)) {
      if (ctx.measureText(line + ch).width > maxW) {
        lines.push(line)
        line = ch
      } else {
        line += ch
      }
    }
    if (line) lines.push(line)
    return lines
  }

  // 防重叠胶囊气泡标签
  function pill(label, cx, cy, { size = 8.5, bg = '#fffdf5', fg = INK, border = INK, lw = 1.7, avoidOverlap = true } = {}) {
    if (!label) return
    const str = replaceBossName(label)
    ctx.font = FONT(size, 800)
    const tw = Math.min(MAP_SW - 12, ctx.measureText(str).width + 10)
    const th = size + 7
    let x = Math.max(OX + 3, Math.min(OX + MAP_SW - tw - 3, cx - tw / 2))
    let y = Math.max(OY + 3, Math.min(OY + MAP_SH - th - 3, cy - th / 2))

    if (avoidOverlap) {
      for (let attempt = 0; attempt < 3; attempt++) {
        const hit = pillBoxes.find(b => x < b.x + b.w + 2 && x + tw + 2 > b.x && y < b.y + b.h + 2 && y + th + 2 > b.y)
        if (!hit) break
        y = Math.max(OY + 3, hit.y - th - 3)
      }
      pillBoxes.push({ x, y, w: tw, h: th })
    }

    rr(x, y, tw, th, th / 2, bg, border, lw)
    text(label, x + tw / 2, y + th / 2 + 0.5, { size, weight: 800, color: fg, align: 'center', base: 'middle', max: tw - 6 })
  }

  // ================= 1. 阳光背景与漂浮几何光斑 =================
  function drawBackdrop(a, b) {
    const { game, clock } = sync(a, b)
    pillBoxes = []
    const chapter = game?.cfg?.chapter || game?.chapter || (game?.cfg?.level ? Math.min(5, Math.ceil(game.cfg.level / 3.3)) : 1)
    const pal = game?.blackout ? ['#1d2440', '#2b3558', '#3c2a4d'] : CHAPTER_PALETTES[chapter] || CHAPTER_PALETTES[1]

    const g = ctx.createLinearGradient(0, 0, VW * 0.35, VH)
    g.addColorStop(0, pal[0])
    g.addColorStop(0.52, pal[1])
    g.addColorStop(1, pal[2])
    ctx.fillStyle = g
    ctx.fillRect(0, 0, VW, VH)

    // 柔和晨光/霞光斜向光晕
    const sunGrad = ctx.createRadialGradient(VW * 0.85, OY * 0.6, 10, VW * 0.85, OY * 0.6, 260)
    sunGrad.addColorStop(0, game?.blackout ? 'rgba(114,9,183,0.18)' : 'rgba(255,255,240,0.55)')
    sunGrad.addColorStop(1, 'rgba(255,255,240,0)')
    ctx.fillStyle = sunGrad
    ctx.fillRect(0, 0, VW, VH)

    // 漂浮几何微粒（圆斑 + 圆角菱形纸片）
    ctx.save()
    for (let i = 0; i < 24; i++) {
      const bx = (i * 89 + Math.sin(clock * 0.45 + i) * 14 + VW) % VW
      const by = (i * 137 + clock * (4 + (i % 3) * 2)) % VH
      const sz = 2.2 + (i % 4) * 1.1
      ctx.fillStyle = game?.blackout ? 'rgba(144,224,239,0.16)' : 'rgba(255,255,255,0.38)'
      if (i % 3 === 0) {
        ctx.save()
        ctx.translate(bx, by)
        ctx.rotate(clock * 0.5 + i)
        rr(-sz, -sz, sz * 2, sz * 2, 1.5, ctx.fillStyle, null, 0)
        ctx.restore()
      } else {
        circle(bx, by, sz, ctx.fillStyle, null, 0)
      }
    }
    ctx.restore()
  }

  // ================= 2. 立体木质沙盘外框与五大分区精细地面 =================
  function drawFloor(a, b) {
    const { game, clock } = sync(a, b)
    if (!game?.grid) return
    const layout = game.cfg?.layout || 'classic'

    // 2.1 立体胡桃木微缩沙盘底座 + 投影 + 黄铜包角铆钉
    rr(OX - 11, OY - 6, MAP_SW + 22, MAP_SH + 24, 22, 'rgba(43,45,66,0.24)', null, 0)
    rr(OX - 10, OY - 10, MAP_SW + 20, MAP_SH + 24, 20, '#b07d4f', INK, 3.2)
    rr(OX - 10, OY - 10, MAP_SW + 20, MAP_SH + 19, 19, '#dda15e', INK, 2.6)
    // 木纹高光条
    ctx.strokeStyle = 'rgba(255,248,231,0.38)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(OX + 16, OY - 6)
    ctx.lineTo(OX + MAP_SW - 16, OY - 6)
    ctx.stroke()
    // 四个黄铜护角铆钉
    for (const [cx, cy] of [
      [OX - 5, OY - 5],
      [OX + MAP_SW + 5, OY - 5],
      [OX - 5, OY + MAP_SH + 5],
      [OX + MAP_SW + 5, OY + MAP_SH + 5]
    ]) {
      circle(cx, cy, 3.2, '#ffd166', INK, 1.4)
    }
    // 象牙白内衬卡口
    rr(OX - 4, OY - 4, MAP_SW + 8, MAP_SH + 8, 13, '#fff9ec', INK, 2)

    ctx.save()
    ctx.beginPath()
    ctx.roundRect(OX, OY, MAP_SW, MAP_SH, 10)
    ctx.clip()

    // 基础底色
    const theme = game.cfg?.sceneTheme || 'full_office'
    ctx.fillStyle = '#fffaf0'
    ctx.fillRect(OX, OY, MAP_SW, MAP_SH)

    if (theme === 'full_office') {
      // ========== 场景1：全公司综合办公区全景 (Lv1, 2, 3, 15) ==========
      for (const zm of ZONE_META) {
        const p0 = tileRect(zm.c1, zm.r1)
        ctx.fillStyle = zm.bg
        ctx.fillRect(p0.x, p0.y, (zm.r2 - zm.r1 + 1) * T, (zm.c2 - zm.c1 + 1) * T)
      }

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const t = tileAt(game, c, r)
          if (t === T_WALL) continue
          const { x, y } = tileRect(c, r)
          const inTea = c >= 1 && c <= 5 && r >= 1 && r <= 4
          const inCeo = c >= 6 && c <= 10 && r >= 1 && r <= 4
          const inCub = c >= 11 && c <= 16 && r >= 1 && r <= 6
          const inRest = c >= 12 && c <= 16 && r >= 7 && r <= 11

          if (inTea) {
            if ((r + c) % 2 === 0) {
              ctx.fillStyle = '#d8f3dc'
              ctx.fillRect(x, y, T, T)
            }
            ctx.fillStyle = 'rgba(82,183,136,0.28)'
            ctx.beginPath()
            ctx.moveTo(x + T / 2, y + 2)
            ctx.lineTo(x + T / 2 + 2.2, y + T / 2)
            ctx.lineTo(x + T / 2, y + T - 2)
            ctx.lineTo(x + T / 2 - 2.2, y + T / 2)
            ctx.fill()
          } else if (inCeo) {
            ctx.fillStyle = (c + r) % 2 === 0 ? '#f3dfc1' : '#ebd0ab'
            ctx.fillRect(x, y, T, T)
            ctx.strokeStyle = 'rgba(156,102,68,0.22)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(x, y + T * 0.5)
            ctx.lineTo(x + T * 0.5, y)
            ctx.lineTo(x + T, y + T * 0.5)
            ctx.moveTo(x, y + T)
            ctx.lineTo(x + T * 0.5, y + T * 0.5)
            ctx.lineTo(x + T, y + T)
            ctx.stroke()
          } else if (inCub) {
            ctx.fillStyle = (r + c) % 2 === 0 ? '#e3ecfa' : '#edf2fb'
            ctx.fillRect(x, y, T, T)
            ctx.fillStyle = 'rgba(73,80,87,0.06)'
            ctx.fillRect(x + 3, y + 3, T - 6, 1.2)
            ctx.fillRect(x + 3, y + T - 5, T - 6, 1.2)
          } else if (inRest) {
            const h = T / 2
            for (let ix = 0; ix < 2; ix++) {
              for (let iy = 0; iy < 2; iy++) {
                ctx.fillStyle = (ix + iy + r + c) % 2 === 0 ? '#d6f3fa' : '#eaf9fd'
                ctx.fillRect(x + ix * h + 0.5, y + iy * h + 0.5, h - 1, h - 1)
              }
            }
          } else {
            ctx.fillStyle = (r + c) % 2 === 0 ? '#fffcf5' : '#fbf6eb'
            ctx.fillRect(x, y, T, T)
            const colors = ['#ffadad', '#9bf6ff', '#ffd166', '#bdb2ff']
            for (let k = 0; k < 3; k++) {
              const sx = x + 4 + hash01(c, r, k * 3 + 1) * (T - 8)
              const sy = y + 4 + hash01(c, r, k * 3 + 2) * (T - 8)
              ctx.fillStyle = colors[(c + r + k) % colors.length]
              ctx.fillRect(sx, sy, 2.2, 1.8)
            }
          }
          ctx.strokeStyle = 'rgba(43,45,66,0.045)'
          ctx.lineWidth = 0.8
          ctx.strokeRect(x, y, T, T)
          if (t === T_CARPET) {
            rr(x + 1.5, y + 1, T - 3, T - 2, 4, '#ef476f', '#b5173a', 1.2)
            rr(x + 4, y + 3, T - 8, T - 6, 2.5, '#ff758f', '#ffd166', 1.2)
            ctx.fillStyle = 'rgba(255,209,102,0.75)'
            ctx.fillRect(x + T / 2 - 1.2, y + 5, 2.4, T - 10)
          }
        }
      }

      // 全景家具细节：王总红毯大班桌、茶水吧台冰箱、工位复印机、福报科技灯牌、厕所双盆洗手台
      if (tileAt(game, 7, 2) !== T_WALL && tileAt(game, 8, 3) !== T_WALL) {
        const rug = tileRect(7, 2)
        rr(rug.x - 2, rug.y + 2, T * 2 + 4, T * 3 - 4, 7, 'rgba(217,4,41,0.22)', '#d90429', 1.6)
        rr(rug.x + 2, rug.y + 6, T * 2 - 4, T * 3 - 12, 4, 'rgba(239,35,60,0.14)', '#ffd166', 1.4)
      }
      if (tileAt(game, 7, 1) !== T_WALL && tileAt(game, 8, 1) !== T_WALL) {
        const desk = tileRect(7, 1)
        rr(desk.x + 2, desk.y + 4, 13, T * 2 - 8, 4, '#7f4f24', INK, 1.5)
        rr(desk.x + 2, desk.y + 4, 22, 12, 3, '#9c6644', INK, 1.4)
        circle(desk.x + 8, desk.y + 10, 3, '#52b788', INK, 1)
      }
      if (tileAt(game, 2, 1) !== T_WALL && tileAt(game, 4, 1) !== T_WALL) {
        const bar = tileRect(2, 1)
        rr(bar.x + 1, bar.y + 2, 11, T * 2.5, 3, '#ddb892', INK, 1.4)
        rr(bar.x + 2, bar.y + 6, 8, 14, 2, '#adb5bd', INK, 1.1)
        const fr = tileRect(4, 1)
        rr(fr.x + 1, fr.y + 10, 14, 16, 3, '#b7efc5', INK, 1.4)
      }
      if (tileAt(game, 13, 1) !== T_WALL) {
        const pr = tileRect(13, 1)
        rr(pr.x + 1, pr.y + 4, 13, 18, 3, '#dee2e6', INK, 1.4)
      }
      if (tileAt(game, 1, 7) !== T_WALL && tileAt(game, 1, 8) !== T_WALL) {
        const neon = tileRect(1, 7)
        rr(neon.x + 4, neon.y + 2, T * 2.2, 13, 6, '#2b2d42', '#ffbe0b', 1.6)
        text('⚡福报科技', neon.x + 4 + T * 1.1, neon.y + 11.5, { size: 7.5, color: '#ffd166', align: 'center' })
      }
      if (tileAt(game, 16, 9) !== T_WALL && tileAt(game, 16, 10) !== T_WALL) {
        const sk = tileRect(16, 9)
        rr(sk.x + 4, sk.y + T - 14, T * 1.7, 13, 4, '#ffffff', INK, 1.5)
        for (const ox of [14, 34]) ellipse(sk.x + ox, sk.y + T - 7.5, 5.5, 4, 0, '#caf0f8', '#48cae4', 1.2)
      }
    } else if (theme === 'boardroom') {
      // ========== 场景2：巨型高管会议室 / 全员演讲厅特写 (Lv4, 6, 8, 9) ==========
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const t = tileAt(game, c, r)
          if (t === T_WALL) continue
          const { x, y } = tileRect(c, r)
          // 暖胡桃木声学静音地板
          ctx.fillStyle = (c + r) % 2 === 0 ? '#f4e3c8' : '#ead2ad'
          ctx.fillRect(x, y, T, T)
          ctx.strokeStyle = 'rgba(156,102,68,0.18)'
          ctx.lineWidth = 1
          ctx.strokeRect(x, y, T, T)
          if (t === T_CARPET) {
            rr(x + 1, y + 1, T - 2, T - 2, 3, '#c1121f', '#ffd166', 1)
          }
        }
      }
      // 顶部：皇家蓝丝绒演讲主舞台 + 巨幕画饼投影屏
      const stg = tileRect(1, 3)
      rr(stg.x, stg.y, T * 7, T * 3.2, 10, 'rgba(29,53,87,0.86)', '#ffd166', 2.2)
      rr(stg.x + 16, stg.y + 5, T * 7 - 32, 16, 5, '#023e8a', '#90e0ef', 1.5)
      text('📈 2026 百亿大饼战略宣讲主舞台', stg.x + T * 3.5, stg.y + 16, { size: 7.5, color: '#ffd166', align: 'center' })

      // 中庭：巨幅红金会议厅地毯 + 超长椭圆形高管红木会议桌（带笔记本与咖啡杯）
      const rug = tileRect(5, 3)
      rr(rug.x - 4, rug.y, T * 7 + 8, T * 7.5, 14, 'rgba(181,23,58,0.22)', '#d90429', 2)
      rr(rug.x + 2, rug.y + 6, T * 7 - 4, T * 7.5 - 12, 10, 'rgba(255,209,102,0.12)', '#ffd166', 1.4)
      const tblCx = OX + 6.5 * T
      const tblCy = OY + 8.6 * T
      ellipse(tblCx, tblCy, T * 2.3, T * 3.1, 0, 'rgba(127,79,36,0.88)', INK, 2.2)
      ellipse(tblCx, tblCy, T * 1.4, T * 2.2, 0, 'rgba(156,102,68,0.9)', '#ffd166', 1.4)
      // 会议桌四周高管笔记本与水杯装饰
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI) / 3 + 0.5
        const lx = tblCx + Math.cos(ang) * (T * 1.75)
        const ly = tblCy + Math.sin(ang) * (T * 2.4)
        rr(lx - 5, ly - 4, 10, 8, 1.5, '#dee2e6', INK, 1)
        circle(lx + 7, ly + 2, 2.2, '#ffffff', '#48cae4', 0.8)
      }

      // 底部：会议茶歇甜点自助长桌
      const buf = tileRect(15, 2)
      rr(buf.x, buf.y + 4, T * 4, 16, 4, '#fffdf5', INK, 1.5)
      circle(buf.x + 16, buf.y + 12, 4.5, '#ffadad', INK, 1)
      circle(buf.x + 36, buf.y + 12, 4.5, '#ffd166', INK, 1)
      rr(buf.x + 56, buf.y + 7, 18, 10, 2, '#9c6644', INK, 1)
    } else if (theme === 'pantry_lounge') {
      // ========== 场景3：阳光茶水咖啡厅 & 休闲档案室特写 (Lv5, 7, 13) ==========
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const t = tileAt(game, c, r)
          if (t === T_WALL) continue
          const { x, y } = tileRect(c, r)
          const isCenterLounge = c >= 5 && c <= 12 && r >= 3 && r <= 9
          if (isCenterLounge) {
            ctx.fillStyle = (c + r) % 2 === 0 ? '#fff3d6' : '#ffe8ba'
            ctx.fillRect(x, y, T, T)
          } else {
            ctx.fillStyle = (c + r) % 2 === 0 ? '#eefaf2' : '#d5f2e3'
            ctx.fillRect(x, y, T, T)
          }
          ctx.strokeStyle = 'rgba(82,183,136,0.16)'
          ctx.lineWidth = 0.9
          ctx.strokeRect(x, y, T, T)
        }
      }
      // 顶部整排网红手冲咖啡吧台 + 双门冰箱 + 甜品柜
      const bar = tileRect(1, 2)
      rr(bar.x, bar.y + 3, T * 8, 18, 5, '#ddb892', INK, 1.8)
      rr(bar.x + 10, bar.y + 6, 24, 12, 3, '#adb5bd', INK, 1.2) // 意式双头咖啡机
      rr(bar.x + 44, bar.y + 6, 28, 12, 3, '#caf0f8', '#0077b6', 1.2) // 甜品展示柜
      rr(bar.x + T * 8 + 6, bar.y + 2, 24, 20, 4, '#b7efc5', INK, 1.6) // 薄荷大冰箱

      // 中庭阳光茶歇区：4组圆形下午茶地垫与懒人沙发豆袋
      for (const [cc, rrIdx, col] of [
        [6, 4, '#ffadad'],
        [6, 8, '#ffd166'],
        [11, 4, '#9bf6ff'],
        [11, 8, '#bdb2ff']
      ]) {
        if (tileAt(game, cc, rrIdx) === T_WALL) continue
        const p0 = tileRect(cc, rrIdx)
        circle(p0.x + T / 2, p0.y + T / 2, 13, 'rgba(255,253,245,0.85)', '#d4a373', 1.5)
        circle(p0.x + T / 2, p0.y + T / 2, 6, col, INK, 1.2)
      }
    } else if (theme === 'cubicle_lab') {
      // ========== 场景4：研发部 996 大平层工位阵特写 (Lv10, 11, 12) ==========
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const t = tileAt(game, c, r)
          if (t === T_WALL) continue
          const { x, y } = tileRect(c, r)
          ctx.fillStyle = (c + r) % 2 === 0 ? '#e2ecfc' : '#d6e3f8'
          ctx.fillRect(x, y, T, T)
          ctx.strokeStyle = 'rgba(58,134,255,0.12)'
          ctx.lineWidth = 0.9
          ctx.strokeRect(x, y, T, T)
          if (t === T_CARPET) {
            rr(x + 2, y + 2, T - 4, T - 4, 4, 'rgba(255,183,3,0.28)', '#fb8500', 1.4)
          }
        }
      }
      // 顶部：核心机房服务器机柜阵列（带闪烁绿/蓝灯）
      const srv = tileRect(1, 4)
      rr(srv.x, srv.y + 2, T * 5, 16, 4, '#2b2d42', INK, 1.8)
      for (let i = 0; i < 5; i++) {
        const lx = srv.x + 8 + i * 26
        rr(lx, srv.y + 5, 20, 10, 2, '#161824', '#4cc9f0', 1)
        const blink = Math.sin(clock * 7 + i * 1.4) > 0 ? '#80ed99' : '#00bbf9'
        circle(lx + 5, srv.y + 10, 1.8, blink, null, 0)
        circle(lx + 12, srv.y + 10, 1.8, '#ff006e', null, 0)
      }

      // 大平层四联程序员双屏工位岛贴花
      for (const [dc, dr] of [
        [4, 2],
        [4, 9],
        [8, 4],
        [8, 8],
        [13, 2],
        [13, 9]
      ]) {
        if (tileAt(game, dc, dr) === T_WALL) continue
        const dp = tileRect(dc, dr)
        rr(dp.x + 2, dp.y + 2, T * 1.8, T * 1.4, 5, 'rgba(255,253,245,0.78)', '#8d99ae', 1.3)
        rr(dp.x + 7, dp.y + 6, 16, 7, 1.5, '#48cae4', INK, 1)
        rr(dp.x + 27, dp.y + 6, 16, 7, 1.5, '#80ed99', INK, 1)
        rr(dp.x + 12, dp.y + 17, 24, 5, 1, '#495057', null, 0)
      }
    } else {
      // ========== 场景5：88楼董事长豪华顶层套房 & 防弹金库特写 (Lv14, 16) ==========
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const t = tileAt(game, c, r)
          if (t === T_WALL) continue
          const { x, y } = tileRect(c, r)
          if (c <= 4) {
            // 顶部：防弹钛合金金库密室地面
            ctx.fillStyle = (c + r) % 2 === 0 ? '#dee2e6' : '#ced4da'
            ctx.fillRect(x, y, T, T)
            ctx.strokeStyle = 'rgba(73,80,87,0.22)'
            ctx.strokeRect(x, y, T, T)
          } else {
            // 总裁会客大厅：黑金大理石与名贵胡桃木拼花
            ctx.fillStyle = (c + r) % 2 === 0 ? '#f6e7cb' : '#edd5ac'
            ctx.fillRect(x, y, T, T)
            ctx.strokeStyle = 'rgba(181,131,90,0.2)'
            ctx.strokeRect(x, y, T, T)
          }
        }
      }
      // 金库机械密码转盘地标
      const vDial = tileRect(2, 6)
      circle(vDial.x + T / 2, vDial.y + T / 2, 16, 'rgba(73,80,87,0.25)', '#ffd166', 2)
      circle(vDial.x + T / 2, vDial.y + T / 2, 7, '#ffd166', INK, 1.4)

      // 中央：88楼皇家红金波斯总裁大地毯
      const cRug = tileRect(6, 3)
      rr(cRug.x, cRug.y, T * 7, T * 8, 12, 'rgba(181,23,58,0.24)', '#d90429', 2.2)
      rr(cRug.x + 6, cRug.y + 6, T * 7 - 12, T * 8 - 12, 8, 'rgba(255,190,11,0.14)', '#ffd166', 1.6)

      // 左翼：总裁室内迷你高尔夫推杆果岭绿毯（带球洞与小红旗！）
      const golf = tileRect(11, 1)
      rr(golf.x + 3, golf.y + 4, T * 1.9, T * 3.8, 14, '#52b788', '#2d6a4f', 1.8)
      rr(golf.x + 8, golf.y + 10, T * 1.9 - 10, T * 3.8 - 20, 10, '#74c69d', null, 0)
      circle(golf.x + 26, golf.y + 26, 4.5, '#1b4332', '#ffffff', 1) // 球洞
      circle(golf.x + 28, golf.y + 68, 3, '#ffffff', INK, 1) // 高尔夫小白球
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(golf.x + 26, golf.y + 26)
      ctx.lineTo(golf.x + 26, golf.y + 10)
      ctx.stroke()
      ctx.fillStyle = '#ef233c'
      ctx.beginPath()
      ctx.moveTo(golf.x + 26, golf.y + 10)
      ctx.lineTo(golf.x + 38, golf.y + 14)
      ctx.lineTo(golf.x + 26, golf.y + 18)
      ctx.closePath()
      ctx.fill()
    }

    // 右侧外墙通用双开电梯门装饰
    const elevWall = tileRect(2, 12)
    rr(elevWall.x - 4, elevWall.y + 2, 7, T * 2 - 4, 2, '#ced4da', INK, 1.8)
    circle(elevWall.x - 1, elevWall.y - 3, 2.2, '#ff006e', null, 0)

    // 2.6 斜向洒入前台大厅的温暖窗户阳光光束 + 浮尘光点
    if (!game.blackout) {
      ctx.save()
      for (const wc of [2.2, 6.2, 9.5]) {
        const wy = OY + wc * T
        const wx = OX + 12 * T
        const beamGrad = ctx.createLinearGradient(wx, wy, wx - T * 4.5, wy + T * 2.6)
        beamGrad.addColorStop(0, 'rgba(255,243,176,0.30)')
        beamGrad.addColorStop(1, 'rgba(255,243,176,0)')
        ctx.fillStyle = beamGrad
        ctx.beginPath()
        ctx.moveTo(wx, wy)
        ctx.lineTo(wx, wy + T * 1.45)
        ctx.lineTo(wx - T * 4.6, wy + T * 3.4)
        ctx.lineTo(wx - T * 4.6, wy + T * 1.7)
        ctx.closePath()
        ctx.fill()
      }
      ctx.restore()
    }

    // 2.7 墙体与隔断投射在地面上的柔和 2.5D 环境光遮蔽阴影
    ctx.fillStyle = 'rgba(43,45,66,0.13)'
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = tileAt(game, c, r)
        if (t !== T_WALL && t !== T_GLASS && t !== T_GATE) continue
        const { x, y } = tileRect(c, r)
        const sh = t === T_WALL ? 6 : 3
        if (c + 1 < COLS && tileAt(game, c + 1, r) !== T_WALL) ctx.fillRect(x, y + T, T, sh)
        if (r + 1 < ROWS && tileAt(game, c, r + 1) !== T_WALL) ctx.fillRect(x + T, y + 3, 4, T - 3)
      }
    }

    ctx.restore()
  }

  // ================= 3. 视野警戒扇区 =================
  function drawCone(game, obs, alert, kind) {
    if (!obs || !obs.viewDist || obs.viewDist <= 0 || !game.computeVisionPolygon) return
    const poly = game.computeVisionPolygon(obs.x, obs.y, obs.dirAngle, obs.fov, obs.viewDist, 36).map(pt => P(pt.x, pt.y))
    if (poly.length < 3) return
    const o = poly[0]
    const grad = ctx.createRadialGradient(o.x, o.y, 3, o.x, o.y, obs.viewDist * S)
    const rgb = alert ? '255,0,110' : kind === 'camera' ? '131,56,236' : '255,183,3'
    grad.addColorStop(0, `rgba(${rgb},0.46)`)
    grad.addColorStop(0.7, `rgba(${rgb},0.22)`)
    grad.addColorStop(1, `rgba(${rgb},0.04)`)
    ctx.beginPath()
    poly.forEach((pt, i) => (i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)))
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()
    ctx.setLineDash([4, 4])
    ctx.strokeStyle = `rgba(${rgb},0.85)`
    ctx.lineWidth = 1.4
    ctx.stroke()
    ctx.setLineDash([])
  }

  function drawCones(a, b) {
    const { game } = sync(a, b)
    if (!game) return
    if (game.playerRole === 'boss' || game.cfg?.mode === 'be_the_boss') return
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(OX, OY, MAP_SW, MAP_SH, 10)
    ctx.clip()
    for (const cam of game.cameras || []) {
      if ((cam.disabledTimer || 0) <= 0) drawCone(game, cam, (cam.suspicion || 0) > 30, 'camera')
    }
    for (const sn of game.snitches || []) {
      if ((sn.stunTimer || 0) <= 0) drawCone(game, sn, (sn.suspicion || 0) > 25, 'guard')
    }
    for (const g of game.guards || []) {
      if (g.state === 'stunned' || g.state === 'slipping' || g.state === 'toilet_panic' || g.hideCone) continue
      if (game.cfg?.mode === 'chair_derby' || game.cfg?.mode === 'pot_pong' || game.cfg?.mode === 'desk_defense') continue
      drawCone(game, g, g.state === 'chase' || (g.suspicion || 0) > 30, 'guard')
    }
    ctx.restore()
  }

  // ================= 4. 地面动态特效（脚印、肥皂泡、咖啡减速滩、声味涟漪） =================
  function drawFloorFx(a, b, c, d) {
    let dt = 0.016
    let footprints = null
    if (typeof a === 'number' && (!b || Array.isArray(b))) {
      dt = a
      footprints = Array.isArray(b) ? b : null
    } else {
      sync(a, b)
      if (Array.isArray(c)) {
        footprints = c
        if (typeof d === 'number') dt = d
      } else if (typeof c === 'number') {
        dt = c
        if (Array.isArray(d)) footprints = d
      }
    }
    const game = lastGame
    const clock = lastClock
    if (!game) return

    // 冲刺脚印
    if (Array.isArray(footprints)) {
      for (let i = footprints.length - 1; i >= 0; i--) {
        const f = footprints[i]
        if (typeof f.life === 'number') f.life -= dt
        if (f.life <= 0) {
          footprints.splice(i, 1)
          continue
        }
        ctx.globalAlpha = Math.max(0, Math.min(1, f.life)) * 0.42
        ellipse(f.x, f.y, 2.4, 3.6, f.a || 0, '#3a86ff', null, 0)
      }
      ctx.globalAlpha = 1
    }

    // 冰美式泼洒减速带（Lv12 等）
    const slowZones = game.coffeePuddles || game.slowZones || game.puddles || []
    for (const sz of slowZones) {
      const p = P(sz.x, sz.y)
      const rad = (sz.radius || 36) * S
      ellipse(p.x, p.y, rad * 1.1, rad * 0.82, 0.2, 'rgba(111,78,55,0.52)', '#4a2c11', 1.8)
      ellipse(p.x - 3, p.y - 2, rad * 0.45, rad * 0.28, -0.2, 'rgba(255,255,255,0.28)', null, 0)
      // 小冰块晶粒
      for (let i = 0; i < 3; i++) {
        const ix = p.x + Math.cos(clock * 1.5 + i * 2.1) * (rad * 0.45)
        const iy = p.y + Math.sin(clock * 1.5 + i * 2.1) * (rad * 0.35)
        rr(ix - 2.5, iy - 2.5, 5, 5, 1.2, 'rgba(202,240,248,0.85)', '#0077b6', 0.9)
      }
    }

    // 洗洁精滑溜泡泡滩
    for (const pd of game.soapPuddles || []) {
      const p = P(pd.x, pd.y)
      ellipse(p.x, p.y, 15, 10.5, Math.sin(clock * 2) * 0.25, 'rgba(144,224,239,0.82)', '#0096c7', 2)
      ellipse(p.x - 3, p.y - 2, 7, 4, -0.2, 'rgba(255,255,255,0.55)', null, 0)
      for (let i = 0; i < 4; i++) {
        const bx = p.x + Math.cos(clock * 2.4 + i * 1.6) * 7.5
        const by = p.y + Math.sin(clock * 3.1 + i) * 5 - Math.abs(Math.sin(clock * 2 + i)) * 2
        circle(bx, by, 2.3 + (i % 2) * 0.7, 'rgba(255,255,255,0.9)', '#48cae4', 1)
      }
    }

    // 地面压力感应板（提前贴地绘制，让椅子/推车压在上面更自然）
    for (const o of game.objects || []) {
      if (o.type !== 'pressure_pad' && o.type !== 'floor_pad' && o.type !== 'switch_pad') continue
      const p = P(o.x, o.y)
      const active = Boolean(o.pressed || o.active || o.done || o.triggered)
      rr(p.x - 13, p.y - 13, 26, 26, 5, '#495057', INK, 2)
      rr(p.x - 10, p.y - 10, 20, 20, 3.5, active ? '#80ed99' : '#ffd166', active ? '#2a9d8f' : '#e85d04', 1.6)
      circle(p.x, p.y, 4.5, active ? '#38b000' : '#ff006e', INK, 1.2)
      if (active) {
        ctx.strokeStyle = 'rgba(56,176,0,0.55)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(p.x, p.y, 15 + Math.sin(clock * 8) * 2, 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    // 声音波纹 & 螺蛳粉臭味毒雾圈
    for (const rp of game.ripples || []) {
      const p = P(rp.x, rp.y)
      const ratio = Math.max(0, rp.life / (rp.maxLife || 0.6))
      ctx.save()
      ctx.globalAlpha = ratio * 0.85
      const isOdor = rp.kind === 'odor'
      ctx.strokeStyle = isOdor ? '#52b788' : rp.kind === 'shock' ? '#ff006e' : '#3a86ff'
      ctx.lineWidth = isOdor ? 3 : 2.4
      if (isOdor) ctx.setLineDash([6, 5])
      ctx.beginPath()
      ctx.arc(p.x, p.y, rp.radius * S, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
      if (isOdor) {
        for (let k = 0; k < 3; k++) {
          const ang = clock * 2 + (k * Math.PI * 2) / 3
          const ox = p.x + Math.cos(ang) * rp.radius * S * 0.72
          const oy = p.y + Math.sin(ang) * rp.radius * S * 0.72
          circle(ox, oy, 3.5, 'rgba(116,198,157,0.65)', null, 0)
        }
      }
      ctx.restore()
    }
  }

  // ================= 5. 真正的 2.5D 卡通厚度墙体与绿植隔断 =================
  function drawBush(cx, cy, clock, swaying = false, peeking = false) {
    const sway = swaying ? Math.sin(clock * 18) * 2.2 : Math.sin(clock * 2.2 + cx * 0.1) * 0.6
    ellipse(cx + 1, cy + 10, 10.5, 4.2, 0, 'rgba(43,45,66,0.2)', null, 0)
    // 赤陶花盆 + 盆沿 + 营养土
    rr(cx - 6.5, cy + 2, 13, 8.5, 3, '#e07a5f', INK, 1.9)
    rr(cx - 7.5, cy + 0.5, 15, 3.2, 1.5, '#f28482', INK, 1.6)
    ellipse(cx, cy + 1, 5.5, 1.6, 0, '#582f0e', null, 0)
    // 饱满琴叶榕/多肉多层叶片
    ctx.save()
    ctx.translate(cx + sway, cy)
    circle(-6.5, -2.5, 6.2, '#2d6a4f', INK, 1.8)
    circle(6.5, -2.5, 6.2, '#40916c', INK, 1.8)
    circle(-3.5, -7.5, 6.5, '#52b788', INK, 1.8)
    circle(4, -7, 6, '#74c69d', INK, 1.8)
    circle(0, -10, 6.8, '#57cc99', INK, 1.9)
    // 叶片高光与小黄花果
    circle(-2, -12, 2.2, '#b7efc5', null, 0)
    circle(4.5, -4, 2, '#ffd166', INK, 1)
    if (peeking) {
      circle(-2.5, -5.5, 2, '#ffffff', INK, 0.9)
      circle(2.5, -5.5, 2, '#ffffff', INK, 0.9)
      circle(-2.2, -5.5, 0.9, INK, null, 0)
      circle(2.8, -5.5, 0.9, INK, null, 0)
    }
    ctx.restore()
  }

  function drawWalls(a, b) {
    const { game, clock } = sync(a, b)
    if (!game?.grid) return
    const pl = game.player

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = tileAt(game, c, r)
        const { x, y } = tileRect(c, r)

        if (t === T_WALL) {
          const southOpen = tileAt(game, c + 1, r) !== T_WALL
          const ceoWood = c >= 5 && c <= 11 && r >= 1 && r <= 5
          const topH = southOpen ? T - 8 : T

          // 2.5D 立面墙裙 + 踢脚线
          if (southOpen) {
            ctx.fillStyle = ceoWood ? '#8c5a32' : '#6c7a96'
            ctx.fillRect(x, y + topH, T, 8)
            // 护墙板凹槽腰线
            ctx.fillStyle = ceoWood ? '#a47148' : '#8d99ae'
            ctx.fillRect(x, y + topH, T, 2)
            // 深色踢脚线
            ctx.fillStyle = ceoWood ? '#583101' : '#3d405b'
            ctx.fillRect(x, y + T - 2.5, T, 2.5)
            // 偶发微缩墙面五孔插座
            if ((c + r * 3) % 7 === 0 && r > 0 && r < ROWS - 1) {
              rr(x + T - 9, y + topH + 2, 5, 3.5, 0.8, '#fffdf5', INK, 0.7)
            }
          }

          // 奶油暖杏色墙顶面 + 亮边倒角
          ctx.fillStyle = ceoWood ? '#f3e5d0' : '#f6efe2'
          ctx.fillRect(x, y, T, topH)
          if (tileAt(game, c - 1, r) !== T_WALL) {
            ctx.fillStyle = '#fffdf9'
            ctx.fillRect(x + 1, y + 1, T - 2, 2.8)
          }

          // 精致微缩墙面挂件点缀
          if ((c === 5 && r === 2) || (c === 10 && r === 2)) {
            // 『大饼走势图』画框（红箭头冲破天际）
            rr(x + 4, y + 3, T - 8, 13, 2, '#fffdf5', '#9c6644', 1.6)
            ctx.strokeStyle = '#e63946'
            ctx.lineWidth = 1.6
            ctx.beginPath()
            ctx.moveTo(x + 7, y + 13)
            ctx.lineTo(x + 11, y + 10)
            ctx.lineTo(x + 14, y + 12)
            ctx.lineTo(x + 20, y + 5)
            ctx.stroke()
          } else if ((c === 0 && r === 7) || (c === 10 && r === 0)) {
            // 圆形打卡挂钟（指针随时间转动）
            circle(x + T / 2, y + T / 2 - 2, 6.5, '#fffdf5', INK, 1.6)
            ctx.strokeStyle = INK
            ctx.lineWidth = 1.3
            ctx.beginPath()
            ctx.moveTo(x + T / 2, y + T / 2 - 2)
            ctx.lineTo(x + T / 2 + Math.cos(clock * 0.8) * 4, y + T / 2 - 2 + Math.sin(clock * 0.8) * 4)
            ctx.moveTo(x + T / 2, y + T / 2 - 2)
            ctx.lineTo(x + T / 2, y + T / 2 - 5)
            ctx.stroke()
            circle(x + T / 2, y + T / 2 - 2, 1, '#e63946', null, 0)
          } else if ((c === 8 && r === 12) || (c === 14 && r === 0)) {
            // 红白消防栓箱
            rr(x + 6, y + 4, T - 12, 14, 2.5, '#ef233c', INK, 1.5)
            rr(x + 9, y + 7, T - 18, 6, 1, '#caf0f8', INK, 0.9)
          } else if (c === 0 && r === 3) {
            // 自动售货机缤纷顶盖
            rr(x + 3, y + 3, T - 6, 14, 3, '#4cc9f0', INK, 1.5)
            rr(x + 6, y + 6, T - 12, 4, 1, '#ffd166', null, 0)
          } else if (r === 12 && [2, 3, 6, 7, 9, 10].includes(c)) {
            // 右侧外墙采光落地窗框
            rr(x + 4, y + 2, 7, T - 4, 2, game.blackout ? '#1d3557' : '#90e0ef', INK, 1.4)
            if (!game.blackout) {
              ctx.fillStyle = 'rgba(255,255,255,0.7)'
              ctx.fillRect(x + 6, y + 5, 2, T - 10)
            }
          }
        } else if (t === T_GLASS) {
          // 高透亮青色玻璃隔断 + 银色铝合金立柱卡槽
          rr(x + 1, y + 6, T - 2, T - 12, 3.5, 'rgba(144,224,239,0.74)', '#0077b6', 1.8)
          ctx.fillStyle = 'rgba(255,255,255,0.45)'
          ctx.fillRect(x + 3, y + T / 2 - 1.5, T - 6, 3)
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 1.8
          ctx.beginPath()
          ctx.moveTo(x + 7, y + T - 8)
          ctx.lineTo(x + 13, y + 8)
          ctx.moveTo(x + 14, y + T - 8)
          ctx.lineTo(x + 19, y + 10)
          ctx.stroke()
          rr(x, y + 4, 4.5, T - 8, 1.5, '#dee2e6', INK, 1.4)
          rr(x + T - 4.5, y + 4, 4.5, T - 8, 1.5, '#dee2e6', INK, 1.4)
        } else if (t === T_GATE) {
          // 带呼吸 LED 灯珠的红银感应闸机
          rr(x + 3, y + 7, T - 6, T - 14, 3, 'rgba(255,77,109,0.32)', '#d90429', 1.8)
          ctx.fillStyle = '#ff006e'
          for (let i = 0; i < 3; i++) ctx.fillRect(x + 7 + i * 5.5, y + 9.5, 2.5, T - 19)
          rr(x, y + 3.5, 5.5, T - 7, 2, '#e9ecef', INK, 1.5)
          rr(x + T - 5.5, y + 3.5, 5.5, T - 7, 2, '#e9ecef', INK, 1.5)
          const led = Math.sin(clock * 8) > 0 ? '#ff006e' : '#ffbe0b'
          circle(x + 2.8, y + 7.5, 1.8, led, null, 0)
          circle(x + T - 2.8, y + 7.5, 1.8, led, null, 0)
        }
      }
    }

    // 墙体连通外轮廓统一卡通粗描边
    ctx.strokeStyle = INK
    ctx.lineWidth = 2.4
    ctx.lineCap = 'round'
    ctx.beginPath()
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (tileAt(game, c, r) !== T_WALL) continue
        const { x, y } = tileRect(c, r)
        if (tileAt(game, c - 1, r) !== T_WALL) {
          ctx.moveTo(x, y)
          ctx.lineTo(x + T, y)
        }
        if (tileAt(game, c + 1, r) !== T_WALL) {
          ctx.moveTo(x, y + T)
          ctx.lineTo(x + T, y + T)
        }
        if (tileAt(game, c, r - 1) !== T_WALL) {
          ctx.moveTo(x, y)
          ctx.lineTo(x, y + T)
        }
        if (tileAt(game, c, r + 1) !== T_WALL) {
          ctx.moveTo(x + T, y)
          ctx.lineTo(x + T, y + T)
        }
      }
    }
    ctx.stroke()
    ctx.lineCap = 'butt'

    // 饱满盆栽躲藏点（带摇晃与偷瞄小眼神）
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (tileAt(game, c, r) === T_HIDE) {
          const { x, y } = tileRect(c, r)
          const occupied = pl && pl.col === c && pl.row === r
          drawBush(x + T / 2, y + T / 2 + 1, clock, occupied && pl.isMoving, occupied && pl.hiding)
        }
      }
    }
  }

  // ================= 6. 低调精致的角落贴地分区铭牌（随聚焦场景自适应） =================
  const SCENE_LABELS = {
    full_office: ZONE_META,
    boardroom: [
      { lc: 1, lr: 1, label: '🎬 演讲主舞台' },
      { lc: 6, lr: 4, label: '📋 椭圆形董事会议桌' },
      { lc: 14, lr: 2, label: '🥐 会议茶歇吧台' },
      { lc: 14, lr: 8, label: '🚪 贵宾会议厅' }
    ],
    pantry_lounge: [
      { lc: 1, lr: 1, label: '☕ 手冲咖啡吧台' },
      { lc: 5, lr: 3, label: '🛋️ 阳光茶歇休闲区' },
      { lc: 14, lr: 2, label: '🗑️ 行政文印碎纸角' }
    ],
    cubicle_lab: [
      { lc: 1, lr: 1, label: '⚡ 核心服务器机房' },
      { lc: 5, lr: 2, label: '💻 研发大平层工位阵' },
      { lc: 13, lr: 2, label: '📌 敏捷看板与测试区' }
    ],
    ceo_suite: [
      { lc: 1, lr: 1, label: '🔐 88F防弹私人金库' },
      { lc: 6, lr: 4, label: '👑 董事长波斯红毯大厅' },
      { lc: 11, lr: 1, label: '⛳ 室内高尔夫果岭' }
    ]
  }

  function drawFocusOverlay(a, b) {
    const { game } = sync(a, b)
    const theme = game?.cfg?.sceneTheme || 'full_office'
    if (theme !== 'full_office') return
    const focus = game?.cfg?.focusZones
    if (!Array.isArray(focus) || focus.length === 0) return
    const active = new Set(focus)
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(OX, OY, MAP_SW, MAP_SH, 10)
    ctx.clip()
    for (const [key, zz] of Object.entries(FOCUS_ZONE_RECTS)) {
      if (active.has(key)) continue
      const { x, y } = tileRect(zz.c1, zz.r1)
      const w = (zz.r2 - zz.r1 + 1) * T
      const h = (zz.c2 - zz.c1 + 1) * T
      ctx.fillStyle = 'rgba(255, 251, 242, 0.48)'
      ctx.fillRect(x, y, w, h)
    }
    ctx.restore()
  }

  function drawZoneLabels(a, b) {
    const { game } = sync(a, b)
    if (!game?.grid) return
    const theme = game.cfg?.sceneTheme || 'full_office'
    const labels = SCENE_LABELS[theme] || ZONE_META
    const focus =
      theme === 'full_office' && Array.isArray(game.cfg?.focusZones)
        ? new Set(game.cfg.focusZones)
        : null

    for (const zm of labels) {
      if (tileAt(game, zm.lc, zm.lr) === T_WALL) continue
      if (focus && !focus.has(zoneKeyAt(zm.lc, zm.lr))) continue
      const { x, y } = tileRect(zm.lc, zm.lr)
      ctx.font = FONT(8, 800)
      const tw = ctx.measureText(zm.label).width + 10
      rr(x + 2, y + 2, tw, 13, 6.5, 'rgba(255,253,245,0.84)', 'rgba(43,45,66,0.22)', 1)
      text(zm.label, x + 7, y + 11, { size: 8, weight: 800, color: 'rgba(43,45,66,0.76)' })
    }
  }

  // ================= 7. 全套手绘 2D 卡通矢量道具（严禁白底套Emoji） =================
  function drawPickupSprite(pk, x, y, clock) {
    const bob = Math.sin(clock * 4.5 + (pk.col || 0) + (pk.row || 0)) * 2.5
    // 柔和呼吸拾取光圈
    circle(x, y, 12.5 + Math.sin(clock * 5) * 1.8, 'rgba(255,209,102,0.34)', 'rgba(233,164,0,0.55)', 1.2)
    ctx.save()
    ctx.translate(x, y + bob)
    const tp = pk.type
    if (tp === 'keycard') {
      ctx.rotate(-0.18)
      rr(-10, -7, 20, 14, 3, '#ffd166', INK, 2)
      rr(-7, -3, 5, 4, 1, '#ff9f1c', INK, 1)
      ctx.fillStyle = '#2b2d42'
      ctx.fillRect(-1, -2, 8, 2)
      ctx.fillRect(-1, 2, 6, 1.5)
    } else if (tp === 'soap') {
      rr(-6, -5, 12, 14, 4, '#48cae4', INK, 1.9)
      rr(-3.5, -9.5, 7, 4.5, 1.5, '#ff4d6d', INK, 1.5)
      circle(0, 2, 3, '#caf0f8', null, 0)
      circle(7, -6, 2.2, '#ffffff', '#48cae4', 1)
    } else if (tp === 'coffee' || tp === 'iced_americano') {
      ctx.strokeStyle = '#2a9d8f'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(1, -6)
      ctx.lineTo(4, -12)
      ctx.stroke()
      rr(-6.5, -5, 13, 14, 3, '#e6ccb2', INK, 1.9)
      rr(-6.5, -1, 13, 6, 0, '#6f4e37', null, 0)
      rr(-8, -7.5, 16, 3.5, 2, '#fffdf5', INK, 1.6)
    } else if (tp === 'frog') {
      ellipse(0, 2, 8.5, 6.5, 0, '#52b788', INK, 1.9)
      circle(-4.5, -4, 3.2, '#74c69d', INK, 1.5)
      circle(4.5, -4, 3.2, '#74c69d', INK, 1.5)
      circle(-4.5, -4, 1.2, INK, null, 0)
      circle(4.5, -4, 1.2, INK, null, 0)
      circle(8, 1, 2.5, '#ffd166', INK, 1.2) // 发条钥匙
    } else if (tp === 'chili') {
      // 魔鬼红辣椒
      ctx.rotate(-0.35)
      ellipse(0, 1, 4.5, 9, 0.2, '#ef233c', INK, 1.9)
      ctx.strokeStyle = '#38b000'
      ctx.lineWidth = 2.2
      ctx.beginPath()
      ctx.moveTo(0, -8)
      ctx.quadraticCurveTo(2, -12, 5, -11)
      ctx.stroke()
    } else if (tp === 'laxative' || tp === 'spice' || tp === 'ingredient') {
      rr(-5.5, -4, 11, 13, 3.5, '#9d4edd', INK, 1.9)
      rr(-3, -9, 6, 5, 1.2, '#ffd166', INK, 1.5)
      rr(-4, 0, 8, 5, 1, '#fff3b0', null, 0)
      circle(0, 2.5, 1.8, '#ff006e', null, 0)
    } else if (tp === 'contract' || tp === 'paycut_contract' || tp === 'paycut_doc' || tp === 'document') {
      ctx.rotate(0.12)
      rr(-8, -10, 16, 20, 2, '#fffdf5', INK, 1.9)
      ctx.fillStyle = '#adb5bd'
      ctx.fillRect(-5, -6, 10, 2)
      ctx.fillRect(-5, -2, 8, 2)
      circle(3, 5, 3, '#ef233c', null, 0) // 红公章
    } else {
      // 精致胶囊礼盒兜底（绝不用白框套Emoji）
      rr(-8, -8, 16, 16, 5, '#ffbe0b', INK, 2)
      rr(-8, -2, 16, 4, 0, '#ff006e', null, 0)
      star4(0, 0, 4.5, 2, '#ffffff')
    }
    ctx.restore()
  }

  function drawObjectSprite(o, x, y, isT, clock) {
    if (o.type === 'pressure_pad' || o.type === 'floor_pad' || o.type === 'switch_pad') return
    ctx.save()
    ctx.translate(x, y)
    const stroke = isT ? '#2a9d8f' : INK
    const shakeX = o.type === 'microwave' && o.timer > 0 ? Math.sin(clock * 55) * 2.2 : 0
    ctx.translate(shakeX, 0)

    // 柔和落地椭圆阴影
    ellipse(0, 10.5, 12.5, 4.8, 0, 'rgba(43,45,66,0.2)', null, 0)

    switch (o.type) {
      case 'microwave': {
        const hot = o.timer > 0
        rr(-13, -10, 26, 20, 5, '#fffdf5', stroke, 2.2)
        rr(-10, -7, 15, 14, 2.5, hot ? '#ff4d6d' : '#ffe5b4', INK, 1.5)
        if (hot) star4(-2.5, 0, 5, 2, '#fff3b0')
        circle(8.5, -3, 2, '#fb5607', INK, 1.1)
        circle(8.5, 3, 2, '#ffd166', INK, 1.1)
        break
      }
      case 'clock_in': {
        rr(-9.5, -13, 19, 25, 5, o.done ? '#74c69d' : '#4cc9f0', stroke, 2.2)
        rr(-6.5, -9.5, 13, 11, 2.5, o.done ? '#d8f3dc' : '#1d3557', INK, 1.4)
        if (o.done) {
          ctx.strokeStyle = '#2d6a4f'
          ctx.lineWidth = 2.2
          ctx.beginPath()
          ctx.moveTo(-3.5, -4)
          ctx.lineTo(-1, -1.5)
          ctx.lineTo(4, -6.5)
          ctx.stroke()
        } else {
          circle(0, -4, 3.2, '#90e0ef', null, 0)
        }
        rr(-5, 4.5, 10, 4, 1.5, '#fffdf5', INK, 1.1)
        break
      }
      case 'workstation':
      case 'desk':
      case 'golden_desk':
      case 'defense_desk': {
        const gold = o.type === 'golden_desk' || o.type === 'defense_desk' || o.subtype === 'golden_desk' || o.id === 'golden_desk'
        rr(-14, -10, 28, 20, 4.5, gold ? '#ffd166' : '#ddb892', stroke, 2.2)
        rr(-10, -8.5, 20, 10.5, 2.5, o.done ? '#52b788' : gold ? '#00bbf9' : '#48cae4', INK, 1.5)
        // 屏幕表格高光条
        ctx.fillStyle = 'rgba(255,255,255,0.75)'
        ctx.fillRect(-7, -6, 9, 2)
        ctx.fillRect(-7, -2.5, 13, 2)
        rr(-8, 4, 12, 4, 1.2, '#fffdf5', INK, 1.1) // 键盘
        circle(8.5, 5.5, 2.6, gold ? '#ff006e' : '#ef233c', INK, 1.1) // 咖啡红杯
        if (gold) star4(-11, -7, 4, 1.6, '#fff3b0')
        break
      }
      case 'phone': {
        const ring = (o.cooldown || 0) > 6.5 ? Math.sin(clock * 40) * 1.8 : 0
        rr(-11, -7, 22, 16, 5, '#ef233c', stroke, 2.1)
        ctx.save()
        ctx.translate(0, -10 + ring * 0.4)
        ctx.rotate(ring * 0.08)
        rr(-12.5, -3, 25, 6, 3, '#ff4d6d', INK, 1.7)
        ctx.restore()
        circle(0, 2, 4.2, '#fff3b0', INK, 1.3)
        break
      }
      case 'thermos':
      case 'podium_cup':
      case 'speech_thermos': {
        ellipse(0, 4, 10, 6.5, 0, '#ddb892', INK, 1.6)
        rr(-6, -11, 12, 19, 5, o.spiked ? '#9d4edd' : '#f4a261', stroke, 2)
        rr(-4.5, -14, 9, 4.5, 2, '#ffd166', INK, 1.5)
        // 枸杞红珠或暗黑毒泡
        circle(-2, -2, 1.8, o.spiked ? '#80ed99' : '#d90429', null, 0)
        circle(2.2, 1, 1.6, o.spiked ? '#ff006e' : '#d90429', null, 0)
        if (o.spiked) {
          circle(Math.sin(clock * 5) * 3, -17 - ((clock * 8) % 6), 2.2, 'rgba(157,78,221,0.7)', null, 0)
        }
        break
      }
      case 'takeout': {
        rr(-11, -8, 22, 18, 5, '#ffe5d9', stroke, 2.1)
        ellipse(0, 1, 7.5, 5, 0, '#ef233c', INK, 1.4) // 红油汤底
        ctx.strokeStyle = '#9c6644'
        ctx.lineWidth = 1.8
        ctx.beginPath()
        ctx.moveTo(2, -1)
        ctx.lineTo(10, -11)
        ctx.moveTo(4, 1)
        ctx.lineTo(12, -9)
        ctx.stroke()
        break
      }
      case 'fan_switch':
      case 'fanBlower':
      case 'industrial_fan':
      case 'blower': {
        const turbo = o.type !== 'fan_switch' || o.subtype === 'industrial_fan' || o.id === 'fan_blower' || Boolean(o.blowDir)
        const active = Boolean(o.active || o.on || (o.cooldown || 0) > 0 || o.blowing || (o.activeTimer || 0) > 0)
        rr(-12, -12, 24, 24, turbo ? 12 : 6, turbo ? '#ffbe0b' : '#dee2e6', stroke, 2.2)
        circle(0, 0, 8.5, '#343a40', INK, 1.5)
        const spd = active ? clock * 24 : clock * 3
        ctx.strokeStyle = turbo ? '#00bbf9' : '#ffd166'
        ctx.lineWidth = 2.8
        for (let i = 0; i < 3; i++) {
          const ang = spd + (i * Math.PI * 2) / 3
          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.lineTo(Math.cos(ang) * 6.5, Math.sin(ang) * 6.5)
          ctx.stroke()
        }
        circle(0, 0, 2.2, '#fffdf5', INK, 1)
        // 强力吹假发工业扇风流线
        if (turbo && active) {
          const wAngle = o.blowDir ? Math.atan2(o.blowDir.dy, o.blowDir.dx) : (o.dirAngle ?? 0)
          const dirA = A(wAngle)
          ctx.save()
          ctx.rotate(dirA)
          ctx.strokeStyle = 'rgba(0,187,249,0.62)'
          ctx.lineWidth = 2.2
          for (let w = -1; w <= 1; w++) {
            const off = ((clock * 56 + (w + 1) * 11) % 44) + 12
            ctx.beginPath()
            ctx.moveTo(off, w * 6.5)
            ctx.lineTo(off + 14, w * 6.5)
            ctx.stroke()
          }
          ctx.restore()
        }
        break
      }
      case 'elevator_exit':
      case 'elevator': {
        const open = Boolean(o.done || o.unlocked || o.open)
        rr(-13.5, -13, 27, 25, 5, '#ffd166', stroke, 2.3)
        if (open) {
          rr(-9, -8.5, 18, 17, 2, '#fff3b0', INK, 1.4)
          star4(0, 0, 5, 2, '#ff9f1c')
        } else {
          rr(-9.5, -8.5, 8.5, 17, 2, '#fffdf5', INK, 1.4)
          rr(1, -8.5, 8.5, 17, 2, '#fffdf5', INK, 1.4)
        }
        circle(0, -10.5, 2, '#38b000', null, 0)
        break
      }
      case 'toilet': {
        rr(-9.5, -12.5, 19, 7.5, 3, '#ffffff', stroke, 2)
        rr(-8, -5, 16, 15, 7.5, '#f8f9fa', stroke, 2)
        ellipse(0, 2.5, 4.8, 5.2, 0, '#90e0ef', '#0077b6', 1.3)
        break
      }
      case 'shredder': {
        // 高速咬齿碎纸机 + 飞舞纸屑
        rr(-12.5, -11, 25, 22, 4.5, '#adb5bd', stroke, 2.2)
        rr(-10, -8, 20, 7, 2, '#2b2d42', INK, 1.4)
        // 银色锯齿咬口
        ctx.fillStyle = '#f8f9fa'
        for (let i = -8; i <= 6; i += 4) {
          ctx.fillRect(i, -6 + ((Math.floor(clock * 16) + i) % 2), 2.4, 3.5)
        }
        circle(7.5, 4, 2.2, '#ff006e', INK, 1)
        // 飞舞碎纸条
        for (let k = 0; k < 4; k++) {
          const px = -6 + k * 4 + Math.sin(clock * 9 + k) * 2.5
          const py = 5 + ((clock * 18 + k * 4) % 9)
          rr(px, py, 3, 4.5, 0.5, '#ffffff', '#ced4da', 0.6)
        }
        break
      }
      case 'contract_pile':
      case 'overtime_pile':
      case 'paper_pile': {
        if (o.destroyed || o.smashed || o.done) {
          for (let k = 0; k < 4; k++) {
            ctx.save()
            ctx.translate((k - 1.5) * 5, (k % 2) * 4)
            ctx.rotate(k * 0.7)
            rr(-5, -4, 10, 7, 1, '#fffdf5', '#adb5bd', 1)
            ctx.restore()
          }
          break
        }
        // 比人还高的摇晃加班合同山
        const wob = Math.sin(clock * 4 + (o.col || 0)) * 1.2
        for (let lv = 0; lv < 4; lv++) {
          const ox = (lv % 2 === 0 ? -1 : 1) * 1.5 + wob * (lv * 0.35)
          const oy = 4 - lv * 5
          rr(-10 + ox, oy - 5, 20, 9, 2, lv % 2 ? '#fffdf5' : '#f1faee', stroke, 1.8)
          ctx.fillStyle = '#ef233c'
          ctx.fillRect(-2 + ox, oy - 5, 4, 9) // 红封条
        }
        circle(4 + wob, -11, 3.5, '#ef233c', null, 0)
        break
      }
      case 'projector': {
        const broken = Boolean(o.destroyed || o.smashed || o.done)
        // 洗脑投影仪 + 发光大饼幕布扇束
        if (!broken) {
          ctx.fillStyle = 'rgba(255,209,102,0.28)'
          ctx.beginPath()
          ctx.moveTo(0, -6)
          ctx.lineTo(-16, -24)
          ctx.lineTo(16, -24)
          ctx.closePath()
          ctx.fill()
          rr(-15, -26, 30, 6, 2, '#fffdf5', '#ff9f1c', 1.5)
        }
        rr(-11, -7, 22, 15, 4, broken ? '#6c757d' : '#fffdf5', stroke, 2.1)
        circle(0, -7, 5, broken ? '#343a40' : '#4cc9f0', INK, 1.6)
        if (!broken) circle(0, -7, 2.2, '#ffffff', null, 0)
        break
      }
      case 'power_switch':
      case 'breaker':
      case 'fuse_box': {
        const off = Boolean(o.done || o.pulled || o.tripped || o.off)
        rr(-10, -12, 20, 24, 4, '#ffbe0b', stroke, 2.2)
        rr(-6.5, -8, 13, 16, 2, '#343a40', INK, 1.4)
        // 电闸拉杆（上合闸绿 / 下拉闸红+电火花）
        rr(-4, off ? 1 : -6, 8, 5, 1.5, off ? '#ef233c' : '#38b000', '#fffdf5', 1.2)
        if (off) {
          const sp = Math.sin(clock * 30) * 3
          star4(8 + sp * 0.3, 4, 5.5, 1.8, '#00f5d4', INK, 0.8)
        }
        break
      }
      case 'vault_box':
      case 'bonus_chest':
      case 'treasure': {
        const taken = Boolean(o.done || o.collected)
        rr(-13, -9, 26, 19, 4.5, '#d90429', stroke, 2.3)
        rr(-13, -9, 26, 7, [4.5, 4.5, 0, 0], taken ? '#495057' : '#ffbe0b', stroke, 2)
        rr(-3.5, -4, 7, 6, 1.5, '#ffd166', INK, 1.5)
        if (!taken) {
          star4(-9, -11, 4.5, 1.6, '#fff3b0')
          star4(10, -6, 3.8, 1.4, '#ffffff')
        }
        break
      }
      case 'archive_cabinet':
      case 'filing_cabinet': {
        // HR 铁皮保密档案柜（装降薪协议）
        rr(-11, -13, 22, 25, 3.5, '#6c757d', stroke, 2.2)
        for (let d = 0; d < 3; d++) {
          rr(-8.5, -10 + d * 7.5, 17, 6, 1.2, '#adb5bd', INK, 1.2)
          ctx.fillStyle = '#fffdf5'
          ctx.fillRect(-3, -8 + d * 7.5, 6, 2)
        }
        circle(6, -10, 2.5, '#ef233c', INK, 0.9)
        break
      }
      default: {
        // 精致立体卡通物资台兜底（无白框套Emoji）
        rr(-11, -10, 22, 20, 5, o.done ? '#95d5b2' : '#ffd166', stroke, 2.2)
        rr(-8, -7, 16, 10, 3, '#fffdf5', INK, 1.3)
        star4(0, -2, 4.5, 1.8, o.done ? '#2a9d8f' : '#fb5607')
        break
      }
    }
    ctx.restore()
  }

  function drawProps(a, b, targetArg) {
    const { game, clock } = sync(a, b)
    if (!game) return
    const pl = game.player || { x: -999, y: -999 }
    const target = targetArg ?? game.currentTarget ?? null

    // 1) 地上可拾取道具
    for (const pk of game.pickups || []) {
      if (pk.collected) continue
      const p = P(pk.x, pk.y)
      drawPickupSprite(pk, p.x, p.y, clock)
    }

    // 2) 固定场景交互物 + 严格 <68px / 目标锁定防重叠气泡
    for (const o of game.objects || []) {
      const p = P(o.x, o.y)
      const isT = Boolean(target && (target.id === o.id || (target.x === o.x && target.y === o.y)))
      if (isT) {
        ctx.save()
        ctx.strokeStyle = '#2a9d8f'
        ctx.lineWidth = 2.8
        ctx.setLineDash([5, 4])
        ctx.lineDashOffset = -clock * 20
        ctx.beginPath()
        ctx.arc(p.x, p.y, 18.5 + Math.sin(clock * 6) * 2, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
      }
      drawObjectSprite(o, p.x, p.y, isT, clock)

      if (o.type === 'microwave' && (o.timer || 0) > 0) {
        pill(`💥 ${o.timer.toFixed(1)}s`, p.x, p.y - 21, { bg: '#ff006e', fg: '#ffffff', border: INK })
      } else if ((o.cooldown || 0) > 0 && ['phone', 'fan_switch', 'microwave'].includes(o.type)) {
        if (Math.hypot(o.x - pl.x, o.y - pl.y) < 68) {
          pill(`冷却 ${Math.ceil(o.cooldown)}s`, p.x, p.y + 19, { size: 8, bg: '#e9ecef' })
        }
      } else if (o.name && (isT || Math.hypot(o.x - pl.x, o.y - pl.y) < 68)) {
        pill(o.name, p.x, p.y + 20, { size: 8, border: isT ? '#2a9d8f' : INK, bg: isT ? '#e6fcf5' : '#fffdf5' })
      }
    }

    // 3) 人体工学滑轮转椅（五星脚轮 + 弧形靠背）
    for (const ch of game.chairs || []) {
      const p = P(ch.x, ch.y)
      ctx.save()
      ctx.translate(p.x, p.y)
      if (ch.sliding) ctx.rotate(clock * 18)
      ellipse(1, 6, 10.5, 4.8, 0, 'rgba(43,45,66,0.22)', null, 0)
      // 五星滑轮底座
      for (let i = 0; i < 5; i++) {
        const ang = (i * Math.PI * 2) / 5
        circle(Math.cos(ang) * 8, 4 + Math.sin(ang) * 3.5, 2, '#343a40', null, 0)
      }
      rr(-9, -7, 18, 14, 5.5, ch.sliding ? '#fb5607' : '#7209b7', INK, 2.1)
      rr(-7.5, -11.5, 15, 6, 3, ch.sliding ? '#ffbe0b' : '#b5179e', INK, 1.9)
      ctx.restore()
      if (!ch.sliding && Math.hypot(ch.x - pl.x, ch.y - pl.y) < 56 && game.cfg?.mode !== 'vault_heist') {
        pill('踢飞转椅!', p.x, p.y - 19, { size: 8, bg: '#3a86ff', fg: '#ffffff' })
      }
    }

    // 4) 送水移动推车掩体
    if (game.movingCart) {
      const p = P(game.movingCart.x, game.movingCart.y)
      ellipse(p.x, p.y + 15, 13, 5, 0, 'rgba(43,45,66,0.2)', null, 0)
      rr(p.x - 12, p.y - 17, 24, 34, 6, '#90e0ef', INK, 2.2)
      rr(p.x - 9, p.y - 20, 18, 4, 2, '#495057', INK, 1.5) // 推车扶手
      for (let i = 0; i < 3; i++) {
        circle(p.x, p.y - 8 + i * 9, 4.8, '#00b4d8', INK, 1.5)
        circle(p.x - 1.5, p.y - 9.5 + i * 9, 1.5, '#caf0f8', null, 0)
      }
      if (Math.hypot(game.movingCart.x - pl.x, game.movingCart.y - pl.y) < 68) {
        pill('移动水车掩体', p.x, p.y - 26, { size: 8, bg: '#caf0f8' })
      }
    }

    // 5) 发条青蛙诱饵
    for (const f of game.frogs || []) {
      const p = P(f.x, f.y)
      const hop = Math.abs(Math.sin(clock * 13)) * 6
      ellipse(p.x, p.y + 4, 8, 3.5, 0, 'rgba(43,45,66,0.2)', null, 0)
      drawPickupSprite({ type: 'frog', col: 0, row: 0 }, p.x, p.y - hop, clock)
      pill('呱呱!', p.x + 14, p.y - 16, { size: 7.5, bg: '#b7efc5' })
    }

    // 6) 旋转监控探头
    for (const cam of game.cameras || []) {
      const p = P(cam.x, cam.y)
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(A(cam.dirAngle))
      rr(-7.5, -5, 15, 10, 3, (cam.disabledTimer || 0) > 0 ? '#6c757d' : '#3c096c', INK, 2)
      circle(7, 0, 3.2, (cam.suspicion || 0) > 30 ? '#ff006e' : '#c77dff', INK, 1.2)
      ctx.restore()
    }
  }

  // ================= 8. Q萌二头身角色再进化（秃头王总 / 飙椅尾焰 / 挥锅弧光 / 老板皇冠喇叭） =================
  const LOOKS = {
    player: {
      body: '#4f8ef7',
      skin: '#ffd8a8',
      badge: true,
      scale: 1.15,
      back: (hx, hy, r) => circle(hx, hy + 1, r + 2.8, '#3b6fd1', INK, 2),
      front: (hx, hy, r, f) => {
        if (f.back) return
        ctx.fillStyle = '#5c3a21'
        ctx.beginPath()
        ctx.arc(hx, hy - 2, r + 0.4, Math.PI * 1.04, Math.PI * 1.96)
        ctx.fill()
        // 刘海高光弧
        ctx.strokeStyle = 'rgba(255,255,255,0.45)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(hx - 2, hy - 3, r * 0.65, Math.PI * 1.15, Math.PI * 1.65)
        ctx.stroke()
      }
    },
    boss: {
      body: '#2b2d42',
      skin: '#ffcf9e',
      scale: 1.34,
      belly: true,
      wide: false,
      tie: '#ffbe0b',
      polo: false,
      pearls: false,
      goldChain: false,
      customEyes: true,
      back: (hx, hy, r) => {
        if (bossProfile.hair === 'perm') {
          circle(hx - r + 1, hy + 1, 5.5, '#4a2511', INK, 1.8)
          circle(hx + r - 1, hy + 1, 5.5, '#4a2511', INK, 1.8)
        } else if (bossProfile.hair === 'bun') {
          circle(hx, hy - r - 3.5, 5, '#22223b', INK, 1.8)
        } else if (bossProfile.hair === 'afro') {
          circle(hx, hy - 3, r + 4, '#2b2d42', INK, 2)
        }
      },
      front: (hx, hy, r, f, opts, clock) => {
        const isBald = opts.wigLost || bossProfile.hair === 'bald'
        if (isBald) {
          // 爆笑地中海两侧残发 + 亮晶晶反光大秃头！
          circle(hx - r + 1, hy - 1, 3.2, '#2b2d42', INK, 1.3)
          circle(hx + r - 1, hy - 1, 3.2, '#2b2d42', INK, 1.3)
          ellipse(hx - 2.5, hy - r + 4.2, 4.8, 2.5, -0.35, 'rgba(255,255,255,0.92)', null, 0)
          const twinkle = 3.2 + Math.sin(clock * 12) * 1.3
          star4(hx + 3.5, hy - r + 3, twinkle, twinkle * 0.38, '#ffffff', '#ffd166', 0.6)
        } else if (bossProfile.hair === 'slick') {
          // 大背头油头霸总（挑高刘海 + 金色发胶高光）
          ctx.fillStyle = '#1b1b2f'
          ctx.beginPath()
          ctx.arc(hx, hy - 2.5, r + 1.4, Math.PI * 0.96, Math.PI * 2.04)
          ctx.fill()
          ctx.strokeStyle = INK
          ctx.lineWidth = 1.8
          ctx.stroke()
          ellipse(hx, hy - r - 0.5, 5.5, 2.8, -0.15, '#1b1b2f', INK, 1.6)
          ellipse(hx - 1.5, hy - r + 1, 4, 1.3, -0.2, 'rgba(255,209,102,0.55)', null, 0)
        } else if (bossProfile.hair === 'afro') {
          // 蓬松爆炸卷毛头
          for (const [ox, oy, cr] of [
            [-7, -5, 5],
            [-3.5, -9, 5.5],
            [2, -9.5, 5.5],
            [7, -5.5, 5],
            [0, -7, 6]
          ]) {
            circle(hx + ox, hy + oy, cr, '#2b2d42', INK, 1.5)
          }
        } else if (bossProfile.hair === 'perm') {
          // 女魔头精致大波浪卷发 + 金耳环
          ctx.fillStyle = '#4a2511'
          ctx.beginPath()
          ctx.arc(hx, hy - 2, r + 1.5, Math.PI * 0.92, Math.PI * 2.08)
          ctx.fill()
          ctx.strokeStyle = INK
          ctx.lineWidth = 1.7
          ctx.stroke()
          circle(hx - r - 0.5, hy + 2, 2.2, '#ffd166', INK, 1)
          circle(hx + r + 0.5, hy + 2, 2.2, '#ffd166', INK, 1)
        } else if (bossProfile.hair === 'bun') {
          // 干练铁娘子丸子头 + 金发簪
          ctx.fillStyle = '#22223b'
          ctx.beginPath()
          ctx.arc(hx, hy - 2, r + 0.8, Math.PI * 0.98, Math.PI * 2.02)
          ctx.fill()
          ctx.strokeStyle = INK
          ctx.lineWidth = 1.6
          ctx.stroke()
          ctx.strokeStyle = '#ffd166'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(hx - 7, hy - r - 3)
          ctx.lineTo(hx + 7, hy - r - 4)
          ctx.stroke()
        } else {
          // 经典三七分浓密假发套（带高光发际线）
          ctx.fillStyle = '#22223b'
          ctx.beginPath()
          ctx.arc(hx, hy - 2, r + 1.2, Math.PI * 0.98, Math.PI * 2.02)
          ctx.fill()
          ctx.strokeStyle = INK
          ctx.lineWidth = 1.8
          ctx.stroke()
          ellipse(hx - 3, hy - r + 2.5, 3.8, 1.6, -0.3, 'rgba(255,255,255,0.45)', null, 0)
        }

        if (f.back) return
        // 腮红
        ellipse(hx - 6.5, hy + 3.5, 2.5, 1.4, 0, 'rgba(255,105,140,0.45)', null, 0)
        ellipse(hx + 6.5, hy + 3.5, 2.5, 1.4, 0, 'rgba(255,105,140,0.45)', null, 0)

        // 眼镜 / 眼神款式
        const gl = bossProfile.glasses || 'shades'
        if (gl === 'shades') {
          rr(hx - 7.5 + f.ex, hy - 2 + f.ey, 6.5, 4.5, 1.8, INK, null, 0)
          rr(hx + 1 + f.ex, hy - 2 + f.ey, 6.5, 4.5, 1.8, INK, null, 0)
          ctx.fillStyle = INK
          ctx.fillRect(hx - 1 + f.ex, hy - 1 + f.ey, 2, 1.5)
        } else if (gl === 'gold_rim') {
          circle(hx - 3.8 + f.ex, hy + 0.2 + f.ey, 3.4, 'rgba(255,255,255,0.35)', '#d48c00', 1.5)
          circle(hx + 3.8 + f.ex, hy + 0.2 + f.ey, 3.4, 'rgba(255,255,255,0.35)', '#d48c00', 1.5)
          circle(hx - 3.8 + f.ex, hy + 0.2 + f.ey, 1.4, INK, null, 0)
          circle(hx + 3.8 + f.ex, hy + 0.2 + f.ey, 1.4, INK, null, 0)
        } else if (gl === 'thick_frame') {
          rr(hx - 7.2 + f.ex, hy - 2 + f.ey, 6.2, 4.4, 1.2, 'rgba(255,255,255,0.45)', INK, 1.7)
          rr(hx + 1 + f.ex, hy - 2 + f.ey, 6.2, 4.4, 1.2, 'rgba(255,255,255,0.45)', INK, 1.7)
          circle(hx - 4.1 + f.ex, hy + 0.2 + f.ey, 1.3, INK, null, 0)
          circle(hx + 4.1 + f.ex, hy + 0.2 + f.ey, 1.3, INK, null, 0)
        } else if (gl === 'monocle') {
          circle(hx - 3.8 + f.ex, hy + 0.3 + f.ey, 1.6, INK, null, 0)
          circle(hx + 3.8 + f.ex, hy + 0.2 + f.ey, 3.6, 'rgba(144,224,239,0.45)', '#ffd166', 1.6)
          circle(hx + 3.8 + f.ex, hy + 0.3 + f.ey, 1.4, INK, null, 0)
          ctx.strokeStyle = '#ffd166'
          ctx.lineWidth = 1.1
          ctx.beginPath()
          ctx.moveTo(hx + 7 + f.ex, hy + 1 + f.ey)
          ctx.lineTo(hx + 6.5 + f.ex, hy + 6 + f.ey)
          ctx.stroke()
        } else {
          // 犀利死鱼眼
          circle(hx - 3.8 + f.ex, hy + 0.4 + f.ey, 1.8, INK, null, 0)
          circle(hx + 3.8 + f.ex, hy + 0.4 + f.ey, 1.8, INK, null, 0)
          ctx.strokeStyle = INK
          ctx.lineWidth = 1.6
          ctx.beginPath()
          ctx.moveTo(hx - 6.5 + f.ex, hy - 1.5 + f.ey)
          ctx.lineTo(hx - 1.2 + f.ex, hy - 0.8 + f.ey)
          ctx.moveTo(hx + 1.2 + f.ex, hy - 0.8 + f.ey)
          ctx.lineTo(hx + 6.5 + f.ex, hy - 1.5 + f.ey)
          ctx.stroke()
        }

        // 胡须 / 红唇特征
        const bd = bossProfile.beard || 'mustache'
        if (bd === 'mustache') {
          ellipse(hx - 3 + f.ex, hy + 5 + f.ey, 3.4, 1.5, 0.2, '#3d2b1f', null, 0)
          ellipse(hx + 3 + f.ex, hy + 5 + f.ey, 3.4, 1.5, -0.2, '#3d2b1f', null, 0)
        } else if (bd === 'goatee') {
          ellipse(hx + f.ex, hy + 4.6 + f.ey, 3.2, 1.2, 0, '#3d2b1f', null, 0)
          ctx.fillStyle = '#3d2b1f'
          ctx.beginPath()
          ctx.moveTo(hx - 2.2 + f.ex, hy + 6.5 + f.ey)
          ctx.lineTo(hx + 2.2 + f.ex, hy + 6.5 + f.ey)
          ctx.lineTo(hx + f.ex, hy + 10.5 + f.ey)
          ctx.closePath()
          ctx.fill()
        } else if (bd === 'full_beard') {
          ctx.fillStyle = 'rgba(43,45,66,0.75)'
          ctx.beginPath()
          ctx.arc(hx + f.ex * 0.4, hy + 1, r - 0.5, 0.15, Math.PI - 0.15)
          ctx.fill()
          rr(hx - 2.2 + f.ex, hy + 4.5 + f.ey, 4.4, 2, 1, '#ffcf9e', null, 0)
        } else if (bd === 'lipstick') {
          ellipse(hx + f.ex, hy + 5.2 + f.ey, 2.8, 1.5, 0, '#e63946', '#9b0000', 0.8)
          circle(hx + 4.8 + f.ex, hy + 3.2 + f.ey, 0.9, INK, null, 0) // 美人痣
        } else {
          // 双下巴微笑弧线
          ctx.strokeStyle = 'rgba(156,102,68,0.65)'
          ctx.lineWidth = 1.2
          ctx.beginPath()
          ctx.arc(hx + f.ex, hy + 4.5 + f.ey, 3.2, 0.2, Math.PI - 0.2)
          ctx.stroke()
        }
      }
    },
    hr: {
      body: '#e63946',
      skin: '#ffe0c7',
      tie: '#fffdf5',
      back: (hx, hy, r) => circle(hx, hy - r - 2, 4.5, '#5a3825', INK, 2),
      front: (hx, hy, r, f) => {
        ctx.fillStyle = '#5a3825'
        ctx.beginPath()
        ctx.arc(hx, hy - 1, r + 0.5, Math.PI * (f.back ? 0 : 1.0), Math.PI * 2)
        ctx.fill()
        if (f.back) return
        ctx.strokeStyle = INK
        ctx.lineWidth = 1.4
        ctx.strokeRect(hx - 6.5 + f.ex, hy + 0.3 + f.ey, 5, 3.8)
        ctx.strokeRect(hx + 1.5 + f.ex, hy + 0.3 + f.ey, 5, 3.8)
      }
    },
    guard: {
      body: '#3a86ff',
      skin: '#f1c27d',
      badge: true,
      front: (hx, hy, r, f) => {
        ctx.fillStyle = '#1d3557'
        ctx.beginPath()
        ctx.arc(hx, hy - 2, r + 1, Math.PI, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = INK
        ctx.lineWidth = 2
        ctx.stroke()
        if (!f.back) rr(hx - r - 1 + f.ex * 0.8, hy - 4, (r + 1) * 2, 3.8, 2, '#14213d', INK, 1.4)
        circle(hx, hy - r + 1, 2.2, '#ffd166', INK, 1)
      }
    },
    snitch: {
      body: '#52b788',
      skin: '#ffe5b4',
      front: (hx, hy, r) => {
        ctx.fillStyle = '#1b1b1b'
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath()
          ctx.moveTo(hx + i * 3 - 2, hy - r + 3)
          ctx.lineTo(hx + i * 3, hy - r - 4)
          ctx.lineTo(hx + i * 3 + 2, hy - r + 3)
          ctx.fill()
        }
        ctx.strokeStyle = INK
        ctx.lineWidth = 2.2
        ctx.beginPath()
        ctx.arc(hx, hy, r + 2, Math.PI * 1.1, Math.PI * 1.9)
        ctx.stroke()
        circle(hx - r - 1, hy + 1, 2.8, '#ff006e', INK, 1.4)
        circle(hx + r + 1, hy + 1, 2.8, '#ff006e', INK, 1.4)
      }
    },
    pm: {
      body: '#8338ec',
      skin: '#ffe5d9',
      tie: '#ffbe0b',
      front: (hx, hy, r, f) => {
        ctx.fillStyle = '#3c096c'
        ctx.beginPath()
        ctx.arc(hx, hy - 1.5, r + 0.5, Math.PI * 1.02, Math.PI * 1.98)
        ctx.fill()
        if (!f.back) {
          circle(hx - 3.6 + f.ex, hy + 1 + f.ey, 3.2, null, INK, 1.3)
          circle(hx + 3.6 + f.ex, hy + 1 + f.ey, 3.2, null, INK, 1.3)
        }
      }
    },
    client: {
      body: '#0077b6',
      skin: '#ffd8a8',
      tie: '#ffd166',
      belly: true,
      front: (hx, hy, r, f) => {
        ctx.fillStyle = '#495057'
        ctx.beginPath()
        ctx.arc(hx, hy - 2, r + 0.6, Math.PI, Math.PI * 2)
        ctx.fill()
        if (!f.back) {
          rr(hx - 7 + f.ex, hy - 1.5 + f.ey, 6, 4, 1.5, '#ffd166', INK, 1.1)
          rr(hx + 1 + f.ex, hy - 1.5 + f.ey, 6, 4, 1.5, '#ffd166', INK, 1.1)
        }
      }
    }
  }

  function drawChibi(sx, sy, lookOrRole, faceA, opts = {}, clockOverride) {
    const look = typeof lookOrRole === 'string' ? LOOKS[lookOrRole] || LOOKS.player : lookOrRole || LOOKS.player
    const clock = clockOverride ?? lastClock
    const { moving = false, mood = 'normal', alpha = 1, spin = 0, seed = 0, wigLost = false, crown = false, megaphone = false } = opts
    const k = look.scale || 1
    const t = clock + seed
    const bob = moving ? Math.abs(Math.sin(t * 14)) * 2.6 : Math.sin(t * 3.2) * 0.7
    const fx = Math.cos(faceA)
    const fy = Math.sin(faceA)

    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(sx, sy)
    ellipse(0, 9 * k, 10 * k, 4.2 * k, 0, 'rgba(43,45,66,0.22)', null, 0)
    if (spin) ctx.rotate(Math.sin(t * 12) * 0.5)
    ctx.scale(k, k)

    // 双腿摆动
    const leg = moving ? Math.sin(t * 14) * 2.5 : 0
    rr(-5.5, 3 - bob + leg * 0.3, 4.5, 6 + leg, 2, INK, null, 0)
    rr(1, 3 - bob - leg * 0.3, 4.5, 6 - leg, 2, INK, null, 0)

    // 身体西装/工装 + 领带/珍珠项链/大金链/Polo条纹/蓝色工牌挂绳
    const bw = look.wide ? 22.5 : look.belly ? 20 : 16.5
    rr(-bw / 2, -7 - bob, bw, 13.5, 6, look.body, INK, 2.2)
    if (look.polo) {
      ctx.fillStyle = '#ffd166'
      ctx.fillRect(-bw / 2 + 2, -2 - bob, bw - 4, 2)
      ctx.fillStyle = '#1b4332'
      ctx.fillRect(-bw / 2 + 2, 3 - bob, bw - 4, 2.2)
      rr(-2.5, 2.5 - bob, 5, 3, 1, '#ffd166', INK, 0.9)
    } else if (look.pearls) {
      for (let i = -2; i <= 2; i++) {
        circle(i * 2.2, -5.2 - bob + Math.abs(i) * 0.4, 1.3, '#fffdf5', INK, 0.7)
      }
    } else if (look.goldChain) {
      ctx.strokeStyle = '#ffb703'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(0, -5.5 - bob, 4.5, 0.2, Math.PI - 0.2)
      ctx.stroke()
      circle(0, -0.5 - bob, 2.2, '#ffd166', INK, 0.9)
    } else if (look.tie) {
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.moveTo(-3.5, -7 - bob)
      ctx.lineTo(3.5, -7 - bob)
      ctx.lineTo(0, -2 - bob)
      ctx.fill()
      ctx.fillStyle = look.tie
      ctx.beginPath()
      ctx.moveTo(-1.5, -5 - bob)
      ctx.lineTo(1.5, -5 - bob)
      ctx.lineTo(2.2, 3 - bob)
      ctx.lineTo(0, 5 - bob)
      ctx.lineTo(-2.2, 3 - bob)
      ctx.closePath()
      ctx.fill()
    } else if (look.badge) {
      // 打工人胸前工牌
      ctx.strokeStyle = '#ffd166'
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(-2.5, -6.5 - bob)
      ctx.lineTo(0, -1.5 - bob)
      ctx.lineTo(2.5, -6.5 - bob)
      ctx.stroke()
      rr(-2.5, -1.5 - bob, 5, 5.5, 1, '#fffdf5', INK, 0.9)
      ctx.fillStyle = '#3a86ff'
      ctx.fillRect(-1.5, -0.5 - bob, 3, 2)
    }

    // 手臂
    const arm = moving ? Math.sin(t * 14) * 2 : 0
    circle(-bw / 2 - 1, -2 - bob + arm, 3, look.skin, INK, 1.7)
    circle(bw / 2 + 1, -2 - bob - arm, 3, look.skin, INK, 1.7)

    // 手持红色大喇叭（扮演王总模式）
    if (megaphone) {
      ctx.save()
      ctx.translate(fx * 9, -3 - bob + fy * 3)
      ctx.rotate(faceA)
      ctx.fillStyle = '#ef233c'
      ctx.strokeStyle = INK
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.moveTo(0, -2)
      ctx.lineTo(9, -5.5)
      ctx.lineTo(9, 5.5)
      ctx.lineTo(0, 2)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      rr(-2, -2.5, 3.5, 5, 1, '#fffdf5', INK, 1.2)
      ctx.restore()
    }

    // 头部与表情腮红
    const hr = 10.5
    const hx = fx * 1.2
    const hy = -17 - bob
    const back = fy < -0.55
    if (look.back) look.back(hx, hy, hr)
    circle(hx, hy, hr, look.skin, INK, 2.3)

    const f = { ex: fx * 2.6, ey: Math.max(-1, fy * 1.8), back }
    if (!back && !look.customEyes) {
      if (mood === 'dizzy') {
        text('×', hx - 3.8 + f.ex, hy + 3 + f.ey, { size: 8, align: 'center' })
        text('×', hx + 3.8 + f.ex, hy + 3 + f.ey, { size: 8, align: 'center' })
      } else {
        circle(hx - 3.6 + f.ex, hy + 0.5 + f.ey, 1.9, INK, null, 0)
        circle(hx + 3.6 + f.ex, hy + 0.5 + f.ey, 1.9, INK, null, 0)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(hx - 4.1 + f.ex, hy - 0.5 + f.ey, 1.1, 1.1)
        ctx.fillRect(hx + 3.1 + f.ex, hy - 0.5 + f.ey, 1.1, 1.1)
      }
      ellipse(hx - 6 + f.ex * 0.5, hy + 3.8, 2.5, 1.4, 0, 'rgba(255,105,140,0.48)', null, 0)
      ellipse(hx + 6 + f.ex * 0.5, hy + 3.8, 2.5, 1.4, 0, 'rgba(255,105,140,0.48)', null, 0)
    }
    if (look.front) look.front(hx, hy, hr, f, { wigLost }, clock)
    if (!back && look.customEyes && mood === 'dizzy') {
      text('@ @', hx + f.ex, hy + 2 + f.ey, { size: 7, align: 'center', color: '#ffffff' })
    }
    if (!back && mood === 'angry') {
      ctx.strokeStyle = INK
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(hx - 6.5 + f.ex, hy - 4 + f.ey)
      ctx.lineTo(hx - 1.5 + f.ex, hy - 2 + f.ey)
      ctx.moveTo(hx + 6.5 + f.ex, hy - 4 + f.ey)
      ctx.lineTo(hx + 1.5 + f.ex, hy - 2 + f.ey)
      ctx.stroke()
    }

    // 头顶金色小皇冠（反客为主当王总）
    if (crown) {
      ctx.save()
      ctx.translate(hx, hy - hr - 3)
      ctx.fillStyle = '#ffd166'
      ctx.strokeStyle = INK
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.moveTo(-6, 3)
      ctx.lineTo(-7, -4)
      ctx.lineTo(-2.5, -0.5)
      ctx.lineTo(0, -6)
      ctx.lineTo(2.5, -0.5)
      ctx.lineTo(7, -4)
      ctx.lineTo(6, 3)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      circle(0, -0.5, 1.4, '#ff006e', null, 0)
      ctx.restore()
    }

    ctx.restore()
  }

  function statusIcon(x, y, state, suspicion, clock) {
    if (state === 'chase') {
      const s = 1 + Math.sin(clock * 16) * 0.12
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(s, s)
      burstShape(0, 0, 12.5, 7.5, 8, '#ff006e')
      text('!', 0, 5, { size: 14, color: '#ffffff', align: 'center' })
      ctx.restore()
    } else if (state === 'investigate') {
      circle(x, y, 9.5, '#ffd166', INK, 2.2)
      text('?', x, y + 4.5, { size: 13, align: 'center' })
    } else if (state === 'stunned' || state === 'slipping') {
      for (let i = 0; i < 3; i++) {
        const ang = clock * 6 + (i * Math.PI * 2) / 3
        star4(x + Math.cos(ang) * 12, y + 5 + Math.sin(ang) * 4, 4.5, 2, '#ffd166', INK, 0.9)
      }
    } else if (state === 'toilet_panic') {
      rr(x - 10, y - 9, 20, 16, 6, '#ffe5ec', '#d90429', 1.8)
      text('急!!', x, y + 3, { size: 8.5, color: '#d90429', align: 'center' })
    } else if ((suspicion || 0) > 0) {
      circle(x, y, 7.5, '#fffdf5', INK, 2)
      ctx.strokeStyle = suspicion > 60 ? '#ff006e' : '#ffb703'
      ctx.lineWidth = 3.8
      ctx.beginPath()
      ctx.arc(x, y, 7.5, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * suspicion) / 100)
      ctx.stroke()
    }
  }

  // ================= 9. 新增趣味弹幕与动态实体（飞行黑锅/画饼/摸鱼同事/藏身点/需求怪） =================
  function drawProjectilesAndExtras(a, b) {
    const { game, clock } = sync(a, b)
    if (!game) return
    const pl = game.player || { x: -999, y: -999 }

    // 9.1 散落合同（若关卡单独存放在 game.contracts）
    for (const doc of game.contracts || []) {
      if (doc.collected || doc.shredded || doc.locked) continue
      const p = P(doc.x, doc.y)
      drawPickupSprite({ type: 'contract', col: doc.col || 0, row: doc.row || 0 }, p.x, p.y, clock)
    }

    // 9.2 摸鱼同事（Lv10 全员摸鱼大救援：趴桌流口水 zzZ vs 绿色 Excel 屏）
    for (const cw of game.coworkers || []) {
      const p = P(cw.x, cw.y)
      const meter = cw.sleepMeter ?? (cw.sleeping || cw.slacking ? 80 : 0)
      const sleeping = Boolean(cw.sleeping || cw.slacking || cw.state === 'sleeping' || meter >= 45)
      const caught = Boolean(cw.caught || cw.fired)

      // 工位小电脑桌
      ellipse(p.x, p.y + 10, 14, 5, 0, 'rgba(43,45,66,0.18)', null, 0)
      rr(p.x - 14, p.y - 6, 28, 16, 4, '#ddb892', INK, 2)
      // 显示器屏幕：打游戏粉紫屏 vs 紧急切回绿色 Excel 表！
      rr(p.x - 10, p.y - 13, 20, 10, 2.5, caught ? '#6c757d' : sleeping ? '#ff4d6d' : '#38b000', INK, 1.6)
      ctx.fillStyle = '#ffffff'
      if (!sleeping && !caught) {
        ctx.fillRect(p.x - 7, p.y - 10.5, 6, 1.8)
        ctx.fillRect(p.x - 7, p.y - 7.5, 12, 1.8)
      } else if (sleeping) {
        circle(p.x, p.y - 8, 2.5, '#ffd166', null, 0)
      }

      if (caught) {
        pill('被抓包!', p.x, p.y - 22, { size: 7.5, bg: '#ced4da', fg: '#495057' })
      } else if (sleeping) {
        // 趴桌流口水 + 飘浮 zzZ
        circle(p.x, p.y + 1, 8.5, '#ffd8a8', INK, 2)
        ctx.fillStyle = '#5c3a21'
        ctx.beginPath()
        ctx.arc(p.x, p.y, 8.5, Math.PI, Math.PI * 2)
        ctx.fill()
        circle(p.x + 5, p.y + 5, 2, '#4cc9f0', null, 0) // 口水滴
        const zOff = (clock * 14) % 12
        text('zZ', p.x + 9, p.y - 12 - zOff, { size: 9, color: '#7209b7', stroke: '#ffffff', sw: 2.5 })
      } else {
        drawChibi(p.x, p.y + 3, LOOKS.player, -Math.PI / 2, { moving: true, seed: (cw.col || 1) * 2 }, clock)
      }

      // 瞌睡危险进度条
      if (!caught && meter > 5) {
        rr(p.x - 13, p.y + 13, 26, 5, 2.5, '#fffdf5', INK, 1.2)
        rr(p.x - 12, p.y + 14, Math.max(2, (24 * Math.min(100, meter)) / 100), 3, 1.5, meter > 70 ? '#ff006e' : '#ffb703', null, 0)
      }
    }

    // 9.3 可疑藏身点（Lv11 我当王总：微微发抖露出小眼睛的纸箱/绿植/隔间/桌底）
    for (const hs of game.hidingSpots || []) {
      const p = P(hs.x, hs.y)
      const opened = Boolean(hs.searched || hs.opened || hs.revealed || hs.caught)
      const has = Boolean(hs.hasSlacker || hs.occupied || hs.caught)
      const kind = hs.kind || hs.type || 'carton'
      const tremble = !opened && has ? Math.sin(clock * 26 + (hs.col || 0)) * 1.8 : 0

      ctx.save()
      ctx.translate(p.x + tremble, p.y)
      if (opened) {
        if (has) {
          drawChibi(0, 0, LOOKS.player, Math.PI / 2, { mood: 'dizzy' }, clock)
          pill('抓获摸鱼!', p.x, p.y - 26, { size: 7.5, bg: '#ffbe0b', fg: INK })
        } else {
          rr(-11, -6, 22, 12, 3, 'rgba(222,226,230,0.75)', '#adb5bd', 1.5)
        }
      } else {
        ellipse(0, 10, 12, 4.5, 0, 'rgba(43,45,66,0.18)', null, 0)
        if (kind === 'plant' || kind === 'bush') {
          drawBush(0, 0, clock, has, has && Math.sin(clock * 3 + (hs.row || 0)) > 0.2)
        } else if (kind === 'stall' || kind === 'toilet') {
          rr(-11, -13, 22, 24, 4, '#caf0f8', INK, 2.1)
          rr(-8, -9, 16, 15, 2, '#ffffff', INK, 1.3)
        } else if (kind === 'under_desk' || kind === 'desk' || kind === 'table') {
          rr(-13, -9, 26, 18, 4, '#ddb892', INK, 2.1)
          rr(-10, -2, 20, 10, 2, '#6c757d', INK, 1.3)
        } else {
          rr(-12, -11, 24, 21, 3.5, '#dda15e', INK, 2.2)
          rr(-3, -11, 6, 21, 0, '#fefae0', null, 0)
        }
        // 偷偷露出的小眼睛
        if (has && Math.sin(clock * 3.5 + (hs.col || 0) * 2) > -0.2) {
          circle(-3.2, 1, 2.1, '#ffffff', INK, 0.9)
          circle(3.2, 1, 2.1, '#ffffff', INK, 0.9)
          circle(-3, 1, 0.9, INK, null, 0)
          circle(3.4, 1, 0.9, INK, null, 0)
        }
      }
      ctx.restore()
      if (!opened && Math.hypot(hs.x - pl.x, hs.y - pl.y) < 62) {
        pill('📣 搜查!', p.x, p.y + 19, { size: 7.5, bg: '#ff006e', fg: '#ffffff' })
      }
    }

    // 9.4 涌来的需求怪（Lv12 17:59下班保卫战：头顶举着『改18版』『五彩斑斓黑』气泡）
    const DEMANDS = ['改18版!', '五彩斑斓黑', '今晚通宵!', '加个小需求', '对齐颗粒度']
    ;(game.invaders || []).forEach((inv, idx) => {
      if (inv.dead || inv.defeated) return
      const p = P(inv.x, inv.y)
      const roleKey = inv.role || inv.type
      const look = roleKey === 'hr' ? LOOKS.hr : roleKey === 'client' ? LOOKS.client : roleKey === 'boss' ? LOOKS.boss : LOOKS.pm
      const slowed = (inv.slowTimer || 0) > 0
      if (slowed) ellipse(p.x, p.y + 8, 12, 5, 0, 'rgba(0,180,216,0.45)', null, 0)
      drawChibi(p.x, p.y, look, A(inv.angle ?? inv.dirAngle ?? 0), { moving: true, mood: 'angry', seed: idx }, clock)
      const tag = inv.label || inv.tag || inv.text || DEMANDS[idx % DEMANDS.length]
      pill(tag, p.x, p.y - 31, { size: 7.5, bg: '#ffe5ec', fg: '#c1121f', border: '#d90429', avoidOverlap: false })
    })

    // 9.5 飞行的巨型黑锅（black_pot / pot）与金黄芝麻大饼（big_pie / pie）
    for (const pr of game.projectiles || []) {
      const p = P(pr.x, pr.y)
      const vsp = P(pr.x - (pr.vx || 0) * 0.035, pr.y - (pr.vy || 0) * 0.035)
      const isPie = pr.type === 'big_pie' || pr.type === 'pie'
      const rad = Math.max(9, (pr.radius || 15) * S)

      // 动态残影拖尾
      for (let t = 2; t >= 1; t--) {
        const gx = p.x + (vsp.x - p.x) * t * 0.85
        const gy = p.y + (vsp.y - p.y) * t * 0.85
        circle(gx, gy, rad * (1 - t * 0.18), isPie ? 'rgba(255,190,11,0.25)' : pr.reflected ? 'rgba(0,245,212,0.32)' : 'rgba(43,45,66,0.22)', null, 0)
      }

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(clock * (pr.reflected ? 16 : 9))

      if (isPie) {
        // 金黄芝麻巨型画饼弹幕
        circle(0, 0, rad + 2, '#e85d04', INK, 2.2)
        circle(0, 0, rad - 1.5, '#ffd166', '#f48c06', 1.4)
        for (let s = 0; s < 7; s++) {
          const sa = (s * Math.PI * 2) / 7
          const sr = s % 2 ? rad * 0.48 : rad * 0.25
          ellipse(Math.cos(sa) * sr, Math.sin(sa) * sr, 1.6, 0.9, sa, s % 2 ? '#fffdf5' : '#582f0e', null, 0)
        }
      } else {
        // 带邪恶表情与双耳把手的巨型黑锅！
        if (pr.reflected) circle(0, 0, rad + 4, 'rgba(0,245,212,0.35)', '#00bbf9', 1.8)
        circle(-rad - 1, 0, 3.5, null, INK, 2.2) // 左锅耳
        circle(rad + 1, 0, 3.5, null, INK, 2.2)  // 右锅耳
        circle(0, 0, rad, pr.reflected ? '#1d3557' : '#2b2d42', INK, 2.3)
        ellipse(-rad * 0.3, -rad * 0.35, rad * 0.35, rad * 0.16, -0.5, 'rgba(255,255,255,0.28)', null, 0)
        // 邪恶坏笑眼 vs 被反拍惊恐眼
        if (pr.reflected) {
          circle(-3.2, -1, 2, '#00f5d4', null, 0)
          circle(3.2, -1, 2, '#00f5d4', null, 0)
        } else {
          ctx.fillStyle = '#ff006e'
          ctx.beginPath()
          ctx.arc(-3.5, -1, 2.2, 0, Math.PI)
          ctx.arc(3.5, -1, 2.2, 0, Math.PI)
          ctx.fill()
          ctx.strokeStyle = '#ffbe0b'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.arc(0, 2.5, 4, 0.15 * Math.PI, 0.85 * Math.PI)
          ctx.stroke()
        }
      }
      ctx.restore()
    }

    // 9.6 王总被吹飞掉在地上的卷毛假发！
    for (const g of game.guards || []) {
      if (!g.wigLost) continue
      const wp = g.wigPos ? P(g.wigPos.x, g.wigPos.y) : P(g.x - 22, g.y + 18)
      ctx.save()
      ctx.translate(wp.x, wp.y + Math.sin(clock * 4) * 1.5)
      ctx.rotate(-0.25)
      ellipse(0, 3, 9, 3.5, 0, 'rgba(43,45,66,0.18)', null, 0)
      ctx.fillStyle = '#22223b'
      ctx.strokeStyle = INK
      ctx.lineWidth = 1.8
      ctx.beginPath()
      ctx.arc(0, 2, 8.5, Math.PI, Math.PI * 2)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.restore()
    }
  }

  // ================= 10. 角色层（含飙椅喷火、挥锅弧光、携带物与Y轴景深） =================
  function drawCharacters(a, b) {
    const { game, clock } = sync(a, b)
    if (!game?.player) return
    const pl = game.player

    // 自动寻路虚线引导
    if (pl.path?.length > 0) {
      ctx.save()
      ctx.strokeStyle = 'rgba(58,134,255,0.62)'
      ctx.lineWidth = 2.8
      ctx.setLineDash([2, 6])
      ctx.lineCap = 'round'
      ctx.beginPath()
      const s0 = P(pl.x, pl.y)
      ctx.moveTo(s0.x, s0.y)
      for (const st of pl.path) {
        const c = cellCenter(st.col, st.row)
        const s = P(c.x, c.y)
        ctx.lineTo(s.x, s.y)
      }
      ctx.stroke()
      ctx.restore()
    }

    const list = []
    for (const sn of game.snitches || []) list.push({ kind: 'snitch', o: sn, sy: P(sn.x, sn.y).y })
    for (const g of game.guards || []) list.push({ kind: 'guard', o: g, sy: P(g.x, g.y).y })
    list.push({ kind: 'player', o: pl, sy: P(pl.x, pl.y).y })
    list.sort((x, y) => x.sy - y.sy)

    for (const it of list) {
      if (it.kind === 'snitch') {
        const sn = it.o
        const p = P(sn.x, sn.y)
        rr(p.x - 14, p.y + 4, 28, 9, 3, '#dee2e6', INK, 2)
        rr(p.x - 6, p.y - 1, 12, 7, 2, '#495057', INK, 1.5)
        drawChibi(p.x, p.y - 2, LOOKS.snitch, A(sn.dirAngle), { mood: (sn.stunTimer || 0) > 0 ? 'dizzy' : 'normal', seed: 3 }, clock)
        statusIcon(p.x, p.y - 36, (sn.stunTimer || 0) > 0 ? 'stunned' : 'none', sn.suspicion, clock)
        pill(`📣${sn.name}`, p.x, p.y + 20, { size: 7.5, bg: '#d8f3dc', avoidOverlap: false })
      } else if (it.kind === 'guard') {
        const g = it.o
        const p = P(g.x, g.y)
        const dizzy = g.state === 'stunned' || g.state === 'slipping' || Boolean(g.defeated)
        const charging = g.state === 'charge_prep' || g.state === 'charging'

        // Boss 暴走蓄力冲锋红线预警与火焰气场（Lv16）
        if (charging) {
          ctx.save()
          ctx.translate(p.x, p.y)
          circle(0, -4, 21 + Math.sin(clock * 24) * 2.5, 'rgba(255,0,110,0.18)', '#ff006e', 2)
          if (g.state === 'charge_prep') {
            ctx.rotate(A(g.dirAngle))
            ctx.strokeStyle = 'rgba(255,0,110,0.75)'
            ctx.lineWidth = 5
            ctx.setLineDash([6, 4])
            ctx.beginPath()
            ctx.moveTo(12, 0)
            ctx.lineTo(86, 0)
            ctx.stroke()
            ctx.setLineDash([])
          }
          ctx.restore()
        }

        if (g.defeated) {
          circle(p.x, p.y + 2, 22 + Math.sin(clock * 8) * 2.5, 'rgba(255,209,102,0.28)', '#ffbe0b', 2.2)
        }

        drawChibi(
          p.x,
          p.y,
          LOOKS[g.role] || LOOKS.hr,
          dizzy ? clock * 6 : A(g.dirAngle),
          {
            moving: !dizzy && g.state !== 'idle' && g.state !== 'charge_prep',
            mood: dizzy ? 'dizzy' : g.state === 'chase' || charging || g.enraged ? 'angry' : 'normal',
            spin: dizzy && !g.defeated,
            seed: (g.id || '').length,
            wigLost: Boolean(g.wigLost)
          },
          clock
        )
        if (g.carryingDoc) {
          drawPickupSprite({ type: 'paycut_contract', col: 0, row: 0 }, p.x + 13, p.y - 14, clock)
        }
        statusIcon(p.x, p.y - (g.role === 'boss' ? 44 : 38), g.defeated ? 'stunned' : g.state, g.suspicion, clock)
        if (g.defeated) {
          pill('📄 拍下炒鱿鱼通知!', p.x, p.y - 54, { size: 8, bg: '#ffbe0b', fg: INK })
        }
        text(g.name, p.x, p.y + 21, { size: 8, align: 'center', stroke: '#fffdf5', sw: 3 })
      } else {
        const p = P(pl.x, pl.y)
        const faceA = A(pl.angle ?? -Math.PI / 2)
        const isBossRole = game.playerRole === 'boss' || pl.role === 'boss'
        const riding = Boolean(pl.ridingChair || game.ridingChair || game.cfg?.mode === 'chair_derby')
        const swing = pl.swingTimer || game.swingTimer || 0

        if (pl.carton && !riding && !isBossRole) {
          // 顺丰快递纸箱伪装
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(pl.isMoving ? Math.sin(clock * 20) * 0.1 : 0)
          ellipse(0, 11, 13, 4.2, 0, 'rgba(43,45,66,0.22)', null, 0)
          rr(-13, -14, 26, 24, 3.5, '#dda15e', INK, 2.4)
          rr(-13, -14, 26, 6, [3.5, 3.5, 0, 0], '#bc6c25', INK, 2)
          rr(-3, -14, 6, 24, 0, '#fefae0', null, 0)
          if (!pl.isMoving) {
            circle(-5, -2, 2.1, '#ffffff', INK, 1)
            circle(5, -2, 2.1, '#ffffff', INK, 1)
          }
          text('顺丰', 0, 7, { size: 6.5, align: 'center', color: '#6f1d1b' })
          ctx.restore()
        } else {
          // 氮气改装旋转椅底座与蓝橙喷射尾焰！
          if (riding) {
            ctx.save()
            ctx.translate(p.x, p.y + 3)
            const backA = faceA + Math.PI
            const boosting = Boolean(pl.sprinting || pl.boosting || (pl.nitroTimer || 0) > 0 || pl.isMoving)
            if (boosting) {
              const fl = (pl.sprinting || (pl.nitroTimer || 0) > 0 ? 18 : 11) + Math.sin(clock * 40) * 4
              ctx.save()
              ctx.rotate(backA)
              // 外层橙红尾焰 + 内核幽蓝氮气焰 + 漂移烟尘
              ctx.fillStyle = '#fb5607'
              ctx.beginPath()
              ctx.moveTo(6, -5)
              ctx.lineTo(8 + fl, 0)
              ctx.lineTo(6, 5)
              ctx.closePath()
              ctx.fill()
              ctx.fillStyle = '#00f5d4'
              ctx.beginPath()
              ctx.moveTo(6, -2.8)
              ctx.lineTo(6 + fl * 0.68, 0)
              ctx.lineTo(6, 2.8)
              ctx.closePath()
              ctx.fill()
              circle(10 + fl * 0.9, Math.sin(clock * 25) * 4, 3.5, 'rgba(255,255,255,0.65)', null, 0)
              ctx.restore()
            }
            rr(-11, -6, 22, 13, 5, '#ff006e', INK, 2.2)
            rr(-9, -10, 18, 6, 3, '#ffbe0b', INK, 1.8)
            ctx.restore()
          }

          const pDizzy = (pl.stunTimer || 0) > 0
          if ((pl.activeBuffTimer || 0) > 0 || (pl.nitroTimer || 0) > 0 || (pl.dashTimer || 0) > 0) {
            ctx.strokeStyle = (pl.dashTimer || 0) > 0 ? '#ffbe0b' : '#00bbf9'
            ctx.lineWidth = 2.8
            ctx.beginPath()
            ctx.arc(p.x, p.y - 6, 20 + Math.sin(clock * 20) * 2, 0, Math.PI * 2)
            ctx.stroke()
          }

          drawChibi(
            p.x,
            riding ? p.y - 3 : p.y,
            isBossRole ? LOOKS.boss : LOOKS.player,
            pDizzy ? clock * 8 : faceA,
            {
              moving: pl.isMoving && !riding && !pDizzy,
              mood: pDizzy ? 'dizzy' : 'normal',
              spin: pDizzy,
              alpha: pl.hiding ? 0.45 : 1,
              crown: isBossRole,
              megaphone: isBossRole
            },
            clock
          )
          if (pDizzy) statusIcon(p.x, p.y - 40, 'stunned', 0, clock)

          // 纸箱 / 草丛限时倒计时环，让玩家能读出剩余安全窗口
          const camo = pl.carton
            ? { t: pl.cartonTimer || 0, max: 5, icon: '📦' }
            : pl.hiding
              ? { t: pl.hideTimer || 0, max: 4, icon: '🌿' }
              : null
          if (camo && camo.t > 0) {
            const ratio = Math.max(0, Math.min(1, camo.t / camo.max))
            const col = ratio > 0.55 ? '#80ed99' : ratio > 0.28 ? '#ffbe0b' : '#ff006e'
            ctx.save()
            ctx.lineWidth = 3.6
            ctx.strokeStyle = 'rgba(43,45,66,0.28)'
            ctx.beginPath()
            ctx.arc(p.x, p.y - 4, 19, 0, Math.PI * 2)
            ctx.stroke()
            ctx.strokeStyle = col
            ctx.beginPath()
            ctx.arc(p.x, p.y - 4, 19, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio)
            ctx.stroke()
            ctx.restore()
            pill(`${camo.icon} ${camo.t.toFixed(1)}s`, p.x, p.y - 43, {
              size: 8,
              bg: 'rgba(43,45,66,0.92)',
              fg: '#ffffff',
              border: col,
              lw: 2
            })
          }

          // 大喇叭声波震慑环（Lv11 我当王总）
          if ((pl.hornTimer || 0) > 0) {
            ctx.save()
            ctx.strokeStyle = 'rgba(239,35,60,0.75)'
            ctx.lineWidth = 2.5
            ctx.beginPath()
            ctx.arc(p.x, p.y - 6, 18 + (1 - Math.min(1, pl.hornTimer * 3)) * 28, faceA - 0.85, faceA + 0.85)
            ctx.stroke()
            ctx.restore()
          }

          // 平底锅 / RGB机械键盘 白色挥砍弧光！
          if (swing > 0) {
            ctx.save()
            ctx.translate(p.x, p.y - 6)
            ctx.rotate(faceA)
            ctx.strokeStyle = '#ffffff'
            ctx.lineWidth = 6
            ctx.lineCap = 'round'
            ctx.beginPath()
            ctx.arc(4, 0, 22, -0.95, 0.95)
            ctx.stroke()
            ctx.strokeStyle = pl.weapon === 'keyboard' ? '#00f5d4' : '#ffd166'
            ctx.lineWidth = 2.5
            ctx.stroke()
            if (pl.weapon === 'keyboard') {
              rr(16, 3, 12, 6, 1.5, '#343a40', '#00f5d4', 1.3)
            } else {
              circle(21, 9, 6.5, '#2b2d42', '#ffffff', 1.5)
            }
            ctx.restore()
          }

          // 头顶金色定位小三角标
          if (!pl.hiding) {
            ctx.save()
            ctx.translate(p.x, p.y - (isBossRole ? 46 : 37) + Math.sin(clock * 5) * 1.5)
            ctx.fillStyle = '#ffbe0b'
            ctx.strokeStyle = INK
            ctx.lineWidth = 1.8
            ctx.beginPath()
            ctx.moveTo(-4.5, -4)
            ctx.lineTo(4.5, -4)
            ctx.lineTo(0, 2.8)
            ctx.closePath()
            ctx.fill()
            ctx.stroke()
            ctx.restore()
          }
        }

        // 读条交互进度环
        if (pl.workObj) {
          circle(p.x, p.y - 8, 21, null, 'rgba(43,45,66,0.22)', 4.5)
          ctx.strokeStyle = '#2a9d8f'
          ctx.lineWidth = 4.5
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.arc(p.x, p.y - 8, 21, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (pl.workProgress || 0))
          ctx.stroke()
          ctx.lineCap = 'butt'
        }

        // 玩家随身携带物小图标（螺蛳粉 / 暗黑特调配料 / 降薪协议叠拿 / 年终奖宝箱）
        const docsHeld = pl.carryingContracts || pl.contractsHeld || pl.papers || 0
        const brewCnt = Array.isArray(pl.brewIngredients) ? pl.brewIngredients.length : (pl.brewIngredients || 0)
        if (pl.carryingTakeout) drawPickupSprite({ type: 'takeout' }, p.x + 14, p.y - 20, clock)
        if (brewCnt > 0) pill(`🧪×${brewCnt}`, p.x + 16, p.y - 24, { size: 7.5, bg: '#f3d9fa', avoidOverlap: false })
        if (docsHeld > 0) pill(`📄×${docsHeld}`, p.x + 16, p.y - 24, { size: 7.5, bg: '#fffdf5', avoidOverlap: false })
        if (pl.carryingVault || pl.hasVaultBox || pl.hasBonus) {
          rr(p.x + 7, p.y - 25, 13, 10, 2.5, '#ffd166', INK, 1.5)
        }
        if (pl.hideBlown) pill('被盯着躲不掉!', p.x, p.y - 44, { size: 8, bg: '#ffccd5', fg: '#c1121f' })
        else if (pl.hiding) pill('盆栽隐身中', p.x, p.y - 40, { size: 8, bg: '#d8f3dc', fg: '#2d6a4f' })
      }
    }
  }

  // ================= 11. 拉闸黑夜手电筒光影层（destination-out 柔和镂空） =================
  function cutConeLight(lctx, ox, oy, ang, radius, spread = 0.55) {
    const grad = lctx.createRadialGradient(ox, oy, 6, ox, oy, radius)
    grad.addColorStop(0, 'rgba(0,0,0,1)')
    grad.addColorStop(0.65, 'rgba(0,0,0,0.82)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    lctx.fillStyle = grad
    lctx.beginPath()
    lctx.moveTo(ox, oy)
    lctx.arc(ox, oy, radius, ang - spread, ang + spread)
    lctx.closePath()
    lctx.fill()
  }

  function cutPointLight(lctx, ox, oy, radius, strength = 0.95) {
    const grad = lctx.createRadialGradient(ox, oy, 2, ox, oy, radius)
    grad.addColorStop(0, `rgba(0,0,0,${strength})`)
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    lctx.fillStyle = grad
    lctx.beginPath()
    lctx.arc(ox, oy, radius, 0, Math.PI * 2)
    lctx.fill()
  }

  function drawLighting(a, b) {
    const { game } = sync(a, b)
    if (!game) return

    if (!game.blackout) {
      // 白天/傍晚微缩沙盘边缘暖调暗角润色
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(OX, OY, MAP_SW, MAP_SH, 10)
      ctx.clip()
      const vig = ctx.createRadialGradient(OX + MAP_SW / 2, OY + MAP_SH / 2, MAP_SW * 0.35, OX + MAP_SW / 2, OY + MAP_SH / 2, MAP_SH * 0.65)
      vig.addColorStop(0, 'rgba(255,255,255,0)')
      vig.addColorStop(1, 'rgba(43,45,66,0.06)')
      ctx.fillStyle = vig
      ctx.fillRect(OX, OY, MAP_SW, MAP_SH)
      ctx.restore()
      return
    }

    // 黑夜拉闸手电筒模式（Lv15 等）
    if (!lightCanvas) {
      lightCanvas = document.createElement('canvas')
      lightCanvas.width = MAP_SW
      lightCanvas.height = MAP_SH
      lightCtx = lightCanvas.getContext('2d')
    }
    const lctx = lightCtx
    lctx.globalCompositeOperation = 'source-over'
    lctx.clearRect(0, 0, MAP_SW, MAP_SH)
    lctx.fillStyle = 'rgba(11, 17, 40, 0.86)'
    lctx.fillRect(0, 0, MAP_SW, MAP_SH)

    // destination-out 镂空温暖手电光束与关键设施光圈
    lctx.globalCompositeOperation = 'destination-out'
    if (game.player) {
      const pp = P(game.player.x, game.player.y)
      const lx = pp.x - OX
      const ly = pp.y - OY
      cutPointLight(lctx, lx, ly, 46, 0.96)
      cutConeLight(lctx, lx, ly - 4, A(game.player.angle ?? -Math.PI / 2), 118, 0.52)
    }
    for (const g of game.guards || []) {
      if (g.state === 'stunned') continue
      const gp = P(g.x, g.y)
      cutPointLight(lctx, gp.x - OX, gp.y - OY, 28, 0.8)
      cutConeLight(lctx, gp.x - OX, gp.y - OY, A(g.dirAngle), Math.max(78, (g.viewDist || 120) * S), 0.44)
    }
    for (const o of game.objects || []) {
      if (['elevator_exit', 'elevator', 'power_switch', 'breaker', 'vault_box'].includes(o.type)) {
        const op = P(o.x, o.y)
        cutPointLight(lctx, op.x - OX, op.y - OY, 42, 0.85)
      }
    }

    ctx.save()
    ctx.beginPath()
    ctx.roundRect(OX, OY, MAP_SW, MAP_SH, 10)
    ctx.clip()
    ctx.drawImage(lightCanvas, OX, OY)

    // 叠加玩家手电暖黄色光雾氛围
    if (game.player) {
      const pp = P(game.player.x, game.player.y)
      const fa = A(game.player.angle ?? -Math.PI / 2)
      const beam = ctx.createRadialGradient(pp.x, pp.y - 4, 4, pp.x, pp.y - 4, 110)
      beam.addColorStop(0, 'rgba(255,230,140,0.22)')
      beam.addColorStop(1, 'rgba(255,230,140,0)')
      ctx.fillStyle = beam
      ctx.beginPath()
      ctx.moveTo(pp.x, pp.y - 4)
      ctx.arc(pp.x, pp.y - 4, 110, fa - 0.5, fa + 0.5)
      ctx.closePath()
      ctx.fill()
    }
    ctx.restore()
  }

  // ================= 12. 角色头顶漫画台词气泡 =================
  function drawThoughts(a, b, thoughtSeenArg) {
    const { game, clock } = sync(a, b)
    if (!game) return
    const seen = thoughtSeenArg instanceof Map ? thoughtSeenArg : localThoughtSeen

    for (const g of game.guards || []) {
      if (!g.thought) continue
      const rec = seen.get(g.id)
      if (!rec || rec.text !== g.thought) seen.set(g.id, { text: g.thought, at: clock })
      const age = clock - seen.get(g.id).at
      if (age > 2.8 && g.state !== 'chase') continue

      const p = P(g.x, g.y)
      const lines = wrapLines(g.thought, 148, 8.8).slice(0, 2)
      if (lines.length === 0) continue
      ctx.font = FONT(8.8)
      const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 14
      const h = lines.length * 12 + 8
      const bx = Math.max(OX + 3, Math.min(OX + MAP_SW - w - 3, p.x - w / 2))
      const by = Math.max(OY + 3, p.y - 58 - h)
      const hot = g.state === 'chase' || g.state === 'stunned' || g.state === 'slipping'

      ctx.save()
      ctx.globalAlpha = age > 2.4 && g.state !== 'chase' ? Math.max(0, (2.8 - age) / 0.4) : 1
      rr(bx, by, w, h, 9, hot ? '#ffe5ec' : '#fffdf5', INK, 1.9)
      ctx.fillStyle = hot ? '#ffe5ec' : '#fffdf5'
      const tx = Math.max(bx + 8, Math.min(bx + w - 8, p.x))
      ctx.beginPath()
      ctx.moveTo(tx - 4.5, by + h - 1)
      ctx.lineTo(tx + 4.5, by + h - 1)
      ctx.lineTo(tx, by + h + 6.5)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = INK
      ctx.lineWidth = 1.9
      ctx.beginPath()
      ctx.moveTo(tx - 4.5, by + h)
      ctx.lineTo(tx, by + h + 6.5)
      ctx.lineTo(tx + 4.5, by + h)
      ctx.stroke()
      lines.forEach((l, i) => text(l, bx + 7, by + 14 + i * 12, { size: 8.8, color: hot ? '#c1121f' : INK }))
      ctx.restore()
    }
  }

  return {
    drawBackdrop,
    drawFloor,
    drawCones,
    drawWalls,
    drawZoneLabels,
    drawFloorFx,
    drawProps,
    drawFocusOverlay,
    drawCharacters,
    drawProjectilesAndExtras,
    drawLighting,
    drawThoughts,
    drawChibi,
    setBossProfile,
    getBossProfile: () => ({ ...bossProfile }),
    LOOKS
  }
}

import {
  createStealthGame,
  COLS,
  ROWS,
  TILE,
  MAP_X,
  MAP_Y,
  CHAPTERS,
  TOTAL_LEVELS,
  LEVEL_CONFIGS,
  cellCenter
} from './stealthGame.js'
import { createOfficeRenderer } from './officeRenderer.js'
import { createBgmController } from './bgm.js'
import { createBossCustomizer } from './bossCustomizer.js'
import './style.css'

// ================= 竖屏手机画布 (390 x 844) =================
const VW = 390
const VH = 844
const T = 28 // 屏幕上每格像素
const S = T / TILE
const OX = Math.round((VW - ROWS * T) / 2) // 地图左上角 X (13)
const OY = 84 // 地图左上角 Y
const MAP_SW = ROWS * T // 364
const MAP_SH = COLS * T // 504

const INK = '#2b2d42'
const FONT = (size, w = 900) =>
  `${w} ${size}px "PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif`

// 世界(横版) -> 屏幕(竖版)：沿对角线转置
const P = (x, y) => ({ x: OX + (y - MAP_Y) * S, y: OY + (x - MAP_X) * S })
const toWorld = (sx, sy) => ({ x: MAP_X + (sy - OY) / S, y: MAP_Y + (sx - OX) / S })
const A = a => Math.PI / 2 - a
const tileRect = (c, r) => ({ x: OX + r * T, y: OY + c * T })

// 玩法模式配色与操作指引元数据
const MODE_META = {
  stealth: {
    color: '#2a9d8f',
    bg: '#d8f3dc',
    icon: '🕵️',
    ctrl: '🕹️ 摇杆潜行(推到底冲刺) · 点地图自动寻路 · 📦纸箱站定隐身',
    ctrlShort: '摇杆移动 · 点地寻路 · 纸箱限时隐身'
  },
  prank_hunt: {
    color: '#f77f00',
    bg: '#ffe8cc',
    icon: '🤡',
    ctrl: '🕹️ 主动设局坑王总！靠近风扇/转椅/保温杯点右下大按钮整蛊',
    ctrlShort: '靠近机关点大按钮 · 风扇/转椅/保温杯'
  },
  chair_derby: {
    color: '#e63946',
    bg: '#ffe3e3',
    icon: '🏎️',
    ctrl: '🕹️ 摇杆漂移飙椅！点【🚀氮气冲撞】无敌加速撞碎目标与拦路保安',
    ctrlShort: '漂移撞目标 · 点氮气无敌冲撞'
  },
  pot_pong: {
    color: '#d90429',
    bg: '#ffd6e0',
    icon: '🍳',
    ctrl: '🕹️ 正面硬刚不用躲！看准飞来的黑锅点【🏏反拍黑锅】轰回王总脸上',
    ctrlShort: '看准黑锅点反拍 · 不用躲'
  },
  wake_coworkers: {
    color: '#0077b6',
    bg: '#caf0f8',
    icon: '⏰',
    ctrl: '🕹️ 盯紧冒瞌睡泡的队友，赶在王总抓包前冲过去点【👋拍醒队友】',
    ctrlShort: '冲向瞌睡队友点拍醒'
  },
  be_the_boss: {
    color: '#9d4edd',
    bg: '#f3d9fa',
    icon: '👑',
    ctrl: '🕹️ 今天你当王总！寻找微微发抖的纸箱/盆栽/隔间点【📣揪出摸鱼】',
    ctrlShort: '点可疑纸箱/盆栽/隔间揪人'
  },
  desk_defense: {
    color: '#7209b7',
    bg: '#ede2ff',
    icon: '🛡️',
    ctrl: '🕹️ 死守18:00下班线！用【⌨️键盘拍飞】、踢转椅或泼☕冰美式清场',
    ctrlShort: '键盘拍飞 · 踢椅 · 泼咖啡清场'
  },
  shredder_race: {
    color: '#e85d04',
    bg: '#ffe5d9',
    icon: '🗑️',
    ctrl: '🕹️ 抢在HR前抱起降薪协议(可叠拿)，冲到碎纸机点【📄塞碎纸机】',
    ctrlShort: '抱协议冲碎纸机 · 可叠拿3份'
  },
  vault_heist: {
    color: '#c98a00',
    bg: '#fff3b0',
    icon: '💎',
    ctrl: '🕹️ 将办公椅推上3块发光重力板解锁金库，抱走宝箱冲进电梯',
    ctrlShort: '推椅压3块板 · 抱宝箱进电梯'
  },
  blackout_escape: {
    color: '#3a0ca3',
    bg: '#e0fbfc',
    icon: '🌑',
    ctrl: '🕹️ 拉断3处配电闸触发全司大停电，借夜色躲开手电光束溜进电梯',
    ctrlShort: '拉3处电闸 · 借黑摸进电梯'
  },
  final_boss: {
    color: '#ff006e',
    bg: '#ffe5ec',
    icon: '🔥',
    ctrl: '🕹️ 三阶段总决战！反拍黑锅+躲大饼+引Boss撞碎纸机，空血贴解雇信',
    ctrlShort: '反拍黑锅 · 引Boss撞碎纸机'
  }
}

const LAYOUT_NAMES = {
  classic: '经典综合办公区',
  open_arena: '开放飙椅赛道厅',
  conference: '全员洗脑大会堂',
  cubicle_maze: '高密工位迷宫阵',
  vault_floor: '总裁金库核心层'
}

// 触控热区定义
const JOY = { x: 92, y: 752, r: 62 }
const BTN = {
  interact: { x: 316, y: 750, r: 46 },
  secondary: { x: 226, y: 698, r: 28 },
  item0: { x: 212, y: 774, r: 26 },
  item1: { x: 266, y: 816, r: 22 },
  music: { x: 284, y: 23, r: 16 },
  retry: { x: 322, y: 23, r: 16 },
  hint: { x: 360, y: 23, r: 16 }
}
const TOP_MENU_RECT = { x: 8, y: 6, w: 254, h: 34 }
const INTRO_BOSS_BTN = { x: 196, y: 43, w: 66, h: 30 }
const INTRO_AVATAR_BTN = { x: 20, y: 330, w: 60, h: 80 }
const INTRO_MUSIC_BTN = { x: 351, y: 58, r: 15 }
const TASK_BAR_RECT = { x: 8, y: OY + MAP_SH + 8, w: 240, h: 26 }

// 选关弹窗与结算弹窗按钮热区
const INTRO_TABS = CHAPTERS.map((ch, i) => ({
  id: ch.id,
  x: 24 + i * 69,
  y: 102,
  w: 65,
  h: 42
}))
const INTRO_PREV = { x: 24, y: 734, w: 46, h: 52 }
const INTRO_START = { x: 78, y: 732, w: 234, h: 56 }
const INTRO_NEXT = { x: 320, y: 734, w: 46, h: 52 }

const END_MENU = { x: 34, y: 586, w: 92, h: 48 }
const END_RETRY = { x: 134, y: 586, w: 92, h: 48 }
const END_NEXT = { x: 234, y: 586, w: 122, h: 48 }

const inCircle = (px, py, b, pad = 6) => Math.hypot(px - b.x, py - b.y) <= b.r + pad
const inRect = (p, r, pad = 0) =>
  p.x >= r.x - pad && p.x <= r.x + r.w + pad && p.y >= r.y - pad && p.y <= r.y + r.h + pad

function getIntroLevelCards(chapId) {
  const chap = CHAPTERS.find(c => c.id === chapId) || CHAPTERS[0]
  const n = chap.levels.length
  const gap = 6
  const totalW = 342
  const cw = Math.floor((totalW - (n - 1) * gap) / n)
  const startX = Math.round((VW - (cw * n + gap * (n - 1))) / 2)
  return chap.levels.map((lvl, idx) => ({
    lvl,
    x: startX + idx * (cw + gap),
    y: 170,
    w: cw,
    h: 82
  }))
}

function getIntroQuickDots() {
  const startX = 31
  const step = 21.8
  return Array.from({ length: TOTAL_LEVELS }, (_, i) => ({
    lvl: i + 1,
    x: Math.round(startX + i * step),
    y: 710,
    r: 8
  }))
}

document.querySelector('#app').innerHTML =
  '<canvas aria-label="牛马求生记：反坑大老板（16关多元职场动作整蛊小游戏）"></canvas>'
const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')

const renderer = createOfficeRenderer(ctx, {
  VW,
  VH,
  T,
  S,
  OX,
  OY,
  MAP_SW,
  MAP_SH,
  INK,
  FONT,
  P,
  A,
  tileRect,
  cellCenter
})

function resize() {
  const d = Math.min(window.devicePixelRatio || 1, 3)
  const rect = canvas.getBoundingClientRect()
  const scale = Math.max(1, (rect.width || VW) / VW) * d
  canvas.width = Math.round(VW * scale)
  canvas.height = Math.round(VH * scale)
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
}
window.addEventListener('resize', () => requestAnimationFrame(resize))

// ================= 游戏运行状态 & 星级存档 =================
function loadSavedStars() {
  try {
    const v2 = JSON.parse(localStorage.getItem('niuma_stars_v2') || 'null')
    if (v2 && typeof v2 === 'object') return v2
    const v1 = JSON.parse(localStorage.getItem('niuma_stars') || '{}')
    return v1 && typeof v1 === 'object' ? { ...v1 } : {}
  } catch {
    return {}
  }
}
function saveStars(map) {
  try {
    localStorage.setItem('niuma_stars_v2', JSON.stringify(map))
  } catch {}
}

// 首次触发式教学：只提示一次，存在本地，不打断游戏
const TUTORIAL_KEY = 'niuma_tutorial_seen_v5'
const TUTORIAL_TIPS = {
  move: {
    icon: '🕹️',
    color: '#3a86ff',
    text: '摇杆移动，点地图自动寻路；右下大按钮互动。'
  },
  carton: {
    icon: '📦',
    color: '#dda15e',
    text: '纸箱只撑 5 秒，站定才隐身；被老板正面盯上会识破。'
  },
  hide: {
    icon: '🌿',
    color: '#2a9d8f',
    text: '草丛能躲 4 秒，超时会露馅；先甩开视线再钻。'
  },
  coffee: {
    icon: '☕',
    color: '#8338ec',
    text: '冰美式 4.5 秒加速 + 无限体力，适合冲刺窗口。'
  },
  soap: {
    icon: '🧼',
    color: '#0096c7',
    text: '洗洁精水滩 12 秒，引敌人踩上去滑飞。'
  },
  frog: {
    icon: '🐸',
    color: '#f77f00',
    text: '发条青蛙叫 5 秒，把巡逻引到别处。'
  },
  spotted: {
    icon: '🚨',
    color: '#ff006e',
    text: '被发现别慌：绕墙、钻掩体，或踢转椅反杀。'
  }
}

function loadTutorialSeen() {
  try {
    const raw = JSON.parse(localStorage.getItem(TUTORIAL_KEY) || '{}')
    return raw && typeof raw === 'object' ? raw : {}
  } catch {
    return {}
  }
}
function saveTutorialSeen() {
  try {
    localStorage.setItem(TUTORIAL_KEY, JSON.stringify(tutorialSeen))
  } catch {}
}
const tutorialSeen = loadTutorialSeen()
let tutorialQueue = []
let tutorialActive = null
let tutorialTimer = 0

function queueTutorial(key) {
  const tip = TUTORIAL_TIPS[key]
  if (!tip || tutorialSeen[key]) return
  if (tutorialActive?.key === key) return
  if (tutorialQueue.some(t => t.key === key)) return
  tutorialQueue.push({ key, ...tip })
  if (tutorialQueue.length > 3) tutorialQueue.shift()
}

function updateTutorial(dt) {
  if (tutorialActive) {
    tutorialTimer -= dt
    if (tutorialTimer <= 0) tutorialActive = null
  }
  if (!tutorialActive && tutorialQueue.length > 0) {
    tutorialActive = tutorialQueue.shift()
    tutorialTimer = 8
    tutorialSeen[tutorialActive.key] = true
    saveTutorialSeen()
  }
}

const bgm = createBgmController()

let level = 1
let introChapter = 1
let game = createStealthGame(level)
const bossEditor = createBossCustomizer({
  onUpdate(prof) {
    renderer.setBossProfile(prof)
    bossEditor.applyToGame(game)
  }
})
renderer.setBossProfile(bossEditor.getProfile())
bossEditor.applyToGame(game)
let phase = 'intro'
let lastTime = 0
let clock = 0
let soundOn = true
let audio = null
let floats = []
let particles = []
let bursts = []
let footprints = []
let footTimer = 0
let showHint = false
let slowTimer = 0
let shake = 0
let flash = 0
let endAt = 0
let bannerTimer = 0
let playElapsed = 0
let spotlightTimer = 0
let spotlightMax = 3.2
let spotlightKind = 'opening' // 'opening' | 'shift' | 'manual'
let spotlightHold = false
let lastTargetKey = ''
const bests = loadSavedStars()
const thoughtSeen = new Map()
const keys = { up: false, down: false, left: false, right: false, sprint: false }
const joy = { id: null, dx: 0, dy: 0, mag: 0 }
const pressed = new Map() // pointerId -> button name

function syncBgmTrack() {
  bgm.setLevelTrack(level, false)
  if (phase !== 'play' || game?.gameState !== 'playing') {
    bgm.setUrgency(0)
  }
}

function toggleSound() {
  soundOn = bgm.toggle()
  syncBgmTrack()
  if (soundOn) sfx('tap')
}

// 移动端 iOS Safari / Android 首次触摸立即解锁音频与背景音乐
for (const evName of ['touchstart', 'touchend', 'pointerdown', 'keydown']) {
  window.addEventListener(
    evName,
    () => {
      audio = bgm.unlock()
      syncBgmTrack()
    },
    { passive: true }
  )
}

function getTargetKey(t) {
  if (!t) return ''
  return `${t.id || t.type || t.role || 'target'}_${Math.round(t.col ?? t.x ?? 0)}_${Math.round(t.row ?? t.y ?? 0)}`
}

function triggerSpotlight(kind = 'opening') {
  spotlightKind = kind
  if (kind === 'opening') {
    spotlightMax = 3.2
    spotlightTimer = 3.2
    spotlightHold = true
  } else if (kind === 'manual') {
    spotlightMax = 2.4
    spotlightTimer = 2.4
    spotlightHold = false
  } else {
    spotlightMax = 1.65
    spotlightTimer = 1.65
    spotlightHold = false
  }
  lastTargetKey = getTargetKey(game.currentTarget)
}

const totalStarsEarned = () => {
  let sum = 0
  for (let i = 1; i <= TOTAL_LEVELS; i++) sum += bests[i] || 0
  return sum
}

// 三星条件：与 stealthGame.snapshot() 的星级判定保持一致，并让玩家看得见
const ACTION_STAR_MODES = ['pot_pong', 'chair_derby', 'be_the_boss', 'shredder_race', 'final_boss']
const GUARD_STAR_MODES = ['wake_coworkers', 'desk_defense']

function getStarPlan(cfg) {
  if (ACTION_STAR_MODES.includes(cfg.mode)) {
    return [
      { label: '通关本关' },
      { label: '失误 / 被发现 ≤ 1 次' },
      { label: `${cfg.parTime}s 内通关 或 整蛊 ≥ 3 次` }
    ]
  }
  if (GUARD_STAR_MODES.includes(cfg.mode)) {
    return [
      { label: '通关本关' },
      { label: '零失误 / 零被发现' },
      { label: '整蛊 ≥ 1 次 或 工位满耐久' }
    ]
  }
  return [
    { label: '通关本关' },
    { label: '零失误 / 零被发现' },
    { label: '整蛊 ≥ 1 次' }
  ]
}

function getStarAchieved(s, cfg) {
  const fast = cfg.timeLimit - s.timeLeft <= cfg.parTime
  if (ACTION_STAR_MODES.includes(cfg.mode)) {
    return [s.gameState === 'won', s.spottedCount <= 1, fast || s.bossPranked >= 3]
  }
  if (GUARD_STAR_MODES.includes(cfg.mode)) {
    return [
      s.gameState === 'won',
      s.spottedCount === 0,
      s.bossPranked > 0 || (s.deskMaxHp > 0 && s.deskHp === s.deskMaxHp)
    ]
  }
  return [s.gameState === 'won', s.spottedCount === 0, s.bossPranked > 0]
}

// ================= WebAudio 合成音效 & 震动反馈 =================
function tone(type, f1, f2, dur, vol, delay = 0) {
  const o = audio.createOscillator()
  const g = audio.createGain()
  const t = audio.currentTime + delay
  o.type = type
  o.frequency.setValueAtTime(Math.max(20, f1), t)
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur)
  g.gain.setValueAtTime(vol, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + dur)
  o.connect(g).connect(audio.destination)
  o.start(t)
  o.stop(t + dur + 0.02)
}

function sfx(kind) {
  if (!soundOn) return
  try {
    audio = bgm.unlock() || audio || new (window.AudioContext || window.webkitAudioContext)()
    audio.resume?.()
    if (['success', 'grand_win', 'lose', 'wig_off'].includes(kind)) bgm.duck(1.0)
    if (kind === 'success') {
      tone('triangle', 523, 523, 0.1, 0.09)
      tone('triangle', 659, 659, 0.1, 0.09, 0.09)
      tone('triangle', 784, 1046, 0.26, 0.1, 0.18)
    } else if (kind === 'grand_win') {
      tone('triangle', 523, 523, 0.11, 0.1)
      tone('triangle', 659, 659, 0.11, 0.1, 0.1)
      tone('triangle', 784, 784, 0.11, 0.1, 0.2)
      tone('triangle', 1046, 1318, 0.42, 0.12, 0.31)
      tone('sine', 784, 1046, 0.4, 0.08, 0.33)
    } else if (kind === 'reflect_hit') {
      // 清脆平底锅/机械键盘金属反抽重击 "哐当—啪！"
      tone('triangle', 920, 1580, 0.11, 0.12)
      tone('square', 480, 960, 0.08, 0.08, 0.02)
      tone('sawtooth', 195, 52, 0.22, 0.11, 0.04)
    } else if (kind === 'wig_off') {
      // 滑稽滑音吹飞假发 + 咔嚓快门闪光连拍
      tone('sine', 330, 1420, 0.18, 0.1)
      tone('square', 1850, 680, 0.045, 0.09, 0.17)
      tone('square', 2100, 760, 0.05, 0.09, 0.24)
    } else if (kind === 'shred') {
      // 高速碎纸机咬齿咔嚓粉碎音
      tone('sawtooth', 460, 175, 0.07, 0.09)
      tone('sawtooth', 580, 210, 0.07, 0.09, 0.055)
      tone('sawtooth', 660, 240, 0.08, 0.09, 0.11)
      tone('square', 880, 320, 0.09, 0.06, 0.16)
    } else if (kind === 'smash') {
      // 氮气狂飙撞碎合同山/投影仪爆裂音
      tone('sawtooth', 185, 38, 0.28, 0.13)
      tone('square', 740, 180, 0.13, 0.09, 0.02)
      tone('triangle', 1120, 340, 0.1, 0.07, 0.06)
    } else if (kind === 'catch_slacker') {
      // 王总大喇叭震慑抓包音效
      tone('square', 587, 880, 0.09, 0.09)
      tone('sawtooth', 880, 1175, 0.18, 0.09, 0.08)
    } else if (kind === 'prank') {
      tone('square', 220, 880, 0.1, 0.08)
      tone('sawtooth', 700, 80, 0.32, 0.08, 0.08)
    } else if (kind === 'warn') {
      tone('square', 988, 988, 0.07, 0.06)
      tone('square', 740, 740, 0.12, 0.06, 0.09)
    } else if (kind === 'boom') {
      tone('sawtooth', 160, 40, 0.32, 0.12)
    } else if (kind === 'lose') {
      tone('triangle', 392, 330, 0.18, 0.09)
      tone('triangle', 330, 165, 0.4, 0.09, 0.18)
    } else if (kind === 'tap') {
      tone('sine', 660, 880, 0.06, 0.05)
    } else {
      tone('sine', 520, 900, 0.1, 0.06)
    }
  } catch {}
}

const buzz = ms => {
  try {
    navigator.vibrate?.(ms)
  } catch {}
}

// ================= 事件消费 -> 粒子 & 漫画拟声爆炸字 =================
function spawn(x, y, colors, count = 14, speed = 90) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2
    const s = speed * (0.4 + Math.random())
    particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - 32,
      color: colors[i % colors.length],
      size: 2 + Math.random() * 3.2,
      life: 0.6 + Math.random() * 0.32,
      max: 0.92,
      star: Math.random() < 0.34,
      paper: false
    })
  }
}

function spawnPaper(x, y, count = 20) {
  const cols = ['#ffffff', '#fff3b0', '#ffd166', '#caf0f8']
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2
    const s = 60 + Math.random() * 110
    particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - 55,
      color: cols[i % cols.length],
      size: 3.5 + Math.random() * 2.5,
      life: 0.75 + Math.random() * 0.35,
      max: 1.1,
      star: false,
      paper: true,
      rot: Math.random() * Math.PI
    })
  }
}

function consumeEvents() {
  while (game.events.length > 0) {
    const ev = game.events.shift()
    if (ev.type === 'loot') {
      if (ev.text.includes('洗洁精')) queueTutorial('soap')
      if (ev.text.includes('冰美式')) queueTutorial('coffee')
      if (ev.text.includes('发条青蛙')) queueTutorial('frog')
    }
    const sp = P(ev.x, ev.y + 18)
    const colors = {
      prank: '#e63946',
      reflect_hit: '#d90429',
      wig_off: '#ff006e',
      shred: '#0077b6',
      smash: '#fb5607',
      catch_slacker: '#9d4edd',
      success: '#2a9d8f',
      warn: '#d62828',
      lure: '#f77f00',
      boom: '#f77f00',
      loot: '#d48c00',
      chair: '#3a86ff',
      soap: '#0096c7',
      buff: '#8338ec',
      info: INK
    }
    const isBig = ['prank', 'reflect_hit', 'wig_off', 'shred', 'smash', 'catch_slacker'].includes(
      ev.type
    )
    floats.push({
      text: ev.text,
      x: sp.x,
      y: sp.y - 28,
      color: colors[ev.type] || INK,
      life: 1.85,
      max: 1.85,
      big: isBig
    })

    if (ev.type === 'reflect_hit') {
      sfx('reflect_hit')
      buzz([25, 20, 45])
      spawn(sp.x, sp.y, ['#ffbe0b', '#ff006e', '#fb5607', '#ffffff'], 26, 135)
      bursts.push({
        x: sp.x,
        y: sp.y - 12,
        text: '啪！反杀！',
        bg: '#ffbe0b',
        fg: '#d90429',
        life: 0.85,
        max: 0.85
      })
      slowTimer = 0.16
      shake = 0.32
    } else if (ev.type === 'wig_off') {
      sfx('wig_off')
      buzz([40, 30, 70])
      spawn(sp.x, sp.y, ['#ff006e', '#ffd166', '#00bbf9', '#ffffff'], 32, 145)
      bursts.push({
        x: sp.x,
        y: sp.y - 14,
        text: '秃啦！！',
        bg: '#ff006e',
        fg: '#ffffff',
        life: 0.95,
        max: 0.95
      })
      slowTimer = 0.42
      shake = 0.36
      flash = 0.22
    } else if (ev.type === 'shred') {
      sfx('shred')
      buzz([20, 15, 20, 15, 35])
      spawnPaper(sp.x, sp.y, 24)
      bursts.push({
        x: sp.x,
        y: sp.y - 12,
        text: '咔嚓粉碎！',
        bg: '#00bbf9',
        fg: '#ffffff',
        life: 0.85,
        max: 0.85
      })
      shake = 0.26
    } else if (ev.type === 'smash') {
      sfx('smash')
      buzz([35, 20, 50])
      spawnPaper(sp.x, sp.y, 16)
      spawn(sp.x, sp.y, ['#fb5607', '#ffbe0b', '#00bbf9', '#ffffff'], 20, 135)
      bursts.push({
        x: sp.x,
        y: sp.y - 12,
        text: '咔嚓撞碎！',
        bg: '#fb5607',
        fg: '#ffffff',
        life: 0.82,
        max: 0.82
      })
      slowTimer = 0.1
      shake = 0.34
    } else if (ev.type === 'catch_slacker') {
      sfx('catch_slacker')
      buzz([30, 20, 40])
      spawn(sp.x, sp.y, ['#9d4edd', '#ffbe0b', '#ff006e', '#ffffff'], 24, 115)
      bursts.push({
        x: sp.x,
        y: sp.y - 12,
        text: '抓到摸鱼！',
        bg: '#9d4edd',
        fg: '#ffffff',
        life: 0.85,
        max: 0.85
      })
      shake = 0.22
    } else if (ev.type === 'prank') {
      sfx('prank')
      buzz([40, 30, 60])
      spawn(sp.x, sp.y, ['#ffbe0b', '#fb5607', '#ff006e', '#ffffff'], 26, 120)
      bursts.push({
        x: sp.x,
        y: sp.y - 10,
        text: ['啪叽!', '咚!!', '嘭!', '哎哟!'][Math.floor(Math.random() * 4)],
        bg: '#ffbe0b',
        fg: '#ff006e',
        life: 0.8,
        max: 0.8
      })
      slowTimer = 0.38
      shake = 0.34
    } else if (ev.type === 'success') {
      sfx('success')
      buzz(30)
      spawn(sp.x, sp.y, ['#80ed99', '#ffd166', '#ffffff'], 20, 100)
    } else if (ev.type === 'warn') {
      sfx('warn')
      buzz(80)
      flash = 0.28
    } else if (ev.type === 'boom') {
      sfx('boom')
      shake = 0.3
      bursts.push({
        x: sp.x,
        y: sp.y - 10,
        text: '叮!砰!!',
        bg: '#ffbe0b',
        fg: '#ff006e',
        life: 0.8,
        max: 0.8
      })
      spawn(sp.x, sp.y, ['#fff1a8', '#ffffff', '#ff9f1c'], 22, 110)
    } else {
      sfx('loot')
    }
  }
}

// ================= 关卡切换与流程控制 =================
function loadLevel(lvl = level, skipIntro = false) {
  const clamped = Math.max(1, Math.min(TOTAL_LEVELS, Number(lvl) || 1))
  level = clamped
  game = createStealthGame(level)
  bossEditor.applyToGame(game)
  introChapter = game.cfg.chapter || 1
  phase = skipIntro ? 'play' : 'intro'
  floats = []
  particles = []
  bursts = []
  footprints = []
  thoughtSeen.clear()
  showHint = false
  endAt = 0
  playElapsed = 0
  bannerTimer = skipIntro ? 2.4 : 0
  if (skipIntro) triggerSpotlight('opening')
  else {
    spotlightTimer = 0
    spotlightHold = false
  }
  syncBgmTrack()
}

function openLevelSelect() {
  introChapter = game.cfg.chapter || 1
  phase = 'intro'
  showHint = false
  spotlightTimer = 0
  spotlightHold = false
  syncBgmTrack()
  sfx('tap')
}

function startPlay() {
  if (phase === 'intro') {
    phase = 'play'
    playElapsed = 0
    bannerTimer = 2.2
    triggerSpotlight('opening')
    syncBgmTrack()
    queueTutorial('move')
    sfx('tap')
  }
}

// ================= 输入：键盘控制 =================
window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase()
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'tab'].includes(k)) {
    e.preventDefault()
  }
  if (k === 'arrowup' || k === 'w') keys.up = true
  if (k === 'arrowdown' || k === 's') keys.down = true
  if (k === 'arrowleft' || k === 'a') keys.left = true
  if (k === 'arrowright' || k === 'd') keys.right = true
  if (e.key === 'Shift') keys.sprint = true

  if (phase === 'intro') {
    if (k >= '1' && k <= '9') {
      loadLevel(Number(k), false)
      sfx('tap')
    } else if (k === '0') {
      loadLevel(10, false)
      sfx('tap')
    } else if (k === 'arrowleft' || k === 'a') {
      loadLevel(level > 1 ? level - 1 : TOTAL_LEVELS, false)
      sfx('tap')
    } else if (k === 'arrowright' || k === 'd') {
      loadLevel(level < TOTAL_LEVELS ? level + 1 : 1, false)
      sfx('tap')
    } else if (k === '[' || k === 'arrowup' || k === 'w') {
      const nextCh = introChapter > 1 ? introChapter - 1 : CHAPTERS.length
      introChapter = nextCh
      const ch = CHAPTERS.find(c => c.id === nextCh)
      if (ch) loadLevel(ch.levels[0], false)
      sfx('tap')
    } else if (k === ']' || k === 'tab' || k === 'arrowdown' || k === 's') {
      const nextCh = introChapter < CHAPTERS.length ? introChapter + 1 : 1
      introChapter = nextCh
      const ch = CHAPTERS.find(c => c.id === nextCh)
      if (ch) loadLevel(ch.levels[0], false)
      sfx('tap')
    } else if (k === ' ' || k === 'enter' || k === 'e') {
      startPlay()
    }
    return
  }

  if (k === 'escape' || k === 'm') {
    openLevelSelect()
    return
  }

  if (game.gameState !== 'playing') {
    if (k === 'n' && game.gameState === 'won' && level < TOTAL_LEVELS) {
      loadLevel(level + 1, true)
      sfx('tap')
    } else if (k === ' ' || k === 'enter') {
      if (game.gameState === 'won' && level < TOTAL_LEVELS) loadLevel(level + 1, true)
      else loadLevel(level, true)
      sfx('tap')
    } else if (k === 'r') {
      loadLevel(level, true)
      sfx('tap')
    }
    return
  }

  if (k === 'e' || k === ' ') game.interactNearest()
  if (k === 'c' || k === 'j') game.triggerSecondaryAction()
  if (k === 'q' || k === '1') game.useInventoryItem(0)
  if (k === '2') game.useInventoryItem(1)
  if (k === 'h') showHint = !showHint
  if (k === 'r') loadLevel(level, true)
})

window.addEventListener('keyup', e => {
  const k = e.key.toLowerCase()
  if (k === 'arrowup' || k === 'w') keys.up = false
  if (k === 'arrowdown' || k === 's') keys.down = false
  if (k === 'arrowleft' || k === 'a') keys.left = false
  if (k === 'arrowright' || k === 'd') keys.right = false
  if (e.key === 'Shift') keys.sprint = false
})

// ================= 输入：触控与鼠标 =================
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect()
  return {
    x: ((e.clientX - r.left) * VW) / (r.width || VW),
    y: ((e.clientY - r.top) * VH) / (r.height || VH)
  }
}

canvas.addEventListener('pointerdown', e => {
  e.preventDefault()
  canvas.setPointerCapture?.(e.pointerId)
  const p = canvasPoint(e)
  audio = bgm.unlock() || audio
  syncBgmTrack()

  // 0) 捏老板工坊弹窗优先响应点击
  if (bossEditor.handlePointerDown(p, () => sfx('tap'))) {
    buzz(10)
    return
  }

  // 1) 选关弹窗交互（定制老板 + 5大章节Tab + 当前章关卡卡 + 16关速跳点 + 左右翻关 + 音乐开关 + 立刻开工）
  if (phase === 'intro') {
    if (inRect(p, INTRO_BOSS_BTN, 4) || inRect(p, INTRO_AVATAR_BTN, 4)) {
      bossEditor.openModal()
      sfx('tap')
      buzz(10)
      return
    }
    if (inCircle(p.x, p.y, INTRO_MUSIC_BTN, 5)) {
      toggleSound()
      buzz(10)
      return
    }
    const tabHit = INTRO_TABS.find(tb => inRect(p, tb, 2))
    if (tabHit) {
      introChapter = tabHit.id
      const ch = CHAPTERS.find(c => c.id === tabHit.id)
      if (ch && !ch.levels.includes(level)) loadLevel(ch.levels[0], false)
      sfx('tap')
      buzz(10)
      return
    }
    const cards = getIntroLevelCards(introChapter)
    const cardHit = cards.find(cd => inRect(p, cd, 2))
    if (cardHit) {
      if (cardHit.lvl !== level) loadLevel(cardHit.lvl, false)
      sfx('tap')
      buzz(10)
      return
    }
    const dotHit = getIntroQuickDots().find(dt => Math.hypot(p.x - dt.x, p.y - dt.y) <= dt.r + 3)
    if (dotHit) {
      loadLevel(dotHit.lvl, false)
      sfx('tap')
      return
    }
    if (inRect(p, INTRO_PREV, 4)) {
      loadLevel(level > 1 ? level - 1 : TOTAL_LEVELS, false)
      sfx('tap')
      return
    }
    if (inRect(p, INTRO_NEXT, 4)) {
      loadLevel(level < TOTAL_LEVELS ? level + 1 : 1, false)
      sfx('tap')
      return
    }
    if (inRect(p, INTRO_START, 6)) {
      startPlay()
      return
    }
    return
  }

  // 2) 顶部按钮（音乐开关 / 重试 / 锦囊 / 点击关卡栏打开16关选关面板）
  if (inCircle(p.x, p.y, BTN.music, 4)) {
    toggleSound()
    buzz(10)
    return
  }
  if (inCircle(p.x, p.y, BTN.retry, 4)) {
    sfx('tap')
    return loadLevel(level, true)
  }
  if (inCircle(p.x, p.y, BTN.hint, 4)) {
    sfx('tap')
    showHint = !showHint
    if (!showHint) triggerSpotlight('manual')
    return
  }
  if (inRect(p, TOP_MENU_RECT, 2)) {
    openLevelSelect()
    return
  }

  // 3) 结算卡交互（选关 / 重玩 / 一键下一关 1->16）
  if (game.gameState !== 'playing') {
    if (clock - endAt < 0.38) return
    if (inRect(p, END_MENU, 5)) {
      openLevelSelect()
      return
    }
    if (inRect(p, END_RETRY, 5)) {
      sfx('tap')
      loadLevel(level, true)
      return
    }
    if (inRect(p, END_NEXT, 6)) {
      sfx('tap')
      if (game.gameState === 'won' && level < TOTAL_LEVELS) {
        loadLevel(level + 1, true)
      } else {
        loadLevel(level, true)
      }
      return
    }
    return
  }

  // 点击地图下方【🎯目标胶囊】随时重新点亮聚光灯指路！
  if (inRect(p, TASK_BAR_RECT, 3)) {
    sfx('tap')
    buzz(10)
    triggerSpotlight('manual')
    return
  }

  if (showHint && p.y < 640) {
    showHint = false
    triggerSpotlight('manual')
    return
  }

  // 玩家开始操作摇杆或点地图时，若处于开局聚光灯定格则立即丝滑放行！
  if (spotlightHold && spotlightMax - spotlightTimer > 0.25) {
    spotlightHold = false
    spotlightTimer = Math.min(spotlightTimer, 0.55)
  }

  // 4) 虚拟摇杆
  if (Math.hypot(p.x - JOY.x, p.y - JOY.y) <= JOY.r + 38 && joy.id === null) {
    joy.id = e.pointerId
    updateJoy(p)
    return
  }

  // 5) 右下多模式技能盘按钮
  for (const name of ['interact', 'secondary', 'item0', 'item1']) {
    if (inCircle(p.x, p.y, BTN[name])) {
      pressed.set(e.pointerId, name)
      sfx('tap')
      buzz(12)
      if (name === 'interact') game.interactNearest()
      if (name === 'secondary') game.triggerSecondaryAction()
      if (name === 'item0') game.useInventoryItem(0)
      if (name === 'item1') game.useInventoryItem(1)
      return
    }
  }

  // 6) 点击地图智能移动 / 互动
  if (p.x >= OX && p.x <= OX + MAP_SW && p.y >= OY && p.y <= OY + MAP_SH) {
    const w = toWorld(p.x, p.y)
    const nearSpot = (game.hidingSpots || []).find(
      hs => !hs.searched && Math.hypot(hs.x - w.x, hs.y - w.y) < 30
    )
    const nearCoworker = (game.coworkers || []).find(
      cw => !cw.caught && Math.hypot(cw.x - w.x, cw.y - w.y) < 30
    )
    const nearChair = game.chairs.find(
      c => !c.sliding && !c.lockedOnPad && Math.hypot(c.x - w.x, c.y - w.y) < 30
    )
    const nearObj = game.objects.find(o => Math.hypot(o.x - w.x, o.y - w.y) < 32)

    if (nearSpot) game.commandMoveTo(nearSpot.x, nearSpot.y, nearSpot.id)
    else if (nearCoworker) game.commandMoveTo(nearCoworker.x, nearCoworker.y, nearCoworker.id)
    else if (nearChair) game.commandMoveTo(nearChair.x, nearChair.y, nearChair.id)
    else if (nearObj) game.commandMoveTo(nearObj.x, nearObj.y, nearObj.id)
    else game.commandMoveTo(w.x, w.y, null)

    floats.push({ text: '·', x: p.x, y: p.y, color: '#3a86ff', life: 0.4, max: 0.4, ring: true })
  }
})

function updateJoy(p) {
  let dx = p.x - JOY.x
  let dy = p.y - JOY.y
  const d = Math.hypot(dx, dy)
  const m = Math.min(1, d / JOY.r)
  if (d > 0) {
    dx /= d
    dy /= d
  }
  joy.dx = dx * m
  joy.dy = dy * m
  joy.mag = m
}

canvas.addEventListener('pointermove', e => {
  if (e.pointerId === joy.id) updateJoy(canvasPoint(e))
})

const endPointer = e => {
  if (e.pointerId === joy.id) {
    joy.id = null
    joy.dx = joy.dy = joy.mag = 0
  }
  pressed.delete(e.pointerId)
}
canvas.addEventListener('pointerup', endPointer)
canvas.addEventListener('pointercancel', endPointer)

// ================= UI 矢量绘图工具 =================
function rr(x, y, w, h, r, fill, stroke = INK, lw = 2.5) {
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

function circle(x, y, r, fill, stroke = INK, lw = 2.5) {
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

function text(
  t,
  x,
  y,
  { size = 12, weight = 900, color = INK, align = 'left', stroke = null, sw = 4, base = 'alphabetic', max } = {}
) {
  const str = bossEditor.replaceName(String(t ?? ''))
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

function emoji(ch, x, y, size = 16) {
  ctx.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(ch, x, y + 1)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}

function pill(t, cx, cy, { size = 9, bg = '#fffdf5', fg = INK, border = INK, lw = 1.8 } = {}) {
  const str = bossEditor.replaceName(String(t ?? ''))
  ctx.font = FONT(size)
  const tw = ctx.measureText(str).width + 12
  const x = Math.max(OX + 2, Math.min(OX + MAP_SW - tw - 2, cx - tw / 2))
  rr(x, cy - size / 2 - 4, tw, size + 8, (size + 8) / 2, bg, border, lw)
  text(str, x + tw / 2, cy + 0.5, { size, color: fg, align: 'center', base: 'middle' })
}

function wrapLines(t, maxW, size) {
  ctx.font = FONT(size)
  const lines = []
  let line = ''
  for (const ch of bossEditor.replaceName(String(t || ''))) {
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

function burstShape(x, y, r1, r2, n, fill, stroke = INK, lw = 2.5) {
  ctx.beginPath()
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? r2 : r1
    const a = (Math.PI * i) / n - Math.PI / 2
    const px = x + Math.cos(a) * r
    const py = y + Math.sin(a) * r
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
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

const spotBuf = document.createElement('canvas')
spotBuf.width = MAP_SW * 2
spotBuf.height = MAP_SH * 2
const spotCtx = spotBuf.getContext('2d')

function getTargetCallout(t) {
  if (!t) return game.taskText || '完成本关目标'
  const pl = game.player
  if (game.mode === 'stealth') {
    if (level === 1) return pl.clockedIn ? '下一步：溜回【7号工位】' : '第一步：去【考勤机】刷脸打卡'
    if (level === 2) return pl.carryingTakeout ? '下一步：带螺蛳粉回【工位】' : '第一步：去前台拿【螺蛳粉】'
    if (level === 3) return pl.hasKeycard ? '下一步：冲进【下班电梯】' : '第一步：顺走【高管门禁卡】'
  }
  if (game.mode === 'pot_pong') return '看准黑锅，反拍砸【王总】！'
  if (game.mode === 'final_boss') return game.bossHp <= 0 ? '上前给王总贴【炒鱿鱼书】！' : '反拍黑锅/引撞碎纸机打【王总】！'
  if (game.mode === 'be_the_boss') return '去发抖的掩体揪出【摸鱼员工】！'
  if (game.mode === 'wake_coworkers') return '盯紧工位，拍醒打瞌睡【队友】！'
  if (game.mode === 'desk_defense') return '守住【黄金工位】击退需求怪！'
  return `目标：${t.name || t.slackerName || game.taskText}`
}

function drawMusicIconBtn(b) {
  const active = soundOn
  const urg = active ? bgm.getUrgency() : 0
  const bgCol = !active ? '#f1f3f5' : urg === 2 ? '#ffccd5' : urg === 1 ? '#fff3b0' : '#d8f3dc'
  const borderCol = urg === 2 ? '#ff006e' : urg === 1 ? '#f77f00' : INK
  circle(b.x, b.y, b.r, bgCol, borderCol, 2.4)
  emoji(active ? '🎵' : '🔇', b.x, b.y, 13.5)
  if (active && bgm.isPlaying()) {
    const speed = urg === 2 ? 32 : urg === 1 ? 24 : 16
    const floatY = ((clock * speed) % 14)
    ctx.save()
    ctx.globalAlpha = Math.max(0, 1 - floatY / 14)
    text(urg > 0 ? '♫' : '♪', b.x + 10 + Math.sin(clock * (urg > 0 ? 10 : 5)) * 3, b.y - 8 - floatY, {
      size: 9.5,
      color: urg === 2 ? '#ff006e' : urg === 1 ? '#f77f00' : '#2a9d8f',
      align: 'center'
    })
    ctx.restore()
  }
}

function drawTargetArrow() {
  if (game.gameState !== 'playing' || phase !== 'play') return
  const pl = game.player
  const ps = P(pl.x, pl.y)
  const meta = MODE_META[game.mode] || MODE_META.stealth
  const t = game.currentTarget

  // 1) 玩家脚下常驻清晰定位光圈（防止混战中找不到自己）
  if (!pl.hiding) {
    const pr = 14 + Math.sin(clock * 6) * 2
    ctx.save()
    ctx.strokeStyle = '#00bbf9'
    ctx.lineWidth = 2.4
    ctx.beginPath()
    ctx.ellipse(ps.x, ps.y + 9, pr, pr * 0.48, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
    if (playElapsed < 8 || !pl.isMoving) {
      pill(game.playerRole === 'boss' ? '👑我(王总)' : '📍我', ps.x, ps.y + 22, {
        size: 7.8,
        bg: '#e0fbfc',
        fg: '#0077b6',
        border: '#0077b6',
        lw: 1.5
      })
    }
  }

  if (!t) return
  const ts = P(t.x, t.y)
  const dist = Math.hypot(ts.x - ps.x, ts.y - ps.y)

  // 2) 常驻柔和流光指路虚线 + 目标头顶跳动【▼ 目标】高亮针
  if (dist > 46) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(OX, OY, MAP_SW, MAP_SH)
    ctx.clip()
    ctx.strokeStyle = 'rgba(255, 183, 3, 0.42)'
    ctx.lineWidth = 2.6
    ctx.setLineDash([6, 6])
    ctx.lineDashOffset = -clock * 38
    ctx.beginPath()
    ctx.moveTo(ps.x, ps.y + 2)
    ctx.lineTo(ts.x, ts.y)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()
  }

  // 目标上方常驻跳动【▼ 目标】标记
  if (spotlightTimer <= 0.1 && dist > 32) {
    const bob = Math.sin(clock * 7) * 3.5
    const pinY = Math.max(OY + 16, ts.y - 26 + bob)
    pill('🎯目标', ts.x, pinY - 9, {
      size: 8.2,
      bg: '#ffd166',
      fg: INK,
      border: INK,
      lw: 1.8
    })
    ctx.fillStyle = '#ffd166'
    ctx.strokeStyle = INK
    ctx.lineWidth = 1.8
    ctx.beginPath()
    ctx.moveTo(ts.x - 5, pinY - 1)
    ctx.lineTo(ts.x + 5, pinY - 1)
    ctx.lineTo(ts.x, pinY + 5)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }

  // 3) 玩家身旁指向箭头
  if (dist < 48) return
  const a = Math.atan2(ts.y - ps.y, ts.x - ps.x)
  ctx.save()
  ctx.translate(ps.x + Math.cos(a) * 26, ps.y - 6 + Math.sin(a) * 26)
  ctx.rotate(a)
  ctx.fillStyle = meta.color
  ctx.strokeStyle = INK
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(9, 0)
  ctx.lineTo(-4, -6)
  ctx.lineTo(-1, 0)
  ctx.lineTo(-4, 6)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

// 开局 & 阶段切换 双聚光灯舞台导览演出（清晰照亮“玩家位置”与“当前首要目标”）
function drawSpotlightGuide() {
  if (spotlightTimer <= 0 || phase !== 'play' || game.gameState !== 'playing') return
  const elapsed = spotlightMax - spotlightTimer
  const fadeIn = Math.min(1, elapsed / 0.18)
  const fadeOut = Math.min(1, spotlightTimer / 0.45)
  const alpha = fadeIn * fadeOut
  if (alpha <= 0.01) return

  const pl = game.player
  const ps = P(pl.x, pl.y)
  const t = game.currentTarget
  const ts = t ? P(t.x, t.y) : null
  const isShift = spotlightKind === 'shift'

  // 1) 离屏绘制柔和暗场幕布 + 双聚光灯羽化镂空孔
  spotCtx.save()
  spotCtx.setTransform(2, 0, 0, 2, 0, 0)
  spotCtx.clearRect(0, 0, MAP_SW, MAP_SH)
  spotCtx.fillStyle = `rgba(14, 18, 34, ${(isShift ? 0.5 : 0.74) * alpha})`
  spotCtx.fillRect(0, 0, MAP_SW, MAP_SH)

  spotCtx.globalCompositeOperation = 'destination-out'
  const punchHole = (hx, hy, rIn, rOut) => {
    const g = spotCtx.createRadialGradient(hx, hy, rIn, hx, hy, rOut)
    g.addColorStop(0, 'rgba(0,0,0,1)')
    g.addColorStop(0.65, 'rgba(0,0,0,0.92)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    spotCtx.fillStyle = g
    spotCtx.beginPath()
    spotCtx.arc(hx, hy, rOut, 0, Math.PI * 2)
    spotCtx.fill()
  }
  punchHole(ps.x - OX, ps.y - OY - 4, isShift ? 24 : 34, isShift ? 46 : 62)
  if (ts) punchHole(ts.x - OX, ts.y - OY - 2, 38, 72)
  spotCtx.restore()

  ctx.save()
  ctx.beginPath()
  ctx.roundRect(OX, OY, MAP_SW, MAP_SH, 10)
  ctx.clip()
  ctx.drawImage(spotBuf, OX, OY, MAP_SW, MAP_SH)

  // 2) 舞台聚光灯斜射光柱（天青光柱照自己 + 金黄聚光灯照目标）
  const drawStageBeam = (topX, bx, by, radius, rgb) => {
    const bg = ctx.createLinearGradient(topX, OY, bx, by)
    bg.addColorStop(0, `rgba(${rgb}, ${0.34 * alpha})`)
    bg.addColorStop(1, `rgba(${rgb}, ${0.06 * alpha})`)
    ctx.fillStyle = bg
    ctx.beginPath()
    ctx.moveTo(topX - 16, OY)
    ctx.lineTo(topX + 16, OY)
    ctx.lineTo(bx + radius, by + 6)
    ctx.lineTo(bx - radius, by + 6)
    ctx.closePath()
    ctx.fill()
  }
  if (!isShift) drawStageBeam(Math.min(OX + MAP_SW - 22, ps.x + 18), ps.x, ps.y, 34, '76,201,240')
  if (ts) drawStageBeam(Math.max(OX + 22, ts.x - 18), ts.x, ts.y, 40, '255,209,102')

  // 3) 玩家 -> 目标 流光动态引导箭头路径
  if (ts && Math.hypot(ts.x - ps.x, ts.y - ps.y) > 42) {
    ctx.strokeStyle = `rgba(255, 224, 102, ${0.92 * alpha})`
    ctx.lineWidth = 3.2
    ctx.setLineDash([8, 6])
    ctx.lineDashOffset = -clock * 64
    ctx.beginPath()
    ctx.moveTo(ps.x, ps.y - 2)
    ctx.lineTo(ts.x, ts.y)
    ctx.stroke()
    ctx.setLineDash([])

    // 流动小箭头颗粒
    const ang = Math.atan2(ts.y - ps.y, ts.x - ps.x)
    for (let i = 0; i < 3; i++) {
      const prog = ((clock * 0.85 + i / 3) % 1)
      if (prog < 0.14 || prog > 0.86) continue
      const ax = ps.x + (ts.x - ps.x) * prog
      const ay = ps.y + (ts.y - ps.y) * prog
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.translate(ax, ay)
      ctx.rotate(ang)
      ctx.fillStyle = '#ffd166'
      ctx.strokeStyle = INK
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.moveTo(6, 0)
      ctx.lineTo(-4, -4.5)
      ctx.lineTo(-2, 0)
      ctx.lineTo(-4, 4.5)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.restore()
    }
  }

  // 4) 聚光灯准星环与醒目气泡标注
  ctx.globalAlpha = alpha
  if (!isShift) {
    const pr = 26 + Math.sin(clock * 8) * 3
    circle(ps.x, ps.y - 4, pr, null, '#4cc9f0', 2.8)
    const pLabelY = ps.y > OY + MAP_SH - 70 ? ps.y - 40 : ps.y + 32
    pill(game.playerRole === 'boss' ? '👑 你在这儿 (王总)' : '📍 你在这儿！', ps.x, pLabelY, {
      size: 10,
      bg: '#4cc9f0',
      fg: INK,
      border: '#ffffff',
      lw: 2.2
    })
  }

  if (ts) {
    const tr = 30 + Math.sin(clock * 9) * 3.5
    circle(ts.x, ts.y - 2, tr, null, '#ffd166', 3.2)
    circle(ts.x, ts.y - 2, tr + 6, null, 'rgba(255,209,102,0.45)', 1.8)
    const callout = `🎯 ${getTargetCallout(t)}`
    const preferAbove = ts.y > OY + 72
    let tLabelY = preferAbove ? ts.y - 42 : ts.y + 38
    if (!isShift && Math.abs(tLabelY - (ps.y > OY + MAP_SH - 70 ? ps.y - 40 : ps.y + 32)) < 24 && Math.abs(ts.x - ps.x) < 130) {
      tLabelY = preferAbove ? ts.y + 38 : ts.y - 42
    }
    pill(callout, ts.x, Math.max(OY + 20, Math.min(OY + MAP_SH - 20, tLabelY)), {
      size: 10.5,
      bg: '#ffd166',
      fg: INK,
      border: '#ffffff',
      lw: 2.4
    })
  }

  if (spotlightKind === 'opening') {
    pill('👆 推动摇杆或点击地图即可立即行动', OX + MAP_SW / 2, OY + MAP_SH - 18, {
      size: 8.8,
      bg: 'rgba(255,253,245,0.92)',
      fg: INK,
      border: '#ffd166',
      lw: 1.8
    })
  }

  ctx.restore()
}

// ================= 多模式自适应顶部 HUD =================
function bar(x, y, w, h, ratio, color, label, { textColor = INK, strokeText = null } = {}) {
  const clamped = Math.max(0, Math.min(1, ratio || 0))
  rr(x, y, w, h, h / 2, '#fffdf5', INK, 2)
  if (clamped > 0.01) {
    rr(
      x + 2,
      y + 2,
      Math.max(h - 4, (w - 4) * clamped),
      h - 4,
      (h - 4) / 2,
      color,
      null,
      0
    )
  }
  text(label, x + w / 2, y + h / 2 + 0.5, {
    size: 10,
    align: 'center',
    base: 'middle',
    color: textColor,
    stroke: strokeText,
    sw: 2.8,
    max: w - 10
  })
}

function drawBossHpHUD(s) {
  // 左侧紧凑倒计时胶囊
  const urgent = s.timeLeft <= 8 && phase === 'play' && s.gameState === 'playing'
  const pulse = urgent ? 1 + Math.sin(clock * 12) * 0.05 : 1
  ctx.save()
  ctx.translate(50, 61)
  ctx.scale(pulse, pulse)
  rr(-42, -14, 84, 28, 14, urgent ? '#ff006e' : '#2b2d42', INK, 2.3)
  text(`⏱ ${Math.ceil(s.timeLeft)}s`, 0, 5, {
    size: 13,
    color: urgent ? '#ffffff' : '#ffd166',
    align: 'center'
  })
  ctx.restore()

  // 地图正上方醒目卡通王总血条（带王总头像 + 阶段分割线）
  const bx = 98
  const by = 45
  const bw = 284
  const bh = 32
  const enraged = (s.bossPhase || 1) >= 2
  rr(bx, by, bw, bh, 16, '#2b2d42', enraged ? '#ff006e' : INK, 2.5)

  // 王总卡通头像圆章（实时反映假发吹飞 wigLost 与愤怒/眩晕表情）
  const avX = bx + 18
  const avY = by + 16
  circle(avX, avY, 14, s.bossHp <= 0 ? '#ffd166' : '#ffe5ec', INK, 2)
  ctx.save()
  ctx.beginPath()
  ctx.arc(avX, avY, 13, 0, Math.PI * 2)
  ctx.clip()
  ctx.translate(avX, avY + 11)
  ctx.scale(0.68, 0.68)
  renderer.drawChibi(
    0,
    0,
    'boss',
    Math.PI / 2,
    {
      mood: s.bossHp <= 0 ? 'dizzy' : 'angry',
      wigLost: Boolean(s.boss?.wigLost)
    },
    clock
  )
  ctx.restore()
  circle(avX, avY, 14, null, INK, 2)

  // 血量槽
  const tx = bx + 38
  const ty = by + 5
  const tw = bw - 45
  const th = bh - 10
  rr(tx, ty, tw, th, th / 2, '#161824', '#0f1018', 1.5)

  const ratio = Math.max(0, Math.min(1, s.bossHp / Math.max(1, s.bossMaxHp)))
  if (ratio > 0) {
    const grad = ctx.createLinearGradient(tx, ty, tx + tw, ty)
    grad.addColorStop(0, '#ff006e')
    grad.addColorStop(0.55, '#fb5607')
    grad.addColorStop(1, '#ffbe0b')
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(tx + 1.5, ty + 1.5, Math.max(8, (tw - 3) * ratio), th - 3, (th - 3) / 2)
    ctx.fillStyle = grad
    ctx.fill()
    // 顶部卡通高光条
    ctx.fillStyle = 'rgba(255,255,255,0.32)'
    ctx.fillRect(tx + 6, ty + 3, Math.max(0, (tw - 12) * ratio), 4)
    ctx.restore()
  }

  // 阶段分割刻度线（Lv9 为5格刻度，Lv16 为9格+三阶段粗分割）
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(tx, ty, tw, th, th / 2)
  ctx.clip()
  for (let i = 1; i < s.bossMaxHp; i++) {
    const sx = tx + (tw * i) / s.bossMaxHp
    const isMajorPhase = s.bossMaxHp === 9 && (i === 3 || i === 6)
    ctx.strokeStyle = isMajorPhase ? '#ffffff' : 'rgba(22,24,36,0.55)'
    ctx.lineWidth = isMajorPhase ? 2.4 : 1.2
    ctx.beginPath()
    ctx.moveTo(sx, ty + (isMajorPhase ? 0 : 2))
    ctx.lineTo(sx, ty + th - (isMajorPhase ? 0 : 2))
    ctx.stroke()
  }
  ctx.restore()

  const hpText =
    s.bossHp <= 0 && game.mode === 'final_boss'
      ? '📄 王总倒地！上前贴解雇信！'
      : `👑 王总 HP ${s.bossHp}/${s.bossMaxHp}${s.bossMaxHp >= 9 ? ` · P${s.bossPhase}` : ''}`
  text(hpText, tx + tw / 2, ty + th / 2 + 0.5, {
    size: 9.8,
    color: '#ffffff',
    align: 'center',
    base: 'middle',
    stroke: INK,
    sw: 3,
    max: tw - 8
  })
}

function drawHUD() {
  const s = game.snapshot()
  const meta = MODE_META[game.mode] || MODE_META.stealth

  // 1) 顶部关卡栏（点击可随时展开16关章节选关器）
  rr(TOP_MENU_RECT.x, TOP_MENU_RECT.y, TOP_MENU_RECT.w, TOP_MENU_RECT.h, 17, '#fffdf5', INK, 2.4)
  circle(25, 23, 12.5, meta.color, INK, 2)
  text(`${level}`, 25, 27.5, { size: 13.5, color: '#ffffff', align: 'center' })

  // 玩法模式彩色胶囊角标
  const badgeTxt = game.cfg.modeBadge || '潜行摸鱼'
  ctx.font = FONT(8.8)
  const bw = ctx.measureText(badgeTxt).width + 10
  rr(42, 13, bw, 20, 10, meta.bg, meta.color, 1.6)
  text(badgeTxt, 42 + bw / 2, 23.5, { size: 9.4, color: meta.color, align: 'center', base: 'middle' })

  // 关卡名 + 选关提示
  const titleX = 42 + bw + 6
  const maxTitleW = TOP_MENU_RECT.x + TOP_MENU_RECT.w - titleX - 38
  text(game.cfg.title, titleX, 27.5, { size: 13, color: INK, max: Math.max(60, maxTitleW) })
  rr(TOP_MENU_RECT.x + TOP_MENU_RECT.w - 35, 13, 29, 20, 9, '#f1f3f5', 'rgba(43,45,66,0.35)', 1.2)
  text('选关', TOP_MENU_RECT.x + TOP_MENU_RECT.w - 20.5, 23.5, {
    size: 9,
    color: '#495057',
    align: 'center',
    base: 'middle'
  })

  // 右上音乐 & 重试 & 锦囊按钮
  drawMusicIconBtn(BTN.music)
  for (const [b, ic] of [
    [BTN.retry, '↻'],
    [BTN.hint, '💡']
  ]) {
    circle(b.x, b.y, b.r, b === BTN.hint && showHint ? '#ffbe0b' : '#fffdf5', INK, 2.4)
    if (ic === '↻') text(ic, b.x, b.y + 5.5, { size: 16, align: 'center' })
    else emoji(ic, b.x, b.y, 14)
  }

  // 2) 第二行：按玩法模式自适应绘制 Boss血条 / 工位耐久条 / 目标进度条 / 潜行仪表
  if (s.bossMaxHp > 0) {
    drawBossHpHUD(s)
  } else if (s.deskMaxHp > 0) {
    // Lv12 工位保卫战：倒计时 + 分格工位耐久条 + 体力条
    const urgent = s.timeLeft <= 8 && phase === 'play' && s.gameState === 'playing'
    rr(8, 46, 100, 28, 14, urgent ? '#38b000' : '#2b2d42', INK, 2.3)
    text(`🔔 下班 ${Math.ceil(s.timeLeft)}s`, 58, 64.5, {
      size: 11.5,
      color: '#ffd166',
      align: 'center'
    })

    // 工位耐久分格血条
    const dx = 113
    const dy = 46
    const dw = 166
    const dh = 28
    const dRatio = s.deskHp / Math.max(1, s.deskMaxHp)
    const dCol = dRatio > 0.6 ? '#38b000' : dRatio > 0.3 ? '#ffb703' : '#ff006e'
    bar(dx, dy, dw, dh, dRatio, dCol, `🛡️ 工位耐久 ${s.deskHp}/${s.deskMaxHp}`, {
      textColor: '#ffffff',
      strokeText: INK
    })
    for (let i = 1; i < s.deskMaxHp; i++) {
      const sx = dx + (dw * i) / s.deskMaxHp
      ctx.strokeStyle = 'rgba(43,45,66,0.35)'
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(sx, dy + 3)
      ctx.lineTo(sx, dy + dh - 3)
      ctx.stroke()
    }

    bar(284, 46, 98, 28, s.player.stamina / 100, '#4cc9f0', `⚡体力 ${s.player.stamina}`)
  } else if (game.mode !== 'stealth') {
    // 多元动作/计数/整蛊/解谜/黑夜模式：倒计时 + 模式专属进度条 + 氮气/警戒/体力条
    const urgent = s.timeLeft <= 8 && phase === 'play' && s.gameState === 'playing'
    const isSurvive = game.mode === 'wake_coworkers'
    const pulse = urgent ? 1 + Math.sin(clock * 12) * 0.05 : 1
    ctx.save()
    ctx.translate(57, 60)
    ctx.scale(pulse, pulse)
    rr(-49, -14, 98, 28, 14, urgent ? '#ff006e' : '#2b2d42', INK, 2.3)
    text(
      isSurvive ? `⏱ 坚守 ${Math.ceil(s.timeLeft)}s` : `⏱ 剩 ${Math.ceil(s.timeLeft)}s`,
      0,
      4.5,
      {
        size: 12,
        color: urgent ? '#ffffff' : '#ffd166',
        align: 'center'
      }
    )
    ctx.restore()

    const progRatio = s.modeTarget > 0 ? Math.min(1, s.modeProgress / s.modeTarget) : 0
    bar(111, 46, 162, 28, progRatio, meta.color, s.modeLabel, {
      textColor: '#ffffff',
      strokeText: INK
    })

    if (game.mode === 'chair_derby') {
      const pl = game.player
      const nRatio =
        pl.nitroTimer > 0 ? 1 : Math.max(0, 1 - (pl.nitroCooldown || 0) / 2.1)
      bar(
        278,
        46,
        104,
        28,
        nRatio,
        pl.nitroTimer > 0 ? '#ff006e' : '#fb5607',
        pl.nitroTimer > 0 ? '🔥氮气狂飙!' : nRatio >= 0.99 ? '🚀氮气就绪' : '⏳氮气充能',
        { textColor: '#ffffff', strokeText: INK }
      )
    } else if (['prank_hunt', 'vault_heist', 'blackout_escape'].includes(game.mode)) {
      const chasing = game.guards.some(g => g.state === 'chase')
      const maxSusp = Math.max(
        0,
        ...game.guards.map(g => g.suspicion || 0),
        ...game.snitches.map(n => n.suspicion || 0),
        ...game.cameras.map(c => c.suspicion || 0)
      )
      const lbl = s.blackout
        ? '🌑断电夜幕'
        : chasing
          ? '🚨被追!'
          : s.player.hiding
            ? '🌿隐身'
            : s.player.carton && !game.player.isMoving
              ? '📦伪装'
              : maxSusp > 0
                ? `👁️${Math.round(maxSusp)}%`
                : '👁️安全'
      bar(
        278,
        46,
        104,
        28,
        s.blackout ? 1 : chasing ? 1 : maxSusp / 100,
        s.blackout ? '#3a0ca3' : chasing || maxSusp > 60 ? '#ff006e' : '#ffd166',
        lbl,
        s.blackout || chasing ? { textColor: '#ffffff', strokeText: INK } : {}
      )
    } else {
      bar(278, 46, 104, 28, s.player.stamina / 100, '#4cc9f0', `⚡体力 ${s.player.stamina}`)
    }
  } else {
    // Lv1~3 经典潜行 HUD：职场时钟 + 体力条 + 暴露警戒条
    const urgent = s.timeLeft <= 8 && phase === 'play' && s.gameState === 'playing'
    const pulse = urgent ? 1 + Math.sin(clock * 12) * 0.05 : 1
    ctx.save()
    ctx.translate(65, 60)
    ctx.scale(pulse, pulse)
    rr(-57, -14, 114, 28, 14, urgent ? '#ff006e' : '#2b2d42', INK, 2.3)
    text(s.clockText, 0, 5, { size: 14, color: urgent ? '#ffffff' : '#ffd166', align: 'center' })
    ctx.restore()

    bar(
      128,
      46,
      122,
      28,
      s.player.stamina / 100,
      s.player.stamina > 30 ? '#4cc9f0' : '#ffb703',
      `⚡体力 ${s.player.stamina}`
    )
    const chasing = game.guards.some(g => g.state === 'chase')
    const maxSusp = Math.max(
      0,
      ...game.guards.map(g => g.suspicion || 0),
      ...game.snitches.map(n => n.suspicion || 0),
      ...game.cameras.map(c => c.suspicion || 0)
    )
    const lbl = chasing
      ? '🚨被追!'
      : s.player.hiding
        ? '🌿隐身'
        : s.player.carton && !game.player.isMoving
          ? '📦伪装'
          : maxSusp > 0
            ? `👁️${Math.round(maxSusp)}%`
            : '👁️安全'
    bar(
      255,
      46,
      127,
      28,
      chasing ? 1 : maxSusp / 100,
      chasing || maxSusp > 60 ? '#ff006e' : '#ffd166',
      lbl
    )
  }

  // 3) 地图下方：当前目标胶囊（点击可随时点亮聚光灯指路！） + 实时三星达成指示器
  const ty = OY + MAP_SH + 8 // 596
  rr(8, ty, 240, 26, 13, spotlightTimer > 0 ? '#fff3b0' : '#fffdf5', INK, 2.2)
  text(`🎯 ${s.taskText}`, 16, ty + 17, { size: 10.4, max: 184 })
  rr(204, ty + 4, 40, 18, 9, '#ffd166', INK, 1.4)
  text('📍指路', 224, ty + 13.5, { size: 7.8, color: INK, align: 'center', base: 'middle' })

  rr(253, ty, 129, 26, 13, '#2b2d42', INK, 2.2)
  const isActionMode = ['pot_pong', 'chair_derby', 'be_the_boss', 'shredder_race', 'final_boss'].includes(
    game.mode
  )
  const starOK = isActionMode
    ? [s.gameState === 'won', s.spottedCount <= 1, s.bossPranked >= 3]
    : [s.gameState === 'won', s.spottedCount === 0, s.bossPranked > 0 || (s.deskMaxHp > 0 && s.deskHp === s.deskMaxHp)]
  const starLbl = isActionMode ? ['过关', '稳健', '暴击'] : ['完成', '零暴露', '整老板']
  starOK.forEach((ok, i) => {
    text(ok ? '★' : '☆', 263 + i * 41, ty + 17.5, { size: 12, color: ok ? '#ffd166' : '#8d99ae' })
    text(starLbl[i], 275 + i * 41, ty + 16.5, { size: 6.8, color: ok ? '#ffd166' : '#adb5bd' })
  })

  // 4) 实时战况解说条（2行防溢出）
  const sy = ty + 30 // 626..660
  const msg = phase === 'intro' ? '自由点选16关任意模式，点击【立刻开工！】发车！' : s.statusText
  const lines = wrapLines(msg, 354, 9.6).slice(0, 2)
  rr(8, sy, 374, 34, 10, 'rgba(255,253,245,0.88)', INK, 1.8)
  lines.forEach((l, i) => text(l, 16, sy + 13.5 + i * 13, { size: 10.2, color: '#3d405b' }))
}

// ================= 底部摇杆与多模式自适应技能盘 =================
function drawControls() {
  const jx = JOY.x + joy.dx * JOY.r * 0.62
  const jy = JOY.y + joy.dy * JOY.r * 0.62
  const kbActive = keys.up || keys.down || keys.left || keys.right
  const sprintNow = joy.mag > 0.9 || keys.sprint

  circle(JOY.x, JOY.y, JOY.r, 'rgba(255,253,245,0.78)', INK, 3)
  circle(
    JOY.x,
    JOY.y,
    JOY.r * 0.92,
    null,
    sprintNow ? '#ff006e' : 'rgba(43,45,66,0.15)',
    sprintNow ? 4 : 2
  )
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2
    ctx.fillStyle = 'rgba(43,45,66,0.35)'
    ctx.beginPath()
    const cx = JOY.x + Math.cos(a) * (JOY.r - 12)
    const cy = JOY.y + Math.sin(a) * (JOY.r - 12)
    ctx.moveTo(cx + Math.cos(a) * 5.5, cy + Math.sin(a) * 5.5)
    ctx.lineTo(cx + Math.cos(a + 2.3) * 5.5, cy + Math.sin(a + 2.3) * 5.5)
    ctx.lineTo(cx + Math.cos(a - 2.3) * 5.5, cy + Math.sin(a - 2.3) * 5.5)
    ctx.fill()
  }
  circle(jx, jy, 26, sprintNow ? '#ff006e' : '#4f8ef7', INK, 3)
  circle(jx - 7, jy - 8, 5.5, 'rgba(255,255,255,0.45)', null, 0)

  const moveLabel =
    game.mode === 'chair_derby'
      ? sprintNow
        ? '氮气漂移!'
        : '飙椅转向'
      : sprintNow
        ? '冲刺!'
        : joy.id !== null || kbActive
          ? game.mode === 'stealth'
            ? '潜行'
            : '走位'
          : '移动'
  text(moveLabel, JOY.x, JOY.y + JOY.r + 15, {
    size: 10.5,
    align: 'center',
    stroke: '#fffdf5',
    sw: 3
  })

  const topJoyTip =
    game.mode === 'chair_derby'
      ? '推到底=喷射氮气'
      : ['stealth', 'prank_hunt', 'vault_heist', 'blackout_escape'].includes(game.mode)
        ? '推到底=冲刺(有声)'
        : '摇杆灵活走位'
  text(topJoyTip, JOY.x, JOY.y - JOY.r - 7, { size: 8.7, align: 'center', color: '#5c5470' })

  const btn = (b, fill, icon, label, sub, down) => {
    const r = down ? b.r * 0.92 : b.r
    ctx.fillStyle = 'rgba(43,45,66,0.24)'
    ctx.beginPath()
    ctx.arc(b.x, b.y + 4, r, 0, Math.PI * 2)
    ctx.fill()
    circle(b.x, b.y + (down ? 3 : 0), r, fill, INK, 2.8)
    circle(b.x - r * 0.3, b.y - r * 0.35 + (down ? 3 : 0), r * 0.24, 'rgba(255,255,255,0.38)', null, 0)
    emoji(icon, b.x, b.y - (label ? 6 : 0) + (down ? 3 : 0), r * 0.58)
    if (label) {
      text(label, b.x, b.y + r * 0.54 + (down ? 3 : 0), {
        size: r > 40 ? 11 : 8.6,
        align: 'center',
        color: '#ffffff',
        stroke: INK,
        sw: 3,
        max: r * 1.9
      })
    }
    if (sub !== null && sub !== undefined && sub !== '') {
      circle(b.x + r * 0.72, b.y - r * 0.72, 9.5, '#ffbe0b', INK, 2)
      text(String(sub), b.x + r * 0.72, b.y - r * 0.72 + 3.5, { size: 8.8, align: 'center' })
    }
  }

  const isDown = name => [...pressed.values()].includes(name)
  const pl = game.player

  // 1) 右下主技能大按钮：实时读取 game.getActionDescriptor()
  const act = game.getActionDescriptor()
  if (act.canAct) {
    circle(
      BTN.interact.x,
      BTN.interact.y,
      BTN.interact.r + 5 + Math.sin(clock * 8) * 2.2,
      null,
      act.accent || '#ffbe0b',
      3.8
    )
  }
  btn(
    BTN.interact,
    act.canAct ? act.accent || '#38b000' : '#94a3b8',
    act.icon || '✋',
    act.label || '互动',
    null,
    isDown('interact')
  )

  // 2) 辅助技能小按钮：潜行关显示 📦纸箱，非潜行动作关显示 🚀冲刺/闪避 或 🚀氮气！
  const usesCarton =
    game.cfg.cartonUses > 0 &&
    ['stealth', 'prank_hunt', 'vault_heist', 'blackout_escape'].includes(game.mode)

  if (usesCarton) {
    btn(
      BTN.secondary,
      pl.carton ? '#bc6c25' : pl.cartonUses > 0 ? '#dda15e' : '#adb5bd',
      '📦',
      pl.carton ? '脱下' : '纸箱',
      String(pl.cartonUses),
      isDown('secondary')
    )
  } else if (game.mode === 'chair_derby') {
    const cd = pl.nitroCooldown || 0
    btn(
      BTN.secondary,
      pl.nitroTimer > 0 ? '#ff006e' : cd <= 0 ? '#fb5607' : '#adb5bd',
      '🚀',
      pl.nitroTimer > 0 ? '喷射中' : '氮气',
      cd > 0 ? cd.toFixed(1) : 'GO',
      isDown('secondary')
    )
  } else {
    const cd = pl.dashCooldown || 0
    btn(
      BTN.secondary,
      pl.dashTimer > 0 ? '#00bbf9' : cd <= 0 ? '#3a86ff' : '#adb5bd',
      '🚀',
      pl.dashTimer > 0 ? '闪身!' : '冲刺闪避',
      cd > 0 ? cd.toFixed(1) : null,
      isDown('secondary')
    )
  }

  // 3) 随身道具栏按钮 (item0 / item1)
  const it0 = pl.inventory[0]
  const it1 = pl.inventory[1]
  btn(
    BTN.item0,
    it0 ? '#ff006e' : '#ced4da',
    it0 ? it0.icon : '🎒',
    it0 ? it0.name.slice(0, 3) : '空',
    null,
    isDown('item0')
  )
  btn(BTN.item1, it1 ? '#8338ec' : '#ced4da', it1 ? it1.icon : '🎒', '', null, isDown('item1'))
}

// ================= 特效覆盖层 & 关卡弹窗 =================
function drawOverlays(dt) {
  // 粒子与碎纸花
  for (const pt of particles) {
    pt.life -= dt
    pt.x += pt.vx * dt
    pt.y += pt.vy * dt
    pt.vy += (pt.paper ? 95 : 140) * dt
    pt.vx *= 0.97
    ctx.globalAlpha = Math.max(0, pt.life / pt.max)
    if (pt.paper) {
      ctx.save()
      ctx.translate(pt.x, pt.y)
      ctx.rotate((pt.rot || 0) + clock * 7)
      ctx.fillStyle = pt.color
      ctx.strokeStyle = INK
      ctx.lineWidth = 0.9
      ctx.fillRect(-pt.size, -pt.size * 0.6, pt.size * 2, pt.size * 1.2)
      ctx.strokeRect(-pt.size, -pt.size * 0.6, pt.size * 2, pt.size * 1.2)
      ctx.restore()
    } else if (pt.star) {
      emoji('✦', pt.x, pt.y, pt.size * 3)
    } else {
      circle(pt.x, pt.y, pt.size, pt.color, null, 0)
    }
  }
  particles = particles.filter(pt => pt.life > 0)
  ctx.globalAlpha = 1

  // 漫画拟声爆炸字（啪！反杀！ / 秃啦！！ / 咔嚓粉碎！ / 抓到摸鱼！）
  for (const b of bursts) {
    b.life -= dt
    const k = Math.min(1, (b.max - b.life) / 0.11)
    ctx.save()
    ctx.globalAlpha = Math.min(1, b.life / 0.28)
    ctx.translate(Math.max(OX + 46, Math.min(OX + MAP_SW - 46, b.x)), Math.max(OY + 32, b.y))
    ctx.scale(k * 1.12, k * 1.12)
    ctx.rotate(-0.1)
    burstShape(0, 0, 38, 22, 11, b.bg || '#ffbe0b')
    text(b.text, 0, 5, {
      size: 13.5,
      align: 'center',
      color: b.fg || '#ff006e',
      stroke: b.fg === '#ffffff' ? INK : '#ffffff',
      sw: 3.5
    })
    ctx.restore()
  }
  bursts = bursts.filter(b => b.life > 0)

  // 浮动战报文字
  for (const f of floats) {
    f.life -= dt
    if (f.ring) {
      ctx.globalAlpha = Math.max(0, f.life / f.max)
      circle(f.x, f.y, 14 * (1 - f.life / f.max) + 4, null, '#3a86ff', 2.4)
      continue
    }
    f.y -= 20 * dt
    ctx.globalAlpha = Math.max(0, Math.min(1, f.life / 0.5))
    const pop = 1 + Math.max(0, f.life - (f.max - 0.15)) * 2.8
    const size = Math.round((f.big ? 12.5 : 10.8) * pop)
    ctx.font = FONT(size)
    const tw = Math.min(ctx.measureText(f.text).width, MAP_SW - 10)
    const x = Math.max(OX + 5 + tw / 2, Math.min(OX + MAP_SW - 5 - tw / 2, f.x))
    text(f.text, x, Math.max(OY + 15, f.y), {
      size,
      color: f.color,
      align: 'center',
      stroke: '#ffffff',
      sw: 3.8,
      max: MAP_SW - 10
    })
  }
  floats = floats.filter(f => f.life > 0)
  ctx.globalAlpha = 1

  const s = game.snapshot()
  if (phase === 'play' && s.gameState === 'playing') {
    if (game.player.carton) queueTutorial('carton')
    if (game.player.hiding) queueTutorial('hide')
    if (game.player.activeBuffTimer > 0) queueTutorial('coffee')
    if (s.spottedCount > 0) queueTutorial('spotted')
  }
  updateTutorial(dt)
  const lethalStealth = ['stealth', 'prank_hunt', 'vault_heist', 'blackout_escape'].includes(
    game.mode
  )
  const chasing = lethalStealth && game.guards.some(g => g.state === 'chase')
  if (chasing && s.gameState === 'playing') {
    const pulse = 0.34 + Math.sin(clock * 8) * 0.12
    const vg = ctx.createRadialGradient(
      OX + MAP_SW / 2,
      OY + MAP_SH / 2,
      MAP_SW * 0.35,
      OX + MAP_SW / 2,
      OY + MAP_SH / 2,
      MAP_SH * 0.62
    )
    vg.addColorStop(0, 'rgba(255,0,110,0)')
    vg.addColorStop(1, `rgba(255,0,110,${pulse})`)
    ctx.fillStyle = vg
    ctx.fillRect(OX, OY, MAP_SW, MAP_SH)
    pill('🚨 被盯上了！快绕墙甩开 / 踢转椅反杀', OX + MAP_SW / 2, OY + 15, {
      size: 9.5,
      bg: '#ff006e',
      fg: '#ffffff'
    })
  }

  // 开局模式横幅快闪提示（聚光灯导览期间自动让位，避免顶部遮挡）
  if (bannerTimer > 0 && phase === 'play' && s.gameState === 'playing' && !chasing && spotlightTimer <= 0.25) {
    bannerTimer = Math.max(0, bannerTimer - dt)
    const alpha = Math.min(1, bannerTimer / 0.35)
    const meta = MODE_META[game.mode] || MODE_META.stealth
    ctx.save()
    ctx.globalAlpha = alpha
    rr(OX + 16, OY + 10, MAP_SW - 32, 38, 12, 'rgba(43,45,66,0.9)', meta.color, 2.2)
    text(`${meta.icon} 【${game.cfg.modeBadge}】第${level}关 · ${game.cfg.title}`, VW / 2, OY + 25, {
      size: 11,
      color: '#ffd166',
      align: 'center',
      max: MAP_SW - 46
    })
    text(game.cfg.subtitle, VW / 2, OY + 41, {
      size: 8.8,
      color: '#ffffff',
      align: 'center',
      max: MAP_SW - 46
    })
    ctx.restore()
  }

  if (flash > 0) {
    ctx.fillStyle = `rgba(255,0,110,${flash * 0.48})`
    ctx.fillRect(OX, OY, MAP_SW, MAP_SH)
  }

  if (s.timeLeft <= 8 && s.gameState === 'playing' && phase === 'play') {
    const warnCol =
      game.mode === 'wake_coworkers' || game.mode === 'desk_defense'
        ? `rgba(56,176,0,${0.5 + Math.sin(clock * 10) * 0.35})`
        : `rgba(255,0,110,${0.5 + Math.sin(clock * 10) * 0.4})`
    ctx.strokeStyle = warnCol
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.roundRect(OX - 6, OY - 6, MAP_SW + 12, MAP_SH + 12, 16)
    ctx.stroke()
  }

  if (showHint && phase === 'play') {
    const tipList =
      Array.isArray(game.cfg.hints) && game.cfg.hints.length > 0
        ? game.cfg.hints
        : [game.cfg.hint]
    const allLines = []
    tipList.slice(0, 3).forEach((tp, idx) => {
      const wrapped = wrapLines(`${idx + 1}. ${tp}`, 310, 10.5)
      allLines.push(...wrapped)
    })
    const h = allLines.length * 16 + 46
    const y = OY + MAP_SH - h - 10
    rr(OX + 10, y, MAP_SW - 20, h, 16, '#fff3b0', INK, 3)
    text(`💡 第${level}关破局锦囊（点任意处收起）`, OX + 22, y + 22, {
      size: 12,
      color: '#9c6644'
    })
    allLines.forEach((l, i) =>
      text(l, OX + 22, y + 41 + i * 16, { size: 10.5, color: '#5f3dc4', max: MAP_SW - 44 })
    )
  }

  // 首次触发动机提示横幅（只出现一次，4.2 秒自动消失）
  if (tutorialActive && phase === 'play' && s.gameState === 'playing') {
    const fadeIn = Math.min(1, (8 - tutorialTimer) / 0.25)
    const fadeOut = Math.min(1, tutorialTimer / 0.4)
    const alpha = Math.max(0, Math.min(fadeIn, fadeOut))
    ctx.save()
    ctx.globalAlpha = alpha
    const by = OY + 52
    rr(22, by, 346, 48, 12, 'rgba(255,253,245,0.97)', '#ffbe0b', 2.5)
    circle(45, by + 24, 14, tutorialActive.color, INK, 1.8)
    emoji(tutorialActive.icon, 45, by + 24, 16)
    const lines = wrapLines(tutorialActive.text, 270, 10.5).slice(0, 2)
    lines.forEach((l, i) =>
      text(l, 66, by + 20 + i * 14, { size: 10.5, color: INK, max: 270 })
    )
    text('首次提示', 354, by + 41, {
      size: 7.5,
      color: 'rgba(43,45,66,0.55)',
      align: 'right'
    })
    ctx.restore()
  }

  if (phase === 'intro') drawIntro()
  else if (s.gameState !== 'playing') drawEnd(s)

  bossEditor.drawModal(ctx, renderer, { VW, VH, INK, rr, circle, text }, clock)
}

// ================= 16关全解锁 · 5大章节选关弹窗 =================
function drawIntro() {
  ctx.fillStyle = 'rgba(28, 30, 48, 0.62)'
  ctx.fillRect(0, 0, VW, VH)

  const x = 14
  const w = VW - 28 // 362
  const activeChap = CHAPTERS.find(c => c.id === introChapter) || CHAPTERS[0]
  const cfg = game.cfg
  const meta = MODE_META[cfg.mode] || MODE_META.stealth
  const bProf = bossEditor.getProfile()

  // 弹窗外框
  rr(x, 30, w, 778, 24, '#fffdf5', INK, 3.5)

  // 1) 顶部主题横幅 (y: 30..92)
  rr(x, 30, w, 62, [24, 24, 0, 0], activeChap.color, INK, 3.5)
  text('牛马求生记：反坑大老板', x + 14, 56, {
    size: 16,
    color: '#ffffff',
    stroke: INK,
    sw: 4.2
  })
  text(`当前怨种老板：【${bProf.name}】· 点右侧可换形象`, x + 14, 78, {
    size: 10,
    color: 'rgba(255,255,255,0.94)'
  })

  // 【👔换老板】入口按钮 + 总星级徽章 + 顶部音乐开关
  rr(INTRO_BOSS_BTN.x, INTRO_BOSS_BTN.y, INTRO_BOSS_BTN.w, INTRO_BOSS_BTN.h, 15, '#ffbe0b', INK, 2.2)
  text('👔换老板', INTRO_BOSS_BTN.x + INTRO_BOSS_BTN.w / 2, 62, {
    size: 10.5,
    color: INK,
    align: 'center'
  })

  rr(266, 43, 64, 30, 15, '#2b2d42', '#ffd166', 2)
  text(`★ ${totalStarsEarned()}/${TOTAL_LEVELS * 3}`, 298, 62.5, {
    size: 10.2,
    color: '#ffd166',
    align: 'center'
  })
  drawMusicIconBtn(INTRO_MUSIC_BTN)

  // 2) 5大章节切换 Tabs (y: 102..144)
  INTRO_TABS.forEach((tb, idx) => {
    const ch = CHAPTERS[idx]
    const sel = ch.id === introChapter
    const shortTag = (ch.title.split(' · ')[1] || ch.title).replace('篇', '')
    const chStars = ch.levels.reduce((acc, lv) => acc + (bests[lv] || 0), 0)
    rr(
      tb.x,
      tb.y - (sel ? 2 : 0),
      tb.w,
      tb.h + (sel ? 2 : 0),
      11,
      sel ? ch.color : '#f1f3f5',
      INK,
      sel ? 2.6 : 1.8
    )
    text(`第${ch.id}章`, tb.x + tb.w / 2, tb.y + 14, {
      size: 10,
      color: sel ? '#ffffff' : '#495057',
      align: 'center'
    })
    text(`${shortTag} ★${chStars}`, tb.x + tb.w / 2, tb.y + 30, {
      size: 8.6,
      color: sel ? '#fff3b0' : '#6c757d',
      align: 'center',
      max: tb.w - 6
    })
  })

  // 章节副标题导语 (y: 150..164)
  text(`${activeChap.title} — ${activeChap.subtitle}`, VW / 2, 161, {
    size: 9.6,
    color: '#495057',
    align: 'center',
    max: w - 24
  })

  // 3) 当前章节关卡卡片列表 (3~4张，全部自由可点！y: 170..252)
  const cards = getIntroLevelCards(introChapter)
  cards.forEach(cd => {
    const lcfg = LEVEL_CONFIGS[cd.lvl]
    const lmeta = MODE_META[lcfg.mode] || MODE_META.stealth
    const sel = cd.lvl === level
    const st = bests[cd.lvl] || 0

    if (sel) {
      rr(cd.x - 1, cd.y + 3, cd.w + 2, cd.h, 14, 'rgba(43,45,66,0.2)', null, 0)
    }
    rr(
      cd.x,
      cd.y - (sel ? 2 : 0),
      cd.w,
      cd.h,
      13,
      sel ? '#fff3b0' : '#ffffff',
      sel ? lmeta.color : INK,
      sel ? 3 : 2
    )

    // 卡片顶部模式彩色角标
    rr(cd.x + 5, cd.y + 5 - (sel ? 2 : 0), cd.w - 10, 18, 9, lmeta.color, null, 0)
    text(`Lv.${cd.lvl} ${lcfg.modeBadge}`, cd.x + cd.w / 2, cd.y + 14.5 - (sel ? 2 : 0), {
      size: cards.length === 4 ? 8.4 : 9.2,
      color: '#ffffff',
      align: 'center',
      base: 'middle',
      max: cd.w - 14
    })

    // 卡片中部关卡短标题
    text(lcfg.title, cd.x + cd.w / 2, cd.y + 44 - (sel ? 2 : 0), {
      size: cards.length === 4 ? 10.2 : 11.5,
      color: INK,
      align: 'center',
      max: cd.w - 8
    })

    // 卡片底部星级记录
    text('★'.repeat(st) + '☆'.repeat(3 - st), cd.x + cd.w / 2, cd.y + 68 - (sel ? 2 : 0), {
      size: 11,
      color: st > 0 ? '#e85d04' : '#adb5bd',
      align: 'center'
    })
  })

  // 分割虚线
  ctx.strokeStyle = 'rgba(43,45,66,0.14)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([5, 4])
  ctx.beginPath()
  ctx.moveTo(x + 16, 263)
  ctx.lineTo(x + w - 16, 263)
  ctx.stroke()
  ctx.setLineDash([])

  // 4) 当前选中关卡详情区 (y: 272..696)
  // 4a. 彩色玩法角标 + 限时 + 场景布局标签
  const badgeLabel = `${meta.icon} 【${cfg.modeBadge}】`
  ctx.font = FONT(11)
  const tagW = ctx.measureText(badgeLabel).width + 18
  rr(x + 16, 271, tagW, 24, 12, meta.color, INK, 2)
  text(badgeLabel, x + 16 + tagW / 2, 283.5, {
    size: 11,
    color: '#ffffff',
    align: 'center',
    base: 'middle'
  })

  const sceneTitle = cfg.sceneName || LAYOUT_NAMES[cfg.layout] || '综合办公区'
  const layoutLabel = `📍 ${sceneTitle} · ⏱${cfg.timeLimit}s`
  text(layoutLabel, x + w - 16, 287, {
    size: 10,
    color: '#5c5470',
    align: 'right',
    max: w - tagW - 42
  })

  // 关卡大标题
  text(`第${level}关 · ${cfg.title}`, VW / 2, 319, {
    size: 19,
    color: INK,
    align: 'center',
    max: w - 30
  })

  // 4b. 一句话目标气泡（只留 2 行，长剧情不再塞进选关页）
  const storyLines = wrapLines(cfg.subtitle || cfg.story || cfg.boss_quote, w - 102, 11).slice(0, 2)
  const qh = Math.max(48, storyLines.length * 15 + 14)
  const qy = 330
  rr(x + 68, qy, w - 84, qh, 13, meta.bg, INK, 2)
  storyLines.forEach((l, i) =>
    text(l, x + 78, qy + 19 + i * 15, { size: 11, color: '#2b2d42' })
  )

  // 左侧Q版立绘（点击立绘也可打开捏老板工坊！）
  if (cfg.mode === 'be_the_boss') {
    renderer.drawChibi(
      x + 38,
      qy + qh / 2 + 6,
      'player',
      Math.PI / 2,
      { crown: true, megaphone: true, moving: true },
      clock
    )
  } else {
    renderer.drawChibi(
      x + 38,
      qy + qh / 2 + 6,
      'boss',
      Math.PI / 2,
      { mood: 'angry', wigLost: level === 4 || level === 16 },
      clock
    )
  }
  rr(x + 12, qy + qh - 12, 52, 16, 8, '#ffbe0b', INK, 1.5)
  text('✏️捏老板', x + 38, qy + qh - 1, { size: 7.8, color: INK, align: 'center' })

  let cy = qy + qh + 14

  // 4c. 目标清单（清晰勾选卡）
  text('🎯 本关目标清单', x + 18, cy + 4, { size: 13, color: INK })
  const curBest = bests[level] || 0
  text(`最佳记录：${'★'.repeat(curBest)}${'☆'.repeat(3 - curBest)}`, x + w - 18, cy + 4, {
    size: 10.5,
    color: curBest > 0 ? '#e85d04' : '#868e96',
    align: 'right'
  })
  cy += 12

  const objs = (
    Array.isArray(cfg.objectives) && cfg.objectives.length > 0
      ? cfg.objectives
      : [{ text: cfg.subtitle }]
  ).slice(0, 3)

  objs.forEach((ob, idx) => {
    const rowH = 27
    rr(x + 16, cy, w - 32, rowH, 8, '#f8f9fa', 'rgba(43,45,66,0.25)', 1.5)
    circle(x + 29, cy + rowH / 2, 8, meta.color, INK, 1.4)
    text(`${idx + 1}`, x + 29, cy + rowH / 2 + 3.2, {
      size: 9,
      color: '#ffffff',
      align: 'center'
    })
    text(ob.text, x + 42, cy + 17.5, { size: 11, color: '#2b2d42', max: w - 66 })
    cy += rowH + 5
  })

  // 4d. 三星条件（与结算判定一致，提前告诉玩家怎么拿星）
  cy += 2
  const starPlan = getStarPlan(cfg)
  rr(x + 16, cy, w - 32, 68, 10, '#f8f9fa', 'rgba(43,45,66,0.25)', 1.5)
  text('🏅 三星条件（结算逐条判定）', x + 26, cy + 16, { size: 11, color: INK })
  starPlan.forEach((p, i) => {
    const rowY = cy + 33 + i * 14
    text('★'.repeat(i + 1), x + 26, rowY, { size: 8.6, color: '#e85d04' })
    text(p.label, x + 72, rowY, { size: 10.2, color: '#495057', max: w - 100 })
  })
  cy += 74

  // 4e. 一句窍门 + 一行短操作（不再堆 3 条提示和长句）
  const tip1 = wrapLines(`💡 ${cfg.hints?.[0] || cfg.subtitle}`, w - 52, 10.5).slice(0, 2)
  const tip2 = wrapLines(`🕹️ ${meta.ctrlShort || meta.ctrl}`, w - 52, 10.5).slice(0, 1)
  const lineH = 15
  const boxH = (tip1.length + tip2.length) * lineH + 16
  const safeBoxH = Math.min(boxH, Math.max(46, 694 - cy))
  rr(x + 16, cy, w - 32, safeBoxH, 12, '#fff3b0', INK, 2)
  let ty = cy + 17
  tip1.forEach(l => {
    if (ty <= cy + safeBoxH - 4) {
      text(l, x + 26, ty, { size: 10.5, color: '#7f5539', max: w - 52 })
      ty += lineH
    }
  })
  tip2.forEach(l => {
    if (ty <= cy + safeBoxH - 4) {
      text(l, x + 26, ty, { size: 10.5, color: '#3a0ca3', max: w - 52 })
      ty += lineH
    }
  })

  // 5) 16关全局进度速跳圆点 (y = 710)
  const dots = getIntroQuickDots()
  dots.forEach(dt => {
    const isCur = dt.lvl === level
    const st = bests[dt.lvl] || 0
    circle(
      dt.x,
      dt.y,
      isCur ? 8.5 : 6.5,
      isCur ? meta.color : st > 0 ? '#ffd166' : '#e9ecef',
      INK,
      isCur ? 2.2 : 1.3
    )
    text(`${dt.lvl}`, dt.x, dt.y + 2.8, {
      size: isCur ? 7.8 : 6.8,
      color: isCur ? '#ffffff' : INK,
      align: 'center'
    })
  })

  // 6) 底部左右翻关 + 【▶ 立刻开工！】脉冲大按钮 (y: 732..788)
  rr(INTRO_PREV.x, INTRO_PREV.y, INTRO_PREV.w, INTRO_PREV.h, 16, '#f1f3f5', INK, 2.5)
  text('◀', INTRO_PREV.x + INTRO_PREV.w / 2, INTRO_PREV.y + 32, { size: 16, align: 'center' })

  rr(INTRO_NEXT.x, INTRO_NEXT.y, INTRO_NEXT.w, INTRO_NEXT.h, 16, '#f1f3f5', INK, 2.5)
  text('▶', INTRO_NEXT.x + INTRO_NEXT.w / 2, INTRO_NEXT.y + 32, { size: 16, align: 'center' })

  const pulse = 1 + Math.sin(clock * 5.5) * 0.032
  ctx.save()
  ctx.translate(INTRO_START.x + INTRO_START.w / 2, INTRO_START.y + INTRO_START.h / 2)
  ctx.scale(pulse, pulse)
  rr(-INTRO_START.w / 2, -INTRO_START.h / 2 + 5, INTRO_START.w, INTRO_START.h, 28, '#1b4332', null, 0)
  rr(-INTRO_START.w / 2, -INTRO_START.h / 2, INTRO_START.w, INTRO_START.h, 28, '#38b000', INK, 3)
  text('▶ 立刻开工！', 0, 7, {
    size: 20,
    color: '#ffffff',
    align: 'center',
    stroke: INK,
    sw: 4.2
  })
  ctx.restore()
}

// ================= 第16关毕业豪华印章绘制 =================
function drawGraduationSeal(cx, cy, elapsed) {
  const slamT = Math.min(1, Math.max(0, (elapsed - 0.25) / 0.28))
  if (slamT <= 0) return
  const scale = slamT < 1 ? 2.1 - 1.1 * (1 - Math.pow(1 - slamT, 3)) : 1 + Math.sin(clock * 4) * 0.02

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(-0.11)
  ctx.scale(scale, scale)

  // 豪华金底红边齿轮印章外环
  burstShape(0, 0, 66, 59, 20, '#fffdf5', '#d90429', 3.2)
  circle(0, 0, 53, 'rgba(217,4,41,0.08)', '#d90429', 2.4)
  circle(0, 0, 47, null, '#ffb703', 1.6)

  // 顶部五角金星
  burstShape(0, -30, 11, 5, 5, '#ffb703', '#d90429', 1.6)

  // 横贯印章的豪华红金绶带
  rr(-78, -11, 156, 26, 8, '#d90429', '#ffb703', 2.4)
  text('荣升反卷传奇', 0, 7, {
    size: 16,
    color: '#ffd166',
    align: 'center',
    stroke: INK,
    sw: 3.5
  })

  // 下半环印文：成功炒掉王总
  rr(-58, 19, 116, 20, 10, '#ffd166', '#d90429', 1.8)
  text('★ 成功炒掉王总 ★', 0, 32.5, {
    size: 10.5,
    color: '#9b0000',
    align: 'center'
  })

  ctx.restore()
}

// ================= 通关 / 翻车漫画结算卡 =================
function drawEnd(s) {
  const won = s.gameState === 'won'
  const isGrandFinale = won && level === TOTAL_LEVELS

  if (!endAt) {
    endAt = clock
    if (!won) {
      sfx('lose')
      buzz([60, 40, 120])
    } else {
      if (isGrandFinale) {
        sfx('grand_win')
        buzz([40, 30, 40, 30, 90])
        spawnPaper(VW / 2 - 70, 260, 26)
        spawnPaper(VW / 2 + 70, 260, 26)
      } else {
        sfx('success')
      }
      if (s.stars > (bests[level] || 0)) {
        bests[level] = s.stars
        saveStars(bests)
      }
    }
  }

  const elapsed = clock - endAt
  const t = Math.min(1, elapsed / 0.32)
  ctx.fillStyle = `rgba(28, 30, 48, ${0.64 * t})`
  ctx.fillRect(0, 0, VW, VH)

  // 第16关毕业持续礼花
  if (isGrandFinale && Math.random() < 0.28) {
    spawn(60 + Math.random() * 270, 190 + Math.random() * 60, ['#ffd166', '#ff006e', '#00bbf9', '#80ed99'], 3, 70)
  }

  const k = 0.72 + 0.28 * (1 - Math.pow(1 - t, 3))
  const cardTop = isGrandFinale ? 176 : 208
  const cardH = isGrandFinale ? 476 : 444

  ctx.save()
  ctx.translate(VW / 2, 420)
  ctx.scale(k, k)
  ctx.translate(-VW / 2, -420)

  rr(22, cardTop, VW - 44, cardH, 26, '#fffdf5', INK, 3.5)
  burstShape(
    VW / 2,
    cardTop + 4,
    isGrandFinale ? 68 : 58,
    isGrandFinale ? 46 : 40,
    12,
    isGrandFinale ? '#ffd166' : won ? '#ffbe0b' : '#ff006e'
  )
  text(
    isGrandFinale ? '传奇毕业!' : won ? '爽快过关!' : '翻车了!',
    VW / 2,
    cardTop + 12,
    {
      size: 22,
      color: '#ffffff',
      align: 'center',
      stroke: INK,
      sw: 5
    }
  )

  text(`第${level}关 · ${game.cfg.title} 【${game.cfg.modeBadge}】`, VW / 2, cardTop + 62, {
    size: 12,
    color: '#5c5470',
    align: 'center'
  })

  if (won) {
    // 三星点亮动画
    const starY = isGrandFinale ? cardTop + 98 : cardTop + 108
    for (let i = 0; i < 3; i++) {
      const lit = i < s.stars && elapsed > 0.28 + i * 0.22
      const sc = lit ? 1 + Math.max(0, 0.2 - (elapsed - 0.28 - i * 0.22)) * 3 : 1
      ctx.save()
      ctx.translate(VW / 2 - 62 + i * 62, starY)
      ctx.scale(sc, sc)
      burstShape(0, 0, 22, 10, 5, lit ? '#ffd166' : '#e9ecef')
      ctx.restore()
    }

    if (isGrandFinale) {
      // 两侧欢庆小人 + 中央《荣升反卷传奇·成功炒掉王总》豪华毕业印章
      renderer.drawChibi(
        76,
        cardTop + 216,
        'player',
        Math.PI / 2,
        { crown: true, moving: true },
        clock
      )
      renderer.drawChibi(
        VW - 76,
        cardTop + 216,
        'boss',
        Math.PI / 2,
        { mood: 'dizzy', wigLost: true, spin: true },
        clock
      )
      drawGraduationSeal(VW / 2, cardTop + 204, elapsed)

      text(
        `🏆 全16关总星级 ★ ${totalStarsEarned()}/${TOTAL_LEVELS * 3}  ·  累计整顿损失 $${s.companyLoss.toLocaleString()}`,
        VW / 2,
        cardTop + 298,
        { size: 11, align: 'center', color: '#d90429', max: VW - 72 }
      )
      text('画饼王总已抱纸箱滚蛋，从此准点18:00神仙下班！', VW / 2, cardTop + 322, {
        size: 11,
        align: 'center',
        color: '#2a9d8f',
        max: VW - 72
      })
      text(
        `⏱ 决战用时 ${(game.cfg.timeLimit - s.timeLeft).toFixed(1)}s  ·  暴击整蛊 ${s.bossPranked} 次`,
        VW / 2,
        cardTop + 346,
        { size: 10.5, align: 'center', color: '#495057' }
      )
      text(
        `🏅 三星：通关 / 失误≤1 / ${game.cfg.parTime}s内或整蛊≥3`,
        VW / 2,
        cardTop + 374,
        { size: 9.5, align: 'center', color: '#7f5539', max: VW - 72 }
      )
    } else {
      const plan = getStarPlan(game.cfg)
      const ach = getStarAchieved(s, game.cfg)
      const critTop = cardTop + 128
      rr(38, critTop, VW - 76, 70, 10, '#f8f9fa', 'rgba(43,45,66,0.22)', 1.5)
      plan.forEach((p, i) => {
        const rowY = critTop + 19 + i * 17
        text(`${ach[i] ? '✅' : '⬜'}`, 52, rowY, { size: 10, color: ach[i] ? '#2a9d8f' : '#adb5bd' })
        text('★'.repeat(i + 1), 78, rowY, { size: 8.8, color: ach[i] ? '#e85d04' : '#adb5bd' })
        text(p.label, 120, rowY, {
          size: 10,
          color: ach[i] ? '#2b2d42' : '#868e96',
          max: VW - 170
        })
      })

      text(
        `⏱ ${(game.cfg.timeLimit - s.timeLeft).toFixed(1)}s · 👀 失误 ${s.spottedCount} · 🤡 整蛊 ${s.bossPranked}`,
        VW / 2,
        cardTop + 214,
        { size: 11.5, align: 'center', color: '#495057', max: VW - 76 }
      )
      text(`💸 王总心理与财产损失 $${s.companyLoss.toLocaleString()}`, VW / 2, cardTop + 236, {
        size: 13.5,
        align: 'center',
        color: '#e85d04',
        max: VW - 76
      })

      const nextCfg = LEVEL_CONFIGS[level + 1]
      if (nextCfg) {
        rr(42, cardTop + 250, VW - 84, 46, 12, '#fff3b0', INK, 1.8)
        text(`🔜 下一关：Lv.${level + 1}【${nextCfg.modeBadge}】${nextCfg.title}`, VW / 2, cardTop + 269, {
          size: 11,
          align: 'center',
          color: '#7f5539',
          max: VW - 100
        })
        text(nextCfg.subtitle, VW / 2, cardTop + 287, {
          size: 9.6,
          align: 'center',
          color: '#5c5470',
          max: VW - 100
        })
      }
    }
  } else {
    renderer.drawChibi(VW / 2 - 42, cardTop + 126, 'boss', Math.PI / 2, { mood: 'angry' }, clock)
    renderer.drawChibi(VW / 2 + 42, cardTop + 126, 'player', Math.PI / 2, { mood: 'dizzy' }, clock)
    const fl = wrapLines(s.failReason || '行动败露，被王总抓去通宵对齐颗粒度！', VW - 92, 12).slice(0, 3)
    fl.forEach((l, i) =>
      text(l, VW / 2, cardTop + 172 + i * 18, { size: 12, align: 'center', color: '#c1121f' })
    )
    text('💡 卡关了？点右上角灯泡看本关破局锦囊，或点选关跳章试玩！', VW / 2, cardTop + 248, {
      size: 10,
      align: 'center',
      color: '#6d597a',
      max: VW - 76
    })
    text(`当前关卡总星级进度：★ ${totalStarsEarned()}/${TOTAL_LEVELS * 3}`, VW / 2, cardTop + 272, {
      size: 10.5,
      align: 'center',
      color: '#495057'
    })
  }

  // 底部三键：📋 选关 | ↻ 重玩 | 下一关 ▶ (1 -> 2 -> ... -> 16)
  rr(END_MENU.x, END_MENU.y, END_MENU.w, END_MENU.h, 24, '#f1f3f5', INK, 2.6)
  text('📋 选关', END_MENU.x + END_MENU.w / 2, END_MENU.y + 30, { size: 14, align: 'center' })

  rr(END_RETRY.x, END_RETRY.y, END_RETRY.w, END_RETRY.h, 24, '#ffd166', INK, 2.6)
  text('↻ 重玩', END_RETRY.x + END_RETRY.w / 2, END_RETRY.y + 30, { size: 14, align: 'center' })

  const hasNext = won && level < TOTAL_LEVELS
  rr(
    END_NEXT.x,
    END_NEXT.y,
    END_NEXT.w,
    END_NEXT.h,
    24,
    hasNext ? '#38b000' : isGrandFinale ? '#d90429' : '#ff006e',
    INK,
    2.8
  )
  text(
    hasNext ? `下一关(${level + 1}) ▶` : isGrandFinale ? '👑 完美重温' : '🔥 不服再战',
    END_NEXT.x + END_NEXT.w / 2,
    END_NEXT.y + 30,
    {
      size: 13.5,
      align: 'center',
      color: '#ffffff',
      stroke: INK,
      sw: 3,
      max: END_NEXT.w - 12
    }
  )

  ctx.restore()
}

// ================= 主渲染与逻辑循环 =================
function loop(t) {
  if (!lastTime) {
    lastTime = t
    resize()
  }
  const realDt = Math.min((t - lastTime) / 1000, 0.05)
  lastTime = t
  clock += realDt
  const dt = realDt * (slowTimer > 0 ? 0.32 : 1)
  if (slowTimer > 0) slowTimer = Math.max(0, slowTimer - realDt)
  if (flash > 0) flash = Math.max(0, flash - realDt)

  if (phase === 'play') {
    if (spotlightTimer > 0) {
      spotlightTimer = Math.max(0, spotlightTimer - realDt)
      if (spotlightTimer <= 0.65) spotlightHold = false
    }

    // 竖屏操控向量 -> 横版世界坐标系转置
    let sx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0)
    let sy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0)
    if (joy.mag > 0.18) {
      sx = joy.dx
      sy = joy.dy
    }

    // 只要玩家推动摇杆或按方向键，开局聚光灯立即解锁定格并平滑淡出
    if (spotlightHold && (Math.abs(sx) > 0.05 || Math.abs(sy) > 0.05)) {
      spotlightHold = false
      spotlightTimer = Math.min(spotlightTimer, 0.48)
    }

    if (!spotlightHold) {
      playElapsed += dt
      const prevKey = lastTargetKey
      const input = { dx: sy, dy: sx, sprint: keys.sprint || joy.mag > 0.9 }
      game.step(dt, input)
      consumeEvents()

      // 多阶段关卡（如Lv1打卡完->回工位、Lv15拉完闸->冲电梯）目标切换时自动点亮下一步聚光灯！
      const nextKey = getTargetKey(game.currentTarget)
      if (
        game.gameState === 'playing' &&
        nextKey &&
        prevKey &&
        nextKey !== prevKey &&
        ['stealth', 'prank_hunt', 'vault_heist', 'blackout_escape'].includes(game.mode)
      ) {
        triggerSpotlight('shift')
      } else {
        lastTargetKey = nextKey
      }

      const pl = game.player
      footTimer -= dt
      if (pl.isMoving && pl.sprinting && !pl.ridingChair && footTimer <= 0) {
        footTimer = 0.1
        const p = P(pl.x, pl.y)
        const a = A(pl.angle)
        const side = footprints.length % 2 ? 1 : -1
        footprints.push({
          x: p.x + Math.cos(a + Math.PI / 2) * 3 * side,
          y: p.y + 6 + Math.sin(a + Math.PI / 2) * 3 * side,
          a,
          life: 1
        })
      }

      // 实时根据剩余时间与追击状态调整背景音乐急促程度！
      if (game.gameState === 'playing') {
        const tl = game.snapshot().timeLeft
        const beingChased =
          ['stealth', 'prank_hunt', 'vault_heist', 'blackout_escape'].includes(game.mode) &&
          game.guards.some(g => g.state === 'chase')
        if (tl <= 7) bgm.setUrgency(2)
        else if (tl <= 15 || beingChased) bgm.setUrgency(1)
        else bgm.setUrgency(0)
      } else {
        bgm.setUrgency(0)
      }
    }
  } else {
    bgm.setUrgency(0)
  }

  ctx.save()
  ctx.clearRect(0, 0, VW, VH)
  if (shake > 0) {
    shake = Math.max(0, shake - realDt)
    ctx.translate((Math.random() - 0.5) * 11 * shake, (Math.random() - 0.5) * 11 * shake)
  }

  // 严格按立体层级调用全新 2.5D 卡通办公区渲染管线
  renderer.drawBackdrop(game, clock)
  renderer.drawFloor(game, clock)
  renderer.drawCones(game, clock)
  renderer.drawFloorFx(game, clock, footprints, dt)
  renderer.drawWalls(game, clock)
  renderer.drawZoneLabels(game, clock)
  renderer.drawProps(game, clock, game.currentTarget)
  renderer.drawFocusOverlay(game, clock)
  renderer.drawProjectilesAndExtras(game, clock)
  renderer.drawCharacters(game, clock)
  renderer.drawLighting(game, clock)
  drawTargetArrow()
  renderer.drawThoughts(game, clock, thoughtSeen)
  drawSpotlightGuide()

  // 自适应 HUD、技能盘与弹窗覆盖层
  drawHUD()
  drawControls()
  drawOverlays(realDt)
  ctx.restore()

  requestAnimationFrame(loop)
}

const debugApi = {
  snapshot: () => ({
    ...game.snapshot(),
    phase,
    introChapter,
    actionDescriptor: game.getActionDescriptor(),
    bestStars: { ...bests }
  }),
  reset: () => loadLevel(level, true),
  start: () => startPlay(),
  openMenu: () => openLevelSelect(),
  loadLevel: (lvl, skipIntro = true) => loadLevel(lvl, skipIntro),
  interact: () => game.interactNearest(),
  secondary: () => game.triggerSecondaryAction(),
  getGame: () => game,
  step: (ms, input) => {
    const n = Math.max(1, Math.floor(ms / (1000 / 60)))
    for (let i = 0; i < n; i++) game.step(1 / 60, input)
    consumeEvents()
    return game.snapshot()
  }
}

globalThis.__OHMYGAME_PLAYTEST__ = debugApi
globalThis.__gameDebug = debugApi

loadLevel(1, false)
requestAnimationFrame(loop)

// 16关独立曲风 + 倒计时急促变奏（Hurry Up!）WebAudio 合成背景音乐引擎

const NOTE_MIDI = {}
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
for (let oct = 1; oct <= 7; oct++) {
  for (let i = 0; i < 12; i++) {
    const midi = (oct + 1) * 12 + i
    NOTE_MIDI[`${NAMES[i]}${oct}`] = midi
  }
}

const midiToHz = m => 440 * Math.pow(2, (m - 69) / 12)
const noteHz = (n, semiShift = 0) => {
  if (!n) return 0
  const m = NOTE_MIDI[n]
  return m ? midiToHz(m + semiShift) : 0
}

// 17 首完全不同的原创曲谱（menu + 第1关~第16关专属编曲，32步 = 2小节16分音符）
const TRACKS = {
  // 选关大厅：温暖茶水间 Bossa Lo-Fi
  menu: {
    bpm: 102,
    swing: 0.02,
    vol: 0.72,
    leadWave: 'sine',
    leadDecay: 0.24,
    bassWave: 'triangle',
    bass: [
      'C2', null, null, 'C2', null, null, 'G2', null,
      'A2', null, null, 'A2', null, null, 'E2', null,
      'D2', null, null, 'D2', null, null, 'A2', null,
      'G2', null, null, 'G2', null, 'G2', 'A2', 'B2'
    ],
    lead: [
      'E5', null, 'G5', null, 'B5', null, 'A5', null,
      'G5', null, 'E5', null, 'C5', null, null, null,
      'F5', null, 'A5', null, 'C6', null, 'A5', null,
      'B5', null, 'G5', null, 'D5', null, null, null
    ],
    chords: { 0: ['E4', 'G4', 'B4'], 8: ['C4', 'E4', 'G4'], 16: ['F4', 'A4', 'C5'], 24: ['D4', 'G4', 'B4'] },
    kick:  [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    hat:   [1,0,1,0, 1,0,1,1, 1,0,1,0, 1,0,1,1, 1,0,1,0, 1,0,1,1, 1,0,1,0, 1,0,1,1]
  },

  // Lv1《卡点打卡》：晨间猫步木琴拨弦（轻松俏皮 A 小调）
  level_1: {
    bpm: 108,
    swing: 0.03,
    vol: 0.82,
    leadWave: 'triangle',
    leadDecay: 0.14,
    bassWave: 'triangle',
    bass: [
      'A2', null, 'E2', null, 'A2', null, 'C3', null,
      'D3', null, 'A2', null, 'E2', null, 'G2', null,
      'A2', null, 'E2', null, 'C3', null, 'D3', null,
      'E3', null, 'D3', null, 'C3', null, 'B2', null
    ],
    lead: [
      'A4', null, 'C5', null, 'E5', null, 'D5', null,
      'C5', null, 'A4', null, 'E4', null, null, null,
      'A4', null, 'C5', 'D5', 'E5', null, 'G5', null,
      'E5', null, 'C5', null, 'A4', null, null, null
    ],
    chords: { 4: ['C4', 'E4', 'A4'], 12: ['D4', 'F4', 'A4'], 20: ['C4', 'E4', 'A4'], 28: ['B3', 'E4', 'G#4'] },
    kick:  [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,1,0],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    hat:   [1,0,1,1, 1,0,1,1, 1,0,1,1, 1,0,1,1, 1,0,1,1, 1,0,1,1, 1,0,1,1, 1,0,1,1]
  },

  // Lv2《螺蛳粉刺客》：滑稽蓝调摇摆（C Blues Swing，酸爽幽默感）
  level_2: {
    bpm: 114,
    swing: 0.036,
    vol: 0.84,
    leadWave: 'sine',
    leadDecay: 0.18,
    bassWave: 'triangle',
    bass: [
      'C2', null, 'E2', null, 'G2', null, 'A2', null,
      'A#2', null, 'A2', null, 'G2', null, 'E2', null,
      'F2', null, 'A2', null, 'C3', null, 'D#3', null,
      'G2', null, 'F2', null, 'E2', null, 'D2', null
    ],
    lead: [
      'C5', null, 'D#5', 'E5', 'G5', null, 'D#5', null,
      'C5', null, 'A#4', null, 'G4', null, null, null,
      'F5', null, 'D#5', null, 'C5', 'D#5', 'F#5', 'F5',
      'D#5', null, 'C5', null, 'G4', null, null, null
    ],
    chords: { 2: ['E4', 'A#4'], 10: ['E4', 'A4'], 18: ['D#4', 'A4'], 26: ['F4', 'B4'] },
    kick:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,1,0],
    snare: [0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,0,0],
    hat:   [1,0,1,1, 1,0,1,1, 1,0,1,1, 1,0,1,1, 1,0,1,1, 1,0,1,1, 1,0,1,1, 1,0,1,1]
  },

  // Lv3《高管厕所占坑王》：007 特工半音阶潜行曲（E Minor Spy Theme）
  level_3: {
    bpm: 120,
    swing: 0.015,
    vol: 0.85,
    leadWave: 'sawtooth',
    leadDecay: 0.14,
    bassWave: 'triangle',
    bass: [
      'E2', null, 'E2', 'E2', 'F2', null, 'F2', null,
      'F#2', null, 'F#2', null, 'F2', null, 'F2', null,
      'E2', null, 'E2', 'E2', 'G2', null, 'F#2', null,
      'F2', null, 'E2', null, 'B1', null, 'D2', null
    ],
    lead: [
      'B4', null, 'G4', 'E4', null, null, 'B4', 'C5',
      'B4', null, 'A#4', null, 'B4', null, null, null,
      'E5', null, 'D5', 'C5', null, 'B4', 'A4', 'G4',
      'F#4', null, 'B4', null, 'E4', null, null, null
    ],
    chords: { 0: ['E4', 'G4', 'B4'], 8: ['E4', 'G4', 'C5'], 16: ['E4', 'G4', 'C#5'], 24: ['D#4', 'F#4', 'B4'] },
    kick:  [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0, 1,0,1,0, 0,1,0,0],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,1,0],
    hat:   [1,1,1,0, 1,1,1,0, 1,1,1,0, 1,1,1,0, 1,1,1,0, 1,1,1,0, 1,1,1,0, 1,1,1,0]
  },

  // Lv4《王总的假发危机》：马戏团波尔卡搞怪风琴（F Major Circus Polka）
  level_4: {
    bpm: 124,
    swing: 0,
    vol: 0.85,
    leadWave: 'square',
    leadDecay: 0.13,
    bassWave: 'triangle',
    bass: [
      'F2', null, 'C3', null, 'F2', null, 'C3', null,
      'G2', null, 'C3', null, 'C2', null, 'G2', null,
      'F2', null, 'C3', null, 'D2', null, 'A2', null,
      'G2', null, 'D3', null, 'C2', 'D2', 'E2', null
    ],
    lead: [
      'F5', 'E5', 'F5', 'G5', 'A5', null, 'C6', null,
      'A#5', 'A5', 'G5', 'F5', 'E5', null, 'C5', null,
      'F5', 'E5', 'F5', 'A5', 'D6', null, 'C6', null,
      'B5', 'A5', 'G5', 'E5', 'F5', null, null, null
    ],
    chords: { 2: ['A4', 'C5', 'F5'], 6: ['A4', 'C5', 'F5'], 10: ['A#4', 'C5', 'E5'], 14: ['A#4', 'C5', 'E5'], 18: ['A4', 'C5', 'F5'], 26: ['G4', 'B4', 'D5'] },
    kick:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,1,0],
    snare: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,1,1,0],
    hat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0]
  },

  // Lv5《人体保龄球滑铁卢》：茶水厅打蜡溜冰场迪斯科放克（D Dorian Disco Funk）
  level_5: {
    bpm: 128,
    swing: 0.015,
    vol: 0.86,
    leadWave: 'sawtooth',
    leadDecay: 0.15,
    bassWave: 'triangle',
    bass: [
      'D2', null, 'D3', null, 'D2', null, 'D3', null,
      'C2', null, 'C3', null, 'A1', null, 'C2', null,
      'G2', null, 'G3', null, 'G2', null, 'F2', null,
      'A2', null, 'G2', null, 'F2', null, 'E2', null
    ],
    lead: [
      'D5', null, 'F5', 'G5', 'A5', null, 'C6', null,
      'B5', 'A5', 'G5', null, 'F5', null, 'D5', null,
      'G5', null, 'A5', 'B5', 'C6', null, 'A5', null,
      'F5', 'E5', 'D5', null, 'A5', null, 'D5', null
    ],
    chords: { 4: ['F4', 'A4', 'C5'], 12: ['E4', 'G4', 'C5'], 20: ['G4', 'B4', 'D5'], 28: ['F4', 'A4', 'D5'] },
    kick:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,1,0],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1],
    hat:   [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,1]
  },

  // Lv6《演讲台暗黑特调》：神秘搞怪探戈（G Harmonic Minor Tango）
  level_6: {
    bpm: 118,
    swing: 0,
    vol: 0.85,
    leadWave: 'triangle',
    leadDecay: 0.17,
    bassWave: 'triangle',
    bass: [
      'G2', null, null, 'D2', null, null, 'G2', null,
      'D2', null, null, 'G2', null, 'A2', 'A#2', null,
      'C3', null, null, 'G2', null, null, 'D#2', null,
      'D2', null, null, 'A2', 'D2', null, 'F#2', null
    ],
    lead: [
      'G5', null, 'F#5', 'G5', 'A#5', null, 'D5', null,
      'D#5', null, 'C5', null, 'D5', null, null, null,
      'C6', null, 'A#5', 'A5', 'G5', null, 'F#5', 'G5',
      'A5', null, 'F#5', null, 'G5', null, null, null
    ],
    chords: { 0: ['G4', 'A#4', 'D5'], 6: ['G4', 'A#4', 'D5'], 16: ['G4', 'C5', 'D#5'], 24: ['F#4', 'A4', 'D5'] },
    kick:  [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0, 1,0,0,1, 1,0,0,0],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,1,0, 0,0,0,0, 1,0,0,0, 0,0,0,0, 1,1,1,0],
    hat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0]
  },

  // Lv7《工位秋名山：飙椅拆加班》：头文字D极速电音漂移（144 BPM Eurobeat Drift）
  level_7: {
    bpm: 144,
    swing: 0,
    vol: 0.88,
    leadWave: 'sawtooth',
    leadDecay: 0.16,
    bassWave: 'triangle',
    bass: [
      'A2', 'A3', 'A2', 'A3', 'A2', 'A3', 'A2', 'A3',
      'F2', 'F3', 'F2', 'F3', 'G2', 'G3', 'G2', 'G3',
      'C2', 'C3', 'C2', 'C3', 'D2', 'D3', 'D2', 'D3',
      'E2', 'E3', 'E2', 'E3', 'E2', 'F2', 'G2', 'G#2'
    ],
    lead: [
      'A5', null, 'E5', 'A5', 'B5', null, 'C6', 'B5',
      'A5', null, 'F5', 'A5', 'G5', null, 'B5', null,
      'C6', null, 'G5', 'C6', 'D6', null, 'A5', 'D6',
      'E6', null, 'D6', 'C6', 'B5', 'C6', 'B5', 'G#5'
    ],
    chords: { 0: ['A4', 'C5', 'E5'], 8: ['F4', 'A4', 'C5'], 12: ['G4', 'B4', 'D5'], 16: ['E4', 'G4', 'C5'], 24: ['E4', 'G#4', 'B4'] },
    kick:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,1,0],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,1,1],
    hat:   [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1]
  },

  // Lv8《砸烂洗脑投影仪》：硬核拆迁摇滚进行曲（140 BPM E Rock Anthem）
  level_8: {
    bpm: 140,
    swing: 0,
    vol: 0.88,
    leadWave: 'square',
    leadDecay: 0.16,
    bassWave: 'triangle',
    bass: [
      'E2', 'E2', 'G2', 'E2', 'A2', 'E2', 'G2', 'E2',
      'D2', 'D2', 'F#2', 'D2', 'A2', 'G2', 'F#2', 'D2',
      'C2', 'C2', 'E2', 'C2', 'D2', 'D2', 'F#2', 'D2',
      'E2', 'E2', 'B2', 'A2', 'G2', 'F#2', 'E2', 'D2'
    ],
    lead: [
      'E5', null, 'G5', null, 'A5', null, 'G5', 'E5',
      'D5', null, 'F#5', null, 'A5', 'G5', 'F#5', null,
      'G5', null, 'C6', null, 'A5', null, 'D6', null,
      'B5', 'A5', 'G5', 'E5', 'B5', null, 'E5', null
    ],
    chords: { 0: ['E4', 'B4'], 8: ['D4', 'A4'], 16: ['C4', 'G4'], 20: ['D4', 'A4'], 24: ['E4', 'B4'] },
    kick:  [1,0,1,0, 0,0,1,0, 1,0,1,0, 0,0,1,0, 1,0,1,0, 0,0,1,0, 1,0,1,0, 1,0,0,0],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,0,0, 0,0,0,0, 1,1,1,0],
    hat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0]
  },

  // Lv9《甩锅乒乓大战》：红白机 8-Bit 乒乓激斗曲（148 BPM C Minor Arcade Duel）
  level_9: {
    bpm: 148,
    swing: 0,
    vol: 0.88,
    leadWave: 'square',
    leadDecay: 0.14,
    bassWave: 'triangle',
    bass: [
      'C2', null, 'G2', null, 'C3', null, 'G2', null,
      'G#1', null, 'D#2', null, 'A#1', null, 'F2', null,
      'C2', null, 'G2', null, 'D#2', null, 'A#2', null,
      'F2', null, 'G2', null, 'C3', 'A#2', 'G2', 'D#2'
    ],
    lead: [
      'C5', 'D5', 'D#5', 'G5', 'C6', null, 'G5', null,
      'G#5', 'G5', 'F5', 'D#5', 'D5', null, 'G5', null,
      'C5', 'D5', 'D#5', 'G5', 'A#5', null, 'D#6', null,
      'D6', 'C6', 'B5', 'G5', 'C6', null, null, null
    ],
    chords: { 0: ['C4', 'D#4', 'G4'], 8: ['G#3', 'C4', 'D#4'], 12: ['A#3', 'D4', 'F4'], 16: ['C4', 'D#4', 'G4'], 24: ['G3', 'B3', 'D4'] },
    kick:  [1,0,0,1, 1,0,0,0, 1,0,0,1, 1,0,0,0, 1,0,0,1, 1,0,0,0, 1,0,1,0, 1,0,1,0],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,1,1],
    hat:   [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1]
  },

  // Lv10《全员摸鱼大救援》：胡闹厨房式欢快切分音狂想曲（136 BPM G Major Ragtime）
  level_10: {
    bpm: 136,
    swing: 0.02,
    vol: 0.86,
    leadWave: 'triangle',
    leadDecay: 0.14,
    bassWave: 'triangle',
    bass: [
      'G2', null, 'D3', null, 'E2', null, 'B2', null,
      'C2', null, 'G2', null, 'D2', null, 'A2', null,
      'G2', null, 'B2', null, 'C3', null, 'C#3', null,
      'D3', null, 'B2', null, 'G2', 'A2', 'B2', 'D3'
    ],
    lead: [
      'G5', 'A5', 'B5', null, 'D6', null, 'B5', 'G5',
      'E5', 'G5', 'A5', null, 'F#5', 'D5', null, null,
      'G5', 'A5', 'B5', 'D6', 'E6', null, 'C6', null,
      'B5', 'D6', 'A5', 'F#5', 'G5', null, null, null
    ],
    chords: { 2: ['B4', 'D5', 'G5'], 6: ['G4', 'B4', 'E5'], 10: ['G4', 'C5', 'E5'], 14: ['F#4', 'A4', 'D5'], 18: ['B4', 'D5', 'G5'], 26: ['A4', 'C5', 'F#5'] },
    kick:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,1,0],
    snare: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,1,1,1],
    hat:   [1,0,1,1, 1,0,1,1, 1,0,1,1, 1,0,1,1, 1,0,1,1, 1,0,1,1, 1,0,1,1, 1,0,1,1]
  },

  // Lv11《反客为主：今天我当王总！》：霸总威风大喇叭进行曲（124 BPM Bb Major Brass March）
  level_11: {
    bpm: 124,
    swing: 0.025,
    vol: 0.86,
    leadWave: 'sawtooth',
    leadDecay: 0.17,
    bassWave: 'triangle',
    bass: [
      'A#1', null, 'F2', null, 'A#1', null, 'F2', null,
      'D#2', null, 'A#2', null, 'F2', null, 'C3', null,
      'A#1', null, 'D2', null, 'D#2', null, 'E2', null,
      'F2', null, 'C2', null, 'F2', 'G2', 'A2', null
    ],
    lead: [
      'A#4', null, 'A#4', 'D5', 'F5', null, 'D5', null,
      'G5', null, 'F5', 'D#5', 'F5', null, 'C5', null,
      'D5', null, 'F5', null, 'G5', 'A5', 'A#5', null,
      'C6', 'A#5', 'A5', 'F5', 'A#5', null, null, null
    ],
    chords: { 0: ['D4', 'F4', 'A#4'], 8: ['D#4', 'G4', 'A#4'], 12: ['F4', 'A4', 'C5'], 16: ['D4', 'F4', 'A#4'], 24: ['D#4', 'F4', 'A4'] },
    kick:  [1,0,0,0, 1,0,0,1, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,1, 1,0,1,0, 1,0,0,0],
    snare: [0,0,0,0, 1,0,1,0, 0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,1,0, 0,0,0,0, 1,1,1,0],
    hat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0]
  },

  // Lv12《17:59 下班保卫战》：洗脑工位塔防律动（134 BPM B Minor Quirky Defense）
  level_12: {
    bpm: 134,
    swing: 0.01,
    vol: 0.86,
    leadWave: 'square',
    leadDecay: 0.14,
    bassWave: 'triangle',
    bass: [
      'B1', null, 'F#2', null, 'B2', null, 'F#2', null,
      'G2', null, 'D3', null, 'A2', null, 'E3', null,
      'B1', null, 'F#2', null, 'G2', null, 'E2', null,
      'F#2', null, 'C#2', null, 'F#2', 'G2', 'A2', 'A#2'
    ],
    lead: [
      'B4', 'D5', 'F#5', null, 'E5', 'D5', 'C#5', null,
      'B4', 'D5', 'G5', null, 'F#5', 'E5', 'D5', null,
      'B4', 'D5', 'F#5', 'B5', 'A5', 'G5', 'E5', null,
      'F#5', null, 'A#5', null, 'B5', null, null, null
    ],
    chords: { 0: ['D4', 'F#4', 'B4'], 8: ['D4', 'G4', 'B4'], 12: ['C#4', 'E4', 'A4'], 16: ['D4', 'F#4', 'B4'], 24: ['C#4', 'F#4', 'A#4'] },
    kick:  [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0, 1,0,1,0, 1,0,0,0],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,1,0],
    hat:   [1,1,0,1, 1,1,0,1, 1,1,0,1, 1,1,0,1, 1,1,0,1, 1,1,0,1, 1,1,0,1, 1,1,1,1]
  },

  // Lv13《碎纸机狂想曲》：野蜂飞舞式极速抢合同（146 BPM D Minor Chromatic Rush）
  level_13: {
    bpm: 146,
    swing: 0,
    vol: 0.88,
    leadWave: 'triangle',
    leadDecay: 0.12,
    bassWave: 'triangle',
    bass: [
      'D2', null, 'A2', null, 'D2', null, 'A2', null,
      'G2', null, 'D3', null, 'A2', null, 'E2', null,
      'D2', null, 'F2', null, 'G2', null, 'G#2', null,
      'A2', null, 'G2', null, 'F2', null, 'E2', null
    ],
    lead: [
      'A5', 'G#5', 'G5', 'F#5', 'F5', 'E5', 'D#5', 'D5',
      'F5', 'E5', 'D#5', 'D5', 'C#5', 'D5', 'E5', 'A5',
      'D6', 'C#6', 'C6', 'B5', 'A#5', 'A5', 'G#5', 'G5',
      'F5', 'A5', 'D6', 'A5', 'F5', 'E5', 'D5', null
    ],
    chords: { 0: ['D4', 'F4', 'A4'], 8: ['D4', 'G4', 'A#4'], 12: ['C#4', 'E4', 'A4'], 16: ['D4', 'F4', 'A4'], 24: ['C#4', 'E4', 'G4'] },
    kick:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,1,0],
    snare: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,1,1,0],
    hat:   [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1]
  },

  // Lv14《年终奖大劫案》：金库谍战酷爵士（126 BPM F# Minor Vault Heist）
  level_14: {
    bpm: 126,
    swing: 0.025,
    vol: 0.85,
    leadWave: 'sine',
    leadDecay: 0.2,
    bassWave: 'triangle',
    bass: [
      'F#2', null, 'F#2', null, 'A2', null, 'B2', null,
      'C#3', null, 'B2', null, 'A2', null, 'E2', null,
      'D2', null, 'D2', null, 'F#2', null, 'A2', null,
      'G#2', null, 'F#2', null, 'F2', null, 'C#2', null
    ],
    lead: [
      'F#5', null, 'A5', null, 'C#6', null, 'B5', 'A5',
      'G#5', null, 'F#5', null, 'C#5', null, null, null,
      'D5', null, 'F#5', null, 'A5', null, 'C#6', 'B5',
      'G#5', null, 'F5', null, 'C#5', null, null, null
    ],
    chords: { 4: ['F#4', 'A4', 'C#5'], 12: ['E4', 'G#4', 'B4'], 20: ['D4', 'F#4', 'A4'], 28: ['C#4', 'F4', 'G#4'] },
    kick:  [1,0,0,1, 0,0,1,0, 0,0,1,0, 1,0,0,0, 1,0,0,1, 0,0,1,0, 0,0,1,0, 1,0,0,0],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,1,0],
    hat:   [1,0,1,1, 1,0,1,1, 1,0,1,1, 1,0,1,1, 1,0,1,1, 1,0,1,1, 1,0,1,1, 1,0,1,1]
  },

  // Lv15《拉闸断电：准点下班》：赛博黑夜手电筒脉冲电音（130 BPM C Dorian Night Pulse）
  level_15: {
    bpm: 130,
    swing: 0,
    vol: 0.86,
    leadWave: 'triangle',
    leadDecay: 0.16,
    bassWave: 'sawtooth',
    bass: [
      'C2', 'C3', 'C2', 'C3', 'D#2', 'C3', 'F2', 'C3',
      'G2', 'G2', 'F2', 'D#2', 'D2', 'C2', 'A#1', 'G1',
      'G#1', 'G#2', 'G#1', 'G#2', 'A#1', 'A#2', 'A#1', 'A#2',
      'C2', 'C3', 'D#2', 'F2', 'G2', 'F2', 'D#2', 'D2'
    ],
    lead: [
      'G5', null, 'D#5', 'C5', null, 'G5', 'A5', null,
      'A#5', null, 'G5', 'F5', 'D#5', null, 'C5', null,
      'D#5', null, 'G#5', null, 'F5', null, 'A#5', null,
      'C6', null, 'A#5', 'G5', 'F5', 'D#5', 'C5', null
    ],
    chords: { 0: ['C4', 'D#4', 'G4'], 8: ['D4', 'F4', 'A4'], 16: ['G#3', 'C4', 'D#4'], 20: ['A#3', 'D4', 'F4'], 24: ['C4', 'D#4', 'G4'] },
    kick:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,1,0],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1],
    hat:   [0,0,1,1, 0,0,1,1, 0,0,1,1, 0,0,1,1, 0,0,1,1, 0,0,1,1, 0,0,1,1, 0,0,1,1]
  },

  // Lv16《终极决战：炒掉画饼王总！》：88楼三阶段魔王决战交响（154 BPM E Phrygian Boss Finale）
  level_16: {
    bpm: 154,
    swing: 0,
    vol: 0.92,
    leadWave: 'sawtooth',
    leadDecay: 0.17,
    bassWave: 'triangle',
    bass: [
      'E2', 'E2', 'E3', 'E2', 'F2', 'E2', 'G#2', 'E2',
      'A2', 'E2', 'B2', 'E2', 'C3', 'B2', 'A2', 'G#2',
      'F2', 'F2', 'F3', 'F2', 'D2', 'D2', 'D3', 'D2',
      'E2', 'E2', 'B2', 'A2', 'G#2', 'F2', 'E2', 'B1'
    ],
    lead: [
      'E5', null, 'F5', 'G#5', 'A5', null, 'B5', 'A5',
      'G#5', 'B5', 'E6', null, 'D6', 'C6', 'B5', null,
      'C6', null, 'A5', 'F5', 'D6', null, 'B5', 'G#5',
      'E6', 'D6', 'C6', 'B5', 'A5', 'G#5', 'E5', null
    ],
    chords: { 0: ['E4', 'G#4', 'B4'], 8: ['E4', 'A4', 'C5'], 16: ['F4', 'A4', 'C5'], 20: ['D4', 'F4', 'B4'], 24: ['E4', 'G#4', 'B4'] },
    kick:  [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0, 1,1,1,0],
    snare: [0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,0,1, 0,0,0,0, 1,1,1,1],
    hat:   [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1]
  }
}

export function createBgmController() {
  let ctx = null
  let masterGain = null
  let filter = null
  let noiseBuf = null
  let timerId = null
  let enabled = true
  let unlocked = false
  let currentTrack = 'menu'
  let urgency = 0 // 0=正常, 1=剩余<=12s急促加速, 2=剩余<=6s极限冲刺!
  let stepIdx = 0
  let nextStepTime = 0
  let duckUntil = 0

  function ensureContext() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return null
      ctx = new AC()
      masterGain = ctx.createGain()
      masterGain.gain.value = enabled ? 0.22 : 0.0001
      filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 3400
      filter.Q.value = 0.75
      filter.connect(masterGain)
      masterGain.connect(ctx.destination)

      const len = Math.floor(ctx.sampleRate * 0.15)
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate)
      const data = noiseBuf.getChannelData(0)
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
    }
    return ctx
  }

  function playBass(freq, wave, t, dur, vol) {
    if (!freq) return
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = wave || 'triangle'
    o.frequency.setValueAtTime(freq, t)
    const peak = wave === 'sawtooth' ? vol * 0.55 : vol
    g.gain.setValueAtTime(0.001, t)
    g.gain.linearRampToValueAtTime(peak, t + 0.012)
    g.gain.exponentialRampToValueAtTime(0.001, t + dur)
    o.connect(g)
    g.connect(filter)
    o.start(t)
    o.stop(t + dur + 0.02)
  }

  function playLead(freq, wave, t, dur, vol) {
    if (!freq) return
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = wave
    o.frequency.setValueAtTime(freq, t)
    const peak = wave === 'square' || wave === 'sawtooth' ? vol * 0.5 : vol * 0.88
    g.gain.setValueAtTime(0.001, t)
    g.gain.linearRampToValueAtTime(peak, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.001, t + dur)
    o.connect(g)
    g.connect(filter)
    o.start(t)
    o.stop(t + dur + 0.02)
  }

  function playChord(notes, semiShift, t, dur, vol) {
    for (const n of notes) {
      const f = noteHz(n, semiShift)
      if (!f) continue
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.setValueAtTime(f, t)
      g.gain.setValueAtTime(0.001, t)
      g.gain.linearRampToValueAtTime(vol, t + 0.016)
      g.gain.exponentialRampToValueAtTime(0.001, t + dur)
      o.connect(g)
      g.connect(filter)
      o.start(t)
      o.stop(t + dur + 0.02)
    }
  }

  function playKick(t, vol) {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.setValueAtTime(140, t)
    o.frequency.exponentialRampToValueAtTime(38, t + 0.085)
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.1)
    o.connect(g)
    g.connect(masterGain)
    o.start(t)
    o.stop(t + 0.11)
  }

  function playHat(t, dur, hpFreq, vol) {
    if (!noiseBuf) return
    const src = ctx.createBufferSource()
    src.buffer = noiseBuf
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = hpFreq
    const g = ctx.createGain()
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + dur)
    src.connect(hp)
    hp.connect(g)
    g.connect(masterGain)
    src.start(t)
    src.stop(t + dur + 0.01)
  }

  // 倒计时急促秒表滴答声 + 警报催促音
  function playUrgentTick(t, high, vol) {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'triangle'
    o.frequency.setValueAtTime(high ? 1760 : 1320, t)
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.035)
    o.connect(g)
    g.connect(masterGain)
    o.start(t)
    o.stop(t + 0.04)
  }

  // 进入最后12秒时触发经典街机“Hurry Up!”三连急促提示音
  function playHurryJingle() {
    if (!enabled || !ctx || ctx.state !== 'running') return
    const now = ctx.currentTime
    const notes = [587.33, 659.25, 698.46, 880]
    notes.forEach((f, i) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'square'
      o.frequency.setValueAtTime(f, now + i * 0.065)
      g.gain.setValueAtTime(0.09, now + i * 0.065)
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.065 + 0.06)
      o.connect(g)
      g.connect(masterGain)
      o.start(now + i * 0.065)
      o.stop(now + i * 0.065 + 0.065)
    })
  }

  function scheduleStep(idx, t) {
    if (!enabled || document.hidden) return
    const tr = TRACKS[currentTrack] || TRACKS.level_1
    const duck = t < duckUntil ? 0.25 : 1
    // 急促模式下升调（+2 / +4 半音）并拉高亮度
    const semiShift = urgency === 2 ? 4 : urgency === 1 ? 2 : 0
    const urgBoost = urgency === 2 ? 1.16 : urgency === 1 ? 1.08 : 1
    const v = tr.vol * duck * urgBoost

    const bNote = tr.bass[idx]
    if (bNote) {
      playBass(noteHz(bNote, semiShift), tr.bassWave, t, urgency > 0 ? 0.16 : 0.22, 0.34 * v)
    } else if (urgency > 0 && idx % 2 === 0) {
      // 急促模式下自动补密八度驱动贝斯，节奏感瞬间拉满！
      const fallback = tr.bass[(idx + 30) % 32]
      if (fallback) playBass(noteHz(fallback, semiShift + 12), 'triangle', t, 0.11, 0.22 * v)
    }

    const lNote = tr.lead[idx]
    if (lNote) {
      playLead(noteHz(lNote, semiShift), tr.leadWave, t, urgency > 0 ? tr.leadDecay * 0.8 : tr.leadDecay, 0.23 * v)
    }

    const ch = tr.chords[idx]
    if (ch) playChord(ch, semiShift, t, urgency > 0 ? 0.2 : 0.28, 0.085 * v)

    // 鼓组在急促模式下自动加密！
    const kickHit = tr.kick[idx] || (urgency > 0 && idx % 4 === 0)
    const snareHit = tr.snare[idx] || (urgency === 2 && idx % 4 === 2)
    const hatHit = tr.hat[idx] || urgency > 0

    if (kickHit) playKick(t, 0.27 * v)
    if (snareHit) playHat(t, 0.08, 1650, 0.14 * v)
    else if (hatHit) playHat(t, 0.03, 6800, (idx % 2 === 0 ? 0.07 : 0.045) * v)

    // 倒计时急促秒表催促声（<=12s 每半拍滴答，<=6s 每16分音符高频催促！）
    if (urgency === 1 && idx % 2 === 0) {
      playUrgentTick(t, idx % 4 === 0, 0.055 * duck)
    } else if (urgency === 2) {
      playUrgentTick(t, idx % 2 === 0, 0.075 * duck)
    }
  }

  function tick() {
    if (!ctx || ctx.state !== 'running') return
    const tr = TRACKS[currentTrack] || TRACKS.level_1
    // 急促模式下 BPM 飙升（urgency=1 提速 28%，urgency=2 提速 45%！）
    const speedMult = urgency === 2 ? 1.45 : urgency === 1 ? 1.28 : 1
    const effBpm = tr.bpm * speedMult
    const stepDur = 60 / effBpm / 4
    const now = ctx.currentTime
    if (nextStepTime < now - 0.1) nextStepTime = now + 0.02

    while (nextStepTime < now + 0.18) {
      const swingOffset = urgency > 0 ? 0 : stepIdx % 2 === 1 ? tr.swing : 0
      scheduleStep(stepIdx, nextStepTime + swingOffset)
      nextStepTime += stepDur
      stepIdx = (stepIdx + 1) % 32
    }
  }

  function startScheduler() {
    if (timerId) return
    timerId = window.setInterval(tick, 60)
  }

  function unlock() {
    try {
      const c = ensureContext()
      if (!c) return null
      if (c.state === 'suspended') c.resume()
      if (!unlocked) {
        const b = c.createBuffer(1, 1, 22050)
        const s = c.createBufferSource()
        s.buffer = b
        s.connect(c.destination)
        s.start(0)
        unlocked = true
      }
      startScheduler()
      return c
    } catch {
      return null
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (!ctx) return
    if (document.hidden) {
      ctx.suspend?.()
    } else if (enabled && unlocked) {
      ctx.resume?.()
      nextStepTime = ctx.currentTime + 0.05
    }
  })

  return {
    unlock,
    getContext: () => ensureContext(),
    isPlaying: () => Boolean(enabled && ctx && ctx.state === 'running'),
    isEnabled: () => enabled,
    getUrgency: () => urgency,
    getCurrentTrack: () => currentTrack,
    setEnabled(val) {
      enabled = Boolean(val)
      const c = unlock()
      if (c && masterGain) {
        const now = c.currentTime
        masterGain.gain.cancelScheduledValues(now)
        masterGain.gain.setTargetAtTime(enabled ? 0.22 : 0.0001, now, 0.04)
      }
    },
    toggle() {
      this.setEnabled(!enabled)
      return enabled
    },
    setTrack(name) {
      if (name && TRACKS[name] && currentTrack !== name) {
        currentTrack = name
        stepIdx = 0
      }
    },
    setLevelTrack(levelNum, isMenu = false) {
      const target = isMenu ? 'menu' : `level_${Math.max(1, Math.min(16, Number(levelNum) || 1))}`
      this.setTrack(target)
    },
    setUrgency(lvl) {
      const next = Math.max(0, Math.min(2, Number(lvl) || 0))
      if (next === urgency) return
      const prev = urgency
      urgency = next
      if (filter && ctx) {
        filter.frequency.setTargetAtTime(urgency === 2 ? 5600 : urgency === 1 ? 4500 : 3400, ctx.currentTime, 0.08)
      }
      if (prev === 0 && next >= 1) {
        playHurryJingle()
      }
    },
    duck(sec = 0.8) {
      if (ctx) duckUntil = Math.max(duckUntil, ctx.currentTime + sec)
    }
  }
}

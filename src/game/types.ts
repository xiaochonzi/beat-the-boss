export type WeaponId = 'whip' | 'slap' | 'slipper' | 'keyboard' | 'chair' | 'hammer' | 'bat' | 'fish'

export interface WeaponConfig {
  id: WeaponId
  name: string
  icon: string
  power: number
  unlockStress: number
  hint: string
}

export interface BossLook {
  seed: number
  skin: number
  suit: number
  hair: number
  tie: number
  glasses: boolean
  body: number
}

export interface GameStats {
  stress: number
  combo: number
  maxCombo: number
  destruction: number
  hits: number
  slipperHits: number
  bestWeapon: string
  rage: boolean
  rageRemaining: number
}

export interface GameEvents {
  onHit: (points: number, label: string, x: number, y: number) => void
  onStats: (stats: GameStats) => void
  onDialogue: (text: string) => void
  onAchievement: (id: string, name: string) => void
  onRageEnd: () => void
}

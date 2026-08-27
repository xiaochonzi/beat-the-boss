export class AudioManager {
  private ctx?: AudioContext
  enabled = true
  volume = .6

  private context() {
    this.ctx ??= new AudioContext()
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return this.ctx
  }

  tone(kind: 'hit' | 'combo' | 'unlock' | 'rage' | 'whoosh', strength = 1) {
    if (!this.enabled) return
    const ctx = this.context()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const now = ctx.currentTime
    const freq = { hit: 120, combo: 420, unlock: 660, rage: 75, whoosh: 220 }[kind]
    osc.type = kind === 'hit' || kind === 'rage' ? 'sawtooth' : 'sine'
    osc.frequency.setValueAtTime(freq * (.9 + Math.random() * .2), now)
    osc.frequency.exponentialRampToValueAtTime(Math.max(45, freq * (kind === 'combo' ? 1.8 : .45)), now + .16)
    gain.gain.setValueAtTime(Math.min(.15, .04 * strength) * this.volume, now)
    gain.gain.exponentialRampToValueAtTime(.0001, now + .18)
    osc.connect(gain).connect(ctx.destination)
    osc.start(now); osc.stop(now + .19)
  }
}

/**
 * Soft, low Web Audio tones — no asset files needed.
 * Clicks sit around 160–240Hz with quick decay so they stay calm on mobile.
 */
class GameAudio {
  private ctx: AudioContext | null = null
  private unlocked = false
  private gatherTimer: number | null = null

  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!Ctx) return null
      this.ctx = new Ctx()
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    this.unlocked = true
    return this.ctx
  }

  unlock() {
    this.ensure()
  }

  /** Soft wooden tap — used for every UI / world touch. */
  click() {
    const ctx = this.ensure()
    if (!ctx || !this.unlocked) return
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(188, t)
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.08)
    filter.type = 'lowpass'
    filter.frequency.value = 520
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.045, t + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12)
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.14)
  }

  step() {
    const ctx = this.ensure()
    if (!ctx || !this.unlocked) return
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = 95
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.03, t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.18)
  }

  gatherPulse(kind: 'wood' | 'ore' = 'wood') {
    const ctx = this.ensure()
    if (!ctx || !this.unlocked) return
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = kind === 'wood' ? 140 : 110
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.035, t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.2)
  }

  startGatherLoop(kind: 'wood' | 'ore' = 'wood') {
    this.stopGatherLoop()
    this.gatherPulse(kind)
    this.gatherTimer = window.setInterval(
      () => this.gatherPulse(kind),
      kind === 'wood' ? 700 : 800,
    )
  }

  stopGatherLoop() {
    if (this.gatherTimer != null) {
      clearInterval(this.gatherTimer)
      this.gatherTimer = null
    }
  }

  bank() {
    const ctx = this.ensure()
    if (!ctx || !this.unlocked) return
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(220, t)
    osc.frequency.exponentialRampToValueAtTime(160, t + 0.1)
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.04, t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.22)
  }

  hit() {
    const ctx = this.ensure()
    if (!ctx || !this.unlocked) return
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = 90
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.028, t + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.12)
  }

  craft() {
    const ctx = this.ensure()
    if (!ctx || !this.unlocked) return
    const t = ctx.currentTime
    for (const [i, freq] of [160, 200].entries()) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const start = t + i * 0.07
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.035, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 0.24)
    }
  }
}

export const audio = new GameAudio()

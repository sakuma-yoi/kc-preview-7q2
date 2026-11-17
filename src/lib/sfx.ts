// 効果音（短い電子音）。設定でオフにできる

let ctx: AudioContext | null = null
let enabled = true

export const setSfxEnabled = (on: boolean) => {
  enabled = on
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.12) {
  if (!ctx) return
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.value = freq
  g.gain.setValueAtTime(vol, ctx.currentTime + start)
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur)
  o.connect(g).connect(ctx.destination)
  o.start(ctx.currentTime + start)
  o.stop(ctx.currentTime + start + dur)
}

export function sfx(name: 'ok' | 'ng' | 'tap' | 'stamp' | 'win' | 'scan' | 'coin' | 'soft') {
  if (!enabled) return
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    if (name === 'ok') {
      tone(880, 0, 0.12)
      tone(1320, 0.1, 0.2)
    } else if (name === 'ng') {
      tone(220, 0, 0.25, 'triangle', 0.16)
    } else if (name === 'tap') {
      tone(660, 0, 0.06, 'sine', 0.06)
    } else if (name === 'soft') {
      tone(660, 0, 0.12)
      tone(880, 0.1, 0.14, 'sine', 0.08)
    } else if (name === 'scan') {
      tone(1760, 0, 0.08, 'square', 0.05)
    } else if (name === 'coin') {
      tone(1320, 0, 0.05, 'triangle', 0.08)
      tone(1980, 0.04, 0.08, 'triangle', 0.06)
    } else if (name === 'stamp') {
      tone(140, 0, 0.12, 'triangle', 0.22)
    } else {
      ;[784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.11, 0.25))
    }
  } catch {
    // 音が出せない環境では何もしない
  }
}

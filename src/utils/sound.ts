/**
 * เสียงแจ้งเตือนออเดอร์ใหม่
 * -------------------------------------------------------------
 * สร้างเสียงด้วย Web Audio API ไม่ต้องโหลดไฟล์เสียง
 *  - ไม่มี asset เพิ่มใน bundle
 *  - ทำงานได้แม้ออฟไลน์ (สำคัญตอน present)
 *
 * ข้อจำกัดของเบราว์เซอร์: autoplay ถูกบล็อกจนกว่าผู้ใช้จะมี interaction
 * กับหน้าเว็บก่อน จึงต้องเรียก unlockAudio() จาก user gesture ครั้งแรก
 */

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  return ctx
}

/** เรียกจาก user gesture (click/keydown) เพื่อปลดล็อก autoplay */
export function unlockAudio() {
  const c = getCtx()
  if (c && c.state === 'suspended') void c.resume()
}

/** true = เบราว์เซอร์ยังบล็อกเสียงอยู่ (ยังไม่มี interaction) */
export function isAudioBlocked() {
  return !ctx || ctx.state !== 'running'
}

/** เสียงกริ่ง 3 โน้ตไล่ขึ้น — สั้น ไม่รบกวน แต่ได้ยินในครัวที่มีเสียงรบกวน */
export function playNewOrderChime() {
  const c = getCtx()
  if (!c) return
  if (c.state === 'suspended') void c.resume()

  const now = c.currentTime
  const notes = [880, 1108.73, 1318.51] // A5 · C#6 · E6

  notes.forEach((freq, i) => {
    const osc = c.createOscillator()
    const gain = c.createGain()
    const t = now + i * 0.13

    osc.type = 'sine'
    osc.frequency.value = freq

    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.22, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.34)

    osc.connect(gain)
    gain.connect(c.destination)
    osc.start(t)
    osc.stop(t + 0.4)
  })
}

/** ให้ผู้ใช้กดลองฟังในหน้าตั้งค่า */
export function testChime() {
  unlockAudio()
  playNewOrderChime()
}

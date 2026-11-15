import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { toast } from '../store/useToast'
import { isAudioBlocked, playNewOrderChime, unlockAudio } from '../utils/sound'

const PREF_KEY = 'lita-sound-on'

function readPref() {
  try {
    return localStorage.getItem(PREF_KEY) !== 'off'
  } catch {
    return true
  }
}

const FRESH_WINDOW_MS = 60_000

/**
 * เฝ้าดูออเดอร์ใหม่ที่เข้ามา แล้วแจ้งเตือนด้วยเสียง + toast
 * ใช้ใน AdminLayout เพื่อให้ได้ยินทุกหน้าฝั่งร้าน ไม่ใช่เฉพาะกระดานครัว
 *
 * เงื่อนไขการแจ้ง 2 ชั้น กันแจ้งย้อนหลัง:
 *   1. ยังไม่เคยแจ้ง id นี้
 *   2. createdAt อยู่ภายใน 60 วินาทีที่ผ่านมา
 * ชั้นที่ 2 สำคัญ เพราะตอน rehydrate ข้ามแท็บ หรือเปิดหน้าใหม่
 * store จะโหลดออเดอร์เก่าเข้ามาทีเดียว ซึ่งไม่ใช่ออเดอร์ใหม่
 * (ข้ามแท็บทำงานได้ เพราะ store sync ผ่าน storage event อยู่แล้ว)
 */
export function useNewOrderAlert() {
  const orders = useAppStore((s) => s.orders)
  const [soundOn, setSoundOn] = useState(readPref)
  const seen = useRef<Set<string> | null>(null)
  const [blocked, setBlocked] = useState(false)

  // ปลดล็อก autoplay จาก interaction แรกของผู้ใช้
  useEffect(() => {
    const unlock = () => {
      unlockAudio()
      setBlocked(false)
    }
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  useEffect(() => {
    const pending = orders.filter((o) => o.status === 'PENDING')

    // ครั้งแรก: จำ id ที่มีอยู่ ไม่ต้องแจ้งย้อนหลัง
    if (seen.current === null) {
      seen.current = new Set(pending.map((o) => o.id))
      return
    }

    const now = Date.now()
    const fresh = pending.filter(
      (o) => !seen.current!.has(o.id) && now - new Date(o.createdAt).getTime() < FRESH_WINDOW_MS,
    )
    // ออเดอร์เก่าที่เพิ่งโหลดเข้ามา ถือว่ารับรู้แล้ว จะได้ไม่แจ้งทีหลัง
    for (const o of pending) seen.current!.add(o.id)
    if (fresh.length) {
      if (soundOn) {
        playNewOrderChime()
        if (isAudioBlocked()) setBlocked(true)
      }
      toast(
        fresh.length === 1
          ? `ออเดอร์ใหม่ ${fresh[0].queueNo}${fresh[0].tableNo ? ` · โต๊ะ ${fresh[0].tableNo}` : ' · ซื้อกลับ'}`
          : `ออเดอร์ใหม่ ${fresh.length} รายการ`,
      )
    }

    // ออเดอร์ที่ออกจาก PENDING แล้ว เอาออกจาก set กันบวม
    const ids = new Set(pending.map((o) => o.id))
    for (const id of seen.current) if (!ids.has(id)) seen.current.delete(id)
  }, [orders, soundOn])

  const toggle = () => {
    const next = !soundOn
    setSoundOn(next)
    try {
      localStorage.setItem(PREF_KEY, next ? 'on' : 'off')
    } catch {
      /* โหมด private อาจเขียนไม่ได้ — ไม่เป็นไร */
    }
    if (next) {
      unlockAudio()
      playNewOrderChime()
      setBlocked(false)
    }
  }

  return { soundOn, toggle, blocked }
}

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

/**
 * QR code สร้างฝั่ง browser ด้วย lib qrcode → ไม่ต้องยิง API ภายนอก
 * ทำงานได้ตอนออฟไลน์ และพิมพ์ออกกระดาษได้คมเพราะ render ที่ 2 เท่าของขนาดแสดงผล
 */
export function QrCode({ value, size = 120, className = '' }: { value: string; size?: number; className?: string }) {
  const [src, setSrc] = useState('')

  useEffect(() => {
    let alive = true
    QRCode.toDataURL(value, {
      width: size * 3,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#17261E', light: '#FFFFFF' },
    })
      .then((d) => alive && setSrc(d))
      .catch(() => alive && setSrc(''))
    return () => {
      alive = false
    }
  }, [value, size])

  if (!src) return <div style={{ width: size, height: size }} className={`animate-pulse rounded-lg bg-lita-50 ${className}`} />
  return <img src={src} width={size} height={size} alt="QR code ติดตามสถานะออเดอร์" className={className} />
}

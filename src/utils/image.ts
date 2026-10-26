/**
 * ย่อรูปฝั่ง Browser ก่อนเก็บ
 * -------------------------------------------------------------
 * Demo นี้เก็บรูปเป็น data URL ใน localStorage ซึ่งมีเพดานราว 5 MB ต่อ origin
 * จึง crop เป็นสี่เหลี่ยมจัตุรัส + ย่อเหลือด้านละ 400px + บีบเป็น JPEG
 * ได้ไฟล์ราว 30-45 KB ต่อรูป (เก็บได้ราว 80-100 เมนู)
 *
 * ตอนต่อ Backend จริง: เปลี่ยนเป็น upload ขึ้น object storage (S3/GCS)
 * แล้วเก็บเฉพาะ URL ลง DB — ฟังก์ชันนี้ยังใช้ย่อก่อนส่งได้เหมือนเดิม
 */

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

export async function fileToSquareDataUrl(file: File, size = 400, quality = 0.7): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('ไฟล์ที่เลือกไม่ใช่รูปภาพ')
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('ไฟล์ใหญ่เกิน 10 MB')

  const bitmap = await createImageBitmap(file)
  try {
    // crop กลางภาพให้เป็นจัตุรัส กันรูปยืดตอนแสดงใน thumbnail
    const side = Math.min(bitmap.width, bitmap.height)
    const sx = (bitmap.width - side) / 2
    const sy = (bitmap.height - side) / 2
    const out = Math.min(size, side)

    const canvas = document.createElement('canvas')
    canvas.width = out
    canvas.height = out
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('เบราว์เซอร์นี้ไม่รองรับการย่อรูป')
    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, out, out)

    return canvas.toDataURL('image/jpeg', quality)
  } finally {
    bitmap.close?.()
  }
}

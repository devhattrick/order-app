import alertUrl from "../assets/order-alert.mp3";

/**
 * เสียงแจ้งเตือนออเดอร์ใหม่
 * -------------------------------------------------------------
 * เล่นไฟล์เสียงจริง (order-alert.mp3) ผ่าน Web Audio API
 *
 * ทำไมใช้ Web Audio ไม่ใช่ <audio> ธรรมดา
 *  - เล่นทันทีไม่มีดีเลย์ เพราะ decode ไฟล์เก็บไว้ใน memory ตั้งแต่แรก
 *  - ปรับความดังผ่าน GainNode ได้
 *  - ใช้ AudioContext ตัวเดียวกับระบบปลดล็อก autoplay ที่มีอยู่แล้ว
 *
 * ถ้าโหลดไฟล์ไม่สำเร็จ (deploy พลาด / เน็ตสะดุด) จะถอยไปใช้เสียงสังเคราะห์แทน
 * ครัวจะได้ยังได้ยินเสียง ดีกว่าเงียบสนิทโดยไม่มีใครรู้ว่าระบบแจ้งเตือนพัง
 *
 * ข้อจำกัดของเบราว์เซอร์: autoplay ถูกบล็อกจนกว่าผู้ใช้จะแตะหน้าจอก่อน
 * จึงต้องเรียก unlockAudio() จาก user gesture ครั้งแรก
 */

/**
 * ความดัง 0–1 — ปรับตรงนี้ที่เดียวถ้าครัวบอกว่าเบาไป
 * เกิน 1 ได้ (ขยายเกินระดับเดิมของไฟล์) แต่เสี่ยงเสียงแตก ไม่ควรเกิน 1.5
 */
const ALERT_VOLUME = 1.0;

let ctx: AudioContext | null = null;
let buffer: AudioBuffer | null = null;
let loadFailed = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

/**
 * โหลดและ decode ไฟล์เสียงเก็บไว้ล่วงหน้า
 * ทำตั้งแต่เปิดหน้าเว็บ ไม่รอจนออเดอร์แรกเข้า เพราะตอนนั้นต้องดังทันที
 */
async function preload(): Promise<void> {
  const c = getCtx();
  if (!c || buffer || loadFailed) return;
  try {
    const response = await fetch(alertUrl);
    buffer = await c.decodeAudioData(await response.arrayBuffer());
  } catch {
    loadFailed = true;
  }
}

if (typeof window !== "undefined") void preload();

/** เรียกจาก user gesture (click/keydown) เพื่อปลดล็อก autoplay */
export function unlockAudio() {
  const c = getCtx();
  if (c && c.state === "suspended") void c.resume();
  void preload();
}

/** true = เบราว์เซอร์ยังบล็อกเสียงอยู่ (ยังไม่มี interaction) */
export function isAudioBlocked() {
  return !ctx || ctx.state !== "running";
}

export function playNewOrderChime() {
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") void c.resume();

  // ไฟล์ยังโหลดไม่เสร็จหรือโหลดไม่ได้ — ใช้เสียงสังเคราะห์ไปก่อน
  if (!buffer) {
    void preload();
    playFallbackChime(c);
    return;
  }

  const source = c.createBufferSource();
  const gain = c.createGain();

  source.buffer = buffer;
  gain.gain.value = ALERT_VOLUME;

  source.connect(gain);
  gain.connect(c.destination);
  source.start();
}

/**
 * เสียงสำรอง — "ดิง-ดอง" 2 ชุด สังเคราะห์สด ไม่ต้องพึ่งไฟล์
 *
 * ใช้ square wave ไม่ใช่ sine เพราะ square มี harmonic กระจายหลายความถี่
 * จึงแทรกผ่านเสียงรบกวนในครัว (พัดลม เครื่องดูดควัน) ได้ดีกว่า
 */
function playFallbackChime(c: AudioContext) {
  const now = c.currentTime;
  const pattern: [number, number][] = [
    [0.0, 1174.66],
    [0.17, 1567.98],
    [0.5, 1174.66],
    [0.67, 1567.98],
  ];
  const noteLength = 0.3;

  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 4000;

  const master = c.createGain();
  master.gain.value = Math.min(ALERT_VOLUME, 0.9) * 0.7;

  filter.connect(master);
  master.connect(c.destination);

  for (const [offset, freq] of pattern) {
    const t = now + offset;
    const osc = c.createOscillator();
    const gain = c.createGain();

    osc.type = "square";
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(1, t + 0.005);
    gain.gain.setValueAtTime(1, t + noteLength * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + noteLength);

    osc.connect(gain);
    gain.connect(filter);
    osc.start(t);
    osc.stop(t + noteLength + 0.02);
  }
}

/** ให้ผู้ใช้กดลองฟังในหน้าตั้งค่า */
export function testChime() {
  unlockAudio();
  playNewOrderChime();
}

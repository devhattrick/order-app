import { useEffect, useRef } from "react";
import { useAppStore } from "../store/useAppStore";

/**
 * ดึงออเดอร์ที่ยังไม่ปิดจาก Backend ตามรอบเวลา
 * -------------------------------------------------------------
 * ใช้ใน AdminLayout ที่เดียว เพื่อให้ทุกหน้าฝั่งร้านเห็นข้อมูลชุดเดียวกัน
 * ไม่ว่าจะเปิดค้างไว้หน้าไหน หรือเปิดจาก iPad คนละเครื่อง
 *
 * ทำไมเป็น polling ไม่ใช่ SSE
 * ---------------------------
 * SSE เร็วกว่าและสวยกว่าในทางเทคนิค แต่ connection ที่เปิดค้างไว้
 * ทำให้ Cloud Run มองว่า instance "กำลังทำงาน" ตลอดเวลาที่ร้านเปิด
 * จึงคิดเงิน CPU ทั้งวันทั้งที่แทบไม่ได้ประมวลผลอะไร
 * polling ทุก 5 วินาทีใช้เวลาประมวลผลจริงราว 1% ของเวลานั้น
 * และอยู่ใน free tier สบาย ๆ แลกกับดีเลย์ที่ยอมรับได้ในครัว
 *
 * 3 อย่างที่ polling ต้องมี ไม่งั้นจะเปลืองและสร้างปัญหาเอง
 *   1. หยุดเมื่อแท็บไม่ได้แสดงอยู่ — iPad ที่จอดับไม่ควรยิง API ทิ้ง
 *   2. ดึงทันทีเมื่อกลับมาดู — พนักงานปลุกจอแล้วต้องเห็นของล่าสุดเลย ไม่ต้องรอครบรอบ
 *   3. ไม่ยิงซ้อน และถอยจังหวะเมื่อ server มีปัญหา — ระบบที่กำลังล่มไม่ควรโดนซ้ำเติม
 */

/** รอบปกติ — ครัวเห็นออเดอร์ใหม่ช้าสุด 5 วินาที */
const INTERVAL_MS = 5_000;

/** ยิงพลาดติดกันหลายครั้ง = server มีปัญหา ค่อย ๆ ถอยออกไปจนถึงเพดานนี้ */
const MAX_BACKOFF_MS = 60_000;

export function useOrderPolling(enabled: boolean) {
  /** กัน request ซ้อน: รอบก่อนยังไม่กลับ ก็ยังไม่ต้องยิงรอบใหม่ */
  const inFlight = useRef(false);
  const failures = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    const delay = () =>
      failures.current === 0
        ? INTERVAL_MS
        : Math.min(INTERVAL_MS * 2 ** failures.current, MAX_BACKOFF_MS);

    const schedule = () => {
      if (stopped) return;
      timer = setTimeout(() => void tick(), delay());
    };

    const tick = async () => {
      if (stopped || inFlight.current) return schedule();

      // แท็บถูกซ่อนอยู่ (สลับแอป / จอดับ) — ข้ามรอบนี้ ไม่ต้องกวน server
      if (document.visibilityState === "hidden") return schedule();

      inFlight.current = true;
      try {
        await useAppStore.getState().refreshOrders();
        failures.current = 0;
      } catch {
        // เน็ตสะดุดหรือ server ล่ม — ไม่ต้องขึ้น error ให้พนักงานเห็น
        // ข้อมูลเดิมบนจอยังใช้ทำงานต่อได้ รอบหน้าค่อยตามใหม่
        failures.current += 1;
      } finally {
        inFlight.current = false;
        schedule();
      }
    };

    /** กลับมาดูแท็บนี้อีกครั้ง — ดึงของล่าสุดทันที ไม่ต้องรอรอบถัดไป */
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      failures.current = 0;
      clearTimeout(timer);
      void tick();
    };

    document.addEventListener("visibilitychange", onVisible);
    schedule();

    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled]);
}

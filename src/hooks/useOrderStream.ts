import { useEffect } from "react";
import { streamUrl } from "../lib/apiClient";
import { useAppStore } from "../store/useAppStore";

/**
 * รับออเดอร์แบบ realtime จาก Backend ผ่าน Server-Sent Events
 * -------------------------------------------------------------
 * ใช้ใน AdminLayout ที่เดียว เพื่อให้ทุกหน้าฝั่งร้านเห็นข้อมูลชุดเดียวกัน
 * ไม่ว่าจะเปิดค้างไว้หน้าไหน หรือเปิดหลายเครื่องพร้อมกัน
 *
 * event ที่ server ส่งมา (ดู OrderEventPublisher ฝั่ง Java):
 *   connected     — ต่อสำเร็จ
 *   order-created — มีออเดอร์ใหม่เข้าครัว
 *   order-updated — ออเดอร์เดิมเปลี่ยนสถานะ / ปิดบิล / ถูกยกเลิก
 *
 * EventSource ต่อใหม่ให้เองเมื่อสายหลุด แต่ช่วงที่หลุดอาจพลาด event ไปบ้าง
 * จึงดึงออเดอร์ทั้งชุดใหม่ทุกครั้งที่ต่อติด (event 'connected')
 */
export function useOrderStream(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const source = new EventSource(streamUrl("/api/orders/stream"));
    const store = useAppStore.getState;

    const onOrder = (event: MessageEvent) => {
      try {
        store().applyOrder(JSON.parse(event.data));
      } catch {
        /* payload เพี้ยน — ข้ามไป รอบหน้า refresh จะตามให้เอง */
      }
    };

    source.addEventListener("connected", () => void store().refreshOrders().catch(() => {}));
    source.addEventListener("order-created", onOrder);
    source.addEventListener("order-updated", onOrder);

    return () => source.close();
  }, [enabled]);
}

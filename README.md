# Lita — Order App (Frontend Demo)

Demo ระบบสั่งอาหารของร้านขนมปังซาวโดว์ **Lita** สำหรับนำเสนอ Business
เป็น **Frontend อย่างเดียว** — ข้อมูลเก็บใน `localStorage` ของ browser ไม่ต้องมี Backend

---

## 1. วิธีรัน

```bash
npm install
npm run dev      # เปิด http://localhost:5173
npm run build    # build ไป dist/
```

---

## 2. Scope ที่ทำได้ใน Demo

| # | Feature | หน้าจอ |
|---|---------|--------|
| 1 | ลูกค้าเลือก **ทานที่ร้าน / ซื้อกลับ** | `/` |
| 2 | ทานที่ร้าน → **เลือกโต๊ะ T1–T10** (ซื้อกลับข้ามขั้นนี้) | `/table` |
| 3 | เลือกเมนู + **Option เสริม** (Size / ความหวาน / ท็อปปิ้ง / ร้อน-เย็น) | `/menu` |
| 4 | ตะกร้า + หมายเหตุถึงครัว + ยืนยันสั่ง | `/cart` |
| 5 | **บัตรคิว + Timeline สถานะ** แบบ Real-time | `/order/:id` |
| 6 | **ผังโต๊ะ 10 กล่อง** + พนักงานคีย์ออเดอร์แทนลูกค้า + เช็คบิล/เก็บโต๊ะ | `/admin/pos` |
| 7 | **กระดานครัว** 4 คอลัมน์ รอรับ → กำลังทำ → พร้อมเสิร์ฟ → รอเช็คบิล | `/admin/orders` |
| 7.1 | **ใบเสร็จ** เด้งอัตโนมัติเมื่อปิดออเดอร์ / เช็คบิลโต๊ะ · สั่งพิมพ์ได้ | ทุกหน้าที่ปิดบิล |
| 8 | **จัดการเมนู** — ร้านเพิ่ม/แก้ไข/ปิดขาย + **อัปโหลดรูปเมนู** เองได้ | `/admin/menu` |
| 9 | **ประวัติออเดอร์** + filter ช่วงวัน / สถานะ / ประเภท + ค้นหา | `/admin/history` |
| 10 | **Dashboard** KPI + กราฟยอดขาย / ช่วงเวลา / หมวด / เมนูขายดี | `/admin/dashboard` |

ปุ่มสลับมุมมอง **ลูกค้า / ร้าน** อยู่มุมขวาบนทุกหน้า (ใช้แทน Login ใน Demo)

---

## 3. Business Rules ที่ฝังไว้

- **Order Type**
  - `DINE_IN` → ต้องมี `tableNo` เสมอ
  - `TAKEAWAY` → `tableNo = null`
- **เลขที่เอกสาร** (reset ทุกวัน)
  - `orderNo` = `YYYYMMDD-NNN` running รวมทั้งร้าน
  - `queueNo` = `D-001` (ทานที่ร้าน) / `T-001` (ซื้อกลับ) running แยกตามประเภท
- **Status Flow** — เดินหน้าทางเดียว และ**แยกตามประเภทออเดอร์**
  - `DINE_IN` : `PENDING → PREPARING → READY → SERVED →` *(เช็คบิลที่ผังโต๊ะเท่านั้น)* `→ COMPLETED`
  - `TAKEAWAY`: `PENDING → PREPARING → READY → COMPLETED` (ส่งมอบ = จบ ไม่ต้องรับเงินอีก)
  - ยกเลิกได้ทุกจุด → `CANCELLED`
  - `SERVED` = เสิร์ฟถึงโต๊ะแล้วแต่ยังไม่ชำระเงิน — ใช้เฉพาะ `DINE_IN`
    กระดานครัวจะย้ายการ์ดไปคอลัมน์ "รอเช็คบิล" ไม่หายจากหน้าจอ และปุ่มเปลี่ยนเป็นลิงก์ไปผังโต๊ะ
- **สถานะโต๊ะ** คำนวณจากออเดอร์ที่ยัง Active (`PENDING`/`PREPARING`/`READY`/`SERVED`) ไม่ได้เก็บเป็น field แยก
  → โต๊ะว่างอัตโนมัติเมื่อออเดอร์ทั้งหมดของโต๊ะนั้น `COMPLETED` / `CANCELLED`
- **สั่งเพิ่มได้** — โต๊ะเดิมสั่งซ้ำได้ ระบบรวมยอดทั้งโต๊ะตอนเช็คบิล
- **ราคา** = `menu.price + Σ option.priceDelta` คิดต่อชิ้น แล้วคูณ `qty`
- **รูปเมนู** (`menu.imageUrl`) — อัปโหลดไฟล์ หรือวางลิงก์ก็ได้
  - อัปโหลด → crop กลางภาพเป็นจัตุรัส + ย่อเหลือ 400px + JPEG q0.7 → data URL ~30-45 KB
  - ไม่มีรูป หรือรูปโหลดไม่ขึ้น → ตกกลับไปใช้ `menu.emoji` อัตโนมัติ (ไม่มีรูปแตก)
  - **ข้อจำกัดของ Demo**: data URL ถูกเก็บใน localStorage (เพดาน ~5 MB) จึงเก็บได้ราว 80-100 เมนู
    ตอนต่อ Backend จริงให้เปลี่ยนเป็น upload ขึ้น object storage (S3/GCS) แล้วเก็บเฉพาะ URL ลง DB —
    ฟังก์ชันย่อรูปใน `src/utils/image.ts` ยังใช้ย่อก่อนส่งขึ้น server ได้เหมือนเดิม
- **จังหวะชำระเงิน** (field `paidAt` บน Order)
  - `TAKEAWAY` = **Prepaid** — รับเงินตอนสั่งที่เคาน์เตอร์ ก่อนเข้าครัว → `paidAt = createdAt`
  - `DINE_IN` = **Postpaid** — รับเงินตอนเช็คบิล → `paidAt` ถูกเซ็ตตอน `closeTable()`
- **ใบเสร็จ** ราคาที่แสดงรวม VAT 7% แล้ว → แยกฐานภาษีด้วย `total × 7/107`
  - `paidAt = null` → หัวเอกสารเป็น **ใบแจ้งยอด / BILL** (ให้ลูกค้าตรวจก่อนจ่าย)
  - `paidAt` มีค่า → หัวเอกสารเป็น **ใบเสร็จรับเงิน / RECEIPT** พร้อมเวลาที่ชำระ
  - **ซื้อกลับ** กด "รับเงิน & ส่งเข้าครัว" (POS) หรือ "ชำระเงิน & สั่งอาหาร" (ลูกค้า) → ใบเสร็จออกทันที
  - **ทานที่ร้าน** เช็คบิลจากผังโต๊ะเท่านั้น → ใบแจ้งยอดรวมทุกออเดอร์ของโต๊ะ → ยืนยันรับเงิน → ปิดโต๊ะ

---

## 4. โครงสร้างโปรเจกต์

```
src/
├── types/          Domain Model ทั้งหมด (Order, MenuItem, OptionGroup, …)
├── data/
│   ├── constants   โต๊ะ / หมวดหมู่ / สี-ป้ายสถานะ / Status Flow
│   └── seed        เมนูเริ่มต้น 19 รายการ + ประวัติออเดอร์ย้อนหลัง 14 วัน
├── store/          Zustand + persist (localStorage) + sync ข้ามแท็บ
├── services/       ★ Mock Service Layer — จุดเดียวที่ต้องแก้ตอนต่อ Backend
├── components/     UI ที่ใช้ซ้ำ (MenuBrowser, ItemOptionsModal, Modal, …)
├── app/            Router + Layout ฝั่งลูกค้า / ฝั่งร้าน
└── pages/
    ├── customer/   5 หน้า
    └── admin/      5 หน้า
```

### จุดต่อ Backend (Spring Boot)

`src/services/index.ts` เขียนแยกไว้แล้ว โดยคอมเมนต์ REST endpoint ที่ตั้งใจจะ map ไว้ทุกตัว
เปลี่ยนเฉพาะไฟล์นี้เป็น `fetch` / `axios` ได้เลย **โดย UI ไม่ต้องแก้**

| Function | Endpoint ที่ตั้งใจไว้ |
|----------|----------------------|
| `orderService.create` | `POST /api/orders` |
| `orderService.updateStatus` | `PATCH /api/orders/{id}/status` |
| `orderService.closeTable` | `POST /api/tables/{tableNo}/close` |
| `menuService.save` | `POST /api/menus` · `PUT /api/menus/{id}` |
| `menuService.toggleAvailability` | `PATCH /api/menus/{id}/availability` |
| `menuService.remove` | `DELETE /api/menus/{id}` |
| `getTableState` | `GET /api/tables` |

---

## 5. ข้อจำกัดของ Demo (ต้องบอก Business ก่อนนำเสนอ)

- ไม่มี Login / สิทธิ์ผู้ใช้ — ใช้ปุ่มสลับมุมมองแทน
- ไม่มีระบบชำระเงินจริง — "เช็คบิล" คือปิดสถานะออเดอร์เท่านั้น
- ข้อมูลอยู่ใน browser เครื่องนั้น ๆ — คนละเครื่อง/คนละ browser ไม่เห็นข้อมูลกัน
  (ถ้าเปิดสองแท็บใน browser เดียวกัน ข้อมูลจะ sync กันทันที ใช้ Demo ลูกค้า ↔ ร้าน ได้)
- ปุ่ม **รีเซ็ตข้อมูล Demo** (ในแถบด้านซ้ายของฝั่งร้าน) ล้างกลับไปเป็นข้อมูลตัวอย่างเริ่มต้น

---

## 6. Deploy ขึ้น GitHub Pages

Workflow อยู่ที่ `.github/workflows/deploy.yml` — build + deploy อัตโนมัติเมื่อ push ขึ้น branch `production`

```bash
git remote add origin https://github.com/devhattrick/order-app.git
git checkout -b production
git push -u origin production
```

จากนั้นที่ repo → **Settings → Pages → Source = GitHub Actions**
URL ที่ได้: `https://devhattrick.github.io/order-app/`

> ใช้ `HashRouter` และตั้ง `base: '/order-app/'` ไว้แล้ว เพื่อไม่ให้ refresh หน้าใน GitHub Pages เจอ 404

---

## 7. Stack

React 19 · Vite 8 · TypeScript · TailwindCSS 3 · Zustand (persist) · Recharts · lucide-react

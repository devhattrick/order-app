# Lita — Order App (Frontend)

หน้าจอระบบสั่งอาหารของร้านขนมปังซาวโดว์ **Lita**
ทำงานคู่กับ Backend ที่ repo [`order-app-api`](../order-app-api) (Spring Boot + PostgreSQL)

ระบบนี้เป็น **ระบบหน้าร้าน** พนักงานต้อง Login ก่อนใช้งาน
ลูกค้าไม่ได้สั่งอาหารเองผ่านเว็บ แต่ยัง **สแกน QR บนใบเสร็จเพื่อติดตามสถานะ** ได้โดยไม่ต้อง Login

---

## 1. วิธีรัน

ต้องรัน Backend ก่อน (ดู `order-app-api/README.md`) แล้วค่อยรันหน้าเว็บ

```bash
cp .env.example .env   # ตั้ง VITE_API_BASE_URL ให้ชี้ไปที่ Backend
npm install
npm run dev            # เปิด http://localhost:5173
npm run build          # build ไป dist/
```

### บัญชีสำหรับทดสอบ (Backend สร้างให้อัตโนมัติตอนสตาร์ทครั้งแรก)

| Username | Password | สิทธิ์ | ทำอะไรได้ |
|----------|----------|--------|-----------|
| `admin` | `admin1234` | `ADMIN` | ทุกอย่าง รวม Dashboard และจัดการเมนู |
| `staff` | `staff1234` | `STAFF` | ผังโต๊ะ · ครัว · ประวัติ · ปิด/เปิดขายเมนู |

### ทดสอบสแกน QR ด้วยมือถือจริง

`localhost` บนมือถือหมายถึงตัวมือถือเอง ไม่ใช่เครื่อง Mac — ต้องเปิดผ่าน IP ในวง LAN

```bash
ipconfig getifaddr en0      # ดู IP ของ Mac เช่น 192.168.1.42
npm run dev -- --host       # ให้ vite รับ connection จากเครื่องอื่น
```

จากนั้น **เปิดหน้าร้านบน Mac ด้วย `http://192.168.1.42:5173`** (ไม่ใช่ localhost) แล้วค่อยออกใบเสร็จ
เพราะ QR สร้างจาก `window.location.origin` ของหน้าที่กำลังเปิดอยู่ — ถ้าเปิดด้วย localhost
QR ก็จะฝัง localhost ไปด้วยและมือถือเปิดไม่ได้

และต้องตั้ง 2 อย่างนี้ให้ตรงกันด้วย ไม่งั้นมือถือจะเรียก API ไม่ได้

1. `VITE_API_BASE_URL=http://192.168.1.42:8080` ใน `.env`
2. `CORS_ALLOWED_ORIGINS=http://192.168.1.42:5173` ตอนรัน Backend

---

## 2. Scope ที่ทำได้ใน Demo

| # | Feature | หน้าจอ | สิทธิ์ |
|---|---------|--------|--------|
| 1 | **Login** ด้วย username/password → ได้ JWT เก็บใน `localStorage` | `/login` | สาธารณะ |
| 2 | **ติดตามสถานะออเดอร์** — ลูกค้าสแกน QR บนใบเสร็จ ไม่ต้อง Login | `/track/:token` | สาธารณะ |
| 3 | **ผังโต๊ะ 10 กล่อง** + พนักงานคีย์ออเดอร์ + เช็คบิล/เก็บโต๊ะ | `/admin/pos` | ADMIN · STAFF |
| 4 | **กระดานครัว** 4 คอลัมน์ รอรับ → กำลังทำ → พร้อมเสิร์ฟ → รอเช็คบิล · อัปเดตสดด้วย SSE | `/admin/orders` | ADMIN · STAFF |
| 4.1 | **ใบเสร็จ** เด้งอัตโนมัติเมื่อปิดออเดอร์ / เช็คบิลโต๊ะ · สั่งพิมพ์ได้ | ทุกหน้าที่ปิดบิล | ADMIN · STAFF |
| 4.2 | **QR บนใบเสร็จ** ลูกค้าสแกนติดตามสถานะออเดอร์เองได้ | ใบเสร็จออเดอร์เดี่ยว | — |
| 4.3 | **เสียงแจ้งเตือนออเดอร์ใหม่** เผื่อพนักงานไม่ได้จ้องจอ | ทุกหน้าฝั่งร้าน | ADMIN · STAFF |
| 5 | **ปิด/เปิดขายเมนู** ตอนของหมดหน้างาน | `/admin/menu` | ADMIN · STAFF |
| 5.1 | **เพิ่ม / แก้ไข / ลบเมนู** + อัปโหลดรูป | `/admin/menu` | **ADMIN เท่านั้น** |
| 5.2 | **สร้าง/แก้ไขตัวเลือกเสริม** — กลุ่มตัวเลือกใช้ซ้ำข้ามเมนู | ในฟอร์มเมนู | **ADMIN เท่านั้น** |
| 6 | **ประวัติออเดอร์** + filter ช่วงวัน / สถานะ / ประเภท + ค้นหา (แบ่งหน้าจาก server) | `/admin/history` | ADMIN · STAFF |
| 7 | **Dashboard** KPI + กราฟยอดขาย / ช่วงเวลา / หมวด / เมนูขายดี | `/admin/dashboard` | **ADMIN เท่านั้น** |

### การบังคับสิทธิ์ (Role Permission)

บังคับ **2 ชั้น** โดยเจตนา

| ชั้น | ที่ไหน | ทำอะไร |
|------|--------|--------|
| UI | `RequireAuth` + `useIsAdmin()` | ซ่อนเมนูและปุ่มที่ STAFF ใช้ไม่ได้ เพื่อไม่ให้กดแล้วเจอ error |
| API | `SecurityConfig` ฝั่ง Backend | บังคับจริง — ต่อให้พิมพ์ URL ตรงหรือยิง API เอง ก็ได้ `403` กลับไป |

ชั้น UI เป็นแค่ประสบการณ์ใช้งาน **ไม่ใช่ security** — ความปลอดภัยอยู่ที่ชั้น API เท่านั้น

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
- **ยกเลิกออเดอร์จากหน้าผังโต๊ะ** — ทำได้เฉพาะออเดอร์สถานะ `PENDING` (รอรับออเดอร์) เท่านั้น
  เช่น ของหมด หรือลูกค้าเปลี่ยนใจก่อนครัวเริ่มทำ
  พอขึ้น `PREPARING` แล้วของถูกใช้ไปแล้ว ปุ่มจะหายจากหน้าโต๊ะ ต้องไปจัดการที่กระดานครัวแทน
  ออเดอร์ที่ยกเลิกไม่ถูกนับเป็นยอดขาย และถ้าเป็นออเดอร์สุดท้ายของโต๊ะ โต๊ะจะกลับเป็นว่างอัตโนมัติ
- **ราคา** = `menu.price + Σ option.priceDelta` คิดต่อชิ้น แล้วคูณ `qty`
- **เสียงแจ้งเตือนออเดอร์ใหม่**
  - สร้างเสียงด้วย Web Audio API ไม่มีไฟล์เสียงใน bundle → ทำงานได้แม้ออฟไลน์
  - แจ้งเมื่อครบ 2 เงื่อนไข: เป็น id ที่ยังไม่เคยแจ้ง **และ** `createdAt` ไม่เกิน 60 วินาที
    (เงื่อนไขที่ 2 กันการแจ้งย้อนหลังตอน rehydrate ข้ามแท็บหรือเปิดหน้าใหม่)
  - เบราว์เซอร์บล็อก autoplay จนกว่าจะมี user interaction → ปลดล็อกจากคลิกแรก และมีข้อความบอกถ้ายังถูกบล็อก
  - ปุ่มเปิด/ปิดอยู่ในแถบซ้าย จำค่าไว้ใน localStorage
- **QR ติดตามสถานะ** บนใบเสร็จ
  - encode เป็น `{origin}{pathname}#/order/{id}?d={snapshot}` → เปิดหน้าสถานะฝั่งลูกค้าโดยตรง
  - สร้างฝั่ง browser ด้วย lib `qrcode` ไม่ยิง API ภายนอก
  - แสดงเฉพาะ**ใบเดี่ยวที่ออเดอร์ยังไม่จบ** — บิลรวมโต๊ะคือตอนลูกค้ากำลังกลับ ไม่มีอะไรให้ติดตาม
  - **`?d=` คือสรุปออเดอร์ที่ฝังมากับ URL** (base64url ของ JSON ย่อ ~200 ตัวอักษร)
    จำเป็นเพราะมือถือลูกค้ามี localStorage คนละก้อนกับเครื่องร้าน ถ้าไม่ฝังไว้จะหาออเดอร์ไม่เจอและเด้งกลับหน้าแรก
    หน้าสถานะจะใช้ข้อมูลใน localStorage ก่อนเสมอ (สดกว่า) แล้วค่อย fallback ไป snapshot
    ดู `src/utils/orderShare.ts` — ตอนต่อ Backend ให้เปลี่ยนเป็น `GET /api/orders/{token}` แล้วถอด `?d=` ทิ้ง
- **ตัวเลือกเสริม** (`OptionGroup`) เป็น master data แยกจากเมนู ผูกกันแบบ many-to-many ผ่าน `menu.optionGroupIds`
  - ร้านสร้าง/แก้ไข/ลบกลุ่มเองได้จากในฟอร์มเมนู — กำหนดชื่อ, `SINGLE`/`MULTI`, บังคับเลือกหรือไม่, ตัวเลือกย่อยพร้อมราคาที่บวกเพิ่ม, และค่าเริ่มต้น
  - **แก้กลุ่มเดียว กระทบทุกเมนูที่ผูกอยู่** → ฟอร์มจะเตือนพร้อมบอกจำนวนเมนูที่ใช้อยู่
  - **ออเดอร์เก่าไม่กระทบ** เพราะ `OrderItem.options` เก็บ snapshot (`groupName`, `choiceName`, `priceDelta`) ไว้ตั้งแต่ตอนสั่ง
  - ลบกลุ่ม → ถอดออกจากทุกเมนูที่อ้างถึงอัตโนมัติ (`deleteOptionGroup`)
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
├── types/          Domain Model ทั้งหมด (Order, MenuItem, OptionGroup, UserProfile, …)
├── lib/
│   └── apiClient   ★ fetch wrapper — แนบ JWT, แปลง error, จับ 401
├── data/constants  โต๊ะ / หมวดหมู่ / สี-ป้ายสถานะ / Status Flow
├── services/       ★ เรียก REST ทุกตัว + แปลง DTO → model ของ UI
├── store/
│   ├── useAuthStore  token + ผู้ใช้ที่ login อยู่
│   ├── useAppStore   cache เมนู / ตัวเลือกเสริม / ออเดอร์ที่ยังไม่ปิด
│   └── useCartStore  ตะกร้าที่พนักงานกำลังคีย์ (ยังไม่ส่งเข้าครัว)
├── hooks/
│   ├── useOrderStream   รับออเดอร์ realtime ผ่าน SSE
│   └── useNewOrderAlert เสียง + toast ตอนมีออเดอร์ใหม่
├── components/     UI ที่ใช้ซ้ำ (MenuBrowser, ItemOptionsModal, Modal, …)
├── app/            Router + RequireAuth + Layout ฝั่งร้าน
└── pages/
    ├── LoginPage   เข้าสู่ระบบ
    ├── TrackPage   ลูกค้าติดตามสถานะ (สาธารณะ)
    └── admin/      5 หน้าฝั่งร้าน
```

### Service → Endpoint

ทุก request ผ่าน `src/lib/apiClient.ts` ที่เดียว (แนบ JWT และแปลง error ให้แล้ว)

| Function | Endpoint |
|----------|----------|
| `authService.login` | `POST /api/auth/login` |
| `authService.me` | `GET /api/auth/me` |
| `menuService.list` | `GET /api/menus` |
| `menuService.save` | `POST /api/menus` · `PUT /api/menus/{id}` |
| `menuService.setAvailability` | `PATCH /api/menus/{id}/availability` |
| `menuService.remove` | `DELETE /api/menus/{id}` |
| `optionGroupService.list` | `GET /api/option-groups` |
| `optionGroupService.save` | `POST /api/option-groups` · `PUT /api/option-groups/{id}` |
| `optionGroupService.remove` | `DELETE /api/option-groups/{id}` |
| `orderService.active` | `GET /api/orders/active` |
| `orderService.create` | `POST /api/orders` |
| `orderService.updateStatus` | `PATCH /api/orders/{id}/status` |
| `orderService.closeTable` | `POST /api/tables/{tableNo}/close` |
| `orderService.search` | `GET /api/orders` (filter + paging) |
| `publicOrderService.track` | `GET /api/public/orders/{trackingToken}` |
| `dashboardService.summary` | `GET /api/dashboard/summary` |
| `useOrderStream` | `GET /api/orders/stream` (SSE) |

**หมายเหตุเรื่องราคา** — `POST /api/orders` ส่งไปแค่ `menuId` / `qty` / ตัวเลือก
ไม่ส่งราคาเลย เพราะ Backend คำนวณใหม่เองจากฐานข้อมูล ป้องกันการแก้ราคาผ่าน API

---

## 5. ข้อจำกัดที่ยังเหลืออยู่

- ไม่มีระบบชำระเงินจริง — "เช็คบิล" คือปิดสถานะออเดอร์เท่านั้น ยังไม่ต่อ payment gateway
- เก็บ JWT ไว้ใน `localStorage` — สะดวกและใช้ได้กับ static hosting
  แต่ถ้าหน้าเว็บโดน XSS token จะถูกอ่านได้ ถ้าต้องการแน่นกว่านี้ต้องย้ายไป httpOnly cookie
  ซึ่งต้องเปลี่ยนทั้ง CORS และวิธี deploy
- Token อายุ 12 ชั่วโมง ยังไม่มี refresh token — หมดอายุแล้วต้อง login ใหม่
- รูปเมนูเก็บเป็น data URL ใน database — เหมาะกับสาขาเดียว
  ถ้าเมนูเยอะขึ้นควรย้ายไป object storage (Cloudflare R2)
- ยังไม่ได้ต่อเครื่องพิมพ์ใบเสร็จ — ใช้ `window.print()` ของเบราว์เซอร์

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

**สำคัญ** — `VITE_API_BASE_URL` ถูกฝังตอน build ไม่ใช่ตอนรัน
ต้องตั้งเป็น GitHub Actions secret/variable แล้วส่งเข้า step ที่ `npm run build`
ไม่งั้นหน้าเว็บที่ deploy แล้วจะยิงไปหา `localhost:8080` ของเครื่องผู้ใช้
และอย่าลืมใส่ domain ของหน้าเว็บลงใน `CORS_ALLOWED_ORIGINS` ของ Backend ด้วย

---

## 7. Stack

React 19 · Vite 8 · TypeScript · TailwindCSS 3 · Zustand · Recharts · lucide-react · qrcode · Web Audio API · EventSource (SSE)

Backend: Java 21 · Spring Boot 3.5 · Spring Security (JWT) · Spring Data JPA · Flyway · PostgreSQL 16

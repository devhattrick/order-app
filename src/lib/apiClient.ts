/**
 * ตัวกลางคุยกับ Backend (Spring Boot)
 * -------------------------------------------------------------
 * รวมเรื่องที่ทุก request ต้องทำเหมือนกันไว้ที่เดียว:
 *   1. ต่อ base url ให้
 *   2. แนบ JWT ใน header Authorization: Bearer <token>
 *   3. แปลง error ของ API (ApiError จากฝั่ง Java) เป็น Error ที่มีข้อความไทยพร้อมใช้
 *   4. เจอ 401 = token หมดอายุ → เคลียร์ token แล้วประกาศให้ทั้งแอปรู้
 *
 * ตั้ง base url ผ่าน .env (VITE_API_BASE_URL) เวลา deploy จริง
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080").replace(/\/+$/, "");

const TOKEN_KEY = "lita-auth-token";

/** event ที่ยิงตอน token ใช้ไม่ได้แล้ว — useAuthStore คอยฟังอยู่เพื่อเด้งกลับหน้า login */
export const UNAUTHORIZED_EVENT = "lita:unauthorized";

export function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function writeToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* โหมด private เขียนไม่ได้ — ใช้งานต่อได้ แค่ปิดแท็บแล้วต้อง login ใหม่ */
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/** หน้าตา error ที่ GlobalExceptionHandler ฝั่ง Java ส่งกลับมา */
interface ApiErrorBody {
  status: number;
  message: string;
  fieldErrors?: Record<string, string> | null;
}

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string>;

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/** ข้อความที่เอาไปขึ้น toast ได้เลย ไม่ว่าจะพังเพราะอะไร */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่อีกครั้ง";
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = readToken();

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // ยิงไม่ถึง server เลย (ปิดอยู่ / เน็ตหลุด / CORS)
    throw new ApiError(0, "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบว่า Backend ทำงานอยู่");
  }

  if (response.status === 401) {
    clearToken();
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    throw new ApiError(401, "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
  }

  if (!response.ok) {
    const fallback = `เกิดข้อผิดพลาด (${response.status})`;
    let detail: ApiErrorBody | null = null;
    try {
      detail = (await response.json()) as ApiErrorBody;
    } catch {
      /* บาง error ไม่ได้ส่ง JSON กลับมา เช่น 502 จาก proxy */
    }
    throw new ApiError(response.status, detail?.message ?? fallback, detail?.fieldErrors ?? {});
  }

  // 204 No Content (เช่น DELETE) ไม่มี body ให้ parse
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/** ต่อ query string โดยข้าม key ที่เป็น undefined / null / '' */
export function toQuery(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),
};

export { BASE_URL };

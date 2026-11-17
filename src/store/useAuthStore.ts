import { create } from "zustand";
import { UNAUTHORIZED_EVENT, clearToken, readToken, writeToken } from "../lib/apiClient";
import { authService } from "../services";
import type { UserProfile } from "../types";

/**
 * สถานะการ login ของแอป
 * -------------------------------------------------------------
 * เก็บ token ไว้ใน localStorage แล้วแนบไปกับทุก request ผ่าน apiClient
 *
 * status มี 3 ค่า:
 *   CHECKING — เพิ่งเปิดแอป กำลังเอา token เดิมไปถาม /api/auth/me ว่ายังใช้ได้ไหม
 *   OUT      — ยังไม่ได้ login (หรือ token หมดอายุ) → ต้องไปหน้า login
 *   IN       — login แล้ว ใช้งานได้
 *
 * ต้องมีสถานะ CHECKING เพราะถ้าไม่มี พอ refresh หน้าจะเห็นหน้า login แวบนึง
 * ก่อนจะเด้งกลับเข้าหน้าร้าน ซึ่งดูเหมือนระบบมีปัญหา
 */

const USER_KEY = "lita-auth-user";

function readCachedUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

function writeCachedUser(user: UserProfile | null) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
}

interface AuthState {
  status: "CHECKING" | "OUT" | "IN";
  user: UserProfile | null;
  /** เข้าสู่ระบบ — โยน error ต่อให้หน้า login เอาไปแสดง */
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  /** เรียกครั้งเดียวตอนเปิดแอป เพื่อยืนยันว่า token ที่เก็บไว้ยังไม่หมดอายุ */
  restore: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  status: readToken() ? "CHECKING" : "OUT",
  user: readCachedUser(),

  login: async (username, password) => {
    const result = await authService.login(username, password);
    writeToken(result.token);
    writeCachedUser(result.user);
    set({ status: "IN", user: result.user });
  },

  logout: () => {
    clearToken();
    writeCachedUser(null);
    set({ status: "OUT", user: null });
  },

  restore: async () => {
    if (!readToken()) {
      set({ status: "OUT", user: null });
      return;
    }
    try {
      const user = await authService.me();
      writeCachedUser(user);
      set({ status: "IN", user });
    } catch {
      // token เสียหรือหมดอายุ — apiClient เคลียร์ให้แล้ว
      clearToken();
      writeCachedUser(null);
      set({ status: "OUT", user: null });
    }
  },
}));

/** ใช้ซ่อน/แสดงปุ่มตามสิทธิ์ — ADMIN ทำได้ทุกอย่าง, STAFF ทำได้เฉพาะงานหน้าร้าน */
export const useIsAdmin = () => useAuthStore((s) => s.user?.role === "ADMIN");

/**
 * token หมดอายุระหว่างใช้งาน (apiClient เจอ 401)
 * ประกาศผ่าน window event เพื่อไม่ให้ apiClient ต้อง import store (จะวนกัน)
 */
if (typeof window !== "undefined") {
  window.addEventListener(UNAUTHORIZED_EVENT, () => {
    if (useAuthStore.getState().status !== "OUT") useAuthStore.getState().logout();
  });
}

/**
 * Offline login: pehle kabhi online login ke baad is device par digest + token save hota hai.
 * Net band hone par wahi login ID + password se session restore (server verify nahi hota).
 */

const STORAGE_KEY = "offline_auth_profiles";
const DIGEST_PREFIX = "aftabfood-offline-v1";

function loginKey(loginId) {
  return String(loginId ?? "").trim().toLowerCase();
}

async function sha256Hex(text) {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error("Secure context required for offline login (HTTPS or localhost).");
  }
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function readProfiles() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeProfiles(profiles) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch {
    /* quota / disabled */
  }
}

/** Har successful online login ke baad call karein — taake offline par wapas aa saken. */
export async function persistOfflineLoginProfile(loginId, password, token, user) {
  const key = loginKey(loginId);
  if (!key || !password || !token) return;
  const passDigestHex = await sha256Hex(`${DIGEST_PREFIX}|${key}|${password}`);
  const profiles = readProfiles().filter((p) => p.loginKey !== key);
  profiles.push({
    loginKey: key,
    passDigestHex,
    token,
    user: user ?? null,
    savedAt: Date.now(),
  });
  writeProfiles(profiles);
}

/** Offline / network fail par: sahi login + password ho to saved token return. */
export async function tryOfflineLogin(loginId, password) {
  const key = loginKey(loginId);
  if (!key || !password) return null;
  try {
    const passDigestHex = await sha256Hex(`${DIGEST_PREFIX}|${key}|${password}`);
    const hit = readProfiles().find((p) => p.loginKey === key && p.passDigestHex === passDigestHex);
    if (!hit?.token) return null;
    return { token: hit.token, user: hit.user ?? null };
  } catch {
    return null;
  }
}

export function clearOfflineAuthProfiles() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function isLikelyNetworkError(err) {
  if (!err || !(err instanceof Error)) return false;
  const m = err.message.toLowerCase();
  return (
    m.includes("failed to fetch") ||
    m.includes("networkerror") ||
    m.includes("network request failed") ||
    m.includes("load failed") ||
    m.includes("econnrefused") ||
    m.includes("aborted")
  );
}

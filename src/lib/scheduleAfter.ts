import { after } from "next/server";

/**
 * Schedule work to run after the response is sent, without blocking it.
 * Falls back to fire-and-forget execution when `after` is unsupported
 * (e.g. test environments where `waitUntil` is unavailable).
 */
export function scheduleAfter(callback: () => void | Promise<void>) {
  try {
    after(callback);
  } catch {
    void callback();
  }
}

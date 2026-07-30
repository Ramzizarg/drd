"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { META_PIXEL_ID } from "@/lib/meta-pixel-id";

export { META_PIXEL_ID };

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & {
      callMethod?: (...args: unknown[]) => void;
      queue?: unknown[];
      loaded?: boolean;
      version?: string;
      push?: (...args: unknown[]) => void;
    };
    _fbq?: Window["fbq"];
  }
}

type MetaEventValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | undefined;

export function trackMetaEvent(
  event: string,
  params?: Record<string, MetaEventValue>,
  options?: { eventID?: string }
) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  if (options?.eventID) {
    window.fbq("track", event, params ?? {}, { eventID: options.eventID });
    return;
  }
  window.fbq("track", event, params ?? {});
}

export function getMetaCookies(): { fbp: string | null; fbc: string | null } {
  if (typeof document === "undefined") return { fbp: null, fbc: null };
  const cookies = document.cookie.split(";").map((c) => c.trim());
  const read = (name: string) => {
    const row = cookies.find((c) => c.startsWith(`${name}=`));
    return row ? decodeURIComponent(row.slice(name.length + 1)) : null;
  };
  return { fbp: read("_fbp"), fbc: read("_fbc") };
}

export function createMetaEventId(prefix = "evt"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function MetaPixelPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/login")) {
      return;
    }
    // Initial PageView is already sent by the base script in <head>
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    trackMetaEvent("PageView");
  }, [pathname, searchParams]);

  return null;
}

/** SPA PageView on client navigations. Base pixel script is in layout <head>. */
export function MetaPixel() {
  return (
    <Suspense fallback={null}>
      <MetaPixelPageView />
    </Suspense>
  );
}

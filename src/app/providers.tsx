"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

type FbqFn = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  push?: FbqFn;
  queue: unknown[];
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    fbq?: FbqFn;
    _fbq?: FbqFn;
  }
}

// Meta's official Pixel base code, unmodified in shape/order. The
// `if (window.fbq) return` guard lives inside the loader itself (as Meta
// ships it) so it stays idempotent no matter how many times this function
// gets called — React 18 Strict Mode double-invokes effects in dev, and
// this guard is what makes a second call a no-op instead of a second
// `init`/`track` pair (which is what produces duplicate PageView events).
// No-op unless NEXT_PUBLIC_META_PIXEL_ID is configured — safe to leave unset.
function loadMetaPixel(pixelId: string) {
  if (window.fbq) return;

  const fbq: FbqFn = function (...args: unknown[]) {
    if (fbq.callMethod) {
      fbq.callMethod(...args);
    } else {
      fbq.queue.push(args);
    }
  } as FbqFn;
  if (!window._fbq) window._fbq = fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  window.fbq = fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  const firstScript = document.getElementsByTagName("script")[0];
  firstScript?.parentNode?.insertBefore(script, firstScript);

  window.fbq("init", pixelId);
  window.fbq("track", "PageView");
}

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (key) {
      posthog.init(key, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
        capture_pageview: false,
        capture_pageleave: true,
      });
    }

    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
    if (pixelId) {
      loadMetaPixel(pixelId);
    }
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}

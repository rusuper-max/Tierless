// src/lib/analytics.ts
// Client-side analytics tracking for PublicRenderer

import { hasConsent } from "@/lib/consent";

type EventType =
  | "page_view"
  | "page_exit"
  | "interaction"
  | "checkout_click"
  | "rating_set"
  | "section_open"
  | "search"
  | "copy_contact"
  | "click_link"
  | "scroll_depth";

interface AnalyticsEvent {
  type: EventType;
  pageId: string;
  ts: number;
  sessionId: string;
  clientId: string;
  props?: Record<string, any>;
}

// Generate or retrieve session/client IDs
function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";

  try {
    let sessionId = sessionStorage.getItem("tierless_session_id");
    if (!sessionId) {
      sessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      sessionStorage.setItem("tierless_session_id", sessionId);
    }
    return sessionId;
  } catch (e) {
    // Fallback for private mode / storage disabled
    return `s_fallback_${Date.now()}`;
  }
}

function getClientId(): string {
  if (typeof window === "undefined") return "ssr";

  try {
    let clientId = localStorage.getItem("tierless_client_id");
    if (!clientId) {
      clientId = `c_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      localStorage.setItem("tierless_client_id", clientId);
    }
    return clientId;
  } catch (e) {
    // Fallback for private mode / storage disabled
    return `c_fallback_${Date.now()}`;
  }
}

// Detect device type
function getDeviceType(): string {
  if (typeof window === "undefined") return "unknown";

  const ua = navigator.userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/.test(ua)) return "mobile";
  return "desktop";
}

// Get platform (iOS, Android, etc.)
function getPlatform(): string {
  if (typeof window === "undefined") return "unknown";

  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "iOS";
  if (/Android/.test(ua)) return "Android";
  if (/Windows/.test(ua)) return "Windows";
  if (/Mac/.test(ua)) return "macOS";
  if (/Linux/.test(ua)) return "Linux";
  return "unknown";
}

// Get referrer domain
function getReferrer(): string {
  if (typeof document === "undefined") return "direct";

  const ref = document.referrer;
  if (!ref) return "direct";

  try {
    const url = new URL(ref);
    if (url.hostname.includes("google")) return "Google";
    if (url.hostname.includes("facebook")) return "Facebook";
    if (url.hostname.includes("instagram")) return "Instagram";
    if (url.hostname.includes("tiktok")) return "TikTok";
    if (url.hostname.includes("twitter") || url.hostname.includes("x.com")) return "X/Twitter";
    if (url.hostname.includes("linkedin")) return "LinkedIn";
    if (url.hostname.includes("youtube")) return "YouTube";
    return url.hostname;
  } catch {
    return "direct";
  }
}

// Get UTM parameters
function getUtmParams(): { utm_source?: string; utm_medium?: string; utm_campaign?: string } {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") || undefined,
    utm_medium: params.get("utm_medium") || undefined,
    utm_campaign: params.get("utm_campaign") || undefined,
  };
}

// ==================== BATCHING CONFIG ====================
const MAX_BATCH_SIZE = 50;        // Max events per batch
const MAX_QUEUE_SIZE = 200;       // Max queued events (prevents memory leak)
const FLUSH_INTERVAL_MS = 1000;   // Debounce interval
const MAX_RETRY_ATTEMPTS = 3;     // Retry failed sends

// Event queue for batching
let eventQueue: AnalyticsEvent[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;
let retryCount = 0;

async function flushEvents() {
  if (eventQueue.length === 0) return;

  // Take a batch (max size)
  const batchSize = Math.min(eventQueue.length, MAX_BATCH_SIZE);
  const events = eventQueue.slice(0, batchSize);
  eventQueue = eventQueue.slice(batchSize);

  // Only log in dev
  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics] Sending", events.length, "events");
  }

  try {
    const res = await fetch("/api/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events }),
    });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    
    // Success - reset retry count
    retryCount = 0;
    
    // If more events in queue, schedule another flush
    if (eventQueue.length > 0) {
      scheduleFlush();
    }
  } catch (e) {
    console.error("[Analytics] Failed to send events:", e);
    
    // Retry with exponential backoff (max 3 attempts)
    if (retryCount < MAX_RETRY_ATTEMPTS) {
      retryCount++;
      eventQueue.unshift(...events);
      // Exponential backoff: 2s, 4s, 8s
      setTimeout(() => flushEvents(), 2000 * Math.pow(2, retryCount - 1));
    } else {
      // Give up after max retries to prevent infinite loop
      console.warn("[Analytics] Dropping", events.length, "events after max retries");
      retryCount = 0;
    }
  }
}

function scheduleFlush(immediate = false) {
  if (flushTimeout) clearTimeout(flushTimeout);

  if (immediate) {
    flushTimeout = null;
    flushEvents();
    return;
  }

  flushTimeout = setTimeout(() => {
    flushTimeout = null;
    flushEvents();
  }, FLUSH_INTERVAL_MS);
}

// Main tracking function
export function trackEvent(
  type: EventType,
  pageId: string,
  props?: Record<string, any>
) {
  if (typeof window === "undefined") return;

  // Respect user's cookie consent choice
  if (!hasConsent()) return;

  // Prevent memory leak if events aren't being sent
  if (eventQueue.length >= MAX_QUEUE_SIZE) {
    // Drop oldest events to make room
    eventQueue = eventQueue.slice(-MAX_QUEUE_SIZE + 10);
    console.warn("[Analytics] Queue overflow - dropped old events");
  }

  const event: AnalyticsEvent = {
    type,
    pageId,
    ts: Date.now(),
    sessionId: getSessionId(),
    clientId: getClientId(),
    props: {
      ...props,
      device: getDeviceType(),
      platform: getPlatform(),
      referrer: getReferrer(),
      ...getUtmParams(),
    },
  };

  eventQueue.push(event);
  scheduleFlush();
}

// Convenience functions
export function trackPageView(pageId: string) {
  if (typeof window === "undefined") {
    console.log("[Analytics] SSR - skipping page view tracking");
    return;
  }
  console.log("%c[Analytics] Tracking page view for: " + pageId, "background: #22D3EE; color: black; padding: 2px 8px; border-radius: 4px;");
  trackEvent("page_view", pageId);
  // Flush page view immediately - it's critical
  scheduleFlush(true);
}

export function trackInteraction(
  pageId: string,
  interactionType: "qty_plus" | "qty_minus" | "section_open" | "search" | "copy_phone" | "copy_email" | "click_link" | "add_to_cart"
) {
  trackEvent("interaction", pageId, { interactionType });
}

export function trackCheckout(pageId: string, method: "whatsapp" | "telegram" | "email" | "custom") {
  trackEvent("checkout_click", pageId, { method });
}

export function trackSectionOpen(pageId: string, sectionId: string) {
  trackEvent("section_open", pageId, { sectionId });
}

export function trackSearch(pageId: string, searchTerm: string) {
  trackEvent("search", pageId, { searchTerm });
}

export function trackRating(pageId: string, value: number) {
  trackEvent("rating_set", pageId, { value });
}

// Track scroll depth
let maxScrollDepth = 0;
let scrollDepthMilestones = new Set<number>();

export function trackScrollDepth(pageId: string, depth: number) {
  // Only track milestones: 25, 50, 75, 100
  const milestones = [25, 50, 75, 100];
  for (const milestone of milestones) {
    if (depth >= milestone && !scrollDepthMilestones.has(milestone)) {
      scrollDepthMilestones.add(milestone);
      trackEvent("scroll_depth", pageId, { depth: milestone });
    }
  }
  maxScrollDepth = Math.max(maxScrollDepth, depth);
}

// Track time on page
let pageStartTime = 0;
let currentPageId = "";

export function startTimeTracking(pageId: string) {
  pageStartTime = Date.now();
  currentPageId = pageId;
  maxScrollDepth = 0;
  scrollDepthMilestones.clear();
}

export function getTimeOnPage(): number {
  if (!pageStartTime) return 0;
  return Math.floor((Date.now() - pageStartTime) / 1000);
}

// Get time bucket for analytics
function getTimeBucket(seconds: number): string {
  if (seconds < 10) return "0-10s";
  if (seconds < 30) return "10-30s";
  if (seconds < 120) return "30s-2m";
  if (seconds < 300) return "2-5m";
  return "5m+";
}

// Initialize page unload handlers
export function initAnalytics() {
  if (typeof window === "undefined") return;

  // Track page exit with time and scroll depth
  window.addEventListener("beforeunload", () => {
    // Respect user's cookie consent choice
    if (!hasConsent()) return;
    if (currentPageId) {
      const timeOnPage = getTimeOnPage();
      const events = [
        ...eventQueue,
        {
          type: "page_exit" as EventType,
          pageId: currentPageId,
          ts: Date.now(),
          sessionId: getSessionId(),
          clientId: getClientId(),
          props: {
            timeOnPage,
            timeBucket: getTimeBucket(timeOnPage),
            maxScrollDepth,
            device: getDeviceType(),
            platform: getPlatform(),
          },
        },
      ];

      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/stats",
          JSON.stringify({ events })
        );
      }
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushEvents();
    }
  });

  // Track scroll depth on scroll
  let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
  window.addEventListener("scroll", () => {
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      if (!currentPageId) return;
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
      trackScrollDepth(currentPageId, scrollPercent);
    }, 100);
  }, { passive: true });
}


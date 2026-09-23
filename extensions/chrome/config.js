// Shared by the service worker, popup and blocked page.

export const DEFAULT_APP_URL = "http://localhost:3000";

export const DEFAULT_BLOCKED_SITES = [
  "facebook.com",
  "youtube.com",
  "tiktok.com",
  "instagram.com",
  "x.com",
  "twitter.com",
  "reddit.com",
  "netflix.com",
];

/** User settings live in storage.sync so they follow the Chrome profile. */
export async function getSettings() {
  const { appUrl, blockedSites } = await chrome.storage.sync.get(["appUrl", "blockedSites"]);
  return {
    appUrl: (appUrl || DEFAULT_APP_URL).replace(/\/+$/, ""),
    blockedSites: Array.isArray(blockedSites) ? blockedSites : DEFAULT_BLOCKED_SITES,
  };
}

/** "https://www.YouTube.com/watch" / "youtube.com/" -> "youtube.com". Returns "" if unusable. */
export function normalizeDomain(input) {
  let s = String(input || "").trim().toLowerCase();
  if (!s) return "";
  if (!/^[a-z]+:\/\//.test(s)) s = "http://" + s;
  try {
    const host = new URL(s).hostname.replace(/^www\./, "");
    return /^[a-z0-9.-]+\.[a-z0-9-]+$/.test(host) ? host : "";
  } catch {
    return "";
  }
}

/** True when `hostname` is `domain` or one of its subdomains. */
export function hostMatches(hostname, domain) {
  const h = hostname.toLowerCase();
  return h === domain || h.endsWith("." + domain);
}

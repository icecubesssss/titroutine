import { getSettings, hostMatches } from "./config.js";

const ALARM = "titroutine-focus-poll";
const BLOCKED_PAGE = "blocked.html";

// ---------------------------------------------------------------------------
// Polling the web app
// ---------------------------------------------------------------------------

/**
 * Ask the app whether the user has a task in progress. Uses the site's own
 * Supabase session cookie, so the user just needs to be signed in to the app
 * in this Chrome profile.
 */
async function fetchFocusStatus(appUrl) {
  try {
    const res = await fetch(`${appUrl}/api/focus-status`, {
      credentials: "include",
      cache: "no-store",
    });
    if (res.status === 401) return { signedIn: false, focusing: false, task: null };
    if (!res.ok) return { signedIn: null, focusing: false, task: null, error: `HTTP ${res.status}` };
    const body = await res.json();
    return { signedIn: true, focusing: !!body.focusing, task: body.task ?? null };
  } catch (err) {
    return { signedIn: null, focusing: false, task: null, error: "Không kết nối được tới app" };
  }
}

// ---------------------------------------------------------------------------
// Blocking
// ---------------------------------------------------------------------------

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** One redirect rule per domain (and its subdomains). The original URL rides in the hash. */
function buildRules(sites) {
  return sites.map((domain, i) => ({
    id: i + 1,
    priority: 1,
    action: {
      type: "redirect",
      redirect: {
        regexSubstitution: `${chrome.runtime.getURL(BLOCKED_PAGE)}#\\0`,
      },
    },
    condition: {
      regexFilter: `^https?://([^/]*\\.)?${escapeRegex(domain)}([:/?#].*)?$`,
      resourceTypes: ["main_frame"],
    },
  }));
}

async function applyBlocking(focusing, sites) {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map((r) => r.id),
    addRules: focusing ? buildRules(sites) : [],
  });

  if (!focusing) return;

  // Rules only catch new navigations — send tabs that are already open on a
  // blocked site to the blocked page too.
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (!tab.id || !tab.url) continue;
    let url;
    try {
      url = new URL(tab.url);
    } catch {
      continue;
    }
    if (!/^https?:$/.test(url.protocol)) continue;
    if (sites.some((d) => hostMatches(url.hostname, d))) {
      chrome.tabs.update(tab.id, { url: `${chrome.runtime.getURL(BLOCKED_PAGE)}#${tab.url}` });
    }
  }
}

// ---------------------------------------------------------------------------
// Refresh loop
// ---------------------------------------------------------------------------

async function refresh() {
  const { appUrl, blockedSites } = await getSettings();
  const status = await fetchFocusStatus(appUrl);
  // Fail open: anything other than a confirmed in-progress task unblocks.
  const focusing = status.signedIn === true && status.focusing;

  await applyBlocking(focusing, blockedSites);

  const lastStatus = { ...status, focusing, checkedAt: Date.now() };
  await chrome.storage.local.set({ lastStatus });

  await chrome.action.setBadgeText({ text: focusing ? "ON" : "" });
  if (focusing) await chrome.action.setBadgeBackgroundColor({ color: "#16a34a" });

  return lastStatus;
}

function ensureAlarm() {
  // 30s is the shortest period Chrome allows for packed/unpacked MV3 alarms.
  chrome.alarms.create(ALARM, { periodInMinutes: 0.5 });
}

chrome.runtime.onInstalled.addListener(() => {
  ensureAlarm();
  refresh();
});

chrome.runtime.onStartup.addListener(() => {
  ensureAlarm();
  refresh();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM) refresh();
});

// Settings edited in the popup take effect right away.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && (changes.appUrl || changes.blockedSites)) refresh();
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "refresh") {
    refresh().then(sendResponse);
    return true; // keep the channel open for the async response
  }
  return false;
});

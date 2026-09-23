import { getSettings } from "./config.js";

const $ = (id) => document.getElementById(id);

// The redirect rule puts the original URL after the hash.
const original = location.hash.slice(1);
const originalUrl = /^https?:\/\//.test(original) ? original : "";

function render(status) {
  const focusing = !!status?.focusing;

  if (focusing && status.task?.title) {
    $("task").textContent = "🌱 Bạn đang làm: " + status.task.title;
    $("task").hidden = false;
  } else {
    $("task").hidden = true;
  }

  if (focusing) {
    $("title").textContent = "Tập trung nào!";
    $("back").hidden = true;
  } else {
    // Focus ended (task done / moved back) — let the user continue.
    $("title").textContent = "Hết giờ tập trung rồi 🎉";
    $("back").hidden = !originalUrl;
  }
}

async function init() {
  if (originalUrl) {
    try {
      $("site").textContent = new URL(originalUrl).hostname;
      $("site").hidden = false;
    } catch {
      /* ignore */
    }
    $("back").href = originalUrl;
  }

  const { appUrl } = await getSettings();
  $("open-app").href = appUrl;

  const { lastStatus } = await chrome.storage.local.get("lastStatus");
  render(lastStatus);

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.lastStatus) render(changes.lastStatus.newValue);
  });
}

init();

import { getSettings, normalizeDomain } from "./config.js";

const $ = (id) => document.getElementById(id);

function renderStatus(status) {
  const box = $("status");
  box.className = "card status";
  box.replaceChildren();

  const line = document.createElement("p");
  line.className = "status-line";
  const sub = document.createElement("p");
  sub.className = "status-sub";

  if (!status) {
    line.textContent = "Đang kiểm tra…";
  } else if (status.error) {
    box.classList.add("warn");
    line.textContent = "⚠️ " + status.error;
    sub.textContent = "Kiểm tra app đang chạy và địa chỉ app bên dưới.";
  } else if (status.signedIn === false) {
    box.classList.add("warn");
    line.textContent = "🔒 Chưa đăng nhập Titroutine";
    sub.textContent = "Đăng nhập app trên Chrome này để bật chặn.";
  } else if (status.focusing) {
    box.classList.add("focusing");
    line.textContent = "🌱 Đang tập trung: " + (status.task?.title || "task");
    sub.textContent = "Các trang trong danh sách đang bị chặn.";
  } else {
    box.classList.add("off");
    line.textContent = "😴 Không có task Đang làm";
    sub.textContent = "Kéo một task sang “Đang làm” để bật chặn.";
  }

  box.append(line);
  if (sub.textContent) box.append(sub);
}

function renderSites(sites) {
  const list = $("sites");
  list.replaceChildren();
  if (sites.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "Chưa có trang nào";
    list.append(li);
    return;
  }
  for (const site of sites) {
    const li = document.createElement("li");
    const name = document.createElement("span");
    name.textContent = site;
    const btn = document.createElement("button");
    btn.className = "remove";
    btn.type = "button";
    btn.title = "Bỏ chặn";
    btn.textContent = "✕";
    btn.addEventListener("click", async () => {
      const { blockedSites } = await getSettings();
      const next = blockedSites.filter((s) => s !== site);
      await chrome.storage.sync.set({ blockedSites: next });
      renderSites(next);
    });
    li.append(name, btn);
    list.append(li);
  }
}

async function refresh() {
  renderStatus(null);
  const status = await chrome.runtime.sendMessage({ type: "refresh" });
  renderStatus(status);
}

async function init() {
  const { appUrl, blockedSites } = await getSettings();
  $("app-url").value = appUrl;
  renderSites(blockedSites);

  const { lastStatus } = await chrome.storage.local.get("lastStatus");
  renderStatus(lastStatus ?? null);
  refresh();

  $("add-site").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("site-error");
    const domain = normalizeDomain($("site-input").value);
    if (!domain) {
      err.textContent = "Tên miền không hợp lệ.";
      err.hidden = false;
      return;
    }
    err.hidden = true;
    const { blockedSites: current } = await getSettings();
    if (!current.includes(domain)) {
      const next = [...current, domain];
      await chrome.storage.sync.set({ blockedSites: next });
      renderSites(next);
    }
    $("site-input").value = "";
  });

  $("app-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const value = $("app-url").value.trim().replace(/\/+$/, "");
    if (!value) return;
    await chrome.storage.sync.set({ appUrl: value });
    refresh();
  });

  $("refresh").addEventListener("click", refresh);

  $("open-app").addEventListener("click", async () => {
    const { appUrl: url } = await getSettings();
    chrome.tabs.create({ url });
  });
}

init();

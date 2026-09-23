# Titroutine Focus Guard (Chrome extension)

Blocks distracting sites while you have a task in **Đang làm** (`in_progress`)
on Titroutine. Move the task to Đã xong / Cần làm and the sites open again
within ~30 seconds, or right away if you press "Làm mới" in the popup.

## Install (unpacked)

1. Run the web app (`npm run dev` → http://localhost:3000) and **sign in** in
   the same Chrome profile.
2. Open `chrome://extensions`, turn on **Developer mode**, click **Load
   unpacked** and pick this folder (`extensions/chrome`).
3. Click the extension icon. If the app isn't on `http://localhost:3000`, enter
   its URL under "Địa chỉ app Titroutine".

## How it works

- `background.js` polls `GET <appUrl>/api/focus-status` every 30s with the
  app's Supabase session cookie (`apps/web/src/app/api/focus-status/route.ts`).
- If a task is in progress, it adds `declarativeNetRequest` redirect rules for
  each blocked domain (and its subdomains) → `blocked.html`, and redirects
  tabs already open on those sites.
- Any other state (no task, signed out, app unreachable) removes every rule, so
  it never blocks by mistake.
- The block list and app URL are stored in `chrome.storage.sync`; defaults live
  in `config.js`.

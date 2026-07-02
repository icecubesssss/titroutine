"""Clean baby_rabbit_phase1_clean.png: the AI grid left, in every frame, an opaque
periwinkle generation panel (~rgb(166,179,245)) behind the bunny plus English
caption text above it. Per frame we:
  1. locate the panel via chroma distance to the key colour,
  2. wipe everything OUTSIDE the panel bbox (captions, stray marks),
  3. key the panel out with a feathered alpha ramp + defringe so edges stay soft.
Caption text that overlaps the panel bbox survives step 3, so a final pass drops
every connected component that is not the bunny body (largest component) and whose
bbox starts in the caption band (top < 45px) — legit detached details (the "Zzz"
glyphs, motion dashes, carrot crumbs) all start lower.
The original is backed up to sprite-src/backup/ before overwriting.
"""
import os
import shutil
from collections import deque

from PIL import Image

ASSET = "public/assets/baby_rabbit_phase1_clean.png"
BACKUP_DIR = "sprite-src/backup"
FW, FH = 262, 222
COLS, ROWS = 4, 5
KEY = (166, 179, 245)
# Chroma distance thresholds: < CUT is pure panel, CUT..SOFT is the feather band.
CUT, SOFT = 45, 80


def dist(p):
    return (
        (p[0] - KEY[0]) ** 2 + (p[1] - KEY[1]) ** 2 + (p[2] - KEY[2]) ** 2
    ) ** 0.5


def clean_frame(im, x0, y0):
    # 1. panel bbox from hard-keyed pixels
    panel = []
    for y in range(FH):
        for x in range(FW):
            p = im.getpixel((x0 + x, y0 + y))
            if p[3] > 0 and dist(p) < CUT:
                panel.append((x, y))
    if len(panel) < FW * FH * 0.03:
        return 0  # no leftover panel in this frame
    xs = [p[0] for p in panel]
    ys = [p[1] for p in panel]
    bx0, bx1 = min(xs) - 2, max(xs) + 2
    by0, by1 = min(ys) - 2, max(ys) + 2

    removed = 0
    for y in range(FH):
        for x in range(FW):
            p = im.getpixel((x0 + x, y0 + y))
            if p[3] == 0:
                continue
            inside = bx0 <= x <= bx1 and by0 <= y <= by1
            if not inside:
                # caption text / stray marks around the generation cell
                im.putpixel((x0 + x, y0 + y), (0, 0, 0, 0))
                removed += 1
                continue
            d = dist(p)
            if d < CUT:
                im.putpixel((x0 + x, y0 + y), (0, 0, 0, 0))
                removed += 1
            elif d < SOFT:
                # feather band: un-mix the key colour so no purple fringe stays
                a = (d - CUT) / (SOFT - CUT)
                fg = tuple(
                    max(0, min(255, round((c - (1 - a) * k) / max(a, 1e-6))))
                    for c, k in zip(p[:3], KEY)
                )
                im.putpixel((x0 + x, y0 + y), (*fg, round(p[3] * a)))
    return removed


CAPTION_BAND = 45  # caption components all start above this row; real details lower


def drop_caption_components(im, x0, y0):
    px = im.load()
    seen = [[False] * FW for _ in range(FH)]
    comps = []
    for yy in range(FH):
        for xx in range(FW):
            if seen[yy][xx] or px[x0 + xx, y0 + yy][3] == 0:
                continue
            q = deque([(xx, yy)])
            seen[yy][xx] = True
            pts = []
            while q:
                x, y = q.popleft()
                pts.append((x, y))
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        nx, ny = x + dx, y + dy
                        if (
                            0 <= nx < FW
                            and 0 <= ny < FH
                            and not seen[ny][nx]
                            and px[x0 + nx, y0 + ny][3] > 0
                        ):
                            seen[ny][nx] = True
                            q.append((nx, ny))
            comps.append(pts)
    if not comps:
        return 0
    comps.sort(key=len, reverse=True)
    removed = 0
    for pts in comps[1:]:  # comps[0] = bunny body, always kept
        if min(p[1] for p in pts) < CAPTION_BAND:
            for x, y in pts:
                px[x0 + x, y0 + y] = (0, 0, 0, 0)
            removed += len(pts)
    return removed


def main():
    os.makedirs(BACKUP_DIR, exist_ok=True)
    backup = os.path.join(BACKUP_DIR, os.path.basename(ASSET))
    if not os.path.exists(backup):
        shutil.copy2(ASSET, backup)
        print("backed up ->", backup)

    im = Image.open(ASSET).convert("RGBA")
    assert im.size == (FW * COLS, FH * ROWS), im.size
    for r in range(ROWS):
        for c in range(COLS):
            n = clean_frame(im, c * FW, r * FH)
            t = drop_caption_components(im, c * FW, r * FH)
            print(f"frame r{r} c{c}: keyed {n} px, caption {t} px")
    im.save(ASSET)
    print("saved", ASSET)


if __name__ == "__main__":
    main()

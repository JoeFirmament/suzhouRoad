#!/usr/bin/env python3
"""
留园入口 · 灰模与控制图生成器（无 Blender 依赖）。

输入是正式 Tile 数据 `src/data/liuyuan-entry-study.ts` 里的可走区域；
输出 1008×688 的 four-pass 控制图，供绘制/生图使用：

  beauty.png   平光灰模（看体量）
  seg.png      材质分区（ControlNet seg）
  depth.png    深度（ControlNet depth；近白远黑）
  line.png     轮廓线（ControlNet lineart）
  overlay.png  灰模 + 12 脚点 + 三段落镜框（人工核对）

投影采用 2.5D 剪切：screen_y = y − z·0.55。
z=0 的脚点因此与 1008×688 世界坐标 1:1 重合——**对齐由构造保证**。

用法：
  python3 scripts/entry_greybox.py
"""
from __future__ import annotations
import math, os, re, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
TS = ROOT / "src/data/liuyuan-entry-study.ts"
W, H, TILE = 1008, 688, 16
SHEAR = float(os.environ.get("SHEAR", "0"))  # 0 = 平面布局；0.55 = 2.5D 剪切
OUT = ROOT / ("control/liuyuan-entry" + ("" if SHEAR == 0 else "-shear"))

# ---------- 解析 Tile 数据 ----------
text = TS.read_text(encoding="utf8")
region_re = re.compile(
    r"\{\s*id:\s*'([^']+)',\s*x:\s*(\d+),\s*y:\s*(\d+),\s*w:\s*(\d+),\s*h:\s*(\d+),\s*tile:\s*T\.([A-Z]+)\s*\}"
)
regions = [(m[1], int(m[2]), int(m[3]), int(m[4]), int(m[5]), m[6]) for m in region_re.finditer(text)]
if not regions:
    sys.exit("没有解析到 Tile 区域，检查 liuyuan-entry-study.ts 的格式")

T = dict(GRASS=0, PATH=1, WATER=2, WALL=3, CORR=4, ROCK=5, TREE=6, PLAT=7, BRIDGE=8, FLOWER=9, WIN=10, DIRT=11, RAIL=12, ROOF=13, PAV=14, BAMBOO=15)
MW, MH = 63, 43
tile = np.full((MH, MW), T["WALL"], dtype=np.int32)
for _id, x, y, w, h, name in regions:
    tile[y:y + h, x:x + w] = T[name]
walk = (tile == T["PATH"]) | (tile == T["CORR"])

# ---------- 边界 → 墙段 ----------
segs = []
for y in range(MH):
    for x in range(MW):
        if not walk[y, x]:
            continue
        px, py = x * TILE, y * TILE
        if y == 0 or not walk[y - 1, x]: segs.append((px, py, px + TILE, py, "n"))
        if y == MH - 1 or not walk[y + 1, x]: segs.append((px, py + TILE, px + TILE, py + TILE, "s"))
        if x == 0 or not walk[y, x - 1]: segs.append((px, py, px, py + TILE, "w"))
        if x == MW - 1 or not walk[y, x + 1]: segs.append((px + TILE, py, px + TILE, py + TILE, "e"))

def merge(segs):
    out = []
    for side in ("n", "s", "e", "w"):
        pool = [s for s in segs if s[4] == side]
        pool.sort(key=lambda s: (s[1], s[0]) if side in "ns" else (s[0], s[1]))
        used = set()
        for i, s in enumerate(pool):
            if i in used: continue
            x1, y1, x2, y2, _ = s
            grew = True
            while grew:
                grew = False
                for j, t in enumerate(pool):
                    if j in used or j == i: continue
                    if side in "ns":
                        if t[1] == y1 and (t[0] == x2 or t[2] == x1):
                            x1, x2 = min(x1, t[0]), max(x2, t[2]); used.add(j); grew = True
                    else:
                        if t[0] == x1 and (t[1] == y2 or t[3] == y1):
                            y1, y2 = min(y1, t[1]), max(y2, t[3]); used.add(j); grew = True
            used.add(i)
            out.append((x1, y1, x2, y2, side))
    return out

edges = merge(segs)

# ---------- 几何 ----------
# 每个面：[(v0),(v1),(v2)]，顶点 (x,y,z)，材质名
faces = []
GROUND = {"PATH": "stone", "CORR": "corr", "WATER": "water", "WIN": "wall", "WALL": "wall"}

def quad(p0, p1, p2, p3, mat):
    faces.append(((p0, p1, p2, p3), mat))

def box(x0, y0, x1, y1, z0, z1, mat, cap=None):
    # top
    quad((x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1), cap or mat)
    # south, east, north, west
    quad((x0, y1, z0), (x1, y1, z0), (x1, y1, z1), (x0, y1, z1), mat)
    quad((x1, y0, z0), (x1, y1, z0), (x1, y1, z1), (x1, y0, z1), mat)
    quad((x1, y0, z0), (x0, y0, z0), (x0, y0, z1), (x1, y0, z1), mat)
    quad((x0, y1, z0), (x0, y0, z0), (x0, y0, z1), (x0, y1, z1), mat)

# 地面：可走区 + 水
for _id, x, y, w, h, name in regions:
    if name == "WIN":
        continue
    quad((x * TILE, y * TILE, 0), ((x + w) * TILE, y * TILE, 0),
         ((x + w) * TILE, (y + h) * TILE, 0), (x * TILE, (y + h) * TILE, 0), GROUND.get(name, "stone"))

# 墙：高 112，墙外 18，压顶 8
WALL_H, WALL_T, CAP_T = 112, 18, 8
for x1, y1, x2, y2, side in edges:
    # 剖面约定：南侧墙不砌，否则会挡住镜头后的地面（与府学场景的"切掉近墙"一致）
    if side == "s":
        continue
    if side == "n":   bx0, by0, bx1, by1 = x1, y1 - WALL_T, x2, y1
    elif side == "s": bx0, by0, bx1, by1 = x1, y1, x2, y1 + WALL_T
    elif side == "w": bx0, by0, bx1, by1 = x1 - WALL_T, y1, x1, y2
    else:             bx0, by0, bx1, by1 = x1, y1, x1 + WALL_T, y2
    # 门洞：x 496..544 在 y 576..624 之间不砌墙（由门屋构件另做）
    if by0 >= 570 and by1 <= 630 and bx0 < 544 and bx1 > 496:
        continue
    box(bx0, by0, bx1, by1, 0, WALL_H, "wall")
    box(bx0, by0, bx1, by1, WALL_H, WALL_H + CAP_T, "roof")
    # 墙后体块：向外延伸 64px，给控制图一个大面，避免只剩薄墙
    EXT = 64
    if side == "n":   mx0, my0, mx1, my1 = bx0, by0 - EXT, bx1, by0
    elif side == "w": mx0, my0, mx1, my1 = bx0 - EXT, by0, bx0, by1
    else:             mx0, my0, mx1, my1 = bx1, by0, bx1 + EXT, by1
    box(mx0, my0, mx1, my1, 0, WALL_H + 8, "wall", cap="roof")
    box(mx0, my0, mx1, my1, WALL_H + 8, WALL_H + 16, "roof")

# 门屋：两侧墙墩 + 门楣 + 瓦檐 + 门框
box(464, 576, 496, 624, 0, 128, "wall"); box(460, 572, 500, 628, 128, 136, "roof")
box(544, 576, 576, 624, 0, 128, "wall"); box(540, 572, 580, 628, 128, 136, "roof")
box(496, 576, 544, 592, 104, 128, "wood"); box(452, 566, 588, 606, 128, 140, "roof")
box(490, 592, 500, 624, 0, 104, "wood")
box(540, 592, 550, 624, 0, 104, "wood")

# 六窗墙：南面加六个窗洞（深色面板）
for i in range(6):
    wx = 368 + i * 21
    quad((wx, 224.5, 52), (wx + 14, 224.5, 52), (wx + 14, 224.5, 96), (wx, 224.5, 96), "dark")

# 树：低模球冠 + 干
def sphere(cx, cy, cz, r, mat, rings=6, sectors=10):
    for i in range(rings):
        t0, t1 = math.pi * i / rings, math.pi * (i + 1) / rings
        for j in range(sectors):
            p0, p1 = 2 * math.pi * j / sectors, 2 * math.pi * (j + 1) / sectors
            def v(t, p):
                return (cx + r * math.sin(t) * math.cos(p), cy + r * math.sin(t) * math.sin(p), cz + r * math.cos(t))
            quad(v(t0, p0), v(t0, p1), v(t1, p1), v(t1, p0), mat)

sphere(560, 196, 150, 46, "green")
box(556, 198, 564, 206, 0, 120, "wood")
sphere(624, 148, 170, 52, "green")
box(620, 150, 628, 158, 0, 132, "wood")
for bx in (348, 358, 368):
    box(bx, 286, bx + 5, 292, 0, 132, "green")

# 街边杂项
box(436, 636, 470, 654, 0, 26, "wood")
box(556, 466, 572, 484, 0, 20, "stone")

# ---------- 投影与着色 ----------
ORDER = {"stone": (104, 101, 94), "corr": (86, 85, 80), "water": (66, 80, 76),
         "wall": (168, 161, 150), "roof": (58, 61, 59), "wood": (112, 84, 58),
         "green": (68, 80, 54), "dark": (26, 28, 26), "earth": (64, 66, 58)}
SEG = {"stone": (150, 82, 200), "corr": (108, 58, 168), "water": (40, 80, 200),
       "wall": (230, 230, 230), "roof": (32, 32, 32), "wood": (210, 120, 40),
       "green": (40, 150, 60), "dark": (10, 10, 10), "earth": (40, 60, 40)}
LIGHT = np.array([0.35, -0.55, 0.75], dtype=float); LIGHT /= np.linalg.norm(LIGHT)

def project(p):
    x, y, z = p
    return (x, y - z * SHEAR, z)

def tri_normal(a, b, c):
    n = np.cross(np.array(b) - np.array(a), np.array(c) - np.array(a))
    ln = np.linalg.norm(n)
    return n / ln if ln else np.array([0, 0, 1.0])

tris = []
for verts, mat in faces:
    for k in range(1, len(verts) - 1):
        a, b, c = verts[0], verts[k], verts[k + 1]
        n = tri_normal(a, b, c)
        shade = 0.35 + 0.65 * abs(float(np.dot(n, LIGHT)))
        tris.append((np.array([a, b, c], dtype=float), mat, shade, (a[1] + b[1] + c[1]) / 3))
# 画家算法：北（远）先画，南（近）后画
tris.sort(key=lambda t: t[3])

beauty = np.zeros((H, W, 3), dtype=np.float32)
beauty[:, :] = ORDER["earth"]
segimg = np.zeros((H, W, 3), dtype=np.uint8)
segimg[:, :] = SEG["earth"]
depth = np.zeros((H, W), dtype=np.float32)

def raster(p0, p1, p2, z0, z1, z2, color, mat, shade):
    xs = [p0[0], p1[0], p2[0]]; ys = [p0[1], p1[1], p2[1]]
    x0, x1 = max(0, int(math.floor(min(xs)))), min(W - 1, int(math.ceil(max(xs))))
    y0, y1 = max(0, int(math.floor(min(ys)))), min(H - 1, int(math.ceil(max(ys))))
    if x1 < x0 or y1 < y0: return
    yy, xx = np.mgrid[y0:y1 + 1, x0:x1 + 1]
    d = (p1[1] - p2[1]) * (p0[0] - p2[0]) + (p2[0] - p1[0]) * (p0[1] - p2[1])
    if abs(d) < 1e-9: return
    a = ((p1[1] - p2[1]) * (xx - p2[0]) + (p2[0] - p1[0]) * (yy - p2[1])) / d
    b = ((p2[1] - p0[1]) * (xx - p2[0]) + (p0[0] - p2[0]) * (yy - p2[1])) / d
    c = 1 - a - b
    m = (a >= -1e-4) & (b >= -1e-4) & (c >= -1e-4)
    if not m.any(): return
    z = a * z0 + b * z1 + c * z2
    # 画家算法：不比对 z，后画的（更南）覆盖先画的
    sub = depth[y0:y1 + 1, x0:x1 + 1]
    sub[m] = z[m]
    base = np.array(ORDER[mat], dtype=np.float32)
    beauty[y0:y1 + 1, x0:x1 + 1][m] = np.clip(base * shade, 0, 255)
    segimg[y0:y1 + 1, x0:x1 + 1][m] = SEG[mat]

for pts, mat, shade, _ in tris:
    pr = [project(tuple(p)) for p in pts]
    raster(pr[0], pr[1], pr[2], pr[0][2], pr[1][2], pr[2][2], None, mat, shade)

OUT.mkdir(parents=True, exist_ok=True)
Image.fromarray(beauty.astype(np.uint8), "RGB").save(OUT / "beauty.png")
Image.fromarray(segimg, "RGB").save(OUT / "seg.png")

# depth：z 归一化，近白远黑（地面 z=0 最远 → 黑；屋脊最白）
dmin, dmax = 0.0, 150.0
dn = np.clip((depth - dmin) / (dmax - dmin), 0, 1)

Image.fromarray((dn * 255).astype(np.uint8), "L").save(OUT / "depth.png")

# line：seg 的 Sobel
g = segimg.mean(axis=2).astype(np.float32)
gx = np.abs(np.gradient(g, axis=1)); gy = np.abs(np.gradient(g, axis=0))
line = np.clip((gx + gy) * 1.6, 0, 255).astype(np.uint8)
line = 255 - line
Image.fromarray(line, "L").save(OUT / "line.png")

# overlay：灰模 + 12 脚点 + 落镜框
ov = Image.fromarray(beauty.astype(np.uint8), "RGB")
dr = ImageDraw.Draw(ov)
feet = [(520, 656), (520, 610), (520, 550), (520, 480), (520, 400), (430, 400),
        (430, 374), (430, 300), (430, 250), (420, 232), (340, 232), (290, 232)]
cam = [(268, 344, "A"), (185, 236, "B"), (150, 160, "C")]
for x, y, tag in cam:
    dr.rectangle([x, y, x + 504 - 1, y + 344 - 1], outline=(220, 60, 50), width=2)
    dr.text((x + 6, y + 6), f"{tag} 504x344", fill=(255, 220, 90))
for i, (x, y) in enumerate(feet):
    dr.ellipse([x - 4, y - 4, x + 4, y + 4], fill=(255, 230, 0), outline=(0, 0, 0))
    dr.text((x + 6, y - 6), f"{i+1:02d}", fill=(255, 230, 0))
ov.save(OUT / "overlay.png")

print(f"入口灰模控制图已生成：{OUT}")
for f in ("beauty.png", "seg.png", "depth.png", "line.png", "overlay.png"):
    p = OUT / f
    print(f"  {f:12s} {p.stat().st_size/1024:6.1f} KB")
print(f"  墙段 {len(edges)}，三角面 {len(tris)}，脚点 12")

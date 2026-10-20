#!/usr/bin/env python3
"""环秀山庄 · 山脚看山「三段长卷」构图稿（固定 zoom 用）。

3024×688 一张长卷；三段各 1008：
  A 东段  0–1008     主峰 + 东坡
  B 中段  1008–2016  次峰 + 洞口
  C 西段  2016–3024  西脸 + 钩带 + 石笋
相机固定 1×，只平移；脚点在各段内。
"""
import math, random
from pathlib import Path

W, H, SEG = 3024, 688, 1008
OUT = Path(__file__).resolve().parent

C = dict(
    sky="#c6cbc5", wall="#8f8a80", wall_hi="#a8a296", wall_lo="#7a756c",
    roof="#3b3d3c", rock1="#5c6158", rock2="#6b7066", rock3="#7a7f73",
    rock4="#4a4f47", rock_hi="#8a8f82", cave="#1c201c", path="#7e7c72",
    path_hi="#949184", rail="#5a4a3a", tree1="#3e4a37", tree2="#4c5a42",
    tree3="#5b6a4e", trunk="#4a3f32", ink="#23261f",
)

def jag(points, steps=5, amp=9, seed=7):
    rnd = random.Random(seed); out=[points[0]]
    for (x1,y1),(x2,y2) in zip(points, points[1:]):
        dx,dy=x2-x1,y2-y1; ln=math.hypot(dx,dy) or 1
        nx,ny=-dy/ln,dx/ln
        for i in range(1,steps):
            t=i/steps; off=rnd.uniform(-amp,amp)
            out.append((x1+dx*t+nx*off, y1+dy*t+ny*off))
    out.append(points[-1]); return out

def poly(pts, fill, opacity=1.0, stroke=None, sw=0):
    d="M"+" L".join(f"{x:.1f},{y:.1f}" for x,y in pts)+" Z"
    s=f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
    o=f' opacity="{opacity}"' if opacity!=1 else ""
    return f'<path d="{d}" fill="{fill}"{s}{o}/>'

def main():
    crest = [
        (110,648),(130,600),(170,570),(160,530),(200,500),(190,460),(235,430),
        (225,390),(270,360),(260,320),(300,290),(290,250),(330,220),(320,180),
        (360,150),(382,118),(408,145),(438,125),(462,150),(488,130),(512,160),
        (540,185),(572,210),(596,250),(636,270),(656,310),(696,330),(716,370),
        (756,390),(776,430),(816,450),(836,490),(876,510),(896,550),(936,570),
        (956,610),(996,630),(1030,612),(1052,566),(1092,536),(1112,486),(1152,456),
        (1172,406),(1212,376),(1232,336),(1272,306),(1292,266),(1332,246),(1352,214),
        (1392,196),(1420,170),(1452,190),(1484,206),(1516,226),(1544,262),(1580,284),
        (1600,324),(1640,344),(1660,384),(1700,404),(1720,444),(1760,464),(1780,504),
        (1820,524),(1840,564),(1880,584),(1900,614),(1940,634),(1980,640),
        (2010,616),(2032,578),(2072,558),(2092,518),(2132,498),(2152,458),(2192,438),
        (2212,398),(2252,378),(2272,338),(2312,318),(2332,278),(2372,258),(2392,218),
        (2432,198),(2456,228),(2486,248),(2506,288),(2546,308),(2566,348),(2606,368),
        (2626,408),(2666,428),(2686,468),(2726,488),(2746,528),(2786,548),(2806,588),
        (2846,608),(2866,638),(2906,648),
    ]
    outline = jag(crest, steps=4, amp=8, seed=13)
    parts=[]
    parts.append(f'<rect width="{W}" height="{H}" fill="{C["sky"]}"/>')
    parts.append(f'<rect x="0" y="196" width="{W}" height="20" fill="{C["roof"]}"/>')
    parts.append(f'<rect x="0" y="216" width="{W}" height="472" fill="{C["wall"]}"/>')
    parts.append(f'<rect x="0" y="216" width="{W}" height="10" fill="{C["wall_hi"]}" opacity=".7"/>')
    parts.append(f'<rect x="0" y="640" width="{W}" height="14" fill="{C["wall_lo"]}"/>')
    # 树：西段墙后
    for cx,cy,rx,ry,col in [(2900,128,80,56,C["tree2"]),(2840,116,54,42,C["tree3"]),(2950,166,46,36,C["tree1"])]:
        parts.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{col}"/>')
    parts.append(f'<rect x="2884" y="170" width="18" height="120" fill="{C["trunk"]}"/>')
    # 山体
    parts.append(poly(outline, C["rock2"]))
    # 受光/背光的大面（三段各一组，示意）
    parts.append(poly([(320,180),(360,150),(382,118),(408,145),(438,125),(462,150),(488,130),(512,160),
                       (500,320),(430,420),(360,500),(320,560),(280,430),(300,320)], C["rock3"], .85))
    parts.append(poly([(540,185),(572,210),(596,250),(636,270),(656,310),(696,330),(716,370),(756,390),
                       (740,520),(680,620),(620,648),(560,560),(540,420)], C["rock4"], .8))
    parts.append(poly([(1332,246),(1352,214),(1392,196),(1420,170),(1452,190),(1484,206),(1516,226),(1544,262),
                       (1530,400),(1460,520),(1400,620),(1350,560),(1320,420)], C["rock3"], .85))
    parts.append(poly([(1600,324),(1640,344),(1660,384),(1700,404),(1720,444),(1760,464),(1780,504),
                       (1740,600),(1680,648),(1620,600),(1590,480)], C["rock4"], .8))
    parts.append(poly([(2332,278),(2372,258),(2392,218),(2432,198),(2456,228),(2486,248),(2506,288),
                       (2492,420),(2420,520),(2360,600),(2320,520),(2300,400)], C["rock3"], .85))
    parts.append(poly([(2606,368),(2626,408),(2666,428),(2686,468),(2726,488),(2746,528),(2786,548),
                       (2760,620),(2700,648),(2640,600),(2620,480)], C["rock4"], .8))
    # 裂（东段主峰与东坡之间）
    parts.append(poly([(470,130),(490,150),(498,300),(488,460),(476,640),(458,640),(466,430),(460,260)], C["rock4"], .9))
    # 洞（中段）
    parts.append('<path d="M1408 648 L1408 540 Q1470 470 1532 540 L1532 648 Z" fill="#1c201c"/>')
    parts.append('<path d="M1458 566 Q1474 544 1492 566 L1492 604 Q1474 590 1458 604 Z" fill="#2a302a" opacity=".9"/>')
    parts.append('<circle cx="1474" cy="572" r="3" fill="#c9cec0" opacity=".55"/>')
    # 钩带（西段）
    blocks=[[(2500,520),(2544,504),(2566,532),(2544,558),(2510,552)],
            [(2544,504),(2590,494),(2604,528),(2566,532)],
            [(2566,532),(2604,528),(2616,566),(2576,574),(2544,558)],
            [(2510,552),(2544,558),(2576,574),(2556,602),(2518,590)],
            [(2576,574),(2616,566),(2628,600),(2590,606),(2556,602)]]
    for i,b in enumerate(blocks):
        parts.append(poly(b, C["rock3"] if i%2==0 else C["rock2"], .95, stroke="#2f342f", sw=2))
        parts.append(f'<path d="M{b[0][0]} {b[0][1]} L{b[1][0]} {b[1][1]}" stroke="{C["rock_hi"]}" stroke-width="2" opacity=".5"/>')
    # 透孔
    for cx,cy,rx,ry in [(610,340,16,10),(660,470,12,8),(1610,340,14,9),(2350,360,15,10),(2700,470,12,8)]:
        parts.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx+3}" ry="{ry+2}" fill="{C["rock_hi"]}" opacity=".25"/>')
        parts.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="#141714"/>')
    # 磴道（看得见、上不去）
    parts.append('<path d="M1690 520 L1662 482 L1680 450 L1650 420 L1666 392" stroke="#9a9d8e" stroke-width="4" fill="none" opacity=".5"/>')
    parts.append('<path d="M2440 470 L2412 432 L2430 400 L2400 370 L2416 342" stroke="#9a9d8e" stroke-width="4" fill="none" opacity=".45"/>')
    # 段缝树：正好长在 1008 的接缝上，树干挡缝、树冠挡天
    parts.append('<rect x="998" y="176" width="20" height="472" fill="#4a3f32"/>')
    parts.append('<path d="M1004 300 L960 250 M1012 330 L1058 282 M1008 260 L1030 214" stroke="#4a3f32" stroke-width="10" fill="none"/>')
    for cx,cy,rx,ry,col in [(1008,120,78,52,C["tree2"]),(952,150,46,34,C["tree3"]),(1066,144,50,34,C["tree1"]),(1008,196,40,24,C["tree3"])]:
        parts.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{col}"/>')
    parts.append(poly([(986,648),(992,600),(1010,588),(1028,604),(1032,648)], C["rock2"]))
    parts.append(poly([(992,600),(1010,588),(1014,612),(1000,624)], C["rock3"], .5))
    # 石根
    for x,w,h in [(120,60,34),(180,70,26),(250,54,30),(310,66,24),(380,48,26),(450,58,22),(520,62,28),
                  (590,54,24),(660,60,30),(730,50,22),(800,58,26),(870,50,22),(940,56,28),
                  (1060,60,26),(1130,54,22),(1200,58,30),(1270,50,24),(1340,56,26),(1410,50,22),
                  (1560,58,26),(1630,54,22),(1700,60,28),(1770,50,24),(1840,56,26),(1910,50,22),
                  (2020,58,26),(2090,54,22),(2160,60,28),(2230,50,24),(2300,56,26),(2370,50,22),
                  (2440,58,26),(2510,54,22),(2580,60,28),(2650,50,24),(2720,56,26),(2790,50,22),(2860,54,26)]:
        parts.append(f'<rect x="{x}" y="{648-h}" width="{w}" height="{h}" fill="{C["rock2"]}"/>')
        parts.append(f'<rect x="{x}" y="{648-h}" width="{w}" height="5" fill="{C["rock3"]}" opacity=".6"/>')
    # 栏杆 + 路
    parts.append(f'<rect x="0" y="640" width="{W}" height="8" fill="{C["rail"]}"/>')
    for x in range(24, W, 56):
        parts.append(f'<rect x="{x}" y="620" width="6" height="34" fill="{C["rail"]}"/>')
    parts.append(f'<rect x="0" y="618" width="{W}" height="5" fill="{C["rail"]}"/>')
    parts.append(f'<rect x="0" y="652" width="{W}" height="36" fill="{C["path"]}"/>')
    parts.append(f'<path d="M0 664 H{W} M0 678 H{W}" stroke="{C["path_hi"]}" stroke-width="2" opacity=".5"/>')
    body="\n  ".join(parts)
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" shape-rendering="crispEdges">
  <title>环秀山庄 · 山脚看山 · 三段长卷构图稿 v0</title>
  <desc>3024×688，三段各 1008；相机固定 1×，只平移。山体为体块，不是测绘。</desc>
  {body}
</svg>'''
    (OUT/"scroll.svg").write_text(svg, encoding="utf8")

    ov=[f'<rect width="{W}" height="{H}" fill="none"/>']
    for i,(x,lab) in enumerate([(0,"A 东"),(1008,"B 中"),(2016,"C 西")]):
        ov.append(f'<rect x="{x+1}" y="1" width="1006" height="{H-2}" fill="none" stroke="#d94b3f" stroke-width="3"/>')
        ov.append(f'<rect x="{x+8}" y="8" width="120" height="22" fill="#141714" opacity=".75"/>')
        ov.append(f'<text x="{x+16}" y="24" font-family="monospace" font-size="14" fill="#ffe27a">{lab} · 1008×688</text>')
        ov.append(f'<line x1="{x+40}" y1="688" x2="{x+40}" y2="562" stroke="#ff6b5e" stroke-width="3"/>')
        ov.append(f'<text x="{x+48}" y="600" font-family="monospace" font-size="11" fill="#ff6b5e">126px</text>')
        fx=x+500
        ov.append(f'<polygon points="{fx-10},688 {fx+10},688 {fx},668" fill="#7fd6ff"/>')
    overlay=f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
  {body}
  {"".join(ov)}
</svg>'''
    (OUT/"scroll-overlay.svg").write_text(overlay, encoding="utf8")

    seam=f'''<svg xmlns="http://www.w3.org/2000/svg" width="2016" height="{H}" viewBox="0 0 2016 {H}" shape-rendering="crispEdges">
  <title>环秀山庄 · A→B 段缝试段</title>
  <desc>A（0–1008）→ 缝（1008，树干/树冠/山坳）→ B（1008–2016）。相机固定 1×，连续平移。</desc>
  {body}
</svg>'''
    (OUT/"seam.svg").write_text(seam, encoding="utf8")
    print("wrote scroll.svg / scroll-overlay.svg")

if __name__=="__main__":
    main()

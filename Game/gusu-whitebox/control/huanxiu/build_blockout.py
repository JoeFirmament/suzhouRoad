#!/usr/bin/env python3
"""环秀山庄 · 山脚看山「构图稿」生成器（不是美术）。

输出 1008×688 的构图稿：
  blockout.svg      分层体块（天/墙/树/山/洞/石根/栏杆/路/人）
  overlay.svg       叠加：相机框、三分线、主峰/洞/留白标注、126px 人形比例尺
  closeup.svg       特写取景：洞口 + 钩带接缝（320×240）

坐标即世界坐标（1008×688），脚点在 y=688。画师/生图按此填色与质感。
"""
import math, random
from pathlib import Path

W, H = 1008, 688
OUT = Path(__file__).resolve().parent

C = dict(
    sky="#c6cbc5", wall="#8f8a80", wall_hi="#a8a296", wall_lo="#7a756c",
    roof="#3b3d3c", roof_hi="#4c4f4c",
    rock1="#5c6158", rock2="#6b7066", rock3="#7a7f73", rock4="#4a4f47", rock_hi="#8a8f82",
    cave="#1c201c", path="#7e7c72", path_hi="#949184", rail="#5a4a3a",
    tree1="#3e4a37", tree2="#4c5a42", tree3="#5b6a4e", trunk="#4a3f32",
    ink="#23261f", accent="#b03a2e",
)

def jag(points, steps=6, amp=10, seed=7):
    """在控制点之间加锯齿，模拟湖石轮廓。"""
    rnd = random.Random(seed)
    out = [points[0]]
    for (x1, y1), (x2, y2) in zip(points, points[1:]):
        dx, dy = x2 - x1, y2 - y1
        ln = math.hypot(dx, dy) or 1
        nx, ny = -dy / ln, dx / ln
        for i in range(1, steps):
            t = i / steps
            off = rnd.uniform(-amp, amp)
            out.append((x1 + dx * t + nx * off, y1 + dy * t + ny * off))
    out.append(points[-1])
    return out

def poly(pts, fill, opacity=1.0, stroke=None, sw=0):
    d = "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts) + " Z"
    s = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
    o = f' opacity="{opacity}"' if opacity != 1 else ""
    return f'<path d="{d}" fill="{fill}"{s}{o}/>'

def main():
    # 山体主轮廓：东西约 600px，高约 520px；主峰偏西，次峰偏东，中间一道裂
    crest = [
        (150, 648), (165, 590), (200, 560), (190, 520), (225, 490), (215, 445),
        (250, 420), (240, 380), (275, 355), (265, 315), (300, 290), (295, 250),
        (330, 225), (322, 190), (355, 168), (350, 135), (382, 118), (392, 145),
        (418, 128), (440, 150), (462, 122), (486, 142), (505, 170), (535, 185),
        (548, 220), (582, 238), (575, 280), (608, 302), (600, 345), (635, 370),
        (628, 415), (662, 440), (655, 485), (690, 510), (682, 555), (715, 580),
        (708, 620), (738, 648),
    ]
    outline = jag(crest, steps=5, amp=9, seed=11)

    parts = []
    parts.append(f'<rect width="{W}" height="{H}" fill="{C["sky"]}"/>')
    # 远墙与瓦顶
    parts.append(f'<rect x="0" y="196" width="{W}" height="20" fill="{C["roof"]}"/>')
    parts.append(f'<rect x="0" y="216" width="{W}" height="472" fill="{C["wall"]}"/>')
    parts.append(f'<rect x="0" y="216" width="{W}" height="10" fill="{C["wall_hi"]}" opacity=".7"/>')
    parts.append(f'<rect x="0" y="640" width="{W}" height="14" fill="{C["wall_lo"]}"/>')
    # 树：墙后，只露冠
    for cx, cy, rx, ry, col in [(842, 128, 86, 60, C["tree2"]), (782, 112, 58, 44, C["tree3"]),
                                (900, 168, 52, 40, C["tree1"]), (760, 170, 40, 30, C["tree2"])]:
        parts.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{col}"/>')
    parts.append(f'<rect x="826" y="170" width="18" height="120" fill="{C["trunk"]}"/>')
    # 山体
    parts.append(poly(outline, C["rock2"]))
    # 受光面（西/上）
    parts.append(poly([(300,290),(295,250),(330,225),(322,190),(355,168),(350,135),(382,118),
                       (392,145),(418,128),(440,150),(430,250),(380,330),(330,380),(300,420)], C["rock3"], .9))
    # 背光面（东）
    parts.append(poly([(505,170),(535,185),(548,220),(582,238),(575,280),(608,302),(600,345),
                       (635,370),(628,415),(662,440),(655,485),(690,510),(682,555),(715,580),
                       (708,620),(738,648),(560,648),(540,480)], C["rock4"], .85))
    # 几块亮面/暗缝
    parts.append(poly([(240,380),(275,355),(300,420),(270,470),(230,445)], C["rock_hi"], .35))
    parts.append(poly([(430,250),(470,240),(480,330),(450,390),(420,340)], C["rock_hi"], .25))
    parts.append(poly([(540,300),(575,320),(560,420),(530,470),(515,380)], C["rock4"], .6))
    # 裂：主峰与次峰之间
    parts.append(poly([(492,130),(512,150),(520,300),(510,470),(498,640),(480,640),(488,430),(482,260)], C["rock4"], .9))
    # 洞：拱形，内有远光
    parts.append('<path d="M418 648 L418 540 Q462 470 520 540 L520 648 Z" fill="#1c201c"/>')
    parts.append('<path d="M470 560 Q486 540 502 560 L502 600 Q486 586 470 600 Z" fill="#2a302a" opacity=".9"/>')
    parts.append('<circle cx="486" cy="566" r="3" fill="#c9cec0" opacity=".55"/>')
    # 透孔
    for cx, cy, rx, ry in [(610, 340, 16, 10), (660, 470, 12, 8), (250, 560, 10, 7)]:
        parts.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx+3}" ry="{ry+2}" fill="{C["rock_hi"]}" opacity=".25"/>')
        parts.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="#141714"/>')
    # 钩带接缝：可放大看的一组咬合石（不进游戏碰撞，只作视觉证据）
    blocks = [
        [(556,520),(600,504),(622,532),(600,558),(566,552)],
        [(600,504),(646,494),(660,528),(622,532)],
        [(622,532),(660,528),(672,566),(632,574),(600,558)],
        [(566,552),(600,558),(632,574),(612,602),(574,590)],
        [(632,574),(672,566),(684,600),(646,606),(612,602)],
    ]
    for i,b in enumerate(blocks):
        parts.append(poly(b, C["rock3"] if i % 2 == 0 else C["rock2"], .95, stroke="#2f342f", sw=2))
        parts.append(f'<path d="M{b[0][0]} {b[0][1]} L{b[1][0]} {b[1][1]}" stroke="{C["rock_hi"]}" stroke-width="2" opacity=".5"/>')
    # 磴道：一条看得见、走不上去的折线
    parts.append('<path d="M700 500 L672 462 L690 430 L660 400 L676 372" stroke="#9a9d8e" stroke-width="4" fill="none" opacity=".55"/>')
    # 左侧独立石 + 右侧小石笋（丰富剪影）
    parts.append(poly([(96,648),(104,580),(120,556),(136,584),(140,648)], C["rock2"]))
    parts.append(poly([(104,580),(120,556),(126,584),(114,610)], C["rock3"], .5))
    parts.append(poly([(742,648),(750,520),(764,470),(780,500),(786,556),(800,648)], C["rock2"]))
    parts.append(poly([(750,520),(764,470),(772,520),(766,570)], C["rock3"], .45))
    # 石根：一排矮石，压住山脚
    for x, w, h in [(140,60,34),(200,70,26),(270,54,30),(330,66,24),(400,48,26),(470,58,22),(540,62,28),(610,54,24),(670,60,30),(730,50,22)]:
        parts.append(f'<rect x="{x}" y="{648-h}" width="{w}" height="{h}" fill="{C["rock2"]}"/>')
        parts.append(f'<rect x="{x}" y="{648-h}" width="{w}" height="5" fill="{C["rock3"]}" opacity=".6"/>')
    # 栏杆：不可登的界
    parts.append(f'<rect x="0" y="640" width="{W}" height="8" fill="{C["rail"]}"/>')
    for x in range(24, W, 56):
        parts.append(f'<rect x="{x}" y="620" width="6" height="34" fill="{C["rail"]}"/>')
    parts.append(f'<rect x="0" y="618" width="{W}" height="5" fill="{C["rail"]}"/>')
    # 路
    parts.append(f'<rect x="0" y="652" width="{W}" height="36" fill="{C["path"]}"/>')
    parts.append(f'<path d="M0 664 H1008 M0 678 H1008" stroke="{C["path_hi"]}" stroke-width="2" opacity=".5"/>')
    # 人：126px，脚在 688
    px, py, ph = 300, 688, 126
    parts.append(f'<ellipse cx="{px}" cy="{py-ph/2}" rx="26" ry="{ph/2+6}" fill="#c6cbc5" opacity=".18"/>')
    parts.append(f'<g fill="{C["ink"]}"><ellipse cx="{px}" cy="{py}" rx="16" ry="4" opacity=".35"/>'
                 f'<rect x="{px-10}" y="{py-ph}" width="20" height="{ph-40}" rx="6"/>'
                 f'<circle cx="{px}" cy="{py-ph+12}" r="12"/>'
                 f'<rect x="{px-9}" y="{py-44}" width="7" height="44"/><rect x="{px+2}" y="{py-44}" width="7" height="44"/></g>')
    body = "\n  ".join(parts)
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" shape-rendering="crispEdges">
  <title>环秀山庄 · 山脚看山 · 构图稿 v0</title>
  <desc>1008×688 世界坐标；分层体块，不是美术。山体/洞/裂/石根/栏杆/路/人比例供填色参考。</desc>
  {body}
</svg>'''
    (OUT / "blockout.svg").write_text(svg, encoding="utf8")

    # 无人物版：给取景原型用（人物只作比例尺，避免重复）
    import re as _re
    empty = _re.sub(r'<ellipse cx="\d+" cy="\d+" rx="26" ry="\d+" fill="#c6cbc5" opacity="\.18"/>\n\s*', '', svg)
    empty = _re.sub(r'<g fill="#23261f">.*?</g>', '', empty, flags=_re.S)
    (OUT / "blockout-empty.svg").write_text(empty, encoding="utf8")

    # overlay：相机框 + 三分线 + 标注 + 比例尺
    ov = [f'<rect width="{W}" height="{H}" fill="none"/>']
    ov.append(f'<rect x="1" y="1" width="{W-2}" height="{H-2}" fill="none" stroke="#d94b3f" stroke-width="3"/>')
    for i in (1,2):
        ov.append(f'<line x1="{W*i/3:.0f}" y1="0" x2="{W*i/3:.0f}" y2="{H}" stroke="#f0d264" stroke-width="1" stroke-dasharray="6 8" opacity=".8"/>')
        ov.append(f'<line x1="0" y1="{H*i/3:.0f}" x2="{W}" y2="{H*i/3:.0f}" stroke="#f0d264" stroke-width="1" stroke-dasharray="6 8" opacity=".8"/>')
    labels = [("主峰", 392, 160), ("洞", 468, 500), ("裂", 505, 380), ("钩带接缝", 596, 486), ("留白（天）", 760, 70),
              ("树冠（背景）", 842, 200), ("石根（前景）", 300, 660), ("栏杆 = 不可登", 120, 612)]
    for t,x,y in labels:
        ov.append(f'<rect x="{x-4}" y="{y-14}" width="{len(t)*13+10}" height="20" fill="#141714" opacity=".72"/>')
        ov.append(f'<text x="{x+2}" y="{y}" font-family="monospace" font-size="13" fill="#ffe27a">{t}</text>')
    # 126px 比例尺
    ov.append(f'<line x1="60" y1="688" x2="60" y2="562" stroke="#ff6b5e" stroke-width="3"/>')
    ov.append(f'<text x="68" y="600" font-family="monospace" font-size="12" fill="#ff6b5e">126px = 书生</text>')
    for i,(cx,lab) in enumerate([(220,"A 东"),(470,"B 中"),(700,"C 西")]):
        ov.append(f'<polygon points="{cx-10},688 {cx+10},688 {cx},668" fill="#7fd6ff" opacity=".85"/>')
        ov.append(f'<text x="{cx+12}" y="684" font-family="monospace" font-size="12" fill="#7fd6ff">{lab}</text>')
    ov.append(f'<text x="12" y="24" font-family="monospace" font-size="13" fill="#ffe27a">构图稿 v0 · 1008×688 · 三个看山点 · 光从左上</text>')
    overlay = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
  {body}
  {"".join(ov)}
</svg>'''
    (OUT / "overlay.svg").write_text(overlay, encoding="utf8")

    # 特写：洞口 + 接缝 320×240（取 blockout 的 x380..700, y420..660）
    close = f'''<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="380 420 320 240" shape-rendering="crispEdges">
  {body}
  <rect x="380" y="420" width="320" height="240" fill="none" stroke="#d94b3f" stroke-width="2"/>
  <text x="388" y="438" font-family="monospace" font-size="11" fill="#ffe27a">特写：洞口 + 钩带接缝</text>
</svg>'''
    (OUT / "closeup.svg").write_text(close, encoding="utf8")
    print("wrote blockout.svg / overlay.svg / closeup.svg")

if __name__ == "__main__":
    main()

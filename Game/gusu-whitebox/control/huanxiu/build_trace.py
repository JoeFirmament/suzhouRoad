#!/usr/bin/env python3
"""环秀山庄 · 实景描线底稿（给画师）。

不是体块，不是想象：所有线都按照片 `ref/panorama-7-1-clean.jpg` 描。
左段/右段岩壁外轮廓可见；中段被树冠遮住，留空，画师按照片补。
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import base64

OUT = Path(__file__).resolve().parent
W, H = 1219, 688

BUILDING_ROOF = [(0,200),(38,170),(70,150),(104,172),(142,186),(182,196),(222,206),(262,216)]
BUILDING_WALL = [(230,216),(230,520),(0,520)]
BALCONY = [(150,300),(230,300)]
MOON_GATE = (30,450,22)
ROCK_L = [(362,300),(390,288),(420,276),(450,266),(480,256),(505,250),(520,258)]
ROCK_R = [(850,330),(880,336),(910,346),(940,356),(970,366),(1000,372),(1030,366),(1060,360),
          (1090,366),(1120,376),(1150,386),(1180,396),(1219,406)]
CAVES = [[(560,450),(650,450),(650,550),(560,550)],
         [(690,480),(750,480),(750,560),(690,560)],
         [(300,490),(350,490),(350,560),(300,560)]]
RAIL_TOP = 560
RAIL_BENCH = 600
POSTS = list(range(34, W, 96))
PATH_Y = 634
POND = [(0,520),(200,520),(220,580),(0,590)]
TREE_TRUNK = [(1008,500),(998,420),(986,340),(974,260),(962,180),(950,110)]
TREE_BRANCH = [(986,340),(900,260),(840,190),(800,130)]
TREE_BRANCH2 = [(998,420),(1080,350),(1140,310)]

COL = dict(build=(47,111,176), rock=(192,57,43), cave=(211,84,0), rail=(46,125,79),
           water=(42,127,143), tree=(74,107,58), label=(30,30,30))

def font(sz=18):
    return ImageFont.truetype('/System/Library/Fonts/Hiragino Sans GB.ttc', sz)

def draw_lines(im):
    d = ImageDraw.Draw(im, 'RGBA')
    d.line(BUILDING_ROOF, fill=COL['build'], width=4, joint='curve')
    d.line(BUILDING_WALL, fill=COL['build'], width=3, joint='curve')
    d.line(BALCONY, fill=COL['build'], width=2)
    x,y,r = MOON_GATE
    d.ellipse([x-r,y-r,x+r,y+r], outline=COL['build'], width=3)
    d.line(ROCK_L, fill=COL['rock'], width=5, joint='curve')
    d.line(ROCK_R, fill=COL['rock'], width=5, joint='curve')
    # 中段留空：只画两端的小箭头
    d.line([(520,258),(538,262)], fill=COL['rock'], width=3)
    d.line([(832,326),(850,330)], fill=COL['rock'], width=3)
    for c in CAVES:
        d.line([c[0],c[1],c[2],c[3],c[0]], fill=COL['cave'], width=3)
    d.line([(0,RAIL_TOP),(W,RAIL_TOP)], fill=COL['rail'], width=3)
    d.line([(0,RAIL_BENCH),(W,RAIL_BENCH)], fill=COL['rail'], width=2)
    for px in POSTS:
        d.line([(px,RAIL_TOP),(px,RAIL_BENCH)], fill=COL['rail'], width=2)
    d.line([(0,PATH_Y),(W,PATH_Y)], fill=COL['rail'], width=3)
    d.line(POND+[POND[0]], fill=COL['water'], width=3, joint='curve')
    d.line(TREE_TRUNK, fill=COL['tree'], width=5, joint='curve')
    d.line(TREE_BRANCH, fill=COL['tree'], width=3)
    d.line(TREE_BRANCH2, fill=COL['tree'], width=3)

    f = font(18)
    labels = [
        ('楼（比例尺）', 16, 236, COL['build']),
        ('月洞门', 64, 476, COL['build']),
        ('岩壁外轮廓 · 左段', 365, 228, COL['rock']),
        ('松（前景）', 250, 322, COL['tree']),
        ('树冠遮挡，按图补', 560, 214, COL['label']),
        ('岩壁外轮廓 · 右段', 930, 318, COL['rock']),
        ('洞口（待考）', 565, 640, COL['cave']),
        ('石栏 / 石凳', 56, 624, COL['rail']),
        ('池', 28, 566, COL['water']),
        ('路', 608, 668, COL['rail']),
        ('树干', 960, 146, COL['tree']),
    ]
    for t,x,y,c in labels:
        tw = d.textlength(t, font=f)
        d.rectangle([x-5,y-20,x+tw+7,y+5], fill=(255,255,255,215))
        d.text((x,y-18), t, fill=c, font=f)
    t = '7-1 参考 · 1219×688 · 描线（示意，按图复核）'
    d.rectangle([8,8,8+d.textlength(t,font=f)+10,36], fill=(255,255,255,215))
    d.text((13,11), t, fill=COL['label'], font=f)

def main():
    photo = Image.open(OUT/'ref/panorama-7-1-clean.jpg').convert('RGB')
    faded = Image.blend(photo, Image.new('RGB', photo.size, (255,255,255)), 0.62)
    draw_lines(faded)
    faded.save(OUT/'trace-underlay.png')

    paper = Image.new('RGB', (W,H), (244,239,226))
    draw_lines(paper)
    paper.save(OUT/'trace-underlay-blank.png')

    def pts(p): return ' '.join(f'{x},{y}' for x,y in p)
    def poly(p, color, w):
        return f'<polyline points="{pts(p)}" fill="none" stroke="{color}" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="round"/>'
    b64 = base64.b64encode((OUT/'ref/panorama-7-1-clean.jpg').read_bytes()).decode()
    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
           f'<image href="data:image/jpeg;base64,{b64}" x="0" y="0" width="{W}" height="{H}" opacity="0.38"/>']
    svg.append(poly(BUILDING_ROOF, '#2f6fb0', 4))
    svg.append(poly(BUILDING_WALL, '#2f6fb0', 3))
    svg.append(poly(BALCONY, '#2f6fb0', 2))
    x,y,r = MOON_GATE
    svg.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="none" stroke="#2f6fb0" stroke-width="3"/>')
    svg.append(poly(ROCK_L, '#c0392b', 5))
    svg.append(poly(ROCK_R, '#c0392b', 5))
    for c in CAVES:
        svg.append(poly(c+[c[0]], '#d35400', 3))
    svg.append(f'<line x1="0" y1="{RAIL_TOP}" x2="{W}" y2="{RAIL_TOP}" stroke="#2e7d4f" stroke-width="3"/>')
    svg.append(f'<line x1="0" y1="{RAIL_BENCH}" x2="{W}" y2="{RAIL_BENCH}" stroke="#2e7d4f" stroke-width="2"/>')
    for px in POSTS:
        svg.append(f'<line x1="{px}" y1="{RAIL_TOP}" x2="{px}" y2="{RAIL_BENCH}" stroke="#2e7d4f" stroke-width="2"/>')
    svg.append(f'<line x1="0" y1="{PATH_Y}" x2="{W}" y2="{PATH_Y}" stroke="#2e7d4f" stroke-width="3"/>')
    svg.append(poly(POND+[POND[0]], '#2a7f8f', 3))
    svg.append(poly(TREE_TRUNK, '#4a6b3a', 5))
    svg.append(poly(TREE_BRANCH, '#4a6b3a', 3))
    svg.append(poly(TREE_BRANCH2, '#4a6b3a', 3))
    svg.append('</svg>')
    (OUT/'trace-underlay.svg').write_text('\n'.join(svg), encoding='utf8')
    print('wrote trace-underlay.png / trace-underlay-blank.png / trace-underlay.svg')

if __name__ == '__main__':
    main()

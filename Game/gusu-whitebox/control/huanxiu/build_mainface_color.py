#!/usr/bin/env python3
"""环秀山庄 · 主面色块稿 v1（1008×688）。

不是画：把线稿的体量填成府学口径的明度块，给画师看“值”和“层”。
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import math

OUT = Path(__file__).resolve().parent
W, H = 1008, 688
F = lambda s: ImageFont.truetype('/System/Library/Fonts/Hiragino Sans GB.ttc', s)

P = dict(sky='#cfd3cc', wall='#8f8a80', wall_hi='#a8a296', wall_lo='#7a756c',
         roof='#3b3d3c', wood='#5a4a3a', stone='#6b7066', stone_hi='#7a7f73',
         stone_lo='#4a4f47', stone_dk='#5c6158', cave='#141714', water='#5f7a76',
         rail='#9a978a', path='#7e7c72', pine='#3e4a37', gui='#4c5a42',
         bamboo='#4c5a42', banana='#5b6a4e', ink='#23261f')

def main():
    im = Image.new('RGB', (W, H), P['sky'])
    d = ImageDraw.Draw(im)

    # 墙
    d.rectangle([700,190,1008,650], fill=P['wall'])
    d.rectangle([692,176,1008,196], fill=P['roof'])
    d.rectangle([700,196,1008,206], fill=P['wall_hi'])
    # 走马楼（待核）
    d.rectangle([0,230,120,650], fill=P['wall_hi'])
    d.polygon([(0,230),(60,208),(120,230),(120,248),(0,248)], fill=P['roof'])
    d.line([(0,420),(120,420)], fill=P['wood'], width=3)
    # 廊
    d.polygon([(0,470),(60,442),(200,458),(200,488),(0,500)], fill=P['roof'])
    d.rectangle([0,488,200,650], fill=P['wall'])
    for x in (30,80,130,180):
        d.rectangle([x-2,488,x+2,640], fill=P['wood'])

    # 山体：底色 + 左亮 + 右暗
    rock = [(170,650),(180,560),(160,500),(200,460),(210,400),(250,370),(270,320),
            (310,290),(330,240),(370,210),(390,170),(430,150),(460,180),(480,230),
            (520,250),(540,300),(580,320),(600,370),(640,400),(650,460),(690,490),
            (700,560),(730,600),(720,650)]
    d.polygon(rock, fill=P['stone'])
    d.polygon([(170,650),(180,560),(160,500),(200,460),(210,400),(250,370),(270,320),
               (310,290),(330,240),(370,210),(390,170),(430,150),(440,300),(380,420),
               (300,520),(240,600),(220,650)], fill=P['stone_hi'])
    d.polygon([(520,250),(540,300),(580,320),(600,370),(640,400),(650,460),(690,490),
               (700,560),(730,600),(720,650),(600,650),(580,500),(550,380)], fill=P['stone_lo'])
    # 次峰
    d.polygon([(720,650),(740,560),(780,520),(800,470),(840,500),(860,560),(880,620),(860,650)],
              fill=P['stone_dk'])
    # 外挑石
    d.polygon([(360,320),(420,300),(470,330),(480,390),(440,420),(390,400),(360,360)],
              fill=P['stone_hi'])
    d.polygon([(470,330),(480,390),(440,420),(430,350)], fill=P['stone_lo'])
    # 洞
    d.polygon([(400,650),(400,560),(440,520),(490,560),(490,650)], fill=P['cave'])
    # 透孔
    for x,y,rx,ry in [(520,400,16,11),(600,480,13,9),(300,500,9,6),(560,560,10,7)]:
        d.ellipse([x-rx,y-ry,x+rx,y+ry], fill=P['cave'])
    # 池 / 栏 / 桥
    d.rectangle([0,600,720,650], fill=P['water'])
    d.rectangle([0,612,720,620], fill=P['rail'])
    for x in range(20,720,64):
        d.rectangle([x-2,612,x+2,646], fill=P['rail'])
    d.line([(210,630),(250,612),(290,630),(330,612)], fill=P['rail'], width=6)
    # 路
    d.rectangle([0,650,1008,688], fill=P['path'])
    # 松
    d.line([(560,340),(548,240),(536,180)], fill=P['wood'], width=7)
    for cx,cy,rx,ry in [(530,170,52,34),(570,150,40,26),(500,190,34,22)]:
        d.ellipse([cx-rx,cy-ry,cx+rx,cy+ry], fill=P['pine'])
    # 桂
    d.ellipse([120,430,200,500], fill=P['gui'])
    d.line([(160,500),(160,540)], fill=P['wood'], width=6)
    # 竹
    for x in (820,832,844,856):
        d.line([(x,650),(x+4,360)], fill=P['bamboo'], width=3)
        for y in (420,470,520,570):
            d.line([(x+2,y),(x-14,y-10)], fill=P['bamboo'], width=2)
    # 芭蕉
    for a in (-60,-30,0,30,60):
        ang=math.radians(a)
        d.line([(470,600),(470+46*math.sin(ang),600-60*math.cos(ang))], fill=P['banana'], width=5)
    # 人
    px,ph=300,126
    d.rectangle([px-8,688-ph,px+8,688-30], fill=P['ink'])
    d.ellipse([px-10,688-ph-10,px+10,688-ph+12], fill=P['ink'])
    d.line([(px-6,688-30),(px-10,688)], fill=P['ink'], width=6)
    d.line([(px+6,688-30),(px+10,688)], fill=P['ink'], width=6)

    # 色板（左上天空处）
    swatches=[('天',P['sky']),('墙',P['wall']),('石',P['stone']),('石亮',P['stone_hi']),
              ('石暗',P['stone_lo']),('洞',P['cave']),('水',P['water']),('人',P['ink'])]
    x0,y0=24,24
    for i,(n,c) in enumerate(swatches):
        x=x0+i*72
        d.rectangle([x,y0,x+56,y0+32], fill=c, outline=(40,40,36))
        d.text((x,y0+36), n, fill=(40,40,36), font=F(12))
    d.text((24,120), '主面色块稿 v1 · 1008×688 · 光从左上 · 值优先，不是最终画', fill=(40,40,36), font=F(15))
    im.save(OUT/'mainface-color-v1.png')

    # 洞/石 2× 裁切
    crop=im.crop((380,470,560,660)).resize((360,380), Image.NEAREST)
    crop.save(OUT/'mainface-cave-2x.png')
    print('wrote mainface-color-v1.png / mainface-cave-2x.png')

if __name__ == '__main__':
    main()

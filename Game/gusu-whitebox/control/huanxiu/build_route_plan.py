#!/usr/bin/env python3
"""环秀山庄 · 主面游线示意 v2（据平面图重绘，不复制原图）。

参考：图 2-114《苏州环秀山庄平面图》（研究参考，不入游戏资源）。
布局：补秋山房在北、问泉亭在西、半潭秋水一房山在东、廊沿西墙、平台在南；
假山路线（虚线）与山洞路线（点划线）都在山体里。本图只画“看”的游线，不画可攀爬。
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import math

OUT = Path(__file__).resolve().parent
W, H = 1200, 800
F = lambda s: ImageFont.truetype('/System/Library/Fonts/Hiragino Sans GB.ttc', s)

def main():
    im = Image.new('RGB', (W, H), (246, 242, 231))
    d = ImageDraw.Draw(im, 'RGBA')
    d.rectangle([90, 90, 1110, 710], outline=(90, 88, 80), width=3)

    # 过街楼（已毁）与廊：西墙
    d.rectangle([110,110,165,200], outline=(120,90,60), width=2)
    for k in range(0, 90, 10):
        d.line([(110+k,200),(110,110+k)], fill=(120,90,60,70), width=1)
    d.text((118,150), '过街楼', fill=(120,90,60), font=F(13))
    d.text((118,168), '（已毁）', fill=(120,90,60), font=F(12))
    d.rectangle([110,205,165,620], fill=(235,225,205,160), outline=(120,60,50), width=2)
    d.text((120,400), '廊', fill=(90,40,30), font=F(18))

    # 池（西/西南）
    pond = [(175,410),(300,410),(330,480),(310,590),(190,610),(170,500)]
    d.polygon(pond, fill=(90,140,145,90), outline=(42,110,120))
    d.text((225,500), '池', fill=(42,110,120), font=F(18))

    # 山体
    rock = [(300,260),(420,250),(520,300),(620,280),(700,330),(720,420),
            (680,520),(600,600),(480,620),(380,560),(330,480),(300,400)]
    d.polygon(rock, fill=(150,150,140,110), outline=(90,90,80), width=3)
    for i in range(16):
        x = 350 + (i*37) % 330
        y = 300 + (i*53) % 270
        d.ellipse([x,y,x+6,y+4], outline=(110,110,100,120))

    # 建筑
    def house(box, label, fs=18, dy=-24):
        d.rectangle(box, fill=(235,225,205), outline=(120,60,50), width=3)
        d.text((box[0]+4, box[1]+dy), label, fill=(90,40,30), font=F(fs))
    house((430,150,650,250), '补秋山房')
    house((250,320,340,400), '问泉亭')
    house((700,320,800,400), '', 14)
    d.text((706,338), '半潭秋水', fill=(90,40,30), font=F(14))
    d.text((706,358), '一房山', fill=(90,40,30), font=F(14))
    house((330,650,650,710), '', 15, dy=8)
    d.text((338,718), '平台（背面 / 回望）', fill=(90,40,30), font=F(15))

    # 假山路线（虚线） / 山洞路线（点划线）——研究参考，不画成玩家可走
    mtn = [(340,390),(400,420),(460,450),(520,470),(580,500),(620,540),(600,590),
           (540,610),(480,590),(430,540),(390,480),(360,430)]
    d.line(mtn, fill=(150,120,80), width=2)
    for a,b in zip(mtn, mtn[1:]):
        d.line([a,b], fill=(246,242,231), width=4)
        d.line([a,b], fill=(150,120,80), width=2)
    cave = [(400,420),(450,470),(500,510),(550,540),(600,570)]
    for a,b in zip(cave, cave[1:]):
        d.line([a,b], fill=(120,80,160), width=2)
        d.line([a,b], fill=(246,242,231), width=4)
        d.line([a,b], fill=(120,80,160), width=2)

    # 游线（玩家实际走：不登山，只沿谷/廊/平台）
    route = [
        [(180,600),(180,500),(200,420),(250,380),(295,360)],
        [(295,360),(300,280),(380,220),(450,200),(540,200)],
        [(540,200),(650,240),(720,300),(750,360)],
        [(750,360),(700,430),(620,480),(520,500)],
        [(520,500),(510,580),(500,650),(490,680)],
    ]
    for seg in route:
        d.line(seg, fill=(190,50,40), width=4, joint='curve')
    stations = [(180,600),(295,360),(540,200),(750,360),(520,500),(490,680)]
    for a,b in zip(stations, stations[1:]):
        ang = math.atan2(b[1]-a[1], b[0]-a[0]); mx,my = (a[0]+b[0])/2,(a[1]+b[1])/2
        for s in (-0.5,0.5):
            d.line([(mx,my),(mx-14*math.cos(ang+s),my-14*math.sin(ang+s))], fill=(190,50,40), width=3)
    labels = ['0 廊下近山','1 问泉亭','2 补秋山房','3 半潭秋水','4 山腹','5 平台回望']
    offs = [(20,-8),(-120,-30),(130,0),(60,0),(22,0),(18,8)]
    for i,(x,y) in enumerate(stations):
        d.ellipse([x-15,y-15,x+15,y+15], fill=(47,111,176), outline='white', width=2)
        d.text((x-5,y-9), str(i), fill='white', font=F(16))
        dx,dy = offs[i]
        d.rectangle([x+dx-4,y+dy-18,x+dx+118,y+dy+6], fill=(246,242,231,230))
        d.text((x+dx,y+dy-16), labels[i], fill=(40,60,90), font=F(15))

    # 主面三层视线
    d.line([(340,370),(560,470)], fill=(200,150,40), width=2)
    d.line([(340,390),(560,490)], fill=(200,150,40), width=2)
    for (x,y,t) in [(548,478,'水坝'),(580,455,'厚石桥'),(614,430,'薄石板桥')]:
        d.ellipse([x-4,y-4,x+4,y+4], fill=(200,150,40))
        d.text((x+6,y-10), t, fill=(150,100,20), font=F(14))
    # 补秋山房 → 洞口
    d.line([(540,250),(530,430)], fill=(120,80,160), width=2)
    d.text((540,320), '洞口→山头', fill=(100,60,140), font=F(15))
    # 平台回望
    d.line([(490,650),(500,380)], fill=(90,90,90), width=2)
    d.text((510,600), '出山回望', fill=(70,70,70), font=F(15))

    d.text((90,36), '环秀山庄 · 主面游线示意 v2', fill=(40,40,40), font=F(28))
    d.text((90,742), '据图 2-114 平面图重绘；假山/山洞路线为研究参考，玩家游线不登山。示意图，非测绘。', fill=(90,88,80), font=F(14))
    im.save(OUT/'route-plan.png')
    print('wrote route-plan.png v2')

if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""环秀山庄 · 主面游线示意（自绘，不复制书图）。"""
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

    pond = [(120,440),(360,440),(390,530),(360,610),(130,620)]
    d.polygon(pond, fill=(90, 140, 145, 90), outline=(42, 110, 120))
    d.text((240, 500), '池', fill=(42, 110, 120), font=F(18))

    rock = [(380,300),(460,220),(560,180),(700,190),(820,240),(900,320),(920,450),
            (880,560),(780,620),(650,640),(520,600),(430,520),(390,420)]
    d.polygon(rock, fill=(150, 150, 140, 110), outline=(90, 90, 80), width=3)
    for i in range(14):
        x = 440 + (i * 37) % 400
        y = 260 + (i * 53) % 290
        d.ellipse([x, y, x+6, y+4], outline=(110,110,100,120))

    wall = [(820,100),(1100,100),(1100,250),(930,235),(820,200)]
    d.polygon(wall, fill=(140, 110, 80, 70), outline=(120, 90, 60), width=3)
    for k in range(0, 280, 14):
        d.line([(820+k, 200), (820+k+60, 100)], fill=(120, 90, 60, 60), width=1)
    d.text((900, 120), '墙外千岩万壑', fill=(110, 80, 50), font=F(16))

    def house(box, label, fs=18, above=True):
        d.rectangle(box, fill=(235, 225, 205), outline=(120, 60, 50), width=3)
        if above:
            d.text((box[0]+4, box[1]-24), label, fill=(90, 40, 30), font=F(fs))

    house((560,120,720,200), '补秋山房')
    house((350,350,420,420), '问泉亭')
    house((130,630,300,680), '廊')
    house((820,350,900,420), '', 14)
    d.text((826,360), '半潭秋水', fill=(90, 40, 30), font=F(14))
    d.text((826,380), '一房山', fill=(90, 40, 30), font=F(14))
    house((520,660,760,706), '', 15)
    d.text((512, 636), '南侧厅堂平台（背面 / 回望）', fill=(90, 40, 30), font=F(15))

    stations = [(220,650),(385,385),(640,160),(860,385),(650,540),(700,690)]
    labels = ['0 廊下近山','1 问泉亭','2 补秋山房','3 半潭秋水','4 山腹','5 南侧绝壁']
    route = [
        [(220,650),(180,590),(185,500),(230,450),(300,420),(385,385)],
        [(385,385),(470,320),(540,250),(600,190),(640,160)],
        [(640,160),(740,180),(820,230),(875,300),(860,385)],
        [(860,385),(820,450),(760,500),(700,525),(650,540)],
        [(650,540),(660,600),(700,690)],
    ]
    for seg in route:
        d.line(seg, fill=(190, 50, 40), width=4, joint='curve')
    for i, (a, b) in enumerate(zip(stations, stations[1:])):
        ang = math.atan2(b[1]-a[1], b[0]-a[0])
        mx, my = (a[0]+b[0])/2, (a[1]+b[1])/2
        for s in (-0.5, 0.5):
            d.line([(mx,my),(mx-14*math.cos(ang+s), my-14*math.sin(ang+s))], fill=(190,50,40), width=3)

    for i,(x,y) in enumerate(stations):
        d.ellipse([x-15,y-15,x+15,y+15], fill=(47,111,176), outline='white', width=2)
        d.text((x-5, y-9), str(i), fill='white', font=F(16))

    # 站名（带底）
    offs = [(90,-8),(-110,18),(95,10),(48,0),(22,0),(18,-8)]
    for i,(x,y) in enumerate(stations):
        dx,dy = offs[i]
        d.rectangle([x+dx-4,y+dy-18,x+dx+118,y+dy+6], fill=(246,242,231,230))
        d.text((x+dx, y+dy-16), labels[i], fill=(40,60,90), font=F(15))

    # 问泉亭三层视线
    d.line([(420,395),(560,500)], fill=(200,150,40), width=2)
    d.line([(420,410),(560,520)], fill=(200,150,40), width=2)
    for (x,y,t) in [(548,508,'水坝'),(580,480,'厚石桥'),(614,455,'薄石板桥')]:
        d.ellipse([x-4,y-4,x+4,y+4], fill=(200,150,40))
        d.text((x+6,y-10), t, fill=(150,100,20), font=F(14))
    # 补秋山房 → 洞口
    d.line([(640,200),(650,420)], fill=(120,80,160), width=2)
    d.text((658,300), '洞口→山头', fill=(100,60,140), font=F(15))
    # 南侧回望
    d.line([(640,660),(650,380)], fill=(90,90,90), width=2)
    d.text((720,604), '出山回望', fill=(70,70,70), font=F(15))

    d.text((90, 36), '环秀山庄 · 主面游线示意', fill=(40,40,40), font=F(28))
    d.text((90, 742), '据刘敦桢游序 + 方惠「南面是背面」说；示意图，非测绘。主面在 1→2 的东南谷壑。', fill=(90,88,80), font=F(15))
    im.save(OUT/'route-plan.png')
    print('wrote route-plan.png')

if __name__ == '__main__':
    main()

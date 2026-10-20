#!/usr/bin/env python3
"""主面深度图（白近黑远），给 ControlNet depth 用。"""
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path
import math

OUT = Path(__file__).resolve().parent
W, H = 1008, 688

def main():
    im = Image.new('L', (W, H), 20)
    d = ImageDraw.Draw(im)
    # 墙
    d.rectangle([700,190,1008,650], fill=60)
    d.rectangle([692,176,1008,196], fill=40)
    d.rectangle([700,196,1008,206], fill=65)
    # 走马楼
    d.rectangle([0,230,120,650], fill=75)
    d.polygon([(0,230),(60,208),(120,230),(120,248),(0,248)], fill=50)
    d.line([(0,420),(120,420)], fill=80, width=3)
    # 廊
    d.polygon([(0,470),(60,442),(200,458),(200,488),(0,500)], fill=55)
    d.rectangle([0,488,200,650], fill=85)
    for x in (30,80,130,180):
        d.rectangle([x-2,488,x+2,640], fill=95)
    # 山体渐变
    rock = [(170,650),(180,560),(160,500),(200,460),(210,400),(250,370),(270,320),
            (310,290),(330,240),(370,210),(390,170),(430,150),(460,180),(480,230),
            (520,250),(540,300),(580,320),(600,370),(640,400),(650,460),(690,490),
            (700,560),(730,600),(720,650)]
    grad = Image.new('L', (W, H), 0)
    gd = ImageDraw.Draw(grad)
    for y in range(140, 660):
        v = int(150 + (y-140)/(660-140)*65)
        gd.line([(0,y),(W,y)], fill=v)
    mask = Image.new('L', (W, H), 0)
    ImageDraw.Draw(mask).polygon(rock, fill=255)
    im.paste(grad, (0,0), mask)
    # 次峰
    d.polygon([(720,650),(740,560),(780,520),(800,470),(840,500),(860,560),(880,620),(860,650)], fill=175)
    # 外挑石（更近）
    d.polygon([(360,320),(420,300),(470,330),(480,390),(440,420),(390,400),(360,360)], fill=225)
    # 洞（远）
    d.polygon([(400,650),(400,560),(440,520),(490,560),(490,650)], fill=5)
    for x,y,rx,ry in [(520,400,16,11),(600,480,13,9),(300,500,9,6),(560,560,10,7)]:
        d.ellipse([x-rx,y-ry,x+rx,y+ry], fill=8)
    # 水/栏/桥
    d.rectangle([0,600,720,650], fill=130)
    d.rectangle([0,612,720,620], fill=235)
    for x in range(20,720,64):
        d.rectangle([x-2,612,x+2,646], fill=235)
    d.line([(210,630),(250,612),(290,630),(330,612)], fill=230, width=6)
    # 路
    d.rectangle([0,650,1008,688], fill=245)
    # 植物
    d.line([(560,340),(548,240),(536,180)], fill=200, width=7)
    for cx,cy,rx,ry in [(530,170,52,34),(570,150,40,26),(500,190,34,22)]:
        d.ellipse([cx-rx,cy-ry,cx+rx,cy+ry], fill=200)
    d.ellipse([120,430,200,500], fill=210)
    d.line([(160,500),(160,540)], fill=210, width=6)
    for x in (820,832,844,856):
        d.line([(x,650),(x+4,360)], fill=190, width=3)
        for y in (420,470,520,570):
            d.line([(x+2,y),(x-14,y-10)], fill=190, width=2)
    for a in (-60,-30,0,30,60):
        ang=math.radians(a)
        d.line([(470,600),(470+46*math.sin(ang),600-60*math.cos(ang))], fill=205, width=5)
    im = im.filter(ImageFilter.GaussianBlur(1.2))
    im.save(OUT/'ai-pack/depth-clean.png')
    print('wrote ai-pack/depth.png')

if __name__ == '__main__':
    main()
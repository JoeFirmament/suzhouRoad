#!/usr/bin/env python3
"""像素化 + 量化：缩到 1/scale 再最近邻放大，然后套 24 色板。

用法:
  python3 pixelate.py in.png out.png --size 960x600 --scale 3
  python3 pixelate.py in.png out.png --size 960x600 --scale 2 --palette assets/palette-24.png
"""
import argparse
from PIL import Image

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('src'); ap.add_argument('dst')
    ap.add_argument('--size', default='960x600')
    ap.add_argument('--scale', type=int, default=3)
    ap.add_argument('--palette', default='assets/palette-24.png')
    a=ap.parse_args()
    w,h=map(int,a.size.lower().split('x'))
    im=Image.open(a.src).convert('RGB').resize((w,h),Image.LANCZOS)
    sw,sh=w//a.scale,h//a.scale
    small=im.resize((sw,sh),Image.LANCZOS)
    pix=small.resize((sw*a.scale,sh*a.scale),Image.NEAREST)
    if pix.size!=(w,h): pix=pix.resize((w,h),Image.NEAREST)
    pal=Image.open(a.palette).convert('P')
    out=pix.quantize(palette=pal,dither=Image.FLOYDSTEINBERG)
    out.save(a.dst)
    print('wrote',a.dst,(w,h),'scale',a.scale)

if __name__=='__main__':
    main()

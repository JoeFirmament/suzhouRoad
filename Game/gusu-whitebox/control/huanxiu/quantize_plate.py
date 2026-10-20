#!/usr/bin/env python3
"""把 AI 出图收进府学 24 色板，并缩到 1008×688。

用法:
  python3 quantize_plate.py in.png out.png
  python3 quantize_plate.py in.png out.png --palette ai-pack/fuxue-palette.png
"""
import argparse
from PIL import Image, ImageOps

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('src'); ap.add_argument('dst')
    ap.add_argument('--palette', default='ai-pack/fuxue-palette.png')
    ap.add_argument('--size', default='1008x688')
    a=ap.parse_args()
    w,h=map(int,a.size.lower().split('x'))
    im=Image.open(a.src).convert('RGB')
    im=ImageOps.fit(im,(w,h),method=Image.LANCZOS,centering=(0.5,0.5))
    pal=Image.open(a.palette).convert('P')
    out=im.quantize(palette=pal, dither=Image.FLOYDSTEINBERG)
    out.save(a.dst)
    print('wrote',a.dst,(w,h),'with',a.palette)

if __name__=='__main__':
    main()

#!/usr/bin/env python3
"""Wikipedia 预下载脚本 — 仅标准库，无需 requests"""

import json, os, sys, time, argparse, urllib.request, urllib.error
from pathlib import Path

TARGETS = [
    {"id":"zhuozheng_garden","type":"garden","zh_title":"拙政园"},
    {"id":"liuyuan_garden","type":"garden","zh_title":"留园"},
    {"id":"wangshi_garden","type":"garden","zh_title":"网师园"},
    {"id":"huanxiu_garden","type":"garden","zh_title":"环秀山庄"},
    {"id":"canglang_garden","type":"garden","zh_title":"沧浪亭"},
    {"id":"shizilin_garden","type":"garden","zh_title":"狮子林"},
    {"id":"yipu_garden","type":"garden","zh_title":"艺圃"},
    {"id":"ouyuan_garden","type":"garden","zh_title":"耦园"},
    {"id":"tuisi_garden","type":"garden","zh_title":"退思园"},
    {"id":"wzx","type":"person","zh_title":"王献臣"},
    {"id":"wzm","type":"person","zh_title":"文徵明"},
    {"id":"czl","type":"person","zh_title":"陈之遴"},
    {"id":"lxc","type":"person","zh_title":"李秀成"},
    {"id":"zzw","type":"person","zh_title":"张之万"},
    {"id":"xts","type":"person","zh_title":"徐泰时"},
    {"id":"sk","type":"person","zh_title":"盛康"},
    {"id":"szz","type":"person","zh_title":"史正志"},
    {"id":"szm","type":"person","zh_title":"苏舜钦"},
    {"id":"hsz","type":"person","zh_title":"韩世忠"},
    {"id":"sl","type":"person","zh_title":"宋荦"},
    {"id":"nz","type":"person","zh_title":"倪瓒"},
    {"id":"by","type":"person","zh_title":"毕沅"},
    {"id":"ssy","type":"person","zh_title":"孙士毅"},
    {"id":"wzm2","type":"person","zh_title":"文震孟"},
    {"id":"jc","type":"person","zh_title":"姜埰"},
    {"id":"sbc","type":"person","zh_title":"沈秉成"},
    {"id":"rls","type":"person","zh_title":"任兰生"},
    {"id":"shx","type":"person","zh_title":"盛宣怀"},
    {"id":"qqy","type":"person","zh_title":"钱谦益"},
    {"id":"wyn","type":"person","zh_title":"王永宁"},
    {"id":"szq","type":"person","zh_title":"宋宗元"},
    {"id":"lhy","type":"person","zh_title":"李鸿裔"},
    {"id":"lrs","type":"person","zh_title":"柳如是"},
    {"id":"wsg","type":"person","zh_title":"吴三桂"},
]

def fetch(title, lang="zh", retries=3):
    import urllib.parse
    url = f"https://{lang}.wikipedia.org/api/rest_v1/page/summary/{urllib.parse.quote(title)}"
    h = {"User-Agent": "ClassicGarden-WikiFetcher/1.0"}
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers=h)
            with urllib.request.urlopen(req, timeout=15) as r:
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            if e.code == 404: return None
            print(f"  HTTP {e.code} (attempt {i+1})")
        except Exception as e:
            print(f"  Error: {e} (attempt {i+1})")
        if i < retries - 1: time.sleep(2**i)
    return None

def dl_img(url, path, retries=2):
    h = {"User-Agent": "ClassicGarden-WikiFetcher/1.0"}
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers=h)
            with urllib.request.urlopen(req, timeout=30) as r:
                with open(path, "wb") as f: f.write(r.read())
            print(f"  📷 图片: {Path(path).name} ({Path(path).stat().st_size//1024} KB)")
            return True
        except: time.sleep(1)
    return False

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--output", default="data/wikipedia_data.json")
    p.add_argument("--images", default="data/wikimedia")
    p.add_argument("--delay", type=float, default=0.5)
    args = p.parse_args()

    img_dir = Path(args.images)
    img_dir.mkdir(parents=True, exist_ok=True)
    results = {}
    ok = fail = 0

    print(f"🌐 下载 {len(TARGETS)} 条 Wikipedia 数据...\n")
    for t in TARGETS:
        print(f"[{t['id']}] {t['zh_title']}...", end=" ")
        d = fetch(t["zh_title"])
        if not d:
            print("❌ 无页面")
            results[t["id"]] = {"status":"not_found","title":t["zh_title"],"type":t["type"],
                                "summary":None,"image_file":None,"source_url":None}
            fail += 1
            time.sleep(args.delay)
            continue

        summary = d.get("extract","")
        img_file = None
        thumb = d.get("thumbnail") or d.get("originalimage")
        if thumb and thumb.get("source"):
            ext = thumb["source"].rsplit(".",1)[-1].split("?")[0]
            if ext.lower() not in ("jpg","jpeg","png","gif","webp"): ext="jpg"
            fpath = str(img_dir / f'{t["id"]}.{ext}')
            if dl_img(thumb["source"], fpath):
                img_file = f"data/wikimedia/{t['id']}.{ext}"

        print(f"✅ {len(summary)} 字" + (f" + 配图" if img_file else ""))
        results[t["id"]] = {"status":"ok","title":d.get("titles",{}).get("normalized",t["zh_title"]),
                            "type":t["type"],"summary":summary,"image_file":img_file,
                            "image_url":thumb["source"] if thumb else None,
                            "source_url":d.get("content_urls",{}).get("desktop",{}).get("page")}
        ok += 1
        time.sleep(args.delay)

    out = {"meta":{"fetched_at":time.strftime("%Y-%m-%dT%H:%M:%S"),"total":len(TARGETS),
                   "success":ok,"not_found":fail},"entries":results}
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*40}\n完成: {ok}/{len(TARGETS)}, 失败: {fail}\n摘要: {args.output}\n图片: {args.images}/ ({len(list(img_dir.glob('*')))} 张)\n{'='*40}")

if __name__ == "__main__":
    main()

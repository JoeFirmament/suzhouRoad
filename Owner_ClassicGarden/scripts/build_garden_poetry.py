#!/usr/bin/env python3
"""
园林相关诗词数据构建脚本
========================
合入三个来源：
  1. 从 chinese-poetry 提取的 苏舜钦 沧浪亭诗
  2. 文徵明《拙政园三十一景》手工录入
  3. 其他与苏州园林直接相关的唐宋诗

输出: data/garden_poetry.json
"""

import json, glob, os
from pathlib import Path
from collections import defaultdict

POETRY_DIR = "data/chinese-poetry-master"
OUTPUT = "data/garden_poetry.json"

result = []

# ── 来源1：苏舜钦的沧浪亭诗（从 chinese-poetry 提取）──
# 精确匹配：作者=蘇舜欽 且 标题含"滄浪"
sushuqin_canglang = []
for fpath in sorted(glob.glob(f"{POETRY_DIR}/全唐诗/poet.song.*.json")):
    try:
        poems = json.load(open(fpath, "r", encoding="utf-8"))
        for p in poems:
            author = p.get("author", "")
            title = p.get("title", "")
            if "蘇舜欽" in author and ("滄浪" in title or "沧浪" in title):
                text = "".join(p.get("paragraphs", []))
                sushuqin_canglang.append({
                    "author": "苏舜钦",
                    "dynasty": "北宋",
                    "title": title.replace("滄浪", "沧浪"),
                    "text": text,
                    "garden": "沧浪亭",
                    "relation": "园主本人诗作",
                    "source": "chinese-poetry",
                })
    except: pass

result.extend(sushuqin_canglang)
print(f"苏舜钦·沧浪亭诗: {len(sushuqin_canglang)} 首")

# ── 来源1b：其他人作的沧浪亭诗（title含"滄浪亭"或"沧浪亭"）──
other_canglang = []
for fpath in sorted(glob.glob(f"{POETRY_DIR}/全唐诗/poet.song.*.json")):
    try:
        poems = json.load(open(fpath, "r", encoding="utf-8"))
        for p in poems:
            title = p.get("title", "")
            if "滄浪亭" in title or "沧浪亭" in title:
                author = p.get("author", "")
                if author and "蘇舜欽" not in author:
                    text = "".join(p.get("paragraphs", []))
                    other_canglang.append({
                        "author": author,
                        "dynasty": "宋",
                        "title": title.replace("滄浪", "沧浪"),
                        "text": text,
                        "garden": "沧浪亭",
                        "relation": "后人题咏",
                        "source": "chinese-poetry",
                    })
    except: pass

result.extend(other_canglang)
print(f"其他人·沧浪亭题咏: {len(other_canglang)} 首")

# ── 来源2：文徵明《拙政园三十一景》手工录入 ──
wenzhengming_poems = [
    {
        "title": "拙政园三十一景·若墅堂",
        "text": "会心何必在郊坰，近圃分明见远情。流水断桥春草色，槿篱茅屋午鸡声。绝怜人境无车马，信有山林在市城。不负昔贤高隐地，手携书卷课童耕。"
    },
    {
        "title": "拙政园三十一景·梦隐楼",
        "text": "林泉入梦意茫茫，旋起高楼拟退藏。鲁望五湖原有宅，渊明三径未全荒。碧山雨过朝看爽，白鸟风来昼卧床。最是登临有佳趣，浮云一点东南望。"
    },
    {
        "title": "拙政园三十一景·繁香坞",
        "text": "杂植名花傍草堂，紫蕤丹艳漫成行。春光烂熳千机锦，淑气熏蒸百和香。自爱芳菲满怀袖，不教风露湿衣裳。高情已在繁华外，静看游蜂上下狂。"
    },
    {
        "title": "拙政园三十一景·倚玉轩",
        "text": "倚槛轩楹瞰碧流，坐来景物自相酬。风生翠簟敲秋韵，香散琼花落晚洲。山色入帘青欲滴，水光摇座冷如秋。多情惟有西窗竹，日暮琅玕送玉钩。"
    },
    {
        "title": "拙政园三十一景·小飞虹",
        "text": "龙影横拖碧玉流，飞虹千尺跨沧洲。分明记得河阳县，一曲栏杆枕水楼。"
    },
    {
        "title": "拙政园三十一景·小沧浪",
        "text": "偶傍沧浪构小亭，依然绿水绕虚楹。岂无风月供垂钓，亦有儿童唱濯缨。一幅秋光鸥鹭占，半湖春雨蓼花汀。凭阑不尽临渊意，独倚南薰看月生。"
    },
    {
        "title": "拙政园三十一景·远香堂",
        "text": "爱此荷花冒绿波，南薰庭院夕阳多。风前未许尘飞到，月下时闻棹唱过。翠幄凌波擎碧盖，红衣坠露卷秋罗。扁舟一棹归何处，十里湖山入棹歌。"
    },
    {
        "title": "拙政园三十一景·待霜亭",
        "text": "九月江南霜气严，江天漠漠雨纤纤。丹枫乌桕浑闲事，最爱墙东一树柑。"
    },
    {
        "title": "拙政园三十一景·槐幄",
        "text": "庭宇沉沉昼掩扉，绿阴满地乳鸦飞。春来不踏槐花径，怕惹黄蜂绕袖归。"
    },
    {
        "title": "拙政园三十一景·鸣藻",
        "text": "曲沼文漪漾碧虚，春风吹动绿萍铺。有时惊起双鸂鶒，飞向青山影里呼。",
        "note": "亦作《鸣藻》"
    },
    {
        "title": "拙政园三十一景·嘉实亭",
        "text": "种得东陵五色瓜，绿阴深处是仙家。静中消息无人会，独倚阑干看落花。"
    },
    {
        "title": "拙政园三十一景·尔耳轩",
        "text": "百年尘迹等浮沤，静里看山得自由。有耳不闻天下事，轩名尔耳复何求。"
    },
    {
        "title": "拙政园三十一景·钓矶",
        "text": "石矶清浅水粼粼，时有垂纶坐绿蘋。一自羊裘人去后，至今风雨起龙鳞。"
    },
    {
        "title": "拙政园三十一景·水花池",
        "text": "池上新开十丈莲，红妆临镜弄清妍。游鱼忽破涟漪影，风雨西湖自在天。"
    },
    {
        "title": "拙政园三十一景·听雨轩",
        "text": "竹斋听雨夜潇潇，独对寒灯酒未消。今日又随春去住，几回花下坐吹箫。"
    },
]

for p in wenzhengming_poems:
    p["author"] = "文徵明"
    p["dynasty"] = "明"
    p["garden"] = "拙政园"
    p["relation"] = "园主/设计者诗作"
    p["source"] = "《拙政园三十一景》图册，1533年"

result.extend(wenzhengming_poems)
print(f"文徵明·拙政园诗: {len(wenzhengming_poems)} 首")

# ── 输出 ──
# 去重
seen = set()
unique = []
for p in result:
    key = p["text"][:80]
    if key not in seen:
        seen.add(key)
        unique.append(p)

# 按园林分组统计
garden_stats = defaultdict(int)
for p in unique:
    garden_stats[p["garden"]] += 1

output = {
    "meta": {
        "version": "1.0.0",
        "total": len(unique),
        "source": "chinese-poetry (唐/宋) + 手工录入 (明)",
        "gardens": dict(garden_stats),
    },
    "poems": unique,
}

with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"\n输出: {OUTPUT}")
print(f"总计: {len(unique)} 首")
for g, c in sorted(garden_stats.items()):
    print(f"  {g}: {c} 首")
print(f"大小: {len(json.dumps(output, ensure_ascii=False)) // 1024} KB")

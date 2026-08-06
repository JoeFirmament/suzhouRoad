#!/usr/bin/env python3
"""
古诗词子集提取脚本（骨架）
=============================
从 chinese-poetry/chinese-poetry 仓库中过滤出苏州园林相关诗词，
输出为前端可直接加载的 JSON。

用法:
    # 1. 先下载 poetry 仓库（见下方说明）
    # 2. 运行：
    python scripts/extract_poetry_subset.py \
        --poetry-dir ../chinese-poetry \
        --output data/poetry_subset.json

依赖: 仅标准库 (json, re, os, glob)

chinese-poetry 下载:
    git clone --depth 1 https://github.com/chinese-poetry/chinese-poetry.git
    # 或浏览器打开 https://github.com/chinese-poetry/chinese-poetry 点 Download ZIP
    # ~700MB 全库, 15-30 分钟下载
"""

import json
import os
import re
import argparse
from pathlib import Path
from collections import defaultdict

# ── 关键词列表（用于过滤苏州园林相关诗词）───────────────
# 按匹配优先级排列
KEYWORDS_GARDEN = [
    "拙政", "留园", "网师", "环秀", "沧浪", "狮子林", "艺圃", "耦园", "退思",
    "苏州园林", "姑苏台",
]

KEYWORDS_PLACE = [
    "姑苏", "苏州", "吴门", "吴中", "虎丘", "太湖", "洞庭", "枫桥",
    "寒山寺", "阊门", "平江", "吴江",
]

KEYWORDS_GARDEN_OWNER = [
    "苏舜钦", "苏子美", "文徵明", "文征明", "倪瓒", "倪云林",
    # 注：chinese-poetry 只收录到宋，明/清园主不会出现
]

ALL_KEYWORDS = KEYWORDS_GARDEN + KEYWORDS_PLACE + KEYWORDS_GARDEN_OWNER


def match_poem(text: str) -> list[str]:
    """检查诗词正文是否含有关键词，返回匹配的关键词列表"""
    matched = []
    for kw in ALL_KEYWORDS:
        if kw in text:
            matched.append(kw)
    return matched


def extract_poetry_subset(poetry_dir: str) -> list[dict]:
    """
    从 chinese-poetry 目录结构提取匹配的诗词。
    
    目录结构:
        {poetry_dir}/
            全唐诗/
                poet.tang.{n}.json    — 唐诗（~57,000 首）  
                poet.song.{n}.json    — 宋诗（~270,000 首）
                authors.tang.json
                authors.song.json
            宋词/
                ci.song.{n}.json      — 宋词（~21,000 首）
                author.song.json
    
    每首诗 JSON 格式:
        唐诗: {"author": "王维", "title": "山居秋暝", "paragraphs": ["空山新雨后", "天气晚来秋"], "id": "..."}
        宋词: {"author": "苏轼", "rhythmic": "水调歌头", "paragraphs": ["明月几时有", "把酒问青天"]}
    """
    poetry_dir = Path(poetry_dir)
    
    # 定义搜索路径: (目录名, glob 模式, 标签)
    search_paths = [
        (poetry_dir / "全唐诗", "poet.tang.*.json", "唐诗"),
        (poetry_dir / "全唐诗", "poet.song.*.json", "宋诗"),
        (poetry_dir / "宋词",   "ci.song.*.json",   "宋词"),
        # 可选: 五代诗词、元曲等
    ]
    
    matched = []
    total_files = 0
    
    for base_dir, glob_pattern, label in search_paths:
        if not base_dir.exists():
            print(f"  跳过 {base_dir} (目录不存在)")
            continue
        
        files = sorted(base_dir.glob(glob_pattern))
        total_files += len(files)
        file_num = 0
        
        for fpath in files:
            file_num += 1
            if file_num % 50 == 0:
                print(f"   [{label}] 已处理 {file_num}/{len(files)} 文件，当前匹配 {len(matched)} 首")
            
            try:
                with open(fpath, "r", encoding="utf-8") as f:
                    poems = json.load(f)
            except (json.JSONDecodeError, UnicodeDecodeError, MemoryError):
                continue
            
            if not isinstance(poems, list):
                continue
            
            for poem in poems:
                text = " ".join(poem.get("paragraphs", []))
                if not text:
                    continue
                
                kw_match = match_poem(text)
                if kw_match:
                    matched.append({
                        "title": poem.get("title", poem.get("rhythmic", "无题")),
                        "author": poem.get("author", "佚名"),
                        "dynasty": label,
                        "rhythmic": poem.get("rhythmic"),
                        "keywords": kw_match,
                        "text": text[:300],
                    })
    
    print(f"   总文件数: {total_files}")
    return matched


def deduplicate(poems: list[dict]) -> list[dict]:
    """按文本去重"""
    seen = set()
    result = []
    for p in poems:
        key = p["text"][:100]
        if key not in seen:
            seen.add(key)
            result.append(p)
    return result


def main():
    parser = argparse.ArgumentParser(description="提取苏州园林相关古诗词子集")
    parser.add_argument("--poetry-dir", required=True,
                        help="chinese-poetry 仓库本地路径")
    parser.add_argument("--output", default="data/poetry_subset.json",
                        help="输出 JSON 路径")
    args = parser.parse_args()
    
    print("🍃 苏州园林 · 古诗词子集提取")
    print("=" * 40)
    print(f"   诗词库: {args.poetry_dir}")
    print(f"   关键词: {len(ALL_KEYWORDS)} 个")
    
    matched = extract_poetry_subset(args.poetry_dir)
    
    # 去重
    unique = deduplicate(matched)
    
    # 按关键词分组统计
    kw_count = defaultdict(int)
    for p in unique:
        for kw in p["keywords"]:
            kw_count[kw] += 1
    
    # 输出
    output = {
        "meta": {
            "version": "1.0.0",
            "generated_at": "2026-07",
            "source": "https://github.com/chinese-poetry/chinese-poetry",
            "keywords_used": ALL_KEYWORDS,
            "total_raw": len(matched),
            "total_unique": len(unique),
        },
        "keyword_stats": dict(sorted(kw_count.items(), key=lambda x: -x[1])),
        "poems": unique,
    }
    
    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    size_kb = os.path.getsize(out_path) / 1024
    print(f"\n✅ 完成!")
    print(f"   原始匹配: {len(matched)} 首")
    print(f"   去重后:   {len(unique)} 首")
    print(f"   输出:     {args.output} ({size_kb:.0f} KB)")
    print(f"\n📍 关键词命中 Top 10:")
    for kw, count in sorted(kw_count.items(), key=lambda x: -x[1])[:10]:
        print(f"   {kw}: {count} 次")


if __name__ == "__main__":
    main()

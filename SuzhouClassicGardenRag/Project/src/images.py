"""
图片提取模块 —— 解析 MinerU 输出的 Markdown，提取图片路径和对应的 caption。
"""
import re
from pathlib import Path
from typing import List, Tuple


def extract_images_from_md(md_path: Path) -> List[Tuple[str, str]]:
    """
    从 MinerU 产出的 Markdown 中提取图片路径和 caption。

    返回值: [(图片绝对路径, caption文本), ...]

    匹配模式:
      ![](images/xxx.jpg)
      图1 xxxx          ← 图片上方或下方紧邻的文字行
    """
    if not md_path.exists():
        return []

    base_dir = md_path.parent  # 图片相对于 md 所在目录
    text = md_path.read_text(encoding="utf-8")
    lines = text.split("\n")

    results = []
    # 找 ![](images/xxx) 这种格式
    img_pattern = re.compile(r'!\[\]\(images/([^)]+)\)')

    for i, line in enumerate(lines):
        match = img_pattern.search(line)
        if not match:
            continue

        img_rel = f"images/{match.group(1)}"
        img_abs = str((base_dir / img_rel).resolve())

        # 提取 caption：往前找最近的非空行（通常是 "图1 xxx"）
        caption = ""
        for j in range(i - 1, -1, -1):
            prev = lines[j].strip()
            if prev and not prev.startswith("![]"):
                # 去掉 markdown 标题标记
                caption = prev.lstrip("#").strip()
                break

        # 如果 caption 还是空的，往后找
        if not caption:
            for j in range(i + 1, min(i + 3, len(lines))):
                nxt = lines[j].strip()
                if nxt and not nxt.startswith("![]"):
                    caption = nxt.lstrip("#").strip()
                    break

        results.append((img_abs, caption))

    return results


def get_converted_dirs(converted_dir: Path) -> List[Path]:
    """获取 converted_dir 下所有包含 MinerU 产物的子目录。"""
    dirs = []
    if not converted_dir.exists():
        return dirs
    for child in converted_dir.iterdir():
        if child.is_dir():
            # 找 hybrid_auto 目录
            auto_dir = child / "hybrid_auto"
            if auto_dir.exists():
                dirs.append(auto_dir)
    return sorted(dirs)


def find_all_images(converted_dir: Path) -> List[Tuple[str, str, str]]:
    """
    扫描全部转换结果，返回所有图片信息。

    返回值: [(md源路径, 图片绝对路径, caption), ...]
    """
    results = []
    for auto_dir in get_converted_dirs(converted_dir):
        # 找该目录下的 md 文件
        for md_file in auto_dir.glob("*.md"):
            images = extract_images_from_md(md_file)
            for img_abs, caption in images:
                results.append((str(md_file), img_abs, caption))
    return results

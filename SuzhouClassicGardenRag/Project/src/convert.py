"""
文档转换模块 —— 使用 MinerU 将 Resource/ 下的原始文档转为 Markdown。
支持格式: PDF / EPUB / DOCX / PPTX / XLSX（MinerU），EPUB（ebooklib）。
不支持: DJVU、MOBI（无可用转换器）。
"""
import subprocess
import sys
import os
import time
from pathlib import Path
from typing import Set
import json
import hashlib

from .config import get_config

# MinerU 能直接处理的格式
MINERU_EXTENSIONS = {".pdf", ".docx", ".pptx", ".xlsx", ".epub"}
# 需要其他工具转换的格式
UNSUPPORTED_EXTENSIONS = {".djvu", ".mobi"}


def _convert_epub_to_md(epub_path: Path, output_dir: Path) -> bool:
    """用 ebooklib 将 EPUB 转为纯文本 Markdown。"""
    try:
        from ebooklib import epub
        from bs4 import BeautifulSoup
    except ImportError:
        print("   ⚠ 需要安装 ebooklib: pip install ebooklib")
        return False

    import html

    try:
        book = epub.read_epub(str(epub_path))
        md_lines = []
        md_lines.append(f"# {book.get_metadata('DC', 'title')[0][0] if book.get_metadata('DC', 'title') else epub_path.stem}")
        md_lines.append("")
        md_lines.append(f"> 来源: {epub_path.name}")
        md_lines.append("")
        md_lines.append("---")
        md_lines.append("")

        for item in book.get_items():
            if item.get_type() == 9:  # ITEM_DOCUMENT
                content = item.get_content()
                try:
                    text = content.decode("utf-8")
                except UnicodeDecodeError:
                    text = content.decode("utf-8", errors="replace")

                # 简单 HTML 转 Markdown
                soup = BeautifulSoup(text, "html.parser")

                # 提取标题和段落
                for tag in soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6", "p", "li"]):
                    txt = tag.get_text(strip=True)
                    if not txt:
                        continue
                    if tag.name.startswith("h"):
                        level = tag.name[1]
                        md_lines.append(f"{'#' * int(level)} {txt}")
                        md_lines.append("")
                    elif tag.name == "li":
                        md_lines.append(f"- {txt}")
                    else:
                        md_lines.append(txt)
                        md_lines.append("")

        md_content = "\n".join(md_lines)

        # 写到 converted/<书名>/<书名>.md
        doc_dir = output_dir / epub_path.stem
        doc_dir.mkdir(parents=True, exist_ok=True)

        # 看看 MinerU 风格的路径
        auto_dir = doc_dir / "hybrid_auto"
        auto_dir.mkdir(parents=True, exist_ok=True)

        md_file = auto_dir / f"{epub_path.stem}.md"
        md_file.write_text(md_content, encoding="utf-8")
        print(f"         ✓ EPUB 转 Markdown 完成 ({len(md_content)} 字符)")
        return True

    except Exception as e:
        print(f"   ⚠ EPUB 转换失败: {e}")
        return False


def _file_hash(filepath: Path) -> str:
    """计算文件的 MD5 哈希。"""
    md5 = hashlib.md5()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            md5.update(chunk)
    return md5.hexdigest()


def _load_hash_db(hash_db_path: Path) -> dict:
    """加载已处理文件的哈希记录。"""
    if hash_db_path.exists():
        with open(hash_db_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def _save_hash_db(hash_db_path: Path, db: dict):
    """保存文件哈希记录。"""
    hash_db_path.parent.mkdir(parents=True, exist_ok=True)
    with open(hash_db_path, "w", encoding="utf-8") as f:
        json.dump(db, f, indent=2, ensure_ascii=False)


def _conversion_output_exists(filepath: Path, converted_dir: Path) -> bool:
    """确认源文件对应的 Markdown 转换产物仍然存在。"""
    output_dir = converted_dir / filepath.stem
    return output_dir.is_dir() and any(output_dir.rglob("*.md"))


def _find_files(resource_dir: Path) -> dict:
    """
    扫描 Resource 目录，将文件按类型分组。

    返回值: {"mineru": [Path, ...], "epub": [Path, ...], "unsupported": [(Path, reason), ...]}
    """
    result = {"mineru": [], "epub": [], "unsupported": []}

    if not resource_dir.exists():
        print(f"[错误] Resource 目录不存在: {resource_dir}")
        return result

    for ext in MINERU_EXTENSIONS:
        result["mineru"].extend(resource_dir.glob(f"*{ext}"))
        result["mineru"].extend(resource_dir.glob(f"*{ext.upper()}"))

    for ext in {".epub"}:
        # EPUB 既可以用 MinerU，也可以用 ebooklib 兜底
        pass  # 已在 mineru 里

    for ext in UNSUPPORTED_EXTENSIONS:
        for fp in resource_dir.glob(f"*{ext}"):
            result["unsupported"].append((fp, f"MinerU 不支持 {ext} 格式"))

    # 去重 + 排序
    for key in result:
        if key == "unsupported":
            result[key] = sorted(set(result[key]), key=lambda x: x[0].name)
        else:
            result[key] = sorted(set(result[key]), key=lambda p: p.name)

    return result


def convert_all(incremental: bool = True):
    """
    转换 Resource 下所有未处理的文档。
    incremental=True: 跳过已转换（哈希未变）的文件。
    打印汇总结果，不再抛出异常退出。
    """
    cfg = get_config()
    resource_dir = Path(cfg["paths"]["resource_dir"])
    converted_dir = Path(cfg["paths"]["converted_dir"])
    hash_db_path = Path(cfg["paths"]["converted_hash_db"])
    mineru_cfg = cfg["mineru"]

    converted_dir.mkdir(parents=True, exist_ok=True)
    hash_db = _load_hash_db(hash_db_path) if incremental else {}

    # 查找文件，按类型分组
    files_by_type = _find_files(resource_dir)
    all_mineru_files = files_by_type["mineru"]
    all_epub_files = files_by_type["epub"]
    all_unsupported = files_by_type["unsupported"]

    total_count = len(all_mineru_files) + len(all_epub_files)

    # 先处理不支持的格式
    for fp, reason in all_unsupported:
        print(f"⏭️  [{fp.name}] {reason}，跳过。\n")

    if total_count == 0:
        print("[提示] Resource 目录下没有可转换的文件。")
        return [], []

    # 过滤 MinerU 文件：只有“成功记录、哈希未变、产物存在”才跳过。
    pending_mineru = []
    skipped_mineru = []
    for fp in all_mineru_files:
        fhash = _file_hash(fp)
        key = fp.name
        already_converted = (
            incremental
            and hash_db.get(key) == fhash
            and _conversion_output_exists(fp, converted_dir)
        )
        if already_converted:
            skipped_mineru.append(fp)
        else:
            pending_mineru.append((fp, fhash))

    if skipped_mineru:
        print(f"[跳过] {len(skipped_mineru)} 个 MinerU 文件（已转换且未变化）:")
        for fp in skipped_mineru:
            print(f"        {fp.name}")

    # 过滤 EPUB 文件
    pending_epub = []
    skipped_epub = []
    for fp in all_epub_files:
        fhash = _file_hash(fp)
        key = fp.name
        already_converted = (
            incremental
            and hash_db.get(key) == fhash
            and _conversion_output_exists(fp, converted_dir)
        )
        if already_converted:
            skipped_epub.append(fp)
        else:
            pending_epub.append((fp, fhash))

    if skipped_epub:
        print(f"[跳过] {len(skipped_epub)} 个 EPUB 文件（已转换且未变化）。")

    # 合并待处理列表（先 epub 后 mineru，因为 epub 快）
    pending = pending_epub + pending_mineru

    if not pending:
        print("[提示] 没有需要转换的新文件。")
        return [], []

    print(f"[转换] 共 {len(pending)} 个文件待处理:\n")

    converted_files = []
    failed_files = []
    skipped_files = []

    # 键盘监听线程：按 s + Enter 跳过当前文件
    import threading
    skip_current = threading.Event()
    listener_ready = threading.Event()

    def _keyboard_listener():
        listener_ready.set()
        while True:
            try:
                ch = sys.stdin.readline().strip().lower()
                if ch == 's':
                    skip_current.set()
                    print("\n   ⏭️  收到跳过指令，正在终止当前转换...")
            except (EOFError, OSError):
                break

    listener = threading.Thread(target=_keyboard_listener, daemon=True)
    listener.start()
    listener_ready.wait()  # 确保监听器已启动

    for idx, (fp, fhash) in enumerate(pending, 1):
        print(f"[{idx}/{len(pending)}] {fp.name}")
        print(f"   [按 s + Enter 跳过当前文件]")

        skip_current.clear()

        # EPUB 用 ebooklib 直接转，不走 MinerU
        if fp.suffix.lower() == ".epub":
            try:
                ok = _convert_epub_to_md(fp, converted_dir)
                if ok:
                    hash_db[fp.name] = fhash
                    converted_files.append(fp)
                    _save_hash_db(hash_db_path, hash_db)
                    print(f"         ✓ 完成\n")
                else:
                    failed_files.append(fp.name)
                    print(f"   ⚠ EPUB 转换失败，已跳过。\n")
            except Exception as e:
                failed_files.append(fp.name)
                print(f"   ⚠ EPUB 转换异常: {e}，已跳过。\n")
            continue

        # MinerU 文件
        cmd = [
            "mineru",
            "-p", str(fp),
            "-o", str(converted_dir),
            "-b", mineru_cfg.get("backend", "hybrid-engine"),
            "-l", mineru_cfg.get("lang", "ch"),
        ]

        effort = mineru_cfg.get("effort")
        if effort:
            cmd += ["--effort", effort]

        try:
            # 清理 PYTHONPATH，防止 vendor 干扰 mineru 子进程
            clean_env = os.environ.copy()
            pp = clean_env.get("PYTHONPATH", "")
            vendor_prefix = os.environ.get("VENDOR_PATH", "vendor")
            paths = [p for p in pp.split(":") if p and vendor_prefix not in p]
            clean_env["PYTHONPATH"] = ":".join(paths)

            # MinerU 默认只等待单个任务 3600 秒。大体量扫描 PDF 经常需要
            # 超过一小时，因此允许在 config.yaml 中提高上限；用户显式设置
            # 环境变量时仍优先采用用户值。
            task_timeout = mineru_cfg.get("task_timeout_seconds", 21600)
            clean_env.setdefault(
                "MINERU_TASK_RESULT_TIMEOUT_SECONDS", str(task_timeout)
            )

            # 用 Popen 以便能在运行时终止
            proc = subprocess.Popen(cmd, env=clean_env)

            # 轮询等待：每 0.5 秒检查一次子进程和跳过信号
            while proc.poll() is None:
                if skip_current.is_set():
                    proc.terminate()
                    try:
                        proc.wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        proc.kill()
                        proc.wait()
                    skipped_files.append(fp.name)
                    print(f"\n   ⏭️  [{fp.name}] 已跳过。\n")
                    break
                import time
                time.sleep(0.5)

            # 正常结束（非跳过）
            if not skip_current.is_set():
                if proc.returncode == 0:
                    hash_db[fp.name] = fhash
                    converted_files.append(fp)
                    _save_hash_db(hash_db_path, hash_db)
                    print(f"         ✓ 完成\n")
                else:
                    failed_files.append(fp.name)
                    print(f"\n⚠️   [{fp.name}] 转换失败（返回码: {proc.returncode}），已跳过，继续下一个。\n")

        except FileNotFoundError:
            print("[错误] 找不到 mineru 命令！请确认 MinerU 已正确安装。")
            print("       安装方法: pip install magic-pdf")
            sys.exit(1)

    _save_hash_db(hash_db_path, hash_db)

    print("=" * 60)
    print("   📊  转换结果汇总")
    print("=" * 60)
    if converted_files:
        print(f"   ✅ 成功: {len(converted_files)} 个")
        for f in converted_files:
            print(f"       {f.name}")
    if skipped_files:
        print(f"\n   ⏭️  用户跳过: {len(skipped_files)} 个")
        for f in skipped_files:
            print(f"       {f}")
    if failed_files:
        print(f"\n   ❌ 失败: {len(failed_files)} 个")
        for f in failed_files:
            print(f"       {f}")
        print(f"\n   💡 失败文件不会写入成功记录，下次运行会自动重试。")
    if not converted_files and not failed_files and not skipped_files:
        print("   没有需要处理的文件。")
    print()

    return converted_files, failed_files


if __name__ == "__main__":
    convert_all(incremental=True)

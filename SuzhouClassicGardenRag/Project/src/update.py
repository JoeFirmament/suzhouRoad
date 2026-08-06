"""
增量更新编排脚本 —— 一键执行「转换 → 索引」流程。
用法: python -m src.update
      python -m src.update --full   (强制全量重建索引)
      python -m src.update --with-images  (同时索引图片)
"""
import sys
import argparse
from pathlib import Path

# 确保 src 上级目录在 sys.path 中（直接运行此文件时）
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.convert import convert_all
from src.indexer import index_documents


def main():
    parser = argparse.ArgumentParser(
        description="园林知识库增量更新 —— 转换新文档并索引"
    )
    parser.add_argument(
        "--full",
        action="store_true",
        help="强制全量重建索引（清空已有索引，重新处理所有文档）",
    )
    parser.add_argument(
        "--convert-only",
        action="store_true",
        help="仅转换文档，不进行索引",
    )
    parser.add_argument(
        "--index-only",
        action="store_true",
        help="仅索引已转换的文档，不进行转换",
    )
    parser.add_argument(
        "--with-images",
        action="store_true",
        help="同时索引 MinerU 输出的图片（Chinese-CLIP）",
    )
    args = parser.parse_args()

    print("=" * 60)
    print("   🏯  园林知识库 — 增量更新")
    print("=" * 60)
    print()

    index_kwargs = {"with_images": args.with_images}

    if args.full and not args.convert_only and not args.index_only:
        print("[模式] 全量重建\n")
        convert_all(incremental=False)
        index_documents(incremental=False, force_reindex=True, **index_kwargs)
    elif args.convert_only:
        incremental = not args.full
        print(f"[模式] 仅转换 ({'全量' if not incremental else '增量'})\n")
        convert_all(incremental=incremental)
    elif args.index_only:
        incremental = not args.full
        print(f"[模式] 仅索引 ({'全量' if not incremental else '增量'})\n")
        index_documents(incremental=incremental, force_reindex=not incremental, **index_kwargs)
    else:
        print("[模式] 增量更新\n")
        # 先转换新文档
        convert_all(incremental=True)
        # 再索引
        index_documents(incremental=True, force_reindex=False, **index_kwargs)

    print("\n[全部完成] ✨")


if __name__ == "__main__":
    main()

"""
向量索引模块 —— 使用 LlamaIndex 将 converted/ 下的 Markdown 文档
分块、向量化（BGE）、存入 Qdrant 本地向量库。

支持 --with-images 参数额外索引图片（Chinese-CLIP → image-dense）。
"""
import json
import hashlib
import sys
import time
from pathlib import Path
from typing import List, Optional

from .config import get_config


def _connect_qdrant(qdrant_path: Path, max_retries: int = 3):
    """创建 QdrantClient，锁冲突时自动重试。"""
    from qdrant_client import QdrantClient

    qdrant_path.mkdir(parents=True, exist_ok=True)

    for attempt in range(1, max_retries + 1):
        try:
            client = QdrantClient(path=str(qdrant_path))
            return client
        except (RuntimeError, OSError) as e:
            if "already accessed" in str(e) or "locked" in str(e).lower():
                if attempt < max_retries:
                    print(f"   ⏳ Qdrant 被锁定，等待重试 ({attempt}/{max_retries})...")
                    time.sleep(2)
                else:
                    lock_file = qdrant_path / ".lock"
                    print(f"\n❌ Qdrant 无法获取锁，可能是上次运行异常退出。")
                    print(f"   修复: 关闭其他 Python 进程，或运行：")
                    print(f"   rm -f {lock_file}")
                    print(f"   然后重新执行命令。\n")
                    sys.exit(1)
            else:
                raise


def _file_hash(filepath: Path) -> str:
    md5 = hashlib.md5()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            md5.update(chunk)
    return md5.hexdigest()


def _load_indexed_db(db_path: Path) -> dict:
    if db_path.exists():
        with open(db_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def _save_indexed_db(db_path: Path, db: dict):
    db_path.parent.mkdir(parents=True, exist_ok=True)
    with open(db_path, "w", encoding="utf-8") as f:
        json.dump(db, f, indent=2, ensure_ascii=False)


def _find_markdown_files(converted_dir: Path) -> List[Path]:
    md_files = []
    for md in converted_dir.rglob("*.md"):
        md_files.append(md)
    return sorted(md_files)


def _index_texts(
    pending: list,
    converted_dir: Path,
    hash_db: dict,
    hash_db_path: Path,
    cfg: dict,
):
    """索引文本片段（原有逻辑）。"""
    embedding_cfg = cfg["embedding"]
    chunking_cfg = cfg["chunking"]
    qdrant_cfg = cfg["qdrant"]

    from llama_index.core import Settings, VectorStoreIndex
    from llama_index.core.node_parser import SentenceSplitter
    from llama_index.embeddings.huggingface import HuggingFaceEmbedding
    from llama_index.vector_stores.qdrant import QdrantVectorStore
    from llama_index.core import Document as LIDocument
    from src.sparse import encode_sparse

    qdrant_path = Path(qdrant_cfg["path"])
    client = _connect_qdrant(qdrant_path)

    embed_model = HuggingFaceEmbedding(
        model_name=embedding_cfg["model_name"],
        device=embedding_cfg.get("device", "cpu"),
        embed_batch_size=embedding_cfg.get("batch_size", 8),
        trust_remote_code=True,
    )

    node_parser = SentenceSplitter(
        chunk_size=chunking_cfg["chunk_size"],
        chunk_overlap=chunking_cfg["chunk_overlap"],
    )

    Settings.embed_model = embed_model
    Settings.node_parser = node_parser

    collection_name = qdrant_cfg["collection_name"]

    vector_store = QdrantVectorStore(
        client=client,
        collection_name=collection_name,
        enable_hybrid=True,
        sparse_doc_fn=lambda x: encode_sparse(x.text),
        sparse_query_fn=encode_sparse,
    )
    index = VectorStoreIndex.from_vector_store(
        vector_store=vector_store, embed_model=embed_model,
    )

    total_new_nodes = 0
    for idx, (fp, fhash, key) in enumerate(pending, 1):
        print(f"  [{idx}/{len(pending)}] {key}")
        try:
            text = fp.read_text(encoding="utf-8")
            if not text.strip():
                print(f"         ⚠ 文件为空，跳过")
                hash_db[key] = fhash
                continue

            doc = LIDocument(text=text, metadata={"source": key})
            nodes = node_parser.get_nodes_from_documents([doc])
            for node in nodes:
                node.metadata["source"] = key

            index.insert_nodes(nodes)
            hash_db[key] = fhash
            total_new_nodes += len(nodes)
            print(f"         ✓ {len(nodes)} 个片段已索引")
        except Exception as e:
            print(f"         ✗ 错误: {e}")

    _save_indexed_db(hash_db_path, hash_db)
    print(f"\n[文字索引完成] 共新增 {total_new_nodes} 个片段。")
    # 释放 Qdrant 连接，避免后续图片索引锁冲突
    try:
        client.close()
    except Exception:
        pass


def _index_images(cfg: dict, force_reindex: bool):
    """索引 MinerU 产出的图片（Chinese-CLIP → image-dense）。"""
    from qdrant_client import models
    from .images import find_all_images
    import torch

    img_cfg = cfg["image"]
    converted_dir = Path(cfg["paths"]["converted_dir"])
    qdrant_path = Path(cfg["qdrant"]["path"])
    qdrant_path.mkdir(parents=True, exist_ok=True)
    img_collection = "garden_images"

    # 加载 CLIP 模型
    print("[加载] Chinese-CLIP 图像模型...")
    from transformers import ChineseCLIPModel, ChineseCLIPProcessor

    device = img_cfg.get("device", "mps")
    clip_model = ChineseCLIPModel.from_pretrained(img_cfg["clip_model"])
    clip_model.to(device)
    clip_model.eval()
    processor = ChineseCLIPProcessor.from_pretrained(img_cfg["clip_model"], use_fast=False)

    from PIL import Image

    # Qdrant 客户端
    client = _connect_qdrant(qdrant_path)

    if force_reindex:
        client.delete_collection(img_collection)

    if not client.collection_exists(img_collection):
        client.create_collection(
            collection_name=img_collection,
            vectors_config={
                "image-dense": models.VectorParams(
                    size=512, distance=models.Distance.COSINE,
                ),
            },
        )
        print(f"   ✓ 集合 '{img_collection}' 已创建（image-dense, 512维）")

    # 扫描全部图片
    all_images = find_all_images(converted_dir)
    if not all_images:
        print("[提示] 没有找到可索引的图片。")
        return

    # 过滤已索引的（可选）
    img_hash_db = _load_indexed_db(Path(cfg["paths"]["image_hash_db"])) if not force_reindex else {}
    pending_images = []
    for md_path, img_abs, caption in all_images:
        fhash = _file_hash(Path(img_abs))
        key = img_abs
        if not force_reindex and key in img_hash_db and img_hash_db[key] == fhash:
            continue
        pending_images.append((md_path, img_abs, caption, fhash))

    if not pending_images:
        print("[提示] 没有需要索引的新图片。")
        return

    print(f"[图片索引] 共 {len(pending_images)} 张待处理\n")

    total = 0
    batch_size = img_cfg.get("batch_size", 4)

    for i in range(0, len(pending_images), batch_size):
        batch = pending_images[i : i + batch_size]
        images = []
        payloads = []
        for md_path, img_abs, caption, fhash in batch:
            try:
                pil_img = Image.open(img_abs).convert("RGB")
                images.append(pil_img)
                payloads.append({
                    "caption": caption,
                    "source_md": str(md_path),
                    "local_image_path": img_abs,
                })
            except Exception as e:
                print(f"  ⚠ 跳过 {img_abs}: {e}")

        if not images:
            continue

        # CLIP 编码
        inputs = processor(images=images, return_tensors="pt", padding=True).to(device)
        with torch.no_grad():
            emb = clip_model.get_image_features(**inputs)
            emb = emb / emb.norm(dim=-1, keepdim=True)
        vectors = emb.cpu().numpy().tolist()

        # 写入 Qdrant
        from qdrant_client.models import PointStruct
        import uuid

        points = []
        for j, (md_path, img_abs, caption, fhash) in enumerate(batch):
            points.append(PointStruct(
                id=str(uuid.uuid4()),
                vector={"image-dense": vectors[j]},
                payload=payloads[j],
            ))

        client.upsert(collection_name=img_collection, points=points)

        for (md_path, img_abs, caption, fhash) in batch:
            img_hash_db[img_abs] = fhash
        # 每批立即持久化，防止中途失败丢失已索引的图片
        _save_indexed_db(Path(cfg["paths"]["image_hash_db"]), img_hash_db)

        total += len(batch)
        print(f"  [{min(i + batch_size, len(pending_images))}/{len(pending_images)}] ✓ {len(batch)} 张")

    _save_indexed_db(Path(cfg["paths"]["image_hash_db"]), img_hash_db)
    print(f"\n[图片索引完成] 共新增 {total} 张图片。")
    try:
        client.close()
    except Exception:
        pass


def index_documents(
    incremental: bool = True,
    force_reindex: bool = False,
    with_images: bool = False,
):
    """
    索引 converted/ 下的文档到 Qdrant。
    """
    cfg = get_config()
    converted_dir = Path(cfg["paths"]["converted_dir"])
    hash_db_path = Path(cfg["paths"]["indexed_hash_db"])

    if not converted_dir.exists() or not any(converted_dir.rglob("*.md")):
        print("[错误] converted/ 目录下没有 Markdown 文件，请先运行 convert.py。")
        return

    # ---- 1. 文字索引 ----
    print("[加载] 正在初始化 Embedding 模型...")
    hash_db = {} if force_reindex else _load_indexed_db(hash_db_path)

    all_md_files = _find_markdown_files(converted_dir)
    pending = []
    skipped = []
    for fp in all_md_files:
        fhash = _file_hash(fp)
        key = str(fp.relative_to(converted_dir))
        if incremental and not force_reindex and key in hash_db and hash_db[key] == fhash:
            skipped.append(fp)
        else:
            pending.append((fp, fhash, key))

    if skipped:
        print(f"[跳过] {len(skipped)} 个文件（已索引且未变化）。")

    if pending:
        print(f"[文字索引] 共 {len(pending)} 个文件待处理。")
        _index_texts(pending, converted_dir, hash_db, hash_db_path, cfg)
    else:
        print("[文字索引] 没有需要索引的新文件。")

    # ---- 2. 图片索引（可选） ----
    if with_images:
        print()
        _index_images(cfg, force_reindex)
    else:
        print("\n[提示] 跳过图片索引（使用 --with-images 启用）")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--incremental", action="store_true", default=True)
    parser.add_argument("--force-reindex", action="store_true")
    parser.add_argument("--with-images", action="store_true")
    args = parser.parse_args()
    index_documents(
        incremental=args.incremental,
        force_reindex=args.force_reindex,
        with_images=args.with_images,
    )

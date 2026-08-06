"""
CLI 查询模块 —— 基于知识库 + DeepSeek LLM 的 RAG 问答。
用法: python -m src.query "苏州园林有哪些特点？"
      python -m src.query -i 照片.jpg "这个图案有什么讲究？"
      python -m src.query          (进入交互模式)
"""
import sys
import subprocess
from pathlib import Path

from .config import get_config

# 系统提示词 —— 园林知识库 RAG 问答
SYSTEM_PROMPT = """你是一位深谙江南文化与中国古典园林美学的专家。

## 核心原则
1. **严格遵循参考内容**：仅使用【参考内容】中提供的事实进行回答。严禁胡编乱造、张冠李戴。
2. **典雅专业的表达**：保持典雅、专业且富有诗意的语言风格，准确使用古典造园术语（如：障景、漏窗、尺幅窗、借景、对景、移步换景、因地制宜）。
3. **通俗易懂的解释**：在使用专业术语的同时，用通俗易懂的语言向用户解释其精妙之处。
4. **历史准确性**：苏州园林历史变迁复杂，请务必核对参考内容中的朝代、园主与具体景观的对应关系，不要混淆（例如：不要将明代园主的轶事错置于清代的景观改建中）。
5. **诚实面对知识边界**：如果参考内容中没有提到某个历史细节或时间点，回答"根据现有资料暂未记载"，绝不凭空捏造。

## 解构维度
在分析或介绍园林景观时，请尝试从以下三个层次展开（若参考内容支持）：

- **历史人文**：该景观背后的造园主、文人题额（匾额对联）及其寄托的隐逸情怀。
- **空间布局**：它是如何通过游廊、漏窗、门洞与周围的山水、建筑发生关系的（是否存在"借景"或"框景"？）。
- **感知体验**：游客走到这里时，视觉（移步换景）、听觉（如：留园"留听阁"听雨入荷）或心理上的感受。

## 诗文引证（若参考内容支持）
在介绍与园林相关的历史人物或景观意境时，如果参考内容中提到了相关的诗句、楹联或题咏：

1. 引述诗句原文，并说明作者创作时的境遇与心情。
2. 交代该文人与苏州（或该园林）的关系——他是否在此居住、游历、任职，或留下了哪些相关作品。
3. **严格基于参考内容**，不得杜撰诗句、年代或人物关系。若参考内容未记载诗文细节，则不强行引用。

## 知识扩展规则
在回答时，你可以使用自己的知识进行补充，但必须严格遵守以下标注规则：

- **【参考内容】**：整理自知识库检索到的资料，用 [序号] 标注出处 —— 这部分可信度高。
- **【知识补充】**：基于你的训练知识所做的扩展（如诗句、历史背景、文化解读）—— 这部分建议用户核实。
  - 涉及诗句时，必须写明：**作者、作品名、朝代**，例如："【知识补充】唐代诗人白居易在《钱塘湖春行》中写道..."
  - 涉及历史人物时，必须写明：**人物、朝代、与苏州的关联**。
  - 如果不确定某个细节，明确说明"这段记忆可能有偏差，建议核实"。

**举例**：
```
【参考内容】拙政园海棠春坞庭院铺满了软脚卍字海棠花纹图案 [2]。

【知识补充】宋代词人李清照曾写《如梦令》"试问卷帘人，却道海棠依旧"。
不过李清照本人与苏州的直接关联在现有资料中不明确，这段供参考。
```

## 回答格式
- 结构清晰，适当分点列出
- 引用具体文献时，用 [序号] 标注出处
- 如果参考内容不足以完整回答，先说明参考内容中已知的部分，再礼貌告知未知部分

以下是从知识库中检索到的【参考内容】：
---
{context}
---"""

# 全局缓存，避免每次重复加载模型
_embed_model = None
_llm_client = None


def _get_llm_client():
    """获取缓存的 DeepSeek 客户端。"""
    global _llm_client
    if _llm_client is None:
        cfg = get_config()
        llm_cfg = cfg["llm"]
        from openai import OpenAI
        _llm_client = OpenAI(
            api_key=llm_cfg["api_key"],
            base_url=llm_cfg["api_base"],
        )
    return _llm_client


def _get_embed_model():
    """获取缓存的 BGE 模型（直接加载 SentenceTransformer，绕过 HuggingFaceEmbedding 的兼容问题）。"""
    global _embed_model
    if _embed_model is None:
        print("   📦 加载 BGE 文本向量模型...", end=" ", flush=True)
        cfg = get_config()
        embedding_cfg = cfg["embedding"]

        # 直接加载 SentenceTransformer（已验证可用）
        from sentence_transformers import SentenceTransformer
        st_model = SentenceTransformer(
            embedding_cfg["model_name"],
            device=embedding_cfg.get("device", "cpu"),
        )

        # 包装为 llama_index 兼容的 Embedding 对象
        from llama_index.core.embeddings import BaseEmbedding
        from typing import Any, List

        class BgeEmbedding(BaseEmbedding):
            """BGE 模型适配器。"""

            def __init__(self, model: SentenceTransformer, **kwargs: Any):
                super().__init__(**kwargs)
                self._model = model

            def _get_query_embedding(self, query: str) -> List[float]:
                return self._model.encode(query, normalize_embeddings=True).tolist()

            def _get_text_embedding(self, text: str) -> List[float]:
                return self._model.encode(text, normalize_embeddings=True).tolist()

            async def _aget_query_embedding(self, query: str) -> List[float]:
                return self._get_query_embedding(query)

            async def _aget_text_embedding(self, text: str) -> List[float]:
                return self._get_text_embedding(text)

        _embed_model = BgeEmbedding(
            model=st_model,
            embed_batch_size=embedding_cfg.get("batch_size", 8),
        )
        print("✓")
    return _embed_model


def _stream_deepseek(messages, temperature=0.3, max_tokens=2048):
    """流式调用 DeepSeek，逐 token 输出。"""
    cfg = get_config()
    llm_cfg = cfg["llm"]
    client = _get_llm_client()

    response = client.chat.completions.create(
        model=llm_cfg["model"],
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
        stream=True,
    )

    full_text = ""
    for chunk in response:
        delta = chunk.choices[0].delta
        if delta and delta.content:
            content = delta.content
            full_text += content
            print(content, end="", flush=True)

    print()  # 换行
    return full_text


def query_once(question: str) -> str:
    """单次文字查询（流式输出）。"""
    cfg = get_config()
    retrieval_cfg = cfg["retrieval"]
    from qdrant_client import QdrantClient
    from llama_index.core import Settings, VectorStoreIndex
    from llama_index.vector_stores.qdrant import QdrantVectorStore
    from src.sparse import encode_sparse_batch

    # 1. 加载模型
    print("⏳ 正在准备...", flush=True)
    embed_model = _get_embed_model()
    Settings.embed_model = embed_model

    # 2. 连接 Qdrant
    print("   🔍 连接知识库...", flush=True)
    qdrant_path = Path(cfg["qdrant"]["path"])
    client = QdrantClient(path=str(qdrant_path))
    collection = cfg["qdrant"]["collection_name"]

    if not client.collection_exists(collection):
        print("[错误] Qdrant 文字集合不存在！请先运行 indexer.py 建立索引。")
        sys.exit(1)

    vector_store = QdrantVectorStore(
        client=client,
        collection_name=collection,
        enable_hybrid=False,
    )
    index = VectorStoreIndex.from_vector_store(vector_store=vector_store, embed_model=embed_model)

    # 3. 检索相关片段（混合检索：语义 + 关键词）
    print("   📖 检索知识库（混合检索）...", flush=True)
    retriever = index.as_retriever(
        similarity_top_k=retrieval_cfg.get("top_k", 5),
    )
    nodes = retriever.retrieve(question)

    # 拼接上下文
    context_parts = []
    for i, node in enumerate(nodes, 1):
        src = node.metadata.get("source", "未知")
        context_parts.append(f"[{i}] 来源: {src}\n{node.text[:500]}")
    context = "\n\n".join(context_parts)

    # 4. 调用 DeepSeek（流式）
    print("   🤖 生成回答中...\n", flush=True)
    print("📖 回答:\n")

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT.format(context=context)},
        {"role": "user", "content": question},
    ]
    answer = _stream_deepseek(messages)

    # 5. 打印来源
    print()
    print("📚 参考来源:")
    seen = set()
    for i, node in enumerate(nodes, 1):
        src = node.metadata.get("source", "未知来源")
        if src not in seen:
            seen.add(src)
            score = node.score if node.score else 0
            print(f"   [{i}] {src}  (相似度: {score:.3f})")
    print()

    return answer


def query_image(image_path: str, question: str | None = None) -> str:
    """
    图片查询：搜图 → 显示原图 → 流式 DeepSeek 解读。
    """
    import torch
    from PIL import Image
    from transformers import ChineseCLIPModel, ChineseCLIPProcessor
    from qdrant_client import QdrantClient

    cfg = get_config()
    img_cfg = cfg["image"]
    device = img_cfg.get("device", "mps")
    threshold = img_cfg.get("match_threshold", 0.70)

    print(f"⏳ 正在分析图片...", flush=True)

    # 1. 加载 CLIP 模型
    print("   📦 加载图像识别模型...", end=" ", flush=True)
    clip_model = ChineseCLIPModel.from_pretrained(img_cfg["clip_model"])
    clip_model.to(device)
    clip_model.eval()
    processor = ChineseCLIPProcessor.from_pretrained(img_cfg["clip_model"], use_fast=False)
    print("✓")

    # 2. 编码查询图片
    print("   🔍 编码图片特征...", flush=True)
    pil_img = Image.open(image_path).convert("RGB")
    inputs = processor(images=pil_img, return_tensors="pt").to(device)
    with torch.no_grad():
        query_vec = clip_model.get_image_features(**inputs)
        query_vec = query_vec / query_vec.norm(dim=-1, keepdim=True)
    query_vector = query_vec.cpu().numpy()[0].tolist()

    # 3. 搜索 Qdrant
    print("   🔍 搜索知识库图片...", flush=True)
    qdrant_path = Path(cfg["qdrant"]["path"])
    client = QdrantClient(path=str(qdrant_path))
    collection = "garden_images"

    if not client.collection_exists(collection):
        print("[错误] 图片集合不存在！请先运行 indexer.py --with-images。")
        sys.exit(1)

    result = client.query_points(
        collection_name=collection,
        query=query_vector,
        using="image-dense",
        limit=5,
    )
    results = result.points

    good = [r for r in results if r.score >= threshold]
    if not good:
        if results:
            best = results[0].score
            print(f"   ⚠ 未找到高置信度匹配（最高 {best:.3f}，阈值 {threshold}）")
        print("[提示] 未找到匹配的园林图案。")
        return ""

    best = good[0]

    # 4. 显示匹配结果
    caption = best.payload.get("caption", "（无描述）")
    source = best.payload.get("source_md", "未知出处")
    local_img = best.payload.get("local_image_path", "")

    print(f"\n✨ [匹配成功! 置信度: {best.score*100:.1f}%]")
    print(f"📌 图案: {caption}")
    print(f"📖 出处: {source}")

    if local_img and Path(local_img).exists():
        print(f"🖼️  原图: {local_img}")
        # 用系统看图软件打开
        try:
            subprocess.Popen(["open", local_img])
            print("   (已用系统看图软件打开原图)")
        except Exception:
            pass

    # 5. 流式调用 DeepSeek 解读
    user_question = question or "这张图片是园林中的什么图案？有什么文化寓意和工艺特点？"

    context = f"[1] 图案: {caption}\n    出处: {source}\n    匹配度: {best.score:.3f}"

    system_msg = f"""你是一位深谙江南文化与中国古典园林美学的专家。用户上传了一张园林图案的照片。

系统通过图像检索在知识库中找到以下最匹配的标准文献条目：
{context}

【严格规则】
1. 【参考内容】整理自知识库检索到的资料 — 这部分可信度高。
2. 你可以用自己的知识补充图案的文化解读、诗句典故等 — 但必须用【知识补充】标注，同时写明作者、朝代、作品名。
3. 不确定的内容要说明"这段可能有偏差，建议进一步核实"。"""

    print("\n⏳ 正在生成回答...\n", flush=True)
    print("📖 回答:\n")

    answer = _stream_deepseek([
        {"role": "system", "content": system_msg},
        {"role": "user", "content": user_question},
    ])

    return answer


def _build_query_engine():
    """构建文字 RAG 查询引擎（给交互模式用）。"""
    cfg = get_config()
    retrieval_cfg = cfg["retrieval"]
    from qdrant_client import QdrantClient
    from llama_index.core import Settings, VectorStoreIndex
    from llama_index.vector_stores.qdrant import QdrantVectorStore
    from src.sparse import encode_sparse_batch

    embed_model = _get_embed_model()
    Settings.embed_model = embed_model

    qdrant_path = Path(cfg["qdrant"]["path"])
    client = QdrantClient(path=str(qdrant_path))
    collection = cfg["qdrant"]["collection_name"]

    if not client.collection_exists(collection):
        print("[错误] Qdrant 文字集合不存在！请先运行 indexer.py 建立索引。")
        sys.exit(1)

    vector_store = QdrantVectorStore(
        client=client,
        collection_name=collection,
        enable_hybrid=False,
    )
    index = VectorStoreIndex.from_vector_store(vector_store=vector_store, embed_model=embed_model)
    retriever = index.as_retriever(
        similarity_top_k=retrieval_cfg.get("top_k", 5),
    )
    return retriever


def interactive():
    """交互式查询模式。"""
    print("=" * 60)
    print("   🏯  园林知识库 RAG 问答系统")
    print("   输入 'quit' 或 'exit' 退出")
    print("   输入 'sources' 查看上次检索的来源")
    print("   输入 'image:照片路径:问题' 进行图片检索")
    print("=" * 60)
    print()

    print("⏳ 正在加载模型（首次较慢）...")
    retriever = _build_query_engine()
    llm_client = _get_llm_client()
    last_context = ""
    print("✅ 就绪！\n")

    while True:
        try:
            line = input("🔍 请输入问题: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n再见！")
            break

        if not line:
            continue
        if line.lower() in ("quit", "exit", "q"):
            print("再见！")
            break
        if line.lower() == "sources":
            if last_context:
                print("📚 上次查询的参考来源:")
                print(last_context[:1000])
            else:
                print("还没有进行过查询。")
            continue

        # 图片查询: image:路径:问题
        if line.startswith("image:"):
            parts = line.split(":", 2)
            img_path = parts[1].strip()
            img_question = parts[2].strip() if len(parts) > 2 else None
            try:
                query_image(img_path, img_question)
            except Exception as e:
                print(f"[错误] 查询失败: {e}")
            print("-" * 60)
            continue

        # 文字查询
        print()
        print("   📖 检索知识库...", flush=True)
        nodes = retriever.retrieve(line)

        context_parts = []
        for i, node in enumerate(nodes, 1):
            src = node.metadata.get("source", "未知")
            context_parts.append(f"[{i}] 来源: {src}\n{node.text[:500]}")
        last_context = "\n\n".join(context_parts)

        print("   🤖 生成回答中...\n", flush=True)
        print("📖 回答:\n")

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT.format(context=last_context)},
            {"role": "user", "content": line},
        ]
        _stream_deepseek(messages)

        # 打印来源
        print()
        print("📚 参考来源:")
        seen = set()
        for i, node in enumerate(nodes, 1):
            src = node.metadata.get("source", "未知来源")
            if src not in seen:
                seen.add(src)
                score = node.score if node.score else 0
                print(f"   [{i}] {src}  (相似度: {score:.3f})")
        print()
        print("-" * 60)


def main():
    import argparse
    parser = argparse.ArgumentParser(description="园林知识库 RAG 问答系统")
    parser.add_argument("question", nargs="*", help="要查询的问题")
    parser.add_argument("-i", "--image", type=str, help="图片路径，用于以图搜图")
    args = parser.parse_args()

    if args.image:
        q = " ".join(args.question) if args.question else None
        print(f"📷 图片: {args.image}")
        if q:
            print(f"🔍 问题: {q}\n")
        try:
            query_image(args.image, q)
        except Exception as e:
            print(f"[错误] 查询失败: {e}")
            sys.exit(1)
    elif args.question:
        question = " ".join(args.question)
        print(f"🔍 问题: {question}\n")
        try:
            query_once(question)
        except Exception as e:
            print(f"[错误] 查询失败: {e}")
            sys.exit(1)
    else:
        interactive()


if __name__ == "__main__":
    main()

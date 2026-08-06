"""
园林知识库 RAG 系统 — Gradio Web 界面
"""
import sys
import os
from pathlib import Path

# 确保能找到 src 和 vendor
_script_dir = Path(__file__).parent
sys.path.insert(0, str(_script_dir))
_vendor = _script_dir / "vendor"
if _vendor.exists():
    os.environ.setdefault("VENDOR_PATH", str(_vendor))
    sys.path.append(str(_vendor))

import gradio as gr

# 静默 transformers 版本警告
import logging
logging.getLogger("transformers").setLevel(logging.ERROR)


def _get_modules():
    from src import query as q
    return q


# ==================== 文字问答（流式） ====================

def chat_respond(message: str, history: list):
    """
    流式文字问答。history 格式: [{"role": "user"/"assistant", "content": ...}]
    """
    q = _get_modules()
    cfg = q.get_config()
    retrieval_cfg = cfg["retrieval"]

    from qdrant_client import QdrantClient
    from llama_index.core import Settings, VectorStoreIndex
    from llama_index.vector_stores.qdrant import QdrantVectorStore
    from src.sparse import encode_sparse

    history.append({"role": "user", "content": message})
    history.append({"role": "assistant", "content": "⏳ 准备模型中..."})
    yield history

    embed_model = q._get_embed_model()
    Settings.embed_model = embed_model

    history[-1]["content"] = "⏳ 连接知识库中..."
    yield history

    qdrant_path = Path(cfg["qdrant"]["path"])
    client = QdrantClient(path=str(qdrant_path))
    collection = cfg["qdrant"]["collection_name"]
    vector_store = QdrantVectorStore(
        client=client,
        collection_name=collection,
        enable_hybrid=True,
        sparse_query_fn=encode_sparse,
    )
    index = VectorStoreIndex.from_vector_store(vector_store=vector_store, embed_model=embed_model)
    retriever = index.as_retriever(
        similarity_top_k=retrieval_cfg.get("top_k", 5),
        vector_store_query_mode="hybrid",
    )
    nodes = retriever.retrieve(message)

    context_parts = []
    for i, node in enumerate(nodes, 1):
        src = node.metadata.get("source", "未知")
        context_parts.append(f"[{i}] 来源: {src}\n{node.text[:500]}")
    context = "\n\n".join(context_parts)

    # 流式调用 DeepSeek
    history[-1]["content"] = "🤖 思考中..."
    yield history

    prompt = q.SYSTEM_PROMPT.format(context=context)
    msgs = [
        {"role": "system", "content": prompt},
        {"role": "user", "content": message},
    ]

    llm_client = q._get_llm_client()
    llm_cfg = cfg["llm"]
    response = llm_client.chat.completions.create(
        model=llm_cfg["model"],
        messages=msgs,
        temperature=llm_cfg.get("temperature", 0.3),
        max_tokens=llm_cfg.get("max_tokens", 2048),
        stream=True,
    )

    full_text = ""
    for chunk in response:
        delta = chunk.choices[0].delta
        if delta and delta.content:
            full_text += delta.content
            history[-1]["content"] = full_text
            yield history

    # 追加参考来源
    sources_text = "\n\n📚 **参考来源**\n"
    seen = set()
    for i, node in enumerate(nodes, 1):
        src = node.metadata.get("source", "未知来源")
        if src not in seen:
            seen.add(src)
            score = node.score if node.score else 0
            short_src = src.rsplit("/", 1)[-1] if "/" in src else src
            sources_text += f"- [{i}] {short_src} (相似度: {score:.3f})\n"

    history[-1]["content"] = full_text + sources_text
    yield history


# ==================== 图片搜索 ====================

def image_search(image_path):
    """图片搜索：返回 (匹配描述, 匹配的原图路径, 解读文字)"""
    if image_path is None:
        return "请先上传图片", None, ""

    q = _get_modules()
    import torch
    from PIL import Image
    from transformers import ChineseCLIPModel, ChineseCLIPProcessor
    from qdrant_client import QdrantClient

    cfg = q.get_config()
    img_cfg = cfg["image"]
    device = img_cfg.get("device", "mps")
    threshold = img_cfg.get("match_threshold", 0.70)

    # 加载 CLIP
    clip_model = ChineseCLIPModel.from_pretrained(img_cfg["clip_model"])
    clip_model.to(device)
    clip_model.eval()
    processor = ChineseCLIPProcessor.from_pretrained(img_cfg["clip_model"], use_fast=False)

    # 编码
    pil_img = Image.open(image_path).convert("RGB")
    inputs = processor(images=pil_img, return_tensors="pt").to(device)
    with torch.no_grad():
        query_vec = clip_model.get_image_features(**inputs)
        query_vec = query_vec / query_vec.norm(dim=-1, keepdim=True)
    query_vector = query_vec.cpu().numpy()[0].tolist()

    # 搜索
    client = QdrantClient(path=str(Path(cfg["qdrant"]["path"])))
    result = client.query_points(
        collection_name="garden_images",
        query=query_vector,
        using="image-dense",
        limit=3,
    )
    results = result.points

    good = [r for r in results if r.score >= threshold]
    if not good:
        best = results[0].score if results else 0
        return f"未找到高置信度匹配（最高 {best:.3f}，阈值 {threshold}）", None, ""

    best = good[0]
    caption = best.payload.get("caption", "（无描述）")
    source = best.payload.get("source_md", "未知出处")
    matched_img_path = best.payload.get("local_image_path", "")
    if matched_img_path and not Path(matched_img_path).exists():
        matched_img_path = None

    match_info = (
        f"✨ **匹配成功! 置信度: {best.score*100:.1f}%**\n\n"
        f"📌 **图案**: {caption}\n"
        f"📖 **出处**: {source.rsplit('/', 1)[-1] if '/' in source else source}"
    )

    # DeepSeek 解读
    context = f"[1] 图案: {caption}\n    出处: {source}\n    匹配度: {best.score:.3f}"
    system_msg = (
        "你是一位深谙江南文化与中国古典园林美学的专家。用户上传了一张园林图案的照片。\n\n"
        "系统通过图像检索在知识库中找到以下最匹配的标准文献条目：\n"
        f"{context}\n\n"
        "【严格规则】\n"
        "1. 【参考内容】整理自知识库检索到的资料。\n"
        "2. 可以用自己的知识补充图案的文化解读、诗句典故等，但必须用【知识补充】标注。\n"
        "3. 不确定的内容要说明'这段可能有偏差，建议进一步核实'。"
    )

    llm_client = q._get_llm_client()
    llm_cfg = cfg["llm"]
    response = llm_client.chat.completions.create(
        model=llm_cfg["model"],
        messages=[
            {"role": "system", "content": system_msg},
            {"role": "user", "content": "请详细说明这个图案的名称、文化寓意和工艺做法。"},
        ],
        temperature=llm_cfg.get("temperature", 0.3),
        max_tokens=llm_cfg.get("max_tokens", 2048),
        stream=False,
    )
    interpretation_text = response.choices[0].message.content

    return match_info, matched_img_path, interpretation_text


# ==================== Gradio 界面 ====================

with gr.Blocks(title="🏯 园林知识库", fill_height=True) as demo:
    gr.HTML(
    """
    <div style="text-align:center;margin-bottom:16px">
        <h1 style="font-size:28px;margin-bottom:4px">🏯 园林知识库 RAG 问答系统</h1>
        <p style="color:#666;font-size:14px">基于 MinerU + BGE + Chinese-CLIP + Qdrant + DeepSeek</p>
    </div>
    """
    )

    with gr.Row(equal_height=False):
        # ========== 左栏：聊天 ==========
        with gr.Column(scale=3):
            chatbot = gr.Chatbot(
                label="💬 问答",
                height=600,
            )
            with gr.Row():
                msg = gr.Textbox(
                    label="输入问题",
                    placeholder="例如：拙政园的海棠春坞有什么讲究？",
                    scale=4,
                    submit_btn="发送",
                )
                clear_btn = gr.ClearButton([msg, chatbot], value="清空")

        # ========== 右栏：图片搜索 ==========
        with gr.Column(scale=2):
            gr.Markdown("### 📷 图片搜索")
            gr.Markdown("上传一张园林图案照片，系统会从知识库中查找匹配的原图并解读。")

            image_input = gr.Image(label="上传照片", type="filepath", height=250)
            search_btn = gr.Button("🔍 搜索图案", variant="primary")

            match_result = gr.Markdown(label="匹配结果")
            matched_image = gr.Image(label="知识库中的原图", type="filepath", height=250, visible=True)
            interpretation = gr.Markdown(label="🤖 图案解读")

    # ========== 事件绑定 ==========

    msg.submit(
        chat_respond,
        inputs=[msg, chatbot],
        outputs=[chatbot],
        queue=True,
    )

    search_btn.click(
        fn=image_search,
        inputs=[image_input],
        outputs=[match_result, matched_image, interpretation],
        queue=True,
    )


if __name__ == "__main__":
    demo.queue(default_concurrency_limit=1).launch(
        server_name="127.0.0.1",
        server_port=7860,
        share=False,
        show_error=False,
    )

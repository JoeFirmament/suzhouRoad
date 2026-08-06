"""
园林知识库 RAG 系统 — FastAPI REST API 服务器
提供给前端页面（如姑苏九园数字档案）调用的 HTTP 接口。

无 DeepSeek API Key 时仍可运行：检索知识库并返回原文片段。

启动:
    uvicorn api_server:app --host 0.0.0.0 --port 8000 --reload
    ./run.sh api              # 通过 run.sh 启动
    ./run.sh api --reload     # 开发模式
"""
import sys
import os
from pathlib import Path
from typing import Optional

# ── 路径引导（与 app.py 一致）──────────────────────────────
_script_dir = Path(__file__).parent
sys.path.insert(0, str(_script_dir))
_vendor = _script_dir / "vendor"
if _vendor.exists():
    os.environ.setdefault("VENDOR_PATH", str(_vendor))
    sys.path.append(str(_vendor))

import logging
logging.getLogger("transformers").setLevel(logging.ERROR)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from src import query as q

# ── FastAPI 应用 ──────────────────────────────────────────
app = FastAPI(
    title="园林知识库 RAG API",
    description="苏州古典园林 RAG 检索增强生成接口。支持知识库检索 + DeepSeek 生成回答。无 API Key 时降级为原文检索。",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── 请求/响应模型 ─────────────────────────────────────────
class ChatRequest(BaseModel):
    query: str
    history: Optional[list[dict]] = None

class SourceItem(BaseModel):
    title: str
    score: float

class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceItem]
    mode: str = "llm"  # "llm" | "retrieval_only"

class HealthResponse(BaseModel):
    status: str
    qdrant_available: bool
    qdrant_size: int | None = None
    embed_model_loaded: bool = False
    llm_available: bool = False
    message: str = ""


# ── 全局缓存 ──────────────────────────────────────────────
_embed_model = None
_qdrant_client = None
_qdrant_collection = None
_llm_available = False
_llm_error = ""
_cfg_cache = None


def _load_config_raw() -> dict | None:
    """直接读取 config.yaml，不经过环境变量替换（规避 LLM key 检查）。"""
    try:
        import yaml
        config_path = Path(__file__).parent / "config.yaml"
        with open(config_path) as f:
            return yaml.safe_load(f)
    except Exception:
        return None


def _load_config() -> dict | None:
    """加载配置（含环境变量替换）。环境变量缺失时不抛异常。"""
    global _cfg_cache
    if _cfg_cache is not None:
        return _cfg_cache
    try:
        _cfg_cache = q.get_config()
        return _cfg_cache
    except ValueError:
        _cfg_cache = None
        return None
    except Exception:
        _cfg_cache = None
        return None


def _lazy_init():
    """惰性加载 Embedding 模型和 Qdrant 连接（不依赖 LLM 配置）。"""
    global _embed_model, _qdrant_client, _qdrant_collection, _llm_available, _llm_error
    if _qdrant_client is not None:
        return

    # 先用完整配置加载（含 env 替换），失败则用原始 yaml
    cfg = _load_config()
    if cfg is None:
        cfg = _load_config_raw()

    if cfg is None:
        _llm_error = "config.yaml 无法读取"
        return

    # 1. Embedding 模型（不依赖 LLM key）
    try:
        if _embed_model is None:
            _embed_model = q._get_embed_model()
        from llama_index.core import Settings
        Settings.embed_model = _embed_model
    except Exception as e:
        _llm_error = f"Embedding 模型加载失败: {e}"
        print(f"⚠️  {_llm_error}")

    # 2. Qdrant 连接
    try:
        from qdrant_client import QdrantClient
        qdrant_path = Path(cfg["qdrant"]["path"])
        _qdrant_client = QdrantClient(path=str(qdrant_path))
        _qdrant_collection = cfg["qdrant"]["collection_name"]
    except Exception as e:
        _llm_error = f"Qdrant 连接失败: {e}"

    # 3. LLM 可用性（独立检查）
    try:
        llm_cfg = cfg.get("llm", {})
        api_key = llm_cfg.get("api_key", "")
        if not api_key or api_key == "__missing__":
            _llm_available = False
            _llm_error = "DEEPSEEK_API_KEY 未设置，LLM 生成不可用"
        else:
            q._get_llm_client()
            _llm_available = True
    except (ValueError, Exception) as e:
        _llm_available = False
        _llm_error = str(e)


def _build_retriever():
    """构建 LlamaIndex 检索器。"""
    _lazy_init()
    if _qdrant_client is None:
        raise RuntimeError("Qdrant 不可用")

    from llama_index.core import VectorStoreIndex
    from llama_index.vector_stores.qdrant import QdrantVectorStore

    vector_store = QdrantVectorStore(
        client=_qdrant_client,
        collection_name=_qdrant_collection,
        enable_hybrid=False,  # 集合只有稠密向量
    )

    if _embed_model is not None:
        from llama_index.core import Settings
        Settings.embed_model = _embed_model
        index = VectorStoreIndex.from_vector_store(
            vector_store=vector_store,
            embed_model=_embed_model,
        )
    else:
        index = VectorStoreIndex.from_vector_store(
            vector_store=vector_store,
        )

    cfg = _load_config()
    top_k = 5
    if cfg:
        top_k = cfg.get("retrieval", {}).get("top_k", 5)

    retriever = index.as_retriever(
        similarity_top_k=top_k,
    )
    return retriever


def _build_answer_from_nodes(nodes) -> str:
    """将检索到的节点拼成可读的文本回答（LLM 不可用时的降级方案）。"""
    parts = [f"找到 {len(nodes)} 条相关内容：\n"]
    for i, node in enumerate(nodes, 1):
        src = node.metadata.get("source", "未知来源")
        text = node.text[:600].strip()
        parts.append(f"─── [{i}] 来源：{src} ───\n{text}")
    return "\n\n".join(parts)


# ── API 端点 ──────────────────────────────────────────────

@app.get("/api/health", response_model=HealthResponse)
async def health():
    """健康检查：确认 Qdrant 和模型状态。"""
    try:
        _lazy_init()
        messages = []
        if _llm_error:
            messages.append(_llm_error)

        size = None
        exists = False
        if _qdrant_client is not None:
            try:
                exists = _qdrant_client.collection_exists(_qdrant_collection)
                if exists:
                    info = _qdrant_client.get_collection(_qdrant_collection)
                    size = info.points_count
            except Exception:
                pass

        status = "ok"
        if not exists:
            status = "degraded"
            messages.append("Qdrant collection 不存在，请先运行索引")
        if not _llm_available:
            status = "degraded"
            if not any("LLM" in m for m in messages):
                messages.append("LLM 不可用，将降级为原文检索")

        return HealthResponse(
            status=status,
            qdrant_available=exists,
            qdrant_size=size,
            embed_model_loaded=_embed_model is not None,
            llm_available=_llm_available,
            message="; ".join(messages),
        )
    except Exception as e:
        return HealthResponse(
            status=f"error: {str(e)}",
            qdrant_available=False,
        )


@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """
    知识问答：检索知识库 → 若 LLM 可用则用 DeepSeek 生成，否则返回原文。
    """
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="query 不可为空")

    try:
        _lazy_init()
        if _qdrant_client is None:
            raise HTTPException(status_code=503, detail="知识库不可用")

        retriever = _build_retriever()

        # 1. 检索
        nodes = retriever.retrieve(req.query)

        if not nodes:
            return ChatResponse(
                answer=f"未找到与「{req.query}」相关的内容。",
                sources=[],
                mode="retrieval_only",
            )

        # 2. 整理来源
        seen = set()
        sources = []
        for node in nodes:
            src = node.metadata.get("source", "未知来源")
            if src not in seen:
                seen.add(src)
                short_src = src.rsplit("/", 1)[-1] if "/" in src else src
                sources.append(SourceItem(
                    title=short_src,
                    score=round(node.score or 0, 3),
                ))

        # 3. LLM 生成（如果可用）
        if _llm_available:
            context_parts = []
            for i, node in enumerate(nodes, 1):
                src = node.metadata.get("source", "未知")
                context_parts.append(f"[{i}] 来源: {src}\n{node.text[:500]}")
            context = "\n\n".join(context_parts)

            messages = [
                {"role": "system", "content": q.SYSTEM_PROMPT.format(context=context)},
                {"role": "user", "content": req.query},
            ]
            llm_client = q._get_llm_client()
            cfg = _load_config()
            llm_cfg = cfg["llm"] if cfg else {}

            response = llm_client.chat.completions.create(
                model=llm_cfg.get("model", "deepseek-chat"),
                messages=messages,
                temperature=llm_cfg.get("temperature", 0.3),
                max_tokens=llm_cfg.get("max_tokens", 2048),
                stream=False,
            )
            answer = response.choices[0].message.content or ""
            return ChatResponse(answer=answer, sources=sources, mode="llm")
        else:
            # 降级：返回原文检索结果
            answer = _build_answer_from_nodes(nodes)
            return ChatResponse(answer=answer, sources=sources, mode="retrieval_only")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG 查询失败: {str(e)}")


# ── 直接启动 ──────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("API_PORT", "8000"))
    reload_mode = os.environ.get("API_RELOAD", "") == "--reload"
    print(f"🌿 园林知识库 RAG API 启动 → http://127.0.0.1:{port}")
    print(f"   📖 API 文档 → http://127.0.0.1:{port}/docs")
    uvicorn.run("api_server:app", host="0.0.0.0", port=port, reload=reload_mode)

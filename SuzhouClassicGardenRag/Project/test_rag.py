"""测试 RAG 检索链路"""
import sys, os
sys.path.insert(0, ".")
sys.path.append("vendor")

# 尝试加载 .env
_env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(_env_path):
    with open(_env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

from src import query as q
from qdrant_client import QdrantClient
from pathlib import Path
from llama_index.core import Settings, VectorStoreIndex
from llama_index.vector_stores.qdrant import QdrantVectorStore

cfg = q.get_config()
embed = q._get_embed_model()
Settings.embed_model = embed
print("1. BGE 加载 ✅")

client = QdrantClient(path=str(Path(cfg["qdrant"]["path"])))
vs = QdrantVectorStore(
    client=client,
    collection_name=cfg["qdrant"]["collection_name"],
    enable_hybrid=False,  # 集合只有稠密向量
)
print("2. VectorStore 创建 ✅")

index = VectorStoreIndex.from_vector_store(vector_store=vs, embed_model=embed)
retriever = index.as_retriever(similarity_top_k=3)
print("3. Retriever 创建 ✅")

nodes = retriever.retrieve("拙政园的借景手法")
print(f"4. 检索成功! {len(nodes)} 条结果")
for n in nodes:
    print(f"   [{n.score:.3f}] {n.metadata.get('source','?')}")

"""检查 Qdrant collection 的向量配置"""
import sys, os
sys.path.insert(0, ".")
sys.path.append("vendor")

_env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(_env_path):
    with open(_env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

from src.config import get_config
from qdrant_client import QdrantClient
from pathlib import Path

cfg = get_config()
client = QdrantClient(path=str(Path(cfg["qdrant"]["path"])))
col = client.get_collection(cfg["qdrant"]["collection_name"])

print("=== Collection 配置 ===")
print(f"名称: {cfg['qdrant']['collection_name']}")
print(f"向量数: {col.points_count}")

print("\n=== 稠密向量配置 ===")
vecs = col.config.params.vectors
if hasattr(vecs, 'items'):
    for name, params in vecs.items():
        print(f"  {name}: size={params.size}, distance={params.distance}")
else:
    print(f"  默认: size={vecs.size}, distance={vecs.distance}")

print("\n=== 稀疏向量 ===")
try:
    sv = col.config.params.sparse_vectors or {}
    if sv:
        for name in sv:
            print(f"  {name}")
    else:
        print("  (无稀疏向量)")
except Exception as e:
    print(f"  读取失败: {e}")

print("\n=== 样本点向量 ===")
results = client.scroll(cfg["qdrant"]["collection_name"], limit=1, with_vectors=True)
if results[0]:
    point = results[0][0]
    vec = point.vector or {}
    if isinstance(vec, dict):
        for name, v in vec.items():
            if hasattr(v, 'indices'):
                print(f"  稀疏 [{name}]: {len(v.indices)} 维")
            else:
                print(f"  稠密 [{name}]: {len(v)} 维")
    else:
        print(f"  默认稠密: {len(vec)} 维")

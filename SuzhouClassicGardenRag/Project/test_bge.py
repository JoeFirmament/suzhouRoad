"""BGE 模型加载测试"""
import sys, os
sys.path.insert(0, ".")
sys.path.append("vendor")

os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"

print("正在加载 BGE 模型...")
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("BAAI/bge-large-zh-v1.5")
emb = model.encode("借景拙政园")
print(f"✅ 加载成功！向量维度: {len(emb)}")
print(f"   前 8 维: {[round(x, 4) for x in emb[:8]]}")

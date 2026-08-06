"""
轻量级中文稀疏向量编码器 —— 无需下载任何模型。
使用字符 n-gram + TF 权重，替代 fastembed SPLADE。
"""
import re
import math
from collections import Counter
from typing import List

from qdrant_client.models import SparseVector


def _tokenize(text: str) -> List[str]:
    """中文 char bigram + 英文/数字分词。"""
    tokens = []
    # 中文部分：字符二元组
    chinese = re.findall(r'[\u4e00-\u9fff]+', text)
    for chunk in chinese:
        for i in range(len(chunk) - 1):
            tokens.append(chunk[i:i+2])
        # 也加入单字
        for ch in chunk:
            tokens.append(ch)
    # 英文/数字部分：按空格和标点分割
    others = re.split(r'[\u4e00-\u9fff\s,，。；;：:！!？?、"""（）【】《》<>/\\]+', text)
    for chunk in others:
        if chunk.strip():
            tokens.append(chunk.strip().lower())
    return tokens


def _hash_token(token: str) -> int:
    """将 token 哈希为非负整数（稀疏向量的索引）。"""
    return abs(hash(token)) % (2 ** 31 - 1)


def encode_sparse(text: str) -> SparseVector:
    """
    将文本编码为稀疏向量。
    Qdrant 格式：{indices: [int, ...], values: [float, ...]}
    """
    tokens = _tokenize(text)
    if not tokens:
        return SparseVector(indices=[0], values=[0.0])

    counter = Counter(tokens)
    max_freq = max(counter.values())

    indices = []
    values = []
    for token, freq in counter.most_common(200):  # 最多取 200 个非零维
        idx = _hash_token(token)
        # TF 权重：log(1 + freq) / log(1 + max_freq)
        weight = math.log(1 + freq) / math.log(1 + max_freq)
        indices.append(idx)
        values.append(round(weight, 6))

    return SparseVector(indices=indices, values=values)


def encode_sparse_batch(texts: list[str]) -> tuple[list[list[int]], list[list[float]]]:
    """
    批量编码文本为稀疏向量（LlamaIndex doc 编码器约定）。
    返回 (indices_list, values_list)，每个元素对应一条输入文本。
    """
    indices_batch = []
    values_batch = []
    for text in texts:
        sv = encode_sparse(text)
        indices_batch.append(sv.indices)
        values_batch.append(sv.values)
    return indices_batch, values_batch

# 企业文档 RAG——从零搭建的技术手册与实施指南

> 这是一份可以**边讲边干**的文档。目标读者：被指派"给公司搭一个内部文档 RAG"的工程师，以及要给别人讲清楚 RAG 怎么落地的人。
>
> 读法：从第 0 阶段顺着往下做，每个阶段都是 **科普（这是什么、为什么需要）→ 实操（能跑的代码）→ 验证（怎么确认成功）→ 你现在拥有了什么**。9 个阶段走完，你就有一个生产可用的企业文档 RAG。
>
> 全程只用**开源工程和开放模型**，单机 SQLite 起步，零外部依赖，后面随时能演进到企业级。

---

## 写在前面：RAG 到底在干什么（5 分钟科普）

先把概念讲透，后面所有模块才有意义。

**大模型（LLM）是个"极其聪明但没记性、也没看过你公司内部资料"的顾问。** 你问它"我们公司的报销流程是什么"，它要么瞎编，要么说不知道——因为它没见过你们的制度文档。

**RAG（Retrieval-Augmented Generation，检索增强生成）就是给这个顾问配一个"图书管理员"。** 流程是三步：

```
用户提问
   │
   ▼
① 检索：图书管理员从公司文档库里，找出和问题最相关的几段
   │
   ▼
② 拼接：把这几段原文 + 用户问题，一起递给大模型
   │
   ▼
③ 生成：大模型基于"看到的真实资料"作答
```

**关键洞察：答案的质量，90% 取决于第①步"检索"找得准不准。** 找错了，大模型再聪明也是"基于错资料"回答；找对了，哪怕是中等模型也能答得好。所以这份文档 80% 的篇幅在讲"怎么把相关的几段找出来"——这正是图书管理员的核心手艺。

**为什么不直接把所有文档塞给大模型？** 三个原因：①上下文窗口有上限（塞不下）②贵（每次提问都重复传几万字）③效果反而差（资料太多大模型会"走神"）。所以才需要先检索、再喂。

**那"检索"为什么不能只用传统的关键词搜索？** 因为用户问"显卡"，你文档里写的是"GPU"——字面完全不一样，关键词搜索找不到。所以需要"语义检索"（懂意思的检索）。但光有语义检索也不行（精确型号、错误码它又搜不准）——所以需要**多路融合**。这就是后面所有模块的来由。

> 📌 **贯穿全文的比喻**：搭一个 RAG，就是培养一个图书管理员。他要会：
> - **读各种格式的资料**（解析）
> - **把资料分门别类、拆成卡片**（分段）
> - **理解每张卡片讲什么、能在脑子里按"意思"找卡片**（嵌入 + 向量检索）
> - **也能按"原话字眼"找卡片**（关键词检索）
> - **两套找法综合判断**（融合）
> - **最后再精挑细选一遍**（重排）
> - 资料越来越多还不乱、不重复、跟得上更新（工程化）
> - 还会画"关系图"处理需要多步推理的问题（图结构）

下面开始搭建。

---

## 第 0 阶段：准备（10 分钟）

### 科普：我们这套技术栈长什么样

一句话：**用 SQLite 当库、用开源模型当脑子、用 Python 串起来。**

为什么是这套：
- **SQLite**：一个文件就是整个数据库，零运维，备份就是复制文件。百万级文档以内完全够。等企业上量了再换 postgres——平滑演进。
- **开源模型**：嵌入用 `jina-v2-base-zh`（中文好、325MB 能常驻），重排用 `bge-reranker`，都跑在本机，数据不出公司（合规）。
- **Python**：生态最全，粘合各种组件最方便。

### 实操：装依赖

```bash
# Python 3.10+
pip install markitdown          # 文档解析：PDF/Word/PPT/Excel → 文本
pip install fastembed           # 嵌入：本地 ONNX 推理（自带下模型）
pip install sqlite-vec          # 向量检索：SQLite 的 vec0 扩展
pip install sqlite-utils        # SQLite 便捷操作（可选）
pip install requests            # 调 reranker / LLM API（可选）
```

### 验证

```bash
python -c "import markitdown, fastembed, sqlite_vec; print('OK')"
```
打印 `OK` 就过了。

> 📌 **你现在拥有什么**：一个空的工作目录和装好的工具链。下一阶段开始往里填东西。

---

## 第 1 阶段：让文档能被"读"——解析与分段

### 科普：为什么要切成小块？

假设你有一份 50 页的技术规范，整篇 10 万字。如果整篇当一条记录塞进检索：
- **召回粒度太粗**：返回就是整份 10 万字，用户要的那段被稀释在里面。
- **嵌入被稀释**：把 10 万字压成一个向量，啥重点都没了。
- **喂给大模型塞不下**：一次只能喂几千字。

所以要**分段（chunking）**——像图书管理员把一本书拆成一张张"知识卡片"，每张讲一个完整的小知识点。

**但切法有讲究**，三个要点：
1. **大小适中**：太小语义不全，太大召回噪声多。经验值 **~512 字符**。
2. **重叠（overlap）**：相邻卡片重叠 ~64 字符，防止把一个事实从中间切断（"第3章定义的X"被切成两半，两边都搜不全）。
3. **优先在标题边界切**：保留"这张卡片属于第几章第几节"的信息（`heading_chain`），回答时能告诉用户"根据第3章…"，可信度大增。

### 实操

```python
# rag_build.py —— 第1阶段：解析 + 分段
from markitdown import MarkItDown
import re, sqlite3

md = MarkItDown()

def parse(path):
    """任意格式文档 → 纯文本（保留 Markdown 标题结构）"""
    return md.convert(path).text_content

def chunk(text, size=512, overlap=64, min_chunk=100):
    """滑窗分段：按段落累积，超长就切，保留 overlap"""
    paras = re.split(r"\n\s*\n", text)   # 按空行切段落
    chunks, buf, heading = [], "", ""
    for p in paras:
        p = p.strip()
        if not p:
            continue
        m = re.match(r"^(#{1,4})\s+(.+)", p)   # 识别 Markdown 标题
        if m:
            heading = m.group(2).strip()[:120]
        if buf and len(buf) + len(p) > size:
            chunks.append({"text": buf.strip(), "heading": heading})
            buf = buf[-overlap:] + "\n\n" + p    # 关键：保留尾部 overlap
        else:
            buf = (buf + "\n\n" + p) if buf else p
    if buf.strip() and len(buf) >= min_chunk:
        chunks.append({"text": buf.strip(), "heading": heading})
    return chunks

# 建库
conn = sqlite3.connect("rag.db")
conn.execute("""CREATE TABLE IF NOT EXISTS chunks(
    id INTEGER PRIMARY KEY,
    source TEXT,          -- 来自哪个文件
    heading TEXT,         -- 属于哪个标题
    text TEXT             -- 卡片正文
)""")

# 灌一份文档进去
raw = parse("docs/技术规范.md")
for c in chunk(raw):
    conn.execute("INSERT INTO chunks(source,heading,text) VALUES(?,?,?)",
                 ("技术规范.md", c["heading"], c["text"]))
conn.commit()
print("切出", len(chunk(raw)), "张卡片")
```

### 验证

```python
for row in conn.execute("SELECT id, source, heading, substr(text,1,40) FROM chunks LIMIT 5"):
    print(row)
```
能看到一行行卡片，每张带来源和标题，就对了。

> 📌 **你现在拥有什么**：一个能读各种文档、并切成知识卡片存进 SQLite 的管线。**但现在还搜不了**——因为我们只是存了文字，还没让机器"理解"内容。下一阶段解决。

---

## 第 2 阶段：让文档能被"理解"——嵌入与向量检索

### 科普：什么是"向量"？为什么它能按"意思"找？

**向量就是把一段文字变成一串数字（比如 768 个小数）。** 妙处在于：**意思相近的文字，变出来的数字也相近。**

- "显卡" → [0.12, -0.33, 0.87, ...]
- "GPU"  → [0.11, -0.31, 0.85, ...]   ← 和上面很接近！
- "报销流程" → [-0.5, 0.2, -0.1, ...]  ← 和上面差很远

这个"文字→数字串"的转换由**嵌入模型（embedding model）**完成。转换好之后，"按意思找"就变成了"在数字空间里找最近的邻居"——也就是**向量检索**。

**为什么不能挨个比对（暴力搜索）？** 几万张卡片还行，上百万张就慢死了。所以用 **ANN**（近似最近邻）算法，牺牲一点点精度换几百倍速度。我们用 `sqlite-vec`，它是个 SQLite 扩展，让向量检索和普通 SQL 一样用，零额外服务。

### 实操

```python
# rag_build.py —— 第2阶段：嵌入 + 向量库
import sqlite_vec, json
from fastembed import TextEmbedding

# 关键：限 2 核！不限的话 ONNX 会吃满整机 CPU
model = TextEmbedding("jinaai/jina-embeddings-v2-base-zh", threads=2)

# 给数据库加上向量检索能力
conn.enable_load_extension(True)
sqlite_vec.load(conn)
conn.enable_load_extension(False)
conn.execute("CREATE VIRTUAL TABLE IF NOT EXISTS chunks_vec USING vec0(embedding float[768])")

# 把第1阶段存的每张卡片，算向量、存进向量库
rows = conn.execute("SELECT id, text FROM chunks WHERE id NOT IN (SELECT rowid FROM chunks_vec)").fetchall()
for cid, text in rows:
    vec = list(model.embed([text]))[0]   # 768 维
    conn.execute("INSERT INTO chunks_vec(rowid, embedding) VALUES(?,?)",
                 (cid, json.dumps(vec)))
conn.commit()

# —— 查询：语义搜索 ——
def search_vec(query, k=5):
    qvec = list(model.embed([query]))[0]
    return conn.execute("""
        SELECT c.id, c.source, c.heading, c.text, vec.distance
        FROM chunks_vec vec
        JOIN chunks c ON vec.rowid = c.id
        WHERE embedding MATCH ? AND k = ?
        ORDER BY vec.distance
    """, (json.dumps(qvec), k)).fetchall()

# 试试：用"显卡"搜出写"GPU"的卡片
for r in search_vec("怎么升级显卡"):
    print(r[1], "|", r[3][:50])
```

### 验证

故意用文档里**没出现过**的同义词去搜（比如文档写"GPU"，你搜"显卡"），如果还能搜到那张卡片——语义检索生效了。

> ⚠️ **救命坑**：`TextEmbedding(..., threads=2)` 这个 `threads=2` **千万别漏**。fastembed/onnxruntime 默认吃满所有 CPU 核 + 自旋空转，批量嵌入时能把机器卡死甚至触发重启。此外要在 import onnxruntime 前设 `OMP_WAIT_POLICY=PASSIVE`。

> 📌 **你现在拥有什么**：一个**懂语义的搜索引擎**——输入意思相近的词也能找到。**这已经是"最小 RAG"的核心了**，很多玩具 RAG 到这就结束了。但它有两个明显短板，我们继续补。

---

## 第 3 阶段：补上"字面"这一刀——关键词检索（FTS5 + BM25）

### 科普：为什么光有向量还不够？

向量检索的弱点：**精确的东西它反而搜不准。**
- 搜错误码 `0xD1`、IP `192.168.1.1`、型号 `RTX-4090`、函数名 `AuthService.login`——这些"字面精确"的东西，向量会给你一堆"语义相近但不对"的结果。
- 搜错别字、缩写，向量也容易飘。

所以需要**关键词检索**兜底——传统的"按字眼找"。它用的是 **BM25 算法**（信息检索的经典， Elasticsearch 也在用）：本质是"出现频率高 + 罕见词权重高 + 文档短权重高"的综合打分。不用自己实现，SQLite 的 **FTS5** 全文索引内置了 BM25。

**中文有个坑**：FTS5 默认分词器对中文很差（按字切）。要用 `trigram`（按 3 字符滑窗），中文召回才好。对短词、纯数字，再叠一个 LIKE 模糊兜底。

### 实操

```python
# rag_build.py —— 第3阶段：关键词索引
# 建 FTS5 虚拟表（trigram 分词）
conn.execute("CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(text, tokenize='trigram')")

# 把已有卡片同步进 FTS5
for cid, text in conn.execute("SELECT id, text FROM chunks").fetchall():
    conn.execute("INSERT INTO chunks_fts(rowid, text) VALUES(?,?)", (cid, text))
conn.commit()

def search_kw(query, k=10):
    # 路径A：FTS5 + BM25
    fts = conn.execute("""
        SELECT c.id, c.source, c.text
        FROM chunks_fts f JOIN chunks c ON f.rowid = c.id
        WHERE chunks_fts MATCH ? ORDER BY rank LIMIT ?
    """, (query, k)).fetchall()
    if fts:
        return [(r[0], r[2]) for r in fts]
    # 路径B：LIKE 兜底（FTS5 对纯数字/短词弱）
    like = conn.execute("""
        SELECT id, text FROM chunks WHERE text LIKE ? LIMIT ?
    """, (f"%{query}%", k)).fetchall()
    return [(r[0], r[1]) for r in like]

# 试试：搜精确型号，对比向量检索
print(search_kw("RTX-4090"))
```

### 验证

搜一个精确型号或错误码，看关键词检索是不是精准命中（向量检索这时多半会飘）。

> 📌 **你现在拥有什么**：两套检索能力——**向量（懂语义）+ 关键词（懂字面）**。问题来了：同一个问题，两套各给一个排序，怎么合并成一个最终结果？下一阶段解决。

---

## 第 4 阶段：两路合一——RRF 融合（核心中的核心）

### 科普：为什么不直接加权？什么是 RRF？

最直觉的合并方法是"加权打分"——向量分 × 0.6 + 关键词分 × 0.4。**但这有个致命问题：两边的分数量纲完全不一样。** 向量是 0~1 的相似度，关键词是 BM25 分数（可正可负、跨度大）。拿它们相加，就像"把温度（摄氏度）和价格（元）加在一起"——毫无意义。

**RRF（Reciprocal Rank Fusion，倒数排名融合）换了个聪明的思路：不看分数，只看排名。**

公式很简单：`最终分 = Σ 1/(60 + 在该路里的排名)`。
- 一张卡片在向量检索里排第 1 → 贡献 `1/61`
- 同一张卡片在关键词检索里也排第 3 → 又贡献 `1/63`
- 两路都命中的卡片，分数累加，自然排到最前面——这就是"**多路共识 = 高可信**"。

**为什么这个 k=60？** 业界经验值，平滑用，让排名靠后的也有机会。固定它就行，不用调。

**RRF 的杀手锏**：以后你加任何一路（实体、图、代码…），都不用重新调权重，直接往里加。这就是"民主融合"。

### 实操

```python
# rag_build.py —— 第4阶段：RRF 融合
def search_rrf(query, k=5):
    vec_hits = search_vec(query, k=30)       # 向量路出 30 条
    kw_hits  = search_kw(query, k=30)        # 关键词路出 30 条

    RRF_K = 60
    scores = {}   # {card_id: 累积分}
    for rank, row in enumerate(vec_hits):
        scores[row[0]] = scores.get(row[0], 0) + 1.0 / (RRF_K + rank + 1)
    for rank, (cid, _) in enumerate(kw_hits):
        scores[cid] = scores.get(cid, 0) + 1.0 / (RRF_K + rank + 1)

    ranked = sorted(scores, key=scores.get, reverse=True)[:k]
    return [(cid, scores[cid]) for cid in ranked]

for cid, score in search_rrf("怎么升级显卡"):
    text = conn.execute("SELECT text FROM chunks WHERE id=?", (cid,)).fetchone()[0]
    print(f"{score:.4f}  {text[:60]}")
```

### 验证

找一个"既有语义相关、又有字面相关"的问题，看融合后排第一的是不是最该排第一的。注意观察：**两路都命中的卡片，分数明显比单路命中的高**——这就是共识在起作用。

> 📌 **你现在拥有什么**：一个**双路融合检索器**。到这里，你已经有一个**能用的 RAG 了**——把 `search_rrf` 的结果拼进 prompt 喂给大模型，就能问答。但还能更准，下一步做精排。

---

## 第 5 阶段：让答案更准——Reranker 精排

### 科普：粗排和精排有什么区别？

到此为止的检索都是"**粗排**"——从几十万张卡片里快速捞回二三十张。粗排要快，所以用**双塔模型**（query 和卡片各自算向量，再比距离），快但糙。

但二三十张里最终只给大模型 5 张，这 5 张的**顺序极其重要**（大模型对排第一的最敏感）。所以需要**精排（rerank）**：用更强的**交叉编码器**（把 query 和每张卡片拼一起，整体过一遍模型，判断这对 query-card 到底有多相关），慢但准。

> 比喻：粗排是"图书管理员快速挑出 30 本大概相关的书"，精排是"他再一本本翻，挑出最该先看的 5 本"。

**选型**：`bge-reranker-v2-m3`（多语、中文好）。可以通过 SiliconFlow API 调，也可以本地 GPU 部署。

**一个反直觉的设计**：reranker **不是每次都该用**。当问题里全是精确型号/错误码时（关键词信号强），RRF 已经很准，reranker 反而可能把精确命中压下去。所以**只在关键词信号弱时（自然语言长句）才介入**。

### 实操

```python
# rag_build.py —— 第5阶段：Reranker
import requests

RERANK_URL = "https://api.siliconflow.cn/v1/rerank"
API_KEY = "你的key"   # 生产建议本地 GPU 部署，不走云 API

def rerank(query, candidates, top_k=5):
    """candidates: [(card_id, text), ...]"""
    if len(candidates) <= top_k:
        return candidates
    docs = [c[1][:500] for c in candidates]   # 每张卡片截 500 字
    resp = requests.post(RERANK_URL,
        headers={"Authorization": f"Bearer {API_KEY}"},
        json={"model": "BAAI/bge-reranker-v2-m3",
              "query": query, "documents": docs, "top_n": top_k}, timeout=15)
    results = resp.json()["results"]
    return [candidates[r["index"]] for r in results]

def search_final(query, k=5):
    rrf = search_rrf(query, k=30)
    cands = [(cid, conn.execute("SELECT text FROM chunks WHERE id=?", (cid,)).fetchone()[0])
             for cid, _ in rrf]
    # 关键词信号弱时才 rerank（这里简化：候选多于 k 就 rerank）
    return rerank(query, cands, top_k=k) if len(cands) > k else cands
```

### 验证

对比 `search_rrf` 和 `search_final` 的 top-1，看精排后是不是更贴 query 的真实意图。

> ⚠️ **性能坑**：reranker 在**查询热路径上同步阻塞**，是性能第一杀手。生产**必须本地 GPU 部署**，别走云 API（又慢又贵又依赖外网）。

---

## 🏁 里程碑：你已经有一个"基础完整版 RAG"了

走到这里，回顾一下你搭出的管线：

```
文档 → 解析(markitdown) → 分段(滑窗+heading) → 嵌入(jina ONNX)
                                                         ↓
                                          ┌── 向量检索(sqlite-vec) ──┐
                                          │                          ├──► RRF融合 ──► Reranker(bge) ──► top-5
                                          └── 关键词(FTS5+BM25) ─────┘
```

**这套东西，80% 的企业文档场景已经够用了。** 把 `search_final` 的结果塞进 prompt：

```python
def answer(query):
    hits = search_final(query, k=5)
    context = "\n\n".join([f"[来源:{i}] {t}" for i, t in enumerate(hits)])
    prompt = f"根据以下资料回答问题。\n\n{context}\n\n问题：{query}"
    # 问答 LLM 要强：Qwen2.5-72B / DeepSeek-V3 / GLM-4.6（7B 太弱，别用！）
    return call_llm(prompt)
```

多数团队**到此为止就行**。后面几阶段是"锦上添花"和"企业级硬化"，按需取舍。

> 💡 **性能预期**（单机）：10 万张卡片，单次检索 100~300ms（含 rerank），QPS 几十。够中小公司全员用了。

---

## 第 6 阶段：让用户问得再差也能搜到——查询改写

### 先认清：RAG 里有"两类 LLM"，别用错（极易踩的坑）

从这一阶段起，要在检索管线里引入 LLM 了。**先讲清一个绝大多数人会搞混的点：一个 RAG 系统里的 LLM 分两个角色，对模型强度的要求天差地别。**

| 角色 | 干什么 | 调用频率 | 要求 | 选型 |
|---|---|---|---|---|
| **辅助 LLM** | query 改写、实体/事件抽取、摘要、打分 | 高频，每次检索可能都调 | 快、便宜、够用即可 | **Qwen2.5-7B** 这类轻量模型 |
| **问答 LLM** | 基于检索到的资料，**最终回答用户** | 每次问答一次 | **强**、长文理解好、别幻觉 | **Qwen2.5-72B / DeepSeek-V3 / GLM-4.6** 起步，或 Claude / GPT-4 级 |

> ⚠️ **最常见的选型翻车**：拿 7B 小模型当问答 LLM。它在"基于几千字资料精确作答"上明显力不从心——会漏信息、会跑偏、复杂推理直接垮。**7B 只配干改写/抽取这种结构化轻活；最终回答必须上强模型。** 这是本项目最容易踩的坑之一，别省这个钱。

下面这一阶段用到的 LLM（query 改写）属于**辅助 LLM**，用 Qwen2.5-7B 正合适。

### 科普：为什么用户的问题经常搜不到？

用户不会像文档那样"字正腔圆"地提问。文档写"数据库连接池配置"，用户可能问"连不上数据库咋办"——意思一样，字面差很远。即便有语义检索，单次 query 也容易召回不全。

**解法：multi-query（多查询改写）。** 让 LLM 把用户的问题，改写成 3~5 个"说法不同、意思一样"的变体，每个变体各搜一次，结果再融合。相当于"换几个角度问图书管理员"。

### 实操

```python
def expand_query(query, n=3):
    """LLM 把 query 改写成 n 个变体"""
    prompt = f"把下面这个搜索问题改写成{n}个语义相同但措辞不同的变体，只输出JSON数组：\n{query}"
    resp = requests.post("https://api.siliconflow.cn/v1/chat/completions",
        headers={"Authorization": f"Bearer {API_KEY}"},
        json={"model": "Qwen/Qwen2.5-7B-Instruct",
              "messages": [{"role":"user","content":prompt}],
              "temperature": 0.7, "max_tokens": 200}, timeout=15)
    import json
    content = resp.json()["choices"][0]["message"]["content"]
    return json.loads(content[content.find("["):content.rfind("]")+1])

def search_multiquery(query, k=5):
    variants = [query] + expand_query(query)   # 原query + 变体
    all_scores = {}
    for v in variants:
        for cid, score in search_rrf(v, k=30):
            all_scores[cid] = max(all_scores.get(cid, 0), score)   # 取最高分
    top = sorted(all_scores, key=all_scores.get, reverse=True)[:30]
    # 再 rerank
    return rerank(query, [(c, get_text(c)) for c in top], top_k=k)
```

> 📌 **坑**：multi-query 是额外 LLM 调用，增加延迟。建议只在**首轮召回不足**或**长自然语言问题**时触发，短关键词查询直接走 RRF。

---

## 第 7 阶段：工程化——让"持续灌库"不翻车（企业级的分水岭）

### 科普：为什么这一段最关键？

前面 6 阶段搭的是"**能用的 RAG**"。但企业场景是**会一直往里加新文档的**——每周都有新规范、新手册、新会议纪要涌进来。如果不做工程化，知识库会越灌越烂：

- 同一份文档重传一次 → 数据翻倍
- 文档改了 → 旧版本还在，召回出"已废止"的内容（幽灵召回）
- 灌库时算嵌入 → 卡住整个系统几分钟
- 多个项目混在一起 → A 项目机密漏到 B 项目
- 某个依赖挂了 → 系统装作"没搜到"，大模型直接幻觉

这一段是"**玩具**"和"**企业级**"的真正分水岭。**每一条都来自血泪坑。**

### 实操（6 个要点，逐个上）

**① 幂等 + 内容哈希去重**（重灌不翻倍）
```python
import hashlib
def content_hash(source, text):
    return hashlib.md5(f"{source}|{text}".encode()).hexdigest()

# 灌库前先查哈希，已存在就跳过；用 INSERT OR REPLACE 幂等
conn.execute("""CREATE TABLE IF NOT EXISTS chunk_hash(hash TEXT PRIMARY KEY, chunk_id INTEGER)""")
h = content_hash("技术规范.md", card_text)
exists = conn.execute("SELECT 1 FROM chunk_hash WHERE hash=?", (h,)).fetchone()
if not exists:
    cid = insert_chunk(...)
    conn.execute("INSERT OR REPLACE INTO chunk_hash(hash,chunk_id) VALUES(?,?)", (h, cid))
```

**② 变更同步**（文档更新后，旧 chunk 失效）——以文档为单位记录它的所有 chunk_id，重灌时先删旧再插新：
```python
def reingest_doc(path):
    # 删该文档的所有旧痕迹（chunk + 向量 + FTS5 + 哈希）
    old_ids = [r[0] for r in conn.execute("SELECT id FROM chunks WHERE source=?", (path,)).fetchall()]
    for cid in old_ids:
        conn.execute("DELETE FROM chunks_vec WHERE rowid=?", (cid,))
        conn.execute("DELETE FROM chunks_fts WHERE rowid=?", (cid,))
    conn.execute("DELETE FROM chunks WHERE source=?", (path,))
    conn.execute("DELETE FROM chunk_hash WHERE chunk_id IN (%s)" % ",".join(map(str,old_ids or [0])))
    # 再重新灌
    ingest(path)
```

**③ 异步嵌入队列**（灌库不卡）——文档先落库 + 进队列，后台 worker 慢慢算嵌入：
```python
conn.execute("""CREATE TABLE IF NOT EXISTS embed_queue(
    id INTEGER PRIMARY KEY, chunk_id INTEGER, status TEXT DEFAULT 'pending')""")
# 灌库时：INSERT chunks + INSERT embed_queue（pending）
# 后台 worker：轮询 pending → 算嵌入 → 写 chunks_vec → status='done'
```

**④ 嵌入服务单例化 + 缓存**（省内存、重复文本零开销）——整个系统只一个进程加载 325MB 的嵌入模型，其他进程 HTTP 调它；重复文本命中缓存跳过推理：
```python
# embed_cache: {md5(text): vector}
cache = json.load(open("embed_cache.json"))
def embed_cached(text):
    key = hashlib.md5(text.encode()).hexdigest()
    if key in cache: return cache[key]   # 命中：>1000x 加速
    vec = list(model.embed([text]))[0]
    cache[key] = vec
    return vec
```

**⑤ 多租户隔离**（项目不串味）——所有表带 `project` 字段，查询全程过滤：
```python
conn.execute("ALTER TABLE chunks ADD COLUMN project TEXT DEFAULT ''")
# 查询时：WHERE project = ?
```

**⑥ 降级语义 + 可观测**（防幻觉，最重要的一条）——**区分"系统挂了"和"确实没有"**：
```python
def search(query):
    try:
        vec_hits = search_vec(query)
    except Exception:
        vec_hits = []
        vec_down = True   # 标记：向量路挂了
    # ...
    return {
        "results": ranked,
        "unavailable": ["vector"] if vec_down else []   # 告诉调用方哪路挂了
    }
# 关键铁律：绝不能在某一路挂了时 return [] 然后装作"查过了没有"
# 那样大模型会以为没资料，直接幻觉。挂了就必须标记 unavailable。
```

> 📌 **你现在拥有什么**：一个**经得起持续灌库、不会越用越烂、挂了也不幻觉**的企业级 RAG。这才是"非常好用"的门槛。

---

## 第 8 阶段：进阶——图结构补盲（实体图 / 事件图 / 代码图）

### 科普：为什么 80% 够了，但剩 20% 必须靠"图"？

到此为止的检索，本质都是"**单点匹配**"——找和 query 相关的卡片。但有一类问题它无能为力：**多跳推理**。

> 例子："上次调 GTX 1060 显存时改了哪个配置？"

用户没提"配置文件名"。向量/关键词都搜不到——因为答案是"通过一个事件（调显存）关联到另一个实体（config.yaml）"。这种**跨文档、跨实体的关联**，必须靠**图结构**来表达和检索。

有三种图，各管一段：

| 图 | 解决什么 | 典型问题 |
|---|---|---|
| **实体图** | 单跳关系 | "GTX 1060"这种实体，字面/语义都弱，图把它锚定 |
| **事件图** | 多文档多跳 | "A 规范的接口，在 B 文档怎么用？" |
| **代码图** | 代码结构 | "谁调用了 AuthService.login()？"（软件企业重点） |

**重要**：纯文本、单文档、实体稀疏的语料（法规、论文）——三种图都不要，过度设计。**实体密集 / 多文档 / 有代码**才加。

### 8.1 代码图（软件企业优先做，三种图里确定性最强）⭐

**科普：软件企业为什么最需要代码图**

软件公司除了文档，最大的一块知识资产是**代码本身**——API 定义、SDK、内部脚手架、核心服务。而围绕代码的问题，向量/关键词检索几乎都搜不准：

- "谁调用了 `AuthService.login()`？"——字面要在全库扫 `.login(`，语义会飘到"登录""认证"。
- "改了这个函数会影响哪些地方？"——这是"影响面分析"，纯文本检索根本做不了。
- "`PaymentClient` 这个类定义在哪、有哪些方法？"——要的是**结构**，不是某段文字。

代码的本质是**结构**（谁定义、谁调用、谁继承），不是文字。把这些结构用 **AST（抽象语法树）** 解析出来建成图——节点是函数/类/方法，边是调用/定义/继承——然后"谁调用谁"就是图上一跳的事，精准、零歧义。

**关键优势：确定性、零幻觉。** tree-sitter 解析 AST 是 100% 确定的（语法就是这样，没有主观判断），不像实体图/事件图要靠 LLM "猜"实体和事件（会抽错、会漏）。所以**代码图是三种图里投入产出比最高、最该先做的**——尤其对软件企业。

**tree-sitter 是什么**：开源的增量式语法解析库，几乎覆盖所有主流语言（Python / JS/TS / Java / Go / Rust / C/C++ / C# …）。GitHub、Neovim 的代码高亮都在用它。

**建什么图**：
- 节点：函数、类、方法、接口、变量（带文件位置 + 签名）
- 边：`calls`（A 调用 B）、`defines`（文件定义符号）、`inherits`（继承）

**实操思路**：

```python
# 最小示意：用 tree-sitter 抽 Python 文件里的函数定义和调用关系
from tree_sitter import Parser
from tree_sitter_python import language   # pip install tree-sitter tree-sitter-python

parser = Parser()
parser.set_language(language())

def extract(code):
    tree = parser.parse(code.encode())
    defs, calls = [], []
    def walk(node):
        if node.type == "function_definition":
            name = node.child_by_field_name("name").text.decode()
            defs.append(name)
        elif node.type == "call":
            fn = node.child_by_field_name("function")
            if fn: calls.append(fn.text.decode())
        for c in node.children: walk(c)
    walk(tree.root_node)
    return defs, calls
# 生产：扫整个代码库 → 把每个文件的 defs/calls 存进符号图（边 = "文件A 定义 f" / "函数g 调用 f"）
# 查询："谁调用了 login？" = 图上找所有指向 login 节点的 calls 边，一跳到位
```

> 💡 **省事方案**：自己用 tree-sitter 写全语言、全边类型工作量大。生产直接用现成索引工具——**codegraph**（轻量自建）、**SCIP / LSIF**（Sourcegraph 的代码索引标准，精度最高）、或 **ctags**（最简单，只管符号定义位置）。它们都自带多语言支持和符号图。

**验证**：问"谁调用了 `login`"，代码图能精准列出所有调用点（文件 + 行号）。对比一下纯向量检索——向量会给你一堆"提到登录"的文档，根本不是调用点。差距一目了然。

> 📌 **你现在拥有什么**：代码库也进了 RAG 检索范围，"代码结构类问题"（调用关系、影响面、定义位置）能精准命中。对软件企业，这一步让 RAG 从"只能查文档"升级成"**文档 + 代码都能查**"，是质变。

### 8.2 实体图（单跳关系，LLM 抽取）

**科普**：把文档里的实体（产品名 / 术语 / 接口名 / 人名）抽出来建成图，检索时命中实体给 ×1.3 boost。解决 "GTX 1060""AuthService.login()" 这种实体——字面要完全匹配、语义会飘，图把它们锚定成第一公民。

**实操思路**：让**辅助 LLM**（Qwen2.5-7B 即可）从每张卡片抽实体，存 `entities` + `entity_links` 表，检索时单跳匹配并加权。

> ⚠️ **坑**：实体名对齐——规则抽的实体名（如 md5 哈希）和 LLM 抽的多词实体名（如 "GTX 1060"）可能对不上，导致图通道失效。**实体匹配必须加 LIKE 模糊**，不能只精确等值。

### 8.3 事件图（多文档多跳，最复杂）

**科普**：抽"事件 / 事务"（场景 + 实体 + 动作），建事件↔实体图，检索时从 query 实体出发 BFS 多跳。解决多跳推理——"上次调 GTX 1060 显存时改了哪个配置？"，从"GTX 1060"实体 →"调显存"事件 → 关联的"config.yaml"文档，多跳捞回。**这是向量 / 关键词永远做不到的。**

**实操思路**：辅助 LLM 抽事件三元组，存 `events` + `event_links`，检索时 BFS 多跳召回。

> ⚠️ **坑**：高频实体（如通用词 "Python"）会链接海量节点，BFS 会爆炸。必须设硬上限（seed 数 ≤20、每跳节点数 ≤50、最大跳数 2~3）。

### 三种图怎么做、什么顺序

- **软件企业**：**代码图优先**（确定性、零幻觉、立竿见影），这是你的主战场。
- 实体密集型文档（产品手册、API 文档）：加**实体图**。
- 有明确"多文档多跳问答"需求才上**事件图**（最复杂、最重）。
- 纯文本 / 单文档 / 实体稀疏（法规、论文）：三种都不要，过度设计。

> 选型速查见附录 A。结论级洞察：**加结构（图）比换更强的 embedding 更值。**

---

## 第 9 阶段：规模化——从单机到企业级（L1 → L2 → L3）

### 科普：什么时候 SQLite 不够用？

SQLite 是单文件、单机、读多写串行。团队小、文档几十万以内——完全够。但出现这些信号就要升级：
- 写并发卡顿（多人同时灌库）
- 向量过百万，sqlite-vec 的 ANN 变慢
- 多地机房、要跨节点检索

### 三档演进

| 档 | 规模 | 存储 | GPU | 怎么升级 |
|---|---|---|---|---|
| **L1**（你现在） | <100人, <10万chunk | SQLite + sqlite-vec | 1×4090/A10 | 就是前面搭的这套 |
| **L2** | 100-1000人, 百万chunk | **postgres + pgvector** | 2-3×A100 | 把 SQLite 换 postgres，向量换 pgvector，检索服务无状态化水平扩展 |
| **L3** | >1000人, >百万 | pg集群 + Milvus/Qdrant + Neo4j | GPU集群 | 专用向量库 + 图库 + 多机联邦（query 广播到多节点，二次 RRF） |

**升级路径平滑**：因为前面用了标准 SQL + RRF，换底层数据库主要是改连接串和少量 SQL，架构不动。

> 📌 **核心三招**：①检索引擎无状态化（状态进 postgres）水平扩展 ②重计算（嵌入/重排/抽取）抽成独立 GPU 服务 ③SQLite 换 postgres 是企业级第一硬门槛。

---

## 附录 A：选型速查表（指名道姓）

> 主选型 = 实战在用、踩过坑验证过的；备选 = 同类主流方案，按需替换。

| 模块 | 主选型（实战） | 同类备选 |
|------|---------------|---------|
| 文档解析 | **markitdown**（PDF/Word/PPT/Excel/HTML→MD） | Unstructured、docling、PyMuPDF、pypdf |
| 分段 | 自写滑窗 512+overlap 64+heading | LangChain `RecursiveCharacterTextSplitter`、LlamaIndex `SentenceSplitter`、semantic-chunker |
| 嵌入模型 | **`jinaai/jina-embeddings-v2-base-zh`**（768 维） | `bge-m3`、`multilingual-e5-large`、`Qwen3-Embedding-8B`、Cohere/OpenAI |
| 嵌入推理 | **fastembed+onnxruntime**（限 2 核+PASSIVE），三层 fallback | HF TEI、Infinity、vLLM、Ollama |
| 向量库 | **sqlite-vec**（百万内） | **pgvector**、Milvus、Qdrant、Chroma、LanceDB、FAISS |
| 关键词 | **SQLite FTS5**（trigram+BM25）+ LIKE | Elasticsearch/OpenSearch、Meilisearch、Tantivy |
| 融合 | **RRF**（k=60） | 加权融合、`ranx` |
| Reranker | **`BAAI/bge-reranker-v2-m3`** | jina-reranker-v2、Qwen3-Reranker、Cohere |
| 查询改写 | **Qwen2.5-7B** multi-query | HyDE、Step-Back、DeepSeek、本地 Llama |
| 实体抽取 | **LLM 抽**+规则兜底（LIKE 对齐） | spaCy NER、GLiNER、HanLP |
| 知识图/事件图 | LLM 抽三元组自建 | 微软 **GraphRAG**、**LightRAG**、Neo4j |
| 代码图 | **tree-sitter** | SCIP/LSIF、Sourcegraph |
| 异步队列 | SQLite 任务表+worker | Celery、RQ、Dramatiq、Arq |
| 主数据库 | **SQLite** → **postgres+pgvector** | DuckDB |
| LLM（**问答**，要强） | **Qwen2.5-72B / DeepSeek-V3 / GLM-4.6**（本地 vLLM） | Qwen3-235B、Llama3-70B、Claude / GPT-4（API） |
| LLM（**辅助**：改写/抽取，轻量够用） | **Qwen2.5-7B-Instruct** | Qwen3-8B、GLM-4-9B |
| RAG 外壳 | **FastGPT**（外部知识库HTTP解耦） | Dify、RAGFlow、AnythingLLM、Langflow |

---

## 附录 B：踩坑清单（血泪换来的 12 条）

1. **`return []` 是幻觉入口**——某一路挂了要标记 unavailable，绝不能装作"没搜到"。
2. **嵌入占写入九成时间**——别在数据库上瞎优化，先做幂等去重 + 单例 + 缓存 + 异步。
3. **ONNX 必须限 2 核 + `OMP_WAIT_POLICY=PASSIVE`**——不限会跑满整机甚至重启。
4. **vec0 维度建表固定**——改维度要全库 DROP+CREATE，不能 ALTER；且全库维度统一，不补零混存。
5. **FTS5 对短中文/纯数字弱**——必须 LIKE 兜底；中文必须用 trigram 分词。
6. **实体名匹配要 LIKE 模糊**——否则规则抽的和 LLM 抽的对不上，图通道失效。
7. **reranker 不是越多越好**——关键词强时保留 RRF 原序；生产必须本地 GPU。
8. **多服务别各加载一份嵌入模型**——单例化（HTTP 服务+客户端）省 N 份内存。
9. **重灌必须幂等 + 变更同步**——纯 INSERT 会翻倍，文档更新不级联清理会有幽灵召回。
10. **加图比换更强 embedding 值**——但只在实体密集/多跳/有代码场景，纯文本别过度设计。
11. **维度全库统一**——不同空间 cosine 无效。
12. **LLM/embedding 企业私有化**——云 API 是隐形瓶颈 + 合规雷（知识外泄）。

---

## 附录 C：高频问答

**Q：为什么不用 FAISS？** —— sqlite-vec 和业务数据同库零运维，百万级内够用，一个 .db 文件易备份。FAISS 要独立服务，中小规模不值。>百万向量才换。

**Q：BM25 必须吗？要自己实现吗？** —— 必须有，但**别自己写**。SQLite FTS5 内置 BM25，`ORDER BY rank` 就是，零部署。

**Q：嵌入用云 API 还是本地 ONNX？** —— 生产用本地 ONNX（零网络、数据不出本机、稳定）。云 API 留作 fallback。**必须有三层 fallback**：API→ONNX→MD5，任一层挂不崩。

**Q：reranker 用什么？** —— bge-reranker-v2-m3。只在关键词弱时介入，关键词强时保留 RRF 原序。生产本地 GPU。

**Q：为什么用 RRF 不加权？** —— 多路分数不可比（cosine vs BM25 vs 跳数），加权=炼丹。RRF 只用排名，加路零成本。

**Q：要不要知识图谱？** —— 纯单文档/实体稀疏（法规论文）不要；实体密集/多文档多跳/有代码才加。

**Q：中文怎么搞？** —— 三件套：①嵌入选中文模型（jina-zh）②FTS5 用 trigram ③短词/数字 LIKE 兜底。

**Q：起步用什么库？** —— 单文件 SQLite（+sqlite-vec+FTS5），零运维。别一上来就 ES+Milvus+Neo4j 全家桶。

---

## 一句话总结

**完善的企业文档 RAG = N 个相关性维度的民主融合（RRF）+ 一层精排（reranker）+ 一套图结构补盲（实体/事件/代码图）+ 持续灌库工程（幂等/去重/变更同步/异步）+ 降级可观测。** 实战栈：markitdown + 自写分段 + jina-v2-base-zh(fastembed ONNX) + sqlite-vec + FTS5(trigram) + RRF(k=60) + bge-reranker-v2-m3 + Qwen2.5-7B(辅助改写/抽取) + 强问答LLM(Qwen2.5-72B/DeepSeek-V3) + tree-sitter + SQLite→postgres——全开源、单机起步、平滑演进到企业级。

**搭的顺序记一句话：先能读（解析分段）→ 再能懂（嵌入向量）→ 补字面（FTS5）→ 两路合（RRF）→ 精挑（reranker）→ 工程化（持续灌库）→ 上图（进阶）→ 上规模（L2/L3）。**

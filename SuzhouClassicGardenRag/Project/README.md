# 🏯 园林知识库多模态 RAG 系统

基于 **MinerU + LlamaIndex + Qdrant + Chinese-CLIP + DeepSeek** 的古典园林知识问答与图像识别系统。

---

## 目录

- [总体架构](#总体架构)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [数据流](#数据流)
- [安装与配置](#安装与配置)
- [使用指南](#使用指南)
- [模块说明](#模块说明)
- [增量更新机制](#增量更新机制)
- [图片搜索机制](#图片搜索机制)
- [常见问题](#常见问题)

---

## 总体架构

```
┌──────────────────────────────────────────────────────────────────┐
│                        Resource/  (原始文档)                      │
│   PDF / EPUB / DJVU / MOBI  — 园林古籍、图集、规范、学术论文     │
└──────────────────────────┬───────────────────────────────────────┘
                           │ mineru -p ... -o converted/
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                       converted/  (MinerU 产出)                   │
│   ┌──────────────────┐    ┌──────────────────┐                   │
│   │  .md (全文Markdown) │    │ images/ (高精度图片) │              │
│   └────────┬─────────┘    └────────┬─────────┘                   │
└────────────┼───────────────────────┼─────────────────────────────┘
             │                       │
             ▼                       ▼
┌─────────────────────┐  ┌──────────────────────────┐
│  BGE-Large-ZH       │  │  Chinese-CLIP ViT-B/16   │
│  文本向量 (1024维)   │  │  图片向量 (512维)         │
└────────┬────────────┘  └───────────┬──────────────┘
         │                           │
         ▼                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                  Qdrant (本地持久化)                              │
│  ┌──────────────────────────────┐  ┌──────────────────────────┐  │
│  │  garden_knowledge (文本集合)   │  │  garden_images (图片集合) │  │
│  │  BGE 1024d 向量              │  │  CLIP 512d 向量          │  │
│  │  payload: source, text       │  │  payload: caption,       │  │
│  │                             │  │   source_md, img_path    │  │
│  └──────────────────────────────┘  └──────────────────────────┘  │
└──────────────────────┬───────────────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
┌───────────────────┐   ┌──────────────────────────┐
│ 文字查询           │   │ 图片查询                  │
│ query "问题"      │   │ query -i 照片.jpg        │
│                   │   │                          │
│ BGE编码问题       │   │ CLIP编码照片              │
│ 搜text-dense      │   │ 搜image-dense             │
│                   │   │ 找到最匹配的原图            │
│ ↓                 │   │ ↓                         │
│ DeepSeek 综合回答  │   │ DeepSeek 文化+工艺解读     │
└───────────────────┘   └──────────────────────────┘
```

### 两个独立检索通道

| 通道 | Qdrant 集合 | 向量模型 | 维度 | 用途 |
|------|------------|----------|------|------|
| 文字 | `garden_knowledge` | BAAI/bge-large-zh-v1.5 | 1024 | 园林知识问答 |
| 图片 | `garden_images` | OFA-Sys/chinese-clip-vit-base-patch16 | 512 | 以图搜图 + 图案解读 |

---

## 技术栈

| 组件 | 选择 | 理由 |
|------|------|------|
| PDF 解析 | **MinerU** (hybrid-engine + mlx-engine) | 高精度图文分离，支持古籍、扫描件、复杂版式 |
| 文本向量 | **BAAI/bge-large-zh-v1.5** | 中文语义理解最优，1024 维 |
| 图片向量 | **Chinese-CLIP ViT-B/16** | 阿里巴巴开源，对中国传统纹样理解深 |
| 向量数据库 | **Qdrant** (本地文件模式) | 零运维，支持命名向量空间，性能好 |
| 大语言模型 | **DeepSeek Chat** | 价格低、中文好、推理能力强 |
| RAG 框架 | **LlamaIndex** | 成熟的文档拆分、索引、查询管线 |
| 硬件 | MacBook M 系列芯片 | MPS 加速，无风扇可运行 |

---

## 项目结构

```
Project/
├── run.sh                  # 便捷启动脚本
├── config.yaml             # 配置文件
├── requirements.txt        # 依赖清单
├── vendor/                 # 备选依赖包
│
├── src/
│   ├── __init__.py         # 包初始化 + vendor 路径管理
│   ├── config.py           # 配置加载（环境变量替换 + 路径解析）
│   ├── convert.py          # MinerU 文档转换
│   ├── images.py           # MinerU 图片提取（解析 md → 图片 + caption）
│   ├── indexer.py          # LlamaIndex 文本索引 + Chinese-CLIP 图片索引
│   ├── query.py            # 问答 CLI（文字 + 图片）
│   └── update.py           # 增量更新编排
│
├── converted/              # MinerU 输出目录
│   └── <文档名>/
│       └── hybrid_auto/
│           ├── <文档名>.md
│           └── images/
│
├── data/
│   ├── converted_hashes.json   # 转换追踪
│   ├── indexed_hashes.json     # 文本索引追踪
│   ├── image_hashes.json       # 图片索引追踪
│   └── qdrant/                 # Qdrant 持久化
│
└── Resource/                   # 原始文档（外部目录）
    ├── 苏州拙政园和网师园的理水艺术.pdf
    ├── 营造法原诠释.pdf
    └── ...
```

---

## 数据流

### 文字查询

```
用户输入 "拙政园理水有什么特点？"
    │
    ├─ 1. BGE 编码问题 → query_vector (1024d)
    ├─ 2. Qdrant 搜索 garden_knowledge(text-dense)
    ├─ 3. 返回 top-5 最相关文本片段
    ├─ 4. 拼接 system prompt + context
    └─ 5. DeepSeek 生成综合回答
```

### 图片查询

```
用户上传 花窗照片.jpg
    │
    ├─ 1. Chinese-CLIP 编码 → query_vector (512d)
    ├─ 2. Qdrant 搜索 garden_images(image-dense)
    ├─ 3. 返回匹配度 ≥ 0.70 的原图
    ├─ 4. 提取 payload: caption, 出处
    └─ 5. DeepSeek 解读文化寓意 + 工艺做法
```

---

## 安装与配置

### 前置条件

- macOS (Apple Silicon M 芯片)
- Conda 环境 `MinerU`（已安装 MinerU）
- DeepSeek API Key

### 修复 conda 环境

> ⚠️ 之前 pip 操作意外升级了 `huggingface-hub`，需要降级：

```bash
conda activate MinerU
pip install "huggingface-hub==0.36.2"
```

### 首次运行

```bash
# 1. 设置 API 密钥
export DEEPSEEK_API_KEY="你的deepseek密钥"

# 2. 全量转换 + 索引（含图片，耗时较长）
cd ~/SuzhouClassicGarden/Project
./run.sh update --full --with-images

# 3. 测试
./run.sh query "拙政园和网师园的理水艺术有什么特点？"
```

---

## 使用指南

### 常用命令

| 命令 | 说明 |
|------|------|
| `./run.sh update` | 增量转换 + 增量索引 |
| `./run.sh update --full` | 全量重建 |
| `./run.sh update --with-images` | 增量更新 + 图片索引 |
| `./run.sh update --full --with-images` | 全量重建 + 图片索引 |
| `./run.sh query "问题"` | 单次文字问答 |
| `./run.sh query` | 交互模式 |
| `./run.sh qi 照片.jpg "是什么图案？"` | 图片搜索 + 问答 |

### 交互模式

```
🏯  园林知识库 RAG 问答系统
   输入 'quit' 或 'exit' 退出
   输入 'sources' 查看上次检索的来源
   输入 'image:照片路径:问题' 进行图片检索

🔍 请输入问题: 拙政园理水有什么特点？
```

### 图片搜索快捷命令

```bash
# 只传照片，自动识别
./run.sh qi ~/Photo/地砖.jpg

# 传照片 + 具体问题
./run.sh qi ~/Photo/花窗.jpg "这个花窗叫什么名字？有什么寓意？"
```

---

## 模块说明

### `src/config.py` — 配置加载

- 读取 `config.yaml`
- 支持 `${DEEPSEEK_API_KEY}` 环境变量替换
- 自动将相对路径转为绝对路径

### `src/convert.py` — MinerU 转换

- 扫描 `Resource/` 目录下所有 PDF / EPUB / DJVU / MOBI 等文件
- 调用 `mineru` 命令逐个转换
- MD5 哈希追踪已转换文件（`converted_hashes.json`）
- 支持增量（`incremental=True`）和全量（`incremental=False`）
- **失败即停止**：任一文件转换失败立即退出并打印可读错误

### `src/images.py` — 图片提取

- 解析 MinerU 产出的 Markdown，正则匹配 `![](images/xxx.jpg)`
- 提取图片上方或下方的 caption（"图1 xxx"）
- 返回 `[(md源路径, 图片绝对路径, caption), ...]`

### `src/indexer.py` — 向量索引

**文字索引**（默认）：
- 使用 LlamaIndex `SentenceSplitter` 分块
- BGE 编码 → 存入 `garden_knowledge` 集合

**图片索引**（`--with-images`）：
- 加载 Chinese-CLIP 模型
- 逐批编码图片 → 存入 `garden_images` 集合（`image-dense` 512 维）
- payload 保存 caption、出处、本地路径

### `src/query.py` — 问答 CLI

- **文字查询**：LlamaIndex `query_engine` + 自定义 system prompt
- **图片查询**（`-i`）：CLIP 编码 → Qdrant 搜索 → DeepSeek 解读
- **匹配阈值**：0.70，低于阈值提示"未找到匹配"

### `src/update.py` — 编排脚本

组合 `convert.py` + `indexer.py`，一键执行完整流程。

---

## 增量更新机制

每次新增文档到 `Resource/` 后：

```bash
./run.sh update               # 仅转新文件 + 仅索引新文件
./run.sh update --with-images # 同上 + 索引新图片
```

追踪方式：
- **转换追踪** `converted_hashes.json`：记录每个原始文件的 MD5
- **文本索引追踪** `indexed_hashes.json`：记录每个 Markdown 的 MD5
- **图片索引追踪** `image_hashes.json`：记录每张图片的 MD5

文件未变化时自动跳过，不会重复处理。

---

## 图片搜索机制

```
Qdrant garden_images collection
┌─────────────────────────────────────────────┐
│ Point {                                    │
│   id: uuid,                                │
│   vector: {                                │
│     "image-dense": [CLIP 512维向量]         │
│   },                                       │
│   payload: {                               │
│     "caption": "图6-36 '鸳鸯戏荷'铺地",     │
│     "source_md": "converted/.../xxx.md",   │
│     "local_image_path": "converted/.../png"│
│   }                                        │
│ }                                          │
└─────────────────────────────────────────────┘
```

**查询流程**：
1. 用户上传照片 → Chinese-CLIP 编码（512 维）
2. Qdrant 搜索 `image-dense` 向量空间
3. 返回匹配度 ≥ 0.70 的 top-5 结果
4. 提取 payload 中的 caption 和出处
5. 构建 prompt → DeepSeek 生成深度解读

**为什么用 Chinese-CLIP 不是通用 CLIP？**
- 通用 CLIP 在中文纹样上表现差（训练数据以英文为主）
- Chinese-CLIP 在大规模中文图文对上训练，对"鸳鸯戏荷"、"冰裂纹"等传统纹样识别更准确

---

## 常见问题

### Q: MinerU 转换报错 `huggingface-hub` 版本冲突

运行：
```bash
conda activate MinerU
pip install "huggingface-hub==0.36.2"
```

### Q: 图片匹配度低怎么办？

在 `config.yaml` 中调低 `image.match_threshold`（默认 0.70）：

```yaml
image:
  match_threshold: 0.60   # 放宽到 0.60
```

### Q: 一次转换所有文档太久怎么办？

MinerU 每个文件约 1-2 分钟/10 页。建议：

1. 先跑纯文字版（`./run.sh update --full`，不转图片索引快很多）
2. 确认文字问答正常后，再加 `--with-images` 增量补图片索引

### Q: MacBook Air 无风扇发热问题？

图片索引时建议 `config.yaml` 中调小 `image.batch_size`，或者分几次跑。

---

## 许可证

本项目仅用于学习和研究目的。Resource 目录下的文档版权归原作者所有。

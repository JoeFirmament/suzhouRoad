# 🏯 姑苏九园 · 9yuan

苏州九座世界遗产古典园林的数字档案与知识问答平台。

![姑苏九园](9yuan.png)

> 以 **CBDB（中国历代人物传记资料库）** 为人物—关系底座，叠加园林档案与历史文献，实现「以人串园、以园见人」的多维数字呈现；配套多模态 RAG 知识库，支持对园林古籍图文内容的智能问答与图像检索。

---

## 📂 项目组成

本仓库包含两个子项目：

### 1. `Owner_ClassicGarden` — 姑苏九园 · 世界文化遗产数字档案

基于 CBDB 数据的单页可视化应用，覆盖拙政园、留园、网师园、环秀山庄、沧浪亭、狮子林、艺圃、耦园、退思园九座世遗园林。

- **历史叙事**：园主时间轴、园林—人物关系图谱（ECharts 力导向图）
- **空间地图**：九园定位与分布（Leaflet / 高德）
- **数据资产**：`data/` 下九园结构化档案（园主、厅堂、设计名家、世遗批次）、CBDB 人物子集、诗词子集、Wikipedia 词条
- **数据处理脚本**：`scripts/`（CBDB 子集提取、Wikipedia 抓取、园林诗词构建）

### 2. `SuzhouClassicGardenRag` — 园林知识库多模态 RAG 系统

基于 **MinerU + LlamaIndex + Qdrant + Chinese-CLIP + DeepSeek** 的古典园林知识问答与图像识别系统。

- **文档处理**：MinerU 将园林古籍 PDF/EPUB 转为 Markdown 与高清图片
- **向量检索**：BGE-Large-ZH 文本向量（1024 维）+ Chinese-CLIP 图片向量（512 维），Qdrant 本地持久化
- **问答**：DeepSeek 大模型流式回答，支持图文来源追溯与增量更新

---

## 🗂 目录结构

```
├── Owner_ClassicGarden/          # 前端数字档案
│   ├── index.html                # 主页面（姑苏九园 · 世界文化遗产数字档案）
│   ├── frontData/                # 前端迭代版本（S1/S2/S3）
│   ├── prototype/                # 原型（拙政园时间轴、地图）
│   ├── data/                     # 九园档案 JSON、CBDB/诗词/Wikipedia 子集
│   ├── scripts/                  # 数据提取与构建脚本
│   ├── PROGRESS.md               # 开发进度
│   └── summary.md                # 方案文档
├── SuzhouClassicGardenRag/       # RAG 知识库
│   ├── Project/                  # 源码（src/、api_server.py、app.py、config.yaml）
│   ├── Resource/                 # 原始图书资料（PDF/EPUB，不入库，需另行获取）
│   └── 企业文档RAG-搭建指南-边讲边干.md
└── 9yuan.png                     # 项目展示图
```

---

## 🚀 快速开始

### 前端可视化

```bash
# 在 Owner_ClassicGarden 目录启动静态服务
cd Owner_ClassicGarden
python3 -m http.server 9090
# 浏览器打开 http://localhost:9090/index.html
```

### RAG 知识库

```bash
cd SuzhouClassicGardenRag/Project

# 1. 配置环境变量（复制模板并填入真实 DeepSeek API Key）
cp .env.example .env

# 2. 安装依赖
pip install -r requirements.txt

# 3. 启动服务
./run.sh
```

详细说明见 `SuzhouClassicGardenRag/Project/README.md`。

---

## 🔒 数据与隐私说明

以下内容**不包含**在本仓库中（见 `.gitignore`），需自行准备或重新生成：

| 内容 | 说明 |
|---|---|
| `.env` | 真实 API Key（仅提供 `.env.example` 模板） |
| CBDB 数据库 | `data/CBDB_2026_7-18/cbdb_20260718.sqlite3`（557MB，可用 `scripts/extract_cbdb_subset.py` 重建子集） |
| `Resource/` | 园林古籍 PDF/EPUB/DJVU/MOBI 原始资料 |
| `vendor/`、`converted/`、`data/qdrant/` | 第三方依赖与运行时产物（向量库、转换结果） |

---

## 📜 致谢

- **CBDB** — 中国历代人物传记资料库（Harvard / 北大 / 中研院）
- **chinese-poetry** — 中华古典诗词数据集
- **MinerU / LlamaIndex / Qdrant / ECharts / Leaflet** 等开源项目

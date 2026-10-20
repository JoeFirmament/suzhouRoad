# 🏯 姑苏九园 · 9yuan

苏州九座世界遗产古典园林的数字档案、知识问答，以及一款以清末苏州为舞台的 **2.5D 像素叙事探索 RPG**。

![姑苏九园](9yuan.png)

> 以 **CBDB（中国历代人物传记资料库）** 为人物—关系底座，叠加园林档案与历史文献，实现「以人串园、以园见人」的多维数字呈现；配套多模态 RAG 知识库，支持对园林古籍图文内容的智能问答与图像检索；并把同一批考据转译成可走、可看、可玩的像素游戏。

---

## 📂 项目组成

本仓库包含三个部分，**`Game/` 是当前的主项目**。

### 1. `Game` — 《姑苏九园》游戏本体

**一款清末苏州的 2.5D 像素叙事探索 RPG。** 玩家是初入苏州府学的学子，在《蘇城全圖》、园林与建筑近景之间行走、访人、观察和解谜，以「六艺」习得看懂苏州的新方法。没有战斗、等级、装备与货币；核心动词是 **行走 → 观察 → 理解 → 记录 → 发现新的苏州**。

- **设计层**：序章 + 九园九章 + 终章，共 **129 场**分场脚本；九章考据、六艺 18 格、暗线与「今按」层均已定案。
- **工程层**：原生 Canvas + TypeScript 的模块化白模（`gusu-whitebox/`），16px tile、960×600 视口、2.5D 画家算法遮挡、localStorage 双槽存档；33 个页面、**32 张场景板**、**36 张实景证据卡**、统一几何编辑器与 36 个验收脚本。
- **可玩层**：**沧浪亭**（复廊三窗）与 **留园**（送粥寻书全章 + 返程 + 府学核本）两条章流已可玩；其余七园停在整园试稿或剧本阶段。

现状与逐章对账见 [`Game/姑苏九园-进度总表-2026-10-20.md`](Game/姑苏九园-进度总表-2026-10-20.md)；制作约定见 [`Game/AGENTS.md`](Game/AGENTS.md)。

### 2. `Owner_ClassicGarden` — 姑苏九园 · 世界文化遗产数字档案

基于 CBDB 数据的单页可视化应用，覆盖拙政园、留园、网师园、环秀山庄、沧浪亭、狮子林、艺圃、耦园、退思园九座世遗园林。

- **历史叙事**：园主时间轴、园林—人物关系图谱（ECharts 力导向图）
- **空间地图**：九园定位与分布（Leaflet / 高德）
- **数据资产**：`data/` 下九园结构化档案（园主、厅堂、设计名家、世遗批次）、CBDB 人物子集、诗词子集、Wikipedia 词条
- **数据处理脚本**：`scripts/`（CBDB 子集提取、Wikipedia 抓取、园林诗词构建）

### 3. `SuzhouClassicGardenRag` — 园林知识库多模态 RAG 系统

基于 **MinerU + LlamaIndex + Qdrant + Chinese-CLIP + DeepSeek** 的古典园林知识问答与图像识别系统。

- **文档处理**：MinerU 将园林古籍 PDF/EPUB 转为 Markdown 与高清图片
- **向量检索**：BGE-Large-ZH 文本向量（1024 维）+ Chinese-CLIP 图片向量（512 维），Qdrant 本地持久化
- **问答**：DeepSeek 大模型流式回答，支持图文来源追溯与增量更新

---

## 🗂 目录结构

```
├── Game/                         # ★ 游戏本体
│   ├── 姑苏九园-*.md              # 设计定案、考据、剧本（序章/CH1–CH9/终章）
│   ├── 姑苏九园-进度总表-*.md      # 当前进度与债务对账（最新）
│   ├── AGENTS.md                 # 制作约定：考据纪律、美术标准、铺地规则
│   ├── gusu-whitebox/            # 可玩白模工程（Canvas + TypeScript）
│   │   ├── index.html            # 标题与 Intro
│   │   ├── home.html             # 苏州府学 Home
│   │   ├── sucheng.html          # 《蘇城全圖》世界层
│   │   ├── garden.html           # 沧浪亭整园
│   │   ├── corridor.html         # 复廊三窗
│   │   ├── liuyuan-*.html        # 留园章九幕与返程
│   │   ├── geometry-editor.html  # 场景几何编辑器
│   │   ├── src/                  # 源码（core / data / render / ui）
│   │   ├── scripts/              # 构建与 36 个验收脚本
│   │   ├── dist/                 # 打包产物（页面直接加载）
│   │   ├── package.json          # 构建入口
│   │   └── README.md             # 工程说明与调试入口
│   ├── assets/                   # 正式与候选美术资源
│   ├── research-art/             # 研究图与生成实验（不入库）
│   └── archive/                  # 已废止旧稿（归档≠删除）
├── Owner_ClassicGarden/          # 前端数字档案
├── SuzhouClassicGardenRag/       # RAG 知识库
└── 9yuan.png                     # 项目展示图
```

---

## 🚀 快速开始

### 游戏（`Game`）

```bash
cd Game/gusu-whitebox

# 首次：安装 typescript 与 esbuild
npm install

npm run typecheck     # 类型检查（tsc -p tsconfig.json）
npm run build         # 打包 27 个页面入口到 dist/
npm run verify:scenes # 场景几何 + 证据卡 + 留园状态链回归

# 本地起一个静态服务再玩（推荐；file:// 可能禁用 localStorage）
python3 -m http.server 9090
# 浏览器打开 http://localhost:9090/index.html
```

若机器上已有 `esbuild` / `tsc`，可跳过 `npm install`：

```bash
ESBUILD_BIN=$(command -v esbuild) npm run build
```

**主要入口**：`index.html`（标题）→ `home.html`（府学）→ `sucheng.html`（城图）→ `garden.html`（沧浪亭）→ `corridor.html`（复廊）；留园从 `liuyuan-entry.html` 开始。`journal.html` 是学籍与园谱，`geometry-editor.html` 是场景编辑与草稿预览。

### 前端可视化（`Owner_ClassicGarden`）

```bash
cd Owner_ClassicGarden
python3 -m http.server 9090
# 浏览器打开 http://localhost:9090/index.html
```

### RAG 知识库（`SuzhouClassicGardenRag`）

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

## 🔒 数据、素材与隐私说明

以下内容**不包含**在本仓库中（见 `.gitignore`），需自行准备或重新生成：

| 内容 | 说明 |
|---|---|
| `.env` | 真实 API Key（仅提供 `.env.example` 模板） |
| CBDB 数据库 | `data/CBDB_2026_7-18/cbdb_20260718.sqlite3`（557MB，可用 `scripts/extract_cbdb_subset.py` 重建子集） |
| `Resource/`、`converted/` | 园林古籍 PDF/EPUB/DJVU/MOBI 原始资料与转换结果 |
| `vendor/`、`data/qdrant/` | 第三方依赖与运行时产物（向量库） |
| `Game/research-art/` | 研究图与 AI 生成实验（约 111MB），含用户提供的参考照片 |
| `Game/generated-images/` | 早期概念图 |
| `Game/assets/composition-book/`、`Game/assets/pingjiang/` | 第三方图版扫描件，版权未清 |
| `Game/assets/sucheng1890/` 高分图 | 清代《蘇城全圖》的派生渲染图（可由 PDF 重新生成） |
| `Game/.workbuddy/` | 内部工作日志 |

**素材纪律**：源书扫描图、RAG 缩略图与仅供研究的 AI 图不进入公开游戏资源；正式场景中的历史构件须有可追溯来源与证据等级，研究图不等于游戏关卡。详见 [`Game/AGENTS.md`](Game/AGENTS.md)。

---

## 📜 致谢

- **CBDB** — 中国历代人物传记资料库（Harvard / 北大 / 中研院）
- **chinese-poetry** — 中华古典诗词数据集
- **MinerU / LlamaIndex / Qdrant / ECharts / Leaflet** 等开源项目

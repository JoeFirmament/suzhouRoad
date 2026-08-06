# 苏州九园 · CBDB 动态展示方案 — 开发进度

> 最后更新: 2026-07-22

---

## 一、项目概述

**目标**：构建苏州九座世界遗产古典园林与 CBDB（中国历代人物传记资料库）深度融合的动态可视化单页应用，实现「以人串园、以园见人」的多维叙事。

**方案文档**：`summary.md`（412 行，含原方案六章 + 改进附录三章）

---

## 二、整体进度总览

| 阶段 | 状态 | 交付物 | 工时 |
|---|---|---|---|
| **P0 开工准备** | ✅ **完成** | 人名消歧策略、爬虫合规清单、API 契约 schema | 2 天 |
| **步骤 1：数据准备** | ✅ **完成** | 9 园档案 JSON、CBDB 查询清单、子集提取脚本、CBDB 子集 | 1-2 周 |
| **步骤 1.5：原型验证** | ✅ **完成** | 拙政园时间轴 + 力导向关系图集成原型 | < 1 天 |
| **步骤 2：后端搭建** | ⬜ 待开始 | FastAPI 四接口 + Redis + pytest | — |
| **步骤 3：前端开发** | ⬜ 待开始 | Vue3 总览 + 单园详情 | — |
| **步骤 4：联调上线** | ⬜ 待开始 | CI/CD + 爬虫 + 降级测试 | — |
| **步骤 5：运维迭代** | ⬜ 待开始 | V2 功能排期 | — |

---

## 三、数据层交付物（已完成）

### 3.1 目录结构

```
Owner_ClassicGarden/
├── summary.md                          (23 KB)  方案文档 + 改进附录
├── data/
│   ├── gardens.json                    (29 KB)  9园完整结构化档案
│   ├── owners_query_list.json          (14 KB)  40人CBDB查询清单+消歧
│   ├── cbdb_subset.json                (350 KB) 提取的人物关系子集
│   ├── .cbdb_version                              CBDB 版本号记录
│   └── CBDB_2026_7-18/
│       ├── cbdb_20260718.sqlite3       (557 MB)  CBDB 原始数据库
│       └── cbdb_20260718.json                    DB 元数据
└── scripts/
    └── extract_cbdb_subset.py          (20 KB)  SQLite子集提取脚本
```

### 3.2 data/gardens.json

| 字段 | 内容 |
|---|---|
| 园林数 | 9 |
| 园主条目 | 31（含始建者、继任园主、重修者、近代园主） |
| 厅堂条目 | 43 |
| 设计名家 | 9（文徵明、倪瓒、戈裕良、张大千等） |
| 每园数据 | id, name_cn, name_en, built(朝代/年份), unesco_year, 坐标, 面积, 地址 |
| CBDB 锚点 | 每位园主含 cbdb_query(name_chn, alias, disambiguation) |

### 3.3 data/owners_query_list.json

| 类别 | 数量 | 说明 |
|---|---|---|
| **P1 核心园主** | 24 人 | 每个园林的始建者 + 主要继任园主 |
| **P2 设计/关联** | 16 人 | 设计名家、关联人物（盛宣怀、吴三桂等）|
| **P3 排除标记** | 5 条 | 同名人物排除（张履谦学者版、刘恕史学家版）|
| **消歧字段** | 每人都含 | era_range, office_hint, location_hint, confidence, warning |

### 3.4 scripts/extract_cbdb_subset.py

| 功能 | 说明 |
|---|---|
| 数据库连接 | 读取 CBDB SQLite 的 BIOG_MAIN / KIN_DATA / ASSOC_DATA 等 7 表 |
| 繁简转换 | 内建 CJK_S2T 表，自动将简体查询转为繁体搜索 |
| 消歧引擎 | 三约束逐级收窄：年代交叠(3分) + 年号索引(1分) |
| 邻居展开 | 自动查询 KIN_DATA（亲属）+ ASSOC_DATA（社会关系）一阶邻居 |
| 去重 | 同 person_id 只保留一条，同 source-target-type 边只保留一条 |
| 验证 | 9 园匹配检查、节点数检查、重复边检查 |
| CLI | `--cbdb`, `--query-list`, `--output`, `--validate-only` |

### 3.5 data/cbdb_subset.json（提取结果）

| 指标 | 数值 |
|---|---|
| 总节点数 | **681**（超过预期 300-500） |
| 总关系边 | **693**（亲属 186 + 社会关系 507） |
| 种子匹配 | **34/40**（85% 匹配率） |
| 未找到 | **6**（蒋楫、维则、贝润生、陆锦、戈裕良、袁龙——均为低优先级的地方/近代/工匠人物） |
| 文件大小 | 350 KB（前端可直接加载） |

---

## 四、离线数据源

### 4.1 CBDB （✅ 已完成）

| 项目 | 值 |
|---|---|
| 版本 | `cbdb_20260718.sqlite3`（最新版） |
| 来源 | Hugging Face — [cbdb-sqlite](https://huggingface.co/datasets/cbdb/cbdb-sqlite) |
| 大小 | 557 MB |
| 人物 | 660,078 条 |
| 授权 | CC-BY-NC-SA 4.0 |

### 4.2 Wikipedia 摘要+配图（⬜ 待用户翻墙下载）

脚本：`scripts/fetch_wikipedia.py`

```bash
python scripts/fetch_wikipedia.py --output data/wikipedia_data.json --images data/wikimedia/
```

| 项目 | 值 |
|---|---|
| 目标 | 9 园 + 24 位园主 = 33 条 |
| 输出 | `data/wikipedia_data.json` + `data/wikimedia/*.jpg` |
| 授权 | CC-BY-SA 3.0 |
| 依赖 | `pip install requests` + 翻墙环境 |

### 4.3 古诗词子集（⬜ 待用户下载+运行脚本）

```bash
# 先下载 poetry 全库
git clone --depth 1 https://github.com/chinese-poetry/chinese-poetry.git

# 再运行过滤脚本
python scripts/extract_poetry_subset.py \
    --poetry-dir ../chinese-poetry \
    --output data/poetry_subset.json
```

| 项目 | 值 |
|---|---|
| 全库大小 | ~700 MB（git clone --depth 1） |
| 输出大小 | 预计 1-3 MB |
| 授权 | MIT |
| 关键词 | 园林名+苏州地名+园主名共 24 个 |

### 4.4 LLM 人物简介（设计阶段）

预设 prompt 模板，调用 DeepSeek API 生成，输出 `data/owner_bios.json`。

（待 Wikipedia 数据就绪后评估缺口再实施）

---

## 五、已安装 / 待安装依赖

| 依赖 | 用途 | 安装命令 |
|---|---|---|
| `requests` | Wikipedia 下载 | `pip install requests` |
| `ECharts`（CDN） | 时间轴可视化 | 在线 CDN，无需安装 |
| chinese-poetry | 诗词库 | `git clone` |
| DeepSeek API | LLM 简介生成 | API Key + 在线调用 |

---

## 五、待办任务（按优先级）

### P0 已全部解决

- [x] CBDB 人名消歧策略（三约束 + confidence 标注）
- [x] API 接口契约（OpenAPI 3.0 schema 已写在 summary.md 附录）
- [x] 爬虫法律合规清单（robots.txt + 技术底线 4 条）

### P1 待完成（V1 必须）

- [x] **步骤 1.5：拙政园单园原型**（✅ 已完成）
  - ✅ **园主传承时间轴** — 7 位园主 Gantt 图，朝代色系（明赤/清黄/清晚蓝/天国灰）
  - ✅ **CBDB 力导向关系图** — 308 人 × 310 边，力导向布局，悬停/点击联动
  - ✅ **人物详情面板** — 时间轴与关系图点击联动，显示官职/别名/CBDB ID/生平
  - ⬜ 厅堂 SVG 占位
  - ⬜ 客流仪表盘
- [ ] **步骤 2：FastAPI 后端**
  - `GET /gardens` / `GET /gardens/{id}/persons` / `GET /gardens/{id}/livestream` / `GET /maintenance`
  - Redis 缓存集成
  - pytest 冒烟测试
  - `GET /health` 健康检查端点
- [ ] **步骤 3：Vue3 前端**
  - 总览仪表盘（9 园卡片/地图）
  - 单园详情（力导向图 + 时间轴 + 厅堂 SVG + 客流仪表盘）
  - 移动端适配（轮播卡片替代网格，力导向图降级为关系列表）
- [ ] **SVG 厅堂图**（至少拙政园 + 留园手绘 SVG，其余扫描图占位）
- [ ] **爬虫开发**（客流 + 维修公告两个爬虫，含去重与降级）

### P2 待开始（V2 迭代）

- [ ] CI/CD 流水线（GitHub Actions + Vercel/Railway）
- [ ] 管理后台认证（JWT）
- [ ] 结构化日志 + Uptime Kuma 监控
- [ ] CBDB 版本同步自动化（每月）
- [ ] i18n 国际化（英文版数据准备）
- [ ] WebSocket 实时客流推流
- [ ] 无障碍 a11y 基线
- [ ] 全园厅堂 SVG 统一风格

---

## 六、改进后的实施路线图

```
步骤0 开工准备 (2天, ✅完成)
  ├─ 爬虫合规审查
  ├─ API 契约定稿
  └─ 人名消歧规则

步骤1 数据准备 (1-2周, ✅完成)
  ├─ CBDB 子集提取 ─ 681人 × 693条关系
  ├─ 9园档案 JSON ─ 31园主 × 43厅堂
  └─ CBDB 数据库就绪 ─ cbdb_20260718

步骤1.5 原型验证 (1天, ✅已完成)
  └─ 拙政园单园低保真 Demo

步骤2 后端 + 步骤3 前端 (可并行, 3-4周)
  ├─ FastAPI + Redis
  ├─ Vue3 + ECharts (PC + 移动端)
  └─ 爬虫（客流 + 维修）

步骤4 联调上线 (1周)
  ├─ CI/CD 配置
  ├─ 降级测试
  └─ Uptime Kuma 监控上线

步骤5 运维迭代 (持续)
  └─ V2 功能排期 + 版本同步
```

---

## 七、关键数据指标

```
CBDB 原始库:   660,078 人 → 提取子集:      681 人 (0.1%)
9 园档案:      31 位园主 → CBDB 匹配:      34/40 (85%)
关系图预期:    300-500 人 → 实际产出:       681 人
关系边:        693 条 (亲属 186 + 社交 507)
未匹配人物:    6 人 (全部为 P2 低优先级)
SVG 厅堂图:    43 个厅堂 → V1 先做 2 园
```

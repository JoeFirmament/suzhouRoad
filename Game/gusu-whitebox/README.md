# 姑苏九园 · 白模骨架 v0.1（沧浪亭）

时间口径已调整：玩家界面只写“清末”，内部连续时段尚待九章审计，详见[时间设定与史实边界](../姑苏九园-时间设定与史实边界.md)。旧剧本和场景证据卡里的 1890 是待审基线，不是新定案。

平台定案：**Web 像素风**（见《姑苏九园-平台与技术栈定案》）。本工程是《沧浪亭-大场景游走测试.html》（**已归档 `../archive/`**）单文件原型的 TypeScript 模块化重构，作为正式白模骨架。

全游戏共用 `pixel-theme.css`：它必须在页面自身样式之后加载，统一低饱和色板、4px 网格、硬边阴影、直角控件、像素化位图与阶梯动效。详细规范见《姑苏九园-统一像素视觉系统定案》。

新增园林故事或场景前，先按 [本地向量库制作流程](RAG_GAME_PRODUCTION_WORKFLOW.md) 检索并回查原书/实景；花窗、铺地、匾额的跨园复用边界见 [九园纹样线索标准](../姑苏九园-纹样线索与实景图案制作标准.md)。RAG 命中不等于已核史实，研究图不自动进入游戏资源。

## 架构（三层分离）

```
src/
  intro.ts           正式标题、继续/新游、六幕像素动画开场与存档摘要
  journal.ts         学籍、人物谱、六艺、九园与见闻的动态档案
  config.ts          调参表：所有 [PLACEHOLDER] 数值 + 定稿色板（tuning 只改这里）
  home.ts            苏州府学 Home：可行走西学切片、近物交互、出发/归来与存档回响
  world.ts           《蘇城全圖》RPG 世界层：任务、六艺、园林线索与存档回显
  corridor.ts        复廊英雄场景：近景路线、三窗闭环、前景遮挡与跨端输入
  core/
    engine.ts        输入 + rAF 主循环（逻辑不碰 DOM）
    physics.ts       AABB 碰撞、分轴移动（贴墙滑行）
    progression.ts   学子修业存档：六艺、园林状态、一次性任务奖励
  data/
    fuxue-geometry.ts 府学物件的统一碰撞、遮挡、落地线与角色脚底盒
    tiles.ts         tile id + 碰撞集合
    mapgen.ts        沧浪亭白模地图（程序化；示意白模，待刘敦桢总平面图裁决）
    views.ts         取景点数据（诗卡/机位）——素材纪律见各注记
  render/
    fuxue.ts          府学西学正式场景资产、院内水系与多边形遮挡体
    occlusion.ts      2.5D 画家算法：角色脚点/建筑落地线统一深度排序
    pixel.ts         像素原语
    scene.ts         三层离屏渲染（base/detail/roof）+ 玩家 + 光圈
    frameui.ts       取景 UI（框角/诗卡/朱印）+ 框内程序化景致
    annotation.ts    「今按」层唯一渲染原语：三层文字分离、浮现时序、全作 12 处登记表、五规格自检
  ui/
    viewfinder.ts    取景匣状态机（idle⇄framing⇄beat，判定=机位距离，无图像识别）
  annotation-lab.ts  今按层实验场：对照/调参/实例浏览/自检（annotation-lab.html）
  main.ts            装配
```

**换资产约定**：逻辑与数据不动，只重写 `render/`——这是白模零美术渲染的出口。

### 「今按」层（2026-09-30 落地）

- **三层文字唯一真源**：`config.ts → TYPE_LAYERS`（世界文字 / 玩家手迹 / 今按）。任何页面不得再自行写死字体或墨色。
- **今按的七个分离信号**（规格 5 的工程实现）：字体（宋≠楷）／墨色（重墨≠焦墨）／字号（12≠16）／起首「今按」／左侧界行／贴条纸底（`wall`，更亮更冷）／时序（动作之后再等 `TUNING.annotationDelayMs`）。**手迹带朱印，今按绝无印。**
- **浮现时序**：`annotationAlpha(actionAt, now, timing?)` —— delay 之内恒 0（**这就是剧本里的「稍顿」**），之后按 `annotationFadeMs` 分 `annotationSteps` 级阶梯跳上去（像素纪律，不用 CSS 缓动）。
- **零新增颜色**：今按只用 inkHeavy / inkMid / inkPale / zhu / paper / wall 六个既有色。同日补登记了 config.ts 里 8 个未登记的 v3 色，`palette.json` 现在 40 = 40 全对齐。
- **验收/调参入口**：`annotation-lab.html`（对照模式 ＋ delay 滑杆 ＋ 12 处实例逐条浏览 ＋ 五规格自检；`#show=场号` 可直达某条的稳定态）。

### 府学视觉红线

- 程序方块、纯色建筑和临时 NPC 只可用于碰撞调试，不得进入可交付页面、截图或风格基线。
- `home.html` 的运行画面使用完整环境资产与正式角色精灵；16px 网格仅管理碰撞和交互点，不直接暴露为简陋色块。
- `fuxue-home-hub-v1/v2/v3` 属于早期空间研究图，不再作为游戏运行背景；正式西学切片使用中轴校正、缩树后的 `fuxue-west-home-game-v2.png`。
- 沈砚秋必须使用 `shen-yanqiu-sprites-v1.png`，禁止回退到程序绘制的人形占位符。

### 2.5D 遮挡标准

- 一切人物用脚点 `y` 表示深度；屋檐、树冠、门楼用其落地线 `depthY` 表示深度，所有可绘制对象按 `depthY` 从小到大统一排序。
- 前景资产必须使用贴合轮廓的多边形遮罩；禁止用包含门洞、树叶空隙或可行走地面的整块矩形截图覆盖人物。
- 碰撞门洞、遮挡轮廓与背景图必须共用同一世界坐标和整数相机；不得各自用屏幕坐标估算。
- 树木碰撞只取树干/基座核心，树冠不做大矩形碰撞；开放切面房间必须封住墙体，只以画面中实际台阶或门槛作为入口。
- 床、箱笼、书案和桥栏同样是带落地线的遮挡体；家具间不足一个角色宽度的画面缝隙不得当作路线。
- 水面动效必须裁剪在池水轮廓内，并扣除桥体；禁止用水面包围盒直接绘制波光。
- 新增 NPC 时直接加入同一深度队列，不能依据玩家位置整体开关前景，否则多人处于门内外两侧时必然有一人层级错误。

## 小飞虹垂直切片标准

- `standard.html`：样板入口，连接小飞虹参考 Demo、沧浪亭整园和复廊试铺。
- `corridor.html`：沧浪亭复廊英雄场景；对标小飞虹的主景占比与像素密度，承载三窗短局。
- `garden.html`：整园导航层；负责可信平面、自由游走和 POI 可达，不再承担 Demo 级近景表现。
- `../小飞虹WebDemo-垂直切片标准.md`：视觉、分层、跨端与完成定义。
- 小飞虹只作为视觉/交互基准；正式园林仍走“证据→词表→语义地图→2.5D 分层→机制判定”。
- 三个白模入口现已共用键盘和触屏输入，移动端方向键与“取景/退出”不会绕过碰撞逻辑。

## 实景与年代门槛

- `src/data/scene-evidence.ts` 是场景换装前的证据清单：A 同期史料/测绘、B 官方与权威说明、C 合理演绎。
- 当前序章、府学、苏城世界层、沧浪亭整园与复廊近景均登记了年代、来源、已核事实和制作红线。
- `SCENE_PRODUCTION_BOARD.md` 管全作场景顺序。没有证据卡、语义地图和几何验收的场景，不进入正式像素资产生产。
- `garden.html?debug=geometry` 会显示实景语义锚点：绿=已核、黄绿=推演、紫=艺术加工。

## RPG 三层空间

`index.html` 标题与 Intro → `home.html` 苏州府学 Home ↔ `sucheng.html`《蘇城全圖》（城市世界/任务与园林解锁）→ `garden.html` 园林图（园内导航）→ `corridor.html` 近景图（具体谜题）。`journal.html` 是跨层级的学籍、人物与园谱档案。《平江图》保留为府学文庙的拓碑道具与城市考古线索。

原 `index.html` 基础白模已迁至 `sandbox.html`，正式游戏现在从标题界面进入。

玩家身份为初入苏州府学的学子。任务修习六艺，六艺作为能力门让新的线索、互动和园林逐步显形；奖励按任务只结算一次，不能重复刷取。

## 构建

留园入口章流试演页为 [liuyuan-entry.html](liuyuan-entry.html)：从老叟接桶、向乔禾问路、应答门房、亲走夹弄，到小庭口歇脚后转入 [liuyuan-court.html](liuyuan-court.html)。夹弄只推进故事，不因普通走路结算御；御由可选护画挑战按实际走位/时机首次结算，题叶首次结算书，均有任务 ID 防重复。入口现用与统一编辑器同坐标的低饱和可走美术研究图；人物、Tile、草稿碰撞与草稿物件前景遮挡共用世界坐标，旧草稿不覆盖。它仍偏俯视和图解式，**不是最终 2.5D 像素场景**，更不是历史核准的旧门园路。完整跨页试玩建议用本地 HTTP 服务；`file://` 或隐私模式可能不允许浏览器持久保存进度。改动场景数据后须重新打包 `src/liuyuan-entry.ts`、`src/liuyuan-court.ts` 与 `src/geometry-editor.ts`。

```bash
# 打包为单文件（file:// 可直接打开 index.html）
NODE=/Users/quill/.workbuddy/binaries/node/versions/22.22.2-3/bin/node
ESB=/Users/quill/.workbuddy/binaries/node/workspace/node_modules/.bin/esbuild
$ESB src/main.ts --bundle --outfile=dist/game.js
$ESB src/intro.ts --bundle --outfile=dist/intro.js
$ESB src/journal.ts --bundle --outfile=dist/journal.js
$ESB src/corridor.ts --bundle --outfile=dist/corridor.js
$ESB src/world.ts --bundle --outfile=dist/world.js
$ESB src/home.ts --bundle --outfile=dist/home.js
$ESB src/liuyuan-entry.ts --bundle --outfile=dist/liuyuan-entry.js
$ESB src/liuyuan-court.ts --bundle --outfile=dist/liuyuan-court.js
$ESB src/geometry-editor.ts --bundle --outfile=dist/geometry-editor.js

# 类型检查
TSC=/Users/quill/.workbuddy/binaries/node/workspace/node_modules/.bin/tsc
$TSC -p tsconfig.json
```

留园章跨页回归另有 `scripts/verify-liuyuan-page-boot.ts`：模拟九幕独立、章节、返程与草稿缺失时的启动和首帧，不读写玩家浏览器草稿。可用 esbuild 打包成 Node 脚本后运行；此项不能替代真实浏览器键盘／触屏与图面遮挡验收。早期转场现会把 `draft=1` 从入口传至花木院，并贯穿之后的正向与返程研究页。

`scripts/verify-liuyuan-input-smoke.ts` 进一步对正向八张、返程七张行走页的正式脚本派发键盘与触屏指针事件，推进动画帧并核脚点、松开和失焦停止。它仍是模拟环境，不替代浏览器整链和玩家草稿的图面验收。

留园章八张必经行走页的默认书生世界身高、入口远近缩尺和各页游戏镜头倍率以 [`src/data/liuyuan-character-scale.ts`](src/data/liuyuan-character-scale.ts) 为共同真源；统一编辑器在对应场景读取同一基础身高，再叠加用户草稿的 `actorScalePercent`。`verify-all-scenes` 检查常用脚点换算后的屏幕身高，防止修改某一页后角色突然缩小或放大。数值检查不替代与门框、NPC、台阶并排的真实画面验收。

同一脚本现还从零留园旗标的内存存档，分别以键盘和触屏指针走过门外人物应答、夹弄、小庭漏窗、临池、花木院送粥与花匠、堂前双树、石林、书斋院轻叩、室内抄书人、亲手题叶；然后沿同一份进度逆行收叶、应答门房并踏街面结算。逐页传递保存进度与 `draft=1`，检查默认碰撞、15 个章旗标、御/书各一次与园态。**这是脚本模拟，不是实际浏览器或用户草稿视觉验收。**

返程从上述同一份空存档的题叶结果出发，分别用键盘和触屏指针从书斋院门前逆行石林、堂前、花木院取桶、绿荫轩、小庭、夹弄和门房，最后踏街面结算；沿途检查脚点与禁行区，门房答话前后均不能提前通关。它不读写真实浏览器存档，也不代替实机视觉验收。

花木院的兰谱／画谱支线会把 `chapter=1` 与 `draft=1` 一直带到交画返院；`scripts/verify-liuyuan-composition-route.ts` 检查这些 URL，不读写几何或画谱存档。

## 调试

- `sandbox.html#view` 直达基础白模取景画面
- `index.html?mode=opening` 强制回看完整 Intro
- `home.html?debug=geometry` 显示府学碰撞体、遮挡轮廓、落地线和人物脚点；制作规范见 `SCENE_GEOMETRY.md`
- `garden.html?debug=geometry`、`slice.html?debug=geometry`、`corridor.html?debug=geometry` 使用同一调试颜色与脚点规则；逐步执行见 `SCENE_AUTHORING_GUIDE.md`
- `geometry-editor.html`：府学几何轮廓编辑器，可拖拽顶点、调整深度线、保存草稿并导入/导出 JSON
- 触屏：点按 = 交互（虚拟摇杆为下一步工作）

## 下一步（按优先级）

1. 用“府学发问—入园辨位—三窗课业—府学归来”序章闭环做 5 人轻量测试
2. 根据测试回填移动速度、触发半径、停步静默拍与过场字数
3. 完成历史证据后，再将府学与园林地图接入 JSON/Tiled 管线，替换当前功能白模
4. 加入环境声与关键交互声；所有播放均由玩家手势触发，兼容浏览器限制

完整回看从 `home.html?scene=briefing` 开始；世界层会把回看状态传至首次入园。单独调试可使用 `home.html?scene=return`、`garden.html?scene=arrival`、`corridor.html?scene=complete`。

## 留园动态事件（2026-10-13）

2026-10-14 当前[檐下抢画v37](liuyuan-flower.html?playtest=1&minigame=rain-shadow&v=37)：保留玩家认可的v36手感/3HP/猫影和难度，补猫歪头与默认静音的可选“轻音效”，勾选开启，暂停/关闭/回院停声。独立练习不改进度，真实键盘开启音效通关2/3HP、1/1。声音回归为 `scripts/verify-rain-shadow-audio.ts`，查询/验证和截图见[记录](LIUYUAN_FLOWER_DRAWING_EVENT.md)。

2026-10-14 当前[檐下抢画 v36](liuyuan-flower.html?playtest=1&minigame=rain-shadow&v=36)：猫扑方向线改为有耳尾伸爪轮廓的灰褐地面猫影，预示锁定扑向，实体扑出后收影；影子本身不伤人。保留v35的3HP、难度/判定、少动效与不改进度练习契约。查询/测试和实机截图见[花房记录](LIUYUAN_FLOWER_DRAWING_EVENT.md)。

2026-10-14 当前为[檐下抢画 v35](liuyuan-flower.html?playtest=1&minigame=rain-shadow&v=35)：普通/缓雨都3HP，淋雨/猫扑各扣1；三颗像素心与HP−1提示，.6秒受击保护，0HP可重试。护画挡雨不挡猫，独立练习不改进度。下方v34、v33为历史，当前参数见[记录](LIUYUAN_FLOWER_DRAWING_EVENT.md)。

2026-10-14 更新：[檐下抢画 v34](liuyuan-flower.html?playtest=1&minigame=rain-shadow&v=34) 加入五次猫扑，先伏身、褐色实线锁定扑向，再短扑；玩家侧移让开，护画挡雨不挡猫。三段渐快，共享受损保护，猫雨不双扣；少动效/暂停与练习不改进度契约保留。实机键盘通关和回归详见[花房记录](LIUYUAN_FLOWER_DRAWING_EVENT.md)。下方 v33 为雨势细化历史。

旧门房挑战已撤下，当前为花房可选事件[檐下抢画](liuyuan-flower.html?playtest=1&minigame=rain-shadow&v=33)：猫拨落兰稿，先自动拾起，再完整护画十八秒，辨雨→换向→交雨三段八阵逐渐变难，提供缓雨档、暂停、重试和退出。v33 第一轮细化檐条、灰石、猫和纸卷；保留 v32 的落纸/拾纸、持画预览、折纸护画和完成回响，移动手感和白点判定不变；少动效只改装饰。剧情首次成功确认御 +1 与兰稿册页，独立练习不发奖不改进度；风另留其他园林候选。不清旧存档、不改草稿。参数、正反向本地检索、实际原生键盘通关截图见[花房事件记录](LIUYUAN_FLOWER_DRAWING_EVENT.md)；旧六折仅保留底层兼容与[历史记录](LIUYUAN_RAIN_SHADOW_GAME.md)。玩法回归为 `scripts/verify-liuyuan-rain-shadow.ts`，演出不改状态检查为 `scripts/verify-rain-shadow-visuals.ts`，整章仍由既有输入与存档回归检查。

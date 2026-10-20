# 留园绿荫轩临池 · 可行走视觉试稿 v1

状态：**内置 imagegen 生成的游戏视觉候选，已接独立试走页和几何编辑器；不是 1890 年复原，也没有接入 CH3 结算。** 输入图 `liuyuan-tree-court-no-water-study-v1.png` 只作风格参照；没有把网上照片送入生成工具，也没有直接照搬照片构图。

## 已核空间关系与制作取舍

- [苏州市园林局《绿荫轩》](https://ylj.suzhou.gov.cn/szsylj/ylwh/201808/befc4b49080d44989ca9b79439db3840.shtml)：绿荫轩是临水敞轩，南庭有“华步小筑”；现状提及西青枫、东榉树，但不能直接当作 1890 树位。
- [苏州市园林局《留园》](https://ylj.suzhou.gov.cn/szsylj/sjyc/201905/b7c0f2058c75498c9ecbacf234e25b08.shtml)：中部主池与建筑、山景的总体关系。
- [苏州市园林局转录《游苏备览·留园》](https://ylj.suzhou.gov.cn/szsylj/ylwh/201807/37222ea7f68c4ddd9cc08c9e769f39d7.shtml)：民国文本记“池之甫有轩，署曰绿荫”，可作早期临池关系旁证，不足以复原 1890 栏杆、柱脚和铺地。
- [《批判性地域主义视角下的中西方景观地域文化》](https://pdf.hanspub.org/Design20240100000_40977282.pdf)：现状入口从古木交柯收窄后到绿荫轩放开；仅用其空间序列，不取图像贴图或精确尺寸。

图中只保留一片园内主池；玩家从画面东侧干燥石路进入，沿池南走向敞轩。生成图中的石栏、树、岸线和柱位是**玩法/镜头候选**，尚未逐项对照实景，不能作史实台词。画面也不是严格逐像素手绘，正式美术尚需像素精修。

## 最终生成提示（内置 imagegen；英文原文）

```text
Use case: historical-scene
Asset type: background plate for a playable 2.5D Suzhou garden RPG scene, not a postcard or cutscene
Input image 1: style reference only. Match its quiet, low-saturation, hand-painted pixel-art-adjacent texture, oblique camera height, stone scale, warm-grey plaster and dark roof tiles; DO NOT copy its courtyard layout, six-window wall, or trees.
Primary request: Create the next walkable garden slice after the enclosed 古木交柯 entrance court of Suzhou Lingering Garden (留园): the approach to 绿荫轩 / Green Shade Pavilion, where the player FIRST encounters the central garden pond.
Grounded spatial facts: Green Shade Pavilion is an open waterside pavilion on the south side of the garden's central pond; the route turns west from the preceding enclosed court. Pavilion faces the pond. From this east-side entry the player should be able to walk on connected stone paving to the pavilion floor and along a dry bank, but never onto water. Central pond is ONE continuous pond; no ornamental second lake, no floating fantasy islands or bridge. Opposite bank has a subdued rocky/tree slope, not another invented palace. Maintain Suzhou white walls, black tiled eaves, timber posts, restrained stone paving and a believable low rail at the water edge.
Composition: wide roughly 2:1 landscape game plate, fixed 2.5D oblique three-quarter view, no perspective cutaways. Entry path at RIGHT edge at lower middle. A broad, visually unobstructed contiguous walkable stone route runs from that right edge toward a modest open pavilion at center-left and a dry viewing edge in the lower-center. Central pond occupies the upper-left/upper-middle, clearly separated by a precise stone shoreline. Keep all player walkable floors visible to the camera; put large roofs high in frame or at lower foreground where they can become a separate occlusion mask. Do not place furniture, stones, plants, or roof across the main walking route. Design for a character about 100–120 screen pixels high at gameplay camera zoom. Visual rhythm changes from compressed east passage to open pond vista.
Mood/palette: soft overcast late-afternoon light, misty grey-green, warm off-white walls, charcoal tiles; subtle ripples within water only, not on paving; low saturation, no neon, no glossy CGI.
Historical caution: this is a gameplay study of verified present-day spatial relationships, not a measured 1890 reconstruction. Omit modern signage, tourists, ticketing, modern railings, text, labels, calligraphy, characters, UI, watermarks. Do not invent a waterfront entrance or a river outside the garden.
```

## 验收边界

- 场景世界坐标 `1776×896`、原图 `1774×887`；目前绘制时只做小幅拉伸，正式像素资产需重新对齐 16px 网格。
- 可走 Tile、池面禁行、栏杆/花台/墙/柱脚碰撞、前景遮挡和三个观察锚点已分离，见 `src/data/liuyuan-lvyin-study.ts`；可在 `geometry-editor.html?scene=liuyuan-lvyin-pond-study-v1` 中校准。
- 路径与碰撞的自动检查只证明**此视觉试稿能玩**。实际柱、栏、水缘与 1890 年状态仍须照片/测绘核验，未验前不可自动接小庭、不可升级为正式场景。

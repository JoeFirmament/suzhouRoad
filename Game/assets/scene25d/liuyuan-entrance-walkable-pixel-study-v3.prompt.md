# 留园入口可走美术研究 v3

状态：内置 imagegen 对本项目原创 `liuyuan-entrance-walkable-study-v2.svg` 渲染图进行两次编辑，生成 `liuyuan-entrance-walkable-pixel-study-v3.png`。经跨场景风格复核，**v3 及其修通中段矮墙的 v4 均已撤出留园入口试玩和统一编辑器，只保留为未通过的视觉研究候选**。它们不是清末复原、实景照片或最终可交付像素画。当前运行仍使用 v2 拓扑底图，用户浏览器草稿不覆盖。

## 已用材料与边界

- 参考的是现有游戏 Tile 的 1008×688 可走拓扑，以及本地 `garden_knowledge` 对《园林有境》“华步小筑”狭长小径、时暗时明、转折见花墙的召回。书中文字只支持入口空间收放，不给 1890 年门位、廊宽、花盆、树位与窗纹。
- 初次图像编辑把旧 SVG 的建筑改为粉墙灰瓦和石地，得到 1519×1036 的画面；叠加 11 个可走区域发现上段脚点被屋顶覆盖，**没有直接入游戏**。
- 第二次以初次生成图及其路线叠图为参考，要求把上段 9、10 号路线矩形改为连续露天石路，去掉 QA 线条。得到本文件对应的 1518×1036 图。再次叠图检查后，路线脚点落在可见石路上，游戏在 1008×688 世界坐标中缩放绘制。
- 生成画面里右侧两个小窗、盆栽、院中石与局部檐口是画面设计，**未核实为留园对应位置的真实构件**。北墙六扇漏窗的具体纹样、旧门位与清末树位仍待核。没有直接复制/转换外部照片到游戏包。
- 曾将书生精灵在候选图上分别合成 55px 与约 72px 做视觉 QA，并试用远处 62px、近处 75px 的候选曲线。由于整张图被撤出试玩，人物/NPC 改动也已撤回；v2 白模仍用原尺度。此比较不是实测门高。

## 风格复核结论（2026-10-10）

v4 虽去掉中段遮路矮墙，仍与[府学 Home](../fuxue/fuxue-west-home-game-v2.png)、[留园无水小庭](liuyuan-tree-court-no-water-study-v1.png)、[绿荫轩临池](liuyuan-lvyin-pond-study-v1.png)及[石林院](liuyuan-stone-forest-court-study-v2.png)显著不一致：v4 以近正俯视屋顶群作主景，人物几乎始终走在狭窄平面缝内；既有场景为斜俯视，墙面、门、台阶、树影和可走庭地各有纵深。v4 色调更亮更平，树石成为建筑缝旁的装饰，缺少既有场景的灰石湿润肌理与近中远景关系。因此不能因 Tile 对齐就替代游戏场景。下一稿须从同系列斜俯视镜头出发，并把入口拆为相继可走的近景切片，而非再用整条通路鸟瞰图一图包办。

## 第二次编辑的核心提示

```text
Edit the first image into a 2.5D pixel-art game scene, keeping the 1519×1036 framing and lower architecture registered. The second image is a QA overlay showing walkable rectangles 0–10; use only as spatial reference and remove the colored outlines and numbers. Correct the upper-left: rectangles 9 (x434–651,y337–409) and 10 (x386–506,y265–409) need a continuous pale-grey stone walkway connecting the upper central patio into a modest planted court. Keep the path open and walls/roofs adjacent, muted palette, no characters, text or UI. This is present-day-inspired playable study, not an authenticated 1890 survey.
```

## 待人工完成

1. 先做与府学、留园小庭一致的斜俯视“门外—门厅”近景切片；用门、台阶、同一书生实测可见像素高度建立美术基准，不能只沿用鸟瞰 Tile。
2. 新切片的前景层、墙根、门槛和盆栽分别标定，然后在统一编辑器调碰撞/落地线，并用真实浏览器键盘和触屏实走。
3. 用有方位的现状平面/照片重核六扇漏窗、树石、花盆和小门关系。未核细节不得写成史实台词或导出给正式历史复原场景。

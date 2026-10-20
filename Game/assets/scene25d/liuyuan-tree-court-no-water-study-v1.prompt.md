# 留园古木交柯小庭 · 无水视觉候选 v1

状态：**已有独立游戏试走页，但不可当正式关卡。** 使用内置 imagegen 生成，原稿左侧把水面放得像入口外河道；本版对原稿进行局部编辑，移除全部可见水面及临水亭，只保留小庭与向西的曲廊。没有引用或改编外部照片。书生、可走 Tile、花台/墙碰撞与屋檐前景层由代码实现，不是画在图片里的假 UI。

## 来源与空间约束

- [苏州市园林局《留园》](https://ylj.suzhou.gov.cn/szsylj/sjyc/201905/b7c0f2058c75498c9ecbacf234e25b08.shtml)：园内中部有主池，绿荫轩临池；西部是山林，而非外部河道。
- [苏州市地方志办《漏窗艺术》](https://dfzb.suzhou.gov.cn/dfzb/fzxh/201002/4310c9b7dad442b99b209d301b8cdd82.shtml)：古木交柯前廊北墙现有六扇漏窗，供取景，不供穿行。
- [苏州市留园西园单元控规](https://www.suzhou.gov.cn/szsrmzf/zdzxghyjzjhjd/202109/fb69b8429f4e4edf9f7ca91918e8f3a7.shtml)：留园路与更南面的上塘河分开。不能把园门直接画作河埠。

上述均不能证明图中树形、窗格纹样、墙位、铺地或屋檐在 1890 年的具体形态。当前游戏页已按图面内缘建立保守 Tile 与独立前景屋檐，但其轮廓仍需真实机位逐像素核对；不能因此升级为历史复原或正式主线关卡。

## 生成提示（内置 imagegen）

```text
Use case: historical-scene
Asset type: candidate gameplay background for a 2.5D Suzhou garden RPG, circa 1890; a single walkable transition slice, NOT a full-garden overview
Primary request: Depict the entrance sequence around Lingering Garden's 古木交柯 leading west toward 绿荫轩, constrained by verified present-day spatial topology while avoiding unverified 1890 details.
Scene/backdrop: Oblique high three-quarter view looking slightly north. Lower-middle small court with limewashed walls, muted stone paving, a raised planting bed and two non-specific old trees. Along the north/back wall exactly six ornamental leak windows in a continuous solid wall; windows, not doors. Walkable path turns west/left to a narrow passage. Restrained late-Qing Suzhou atmosphere.
Style/medium: polished low-saturation 2.5D pixel game background, crisp clusters, grey-green, stone grey, warm off-white, weathered timber. No people, quest props, labels, modern signage, tourists or showy flowerbeds. Legible paved ground for the player.
```

## 修正提示（内置 imagegen，最终文件）

```text
Use case: precise-object-edit
Asset type: candidate 2.5D pixel gameplay background, Lingering Garden entrance court, not yet the central pool reveal
Primary request: Correct the left side. Remove the entire visible water surface and waterside pavilion. Replace them with a modest narrow westward paved passage bending out of sight between pale limewashed walls and low grey-tile eaves. The player can walk into this passage. Show no water anywhere: neither an outside canal nor the central pond. The pond appears only in a later, separate Green Shade Pavilion scene.
Invariants: Keep camera, scale, muted palette, six small leak windows in solid north/back wall, court paving, planting bed, trees, uninterrupted walkable ground. Windows are not doors. No bridge, moat, riverbank, pond, boat, island, signage, people or text. Keep footline visible. Crisp 2.5D pixel-game finish.
```

## 自检

- 左侧不再出现水面；该幕先让玩家看见取景窗与西行通路，避免把园内池画成门外河。
- 图片是 `1774×887`；编辑器世界坐标 `1776×896` 只用于标注草稿。正式切片须重新对齐到 16px 网格。
- 六窗数目可据现状资料；窗格样式、树种与树位不可写作历史事实。
- 图面仍不是严格像素级美术。`liuyuan-court.html` 可独立试走；可走、碰撞与遮挡数据在 `src/data/liuyuan-court-study.ts`，编辑器同源预置；`liuyuan-entry.html` 白模暂不与它自动转场，避免错误拼接不同机位。

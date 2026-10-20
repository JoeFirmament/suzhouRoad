# 留园入口 · 灰模与控制图（v0）

由 `scripts/entry_greybox.py` 从正式 Tile 数据 `src/data/liuyuan-entry-study.ts` 生成，
不需要 Blender，也不依赖任何图像 API。

```bash
cd Game/gusu-whitebox
python3 scripts/entry_greybox.py          # 平面布局（默认，12/12 脚点在铺地）
SHEAR=0.55 python3 scripts/entry_greybox.py   # 2.5D 剪切（8/12，见下）
```

## 两套输出

| 目录 | 投影 | 脚点对齐 | 用途 |
|---|---|---:|---|
| `control/liuyuan-entry/` | 平面（SHEAR=0） | **12/12** | 布局、体块、路径分区；给绘制/生图当版式约束 |
| `control/liuyuan-entry-shear/` | 2.5D 剪切（SHEAR=0.55） | 8/12 | 看体量关系；**不能**当最终对齐依据 |

每个目录里：

- `beauty.png` — 平光灰模（人看体量）
- `seg.png` — 材质分区（墙白、屋顶深、地面紫、水蓝、木橙、叶绿、土墨绿）
- `depth.png` — 高度图（地面 0，屋脊 150；近白远黑）
- `line.png` — 轮廓线
- `overlay.png` — 灰模 + 12 脚点 + 三段落镜框（A/B/C 各 504×344）

## 一条几何结论（比图本身重要）

**在 48px 宽的南北夹弄里，"3/4 投影"和"12 脚点 1:1 落在铺地上"不可兼得。**

剪切投影把高度 `z` 映射成 `screen_y − z×0.55`。夹弄只有 3 格（48px）宽，而墙高 112–120px——
北侧墙的屋顶会被抬到 `screen_y − 66` 的位置，正好盖住路面上的脚点。这不是 bug，
是"窄巷 + 俯视"的必然结果（府学场景能做，是因为院子宽）。

⇒ 所以入口的正确流程不是"用灰模推导一张 3/4 底图"，而是**先把底图画出来，再在统一编辑器里
把 Tile、脚点、遮挡铺到画面上**——也就是其余 31 张底图已经在走的那条路。灰模在这里的作用
只有两个：**版式约束**和**体块参考**。

## 建议用法

1. 画师/生图拿 `liuyuan-entry/overlay.png` 定版式：路径走向、三段落镜要框住什么、12 个脚点
   必须落在可见铺地上。
2. `seg.png` / `depth.png` 可作为 ControlNet 的布局/体块条件（平面模式，不含透视）。
3. 底图出来后，在 `geometry-editor.html?scene=liuyuan-entrance-topology-study` 里对着画好的
   铺地铺 Tile、校脚点——**以画面为准，不以灰模为准**。

## 未做

- 屋顶坡面、瓦垄、粉墙材质、湿石反光、灯笼光——这些是绘制阶段的事，灰模不承担。
- 人物、道具、植栽的具体形态。

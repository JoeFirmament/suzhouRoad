# 环秀山庄 · 主面 AI 控制包 v1

> 给有出图模型的人用。目标：一张 **1008×688** 的主面底图，2.5D 像素、清末、阴天、湿石。
> **人不要出图**：人物由游戏引擎加 126px sprite，避免 AI 画人/画比例错。

## 1. 文件

| 文件 | 用途 | 控制方式 |
|---|---|---|
| `line.png` | 线稿（无人物、无文字） | ControlNet **lineart / softedge**，权重 0.8 |
| `depth.png` | 深度图（白近黑远；洞最黑） | ControlNet **depth**，权重 0.6 |
| `palette.png` | 色块（无人物、无文字） | img2img 底图 / 色彩参考 |
| `cave-2x.png` | 洞口/石面 2× | 局部 inpaint 参考 |
| `../mainface-color-v1.png` | 带色板的色块稿 | 调色参考 |
| `Game/assets/fuxue/fuxue-home-hub-v2-dual-axis.png` | 府学风格参考 | IP-Adapter / 风格参考，权重 0.4–0.6 |

所有控制图 **1008×688**，可被 8 整除。

## 2. 正向提示词（英文，SD 用）

```
2.5D pixel art game background, late Qing dynasty Suzhou classical garden,
Huanxiu Shanzhuang rockery, one massive Taihu limestone rockery with a deep cave
and overhanging crags, low stone railing and pond in front, zigzag stone bridge,
corridor and pavilion on the left, two-story wooden building behind,
high white plaster wall with dark tile cap on the right, pine tree on the rock,
osmanthus by the corridor, bamboo at the wall, banana at the cave,
overcast humid day, wet stone, muted gray-green palette,
soft diffused light from upper left, layered depth,
16-bit pixel art, 2-3 px clusters, no anti-aliasing, no text, 1008x688
```

## 3. 正向提示词（中文，即梦/MJ 用）

```
2.5D 像素风游戏背景，清末苏州古典园林，环秀山庄湖石假山，
巨大太湖石，深洞，外挑岩壁，前方低石栏与水池，三曲石桥，
左侧廊与亭，后面二层木楼，右侧粉墙黛瓦高墙，
山上有松，廊前有桂，墙边有竹，洞口有芭蕉，
阴天湿润，石面湿，灰绿低饱和，左上柔光，层次分明，
16-bit 像素，2-3px 色簇，无抗锯齿，无文字，1008×688
```

## 4. 负向提示词

```
photo, photorealistic, 3D render, smooth gradients, blurry, depth of field,
text, watermark, signature, plaque, Chinese characters,
blue sky, bright sunlight, modern metal railing, people, crowd,
extra buildings, anime, cartoon, thick outlines, low resolution,
jpeg artifacts, oversaturated, HDR
```

## 5. SD 参数

| 项 | 值 |
|---|---|
| 尺寸 | 1008×688（或 1024×704 后缩） |
| 采样 | DPM++ 2M Karras |
| 步数 | 30–36 |
| CFG | 6–7 |
| 种子 | 固定，先跑 4–8 张 |
| ControlNet lineart | 权重 0.75–0.9，start 0 / end 1 |
| ControlNet depth | 权重 0.5–0.7，start 0 / end 1 |
| img2img（从 palette） | denoise 0.6–0.75 |
| IP-Adapter（府学） | 权重 0.4–0.6 |

**先 txt2img（line+depth）**；构图不稳再 img2img 从 `palette.png` 起。

## 6. MJ / 即梦

- **即梦**：参考图选 `line.png` + `palette.png`；有“边缘/线稿”控制就开，强度 0.6；比例 3:2；风格“像素艺术 / 16bit”。
- **MJ**：`line.png` + `palette.png` 作 image prompt，`--ar 3:2 --iw 1.5 --style raw --s 50`；MJ 不守深度，构图会飘，优先用 SD。
- 两家都要在负向里写 **no text, no people, no blue sky**。

## 7. 工作流

```
1. line+depth 出 4–8 张（固定种子）
2. 选：洞口有纵深、山形不塌、三层可读
3. inpaint：洞口、钩带接缝、墙面
4. 量化到 16–24 色 + 2px 抖动；缩到 1008×688
5. 引擎里加 126px 人物 sprite、UI
6. 与府学并排，校色阶/光向/像素密度
```

## 8. 验收

- 洞口读得出“深”，不是黑块；
- 山约 **4 倍人高**（人物后加，先看石栏/房高比例）；
- 水/栏（近）→ 洞/谷（中）→ 峰/墙（远）三层；
- 与府学并排：色阶、光向、像素密度连续；
- 无文字、无匾、无现代栏杆、无蓝天。

## 9. 1890 边界

- 走马楼 1890 待核；AI 若加了二层楼，先保留，标注待核。
- 2-116/2-115/1:5 模型都是**现代复原/研究参考**；成图是游戏化再现，不称原状复原。
- 俞平伯匾（1900 年生）不能出现。

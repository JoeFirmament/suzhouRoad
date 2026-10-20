/** 诗与机位数据。素材纪律：诗句全部实园实名；机位为 [PLACEHOLDER·实勘定]。 */
export interface ViewSpot {
  id: number;
  x: number;          // 像素（廊内站位）
  y: number;
  poem: string;       // 成片题跋
  source: string;     // 出处
  hint: string;       // 框内构图说明（主持人卡对应物）
}

export const VIEW_SPOTS: ViewSpot[] = [
  {
    id: 0,
    x: 18 * 16 + 8, y: 9 * 16 + 8,
    poem: '沧浪之水清兮，可以濯吾缨',
    source: '《楚辞·渔父》',
    hint: '水窗：水面 + 水榭一角',
  },
  {
    id: 1,
    x: 38 * 16 + 8, y: 9 * 16 + 8,
    poem: '一径抱幽山，居然城市间',
    source: '苏舜钦《沧浪亭》',
    hint: '山窗：假山轮廓连绵',
  },
  {
    id: 2,
    x: 58 * 16 + 8, y: 9 * 16 + 8,
    poem: '清风明月本无价，近水远山皆有情',
    source: '沧浪亭集句联',
    hint: '全景窗：山 + 水 + 桥 + 亭角',
  },
];

/** 试铺段三窗机位（M2 看对合；站位=内廊窗南侧）。窗号与 mapgen.buildCorridorSlice 的 winX 对齐。 */
export const SLICE_SPOTS: ViewSpot[] = [
  {
    id: 0,
    x: 35 * 16 + 8, y: 7 * 16 + 12,
    poem: '沧浪之水清兮，可以濯吾缨',
    source: '《楚辞·渔父》',
    hint: '窗一·看：静止对位',
  },
  {
    id: 1,
    x: 60 * 16 + 8, y: 7 * 16 + 12,
    poem: '一径抱幽山，居然城市间',
    source: '苏舜钦《沧浪亭》',
    hint: '窗二·对：纹样匹配',
  },
  {
    id: 2,
    x: 88 * 16 + 8, y: 7 * 16 + 12,
    poem: '清风明月本无价，近水远山皆有情',
    source: '沧浪亭集句联',
    hint: '窗三·合：移动对位',
  },
];

/** 整园三窗机位（内廊站位，窗在 y9 中墙；winX 与 buildCanglangGarden 对齐）。 */
export const GARDEN_SPOTS: ViewSpot[] = [
  {
    id: 0,
    x: 24 * 16 + 8, y: 10 * 16 + 8,
    poem: '沧浪之水清兮，可以濯吾缨',
    source: '《楚辞·渔父》',
    hint: '窗一·看：外廊水面',
  },
  {
    id: 1,
    x: 64 * 16 + 8, y: 10 * 16 + 8,
    poem: '一径抱幽山，居然城市间',
    source: '苏舜钦《沧浪亭》',
    hint: '窗二·对：内廊山景',
  },
  {
    id: 2,
    x: 80 * 16 + 8, y: 10 * 16 + 8,
    poem: '清风明月本无价，近水远山皆有情',
    source: '沧浪亭集句联',
    hint: '窗三·合：五百名贤祠方向',
  },
];

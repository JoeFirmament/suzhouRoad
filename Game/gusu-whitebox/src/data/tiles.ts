/** tile id 与碰撞定义。渲染只认 id，不认名字。 */
export const T = {
  GRASS: 0,
  PATH: 1,
  WATER: 2,
  WALL: 3,     // 粉墙（实心）
  CORR: 4,     // 廊内地面
  ROCK: 5,     // 假山
  TREE: 6,
  PLAT: 7,     // 台地/水榭平台
  BRIDGE: 8,   // 石桥（可走）
  FLOWER: 9,   // 花境（装饰，可走）
  WIN: 10,     // 漏窗（墙上的窗，实心；取景点在廊内对侧）
  // —— P2 试铺段新增（词表 tile-lexicon-canglang #1-18 落地）——
  DIRT: 11,    // 假山蹬道泥土路（可走）
  RAIL: 12,    // 临水石栏（实心）
  ROOF: 13,    // 建筑屋顶（面水轩/观鱼处/石亭，实心）
  PAV: 14,     // 亭前平台（可走）
  BAMBOO: 15,  // 竹林（实心，翠玲珑/看山楼周边）
} as const;

export const SOLID: ReadonlySet<number> = new Set([
  T.WALL, T.WATER, T.ROCK, T.TREE, T.WIN,
  T.RAIL, T.ROOF, T.BAMBOO,
]);

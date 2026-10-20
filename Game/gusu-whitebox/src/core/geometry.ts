/** 所有场景统一使用世界坐标；角色的 x/y 永远表示脚底中心点。 */
export type WorldPoint = readonly [x: number, y: number];

/** 静态实体碰撞矩形，坐标对应背景资产缩放后的世界像素。 */
export interface CollisionRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 精确物件使用凸多边形；凹形轮廓拆成多个凸多边形。 */
export interface CollisionPolygon {
  points: readonly WorldPoint[];
}

export type CollisionShape = CollisionRect | CollisionPolygon;

/** 相对角色脚点的碰撞盒：topInset > bottomInset >= 0。 */
export interface CollisionProfile {
  halfW: number;
  topInset: number;
  bottomInset: number;
}

/** 全游戏默认书生脚底盒；精灵高度不参与碰撞。 */
export const STANDARD_PLAYER_PROFILE: CollisionProfile = {
  halfW: 4,
  topInset: 6,
  bottomInset: 1,
};

/** 从背景资产重新裁出的前景轮廓；depthY 是物体落地线。 */
export interface DepthOccluder {
  id: string;
  depthY: number;
  polygons: readonly (readonly WorldPoint[])[];
}

export interface DepthLayer {
  depthY: number;
  order: number;
}

export interface WaterRippleStyle {
  color: string;
  rowSpacing: number;
  segmentSpacing: number;
  minLength: number;
  maxLength: number;
  speedMs: number;
}

/** 动态特效区域也属于场景几何；holes 用于扣除桥、石、建筑等前景。 */
export interface SceneEffectRegion {
  id: string;
  kind: 'water-ripple';
  polygons: readonly (readonly WorldPoint[])[];
  holes?: readonly (readonly WorldPoint[])[];
  ripple: WaterRippleStyle;
}

/** 一个场景物件同时声明物理与视觉几何，避免两套坐标漂移。 */
export interface SceneGeometryObject {
  id: string;
  colliders?: readonly CollisionShape[];
  occluder?: DepthOccluder;
  effects?: readonly SceneEffectRegion[];
}

import {
  STANDARD_PLAYER_PROFILE,
  type CollisionProfile,
  type CollisionShape,
  type DepthOccluder,
  type SceneGeometryObject,
  type SceneEffectRegion,
} from '../core/geometry.js';

export const FUXUE_WORLD_W = 736;
export const FUXUE_WORLD_H = 416;

/**
 * 角色 x/y 是脚底中心点。身体可以在物件前后重叠，只有脚下 8×5px 参与碰撞。
 * 这个配置属于“府学角色规格”，不会改变其他场景的旧碰撞手感。
 */
export const FUXUE_ACTOR_PROFILE: CollisionProfile = STANDARD_PLAYER_PROFILE;

/**
 * 府学正式背景的唯一物件几何源。
 * collider 管能否走入，occluder 管谁画在谁前面；两者可以不同，但必须共用世界坐标。
 */
export const FUXUE_GEOMETRY: readonly SceneGeometryObject[] = [
  {
    id: 'quarters-roof',
    occluder: {
      id: 'quarters-roof',
      depthY: 118,
      polygons: [[[0, 28], [196, 28], [215, 46], [207, 108], [36, 112], [0, 94]]],
    },
  },
  {
    id: 'old-tree-canopy',
    colliders: [
      { points: [[211, 154], [228, 143], [234, 194], [214, 198]] },
      { points: [[228, 143], [244, 148], [250, 190], [234, 198]] },
      { points: [[199, 190], [260, 190], [264, 221], [198, 222]] },
    ],
    occluder: {
      id: 'old-tree-canopy',
      depthY: 228,
      polygons: [
        [[178, 116], [191, 99], [215, 94], [238, 104], [246, 123],
          [235, 141], [213, 148], [190, 140], [172, 126]],
        [[224, 105], [250, 103], [278, 115], [297, 137], [289, 158],
          [267, 169], [244, 158], [232, 139]],
        [[218, 145], [243, 137], [270, 151], [291, 173], [279, 197],
          [253, 207], [232, 193], [210, 181]],
        [[211, 154], [228, 134], [244, 145], [250, 190], [241, 216],
          [215, 210], [220, 181]],
        [[199, 190], [260, 190], [264, 221], [198, 222]],
      ],
    },
  },
  {
    id: 'old-tree-west-low-branch',
    // 西南低枝的落地线取该枝最低处，而不沿用主干/树池底线；
    // 站到枝下偏西的书架走道时人物应露出，脚点退到枝北侧时仍会被枝叶遮住。
    occluder: {
      id: 'old-tree-west-low-branch',
      depthY: 193,
      polygons: [[[176, 140], [196, 128], [218, 141], [229, 161], [218, 183],
        [198, 193], [179, 181], [168, 158]]],
    },
  },
  {
    id: 'bed-frame',
    colliders: [{ points: [[31, 116], [89, 116], [92, 173], [33, 176]] }],
    occluder: {
      id: 'bed-frame',
      depthY: 176,
      polygons: [
        [[31, 116], [89, 116], [92, 173], [33, 176]],
        [[42, 120], [78, 120], [78, 154], [42, 158]],
      ],
    },
  },
  {
    id: 'chest',
    colliders: [{ points: [[95, 128], [126, 128], [126, 155], [94, 155]] }],
    occluder: {
      id: 'chest',
      depthY: 156,
      polygons: [[[95, 128], [126, 128], [126, 155], [94, 155]]],
    },
  },
  {
    id: 'room-cabinet-desk',
    colliders: [
      { x: 142, y: 116, w: 15, h: 60 },
      { points: [[159, 138], [192, 138], [192, 170], [158, 172]] },
    ],
    occluder: {
      id: 'room-cabinet-desk',
      depthY: 176,
      polygons: [
        [[142, 116], [157, 116], [157, 175], [142, 175]],
        [[159, 138], [192, 138], [192, 170], [182, 172], [158, 172]],
      ],
    },
  },
  {
    id: 'minglun-eave',
    occluder: {
      id: 'minglun-eave',
      depthY: 82,
      polygons: [[[202, 0], [502, 0], [492, 70], [216, 78]]],
    },
  },
  {
    id: 'west-gate',
    occluder: {
      id: 'west-gate',
      depthY: 346,
      polygons: [
        [[304, 212], [423, 212], [437, 230], [432, 266], [294, 266], [287, 246], [294, 226]],
        [[310, 258], [329, 258], [329, 345], [310, 345]],
        [[326, 262], [346, 264], [346, 329], [327, 320]],
        [[400, 258], [420, 258], [420, 345], [400, 345]],
        [[383, 264], [403, 262], [403, 320], [383, 329]],
        [[313, 260], [323, 260], [323, 286], [313, 286]],
        [[397, 260], [408, 260], [408, 286], [397, 286]],
      ],
    },
  },
  {
    id: 'bridge-front-rail',
    occluder: {
      id: 'bridge-front-rail',
      depthY: 232,
      polygons: [
        [[421, 193], [439, 204], [458, 210], [477, 210], [496, 201], [511, 191],
          [514, 218], [497, 230], [475, 237], [451, 233], [429, 225], [418, 214]],
        [[422, 184], [435, 184], [435, 228], [422, 228]],
        [[456, 187], [469, 187], [469, 237], [456, 237]],
        [[502, 183], [515, 183], [515, 226], [502, 226]],
      ],
    },
  },
  {
    id: 'courtyard-pond',
    effects: [{
      id: 'courtyard-pond-ripple',
      kind: 'water-ripple',
      // 点沿真实水面内缘标定，刻意避开岸石；换底图时只重标这里。
      polygons: [[
        [457, 134], [515, 125], [559, 129], [584, 143], [590, 176],
        [579, 215], [554, 244], [526, 258], [486, 260], [461, 247],
        [442, 224], [438, 194], [443, 160],
      ]],
      // 桥体从水面蒙版中扣除，波纹不会再扫过栏板与桥面。
      holes: [[
        [421, 176], [441, 168], [476, 168], [505, 180], [519, 198],
        [515, 218], [498, 234], [475, 241], [448, 236], [426, 224], [416, 210],
      ]],
      ripple: {
        color: 'rgba(190, 211, 203, .48)',
        rowSpacing: 17,
        segmentSpacing: 43,
        minLength: 7,
        maxLength: 15,
        speedMs: 420,
      },
    }],
  },
];

export const FUXUE_OBSTACLES: readonly CollisionShape[] = FUXUE_GEOMETRY
  .flatMap((object) => object.colliders ?? []);

export const FUXUE_OCCLUDERS: readonly DepthOccluder[] = FUXUE_GEOMETRY
  .flatMap((object) => object.occluder ? [object.occluder] : []);

export const FUXUE_EFFECTS: readonly SceneEffectRegion[] = FUXUE_GEOMETRY
  .flatMap((object) => object.effects ?? []);

function isConvex(points: readonly (readonly [number, number])[]): boolean {
  let sign = 0;
  for (let index = 0; index < points.length; index++) {
    const a = points[index], b = points[(index + 1) % points.length], c = points[(index + 2) % points.length];
    const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (cross === 0) continue;
    const nextSign = Math.sign(cross);
    if (sign !== 0 && nextSign !== sign) return false;
    sign = nextSign;
  }
  return sign !== 0;
}

/** 开发时尽早发现资产换版后遗留的越界、负尺寸或错误脚底盒。 */
export function validateFuxueGeometry(): string[] {
  const errors: string[] = [];
  if (FUXUE_ACTOR_PROFILE.halfW <= 0
    || FUXUE_ACTOR_PROFILE.bottomInset < 0
    || FUXUE_ACTOR_PROFILE.topInset <= FUXUE_ACTOR_PROFILE.bottomInset) {
    errors.push('actor-profile: 脚底碰撞盒尺寸无效');
  }

  for (const object of FUXUE_GEOMETRY) {
    for (const [index, shape] of (object.colliders ?? []).entries()) {
      if ('x' in shape) {
        if (shape.w <= 0 || shape.h <= 0) errors.push(`${object.id}.collider[${index}]: 尺寸必须为正数`);
        if (shape.x < 0 || shape.y < 0 || shape.x + shape.w > FUXUE_WORLD_W || shape.y + shape.h > FUXUE_WORLD_H) {
          errors.push(`${object.id}.collider[${index}]: 超出场景边界`);
        }
      } else {
        if (shape.points.length < 3) errors.push(`${object.id}.collider[${index}]: 至少需要三个点`);
        else if (!isConvex(shape.points)) errors.push(`${object.id}.collider[${index}]: 碰撞多边形必须为凸形`);
        for (const [x, y] of shape.points) {
          if (x < 0 || y < 0 || x > FUXUE_WORLD_W || y > FUXUE_WORLD_H) {
            errors.push(`${object.id}.collider[${index}]: 点 (${x}, ${y}) 超出场景边界`);
          }
        }
      }
    }

    for (const effect of object.effects ?? []) {
      if (effect.polygons.length === 0) errors.push(`${object.id}.${effect.id}: 特效区域不能为空`);
      if (effect.ripple.rowSpacing <= 0 || effect.ripple.segmentSpacing <= 0
        || effect.ripple.minLength <= 0 || effect.ripple.maxLength < effect.ripple.minLength
        || effect.ripple.speedMs <= 0) errors.push(`${object.id}.${effect.id}: 波纹参数无效`);
      for (const [group, polygons] of [['polygon', effect.polygons], ['hole', effect.holes ?? []]] as const) {
        for (const [index, polygon] of polygons.entries()) {
          if (polygon.length < 3) errors.push(`${object.id}.${effect.id}.${group}[${index}]: 至少需要三个点`);
          for (const [x, y] of polygon) {
            if (x < 0 || y < 0 || x > FUXUE_WORLD_W || y > FUXUE_WORLD_H) {
              errors.push(`${object.id}.${effect.id}.${group}[${index}]: 点 (${x}, ${y}) 超出场景边界`);
            }
          }
        }
      }
    }

    const occluder = object.occluder;
    if (!occluder) continue;
    if (occluder.id !== object.id) errors.push(`${object.id}: occluder id 不一致`);
    if (occluder.depthY < 0 || occluder.depthY > FUXUE_WORLD_H) {
      errors.push(`${object.id}: depthY 超出场景边界`);
    }
    for (const [index, polygon] of occluder.polygons.entries()) {
      if (polygon.length < 3) errors.push(`${object.id}.polygon[${index}]: 至少需要三个点`);
      for (const [x, y] of polygon) {
        if (x < 0 || y < 0 || x > FUXUE_WORLD_W || y > FUXUE_WORLD_H) {
          errors.push(`${object.id}.polygon[${index}]: 点 (${x}, ${y}) 超出场景边界`);
        }
      }
    }
  }
  return errors;
}

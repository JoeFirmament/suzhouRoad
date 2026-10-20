import { collides } from './physics.js';
import type { CollisionProfile, CollisionShape } from './geometry.js';

export interface TileSceneContract {
  map: Uint8Array;
  w: number;
  h: number;
  spawn: { x: number; y: number };
  obstacles?: readonly CollisionShape[];
}

export interface RequiredSceneFoot {
  id: string;
  x: number;
  y: number;
  radius: number;
  /** A scene spawn/respawn foot must itself be collision-free, not merely near a reachable tile. */
  mustStand?: boolean;
}

/** Runtime draft guard: every fixed story foot must remain reachable from the spawn. */
export function unreachableSceneFeet(
  scene: TileSceneContract,
  targets: readonly RequiredSceneFoot[],
  profile: CollisionProfile,
  step = 4,
): string[] {
  if (!targets.length) return [];
  if (collides(scene.map, scene.spawn.x, scene.spawn.y, scene.w, scene.h,
    scene.obstacles ?? [], profile)) return targets.map((target) => target.id);
  const remaining = new Map(targets.map((target) => [target.id, target]));
  const blockedFeet = targets.filter((target) => target.mustStand && collides(
    scene.map, target.x, target.y, scene.w, scene.h, scene.obstacles ?? [], profile,
  )).map((target) => target.id);
  if (blockedFeet.length) return blockedFeet;
  const queue: Array<readonly [number, number]> = [[scene.spawn.x, scene.spawn.y]];
  const visited = new Set<string>([`${scene.spawn.x},${scene.spawn.y}`]);
  const worldW = scene.w * 16, worldH = scene.h * 16;
  for (let cursor = 0; cursor < queue.length && remaining.size; cursor++) {
    const [x, y] = queue[cursor];
    for (const target of remaining.values()) {
      if (Math.hypot(x - target.x, y - target.y) <= target.radius) remaining.delete(target.id);
    }
    for (const [dx, dy] of [[step, 0], [-step, 0], [0, step], [0, -step]] as const) {
      const nextX = x + dx, nextY = y + dy;
      if (nextX < 0 || nextY < 0 || nextX >= worldW || nextY >= worldH) continue;
      const key = `${nextX},${nextY}`;
      if (visited.has(key) || collides(scene.map, nextX, nextY, scene.w, scene.h,
        scene.obstacles ?? [], profile)) continue;
      visited.add(key);
      queue.push([nextX, nextY]);
    }
  }
  return [...remaining.keys()];
}

/** 所有 Tile 场景共用的最低数据契约校验。 */
export function validateTileScene(
  id: string,
  scene: TileSceneContract,
  profile: CollisionProfile,
): string[] {
  const errors: string[] = [];
  if (!Number.isInteger(scene.w) || !Number.isInteger(scene.h) || scene.w <= 0 || scene.h <= 0) {
    errors.push(`${id}: 地图宽高必须为正整数`);
  }
  if (scene.map.length !== scene.w * scene.h) {
    errors.push(`${id}: map.length 与 w × h 不一致`);
  }
  if (profile.halfW <= 0 || profile.bottomInset < 0 || profile.topInset <= profile.bottomInset) {
    errors.push(`${id}: 人物脚底盒无效`);
  }
  if (collides(
    scene.map,
    scene.spawn.x,
    scene.spawn.y,
    scene.w,
    scene.h,
    scene.obstacles ?? [],
    profile,
  )) errors.push(`${id}: 出生脚点落在碰撞体内`);
  return errors;
}

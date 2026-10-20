import { SOLID } from '../data/tiles.js';
import { TILE, MAP_W, MAP_H } from '../config.js';
import {
  STANDARD_PLAYER_PROFILE,
  type CollisionProfile,
  type CollisionRect,
  type CollisionShape,
  type WorldPoint,
} from './geometry.js';

export type { CollisionProfile, CollisionRect, CollisionShape } from './geometry.js';

export interface Movable { x: number; y: number }
const DEFAULT_PROFILE: CollisionProfile = STANDARD_PLAYER_PROFILE;

function solidAt(map: Uint8Array, px: number, py: number, w: number, h: number): boolean {
  const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
  if (tx < 0 || ty < 0 || tx >= w || ty >= h) return true;
  return SOLID.has(map[ty * w + tx]);
}

function collidesRect(x: number, y: number, rect: CollisionRect, profile: CollisionProfile): boolean {
  const left = x - profile.halfW, right = x + profile.halfW;
  const top = y - profile.topInset, bottom = y - profile.bottomInset;
  return right > rect.x && left < rect.x + rect.w && bottom > rect.y && top < rect.y + rect.h;
}

function isRect(shape: CollisionShape): shape is CollisionRect {
  return 'x' in shape;
}

function project(points: readonly WorldPoint[], axisX: number, axisY: number): readonly [number, number] {
  let min = Infinity, max = -Infinity;
  for (const [x, y] of points) {
    const value = x * axisX + y * axisY;
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  return [min, max];
}

/** 凸多边形 SAT；边缘恰好接触不算穿入，和矩形碰撞语义一致。 */
function convexPolygonsOverlap(a: readonly WorldPoint[], b: readonly WorldPoint[]): boolean {
  for (const polygon of [a, b]) {
    for (let index = 0; index < polygon.length; index++) {
      const p = polygon[index], q = polygon[(index + 1) % polygon.length];
      const axisX = -(q[1] - p[1]), axisY = q[0] - p[0];
      const [minA, maxA] = project(a, axisX, axisY);
      const [minB, maxB] = project(b, axisX, axisY);
      if (maxA <= minB || maxB <= minA) return false;
    }
  }
  return true;
}

function collidesShape(x: number, y: number, shape: CollisionShape, profile: CollisionProfile): boolean {
  if (isRect(shape)) return collidesRect(x, y, shape, profile);
  if (shape.points.length < 3) return false;
  const left = x - profile.halfW, right = x + profile.halfW;
  const top = y - profile.topInset, bottom = y - profile.bottomInset;
  const actor: readonly WorldPoint[] = [[left, top], [right, top], [right, bottom], [left, bottom]];
  return convexPolygonsOverlap(actor, shape.points);
}

export function collides(
  map: Uint8Array,
  x: number,
  y: number,
  w: number = MAP_W,
  h: number = MAP_H,
  obstacles: readonly CollisionShape[] = [],
  profile: CollisionProfile = DEFAULT_PROFILE,
): boolean {
  return obstacles.some((shape) => collidesShape(x, y, shape, profile)) || (
    solidAt(map, x - profile.halfW, y - profile.bottomInset, w, h)
    || solidAt(map, x + profile.halfW, y - profile.bottomInset, w, h)
    || solidAt(map, x - profile.halfW, y - profile.topInset, w, h)
    || solidAt(map, x + profile.halfW, y - profile.topInset, w, h)
  );
}

/** 分轴移动 + 碰撞回退。贴墙滑行由分轴天然获得。 */
export function moveEntity(
  map: Uint8Array,
  p: Movable,
  dx: number,
  dy: number,
  w: number = MAP_W,
  h: number = MAP_H,
  obstacles: readonly CollisionShape[] = [],
  profile: CollisionProfile = DEFAULT_PROFILE,
): void {
  if (dx !== 0) {
    const ox = p.x; p.x += dx;
    if (collides(map, p.x, p.y, w, h, obstacles, profile)) p.x = ox;
  }
  if (dy !== 0) {
    const oy = p.y; p.y += dy;
    if (collides(map, p.x, p.y, w, h, obstacles, profile)) p.y = oy;
  }
}

import { px, type Ctx } from './pixel.js';
import { drawWaterRipples } from './effects.js';
import type { DepthOccluder } from '../core/geometry.js';
import type { SceneEffectRegion, SceneGeometryObject } from '../core/geometry.js';
import {
  FUXUE_ACTOR_PROFILE,
  FUXUE_EFFECTS,
  FUXUE_GEOMETRY,
  FUXUE_WORLD_H,
  FUXUE_WORLD_W,
} from '../data/fuxue-geometry.js';

export const FUXUE_ART_W = FUXUE_WORLD_W;
export const FUXUE_ART_H = FUXUE_WORLD_H;

const scene = new Image();
scene.src = '../assets/fuxue/fuxue-west-home-game-v2.png';

const shenSprite = new Image();
shenSprite.src = '../assets/characters/shen-yanqiu-sprites-v1.png';
const SPRITE_CELL = 362;

export function drawFuxueScene(g: Ctx, cam: { x: number; y: number }): void {
  g.fillStyle = '#20231f';
  g.fillRect(0, 0, FUXUE_ART_W, FUXUE_ART_H);
  if (scene.complete && scene.naturalWidth) {
    g.drawImage(scene, 0, 0, scene.naturalWidth, scene.naturalHeight, -cam.x, -cam.y, FUXUE_ART_W, FUXUE_ART_H);
  }
}

export function drawFuxueOccluder(g: Ctx, cam: { x: number; y: number }, occluder: DepthOccluder): void {
  if (!scene.complete || !scene.naturalWidth) return;
  g.save();
  g.beginPath();
  for (const polygon of occluder.polygons) {
    polygon.forEach(([x, y], index) => {
      const sx = Math.round(x - cam.x);
      const sy = Math.round(y - cam.y);
      if (index === 0) g.moveTo(sx, sy);
      else g.lineTo(sx, sy);
    });
    g.closePath();
  }
  g.clip();
  g.drawImage(
    scene,
    0, 0, scene.naturalWidth, scene.naturalHeight,
    -cam.x, -cam.y, FUXUE_ART_W, FUXUE_ART_H,
  );
  g.restore();
}

/** `?debug=geometry`：把美术、碰撞、遮挡和脚点放在同一画面核对。 */
export function drawFuxueGeometryDebug(
  g: Ctx,
  cam: { x: number; y: number },
  actor: { x: number; y: number },
  geometry: readonly SceneGeometryObject[] = FUXUE_GEOMETRY,
): void {
  g.save();
  g.lineWidth = 1;

  for (const object of geometry) {
    for (const shape of object.colliders ?? []) {
      g.fillStyle = 'rgba(225, 54, 54, .26)';
      g.strokeStyle = '#ef5350';
      if ('x' in shape) {
        const x = Math.round(shape.x - cam.x);
        const y = Math.round(shape.y - cam.y);
        g.fillRect(x, y, shape.w, shape.h);
        g.strokeRect(x + .5, y + .5, shape.w - 1, shape.h - 1);
      } else {
        g.beginPath();
        shape.points.forEach(([worldX, worldY], index) => index === 0
          ? g.moveTo(Math.round(worldX - cam.x), Math.round(worldY - cam.y))
          : g.lineTo(Math.round(worldX - cam.x), Math.round(worldY - cam.y)));
        g.closePath(); g.fill(); g.stroke();
      }
    }

    const occluder = object.occluder;
    if (occluder) {
      let minX = Infinity;
      let maxX = -Infinity;
      g.strokeStyle = '#35d8e6';
      g.fillStyle = 'rgba(53, 216, 230, .08)';
      for (const polygon of occluder.polygons) {
        g.beginPath();
        polygon.forEach(([worldX, worldY], index) => {
          minX = Math.min(minX, worldX);
          maxX = Math.max(maxX, worldX);
          const x = Math.round(worldX - cam.x);
          const y = Math.round(worldY - cam.y);
          if (index === 0) g.moveTo(x, y);
          else g.lineTo(x, y);
        });
        g.closePath();
        g.fill();
        g.stroke();
      }
      g.strokeStyle = '#f4d35e';
      g.beginPath();
      g.moveTo(Math.round(minX - cam.x), Math.round(occluder.depthY - cam.y) + .5);
      g.lineTo(Math.round(maxX - cam.x), Math.round(occluder.depthY - cam.y) + .5);
      g.stroke();
    }

    for (const effect of object.effects ?? []) {
      g.fillStyle = 'rgba(54, 126, 255, .14)';
      g.strokeStyle = '#4c8dff';
      for (const polygon of effect.polygons) {
        g.beginPath();
        polygon.forEach(([worldX, worldY], index) => index === 0
          ? g.moveTo(Math.round(worldX - cam.x), Math.round(worldY - cam.y))
          : g.lineTo(Math.round(worldX - cam.x), Math.round(worldY - cam.y)));
        g.closePath(); g.fill(); g.stroke();
      }
      g.strokeStyle = '#ff9d45';
      for (const polygon of effect.holes ?? []) {
        g.beginPath();
        polygon.forEach(([worldX, worldY], index) => index === 0
          ? g.moveTo(Math.round(worldX - cam.x), Math.round(worldY - cam.y))
          : g.lineTo(Math.round(worldX - cam.x), Math.round(worldY - cam.y)));
        g.closePath(); g.stroke();
      }
    }
  }

  const left = Math.round(actor.x - FUXUE_ACTOR_PROFILE.halfW - cam.x);
  const top = Math.round(actor.y - FUXUE_ACTOR_PROFILE.topInset - cam.y);
  const width = FUXUE_ACTOR_PROFILE.halfW * 2;
  const height = FUXUE_ACTOR_PROFILE.topInset - FUXUE_ACTOR_PROFILE.bottomInset;
  g.fillStyle = 'rgba(231, 74, 255, .38)';
  g.strokeStyle = '#f263ff';
  g.fillRect(left, top, width, height);
  g.strokeRect(left + .5, top + .5, width - 1, height - 1);
  const footX = Math.round(actor.x - cam.x);
  const footY = Math.round(actor.y - cam.y);
  g.strokeStyle = '#ffffff';
  g.beginPath();
  g.moveTo(footX - 3, footY + .5);
  g.lineTo(footX + 3, footY + .5);
  g.moveTo(footX + .5, footY - 3);
  g.lineTo(footX + .5, footY + 3);
  g.stroke();
  g.restore();
}

export function drawFuxueWater(
  g: Ctx,
  cam: { x: number; y: number },
  now: number,
  effects: readonly SceneEffectRegion[] = FUXUE_EFFECTS,
): void {
  drawWaterRipples(g, effects, cam, now);
}

export function drawShen(g: Ctx, x: number, y: number, cam: { x: number; y: number }, now: number): void {
  const X = Math.round(x - cam.x), Y = Math.round(y - cam.y);
  const frame = Math.floor(now / 700) % 2;
  g.fillStyle = 'rgba(20,22,19,.25)';
  g.fillRect(X - 6, Y - 1, 12, 2);
  if (shenSprite.complete && shenSprite.naturalWidth) {
    g.drawImage(shenSprite, frame * SPRITE_CELL, 0, SPRITE_CELL, SPRITE_CELL, X - 9, Y - 24, 18, 24);
    return;
  }
  px(g, X - 4, Y - 12, 8, 11, '#516b62');
  px(g, X - 3, Y - 18, 6, 6, '#c9b99e');
}

export function drawInteractionMark(g: Ctx, x: number, y: number, cam: { x: number; y: number }, now: number): void {
  const X = Math.round(x - cam.x), Y = Math.round(y - cam.y - 24 - (Math.sin(now / 220) > 0 ? 1 : 0));
  px(g, X - 4, Y, 8, 8, '#242620');
  px(g, X - 3, Y + 1, 6, 6, '#a78d55');
  g.fillStyle = '#242620';
  g.font = '6px monospace';
  g.fillText('E', X - 2, Y + 6);
}

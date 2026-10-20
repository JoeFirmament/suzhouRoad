import { drawRainShadow } from './liuyuan-rain-shadow.js';
import type { RainShadow } from '../core/liuyuan-rain-shadow.js';

/** Fixed output, fixed logical game. Integer scale preserves pixel shapes;
 * the extra paper margin is not additional walkable space. */
export const RAIN_VIEWPORT={width:1280,height:720,scale:3,left:160,top:48} as const;
export function rainDragDelta(dx:number,dy:number,width:number,height:number):{x:number;y:number} {
  if(width<=0||height<=0) return {x:0,y:0};
  return {x:dx*RAIN_VIEWPORT.width/(width*RAIN_VIEWPORT.scale),
    y:dy*RAIN_VIEWPORT.height/(height*RAIN_VIEWPORT.scale)};
}
export function drawRainViewport(ctx:CanvasRenderingContext2D,s:RainShadow,
  scholar?:HTMLImageElement,quiet=false,background?:HTMLImageElement,foreground?:HTMLImageElement):void {
  ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;
  ctx.fillStyle='#f0eee3';ctx.fillRect(0,0,RAIN_VIEWPORT.width,RAIN_VIEWPORT.height);
  ctx.save();ctx.translate(RAIN_VIEWPORT.left,RAIN_VIEWPORT.top);ctx.scale(RAIN_VIEWPORT.scale,RAIN_VIEWPORT.scale);
  drawRainShadow(ctx,s,scholar,quiet,background,foreground);ctx.restore();
}

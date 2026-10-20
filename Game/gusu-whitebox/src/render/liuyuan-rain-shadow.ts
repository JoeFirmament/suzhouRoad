import { RAIN_ROUND_NAMES, rainDuration, rainRoundCount,
  rainWindow, rainPickupSeconds, rainSecondsLeft, rainHealthCapacity,
  rainStoryStage, STORY_RAIN_STAGES, rainCatPosition, rainCatDuration, rainHitGrace, type RainShadow } from '../core/liuyuan-rain-shadow.js';
import { drawScholarAtFoot } from './scholar-sprite.js';
import { drawRainCat, drawRainCatPounceHint, drawRainSketch, RAIN_DRAWING_NAMES } from './rain-shadow-vignettes.js';
import { drawRainInkBand, drawRainInkMargins, drawRainGapHint } from './rain-shadow-ink.js';

export const RAIN_BACKGROUND_OPACITY=.4;
export const RAIN_BAMBOO_DEPTH=152;

/** Original pixel overlays; optional generated art-study backdrop is not a
 * historical scene plate and never changes player scale or collision. */
export function drawRainShadow(ctx: CanvasRenderingContext2D, s: RainShadow, scholar?: HTMLImageElement,
  quiet = false, backdrop?: HTMLImageElement,foreground?:HTMLImageElement): void {
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha=1;
  const rect = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), w, h);
  };
  const entities:Array<{depth:number;paint:()=>void}>=[];
  rect(0, 0, 320, 208, '#f0eee3');
  const artReady=!!backdrop?.complete && backdrop.naturalWidth>0 && backdrop.naturalHeight>0;
  if(artReady) {
    ctx.globalAlpha=RAIN_BACKGROUND_OPACITY;ctx.drawImage(backdrop!,0,0,320,208);
    ctx.globalAlpha=1; // Background wash must never fade actors, rain or UI.
  }
  else {
    // Quiet roof-free fallback; the open ground is the gameplay plane.
    drawRainInkMargins(ctx,s.total,quiet);
    for(let x=24;x<296;x+=52) for(let y=64;y<184;y+=40) {
      rect(x,y,19+(x+y)%9,1,'#cbd0c2');rect(x+7,y+2,9,1,'#d6dacc');
    }
  }
  const stage = rainStoryStage(s);
  // The DOM HUD already names the stage/count. Keep the art-study eave visible.
  if(!artReady) {
    ctx.fillStyle = '#465b50'; ctx.font = '10px monospace';
    ctx.fillText(s.story ? '雨中抢画' : RAIN_ROUND_NAMES[s.round], 12, 15);
    ctx.fillText(s.phase === 'won' ? '已护好' : s.collected ? s.story ? `${stage+1}/3 ${STORY_RAIN_STAGES[stage].name}` : '护画避雨' : '先捡画稿', 172, 15);
    ctx.fillText(`${s.marks}/${rainRoundCount(s)}`, 280, 15);
  }
  const light = rainWindow(s);
  if (!s.collected || s.rainTime < 1.2) {
    // The drawing itself is gold; no rectangular pool of painted "light".
    if (!s.collected) {
      // Original practice drawing, dropped by the cat; never a source-book scan.
      const progress = Math.min(1, s.time / .7);
      const fall = s.phase === 'ready' || quiet ? 0 : -24 * (1 - progress * progress);
      const sway = s.phase === 'running' && !quiet && s.time < .7 ? Math.round(Math.sin(progress * Math.PI * 2) * 2) : 0;
      rect(light.x - 9, light.y + 7, 20, 2, '#a9ac99');
      rect(light.x - 10 + sway, light.y - 7 + fall, 20, 14, '#f2e7c9');
      rect(light.x - 9 + sway, light.y - 6 + fall, 18, 1, '#fbf0d5');
      rect(light.x - 9 + sway, light.y + 5 + fall, 18, 1, '#d2c3a0');
      rect(light.x - 11 + sway, light.y - 8 + fall, 2, 16, '#a28b63');
      rect(light.x + 9 + sway, light.y - 8 + fall, 2, 16, '#a28b63');
      drawRainSketch(ctx, s.round, light.x - 9 + sway, light.y - 6 + fall, 18, 12);
      if (!quiet && s.phase === 'running' && s.time >= .7 && s.time < 1) {
        const spread = 13 + (s.time - .7) * 20;
        rect(light.x-spread,light.y+8,3,1,'#aa9b78'); rect(light.x+spread,light.y+8,3,1,'#aa9b78');
      }
    }
    ctx.fillStyle = s.collected ? '#536a50' : '#795b2d'; ctx.font = '9px monospace';
    ctx.fillText(s.collected ? '已捡' : '捡画', light.x - 9, light.y + 23);
  }
  if (!s.cat || s.phase === 'won') {
    // The same cat rests at the boundary between its five clearly warned leaps.
    const side = light.x > 160 ? 1 : -1;
    const t = s.collected ? quiet ? 1 : Math.min(1, s.rainTime / 1.2) : 0;
    const start = light.x + side * 23;
    const cx = start + ((side > 0 ? 306 : 14) - start) * t;
    const cy = light.y + 1 + (168 - light.y - 1) * t;
    const pose = t > 0 && t < 1 ? 'walk' : t === 1 && Math.floor(s.total) % 4 === 2 ? 'groom'
      : !s.collected && s.phase === 'running' && s.time < .35 ? 'paw' : 'sit';
    entities.push({depth:cy,paint:()=>{
    drawRainCat(ctx, cx, cy, t > 0 && t < 1 ? side : -side, quiet ? 'sit' : pose, quiet ? 0 : s.total);
    if (s.phase === 'ready' || !s.collected && s.time >= .7 && s.time < 1.5) {
      rect(cx-11,cy-33,23,11,'#eee8d9');
      ctx.fillStyle='#596d5c'; ctx.font='8px monospace'; ctx.fillText('喵？',cx-7,cy-25);
    }
    }});
  }
  // Floor hints go beneath rain/player, so they cannot erase a safe gap or hit dot.
  if(s.cat && s.phase!=='won') drawRainCatPounceHint(ctx,s.cat,quiet);
  for (const b of s.phase === 'won' ? [] : s.bands) {
    if (b.age < b.warning) {
      drawRainGapHint(ctx,b);
      const isY=b.axis==='y';
      ctx.fillStyle = '#586c63'; ctx.font = '12px monospace';
      ctx.fillText(isY ? b.sign > 0 ? '↓' : '↑' : b.sign > 0 ? '→' : '←', isY ? 155 : b.sign > 0 ? 8 : 301, isY ? b.sign > 0 ? 30 : 199 : 108);
      continue;
    }
    drawRainInkBand(ctx,b,quiet);
    drawRainGapHint(ctx,b);
  }
  if (s.cat && s.phase !== 'won') {
    const cat = s.cat, p = rainCatPosition(cat), warning = cat.age < cat.warning;
    const active = cat.age < cat.warning + rainCatDuration(cat);
    const horizontal = cat.fromX !== cat.toX;
    const facing = horizontal ? Math.sign(cat.toX-cat.fromX) : cat.fromX < 160 ? 1 : -1;
    entities.push({depth:p.y+6,paint:()=>{
    if (!warning && active && !quiet) {
      const sign=horizontal?Math.sign(cat.toX-cat.fromX):Math.sign(cat.toY-cat.fromY);
      for (let i=1;i<=3;i++) rect(p.x-(horizontal?sign*i*7:0),p.y-(horizontal?0:sign*i*7),3,1,'#b6ad94');
    }
    // Essential telegraph, movement and hit core stay visible in reduced-motion.
    const puzzled=!active && Math.hypot(s.x-p.x,s.y-p.y)>16;
    drawRainCat(ctx,p.x,p.y+6,facing,warning?'crouch':active?'pounce':puzzled&&!quiet?'look':'groom',quiet?0:s.total);
    if(puzzled&&!quiet) {
      ctx.fillStyle='#6f7462';ctx.font='8px monospace';
      ctx.fillText('咦？',Math.max(25,Math.min(273,p.x-7)),Math.max(44,p.y-19));
    }
    if(active&&!warning) rect(p.x-3,p.y-2,6,4,'#a88961');
    }});
  }
  if (s.collected && s.rainTime < .65 && !quiet) {
    const t = Math.min(1, s.rainTime / .4);
    const px = light.x + (s.x-light.x)*t, py = light.y + (s.y-18-light.y)*t;
    rect(px-4,py-3,8,6,'#efe3c4');
    ctx.fillStyle='#6e795e'; ctx.font='9px monospace';
    ctx.fillText(s.story ? '拾起兰稿' : `拾起${RAIN_DRAWING_NAMES[s.round]}`,Math.max(25,Math.min(246,s.x-20)),Math.max(43,s.y-25-s.rainTime*8));
  }
  // Foot shadow, tiny scholar outline and clearly visible 4px core.
  entities.push({depth:s.y+6,paint:()=>{
  if (!(s.phase==='running' && s.invulnerable > 0 && Math.floor(s.total * 14) % 2)) {
    rect(s.x - 6, s.y + 5, 12, 2, '#899783');
    if (scholar?.complete && scholar.naturalWidth) {
      // A crisp one-pixel silhouette edge, not a glow or resized sprite.
      ctx.save();ctx.shadowBlur=0;ctx.shadowColor='#344d42';
      for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        ctx.shadowOffsetX=dx;ctx.shadowOffsetY=dy;
        drawScholarAtFoot(ctx,scholar,s.direction,s.moving?1+Math.floor(s.total*7)%2:0,s.x,s.y+6,22);
      }
      ctx.restore();
      drawScholarAtFoot(ctx, scholar, s.direction, s.moving ? 1 + Math.floor(s.total * 7) % 2 : 0, s.x, s.y + 6, 22);
    } else {
      rect(s.x - 3, s.y - 10, 6, 4, '#40564d'); rect(s.x - 2, s.y - 6, 4, 3, '#d8c3a2');
      rect(s.x - 5, s.y - 3, 10, 9, '#4e7167');
    }
    if (s.collected) {
      rect(s.x + 4, s.y - 7, 5, 7, '#ebdfc2'); rect(s.x + 4, s.y - 5, 3, 1, '#7d8771');
      rect(s.x+4,s.y-7,5,1,'#fbefce'); rect(s.x+8,s.y-6,1,6,'#b5a47e'); rect(s.x+5,s.y-1,3,1,'#c4b390');
    }
    rect(s.x-3,s.y-3,6,6,'#344d42');
    rect(s.x - 2, s.y - 2, 4, 4, '#f4ecce');
    // Held at the side in ordinary movement; raised above the drawing during
    // the existing short guard. Merely carrying it grants no constant shield.
    const ux=s.x+(s.shield>0?0:8),uy=s.y-22;
    for(let dy=0;dy<5;dy++) {
      const w=[3,6,9,11,10][dy];
      rect(ux-w,uy+dy,w*2+1,1,dy===4?'#69765c':'#e3d6ad');
      rect(ux,uy+dy,1,1,'#a89a76');
    }
    rect(ux,uy+5,1,10,'#74684c');
  }
  if (s.shield > 0) {
    // The same short guard, now presented as briefly steadying the umbrella.
    for (const dx of [-11,9]) { rect(s.x+dx,s.y-12,2,4,'#b39864'); rect(s.x+dx,s.y+7,2,3,'#b39864'); }
  }
  if (s.collected && s.hits > 0 && s.invulnerable > Math.max(0,rainHitGrace(s)-.4)) {
    const age = rainHitGrace(s)-s.invulnerable;
    if (!quiet) for (const sign of [-1,1]) {
      rect(s.x+sign*(7+age*22),s.y-6-age*10,2,2,'#779197');
      rect(s.x+sign*(11+age*16),s.y+2+age*6,1,2,'#96a7a4');
    }
    ctx.fillStyle='#875d59'; ctx.font='8px monospace';
    ctx.fillText(s.lastHit==='cat'?'猫扑 HP −1':'雨淋 HP −1',Math.max(25,Math.min(245,s.x-24)),Math.max(42,s.y-23));
  }
  }});
  if(artReady&&foreground?.complete&&foreground.naturalWidth&&foreground.naturalHeight) {
    entities.push({depth:RAIN_BAMBOO_DEPTH,paint:()=>{
      ctx.save();ctx.globalAlpha=.55;ctx.drawImage(foreground,0,0,320,208);ctx.restore();ctx.globalAlpha=1;
    }});
  }
  entities.sort((a,b)=>a.depth-b.depth).forEach(entity=>entity.paint());
  rect(18,188,286,19,'#e9e6da');
  for (let i = 0; i < rainHealthCapacity(s); i++) {
    const x=24+i*12,color=i<s.health?'#9a6c65':'#c4c4b6';
    // Three original pixel hearts, on the same grid as the actor and cat.
    rect(x,196,3,2,color);rect(x+5,196,3,2,color);rect(x,198,8,2,color);
    rect(x+1,200,6,1,color);rect(x+2,201,4,1,color);rect(x+3,202,2,1,color);
  }
  ctx.fillStyle = '#52675c'; ctx.font = '8px monospace';
  ctx.fillText(`HP ${s.health}/${rainHealthCapacity(s)}`, 24, 194);
  ctx.fillText(`${s.collected ? '避雨' : '捡画'} ${rainSecondsLeft(s)} 秒`, 132, 194);
  ctx.fillText(s.cooldown > 0 ? '护画回气' : '护画可用', 232, 194);
  const remaining = s.collected ? 1 - s.rainTime / rainDuration(s) : 1 - s.time / rainPickupSeconds(s);
  rect(132, 197, 76, 3, '#bbc2b3'); rect(132, 197, Math.round(76 * Math.max(0, remaining)), 3, '#788b79');
  if(s.story) for (const part of STORY_RAIN_STAGES.slice(1)) rect(132+76*part.start/rainDuration(s),197,1,3,'#e6e3d5');
  rect(232, 197, 64, 3, '#bbc2b3'); rect(232, 197, Math.round(64 * (1 - s.cooldown / 2)), 3, '#aa9164');
  if (s.phase !== 'running' && !(artReady && (s.phase==='ready'||s.phase==='paused'))) {
    // Keep the picture/actor visible while paused; no full-screen flash or shake.
    const y = s.phase === 'ready' ? 47 : s.phase === 'paused' ? 25 : 81;
    rect(76,y,168,28,'#eee8d9'); rect(76,y,168,1,'#a7b49f');
    ctx.fillStyle = '#465a50'; ctx.font = '11px monospace';
    ctx.fillText({ ready: '猫拨画 · 拾画避雨', paused: '稍歇 · 时间已停', won: s.story ? '兰稿已抢回檐下' : '六页画稿都拾回了', lost: '再试一回' }[s.phase], 91,y+18);
    if (s.phase === 'won') {
      rect(151,117,18,18,'#ae7d66'); rect(153,119,14,14,'#ede2ca');
      ctx.fillStyle='#97664f'; ctx.font='9px monospace'; ctx.fillText('好',155,129);
      ctx.fillStyle='#5a6d5d'; ctx.font='9px monospace'; ctx.fillText('猫：不是我。',119,153);
    }
  }
}

import { RAIN_FIELD, rainRoundCount, rainCatDuration, type RainShadow, type RainCatPounce } from '../core/liuyuan-rain-shadow.js';

/** Read-only telegraph: the last silhouette always shows the locked landing point. */
export function rainCatShadowMarks(cat: RainCatPounce): Array<{ x: number; y: number; t: number }> {
  const distance=Math.hypot(cat.toX-cat.fromX,cat.toY-cat.fromY);
  const count=Math.max(1,Math.min(3,Math.ceil(distance/28)));
  return Array.from({length:count},(_,i)=>{
    const t=(i+1)/count;
    return {x:cat.fromX+(cat.toX-cat.fromX)*t,y:cat.fromY+(cat.toY-cat.fromY)*t,t};
  });
}
export function drawRainCatPounceHint(ctx: CanvasRenderingContext2D, cat: RainCatPounce, quiet=false): void {
  if(cat.age>=cat.warning) return;
  const dx=Math.sign(cat.toX-cat.fromX),dy=Math.sign(cat.toY-cat.fromY);
  const progress=quiet ? .75 : Math.min(1,cat.age/cat.warning);
  // Flat, single-colour pixel silhouettes: body, pointed ears, reaching paws, curled tail.
  // Rotate the floor silhouette, never rotate the actual 2.5D cat sprite.
  const pieces=[[ -5,-2,10,5],[4,-3,5,5],[4,-5,2,2],[7,-5,2,2],
    [7,2,5,2],[3,4,4,1],[-6,3,3,2],[-10,-2,4,2],[-10,-5,2,3]];
  for(const mark of rainCatShadowMarks(cat)) {
    ctx.fillStyle=mark.t===1 ? progress>.8?'#968a75':'#a69c86'
      : mark.t<=progress?'#b4ac98':'#c5c0b1';
    for(const [u,v,w,h] of pieces) for(let a=0;a<w;a++) for(let b=0;b<h;b++) {
      const x=Math.round(mark.x+dx*(u+a)-dy*(v+b));
      const y=Math.round(mark.y+dy*(u+a)+dx*(v+b));
      if(x>=RAIN_FIELD.left && x<RAIN_FIELD.right && y>=RAIN_FIELD.top && y<RAIN_FIELD.bottom)
        ctx.fillRect(x,y,1,1);
    }
  }
}

/** Original practice sketches, not historical garden specimens or book copies. */
export const RAIN_DRAWING_NAMES = ['兰叶', '竹枝', '梅梢', '叠石', '蕉叶', '荷叶'] as const;
type Segment = readonly [number, number, number, number];
const SKETCHES: readonly (readonly Segment[])[] = [
  [[8,19,9,9],[9,9,5,4],[5,4,2,8],[9,19,13,5],[13,5,17,3],[10,19,18,10],[18,10,21,12],[9,17,3,11]],
  [[7,20,8,2],[7,8,17,6],[8,12,3,9],[8,16,18,14],[12,7,11,3],[14,7,18,3],[15,14,20,11],[5,10,2,5]],
  [[3,19,8,14],[8,14,11,8],[11,8,17,5],[17,5,21,3],[11,8,9,3],[8,14,17,13],[17,13,20,9]],
  [[2,18,4,12],[4,12,8,9],[8,9,11,15],[11,15,9,19],[2,18,9,19],[9,19,18,18],[18,18,21,10],
    [21,10,17,8],[17,8,14,12],[14,12,12,5],[12,5,8,3],[8,3,5,10],[9,6,10,10],[16,13,18,11]],
  [[10,20,11,7],[11,7,8,3],[8,3,3,5],[3,5,6,10],[6,10,11,7],[11,7,17,2],[17,2,21,6],
    [21,6,16,10],[16,10,11,7],[11,11,17,12],[17,12,20,16],[20,16,13,15],[13,15,11,11]],
  [[6,20,8,10],[8,10,4,7],[4,7,2,11],[2,11,6,14],[6,14,12,12],[12,12,14,8],[14,8,8,7],
    [15,20,17,9],[17,9,15,5],[15,5,19,2],[19,2,22,6],[22,6,17,9],[3,19,10,18]],
];
export function rainAlbumState(s: RainShadow): { complete: number; held: number | null } {
  return { complete: s.phase === 'won' ? rainRoundCount(s) : s.round,
    held: s.collected && s.phase !== 'won' ? s.round : null };
}
export function drawRainSketch(ctx: CanvasRenderingContext2D, index: number, x: number, y: number, w: number, h: number): void {
  if (index === 0) {
    // Same original orchid clusters as the existing journal reward, reduced here.
    const clusters: Array<[string, number[][]]> = [
      ['#536655', [[70,72,4,12],[66,62,4,12],[62,52,4,12],[54,42,8,4],[44,36,10,4],[32,34,12,3]]],
      ['#334e43', [[74,64,3,20],[77,50,3,16],[80,38,3,14],[83,28,3,12],[86,20,3,10]]],
      ['#6e7e5f', [[76,76,5,8],[81,64,4,12],[85,56,4,10],[89,48,6,8],[95,44,12,4],[107,46,10,3]]],
      ['#738269', [[67,78,3,6],[62,72,5,4],[55,68,7,3],[44,67,11,2],[34,70,10,2]]],
      ['#536655', [[92,68,2,16],[94,57,2,12],[96,48,2,11],[97,43,3,6]]],
      ['#aa8266', [[94,38,4,8],[98,40,8,3],[91,44,6,3],[98,45,3,6]]],
      ['#a5624b', [[121,75,8,2],[121,79,8,2],[121,83,8,2],[120,73,2,14],[129,73,2,14]]],
    ];
    for (const [color, points] of clusters) {
      ctx.fillStyle = color;
      for (const [px,py,pw,ph] of points) ctx.fillRect(Math.round(x + px * w / 160), Math.round(y + py * h / 104),
        Math.max(1,Math.round(pw * w / 160)), Math.max(1,Math.round(ph * h / 104)));
    }
    return;
  }
  // Rasterise strokes ourselves: no antialiased curves or borrowed raster assets.
  ctx.fillStyle = '#637267';
  for (const [ax, ay, bx, by] of SKETCHES[index % SKETCHES.length]) {
    const length = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
    for (let i = 0; i <= length; i++) {
      const t = length ? i / length : 0;
      ctx.fillRect(Math.round(x + (ax + (bx - ax) * t) * w / 24),
        Math.round(y + (ay + (by - ay) * t) * h / 22), 1, 1);
    }
  }
  if (index === 2) {
    ctx.fillStyle = '#aa877e';
    for (const [px, py] of [[9,3],[17,5],[20,9]]) ctx.fillRect(Math.round(x + px * w / 24), Math.round(y + py * h / 22), 2, 2);
  }
  ctx.fillStyle = '#a7745e'; ctx.fillRect(Math.round(x + w - 3), Math.round(y + h - 3), 2, 2);
}
export function drawRainAlbum(ctx: CanvasRenderingContext2D, s: RainShadow, quiet = false): void {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#e5e1d5'; ctx.fillRect(0, 0, 320, 43);
  const { complete, held } = rainAlbumState(s);
  if (s.story) {
    ctx.fillStyle = '#bdb69e'; ctx.fillRect(6, 4, 55, 36);
    ctx.fillStyle = '#f1e9d7'; ctx.fillRect(5, 2, 55, 36);
    ctx.fillStyle = '#f8eed9'; ctx.fillRect(6,3,53,1);
    drawRainSketch(ctx, 0, 6, 3, 52, 33);
    ctx.fillStyle = '#53675b'; ctx.font = '10px monospace';
    ctx.fillText(complete ? '兰稿护好了 · 等你收好' : held !== null ? '兰稿在手中 · 正在护画' : '花匠的兰稿 · 先把纸页拾起', 70, 16);
    ctx.font = '8px monospace';
    ctx.fillText(complete ? '猫蹲回檐下，像什么也没做。' : s.cat
      ? s.cat.age < s.cat.warning ? '猫伏身！侧移让开，护画不挡猫。'
        : s.cat.age < s.cat.warning + rainCatDuration(s.cat) ? '猫扑来了！让开刚才的猫影。'
          : Math.hypot(s.x-s.cat.toX,s.y-s.cat.toY)>16 ? '猫歪头：咦？……还得看雨缝。' : '猫落回石地，还得看雨缝。'
      : '拾画 → 避雨、让猫 → 收好', 70, 31);
    drawRainCat(ctx,302,35,-1,complete && !quiet ? 'groom' : 'sit',quiet ? 0 : s.total);
    return;
  }
  for (let i = 0; i < rainRoundCount(s); i++) {
    const x = 5 + i * 53, arrived = i < complete, inHand = i === held;
    ctx.fillStyle = arrived || inHand ? '#f1e9d7' : '#d7d8cb'; ctx.fillRect(x, 2, 45, 27);
    ctx.fillStyle = inHand ? '#b19962' : arrived ? '#6f8771' : '#b7bdae';
    ctx.fillRect(x, 2, 45, 1); ctx.fillRect(x, 28, 45, 1);
    if (arrived || inHand || i === s.round) drawRainSketch(ctx, i, x + 6, 4, 31, 23);
    else { ctx.fillStyle = '#bdc4b5'; ctx.fillRect(x + 18, 12, 8, 1); }
    if (arrived) {
      ctx.fillStyle = '#799078'; ctx.fillRect(x + 37, 4, 5, 5);
      ctx.fillStyle = '#eee9d9'; ctx.fillRect(x + 38, 6, 1, 1); ctx.fillRect(x + 39, 5, 2, 1);
    }
    ctx.font = '8px monospace'; ctx.fillStyle = '#53675b';
    ctx.fillText(`${RAIN_DRAWING_NAMES[i]}${inHand ? '·手中' : arrived ? '·入册' : '·待拾'}`, x + 1, 39);
  }
}
export function drawRainCat(ctx: CanvasRenderingContext2D, x: number, y: number,
  facing: number, pose: 'paw' | 'walk' | 'sit' | 'groom' | 'crouch' | 'pounce' | 'look', time: number): void {
  const pixel = (dx: number, dy: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color; ctx.fillRect(Math.round(x + (dx+(pose==='look'&&dy<-8?1:0)) * facing - (facing < 0 ? w : 0)),
      Math.round(y + dy + ((pose === 'crouch' || pose === 'pounce') && dy < -8 ? 4 : pose==='look'&&dy<-8?1:0)), w, h);
  };
  const gait = pose === 'walk' ? Math.floor(time * 12) % 2 * 2 : 0;
  const blink = Math.floor(time * 2) % 9 === 8;
  pixel(-8, 0, 16, 2, '#87917c');
  // A quiet ink contour separates the tabby from pale bamboo/stone textures.
  // The old pose, foot anchor, facing and sprite scale are unchanged.
  pixel(-7,-8,15,8,'#52584a');pixel(-5,-10,11,2,'#52584a');
  pixel(-1,-16,11,8,'#52584a');pixel(1,-18,7,2,'#52584a');
  pixel(-6, -9, 13, 8, '#b8aa8b'); pixel(-5, -8, 4, 5, '#69715c');
  pixel(-5,-10,10,1,'#e2d5b9'); pixel(-3,-6,6,4,'#ded0b2');
  pixel(-3,-8,1,2,'#777e6d'); pixel(0,-8,1,2,'#8b8b7a');
  pixel(-4, -2, 3, 3, '#ddd1b6'); pixel(3, -2 - gait, 3, 3, '#ddd1b6');
  pixel(0, -16, 9, 8, '#ddd1b6'); pixel(0, -19, 3, 4, '#8b8b7a'); pixel(7, -19, 2, 4, '#8b8b7a');
  pixel(1, -17, 1, 2, '#be9986'); pixel(7, -17, 1, 2, '#be9986');
  pixel(2,-15,5,1,'#efe2c4'); pixel(4,-15,1,2,'#9b9c86');
  pixel(2, -13, blink ? 2 : 1, 1, '#43584a'); pixel(6, -13, blink ? 2 : 1, 1, '#43584a');
  pixel(4, -11, 1, 1, '#a57968'); pixel(8, -10, 3, 1, '#9e9b83');
  pixel(3,-10,3,1,'#f0e2c5'); pixel(-2,-10,3,1,'#9e9b83');
  if (pose === 'paw') { pixel(6, -6, 7, 2, '#ddd1b6'); pixel(12, -6, 1, 2, '#818775'); }
  if (pose === 'groom') { pixel(6, -10, 2, 3, '#ddd1b6'); pixel(4, -9, 2, 1, '#af8f80'); }
  if (pose === 'pounce') { pixel(5,-3,9,2,'#ddd1b6'); pixel(-9,-3,5,2,'#ddd1b6'); }
  pixel(-9, -8, 3, 6, '#8b8b7a');
  pixel(-11, -12 + Math.floor(time * 5) % 2, 3, 6, '#8b8b7a');
}

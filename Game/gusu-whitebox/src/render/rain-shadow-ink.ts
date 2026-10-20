import { RAIN_FIELD as F, bandPosition, type RainBand } from '../core/liuyuan-rain-shadow.js';

export interface RainInkCell { x: number; y: number; color: string }
export const RAIN_INK = {
  ink: '#87998f', tail: '#b4c2b8', pale: '#fffdf3',
} as const;

/** Original broken rain strokes, NOT an opaque slab or outlined rectangle.
 * Every mark stays within the existing dangerous slab/effective opening.
 * Gap hints are separate: space between strokes is not an extra safe gap. */
export function rainInkCells(b: RainBand, quiet = false): RainInkCell[] {
  if (b.age < b.warning) return [];
  const isY = b.axis === 'y', p = bandPosition(b);
  const alongMin = isY ? F.top : F.left, alongMax = isY ? F.bottom : F.right;
  const acrossMin = isY ? F.left : F.top, acrossMax = isY ? F.right : F.bottom;
  const lo = Math.max(alongMin, Math.ceil(p - 9 - .5));
  const hi = Math.min(alongMax - 1, Math.floor(p + 9 - .5));
  const phase = quiet ? 0 : Math.floor(Math.max(0, b.age - b.warning) * 5);
  const cells: RainInkCell[] = [];
  for (let a = lo; a <= hi; a++) for (let n = acrossMin; n < acrossMax; n++) {
    if (Math.abs(n + .5 - b.gap) <= b.opening / 2 - 3) continue;
    const d = a + .5 - p;
    const group = Math.floor(n / 13), local = (n + group * 3) % 13;
    // A tapered, slightly bent brush drop: different lengths/heads/tails,
    // rather than a row of equally angled slash characters.
    const bend=Math.floor(d*(group%3===0?.4:.8));
    const stroke = (local + bend + phase + (group * 7) % 11 + 26) % 13;
    const pivot=group%5-2,length=7+(group*7)%8;
    const head=Math.abs(d-pivot)<2;
    const width=head?3+group%2:1;
    const strong = stroke <= width && Math.abs(d-pivot)<length/2
      && (n*3+Math.floor(d)*5+group+130)%17!==0;
    const glint = stroke === 6 && Math.abs(d) < 2 && group % 5 === 1;
    if (!strong && !glint) continue;
    cells.push({ x: isY ? n : a, y: isY ? a : n,
      color: glint || head&&stroke>0&&stroke<width ? RAIN_INK.pale
        : head ? RAIN_INK.ink : RAIN_INK.tail });
  }
  return cells;
}

/** Short paired leaf-shaped marks name the *effective* safe gap. They never
 * enclose the rain in a box and remain in normal/reduced-motion modes. */
export function drawRainGapHint(ctx: CanvasRenderingContext2D, b: RainBand): void {
  const isY=b.axis==='y', preview=b.age<b.warning;
  const p=preview ? isY ? b.sign>0?F.top+4:F.bottom-5 : b.sign>0?F.left+4:F.right-5
    : bandPosition(b);
  const alongMin=isY?F.top:F.left,alongMax=isY?F.bottom:F.right;
  if(p<alongMin || p>=alongMax) return;
  for(const side of [-1,1]) {
    const across=b.gap+side*(b.opening/2-5);
    for(let i=-2;i<=2;i++) {
      const n=across-side*Math.abs(i),a=p+i;
      const x=Math.round(isY?n:a),y=Math.round(isY?a:n);
      if(x>=F.left&&x<F.right&&y>=F.top&&y<F.bottom) {
        ctx.fillStyle='#48755f';ctx.fillRect(x,y,1,1);
      }
    }
  }
  // An upright paper umbrella, never text or a pickup. It stays between
  // the true effective opening edges and renders beneath the player.
  const cx=isY?b.gap:p,cy=isY?p:b.gap;
  const dot=(dx:number,dy:number,color:string)=>{
    const x=Math.round(cx+dx),y=Math.round(cy+dy);
    if(x>=F.left&&x<F.right&&y>=F.top&&y<F.bottom) {
      ctx.fillStyle=color;ctx.fillRect(x,y,1,1);
    }
  };
  for(let dy=-6;dy<=0;dy++) {
    const width=[1,3,5,6,7,8,7][dy+6];
    for(let dx=-width;dx<=width;dx++) dot(dx,dy,
      Math.abs(dx)===width||dy===0?'#65775d':(dx+dy)%4===0?'#d4c49e':'#ede1bd');
  }
  for(let dy=-5;dy<=5;dy++) dot(0,dy,dy<0?'#b5a27e':'#75674f');
  dot(1,5,'#75674f');dot(2,4,'#75674f');
}

export function drawRainInkBand(ctx: CanvasRenderingContext2D, b: RainBand, quiet = false): void {
  for (const cell of rainInkCells(b, quiet)) {
    ctx.fillStyle = cell.color; ctx.fillRect(cell.x, cell.y, 1, 1);
  }
}

/** Only the non-walkable margin: a fictional close-up frame, not a new
 * garden planting claim. Leaves lean and taper; the centre stays open. */
export function drawRainInkMargins(ctx: CanvasRenderingContext2D, time: number, quiet = false): void {
  const dot = (x: number, y: number, color: string) => {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || x >= 320 || y < 32 || y >= F.bottom || x >= F.left && x < F.right) return;
    ctx.fillStyle = color; ctx.fillRect(x, y, 1, 1);
  };
  // A stepped breath, never sweeping foliage over the player or warning.
  const bend = quiet ? 0 : Math.round(Math.sin(time * .65));
  const branch = (x: number, y: number, dx: number, length: number, color: string) => {
    for (let i = 0; i < length; i++) dot(x + i * dx, y + Math.floor(i * .55), color);
  };
  const leaf = (x: number, y: number, dx: number, dy: number, length: number, color: string) => {
    for (let i = 0; i < length; i++) {
      const py = y + i * dy + Math.floor(i / 4) * bend;
      dot(x + i * dx, py, color);
      if (i > 1 && i < length - 2) dot(x + i * dx, py + 1, color);
    }
  };
  for (const [x, y, dx, size] of [[1, 45, 1, 13], [318, 72, -1, 14], [3, 138, 1, 10]]) {
    branch(x, y, dx, size, '#9ca89b');
    for (let j = 0; j < 3; j++) leaf(x + dx * (j * 4 + 2), y + j * 2, dx, 1, 7 - j, '#a6b1a1');
  }
  branch(-4, 61, 1, 25, '#66776a');
  branch(324, 147, -1, 29, '#5b6d63');
  for (const [x, y, dx, dy, size] of [[2, 64, 1, 1, 12], [8, 70, -1, 1, 11],
    [14, 75, 1, 1, 9], [4, 86, 1, 0, 12], [12, 83, -1, 1, 14],
    [317, 151, -1, 1, 13], [309, 155, 1, 1, 10], [304, 159, -1, 1, 11],
    [319, 166, -1, 0, 10], [312, 168, 1, 1, 12]]) leaf(x, y, dx, dy, size, '#56695f');
}

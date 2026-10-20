/** 像素绘制原语。所有坐标取整，禁平滑。 */
export type Ctx = CanvasRenderingContext2D;

export function px(g: Ctx, x: number, y: number, w: number, h: number, color: string): void {
  g.fillStyle = color;
  g.fillRect(x | 0, y | 0, w | 0, h | 0);
}

/** 网格单元着色（tile 坐标系）。 */
export function tilePx(g: Ctx, tx: number, ty: number, size: number, color: string): void {
  g.fillStyle = color;
  g.fillRect(tx * size, ty * size, size, size);
}

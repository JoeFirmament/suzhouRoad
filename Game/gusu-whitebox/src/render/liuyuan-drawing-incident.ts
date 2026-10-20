/** Original pixel vignette for a movable prop; no map or collision data. */
export function drawDrawingIncident(ctx: CanvasRenderingContext2D, x: number, y: number, seconds: number): void {
  const rect = (dx: number, dy: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color; ctx.fillRect(Math.round(x + dx), Math.round(y + dy), w, h);
  };
  const paw = Math.floor(seconds * 2) % 6 >= 4 ? 4 : 0;
  rect(-16, -1, 48, 3, '#949b8a');
  rect(10, -12, 24, 16, '#e9dec1');
  rect(10, -12, 2, 16, '#aa9065'); rect(32, -12, 2, 16, '#aa9065');
  rect(20, -8, 2, 9, '#64745d'); rect(16, -6, 4, 2, '#64745d'); rect(22, -3, 6, 2, '#64745d');
  rect(-13, -17, 21, 13, '#b8ae97'); rect(-11, -5, 4, 5, '#777d70');
  rect(3 + paw, -6, 7, 3, '#a69c86');
  rect(-1, -24, 13, 11, '#d2c5a9');
  rect(-1, -28, 3, 5, '#777d70'); rect(9, -28, 3, 5, '#777d70');
  rect(6, -20, 2, 2, '#405448'); rect(11, -16, 3, 2, '#8a7967');
  rect(-19, -20, 4, 17, '#898878'); rect(-16, -6, 5, 3, '#898878');
}

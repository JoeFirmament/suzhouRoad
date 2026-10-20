/** Original practice marks on a movable leaf; not historical text or calligraphy. */
export type TracePoint = { x: number; y: number };
export type TraceDirection = 'up' | 'right' | 'down' | 'left';
export const LEAF_TRACE_PATHS: readonly (readonly TracePoint[])[] = [
  [{ x: 276, y: 268 }, { x: 308, y: 268 }, { x: 308, y: 294 }, { x: 288, y: 294 }],
  [{ x: 394, y: 261 }, { x: 394, y: 235 }, { x: 424, y: 235 }, { x: 424, y: 257 }],
  [{ x: 520, y: 211 }, { x: 552, y: 211 }, { x: 552, y: 235 }],
];
export type LeafTrace = { node: number; point: TracePoint; failed: boolean };
export function leafTraceView(index: number): { x: number; y: number; w: number; h: number } {
  const path=LEAF_TRACE_PATHS[index];
  const xs=path.map(point=>point.x), ys=path.map(point=>point.y);
  return { x:(Math.min(...xs)+Math.max(...xs))/2-100,
    y:(Math.min(...ys)+Math.max(...ys))/2-56.25, w:200, h:112.5 };
}
const distance = (a: TracePoint, b: TracePoint) => Math.hypot(a.x-b.x, a.y-b.y);
export function beginLeafTrace(path: readonly TracePoint[], point = path[0]): LeafTrace | null {
  return distance(point, path[0]) <= 12 ? { node: 0, point, failed: false } : null;
}
export function traceFinished(trace: LeafTrace, path: readonly TracePoint[]): boolean {
  return !trace.failed && trace.node === path.length - 1;
}
export function moveLeafTrace(trace: LeafTrace, path: readonly TracePoint[], point: TracePoint): LeafTrace {
  if (trace.failed || traceFinished(trace, path)) return trace;
  const a = path[trace.node], b = path[trace.node+1];
  const dx=b.x-a.x, dy=b.y-a.y;
  const t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/(dx*dx+dy*dy)));
  const onPath={x:a.x+t*dx,y:a.y+t*dy};
  // Only the current segment counts; jumping to a later corner cannot skip a turn.
  if (distance(point,onPath)>12 || distance(point,trace.point)>48)
    return { ...trace, failed: true };
  return { node: distance(point,b)<=7 ? trace.node+1 : trace.node, point, failed: false };
}
export function nextTraceDirection(trace: LeafTrace, path: readonly TracePoint[]): TraceDirection | null {
  if (trace.failed || traceFinished(trace,path)) return null;
  const a=path[trace.node], b=path[trace.node+1];
  return b.x>a.x ? 'right' : b.x<a.x ? 'left' : b.y>a.y ? 'down' : 'up';
}
export function stepLeafTrace(trace: LeafTrace, path: readonly TracePoint[], direction: TraceDirection): LeafTrace {
  if (!nextTraceDirection(trace,path)) return trace;
  return direction===nextTraceDirection(trace,path)
    ? moveLeafTrace(trace,path,path[trace.node+1]) : { ...trace, failed: true };
}

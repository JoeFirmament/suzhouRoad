import { TUNING } from '../config.js';
import type { ViewSpot } from '../data/views.js';

export type VFState =
  | { mode: 'idle' }
  | { mode: 'framing'; idx: number; enteredAt: number }
  | { mode: 'beat'; idx: number; enteredAt: number }; // 合窗静默拍

/** 取景匣状态机：idle ⇄ framing（→beat→成片）。判定=机位距离，不做图像识别。 */
export class Viewfinder {
  captured = new Set<number>();
  state: VFState = { mode: 'idle' };
  onAllCaptured: (() => void) | null = null;
  /** 成片即存相册（Web 存档双保险的 localStorage 挂点，白模期先内存）。 */
  album: Array<{ id: number; poem: string; source: string; at: number }> = [];

  constructor(private spots: ViewSpot[]) {}

  private spotNear(x: number, y: number): ViewSpot | null {
    let best: ViewSpot | null = null, bd = Infinity;
    for (const s of this.spots) {
      const d = Math.hypot(x - s.x, y - s.y);
      if (d < TUNING.viewTriggerRadius && d < bd) { bd = d; best = s; }
    }
    return best;
  }

  /** 返回是否接管了这次交互。 */
  interact(x: number, y: number, now: number): boolean {
    if (this.state.mode === 'framing') { this.capture(now); return true; }
    if (this.state.mode === 'beat') return true; // 静默拍期间忽略输入
    const s = this.spotNear(x, y);
    if (s) { this.state = { mode: 'framing', idx: s.id, enteredAt: now }; return true; }
    return false;
  }

  cancel(): void {
    if (this.state.mode !== 'idle') this.state = { mode: 'idle' };
  }

  capture(now: number): void {
    if (this.state.mode !== 'framing') return;
    const idx = this.state.idx;
    if (!this.captured.has(idx)) {
      this.captured.add(idx);
      const s = this.spots[idx];
      this.album.push({ id: idx, poem: s.poem, source: s.source, at: now });
      if (this.captured.size === this.spots.length) this.onAllCaptured?.();
    }
    this.state = { mode: 'idle' };
  }

  /** 静默拍结束时由主循环调用：进入 framing 即视为可成片。 */
  update(now: number): void {
    if (this.state.mode === 'beat' && now - this.state.enteredAt >= TUNING.stopBeatMs) {
      this.state = { mode: 'idle' };
    }
  }

  get framingIdx(): number | null {
    return this.state.mode === 'framing' ? this.state.idx : null;
  }
}

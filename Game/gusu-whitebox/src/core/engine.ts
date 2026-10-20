/** 输入 + 主循环。渲染/逻辑解耦：step(dt) 里不许直接碰 DOM。 */
export class Engine {
  private keys = new Set<string>();
  private virtualKeys = new Set<string>();
  private last = 0;
  private raf = 0;
  private running = false;

  onInteract: (() => void) | null = null;
  onCancel: (() => void) | null = null;
  /** 触屏/鼠标：点画布 = 交互（骨架版，正式版换虚拟摇杆）。 */
  onTap: (() => void) | null = null;
  clearInput(): void {
    this.keys.clear();
    this.virtualKeys.clear();
  }

  attachKeys(): void {
    addEventListener('keydown', (e) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      this.keys.add(k);
      if (k === 'e' || k === ' ' || k === 'enter') this.onInteract?.();
      if (k === 'escape') this.onCancel?.();
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
    });
    addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
  }

  attachTap(el: HTMLElement): void {
    el.addEventListener('pointerdown', () => this.onTap?.());
  }

  /**
   * 移动端输入与键盘共用同一套轴值。按钮只负责“按住/松开”，
   * 不直接改玩家坐标，保证触屏与键盘走完全相同的碰撞和调参链路。
   */
  attachTouchControls(root: HTMLElement | null): void {
    if (!root) return;

    const releaseAll = () => {
      this.virtualKeys.clear();
      root.querySelectorAll('.is-active').forEach((el) => el.classList.remove('is-active'));
    };

    root.querySelectorAll<HTMLElement>('[data-move]').forEach((button) => {
      const key = button.dataset.move;
      if (!key) return;
      const set = (active: boolean) => {
        if (active) this.virtualKeys.add(key);
        else this.virtualKeys.delete(key);
        button.classList.toggle('is-active', active);
      };
      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        set(true);
      });
      button.addEventListener('pointerup', () => set(false));
      button.addEventListener('pointercancel', () => set(false));
      button.addEventListener('lostpointercapture', () => set(false));
    });

    root.querySelector<HTMLElement>('[data-action="interact"]')?.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      this.onInteract?.();
    });
    root.querySelector<HTMLElement>('[data-action="cancel"]')?.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      this.onCancel?.();
    });

    addEventListener('blur', releaseAll);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) releaseAll();
    });
  }

  axis(): { dx: number; dy: number } {
    const down = (key: string) => this.keys.has(key) || this.virtualKeys.has(key);
    let dx = (down('d') || down('arrowright') ? 1 : 0) - (down('a') || down('arrowleft') ? 1 : 0);
    let dy = (down('s') || down('arrowdown') ? 1 : 0) - (down('w') || down('arrowup') ? 1 : 0);
    if (dx && dy) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }
    return { dx, dy };
  }

  start(step: (dt: number) => void): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - this.last) / 1000, 0.05); // 切后台回来不跳帧
      this.last = now;
      step(dt);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }
}

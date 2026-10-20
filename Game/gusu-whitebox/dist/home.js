"use strict";
(() => {
  // src/config.ts
  var TILE = 16;
  var MAP_W = 80;
  var MAP_H = 50;
  var VIEW_W = 960;
  var VIEW_H = 600;
  var TUNING = {
    moveSpeed: 64,
    // px/s  [PLACEHOLDER] 手感反馈项①走路速度
    camLerp: 0.12,
    // 镜头跟随插值 [PLACEHOLDER] 反馈项②跟不跟手
    viewTriggerRadius: 22,
    // 取景触发半径 px
    stopBeatMs: 300,
    // 合窗静默拍（signature moment）
    walkAnimFps: 8,
    pulsePeriodMs: 1400,
    // 取景点光圈脉动周期
    homeInteractRadius: 27,
    // 府学近物交互半径 px
    cornerTriggerRadius: 24,
    // 堂后檐角拾遗触发半径 px
    albumStrokeMs: 260,
    // 园谱归页每幅景落下的阶梯动画时长 ms
    // ——「今按」层浮现时序（《剧本文件规范》§2.6.3 规格 1：今按永远在玩家之后）——
    // 剧本里各章一致写作「落笔 → 页成 → 稍顿 → 今按浮出」；本键就是那个「稍顿」。
    // 2026-09-30：由 CH5 的 TUNING.wszAnnotationDelayMs 提升为通用键（CH5–CH9 连欠五章，终章乙幕整幕依赖它）。
    annotationDelayMs: 1e3,
    // [PLACEHOLDER] 玩家动作 → 今按浮现 之间的停顿 ms（建议区间 800–1200）
    annotationFadeMs: 260,
    // 今按阶梯式淡入时长 ms（steps，走像素纪律；不是 CSS 缓动）
    annotationSteps: 4
    // 淡入阶梯数（像素纪律：位移/透明度只允许阶梯，不允许平滑插值）
  };
  var PALETTE = {
    paper: "#f2ead6",
    // 宣纸底
    grass: "#bcd6a4",
    grassAlt: "#b3cf9b",
    path: "#e6dcc2",
    pathAlt: "#d8ceae",
    water: "#9ecfc9",
    waterHi: "#c2e0da",
    wall: "#fbf7ec",
    wallShade: "#d9d2c0",
    roof: "#b8b2a2",
    roofDark: "#a8a292",
    wood: "#8a6844",
    zhu: "#b03a2e",
    // 朱红点睛（唯一重色）
    qing: "#3d7068",
    // 青水/判定 UI
    rockTop: "#b0bfa8",
    rockBase: "#93a48c",
    rockDark: "#78876f",
    leafHi: "#9cc487",
    leafMid: "#8fbb78",
    leafDark: "#7fae6a",
    ink: "#2b2824",
    gold: "#c8a04b",
    // —— P0-1 色板增补 10 色（2026-09-27，色源：assets/palette/palette.json）——
    inkPale: "#a39d90",
    // 淡墨
    inkMid: "#7e796d",
    // 中墨
    inkHeavy: "#55524a",
    // 重墨
    stele: "#171512",
    // 碑墨（拓片最深）
    waterDeep: "#6fa89e",
    // 水深
    qingDeep: "#2a514c",
    // 深潭/夜水
    woodDark: "#6b4c2f",
    // 木影
    zhuBright: "#d95543",
    // 朱亮
    sealRed: "#8f271d",
    // 印泥深红
    pine: "#5f7d4f",
    // 松柏深叶
    // —— v3 风格基线增补 8 色（2026-09-28，参考小飞虹 2.5D 像素画：浓郁饱和基调）——
    roofChar: "#4e4c45",
    // 瓦炭（坡面主色，深灰瓦）
    roofRidge: "#33322d",
    // 脊墨
    waterTeal: "#5b9484",
    // 饱和青绿水
    waterTealDeep: "#3c6e63",
    // 青绿深水
    waterGlow: "#a5cdb4",
    // 水面波光
    leafSat: "#71b054",
    // 饱和叶
    leafDeep: "#4c8a42",
    // 深叶
    willow: "#8fc065"
    // 柳黄
  };
  var TYPE_LAYERS = {
    /** 世界文字（清末故事层）：台词、匾额、题跋原文、诗卡正文。最"在场"的一层。 */
    world: {
      font: '"Songti SC","STSong","Noto Serif SC",serif',
      ink: PALETTE.ink,
      // 焦墨 #2b2824
      size: 15
    },
    /** 玩家手迹：玩家自己写的字（题跋、落款、抄联）。墨与正文同浓，但**是手写体**，且**必带朱印**。 */
    hand: {
      font: '"Kaiti SC","STKaiti","KaiTi","Noto Serif CJK SC",serif',
      ink: PALETTE.ink,
      // 焦墨 #2b2824（同正文浓度——玩家写的字不打折）
      size: 16,
      seal: PALETTE.zhu
      // 朱印 #b03a2e（全作唯一重色）
    },
    /** 今按（后世之评）：不在世界观之内的一层。**七个分离信号**见 annotation.ts 文件头。 */
    annote: {
      font: '"Songti SC","STSong","Noto Serif SC",serif',
      // 印刷体（"印"出来的，不是"写"出来的）
      ink: PALETTE.inkHeavy,
      // 重墨 #55524a —— 比正文轻一档，不夺正文的权威
      size: 12,
      // 小一号
      lineHeight: 1.75,
      label: "\u4ECA\u6309",
      // 起首二字（规格 5）
      labelInk: PALETTE.inkMid,
      // 中墨 #7e796d
      rule: PALETTE.inkPale,
      // 左侧界行 #a39d90（古籍版框界行的意译）
      ground: PALETTE.wall
      // 贴条纸底 #fbf7ec —— 比正文纸更亮更冷，"从别处来的一张纸"
    }
  };

  // src/core/liuyuan-playtest.ts
  function isLiuyuanPlaytest(search) {
    const current = search ?? (typeof location === "undefined" ? "" : location.search);
    return new URLSearchParams(current).get("playtest") === "1";
  }
  function carryLiuyuanPlaytest(query, search) {
    if (isLiuyuanPlaytest(search)) query.set("playtest", "1");
  }

  // src/core/progression.ts
  var SAVE_KEY = "gusu-nine-gardens-rpg-v1";
  var LIUYUAN_PLAYTEST_KEY = "gusu-nine-gardens-liuyuan-playtest-v1";
  var activeSaveKey = () => isLiuyuanPlaytest() ? LIUYUAN_PLAYTEST_KEY : SAVE_KEY;
  var volatileProgress = /* @__PURE__ */ new Map();
  var storageWriteFailed = /* @__PURE__ */ new Set();
  var FLAG_ALIASES = {
    "opening-arrival-seen": "opening-seen",
    "opening-seen": "opening-arrival-seen",
    "first-lesson-offered": "fuxue-briefing-seen",
    "fuxue-briefing-seen": "first-lesson-offered"
  };
  var DEFAULT_PROGRESS = {
    version: 1,
    arts: { li: 0, yue: 0, she: 0, yu: 0, shu: 0, shuMath: 0 },
    gardens: {
      canglang: "open",
      wangshi: "locked",
      zhuozheng: "locked",
      shizilin: "locked",
      liuyuan: "locked",
      ouyuan: "locked",
      yipu: "locked",
      huanxiu: "locked",
      tuisi: "locked"
    },
    completedTasks: [],
    knowledge: [],
    storyFlags: [],
    updatedAt: 0
  };
  function cloneDefault() {
    return JSON.parse(JSON.stringify(DEFAULT_PROGRESS));
  }
  function loadProgress() {
    const key = activeSaveKey();
    const fallback = volatileProgress.get(key);
    if (storageWriteFailed.has(key) && fallback) return structuredClone(fallback);
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback ? structuredClone(fallback) : cloneDefault();
      const saved = JSON.parse(raw);
      const base = cloneDefault();
      const progress = {
        ...base,
        ...saved,
        arts: { ...base.arts, ...saved.arts ?? {} },
        gardens: { ...base.gardens, ...saved.gardens ?? {} },
        completedTasks: Array.isArray(saved.completedTasks) ? saved.completedTasks : [],
        knowledge: Array.isArray(saved.knowledge) ? saved.knowledge : [],
        storyFlags: Array.isArray(saved.storyFlags) ? saved.storyFlags : [],
        updatedAt: typeof saved.updatedAt === "number" ? saved.updatedAt : 0
      };
      volatileProgress.set(key, structuredClone(progress));
      return progress;
    } catch {
      return fallback ? structuredClone(fallback) : cloneDefault();
    }
  }
  function hasStoryFlag(progress, flag) {
    const alias = FLAG_ALIASES[flag];
    return progress.storyFlags.includes(flag) || !!alias && progress.storyFlags.includes(alias);
  }
  function markStoryFlag(flag) {
    const progress = loadProgress();
    if (!progress.storyFlags.includes(flag)) {
      progress.storyFlags.push(flag);
      saveProgress(progress);
    }
    return progress;
  }
  function saveProgress(progress) {
    progress.updatedAt = Date.now();
    const key = activeSaveKey();
    volatileProgress.set(key, structuredClone(progress));
    try {
      localStorage.setItem(key, JSON.stringify(progress));
      storageWriteFailed.delete(key);
    } catch {
      storageWriteFailed.add(key);
    }
  }

  // src/core/liuyuan-text-variant.ts
  var LIUYUAN_TEXT_VARIANT = {
    knowledgeId: "liuyuan-garden-note-variant",
    academy: "\u9694\u7A97\u770B\u5C71\uFF0C\u79FB\u6B65\u666F\u540C\u3002",
    copyist: "\u9694\u7A97\u770B\u5C71\uFF0C\u79FB\u6B65\u666F\u5F02\u3002",
    sourceLabel: "\u81EA\u62DF\u56ED\u8BB0 \xB7 \u6E38\u620F\u6545\u4E8B"
  };

  // src/core/liuyuan-variant-collation.ts
  var LIUYUAN_VARIANT_COLLATED = "liuyuan-garden-note-collated";
  function canCollateLiuyuan(progress) {
    return progress.storyFlags.includes("ly-unlocked") && progress.storyFlags.includes("ly-leaf-written");
  }
  function recordLiuyuanCollation(bookRead, leafRead) {
    const progress = loadProgress();
    if (!bookRead || !leafRead || !canCollateLiuyuan(progress) || progress.knowledge.includes(LIUYUAN_VARIANT_COLLATED)) return false;
    progress.knowledge.push(LIUYUAN_VARIANT_COLLATED);
    saveProgress(progress);
    return true;
  }

  // src/ui/liuyuan-variant-collation.ts
  function createVariantCollation(onClose, onOtherBooks = () => {
  }) {
    const panel = document.getElementById("homeVariant");
    const book = document.getElementById("collationBook");
    const leaf = document.getElementById("collationLeaf");
    const result = document.getElementById("collationResult");
    const bookButton = document.getElementById("readVariantBook");
    const leafButton = document.getElementById("readVariantLeaf");
    const record = document.getElementById("recordVariant");
    const close = document.getElementById("closeVariant");
    const other = document.getElementById("otherVariantBooks");
    let open = false, bookRead = false, leafRead = false;
    function render() {
      book.textContent = bookRead ? `\u5E9C\u5B66\u85CF\u672C\uFF1A\u201C${LIUYUAN_TEXT_VARIANT.academy}\u201D` : "\u4E66\u7B7E\u5939\u7740\u90A3\u4E00\u9875\uFF0C\u5148\u5C55\u5F00\u539F\u672C\u3002";
      leaf.textContent = leafRead ? `\u53F6\u4E0A\u539F\u53E5\uFF1A\u201C${LIUYUAN_TEXT_VARIANT.copyist}\u201D` : "\u53F6\u7247\u5C1A\u5377\u7740\uFF0C\u8F7B\u8F7B\u5C55\u5E73\u770B\u5B57\u3002";
      record.disabled = !(bookRead && leafRead) || loadProgress().knowledge.includes(LIUYUAN_VARIANT_COLLATED);
      result.textContent = loadProgress().knowledge.includes(LIUYUAN_VARIANT_COLLATED) ? "\u539F\u672C\u786E\u662F\u201C\u666F\u540C\u201D\uFF0C\u4F60\u6CA1\u6709\u8BB0\u9519\u3002\u5DEE\u5F02\u5DF2\u6536\u5165\u56ED\u8C31\uFF1B\u54EA\u4E00\u5904\u5148\u6539\u4E86\u5B57\uFF0C\u4ECD\u5F85\u67E5\u3002" : bookRead && leafRead ? "\u4E24\u4E2A\u5B57\u786E\u5B9E\u4E0D\u540C\u3002\u5148\u628A\u4E24\u79CD\u8BB0\u5F55\u5E76\u5217\uFF0C\u522B\u51ED\u54EA\u53E5\u597D\u542C\u5C31\u6539\u6389\u53E6\u4E00\u53E5\u3002" : "\u7FFB\u539F\u672C\uFF0C\u5C55\u53F6\u7247\u3002\u5148\u6838\u6240\u89C1\uFF0C\u518D\u4F5C\u5224\u65AD\u3002";
    }
    bookButton.addEventListener("click", () => {
      if (open) {
        bookRead = true;
        render();
      }
    });
    leafButton.addEventListener("click", () => {
      if (open) {
        leafRead = true;
        render();
      }
    });
    record.addEventListener("click", () => {
      if (open) {
        recordLiuyuanCollation(bookRead, leafRead);
        render();
      }
    });
    function hide() {
      if (!open) return;
      open = false;
      panel.hidden = true;
      onClose();
    }
    close.addEventListener("click", hide);
    other.addEventListener("click", () => {
      if (open) {
        hide();
        onOtherBooks();
      }
    });
    return {
      get open() {
        return open;
      },
      show() {
        if (!canCollateLiuyuan(loadProgress())) return;
        open = true;
        panel.hidden = false;
        bookRead = leafRead = loadProgress().knowledge.includes(LIUYUAN_VARIANT_COLLATED);
        render();
        bookButton.focus();
      },
      hide,
      key(event) {
        if (!open || event.ctrlKey || event.metaKey || event.altKey) return;
        if (["1", "2", "3", "Escape"].includes(event.key)) {
          event.preventDefault();
          if (event.repeat) return;
          if (event.key === "1") bookButton.click();
          else if (event.key === "2") leafButton.click();
          else if (event.key === "3") record.click();
          else hide();
        }
        if (event.key === "Tab") {
          const buttons = [bookButton, leafButton, ...record.disabled ? [] : [record], other, close];
          if (event.shiftKey && document.activeElement === buttons[0]) {
            event.preventDefault();
            close.focus();
          } else if (!event.shiftKey && document.activeElement === close) {
            event.preventDefault();
            bookButton.focus();
          }
        }
      }
    };
  }

  // src/core/liuyuan-view-memory.ts
  function chapterSceneHref(page, draft2 = false) {
    const query = new URLSearchParams({ chapter: "1" });
    if (draft2) query.set("draft", "1");
    carryLiuyuanPlaytest(query);
    return `${page}?${query}`;
  }

  // src/core/engine.ts
  var Engine = class {
    constructor() {
      this.keys = /* @__PURE__ */ new Set();
      this.virtualKeys = /* @__PURE__ */ new Set();
      this.last = 0;
      this.raf = 0;
      this.running = false;
      this.onInteract = null;
      this.onCancel = null;
      /** 触屏/鼠标：点画布 = 交互（骨架版，正式版换虚拟摇杆）。 */
      this.onTap = null;
    }
    clearInput() {
      this.keys.clear();
      this.virtualKeys.clear();
    }
    attachKeys() {
      addEventListener("keydown", (e) => {
        if (e.repeat) return;
        const k = e.key.toLowerCase();
        this.keys.add(k);
        if (k === "e" || k === " " || k === "enter") this.onInteract?.();
        if (k === "escape") this.onCancel?.();
        if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) e.preventDefault();
      });
      addEventListener("keyup", (e) => this.keys.delete(e.key.toLowerCase()));
    }
    attachTap(el) {
      el.addEventListener("pointerdown", () => this.onTap?.());
    }
    /**
     * 移动端输入与键盘共用同一套轴值。按钮只负责“按住/松开”，
     * 不直接改玩家坐标，保证触屏与键盘走完全相同的碰撞和调参链路。
     */
    attachTouchControls(root) {
      if (!root) return;
      const releaseAll = () => {
        this.virtualKeys.clear();
        root.querySelectorAll(".is-active").forEach((el) => el.classList.remove("is-active"));
      };
      root.querySelectorAll("[data-move]").forEach((button) => {
        const key = button.dataset.move;
        if (!key) return;
        const set = (active) => {
          if (active) this.virtualKeys.add(key);
          else this.virtualKeys.delete(key);
          button.classList.toggle("is-active", active);
        };
        button.addEventListener("pointerdown", (event) => {
          event.preventDefault();
          button.setPointerCapture(event.pointerId);
          set(true);
        });
        button.addEventListener("pointerup", () => set(false));
        button.addEventListener("pointercancel", () => set(false));
        button.addEventListener("lostpointercapture", () => set(false));
      });
      root.querySelector('[data-action="interact"]')?.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        this.onInteract?.();
      });
      root.querySelector('[data-action="cancel"]')?.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        this.onCancel?.();
      });
      addEventListener("blur", releaseAll);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) releaseAll();
      });
    }
    axis() {
      const down = (key) => this.keys.has(key) || this.virtualKeys.has(key);
      let dx = (down("d") || down("arrowright") ? 1 : 0) - (down("a") || down("arrowleft") ? 1 : 0);
      let dy = (down("s") || down("arrowdown") ? 1 : 0) - (down("w") || down("arrowup") ? 1 : 0);
      if (dx && dy) {
        dx *= Math.SQRT1_2;
        dy *= Math.SQRT1_2;
      }
      return { dx, dy };
    }
    start(step) {
      if (this.running) return;
      this.running = true;
      this.last = performance.now();
      const tick = (now2) => {
        const dt = Math.min((now2 - this.last) / 1e3, 0.05);
        this.last = now2;
        step(dt);
        this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    }
    stop() {
      this.running = false;
      cancelAnimationFrame(this.raf);
    }
  };

  // src/data/tiles.ts
  var T = {
    GRASS: 0,
    PATH: 1,
    WATER: 2,
    WALL: 3,
    // 粉墙（实心）
    CORR: 4,
    // 廊内地面
    ROCK: 5,
    // 假山
    TREE: 6,
    PLAT: 7,
    // 台地/水榭平台
    BRIDGE: 8,
    // 石桥（可走）
    FLOWER: 9,
    // 花境（装饰，可走）
    WIN: 10,
    // 漏窗（墙上的窗，实心；取景点在廊内对侧）
    // —— P2 试铺段新增（词表 tile-lexicon-canglang #1-18 落地）——
    DIRT: 11,
    // 假山蹬道泥土路（可走）
    RAIL: 12,
    // 临水石栏（实心）
    ROOF: 13,
    // 建筑屋顶（面水轩/观鱼处/石亭，实心）
    PAV: 14,
    // 亭前平台（可走）
    BAMBOO: 15
    // 竹林（实心，翠玲珑/看山楼周边）
  };
  var SOLID = /* @__PURE__ */ new Set([
    T.WALL,
    T.WATER,
    T.ROCK,
    T.TREE,
    T.WIN,
    T.RAIL,
    T.ROOF,
    T.BAMBOO
  ]);

  // src/core/geometry.ts
  var STANDARD_PLAYER_PROFILE = {
    halfW: 4,
    topInset: 6,
    bottomInset: 1
  };

  // src/core/physics.ts
  var DEFAULT_PROFILE = STANDARD_PLAYER_PROFILE;
  function solidAt(map, px2, py, w, h) {
    const tx = Math.floor(px2 / TILE), ty = Math.floor(py / TILE);
    if (tx < 0 || ty < 0 || tx >= w || ty >= h) return true;
    return SOLID.has(map[ty * w + tx]);
  }
  function collidesRect(x, y, rect, profile) {
    const left = x - profile.halfW, right = x + profile.halfW;
    const top = y - profile.topInset, bottom = y - profile.bottomInset;
    return right > rect.x && left < rect.x + rect.w && bottom > rect.y && top < rect.y + rect.h;
  }
  function isRect(shape) {
    return "x" in shape;
  }
  function project(points, axisX, axisY) {
    let min = Infinity, max = -Infinity;
    for (const [x, y] of points) {
      const value = x * axisX + y * axisY;
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
    return [min, max];
  }
  function convexPolygonsOverlap(a, b) {
    for (const polygon2 of [a, b]) {
      for (let index = 0; index < polygon2.length; index++) {
        const p = polygon2[index], q = polygon2[(index + 1) % polygon2.length];
        const axisX = -(q[1] - p[1]), axisY = q[0] - p[0];
        const [minA, maxA] = project(a, axisX, axisY);
        const [minB, maxB] = project(b, axisX, axisY);
        if (maxA <= minB || maxB <= minA) return false;
      }
    }
    return true;
  }
  function collidesShape(x, y, shape, profile) {
    if (isRect(shape)) return collidesRect(x, y, shape, profile);
    if (shape.points.length < 3) return false;
    const left = x - profile.halfW, right = x + profile.halfW;
    const top = y - profile.topInset, bottom = y - profile.bottomInset;
    const actor = [[left, top], [right, top], [right, bottom], [left, bottom]];
    return convexPolygonsOverlap(actor, shape.points);
  }
  function collides(map, x, y, w = MAP_W, h = MAP_H, obstacles = [], profile = DEFAULT_PROFILE) {
    return obstacles.some((shape) => collidesShape(x, y, shape, profile)) || (solidAt(map, x - profile.halfW, y - profile.bottomInset, w, h) || solidAt(map, x + profile.halfW, y - profile.bottomInset, w, h) || solidAt(map, x - profile.halfW, y - profile.topInset, w, h) || solidAt(map, x + profile.halfW, y - profile.topInset, w, h));
  }
  function moveEntity(map, p, dx, dy, w = MAP_W, h = MAP_H, obstacles = [], profile = DEFAULT_PROFILE) {
    if (dx !== 0) {
      const ox = p.x;
      p.x += dx;
      if (collides(map, p.x, p.y, w, h, obstacles, profile)) p.x = ox;
    }
    if (dy !== 0) {
      const oy = p.y;
      p.y += dy;
      if (collides(map, p.x, p.y, w, h, obstacles, profile)) p.y = oy;
    }
  }

  // src/data/fuxue-geometry.ts
  var FUXUE_WORLD_W = 736;
  var FUXUE_WORLD_H = 416;
  var FUXUE_ACTOR_PROFILE = STANDARD_PLAYER_PROFILE;
  var FUXUE_GEOMETRY = [
    {
      id: "quarters-roof",
      occluder: {
        id: "quarters-roof",
        depthY: 118,
        polygons: [[[0, 28], [196, 28], [215, 46], [207, 108], [36, 112], [0, 94]]]
      }
    },
    {
      id: "old-tree-canopy",
      colliders: [
        { points: [[211, 154], [228, 143], [234, 194], [214, 198]] },
        { points: [[228, 143], [244, 148], [250, 190], [234, 198]] },
        { points: [[199, 190], [260, 190], [264, 221], [198, 222]] }
      ],
      occluder: {
        id: "old-tree-canopy",
        depthY: 228,
        polygons: [
          [
            [178, 116],
            [191, 99],
            [215, 94],
            [238, 104],
            [246, 123],
            [235, 141],
            [213, 148],
            [190, 140],
            [172, 126]
          ],
          [
            [224, 105],
            [250, 103],
            [278, 115],
            [297, 137],
            [289, 158],
            [267, 169],
            [244, 158],
            [232, 139]
          ],
          [
            [218, 145],
            [243, 137],
            [270, 151],
            [291, 173],
            [279, 197],
            [253, 207],
            [232, 193],
            [210, 181]
          ],
          [
            [211, 154],
            [228, 134],
            [244, 145],
            [250, 190],
            [241, 216],
            [215, 210],
            [220, 181]
          ],
          [[199, 190], [260, 190], [264, 221], [198, 222]]
        ]
      }
    },
    {
      id: "old-tree-west-low-branch",
      // 西南低枝的落地线取该枝最低处，而不沿用主干/树池底线；
      // 站到枝下偏西的书架走道时人物应露出，脚点退到枝北侧时仍会被枝叶遮住。
      occluder: {
        id: "old-tree-west-low-branch",
        depthY: 193,
        polygons: [[
          [176, 140],
          [196, 128],
          [218, 141],
          [229, 161],
          [218, 183],
          [198, 193],
          [179, 181],
          [168, 158]
        ]]
      }
    },
    {
      id: "bed-frame",
      colliders: [{ points: [[31, 116], [89, 116], [92, 173], [33, 176]] }],
      occluder: {
        id: "bed-frame",
        depthY: 176,
        polygons: [
          [[31, 116], [89, 116], [92, 173], [33, 176]],
          [[42, 120], [78, 120], [78, 154], [42, 158]]
        ]
      }
    },
    {
      id: "chest",
      colliders: [{ points: [[95, 128], [126, 128], [126, 155], [94, 155]] }],
      occluder: {
        id: "chest",
        depthY: 156,
        polygons: [[[95, 128], [126, 128], [126, 155], [94, 155]]]
      }
    },
    {
      id: "room-cabinet-desk",
      colliders: [
        { x: 142, y: 116, w: 15, h: 60 },
        { points: [[159, 138], [192, 138], [192, 170], [158, 172]] }
      ],
      occluder: {
        id: "room-cabinet-desk",
        depthY: 176,
        polygons: [
          [[142, 116], [157, 116], [157, 175], [142, 175]],
          [[159, 138], [192, 138], [192, 170], [182, 172], [158, 172]]
        ]
      }
    },
    {
      id: "minglun-eave",
      occluder: {
        id: "minglun-eave",
        depthY: 82,
        polygons: [[[202, 0], [502, 0], [492, 70], [216, 78]]]
      }
    },
    {
      id: "west-gate",
      occluder: {
        id: "west-gate",
        depthY: 346,
        polygons: [
          [[304, 212], [423, 212], [437, 230], [432, 266], [294, 266], [287, 246], [294, 226]],
          [[310, 258], [329, 258], [329, 345], [310, 345]],
          [[326, 262], [346, 264], [346, 329], [327, 320]],
          [[400, 258], [420, 258], [420, 345], [400, 345]],
          [[383, 264], [403, 262], [403, 320], [383, 329]],
          [[313, 260], [323, 260], [323, 286], [313, 286]],
          [[397, 260], [408, 260], [408, 286], [397, 286]]
        ]
      }
    },
    {
      id: "bridge-front-rail",
      occluder: {
        id: "bridge-front-rail",
        depthY: 232,
        polygons: [
          [
            [421, 193],
            [439, 204],
            [458, 210],
            [477, 210],
            [496, 201],
            [511, 191],
            [514, 218],
            [497, 230],
            [475, 237],
            [451, 233],
            [429, 225],
            [418, 214]
          ],
          [[422, 184], [435, 184], [435, 228], [422, 228]],
          [[456, 187], [469, 187], [469, 237], [456, 237]],
          [[502, 183], [515, 183], [515, 226], [502, 226]]
        ]
      }
    },
    {
      id: "courtyard-pond",
      effects: [{
        id: "courtyard-pond-ripple",
        kind: "water-ripple",
        // 点沿真实水面内缘标定，刻意避开岸石；换底图时只重标这里。
        polygons: [[
          [457, 134],
          [515, 125],
          [559, 129],
          [584, 143],
          [590, 176],
          [579, 215],
          [554, 244],
          [526, 258],
          [486, 260],
          [461, 247],
          [442, 224],
          [438, 194],
          [443, 160]
        ]],
        // 桥体从水面蒙版中扣除，波纹不会再扫过栏板与桥面。
        holes: [[
          [421, 176],
          [441, 168],
          [476, 168],
          [505, 180],
          [519, 198],
          [515, 218],
          [498, 234],
          [475, 241],
          [448, 236],
          [426, 224],
          [416, 210]
        ]],
        ripple: {
          color: "rgba(190, 211, 203, .48)",
          rowSpacing: 17,
          segmentSpacing: 43,
          minLength: 7,
          maxLength: 15,
          speedMs: 420
        }
      }]
    }
  ];
  var FUXUE_OBSTACLES = FUXUE_GEOMETRY.flatMap((object) => object.colliders ?? []);
  var FUXUE_OCCLUDERS = FUXUE_GEOMETRY.flatMap((object) => object.occluder ? [object.occluder] : []);
  var FUXUE_EFFECTS = FUXUE_GEOMETRY.flatMap((object) => object.effects ?? []);
  function isConvex(points) {
    let sign = 0;
    for (let index = 0; index < points.length; index++) {
      const a = points[index], b = points[(index + 1) % points.length], c = points[(index + 2) % points.length];
      const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
      if (cross === 0) continue;
      const nextSign = Math.sign(cross);
      if (sign !== 0 && nextSign !== sign) return false;
      sign = nextSign;
    }
    return sign !== 0;
  }
  function validateFuxueGeometry() {
    const errors = [];
    if (FUXUE_ACTOR_PROFILE.halfW <= 0 || FUXUE_ACTOR_PROFILE.bottomInset < 0 || FUXUE_ACTOR_PROFILE.topInset <= FUXUE_ACTOR_PROFILE.bottomInset) {
      errors.push("actor-profile: \u811A\u5E95\u78B0\u649E\u76D2\u5C3A\u5BF8\u65E0\u6548");
    }
    for (const object of FUXUE_GEOMETRY) {
      for (const [index, shape] of (object.colliders ?? []).entries()) {
        if ("x" in shape) {
          if (shape.w <= 0 || shape.h <= 0) errors.push(`${object.id}.collider[${index}]: \u5C3A\u5BF8\u5FC5\u987B\u4E3A\u6B63\u6570`);
          if (shape.x < 0 || shape.y < 0 || shape.x + shape.w > FUXUE_WORLD_W || shape.y + shape.h > FUXUE_WORLD_H) {
            errors.push(`${object.id}.collider[${index}]: \u8D85\u51FA\u573A\u666F\u8FB9\u754C`);
          }
        } else {
          if (shape.points.length < 3) errors.push(`${object.id}.collider[${index}]: \u81F3\u5C11\u9700\u8981\u4E09\u4E2A\u70B9`);
          else if (!isConvex(shape.points)) errors.push(`${object.id}.collider[${index}]: \u78B0\u649E\u591A\u8FB9\u5F62\u5FC5\u987B\u4E3A\u51F8\u5F62`);
          for (const [x, y] of shape.points) {
            if (x < 0 || y < 0 || x > FUXUE_WORLD_W || y > FUXUE_WORLD_H) {
              errors.push(`${object.id}.collider[${index}]: \u70B9 (${x}, ${y}) \u8D85\u51FA\u573A\u666F\u8FB9\u754C`);
            }
          }
        }
      }
      for (const effect of object.effects ?? []) {
        if (effect.polygons.length === 0) errors.push(`${object.id}.${effect.id}: \u7279\u6548\u533A\u57DF\u4E0D\u80FD\u4E3A\u7A7A`);
        if (effect.ripple.rowSpacing <= 0 || effect.ripple.segmentSpacing <= 0 || effect.ripple.minLength <= 0 || effect.ripple.maxLength < effect.ripple.minLength || effect.ripple.speedMs <= 0) errors.push(`${object.id}.${effect.id}: \u6CE2\u7EB9\u53C2\u6570\u65E0\u6548`);
        for (const [group, polygons2] of [["polygon", effect.polygons], ["hole", effect.holes ?? []]]) {
          for (const [index, polygon2] of polygons2.entries()) {
            if (polygon2.length < 3) errors.push(`${object.id}.${effect.id}.${group}[${index}]: \u81F3\u5C11\u9700\u8981\u4E09\u4E2A\u70B9`);
            for (const [x, y] of polygon2) {
              if (x < 0 || y < 0 || x > FUXUE_WORLD_W || y > FUXUE_WORLD_H) {
                errors.push(`${object.id}.${effect.id}.${group}[${index}]: \u70B9 (${x}, ${y}) \u8D85\u51FA\u573A\u666F\u8FB9\u754C`);
              }
            }
          }
        }
      }
      const occluder = object.occluder;
      if (!occluder) continue;
      if (occluder.id !== object.id) errors.push(`${object.id}: occluder id \u4E0D\u4E00\u81F4`);
      if (occluder.depthY < 0 || occluder.depthY > FUXUE_WORLD_H) {
        errors.push(`${object.id}: depthY \u8D85\u51FA\u573A\u666F\u8FB9\u754C`);
      }
      for (const [index, polygon2] of occluder.polygons.entries()) {
        if (polygon2.length < 3) errors.push(`${object.id}.polygon[${index}]: \u81F3\u5C11\u9700\u8981\u4E09\u4E2A\u70B9`);
        for (const [x, y] of polygon2) {
          if (x < 0 || y < 0 || x > FUXUE_WORLD_W || y > FUXUE_WORLD_H) {
            errors.push(`${object.id}.polygon[${index}]: \u70B9 (${x}, ${y}) \u8D85\u51FA\u573A\u666F\u8FB9\u754C`);
          }
        }
      }
    }
    return errors;
  }

  // src/data/fuxue.ts
  var FUXUE_W = 46;
  var FUXUE_H = 26;
  var FUXUE_TILE_REGIONS = [
    { id: "west-courtyard", x: 1, y: 1, w: 37, h: 20, tile: T.PATH },
    { id: "south-street", x: 1, y: 21, w: 44, h: 5, tile: T.PATH },
    { id: "south-wall", x: 1, y: 15, w: 37, h: 6, tile: T.WALL },
    { id: "west-gate-opening", x: 21, y: 15, w: 4, h: 8, tile: T.PATH },
    { id: "minglun-hall", x: 14, y: 0, w: 17, h: 5, tile: T.WALL },
    { id: "minglun-platform", x: 15, y: 5, w: 15, h: 2, tile: T.PLAT },
    { id: "quarters-interior", x: 1, y: 2, w: 12, h: 9, tile: T.CORR },
    { id: "quarters-back-wall", x: 1, y: 1, w: 13, h: 6, tile: T.WALL },
    { id: "quarters-left-wall", x: 1, y: 1, w: 1, h: 10, tile: T.WALL },
    { id: "quarters-right-wall", x: 13, y: 1, w: 1, h: 10, tile: T.WALL },
    { id: "quarters-south-wall", x: 1, y: 10, w: 13, h: 1, tile: T.WALL },
    { id: "quarters-stairs", x: 7, y: 10, w: 3, h: 4, tile: T.CORR },
    { id: "courtyard-pond", x: 27, y: 6, w: 11, h: 11, tile: T.WATER },
    { id: "pond-bridge", x: 27, y: 11, w: 4, h: 3, tile: T.BRIDGE },
    { id: "east-temple", x: 38, y: 0, w: 8, h: 21, tile: T.WALL }
  ];
  function fillRect(map, x, y, w, h, tile) {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
      if (xx >= 0 && yy >= 0 && xx < FUXUE_W && yy < FUXUE_H) map[yy * FUXUE_W + xx] = tile;
    }
  }
  function buildFuxueMap(regions = FUXUE_TILE_REGIONS) {
    const map = new Uint8Array(FUXUE_W * FUXUE_H);
    map.fill(T.WALL);
    for (const region of regions) fillRect(map, region.x, region.y, region.w, region.h, region.tile);
    return {
      map,
      w: FUXUE_W,
      h: FUXUE_H,
      spawn: { x: 22 * TILE, y: 24 * TILE },
      obstacles: FUXUE_OBSTACLES
    };
  }
  var HOME_INTERACTIONS = [
    // 沈砚秋站在门洞偏右、门扇之后；原 x=24 格会被右门扇整个人盖住。
    { id: "shen", x: 23.25 * TILE, y: 19.5 * TILE, label: "\u6C88\u781A\u79CB" },
    // 交互锚点放在家具可接近的前缘，不放在碰撞体中心。
    { id: "desk", x: 10.25 * TILE, y: 10.75 * TILE, label: "\u7A97\u4E0B\u4E66\u6848" },
    { id: "bed", x: 6 * TILE, y: 9.5 * TILE, label: "\u5E8A\u94FA" },
    { id: "chest", x: 8 * TILE, y: 8.8 * TILE, label: "\u7BB1\u7B3C" },
    { id: "rubbings", x: 9.5 * TILE, y: 8.75 * TILE, label: "\u4E66\u67B6\u4E0E\u62D3\u7247" },
    // 书架本体不可穿入；锚点放到柜前走道，确保脚底盒可达。
    { id: "bookcase", x: 11.7 * TILE, y: 11.5 * TILE, label: "\u4E66\u67B6\u4E0B\u5C42" },
    { id: "corner", x: 33 * TILE, y: 3.5 * TILE, label: "\u5802\u540E\u6A90\u89D2" },
    { id: "courtyard", x: 17.5 * TILE, y: 13.5 * TILE, label: "\u8001\u6811\u4E0B" },
    { id: "minglun", x: 22 * TILE, y: 7.1 * TILE, label: "\u660E\u4F26\u5802\u524D" },
    { id: "gate", x: 22 * TILE, y: 20.5 * TILE, label: "\u897F\u5B66\u95E8" }
  ];

  // src/data/geometry-draft.ts
  var FUXUE_GEOMETRY_DRAFT_KEY = "gusu:geometry-editor:fuxue-west-home:v1";
  var FUXUE_GEOMETRY_DRAFT_META_KEY = `${FUXUE_GEOMETRY_DRAFT_KEY}:saved-at`;
  var FUXUE_GEOMETRY_COMMITTED_KEY = "gusu:geometry-editor:fuxue-west-home:latest";
  var FUXUE_GEOMETRY_COMMITTED_META_KEY = `${FUXUE_GEOMETRY_COMMITTED_KEY}:saved-at`;
  var FUXUE_GEOMETRY_WINDOW_PREFIX = "gusu-geometry-draft:fuxue-west-home:";
  function windowRecord() {
    if (!window.name.startsWith(FUXUE_GEOMETRY_WINDOW_PREFIX)) return null;
    const raw = window.name.slice(FUXUE_GEOMETRY_WINDOW_PREFIX.length);
    try {
      const envelope = JSON.parse(raw);
      if (envelope.format === "gusu-geometry-draft-transport" && typeof envelope.value === "string" && typeof envelope.savedAt === "number") {
        return { value: envelope.value, savedAt: envelope.savedAt, committed: envelope.committed === true };
      }
    } catch {
    }
    return { value: raw, savedAt: Date.now(), committed: false };
  }
  function localRecord(key, metaKey, committed) {
    try {
      const value = localStorage.getItem(key);
      if (!value) return null;
      const savedAt = Number(localStorage.getItem(metaKey)) || 0;
      return { value, savedAt, committed };
    } catch {
      return null;
    }
  }
  function readFuxueGeometryDraftRecord() {
    const candidates = [
      windowRecord(),
      localRecord(FUXUE_GEOMETRY_DRAFT_KEY, FUXUE_GEOMETRY_DRAFT_META_KEY, false),
      localRecord(FUXUE_GEOMETRY_COMMITTED_KEY, FUXUE_GEOMETRY_COMMITTED_META_KEY, true)
    ].filter((item) => !!item);
    candidates.sort((a, b) => b.savedAt - a.savedAt || Number(b.committed) - Number(a.committed));
    return candidates[0] ?? null;
  }
  function readFuxueGeometryDraftText() {
    return readFuxueGeometryDraftRecord()?.value ?? null;
  }
  function point(value) {
    if (!Array.isArray(value) || value.length !== 2) return null;
    const x = Number(value[0]), y = Number(value[1]);
    return Number.isFinite(x) && Number.isFinite(y) ? [x, y] : null;
  }
  function polygon(value) {
    if (!Array.isArray(value)) return null;
    const points = value.map(point);
    return points.length >= 3 && points.every(Boolean) ? points : null;
  }
  function polygons(value) {
    if (!Array.isArray(value)) return null;
    const result = value.map(polygon);
    return result.every(Boolean) ? result : null;
  }
  function isConvex2(points) {
    let sign = 0;
    for (let index = 0; index < points.length; index++) {
      const a = points[index], b = points[(index + 1) % points.length], c = points[(index + 2) % points.length];
      const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
      if (cross === 0) continue;
      if (sign && Math.sign(cross) !== sign) return false;
      sign = Math.sign(cross);
    }
    return sign !== 0;
  }
  function readFuxueGeometryDraft() {
    try {
      const raw = readFuxueGeometryDraftText();
      if (!raw) return null;
      const document2 = JSON.parse(raw);
      if (document2.format !== "gusu-scene-geometry" || document2.sceneId !== "fuxue-west-home" || !Array.isArray(document2.objects)) return null;
      const output = [];
      for (const candidate of document2.objects) {
        if (typeof candidate.id !== "string") return null;
        const colliders = Array.isArray(candidate.colliders) ? candidate.colliders.map(polygon) : [];
        if (colliders.some((shape) => !shape || !isConvex2(shape))) return null;
        let occluder;
        if (candidate.occluder && typeof candidate.occluder === "object") {
          const rawOccluder = candidate.occluder;
          const occluderPolygons = polygons(rawOccluder.polygons);
          const depthY = Number(rawOccluder.depthY);
          if (typeof rawOccluder.id !== "string" || !Number.isFinite(depthY) || !occluderPolygons) return null;
          occluder = { id: rawOccluder.id, depthY, polygons: occluderPolygons };
        }
        const effects = [];
        if (Array.isArray(candidate.effects)) {
          for (const rawEffect of candidate.effects) {
            if (!rawEffect || typeof rawEffect !== "object") return null;
            const effect = rawEffect;
            const effectPolygons = polygons(effect.polygons);
            const holes = polygons(effect.holes ?? []);
            const ripple = effect.ripple;
            if (typeof effect.id !== "string" || effect.kind !== "water-ripple" || !effectPolygons || !holes || !ripple) return null;
            if (typeof ripple.color !== "string" || !ripple.color) return null;
            const style = {
              color: ripple.color,
              rowSpacing: Number(ripple.rowSpacing),
              segmentSpacing: Number(ripple.segmentSpacing),
              minLength: Number(ripple.minLength),
              maxLength: Number(ripple.maxLength),
              speedMs: Number(ripple.speedMs)
            };
            if (Object.values(style).some((value) => typeof value === "number" && !Number.isFinite(value)) || style.rowSpacing <= 0 || style.segmentSpacing <= 0 || style.minLength <= 0 || style.maxLength < style.minLength || style.speedMs <= 0) return null;
            effects.push({ id: effect.id, kind: "water-ripple", polygons: effectPolygons, holes, ripple: style });
          }
        }
        output.push({
          id: candidate.id,
          colliders: colliders.map((shape) => ({ points: shape })),
          occluder,
          effects
        });
      }
      let tileRegions = null;
      if (Array.isArray(document2.tileRegions)) {
        tileRegions = [];
        for (const rawRegion of document2.tileRegions) {
          if (!rawRegion || typeof rawRegion !== "object") return null;
          const region = rawRegion;
          const parsed = {
            id: region.id,
            x: Number(region.x),
            y: Number(region.y),
            w: Number(region.w),
            h: Number(region.h),
            tile: Number(region.tile)
          };
          if (typeof parsed.id !== "string" || ![parsed.x, parsed.y, parsed.w, parsed.h, parsed.tile].every(Number.isInteger) || parsed.w <= 0 || parsed.h <= 0 || parsed.x < 0 || parsed.y < 0 || parsed.x + parsed.w > FUXUE_W || parsed.y + parsed.h > FUXUE_H || parsed.tile < 0 || parsed.tile > 15) return null;
          tileRegions.push(parsed);
        }
      }
      return { geometry: output, tileRegions };
    } catch {
      return null;
    }
  }

  // src/render/pixel.ts
  function px(g, x, y, w, h, color) {
    g.fillStyle = color;
    g.fillRect(x | 0, y | 0, w | 0, h | 0);
  }

  // src/render/effects.ts
  function drawWaterRipples(g, regions, cam2, now2) {
    for (const effect of regions) {
      if (effect.kind !== "water-ripple") continue;
      const allPoints = effect.polygons.flat();
      if (!allPoints.length) continue;
      const minX = Math.min(...allPoints.map(([x]) => x));
      const maxX = Math.max(...allPoints.map(([x]) => x));
      const minY = Math.min(...allPoints.map(([, y]) => y));
      const maxY = Math.max(...allPoints.map(([, y]) => y));
      const style = effect.ripple;
      const phase = Math.floor(now2 / style.speedMs);
      g.save();
      g.beginPath();
      for (const polygon2 of [...effect.polygons, ...effect.holes ?? []]) {
        polygon2.forEach(([x, y], index) => index === 0 ? g.moveTo(Math.round(x - cam2.x), Math.round(y - cam2.y)) : g.lineTo(Math.round(x - cam2.x), Math.round(y - cam2.y)));
        g.closePath();
      }
      g.clip("evenodd");
      g.fillStyle = style.color;
      for (let yy = minY + phase % 3 * 3; yy <= maxY; yy += style.rowSpacing) {
        const row = Math.floor(yy / style.rowSpacing);
        const shift = ((row * 17 + phase * 5) % style.segmentSpacing + style.segmentSpacing) % style.segmentSpacing;
        for (let xx = minX - style.segmentSpacing + shift; xx <= maxX; xx += style.segmentSpacing) {
          const span = style.maxLength - style.minLength + 1;
          const length = style.minLength + Math.abs((row * 11 + Math.floor(xx) * 3) % span);
          g.fillRect(Math.round(xx - cam2.x), Math.round(yy - cam2.y), length, 1);
        }
      }
      g.restore();
    }
  }

  // src/render/fuxue.ts
  var FUXUE_ART_W = FUXUE_WORLD_W;
  var FUXUE_ART_H = FUXUE_WORLD_H;
  var scene = new Image();
  scene.src = "../assets/fuxue/fuxue-west-home-game-v2.png";
  var shenSprite = new Image();
  shenSprite.src = "../assets/characters/shen-yanqiu-sprites-v1.png";
  var SPRITE_CELL = 362;
  function drawFuxueScene(g, cam2) {
    g.fillStyle = "#20231f";
    g.fillRect(0, 0, FUXUE_ART_W, FUXUE_ART_H);
    if (scene.complete && scene.naturalWidth) {
      g.drawImage(scene, 0, 0, scene.naturalWidth, scene.naturalHeight, -cam2.x, -cam2.y, FUXUE_ART_W, FUXUE_ART_H);
    }
  }
  function drawFuxueOccluder(g, cam2, occluder) {
    if (!scene.complete || !scene.naturalWidth) return;
    g.save();
    g.beginPath();
    for (const polygon2 of occluder.polygons) {
      polygon2.forEach(([x, y], index) => {
        const sx = Math.round(x - cam2.x);
        const sy = Math.round(y - cam2.y);
        if (index === 0) g.moveTo(sx, sy);
        else g.lineTo(sx, sy);
      });
      g.closePath();
    }
    g.clip();
    g.drawImage(
      scene,
      0,
      0,
      scene.naturalWidth,
      scene.naturalHeight,
      -cam2.x,
      -cam2.y,
      FUXUE_ART_W,
      FUXUE_ART_H
    );
    g.restore();
  }
  function drawFuxueGeometryDebug(g, cam2, actor, geometry = FUXUE_GEOMETRY) {
    g.save();
    g.lineWidth = 1;
    for (const object of geometry) {
      for (const shape of object.colliders ?? []) {
        g.fillStyle = "rgba(225, 54, 54, .26)";
        g.strokeStyle = "#ef5350";
        if ("x" in shape) {
          const x = Math.round(shape.x - cam2.x);
          const y = Math.round(shape.y - cam2.y);
          g.fillRect(x, y, shape.w, shape.h);
          g.strokeRect(x + 0.5, y + 0.5, shape.w - 1, shape.h - 1);
        } else {
          g.beginPath();
          shape.points.forEach(([worldX, worldY], index) => index === 0 ? g.moveTo(Math.round(worldX - cam2.x), Math.round(worldY - cam2.y)) : g.lineTo(Math.round(worldX - cam2.x), Math.round(worldY - cam2.y)));
          g.closePath();
          g.fill();
          g.stroke();
        }
      }
      const occluder = object.occluder;
      if (occluder) {
        let minX = Infinity;
        let maxX = -Infinity;
        g.strokeStyle = "#35d8e6";
        g.fillStyle = "rgba(53, 216, 230, .08)";
        for (const polygon2 of occluder.polygons) {
          g.beginPath();
          polygon2.forEach(([worldX, worldY], index) => {
            minX = Math.min(minX, worldX);
            maxX = Math.max(maxX, worldX);
            const x = Math.round(worldX - cam2.x);
            const y = Math.round(worldY - cam2.y);
            if (index === 0) g.moveTo(x, y);
            else g.lineTo(x, y);
          });
          g.closePath();
          g.fill();
          g.stroke();
        }
        g.strokeStyle = "#f4d35e";
        g.beginPath();
        g.moveTo(Math.round(minX - cam2.x), Math.round(occluder.depthY - cam2.y) + 0.5);
        g.lineTo(Math.round(maxX - cam2.x), Math.round(occluder.depthY - cam2.y) + 0.5);
        g.stroke();
      }
      for (const effect of object.effects ?? []) {
        g.fillStyle = "rgba(54, 126, 255, .14)";
        g.strokeStyle = "#4c8dff";
        for (const polygon2 of effect.polygons) {
          g.beginPath();
          polygon2.forEach(([worldX, worldY], index) => index === 0 ? g.moveTo(Math.round(worldX - cam2.x), Math.round(worldY - cam2.y)) : g.lineTo(Math.round(worldX - cam2.x), Math.round(worldY - cam2.y)));
          g.closePath();
          g.fill();
          g.stroke();
        }
        g.strokeStyle = "#ff9d45";
        for (const polygon2 of effect.holes ?? []) {
          g.beginPath();
          polygon2.forEach(([worldX, worldY], index) => index === 0 ? g.moveTo(Math.round(worldX - cam2.x), Math.round(worldY - cam2.y)) : g.lineTo(Math.round(worldX - cam2.x), Math.round(worldY - cam2.y)));
          g.closePath();
          g.stroke();
        }
      }
    }
    const left = Math.round(actor.x - FUXUE_ACTOR_PROFILE.halfW - cam2.x);
    const top = Math.round(actor.y - FUXUE_ACTOR_PROFILE.topInset - cam2.y);
    const width = FUXUE_ACTOR_PROFILE.halfW * 2;
    const height = FUXUE_ACTOR_PROFILE.topInset - FUXUE_ACTOR_PROFILE.bottomInset;
    g.fillStyle = "rgba(231, 74, 255, .38)";
    g.strokeStyle = "#f263ff";
    g.fillRect(left, top, width, height);
    g.strokeRect(left + 0.5, top + 0.5, width - 1, height - 1);
    const footX = Math.round(actor.x - cam2.x);
    const footY = Math.round(actor.y - cam2.y);
    g.strokeStyle = "#ffffff";
    g.beginPath();
    g.moveTo(footX - 3, footY + 0.5);
    g.lineTo(footX + 3, footY + 0.5);
    g.moveTo(footX + 0.5, footY - 3);
    g.lineTo(footX + 0.5, footY + 3);
    g.stroke();
    g.restore();
  }
  function drawFuxueWater(g, cam2, now2, effects = FUXUE_EFFECTS) {
    drawWaterRipples(g, effects, cam2, now2);
  }
  function drawShen(g, x, y, cam2, now2) {
    const X = Math.round(x - cam2.x), Y = Math.round(y - cam2.y);
    const frame = Math.floor(now2 / 700) % 2;
    g.fillStyle = "rgba(20,22,19,.25)";
    g.fillRect(X - 6, Y - 1, 12, 2);
    if (shenSprite.complete && shenSprite.naturalWidth) {
      g.drawImage(shenSprite, frame * SPRITE_CELL, 0, SPRITE_CELL, SPRITE_CELL, X - 9, Y - 24, 18, 24);
      return;
    }
    px(g, X - 4, Y - 12, 8, 11, "#516b62");
    px(g, X - 3, Y - 18, 6, 6, "#c9b99e");
  }
  function drawInteractionMark(g, x, y, cam2, now2) {
    const X = Math.round(x - cam2.x), Y = Math.round(y - cam2.y - 24 - (Math.sin(now2 / 220) > 0 ? 1 : 0));
    px(g, X - 4, Y, 8, 8, "#242620");
    px(g, X - 3, Y + 1, 6, 6, "#a78d55");
    g.fillStyle = "#242620";
    g.font = "6px monospace";
    g.fillText("E", X - 2, Y + 6);
  }

  // src/render/occlusion.ts
  function compareDepthLayers(a, b) {
    return a.depthY - b.depthY || a.order - b.order;
  }

  // src/render/scene.ts
  var playerSprite = new Image();
  playerSprite.src = "../assets/characters/scholar-player-sprites-v1.png";
  var SPRITE_CELL2 = 362;
  function drawPlayer(ctx2, p, cam2) {
    const X = p.x - cam2.x | 0, Y = p.y - cam2.y | 0;
    const frame = p.moving ? 1 + (p.wt * TUNING.walkAnimFps | 0) % 2 : 0;
    ctx2.fillStyle = "rgba(43,40,36,.18)";
    ctx2.fillRect(X - 5, Y - 1, 10, 2);
    if (playerSprite.complete && playerSprite.naturalWidth > 0) {
      ctx2.drawImage(
        playerSprite,
        frame * SPRITE_CELL2,
        p.dir * SPRITE_CELL2,
        SPRITE_CELL2,
        SPRITE_CELL2,
        X - 9,
        Y - 23,
        18,
        24
      );
      return;
    }
    px(ctx2, X - 3, Y - 4, 2, 4, PALETTE.ink);
    px(ctx2, X + 1, Y - 4, 2, 4, PALETTE.ink);
    if (frame === 1) px(ctx2, X - 3, Y - 2, 2, 2, PALETTE.ink);
    if (frame === 2) px(ctx2, X + 1, Y - 2, 2, 2, PALETTE.ink);
    px(ctx2, X - 4, Y - 11, 8, 8, PALETTE.qing);
    px(ctx2, X - 4, Y - 6, 8, 1, "#2f5a52");
    px(ctx2, X - 3, Y - 16, 6, 5, "#e8d5b5");
    px(ctx2, X - 3, Y - 17, 6, 2, PALETTE.ink);
    px(ctx2, X - 4, Y - 7, 8, 1, PALETTE.zhu);
  }

  // src/render/geometry-debug.ts
  function drawTileGeometryDebug(g, scene2, cam2, view, actor, profile) {
    const tx0 = Math.max(0, Math.floor(cam2.x / TILE) - 1);
    const ty0 = Math.max(0, Math.floor(cam2.y / TILE) - 1);
    const tx1 = Math.min(scene2.w - 1, Math.ceil((cam2.x + view.w) / TILE) + 1);
    const ty1 = Math.min(scene2.h - 1, Math.ceil((cam2.y + view.h) / TILE) + 1);
    g.save();
    g.lineWidth = 1;
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      if (!SOLID.has(scene2.map[ty * scene2.w + tx])) continue;
      const x = Math.round(tx * TILE - cam2.x);
      const y = Math.round(ty * TILE - cam2.y);
      g.fillStyle = "rgba(225, 54, 54, .22)";
      g.strokeStyle = "rgba(239, 83, 80, .82)";
      g.fillRect(x, y, TILE, TILE);
      g.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
    }
    for (const shape of scene2.obstacles ?? []) {
      g.fillStyle = "rgba(225, 54, 54, .3)";
      g.strokeStyle = "#ef5350";
      if ("x" in shape) {
        const x = Math.round(shape.x - cam2.x);
        const y = Math.round(shape.y - cam2.y);
        g.fillRect(x, y, shape.w, shape.h);
        g.strokeRect(x + 0.5, y + 0.5, shape.w - 1, shape.h - 1);
      } else {
        g.beginPath();
        shape.points.forEach(([worldX, worldY], index) => index === 0 ? g.moveTo(Math.round(worldX - cam2.x), Math.round(worldY - cam2.y)) : g.lineTo(Math.round(worldX - cam2.x), Math.round(worldY - cam2.y)));
        g.closePath();
        g.fill();
        g.stroke();
      }
    }
    const footY = Math.round(actor.y - cam2.y);
    g.strokeStyle = "#f4d35e";
    g.beginPath();
    g.moveTo(0, footY + 0.5);
    g.lineTo(view.w, footY + 0.5);
    g.stroke();
    const left = Math.round(actor.x - profile.halfW - cam2.x);
    const top = Math.round(actor.y - profile.topInset - cam2.y);
    const width = profile.halfW * 2;
    const height = profile.topInset - profile.bottomInset;
    g.fillStyle = "rgba(231, 74, 255, .42)";
    g.strokeStyle = "#f263ff";
    g.fillRect(left, top, width, height);
    g.strokeRect(left + 0.5, top + 0.5, width - 1, height - 1);
    const footX = Math.round(actor.x - cam2.x);
    g.strokeStyle = "#fff";
    g.beginPath();
    g.moveTo(footX - 3, footY + 0.5);
    g.lineTo(footX + 3, footY + 0.5);
    g.moveTo(footX + 0.5, footY - 3);
    g.lineTo(footX + 0.5, footY + 3);
    g.stroke();
    g.restore();
  }

  // src/home.ts
  var canvas = document.getElementById("homeGame");
  canvas.width = VIEW_W;
  canvas.height = VIEW_H;
  var ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  var params = new URLSearchParams(location.search);
  document.getElementById("homeJournal").href = chapterSceneHref("journal.html");
  document.getElementById("homeCity").href = chapterSceneHref("sucheng.html");
  var debugGeometry = params.get("debug") === "geometry";
  if (debugGeometry) {
    const geometryErrors = validateFuxueGeometry();
    if (geometryErrors.length) console.warn("[\u5E9C\u5B66\u51E0\u4F55\u6821\u9A8C]", ...geometryErrors);
    else console.info("[\u5E9C\u5B66\u51E0\u4F55\u6821\u9A8C] \u901A\u8FC7");
    const editorLink = document.createElement("a");
    editorLink.href = "geometry-editor.html";
    editorLink.textContent = "\u7F16\u8F91\u51E0\u4F55\u8F6E\u5ED3";
    editorLink.title = "\u6253\u5F00\u53EF\u62D6\u62FD\u7684\u78B0\u649E\u4E0E\u906E\u6321\u8F6E\u5ED3\u7F16\u8F91\u5668";
    document.querySelector(".nav-actions")?.prepend(editorLink);
  }
  var ZOOM = 3;
  var viewW = VIEW_W / ZOOM;
  var viewH = VIEW_H / ZOOM;
  var draft = debugGeometry && params.get("draft") === "1" ? readFuxueGeometryDraft() : null;
  var data = buildFuxueMap(draft?.tileRegions ?? FUXUE_TILE_REGIONS);
  var runtimeGeometry = draft?.geometry ?? FUXUE_GEOMETRY;
  var runtimeObstacles = runtimeGeometry.flatMap((object) => object.colliders ?? []);
  var runtimeOccluders = runtimeGeometry.flatMap((object) => object.occluder ? [object.occluder] : []);
  var runtimeEffects = draft ? runtimeGeometry.flatMap((object) => object.effects ?? []) : FUXUE_EFFECTS;
  if (debugGeometry && params.get("draft") === "1") {
    const previewNote = document.createElement("span");
    previewNote.className = "geometry-draft-note";
    previewNote.textContent = draft ? "\u6B63\u5728\u9884\u89C8\u51E0\u4F55\u8349\u7A3F" : "\u672A\u627E\u5230\u8349\u7A3F\uFF0C\u663E\u793A\u6B63\u5F0F\u7248\u672C";
    document.querySelector(".nav-actions")?.prepend(previewNote);
  }
  var worldW = data.w * TILE;
  var worldH = data.h * TILE;
  var engine = new Engine();
  var player = { x: data.spawn.x, y: data.spawn.y, dir: 3, moving: false, wt: 0 };
  var cam = {
    x: Math.max(0, Math.min(worldW - viewW, player.x - viewW / 2)),
    y: Math.max(0, Math.min(worldH - viewH, player.y - viewH / 2))
  };
  var now = 0;
  var dialogueOpen = false;
  var oriented = hasStoryFlag(loadProgress(), "home-orientation-complete");
  var guMet = hasStoryFlag(loadProgress(), "gu-met");
  var canglangDone = loadProgress().completedTasks.includes("canglang-three-windows");
  var objective = document.getElementById("homeObjective");
  var prompt = document.getElementById("interactionPrompt");
  var promptText = prompt.querySelector("span");
  var dialogue = document.getElementById("homeDialogue");
  var dialogueSpeaker = document.getElementById("dialogueSpeaker");
  var dialogueLine = document.getElementById("dialogueLine");
  var dialogueAside = document.getElementById("dialogueAside");
  var dialogueNext = document.getElementById("dialogueNext");
  var dialogueChoices = document.getElementById("dialogueChoices");
  var homeAlbum = document.getElementById("homeAlbum");
  var albumWindows = document.getElementById("albumWindows");
  var albumResult = document.getElementById("albumResult");
  var albumClose = document.getElementById("albumClose");
  var beats = [];
  var beatIndex = 0;
  var afterDialogue = null;
  var albumOpen = false;
  var variant = createVariantCollation(() => {
    engine.clearInput();
    updateObjective();
    canvas.focus();
  }, () => interact("bookcase", true));
  window.addEventListener("keydown", (event) => variant.key(event));
  var objectFlags = {
    desk: "home-desk-known",
    rubbings: "home-rubbings-known",
    courtyard: "home-courtyard-heard",
    gate: "home-gate-known",
    bookcase: "home-bookcase-book-known",
    corner: "home-corner-leaf-known"
  };
  var known = /* @__PURE__ */ new Set();
  for (const [id, flag] of Object.entries(objectFlags)) {
    if (hasStoryFlag(loadProgress(), flag)) known.add(id);
  }
  function updateObjective() {
    if (canCollateLiuyuan(loadProgress()) && !loadProgress().knowledge.includes(LIUYUAN_VARIANT_COLLATED)) {
      objective.textContent = "\u5230\u658B\u820D\u4E66\u67B6\uFF0C\u6838\u4E00\u6838\u53F6\u4E0A\u90A3\u4E2A\u4E0D\u540C\u7684\u5B57";
    } else if (canCollateLiuyuan(loadProgress()) && !oriented) {
      objective.textContent = "\u5F02\u6587\u5DF2\u8BB0\u5165\u56ED\u8C31\u3002\u53EF\u56DE\u770B\u8FD9\u4E00\u7A0B\uFF0C\u518D\u7EE7\u7EED\u63A2\u7D22\u5E9C\u5B66";
    } else if (canglangDone && !hasStoryFlag(loadProgress(), "fuxue-first-return-seen")) {
      objective.textContent = "\u56DE\u658B\u820D\uFF0C\u628A\u4E09\u7A97\u8BB0\u5F55\u6536\u5165\u56ED\u8C31";
    } else if (!oriented && !known.has("desk")) {
      objective.textContent = "\u5148\u53BB\u897F\u4FA7\u658B\u820D\u653E\u4E0B\u4E66\u7BB1";
    } else if (!oriented) {
      objective.textContent = "\u518D\u8BA4\u4E00\u8BA4\u8FD9\u5EA7\u9662\u5B50";
    } else if (!guMet) {
      objective.textContent = "\u5230\u660E\u4F26\u5802\u9662\u770B\u770B";
    } else if (!hasStoryFlag(loadProgress(), "first-lesson-offered")) {
      objective.textContent = "\u67E5\u770B\u660E\u4F26\u5802\u524D\u538B\u7740\u7684\u6B8B\u9875";
    } else {
      objective.textContent = "\u4ECE\u897F\u5B66\u95E8\u8D70\u8FDB\u82CF\u5DDE";
    }
  }
  function openDialogue(nextBeats, done) {
    beats = nextBeats;
    beatIndex = 0;
    afterDialogue = done ?? null;
    dialogueOpen = true;
    dialogue.hidden = false;
    prompt.hidden = true;
    renderDialogue();
    dialogueNext.focus();
  }
  function renderDialogue() {
    const beat = beats[beatIndex];
    dialogue.dataset.portrait = beat.speaker.includes("\u6C88\u781A\u79CB") || beat.speaker.includes("\u964C\u751F\u5B66\u5B50") ? "shen" : beat.speaker === "\u5B66\u5B50" ? "player" : "none";
    dialogueSpeaker.textContent = beat.speaker;
    dialogueLine.textContent = beat.line;
    dialogueAside.textContent = beat.aside ?? "";
    dialogueChoices.replaceChildren();
    const choices = beat.choices ?? [];
    dialogueChoices.hidden = choices.length === 0;
    dialogueNext.hidden = choices.length > 0;
    for (const choice of choices) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = choice.label;
      button.addEventListener("click", () => {
        beats = choice.response;
        beatIndex = 0;
        if (choice.done) afterDialogue = choice.done;
        renderDialogue();
      });
      dialogueChoices.append(button);
    }
    dialogueNext.textContent = beatIndex === beats.length - 1 ? "\u6536\u8D77" : "\u7EE7\u7EED";
  }
  function closeDialogue() {
    dialogueOpen = false;
    dialogue.hidden = true;
    const done = afterDialogue;
    afterDialogue = null;
    done?.();
    updateObjective();
    canvas.focus();
  }
  dialogueNext.addEventListener("click", () => {
    if (beatIndex < beats.length - 1) {
      beatIndex += 1;
      renderDialogue();
    } else closeDialogue();
  });
  function registerKnown(id) {
    const flag = objectFlags[id];
    if (flag) markStoryFlag(flag);
    known.add(id);
    const followup = [];
    const orientationCount = ["rubbings", "courtyard", "gate"].filter((item) => known.has(item)).length;
    if (!oriented && known.has("desk") && orientationCount >= 2) {
      oriented = true;
      markStoryFlag("shen-met");
      markStoryFlag("home-orientation-complete");
      followup.push({
        speaker: "\u6C88\u781A\u79CB",
        line: "\u6211\u53EB\u6C88\u781A\u79CB\u3002\u781A\u53F0\u7684\u781A\uFF0C\u79CB\u6C34\u7684\u79CB\u3002\u5F80\u540E\u82E5\u627E\u4E0D\u7740\u8DEF\uFF0C\u5148\u6765\u9662\u91CC\u5BFB\u6211\u3002\u53EA\u662F\u6211\u4E5F\u672A\u5FC5\u603B\u5728\u8FD9\u91CC\u3002",
        aside: "\u9662\u5B50\u6CA1\u6709\u5F39\u51FA\u5730\u56FE\uFF0C\u5374\u5DF2\u7ECF\u5F00\u59CB\u53D8\u5F97\u53EF\u4EE5\u8FA8\u8BA4\u3002"
      });
      followup.push({ speaker: "\u6C88\u781A\u79CB", line: "\u6211\u53BB\u4EA4\u540D\u518C\u3002\u6E05\u6668\u8FD8\u65E9\uFF0C\u4F60\u81EA\u5DF1\u770B\u770B\u3002", aside: "\u9662\u5B50\u5B89\u9759\u4E0B\u6765\u3002\u6CA1\u6709\u65B0\u7684\u4EFB\u52A1\u5361\u3002" });
    }
    return followup;
  }
  function chestContents() {
    const progress = loadProgress();
    const items = [];
    if (hasStoryFlag(progress, "home-bookcase-book-known")) items.push("\u4E00\u518C\u65E0\u540D\u65E7\u4E66");
    if (hasStoryFlag(progress, "home-pages-known")) items.push("\u4E00\u53E0\u7A7A\u767D\u8BFE\u9875");
    if (hasStoryFlag(progress, "home-corner-leaf-known")) items.push("\u6765\u5904\u4E0D\u660E\u7684\u65E7\u7EB8");
    if (hasStoryFlag(progress, "home-broken-leaf-seen")) items.push("\u4E00\u5C0F\u7247\u788E\u53F6");
    if (hasStoryFlag(progress, "home-teacher-letter-known")) items.push("\u4E00\u5C01\u6CA1\u6709\u5199\u5B8C\u7684\u65E7\u4FE1");
    return items;
  }
  function openAlbumReturn() {
    albumOpen = true;
    homeAlbum.hidden = false;
    prompt.hidden = true;
    albumResult.textContent = "\u7A97\u6846\u8FD8\u662F\u7A7A\u7684\uFF0C\u7B14\u5374\u662F\u65B0\u6DFB\u7684\u3002";
    albumClose.disabled = true;
    for (const button of albumWindows.querySelectorAll("button[data-fragment]")) {
      delete button.dataset.placed;
      button.disabled = false;
    }
    albumWindows.querySelector("button")?.focus();
  }
  albumWindows.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-fragment]");
    if (!button || button.dataset.placed === "true") return;
    button.dataset.placed = "true";
    button.disabled = true;
    const placed = albumWindows.querySelectorAll('[data-placed="true"]').length;
    albumResult.textContent = placed < 3 ? `\u7B2C${placed === 1 ? "\u4E00" : "\u4E8C"}\u5904\u666F\u843D\u8FDB\u7A97\u6846\u3002\u6C34\u8272\u8FD8\u6CA1\u6709\u8FDE\u8D77\u6765\u3002` : "\u4E09\u5904\u6C34\u666F\u8FDE\u8D77\u6765\uFF0C\u6210\u4E86\u4E00\u6BB5\u6CBF\u5ECA\u79FB\u52A8\u7684\u957F\u5377\u3002";
    if (placed === 3) {
      albumClose.disabled = false;
      window.setTimeout(() => albumClose.focus(), TUNING.albumStrokeMs);
    }
  });
  albumClose.addEventListener("click", () => {
    if (albumClose.disabled) return;
    markStoryFlag("fuxue-first-return-seen");
    albumOpen = false;
    homeAlbum.hidden = true;
    openDialogue([
      { speaker: "\u56ED\u8C31\u4E66\u6848", line: "\u6CA7\u6D6A\u4EAD\u9875\u7684\u4E09\u6247\u7A7A\u7A97\u6709\u4E86\u666F\u3002\u82CF\u57CE\u4E1C\u5357\uFF0C\u4E5F\u6D6E\u51FA\u4E00\u70B9\u65B0\u58A8\u3002", aside: "\u6570 \xB7 \u89C2\u4F4D\u521D\u8BC6\u3000\uFF5C\u3000\u7F51\u5E08\u56ED \xB7 \u65B0\u7EBF\u7D22" }
    ]);
  });
  function interact(id, otherBooks = false) {
    if (id === "shen") {
      openDialogue(oriented ? [
        { speaker: "\u6C88\u781A\u79CB", line: "\u660E\u4F26\u5802\u5728\u5317\u8FB9\u3002\u4E1C\u9762\u90A3\u91CD\u9662\u95E8\u901A\u5411\u6587\u5E99\uFF0C\u5E73\u65E5\u4E0D\u8981\u62FF\u5B83\u5F53\u8FD1\u8DEF\u3002", aside: "\u4ED6\u4E00\u8FB9\u8BF4\uFF0C\u4E00\u8FB9\u7ED9\u6000\u91CC\u7684\u4E66\u91CD\u65B0\u7406\u9F50\u3002" }
      ] : [
        { speaker: "\u964C\u751F\u5B66\u5B50", line: "\u658B\u820D\u5728\u897F\u8FB9\u3002\u5148\u628A\u4E66\u7BB1\u653E\u4E0B\uFF0C\u518D\u81EA\u5DF1\u770B\u770B\u3002", aside: "\u4ED6\u6CA1\u6709\u66FF\u4F60\u5E26\u8DEF\uFF0C\u53EA\u671D\u5F00\u7740\u95E8\u7684\u4FA7\u5C4B\u504F\u4E86\u504F\u5934\u3002" }
      ]);
      return;
    }
    if (id === "desk") {
      const extra = registerKnown(id);
      if (canglangDone && !hasStoryFlag(loadProgress(), "fuxue-first-return-seen")) {
        openDialogue([
          { speaker: "\u7A97\u4E0B\u4E66\u6848", line: "\u7A97\u6846\u8FD8\u662F\u7A7A\u7684\uFF0C\u7B14\u5374\u662F\u65B0\u6DFB\u7684\u3002", aside: "\u628A\u4E09\u5904\u6C34\u666F\u4EB2\u624B\u653E\u56DE\u56ED\u8C31\u3002\u6B21\u5E8F\u7531\u4F60\u3002" }
        ], openAlbumReturn);
      } else {
        openDialogue([
          { speaker: "\u6C88\u781A\u79CB", line: "\u8FD9\u5F20\u6848\u7A7A\u7740\uFF0C\u4F60\u5148\u7528\u3002" },
          { speaker: "\u6C88\u781A\u79CB", line: "\u7A97\u7EB8\u662F\u65B0\u6362\u7684\uFF0C\u6848\u89D2\u5374\u65E7\u3002\u524D\u4E00\u4E2A\u4EBA\u5728\u8FD9\u91CC\u78E8\u8FC7\u8BB8\u591A\u5E74\u58A8\u3002" },
          { speaker: "\u7A97\u4E0B\u4E66\u6848", line: "\u4F60\u628A\u4E66\u7BB1\u653E\u7A33\u4E86\u3002", aside: "\u6848\u89D2\u6709\u4E00\u9053\u88AB\u8863\u8896\u78E8\u4EAE\u7684\u5F27\u3002" },
          ...extra
        ]);
      }
      return;
    }
    if (id === "bed") {
      openDialogue([{ speaker: "\u658B\u820D\u5E8A\u94FA", line: "\u88AB\u8925\u6652\u8FC7\u592A\u9633\uFF0C\u4ECD\u7559\u7740\u4E00\u70B9\u68C9\u5E03\u548C\u6728\u5934\u7684\u6C14\u5473\u3002", aside: "\u6B47\u606F\u53EF\u4EE5\u6062\u590D\u5FC3\u529B\uFF0C\u4E5F\u4F1A\u8BA9\u5E9C\u5B66\u7684\u65F6\u8FB0\u5411\u540E\u63A8\u79FB\u3002\u5F53\u524D\u539F\u578B\u4E0D\u7ED3\u7B97\u6570\u503C\u3002" }]);
      return;
    }
    if (id === "chest") {
      const items = chestContents();
      openDialogue([{
        speaker: "\u968F\u8EAB\u7BB1\u7B3C",
        line: items.length ? `\u7BB1\u4E2D\u5DF2\u7ECF\u6536\u7740\uFF1A${items.join("\u3001")}\u3002` : "\u6362\u6D17\u8863\u7269\u3001\u7EB8\u7B14\u5404\u5F52\u5176\u5904\u3002\u7BB1\u5E95\u8FD8\u7A7A\u7740\uFF0C\u5BB9\u5F97\u4E0B\u51E0\u4EF6\u771F\u6B63\u60F3\u7559\u4E0B\u7684\u4E1C\u897F\u3002",
        aside: items.length ? "\u8FD9\u4E9B\u4E0D\u662F\u5956\u52B1\u6E05\u5355\uFF0C\u662F\u4F60\u4EB2\u624B\u5E26\u56DE\u6765\u7684\u4E1C\u897F\u3002" : void 0
      }]);
      return;
    }
    if (id === "rubbings") {
      const extra = registerKnown(id);
      openDialogue([
        { speaker: "\u5377\u8D77\u7684\u62D3\u7247", line: "\u7EB8\u80CC\u900F\u51FA\u9AD8\u4F4E\u4E0D\u4E00\u7684\u58A8\u8272\u3002\u5377\u9996\u538B\u7740\u4E00\u5757\u5C0F\u6728\u724C\uFF0C\u5374\u6CA1\u6709\u5199\u7ED9\u65B0\u751F\u770B\u7684\u8BF4\u660E\u3002", aside: "\u7B49\u5B88\u7891\u4EBA\u613F\u610F\u8BA9\u4F60\u52A8\u624B\uFF0C\u91D1\u77F3\u4E0E\u300A\u5E73\u6C5F\u56FE\u300B\u7684\u7EBF\u624D\u4F1A\u5C55\u5F00\u3002" },
        ...extra
      ]);
      return;
    }
    if (id === "bookcase") {
      if (canCollateLiuyuan(loadProgress()) && !otherBooks) {
        engine.clearInput();
        variant.show();
        return;
      }
      if (hasStoryFlag(loadProgress(), "home-bookcase-book-known")) {
        openDialogue([{ speaker: "\u4E66\u67B6\u4E0B\u5C42", line: "\u90A3\u5904\u7A7A\u4F4D\u8FD8\u659C\u7740\u3002\u65E0\u540D\u65E7\u4E66\u4E0E\u7A7A\u767D\u8BFE\u9875\u5DF2\u7ECF\u6536\u8FDB\u4F60\u7684\u7BB1\u7B3C\u3002" }]);
      } else {
        openDialogue([
          { speaker: "\u4E66\u67B6\u4E0B\u5C42", line: "\u6700\u4E0B\u4E00\u5C42\u659C\u585E\u7740\u4E00\u518C\u6CA1\u6709\u51FD\u5957\u7684\u4E66\uFF0C\u4E66\u810A\u78E8\u5F97\u53D1\u767D\u3002" },
          { speaker: "\u6848\u5934\u8BFE\u9875", line: "\u534A\u53E0\u8BFE\u9875\u53EA\u5199\u4E86\u4E00\u534A\uFF0C\u7B14\u8FF9\u4E0D\u662F\u4F60\u7684\u3002" },
          { speaker: "\u6C88\u781A\u79CB", line: "\u8FD9\u672C\u6401\u5728\u8FD9\u513F\u5F88\u4E45\u4E86\u3002\u6CA1\u4EBA\u8BA4\u9886\uFF0C\u4F60\u5148\u6536\u7740\u3002" },
          { speaker: "\u6C88\u781A\u79CB", line: "\u8BFE\u9875\u4E5F\u5E26\u8D70\u2014\u2014\u4F60\u603B\u8981\u5199\u81EA\u5DF1\u7684\u3002", aside: "\u4F60\u628A\u4E66\u548C\u8BFE\u9875\u4E00\u8D77\u6536\u8FDB\u4E86\u7BB1\u7B3C\u3002" }
        ], () => {
          markStoryFlag("home-bookcase-book-known");
          markStoryFlag("home-pages-known");
          known.add("bookcase");
        });
      }
      return;
    }
    if (id === "corner") {
      if (hasStoryFlag(loadProgress(), "home-corner-leaf-known")) {
        openDialogue([{ speaker: "\u5802\u540E\u6A90\u89D2", line: "\u788E\u74E6\u4ECD\u65E7\u6F6E\u7740\u3002\u90A3\u5F20\u5BF9\u6298\u7684\u65E7\u7EB8\u5DF2\u7ECF\u4E0D\u5728\u74E6\u7F1D\u91CC\u4E86\u3002" }]);
      } else {
        openDialogue([
          { speaker: "\u5802\u540E\u6A90\u89D2", line: "\u6A90\u89D2\u5806\u7740\u51E0\u7247\u788E\u74E6\uFF0C\u6BD4\u522B\u5904\u6F6E\u3002" },
          { speaker: "\u5802\u540E\u6A90\u89D2", line: "\u74E6\u7F1D\u91CC\u538B\u7740\u4E00\u5F20\u5BF9\u6298\u7684\u7EB8\uFF0C\u8FB9\u89D2\u88AB\u96E8\u6C34\u6CE1\u8F6F\u3002" },
          { speaker: "\u5B66\u5B50", line: "\u7EB8\u4E0A\u53EA\u6709\u51E0\u7B14\u6C34\u7EB9\uFF0C\u6CA1\u6709\u843D\u6B3E\uFF0C\u4E5F\u6CA1\u6709\u5730\u540D\u3002", aside: "\u4F60\u628A\u90A3\u5F20\u7EB8\u6536\u4E86\u8D77\u6765\u3002\u6CA1\u6709\u65B0\u4EFB\u52A1\u51FA\u73B0\u3002" }
        ], () => {
          markStoryFlag("home-corner-leaf-known");
          known.add("corner");
        });
      }
      return;
    }
    if (id === "courtyard") {
      const extra = registerKnown(id);
      openDialogue([
        { speaker: "\u8001\u6811\u4E0B", line: "\u5899\u5916\u6709\u4EBA\u8BD5\u4E86\u4E00\u53E5\u6606\u8154\u3002\u53EA\u5531\u5230\u534A\u53E5\uFF0C\u6C34\u58F0\u4FBF\u628A\u4F59\u97F3\u5E26\u8FDC\u4E86\u3002", aside: "\u4F60\u4E0D\u77E5\u9053\u58F0\u97F3\u6765\u81EA\u54EA\u4E00\u6761\u5DF7\u5B50\uFF0C\u53EA\u8BB0\u4F4F\u4E86\u5B83\u79BB\u8FD9\u91CC\u5E76\u4E0D\u8FD1\u3002" },
        ...extra
      ]);
      return;
    }
    if (id === "minglun") {
      if (!oriented) {
        openDialogue([{ speaker: "\u6C88\u781A\u79CB", line: "\u5148\u751F\u8FD8\u6CA1\u6709\u6765\u3002\u5148\u53BB\u658B\u820D\u628A\u4E66\u7BB1\u5B89\u987F\u597D\u3002" }]);
      } else if (!guMet) {
        openDialogue([
          { speaker: "\u964C\u751F\u5E08\u957F", line: "\u201C\u4F60\u770B\u5B8C\u4E86\uFF1F\u201D", aside: "\u6709\u4EBA\u4ECE\u4E66\u67B6\u53E6\u4E00\u4FA7\u53D6\u8D70\u538B\u7EB8\u7684\u9547\u77F3\u3002\u4F60\u8FD9\u624D\u53D1\u73B0\uFF0C\u4ED6\u4E00\u76F4\u5728\u90A3\u91CC\u3002" },
          { speaker: "\u987E\u60DF\u6E05", line: "\u201C\u6CA1\u770B\u5B8C\u4E5F\u597D\u3002\u5148\u628A\u8FD9\u5377\u4E66\u653E\u56DE\u67B6\u4E0A\u3002\u201D", aside: "\u8BA4\u5F97\u5B57\uFF0C\u4E0D\u4E00\u5B9A\u8BA4\u5F97\u5B83\u8BE5\u5728\u4F55\u5904\u3002\u4ECA\u5929\u4ED6\u6CA1\u6709\u7ACB\u523B\u7ED9\u4F60\u8BFE\u9898\u3002" }
        ], () => {
          guMet = true;
          markStoryFlag("gu-met");
        });
      } else if (!hasStoryFlag(loadProgress(), "first-lesson-offered")) {
        openDialogue([
          { speaker: "\u987E\u60DF\u6E05", line: "\u5E9C\u5B66\u4E1C\u987E\uFF0C\u8349\u6811\u4E4B\u5916\u6709\u4E00\u5E26\u6C34\u3002\u6CA7\u6D6A\u4EAD\u7684\u56ED\u8C31\u4E0A\uFF0C\u504F\u504F\u7A7A\u7740\u4E09\u6247\u7A97\u3002" },
          { speaker: "\u987E\u60DF\u6E05", line: "\u6CBF\u590D\u5ECA\u8D70\u4E00\u904D\u3002\u5148\u770B\uFF0C\u518D\u5BF9\uFF0C\u6700\u540E\u628A\u4E09\u5904\u666F\u5408\u8D77\u6765\u3002", aside: "\u8BFE\u4E00 \xB7 \u6570\u827A\u521D\u4FEE \xB7 \u89C2\u4F4D" }
        ], () => markStoryFlag("first-lesson-offered"));
      } else if (canglangDone && hasStoryFlag(loadProgress(), "fuxue-first-return-seen")) {
        openDialogue([
          { speaker: "\u660E\u4F26\u5802\u9662", line: "\u9547\u7EB8\u632A\u4E86\u4E00\u5BF8\uFF0C\u843D\u5728\u4E66\u7684\u4E1C\u5357\u89D2\u3002" },
          { speaker: "\u987E\u60DF\u6E05", line: "\u7A97\uFF0C\u6709\u6CA1\u6709\u52A8\uFF1F", choices: [
            {
              label: "\u7A97\u6CA1\u52A8\uFF0C\u662F\u770B\u7684\u4EBA\u632A\u4E86\u5730\u65B9\u3002",
              response: [
                { speaker: "\u987E\u60DF\u6E05", line: "\u55EF\u3002\u770B\u7684\u4EBA\u632A\u4E86\u5730\u65B9\uFF0C\u753B\u5C31\u8DDF\u7740\u632A\u3002" },
                { speaker: "\u987E\u60DF\u6E05", line: "\u4E1C\u5357\u90A3\u8FB9\uFF0C\u4F60\u81EA\u5DF1\u7559\u610F\u3002" }
              ]
            },
            {
              label: "\u6211\u8FD8\u8BF4\u4E0D\u51C6\uFF0C\u53EA\u77E5\u9053\u4E09\u5904\u666F\u8FDE\u6210\u4E86\u4E00\u5377\u3002",
              response: [
                { speaker: "\u987E\u60DF\u6E05", line: "\u8BB0\u7740\u8FD9\u53E5\u3002\u5F80\u540E\u4F60\u8FD8\u4F1A\u6539\u4E00\u6B21\u3002" },
                { speaker: "\u987E\u60DF\u6E05", line: "\u4E1C\u5357\u90A3\u8FB9\uFF0C\u4F60\u81EA\u5DF1\u7559\u610F\u3002" }
              ]
            }
          ] }
        ]);
      } else {
        openDialogue([{ speaker: "\u660E\u4F26\u5802\u9662", line: "\u6848\u4E0A\u7684\u6B8B\u9875\u5DF2\u7ECF\u6536\u597D\u3002\u987E\u5148\u751F\u6CA1\u6709\u50AC\u4F60\uFF0C\u53EA\u5C06\u9547\u7EB8\u5F80\u82CF\u57CE\u4E1C\u5357\u632A\u4E86\u4E00\u5BF8\u3002" }]);
      }
      return;
    }
    if (id === "gate") {
      const extra = registerKnown(id);
      if (!oriented) {
        openDialogue([{ speaker: "\u897F\u5B66\u95E8", line: "\u5148\u8BA4\u5F97\u56DE\u6765\uFF0C\u518D\u5FD9\u7740\u51FA\u53BB\u3002" }, ...extra]);
      } else if (!hasStoryFlag(loadProgress(), "first-lesson-offered")) {
        openDialogue([{ speaker: "\u897F\u5B66\u95E8", line: "\u8857\u58F0\u5C31\u5728\u95E8\u5916\uFF0C\u4F46\u4ECA\u65E5\u7684\u8BFE\u9898\u8FD8\u6CA1\u6709\u843D\u5230\u4F60\u624B\u91CC\u3002" }]);
      } else {
        openDialogue([
          { speaker: "\u6C88\u781A\u79CB", line: "\u51FA\u8FD9\u95E8\u5F80\u4E1C\uFF0C\u5148\u89C1\u6C34\uFF0C\u518D\u89C1\u5899\u3002\u6CA7\u6D6A\u4EAD\u4E0D\u5728\u8857\u4E0A\uFF0C\u5728\u6C34\u7684\u5357\u8FB9\u3002" },
          { speaker: "\u6C88\u781A\u79CB", line: "\u56FE\u53EA\u753B\u4E86\u8DEF\u3002\u4F60\u770B\u6865\uFF0C\u522B\u53EA\u770B\u5B57\u3002", aside: "\u5C55\u5F00\u300A\u8607\u57CE\u5168\u5716\u300B" }
        ], () => {
          markStoryFlag("city-map-introduced");
          location.href = "sucheng.html";
        });
      }
    }
  }
  function nearestInteraction() {
    let best = null;
    let bestD = TUNING.homeInteractRadius;
    for (const item of HOME_INTERACTIONS) {
      const radius = item.id === "corner" ? TUNING.cornerTriggerRadius : TUNING.homeInteractRadius;
      const d = Math.hypot(player.x - item.x, player.y - item.y);
      if (d < Math.min(bestD, radius)) {
        best = item;
        bestD = d;
      }
    }
    return best;
  }
  engine.onInteract = () => {
    if (variant.open) return;
    if (dialogueOpen) {
      dialogueNext.click();
      return;
    }
    const near = nearestInteraction();
    if (near) interact(near.id);
  };
  engine.onCancel = () => {
    if (variant.open) variant.hide();
    else if (dialogueOpen) closeDialogue();
  };
  engine.onTap = engine.onInteract;
  engine.attachKeys();
  engine.attachTap(canvas);
  engine.attachTouchControls(document.querySelector("[data-touch-controls]"));
  function clamp(value, max) {
    return Math.max(0, Math.min(max, value));
  }
  function draw() {
    const near = !dialogueOpen && !albumOpen && !variant.open ? nearestInteraction() : null;
    prompt.hidden = !near;
    if (near) promptText.textContent = near.label;
    const renderCam = { x: Math.round(cam.x), y: Math.round(cam.y) };
    ctx.fillStyle = "#242620";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.save();
    ctx.scale(ZOOM, ZOOM);
    drawFuxueScene(ctx, renderCam);
    drawFuxueWater(ctx, renderCam, now, runtimeEffects);
    const shen = HOME_INTERACTIONS[0];
    const depthLayers = [
      ...runtimeOccluders.map((occluder, order) => ({
        depthY: occluder.depthY,
        order,
        draw: () => drawFuxueOccluder(ctx, renderCam, occluder)
      })),
      { depthY: shen.y, order: 100, draw: () => drawShen(ctx, shen.x, shen.y, renderCam, now) },
      { depthY: player.y, order: 101, draw: () => drawPlayer(ctx, player, renderCam) }
    ];
    depthLayers.sort(compareDepthLayers);
    for (const layer of depthLayers) layer.draw();
    if (near) drawInteractionMark(ctx, near.x, near.y, renderCam, now);
    if (debugGeometry) {
      drawTileGeometryDebug(
        ctx,
        { map: data.map, w: data.w, h: data.h },
        renderCam,
        { w: viewW, h: viewH },
        player,
        FUXUE_ACTOR_PROFILE
      );
      drawFuxueGeometryDebug(ctx, renderCam, player, runtimeGeometry);
    }
    ctx.restore();
  }
  engine.start((dt) => {
    now = performance.now();
    const axis = engine.axis();
    player.moving = !!(axis.dx || axis.dy) && !dialogueOpen && !albumOpen && !variant.open;
    if (player.moving) {
      if (Math.abs(axis.dx) >= Math.abs(axis.dy)) player.dir = axis.dx < 0 ? 1 : 2;
      else player.dir = axis.dy < 0 ? 3 : 0;
      player.wt += dt;
      moveEntity(
        data.map,
        player,
        axis.dx * TUNING.moveSpeed * dt,
        axis.dy * TUNING.moveSpeed * dt,
        data.w,
        data.h,
        runtimeObstacles,
        FUXUE_ACTOR_PROFILE
      );
    } else player.wt = 0;
    const targetX = clamp(player.x - viewW / 2, worldW - viewW);
    const targetY = clamp(player.y - viewH / 2, worldH - viewH);
    cam.x += (targetX - cam.x) * TUNING.camLerp;
    cam.y += (targetY - cam.y) * TUNING.camLerp;
    draw();
  });
  updateObjective();
  var forcedScene = params.get("scene");
  var debugAt = params.get("at");
  if (debugAt === "gate-front") {
    player.x = 22.5 * TILE;
    player.y = 22 * TILE;
    canvas.focus();
  } else if (debugAt === "gate-under") {
    player.x = 22.5 * TILE;
    player.y = 20 * TILE;
    canvas.focus();
  } else if (debugAt === "gate") {
    player.x = 22.5 * TILE;
    player.y = 18.5 * TILE;
    canvas.focus();
  } else if (debugAt === "gate-inner") {
    player.x = 22.5 * TILE;
    player.y = 17 * TILE;
    canvas.focus();
  } else if (debugAt === "tree-back") {
    player.x = 20 * TILE;
    player.y = 11.5 * TILE;
    canvas.focus();
  } else if (debugAt === "tree-front") {
    player.x = 14.5 * TILE;
    player.y = 14.25 * TILE;
    canvas.focus();
  } else if (debugAt === "room-step") {
    player.x = 8.5 * TILE;
    player.y = 11.3 * TILE;
    canvas.focus();
  } else if (debugAt === "room-inside") {
    player.x = 8.5 * TILE;
    player.y = 9.75 * TILE;
    canvas.focus();
  } else if (debugAt === "bridge-north") {
    player.x = 29.5 * TILE;
    player.y = 11.2 * TILE;
    canvas.focus();
  } else if (debugAt === "bridge-center") {
    player.x = 29.5 * TILE;
    player.y = 12.5 * TILE;
    canvas.focus();
  } else if (debugAt === "bridge-south") {
    player.x = 29.5 * TILE;
    player.y = 13.8 * TILE;
    canvas.focus();
  } else if (debugAt === "room-bed-front") {
    player.x = 6.2 * TILE;
    player.y = 10.7 * TILE;
    canvas.focus();
  } else if (debugAt === "room-bed-back") {
    player.x = 7.5 * TILE;
    player.y = 9.75 * TILE;
    canvas.focus();
  } else if (debugAt === "hall-axis") {
    player.x = 22 * TILE;
    player.y = 7.5 * TILE;
    canvas.focus();
  } else if (debugAt === "corner") {
    player.x = 33 * TILE;
    player.y = 4.5 * TILE;
    canvas.focus();
  } else if (forcedScene === "briefing") {
    player.x = 22 * TILE;
    player.y = 8 * TILE;
    interact("minglun");
  } else if (forcedScene === "return") {
    player.x = 13 * TILE;
    player.y = 10 * TILE;
    interact("desk");
  } else if (forcedScene === "arrival" || !oriented && !known.size && !canCollateLiuyuan(loadProgress())) {
    openDialogue([
      { speaker: "\u6C88\u781A\u79CB", line: "\u658B\u820D\u5728\u897F\u8FB9\u3002\u5148\u628A\u4E66\u7BB1\u653E\u4E0B\uFF0C\u518D\u81EA\u5DF1\u770B\u770B\u3002", aside: "\u65B9\u5411\u952E\u6216 WASD \u884C\u8D70\uFF1B\u9760\u8FD1\u7269\u4EF6\u65F6\u6309 E\u3002" }
    ]);
  } else canvas.focus();
})();

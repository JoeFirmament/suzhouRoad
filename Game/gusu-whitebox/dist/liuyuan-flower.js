"use strict";
(() => {
  // src/core/geometry.ts
  var STANDARD_PLAYER_PROFILE = {
    halfW: 4,
    topInset: 6,
    bottomInset: 1
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

  // src/config.ts
  var TILE = 16;
  var MAP_W = 80;
  var MAP_H = 50;
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

  // src/core/physics.ts
  var DEFAULT_PROFILE = STANDARD_PLAYER_PROFILE;
  function solidAt(map, px, py, w, h) {
    const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
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
    for (const polygon of [a, b]) {
      for (let index = 0; index < polygon.length; index++) {
        const p = polygon[index], q = polygon[(index + 1) % polygon.length];
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
    const actor2 = [[left, top], [right, top], [right, bottom], [left, bottom]];
    return convexPolygonsOverlap(actor2, shape.points);
  }
  function collides(map, x, y, w = MAP_W, h = MAP_H, obstacles2 = [], profile = DEFAULT_PROFILE) {
    return obstacles2.some((shape) => collidesShape(x, y, shape, profile)) || (solidAt(map, x - profile.halfW, y - profile.bottomInset, w, h) || solidAt(map, x + profile.halfW, y - profile.bottomInset, w, h) || solidAt(map, x - profile.halfW, y - profile.topInset, w, h) || solidAt(map, x + profile.halfW, y - profile.topInset, w, h));
  }
  function moveEntity(map, p, dx, dy, w = MAP_W, h = MAP_H, obstacles2 = [], profile = DEFAULT_PROFILE) {
    if (dx !== 0) {
      const ox = p.x;
      p.x += dx;
      if (collides(map, p.x, p.y, w, h, obstacles2, profile)) p.x = ox;
    }
    if (dy !== 0) {
      const oy = p.y;
      p.y += dy;
      if (collides(map, p.x, p.y, w, h, obstacles2, profile)) p.y = oy;
    }
  }

  // src/core/scene-validation.ts
  function unreachableSceneFeet(scene3, targets, profile, step2 = 4) {
    if (!targets.length) return [];
    if (collides(
      scene3.map,
      scene3.spawn.x,
      scene3.spawn.y,
      scene3.w,
      scene3.h,
      scene3.obstacles ?? [],
      profile
    )) return targets.map((target) => target.id);
    const remaining = new Map(targets.map((target) => [target.id, target]));
    const blockedFeet = targets.filter((target) => target.mustStand && collides(
      scene3.map,
      target.x,
      target.y,
      scene3.w,
      scene3.h,
      scene3.obstacles ?? [],
      profile
    )).map((target) => target.id);
    if (blockedFeet.length) return blockedFeet;
    const queue = [[scene3.spawn.x, scene3.spawn.y]];
    const visited = /* @__PURE__ */ new Set([`${scene3.spawn.x},${scene3.spawn.y}`]);
    const worldW = scene3.w * 16, worldH = scene3.h * 16;
    for (let cursor = 0; cursor < queue.length && remaining.size; cursor++) {
      const [x, y] = queue[cursor];
      for (const target of remaining.values()) {
        if (Math.hypot(x - target.x, y - target.y) <= target.radius) remaining.delete(target.id);
      }
      for (const [dx, dy] of [[step2, 0], [-step2, 0], [0, step2], [0, -step2]]) {
        const nextX = x + dx, nextY = y + dy;
        if (nextX < 0 || nextY < 0 || nextX >= worldW || nextY >= worldH) continue;
        const key = `${nextX},${nextY}`;
        if (visited.has(key) || collides(
          scene3.map,
          nextX,
          nextY,
          scene3.w,
          scene3.h,
          scene3.obstacles ?? [],
          profile
        )) continue;
        visited.add(key);
        queue.push([nextX, nextY]);
      }
    }
    return [...remaining.keys()];
  }
  function validateTileScene(id, scene3, profile) {
    const errors = [];
    if (!Number.isInteger(scene3.w) || !Number.isInteger(scene3.h) || scene3.w <= 0 || scene3.h <= 0) {
      errors.push(`${id}: \u5730\u56FE\u5BBD\u9AD8\u5FC5\u987B\u4E3A\u6B63\u6574\u6570`);
    }
    if (scene3.map.length !== scene3.w * scene3.h) {
      errors.push(`${id}: map.length \u4E0E w \xD7 h \u4E0D\u4E00\u81F4`);
    }
    if (profile.halfW <= 0 || profile.bottomInset < 0 || profile.topInset <= profile.bottomInset) {
      errors.push(`${id}: \u4EBA\u7269\u811A\u5E95\u76D2\u65E0\u6548`);
    }
    if (collides(
      scene3.map,
      scene3.spawn.x,
      scene3.spawn.y,
      scene3.w,
      scene3.h,
      scene3.obstacles ?? [],
      profile
    )) errors.push(`${id}: \u51FA\u751F\u811A\u70B9\u843D\u5728\u78B0\u649E\u4F53\u5185`);
    return errors;
  }

  // src/core/scene-plate-draft.ts
  function sceneDraftRecords(sceneId) {
    const prefix = `gusu-geometry-plate:${sceneId}:`;
    const candidates = [];
    if (window.name.startsWith(prefix)) try {
      candidates.push(JSON.parse(window.name.slice(prefix.length)));
    } catch {
    }
    try {
      for (const key of [`gusu:geometry-editor:${sceneId}:v1`, `gusu:geometry-editor:${sceneId}:latest`]) {
        const raw = localStorage.getItem(key);
        if (raw) candidates.push(JSON.parse(raw));
      }
    } catch {
    }
    return candidates.filter((item) => typeof item.value === "string" && Number.isFinite(item.savedAt)).sort((a, b) => b.savedAt - a.savedAt);
  }
  function readScenePlateDraft(sceneId, worldW, worldH, buildMap, requiredFeet = []) {
    if (new URLSearchParams(location.search).get("draft") !== "1") return null;
    const validPolygon = (value) => Array.isArray(value) && value.length >= 3 && value.every((point) => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite) && point[0] >= 0 && point[1] >= 0 && point[0] <= worldW && point[1] <= worldH);
    const validCollider = (value) => {
      if (!validPolygon(value)) return false;
      let sign = 0;
      for (let i = 0; i < value.length; i++) {
        const a = value[i], b = value[(i + 1) % value.length], c = value[(i + 2) % value.length];
        const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
        if (cross === 0) continue;
        if (sign && Math.sign(cross) !== sign) return false;
        sign = Math.sign(cross);
      }
      return sign !== 0;
    };
    const validEffect = (value) => value.kind === "water-ripple" && typeof value.id === "string" && !!value.id.trim() && Array.isArray(value.polygons) && value.polygons.length > 0 && value.polygons.every(validPolygon) && Array.isArray(value.holes ?? []) && (value.holes ?? []).every(validPolygon) && typeof value.ripple?.color === "string" && !!value.ripple.color && Number.isFinite(value.ripple.rowSpacing) && value.ripple.rowSpacing > 0 && Number.isFinite(value.ripple.segmentSpacing) && value.ripple.segmentSpacing > 0 && Number.isFinite(value.ripple.minLength) && value.ripple.minLength > 0 && Number.isFinite(value.ripple.maxLength) && value.ripple.maxLength >= value.ripple.minLength && Number.isFinite(value.ripple.speedMs) && value.ripple.speedMs > 0;
    for (const record2 of sceneDraftRecords(sceneId)) {
      try {
        const data = JSON.parse(record2.value);
        if (data.format !== "gusu-scene-geometry" || data.sceneId !== sceneId || data.world?.width !== worldW || data.world?.height !== worldH || !Array.isArray(data.tileRegions) || !Array.isArray(data.objects)) continue;
        if (data.actorScalePercent !== void 0 && (!Number.isInteger(data.actorScalePercent) || data.actorScalePercent < 40 || data.actorScalePercent > 250)) continue;
        if (!data.tileRegions.every((item) => typeof item.id === "string" && [item.x, item.y, item.w, item.h, item.tile].every(Number.isInteger) && item.w > 0 && item.h > 0 && item.x >= 0 && item.y >= 0 && item.x + item.w <= worldW / 16 && item.y + item.h <= worldH / 16)) continue;
        if (!data.objects.every((item) => typeof item.id === "string" && (item.colliders ?? []).every(validCollider) && (!item.occluder || Number.isFinite(item.occluder.depthY) && (item.occluder.polygons ?? []).every(validPolygon)) && Array.isArray(item.effects ?? []) && (item.effects ?? []).every(validEffect))) continue;
        const geometry2 = data.objects.map((item) => ({
          id: item.id,
          colliders: (item.colliders ?? []).map((points) => ({ points })),
          occluder: item.occluder ? {
            id: item.id,
            depthY: item.occluder.depthY,
            polygons: item.occluder.polygons
          } : void 0,
          effects: (item.effects ?? []).map((effect) => ({
            id: effect.id,
            kind: "water-ripple",
            polygons: effect.polygons,
            holes: effect.holes ?? [],
            ripple: { ...effect.ripple }
          }))
        }));
        const scene3 = buildMap(data.tileRegions);
        const obstacles2 = geometry2.flatMap((object) => object.colliders ?? []);
        if (validateTileScene(sceneId, { ...scene3, obstacles: obstacles2 }, STANDARD_PLAYER_PROFILE).length) continue;
        if (unreachableSceneFeet({ ...scene3, obstacles: obstacles2 }, requiredFeet, STANDARD_PLAYER_PROFILE).length) continue;
        return {
          regions: data.tileRegions,
          geometry: geometry2,
          actorScalePercent: data.actorScalePercent ?? 100,
          assetPath: typeof data.asset?.path === "string" ? data.asset.path : void 0
        };
      } catch {
      }
    }
    return null;
  }

  // src/core/liuyuan-composition-study.ts
  var INITIAL_COMPOSITION_STUDY = {
    view: 0,
    distance: "near",
    seen: 1 << 3
  };
  var LEFT = [0, 110, 250];
  var CROP = {
    far: { y: 80, width: 1420, height: 799 },
    near: { y: 80, width: 1120, height: 630 }
  };
  var ORCHID = { leftLeaf: 208, rightLeaf: 870, topLeaf: 235, potBottom: 695, standBottom: 860 };
  var WOOD_EDGE = 180;
  function compositionCrop(state) {
    return { x: LEFT[state.view], ...CROP[state.distance] };
  }
  function compositionCues(state) {
    const crop = compositionCrop(state);
    return {
      subjectIntact: ORCHID.leftLeaf >= crop.x + 80 && ORCHID.rightLeaf <= crop.x + crop.width - 120 && ORCHID.topLeaf >= crop.y + 40 && ORCHID.potBottom <= crop.y + crop.height - 10,
      baseGrounded: ORCHID.standBottom <= crop.y + crop.height - 10,
      guestSubordinate: Math.max(0, WOOD_EDGE - crop.x) / crop.width < 0.08,
      inscriptionRoom: (crop.x + crop.width - ORCHID.rightLeaf) / crop.width >= 0.3
    };
  }
  function assessComposition(state) {
    if ((state.seen & state.seen - 1) === 0) return {
      passed: false,
      code: "one-frame",
      line: "\u82B1\u5320\u8BF4\uFF1A\u201C\u5148\u6362\u4E2A\u53D6\u6CD5\uFF0C\u518D\u9009\u4F60\u613F\u610F\u7559\u4E0B\u7684\u8FD9\u4E00\u773C\u3002\u201D"
    };
    const cues = compositionCues(state);
    if (!cues.subjectIntact) return {
      passed: false,
      code: "cut-orchid",
      line: "\u82B1\u5320\u8F7B\u8F7B\u6307\u5411\u753B\u8FB9\uFF1A\u201C\u53F6\u5C16\u6216\u76C6\u6CBF\u592A\u8D34\u8FB9\u4E86\u3002\u9000\u4E00\u5206\uFF0C\u624D\u770B\u5F97\u89C1\u5B83\u7684\u957F\u52BF\u3002\u201D"
    };
    if (!cues.baseGrounded) return {
      passed: false,
      code: "base-cut",
      line: "\u82B1\u5320\u6307\u7740\u753B\u5E45\u4E0B\u6CBF\uFF1A\u201C\u76C6\u770B\u89C1\u4E86\uFF0C\u67B6\u5B50\u7684\u811A\u5374\u65AD\u5728\u753B\u5916\uFF0C\u5170\u50CF\u60AC\u7740\u3002\u9000\u534A\u6B65\u3002\u201D"
    };
    if (!cues.guestSubordinate) return {
      passed: false,
      code: "guest-heavy",
      line: "\u82B1\u5320\u906E\u4F4F\u5DE6\u89D2\uFF1A\u201C\u95E8\u6728\u592A\u91CD\uFF0C\u5148\u770B\u89C1\u7684\u662F\u95E8\uFF0C\u4E0D\u662F\u5170\u3002\u8BA9\u5B83\u53EA\u7559\u4E00\u7B14\u4F5C\u966A\u3002\u201D"
    };
    if (!cues.inscriptionRoom) return {
      passed: false,
      code: "no-blank",
      line: "\u82B1\u5320\u6BD4\u4E86\u6BD4\u53F3\u5899\uFF1A\u201C\u9898\u5B57\u8FD8\u6CA1\u6709\u5730\u65B9\u843D\u3002\u7A7A\u5904\u4E0D\u80FD\u53EA\u662F\u5269\u4E0B\u7684\u5899\u3002\u201D"
    };
    return {
      passed: true,
      code: "album-page",
      line: "\u82B1\u5320\u5728\u53F3\u8FB9\u865A\u70B9\u4E00\u5217\u5B57\uFF1A\u201C\u5170\u4E3A\u4E3B\uFF0C\u95E8\u6728\u9000\u4F5C\u5BBE\uFF1B\u53F6\u5411\u7A7A\u5899\u4F38\uFF0C\u5B57\u518D\u628A\u753B\u610F\u6536\u4F4F\u3002\u8FD9\u5E45\u53EF\u5165\u5170\u8C31\u3002\u201D"
    };
  }

  // src/core/liuyuan-composition-atlas.ts
  var book = "../assets/composition-book/";
  var scene = "../assets/scene25d/";
  var COMPOSITION_ATLAS = [
    {
      id: "orchid",
      title: "\u4E00 \xB7 \u5170\u53F6\u4EA4\u53C9",
      scene: `${scene}liuyuan-orchid-vignette-first-person-study-v1.png`,
      sceneAlt: "\u773C\u9AD8\u6240\u89C1\uFF1A\u767D\u5899\u524D\u6848\u4E0A\u7684\u4E00\u76C6\u5170",
      characterLine: "\u82B1\u5320\u628A\u5170\u53F6\u62E8\u5F00\u4E00\u70B9\uFF1A\u201C\u522B\u53EA\u770B\u8FD9\u76C6\u6446\u5728\u54EA\u513F\u3002\u82E5\u8981\u8BB0\u5728\u8C31\u91CC\uFF0C\u4E09\u7B14\u53F6\u5B50\u600E\u4E48\u76F8\u9047\uFF1F\u201D",
      question: "\u770B\u539F\u4E66\u56FE\u56DB\u4E03\u81F3\u56DB\u4E5D\uFF1A\u54EA\u4E00\u5E45\u7684\u53F6\u7EBF\u6709\u4EA4\u53C9\u548C\u53D8\u5316\uFF0C\u5374\u6CA1\u6709\u6324\u5728\u4E00\u4E2A\u70B9\uFF1F",
      figures: [
        { src: `${book}pan-fig47-orchid-crossing.jpg`, label: "\u56FE\u56DB\u4E03 \xB7 \u4E66\u9875 47", alt: "\u5170\u53F6\u51E0\u7B14\u4EA4\u9519\u800C\u4E0D\u5E76\u6210\u540C\u4E00\u70B9\u7684\u5B8C\u6574\u539F\u56FE" },
        { src: `${book}pan-fig48-orchid-one-knot.jpg`, label: "\u56FE\u56DB\u516B \xB7 \u4E66\u9875 48", alt: "\u591A\u7B14\u5170\u53F6\u5728\u540C\u4E00\u5904\u4EA4\u6C47\u7684\u5B8C\u6574\u539F\u56FE" },
        { src: `${book}pan-fig49-orchid-fence.jpg`, label: "\u56FE\u56DB\u4E5D \xB7 \u4E66\u9875 48", alt: "\u591A\u7EC4\u53F6\u7EBF\u4EA4\u9519\u793A\u610F\u7684\u5B8C\u6574\u539F\u56FE" }
      ],
      options: ["\u56FE\u56DB\u4E03", "\u56FE\u56DB\u516B", "\u56FE\u56DB\u4E5D"],
      correctOption: 0,
      success: "\u82B1\u5320\u8BF4\uFF1A\u201C\u56FE\u56DB\u4E03\u8BA9\u51E0\u7B14\u6709\u4EA4\u3001\u6709\u8BA9\u3002\u56FE\u56DB\u516B\u628A\u53F6\u5B50\u62E7\u5728\u4E00\u70B9\uFF1B\u56FE\u56DB\u4E5D\u63D0\u793A\u8FC7\u5BC6\u3001\u5E73\u884C\u4F1A\u5931\u53BB\u53D8\u5316\u3002\u5170\u53F6\u7684\u758F\u5BC6\u8BF4\u7684\u662F\u7EBF\uFF0C\u4E0D\u662F\u6574\u5E45\u767D\u5899\u6709\u591A\u7A7A\u3002\u201D",
      retry: "\u518D\u770B\u53F6\u7EBF\u4EA4\u4F1A\u7684\u5730\u65B9\uFF1A\u662F\u6709\u51E0\u5904\u53D8\u5316\uFF0C\u8FD8\u662F\u5168\u6324\u5728\u4E00\u70B9\u3001\u6392\u5F97\u50CF\u7BF1\u7B06\uFF1F",
      sourceNote: "\u6F58\u5929\u5BFF\u300A\u5173\u4E8E\u6784\u56FE\u95EE\u9898\u300B\u201C\u865A\u5B9E\u4E0E\u758F\u5BC6\u201D\uFF0C\u56FE\u56DB\u4E03\u81F3\u56DB\u4E5D\uFF0C\u4E66\u9875 47\u201349\u3002\u56FE\u50CF\u4E3A\u7528\u6237\u63D0\u4F9B PDF \u4E2D\u7684\u5B8C\u6574\u5D4C\u5165\u56FE\u3002"
    },
    {
      id: "bamboo",
      title: "\u4E8C \xB7 \u7AF9\u5170\u4E0E\u7A7A\u767D",
      scene: `${scene}liuyuan-bamboo-stone-vignette-first-person-study-v1.png`,
      sceneAlt: "\u773C\u9AD8\u6240\u89C1\uFF1A\u767D\u5899\u524D\u7684\u7AF9\u4E1B\u4E0E\u4E00\u5757\u5C0F\u592A\u6E56\u77F3\u7814\u7A76\u753B\u9762",
      characterLine: "\u7FFB\u8FC7\u4E00\u9875\uFF0C\u7AF9\u53F6\u5728\u5899\u524D\u4E92\u76F8\u7A7F\u8FC7\u3002\u82B1\u5320\u95EE\uFF1A\u201C\u7A7A\u767D\u4E0E\u53F6\u7EBF\u7684\u758F\u5BC6\uFF0C\u662F\u540C\u4E00\u4EF6\u4E8B\u5417\uFF1F\u201D",
      question: "\u770B\u539F\u4E66\u56FE\u56DB\u56DB\uFF1A\u54EA\u79CD\u8BF4\u6CD5\u628A\u201C\u865A\u5B9E\u201D\u4E0E\u201C\u758F\u5BC6\u201D\u5206\u6E05\u4E86\uFF1F",
      figures: [
        { src: `${book}pan-fig44-orchid-bamboo.jpg`, label: "\u56FE\u56DB\u56DB \xB7 \u4E66\u9875 44 \xB7 \u5170\u7AF9\u56FE", alt: "\u5170\u4E0E\u7AF9\u6784\u6210\u7684\u5B8C\u6574\u6C34\u58A8\u753B\uFF0C\u5305\u542B\u51E0\u5757\u5927\u7A7A\u767D\u548C\u4EA4\u9519\u7684\u679D\u53F6\u7EBF\u6761" }
      ],
      options: [
        "\u5927\u5757\u672A\u753B\u5904\u662F\u865A\uFF1B\u7AF9\u5170\u7B14\u7EBF\u7684\u4EA4\u9519\u4E0E\u95F4\u8DDD\u662F\u758F\u5BC6",
        "\u767D\u5904\u8D8A\u591A\u5C31\u662F\u8D8A\u758F\uFF1B\u4E24\u8BCD\u6CA1\u6709\u533A\u522B",
        "\u7AF9\u5B50\u662F\u865A\uFF0C\u5899\u548C\u77F3\u5934\u624D\u662F\u5B9E"
      ],
      correctOption: 0,
      success: "\u82B1\u5320\u628A\u624B\u6307\u4ECE\u5927\u7247\u767D\u5904\u79FB\u5230\u7AF9\u53F6\uFF1A\u201C\u8FD9\u91CC\u662F\u865A\u4E0E\u5B9E\uFF1B\u8FD9\u91CC\u624D\u662F\u7EBF\u7684\u758F\u4E0E\u5BC6\u3002\u753B\u91CC\u53EF\u4EE5\u540C\u65F6\u6709\u4E24\u79CD\u5173\u7CFB\u3002\u201D",
      retry: "\u5148\u6307\u8BA4\u753B\u91CC\u6700\u5927\u7684\u672A\u753B\u5904\uFF0C\u518D\u770B\u7AF9\u53F6\u548C\u5170\u53F6\u7EBF\u6761\u5F7C\u6B64\u600E\u6837\u4EA4\u9519\u3002",
      sourceNote: "\u6F58\u5929\u5BFF\u300A\u5173\u4E8E\u6784\u56FE\u95EE\u9898\u300B\u56FE\u56DB\u56DB\u53CA\u4E66\u9875 44 \u7684\u5206\u6790\uFF1B\u773C\u524D\u7AF9\u77F3\u5C0F\u666F\u662F\u539F\u521B\u6E38\u620F\u7814\u7A76\u753B\uFF0C\u4E0D\u662F\u8BE5\u753B\u6216\u7559\u56ED\u65E7\u8C8C\u3002"
    },
    {
      id: "stone",
      title: "\u4E09 \xB7 \u4E09\u77F3\u6210\u52BF",
      scene: `${scene}liuyuan-rock-plum-vignette-first-person-study-v1.png`,
      sceneAlt: "\u773C\u9AD8\u6240\u89C1\uFF1A\u767D\u5899\u524D\u7684\u592A\u6E56\u77F3\u4E0E\u659C\u5165\u753B\u9762\u7684\u6885\u679D\u7814\u7A76\u753B\u9762",
      characterLine: "\u77F3\u5320\u6361\u8D77\u4E09\u5757\u788E\u77F3\uFF1A\u201C\u4E0D\u662F\u6392\u6210\u4E00\u5217\u5C31\u53EB\u758F\u5BC6\u3002\u770B\u5B83\u4EEC\u662F\u4E09\u5757\uFF0C\u8FD8\u662F\u6324\u6210\u4E24\u56E2\u3002\u201D",
      question: "\u770B\u539F\u4E66\u56FE\u516D\u4E00\u81F3\u516D\u4E09\uFF1A\u54EA\u4E00\u7EC4\u4ECD\u80FD\u8BFB\u51FA\u4E09\u77F3\u7684\u8DDD\u79BB\u548C\u524D\u540E\uFF1F",
      figures: [
        { src: `${book}pan-fig61-three-stones.jpg`, label: "\u56FE\u516D\u4E00 \xB7 \u4E66\u9875 57", alt: "\u4E09\u5757\u77F3\u5934\u4E2D\u6709\u4E24\u5757\u76F8\u63A5\u800C\u4ECD\u4FDD\u7559\u524D\u540E\u611F\u7684\u5B8C\u6574\u793A\u610F\u56FE" },
        { src: `${book}pan-fig62-three-stones.jpg`, label: "\u56FE\u516D\u4E8C \xB7 \u4E66\u9875 57", alt: "\u4E09\u5757\u77F3\u5934\u95F4\u9694\u6709\u53D8\u5316\u7684\u5B8C\u6574\u793A\u610F\u56FE" },
        { src: `${book}pan-fig63-three-stones-merged.jpg`, label: "\u56FE\u516D\u4E09 \xB7 \u4E66\u9875 58", alt: "\u4E24\u5757\u77F3\u5934\u5E76\u5408\u5F97\u8FD1\u4F3C\u4E00\u56E2\u7684\u5B8C\u6574\u793A\u610F\u56FE" }
      ],
      options: ["\u56FE\u516D\u4E00\u4E0E\u56FE\u516D\u4E8C", "\u53EA\u6709\u56FE\u516D\u4E09", "\u4E09\u5E45\u90FD\u4E00\u6837"],
      correctOption: 0,
      success: "\u77F3\u5320\u7B11\u9053\uFF1A\u201C\u56FE\u516D\u4E00\u867D\u6709\u4E24\u77F3\u76F8\u53E0\uFF0C\u4ECD\u8BA4\u5F97\u51FA\u4E09\u5757\uFF1B\u56FE\u516D\u4E8C\u4E5F\u6709\u8FDC\u8FD1\u3002\u56FE\u516D\u4E09\u53F3\u8FB9\u5E76\u6210\u4E00\u56E2\uFF0C\u4E09\u77F3\u7684\u8DDD\u79BB\u611F\u5C31\u5F31\u4E86\u3002\u201D",
      retry: "\u522B\u6570\u9ED1\u7EBF\uFF0C\u6570\u4F60\u773C\u4E2D\u8FD8\u80FD\u5206\u8FA8\u51FA\u7684\u77F3\u5757\uFF0C\u518D\u770B\u5B83\u4EEC\u4E4B\u95F4\u7684\u8FDC\u8FD1\u3002",
      sourceNote: "\u6F58\u5929\u5BFF\u300A\u5173\u4E8E\u6784\u56FE\u95EE\u9898\u300B\u56FE\u516D\u4E00\u81F3\u516D\u4E09\uFF0C\u4E66\u9875 57\u201358\u3002\u56FE\u4E2D\u662F\u6784\u56FE\u793A\u610F\uFF0C\u4E0D\u80FD\u636E\u6B64\u6539\u52A8\u7559\u56ED\u540D\u77F3\u3002"
    },
    {
      id: "branch",
      title: "\u56DB \xB7 \u6298\u679D\u5165\u753B",
      scene: `${scene}liuyuan-rock-plum-vignette-first-person-study-v1.png`,
      sceneAlt: "\u540C\u4E00\u5C0F\u666F\u6539\u770B\u4E0A\u89D2\u4F38\u5165\u753B\u9762\u7684\u6885\u679D\u4E0E\u4E0B\u65B9\u592A\u6E56\u77F3",
      characterLine: "\u5B66\u5B50\u53C8\u62AC\u5934\u770B\u90A3\u679D\u6885\uFF1A\u201C\u6811\u5728\u753B\u5916\uFF0C\u753B\u91CC\u53EA\u53D6\u4E00\u679D\u3002\u8FD9\u6837\u4E5F\u7B97\u4E00\u5E45\u4E48\uFF1F\u201D\u82B1\u5320\u8BF4\uFF1A\u201C\u5148\u770B\u753B\u8C31\uFF0C\u518D\u81EA\u5DF1\u8F6C\u4E00\u8F6C\u53D6\u666F\u6846\u3002\u201D",
      question: "\u5148\u770B\u6F58\u4E66\u56FE\u4E8C\u4E94\u7684\u7D2B\u85E4\u4E0E\u71D5\u5B50\u5982\u4F55\u4ECE\u753B\u5916\u8D77\u3001\u5728\u753B\u5185\u6536\uFF1B\u518D\u4E3A\u82B1\u5320\u53D6\u4E00\u5E45\u6709\u679D\u5165\u89D2\u3001\u77F3\u6709\u843D\u811A\u3001\u53F3\u4FA7\u53EF\u843D\u5370\u7684\u5C0F\u666F\u3002",
      figures: [
        { src: `${book}pan-fig25-wisteria-swallows.jpg`, label: "\u56FE\u4E8C\u4E94 \xB7 \u4E66\u9875 30 \xB7 \u7D2B\u85E4\u4E0E\u71D5", alt: "\u7D2B\u85E4\u4ECE\u753B\u9762\u4E0A\u65B9\u8FDB\u5165\uFF0C\u71D5\u5B50\u5411\u524D\u98DE\u7684\u5B8C\u6574\u6784\u56FE\u793A\u610F" }
      ],
      sourceNote: "\u6F58\u5929\u5BFF\u300A\u5173\u4E8E\u6784\u56FE\u95EE\u9898\u300B\u56FE\u4E8C\u4E94\u53CA\u4E66\u9875 30 \u7684\u8D77\u7ED3\u5206\u6790\uFF1B\u8C22\u5B50\u9759\u300A\u5B8B\u4EE3\u6298\u679D\u82B1\u9E1F\u753B\u7684\u6784\u56FE\u7A0B\u5F0F\u300B\uFF0C\u300A\u65B0\u7F8E\u672F\u300B2007 \u5E74\u7B2C 5 \u671F\uFF0C\u9875 93\u201396\uFF0C\u4F9B\u201C\u622A\u53D6\u4E00\u679D\u3001\u8FB9\u89D2\u5165\u753B\u201D\u7684\u65B9\u6CD5\u53C2\u7167\u3002\u4E24\u8005\u6765\u6E90\u4E0D\u540C\uFF1B\u4E0B\u9762\u53D6\u666F\u4E0E\u843D\u5370\u662F\u539F\u521B\u6E38\u620F\u59D4\u6258\uFF0C\u4E0D\u662F\u539F\u4E66\u7684\u6807\u51C6\u7B54\u6848\u3002"
    }
  ];
  var BRANCH_FORMATS = {
    landscape: { label: "\u6A2A\u5E45 3:2", width: 0.6, height: 0.71, aspect: 3 / 2, maxPreviewWidth: 760, minX: 0.1, maxX: 0.42, minY: 0.31, maxY: 0.64 },
    square: { label: "\u65B9\u5E45 1:1", width: 0.45, height: 0.8, aspect: 1, maxPreviewWidth: 550, minX: 0.23, maxX: 0.4, minY: 0.3, maxY: 0.75 },
    portrait: { label: "\u7AD6\u5E45 4:5", width: 0.37, height: 0.82, aspect: 4 / 5, maxPreviewWidth: 440, minX: 0.28, maxX: 0.4, minY: 0.28, maxY: 0.72 }
  };
  function evaluateBranchFrame(formatId, x, y) {
    const format = BRANCH_FORMATS[formatId];
    if (!format) return { acceptable: false, line: "\u8FD8\u6CA1\u6709\u9009\u597D\u753B\u5E45\u3002" };
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1 || y < 0 || y > 1) {
      return { acceptable: false, line: "\u53D6\u666F\u6846\u8FD8\u6CA1\u6709\u843D\u5728\u753B\u9762\u91CC\u3002" };
    }
    if (x > format.maxX) return { acceptable: false, line: "\u5411\u5DE6\u8F6C\u4E00\u4E9B\uFF1A\u77F3\u7684\u66F2\u6298\u5F62\u52BF\u88AB\u753B\u8FB9\u622A\u53BB\u592A\u591A\u3002" };
    if (x < format.minX) return { acceptable: false, line: "\u5411\u53F3\u501F\u4E00\u70B9\u767D\u5899\uFF1A\u679D\u77F3\u6324\u6EE1\u753B\u5E45\uFF0C\u843D\u5370\u7684\u7A7A\u5904\u8FD8\u4E0D\u591F\u4ECE\u5BB9\u3002" };
    if (y < format.minY) return { acceptable: false, line: "\u6846\u666F\u518D\u5F80\u4E0B\u4E9B\uFF1A\u77F3\u811A\u88AB\u753B\u8FB9\u622A\u65AD\uFF0C\u770B\u7740\u50CF\u60AC\u5728\u5899\u524D\u3002" };
    if (y > format.maxY) return { acceptable: false, line: "\u6846\u666F\u518D\u5F80\u4E0A\u4E9B\uFF1A\u6885\u679D\u7684\u6765\u8DEF\u9000\u51FA\u4E0A\u89D2\uFF0C\u6298\u679D\u610F\u5473\u6DE1\u4E86\u3002" };
    return { acceptable: true, line: `${format.label}\u8FD9\u4E00\u666F\u53EF\u7528\uFF1A\u679D\u4ECE\u4E0A\u89D2\u8FDB\u5165\uFF0C\u77F3\u6709\u843D\u811A\uFF0C\u53F3\u8FB9\u8FD8\u6709\u7A7A\u5899\u3002\u5B83\u7B26\u5408\u82B1\u5320\u8FD9\u6B21\u7684\u753B\u5E45\u59D4\u6258\uFF0C\u4E0D\u662F\u552F\u4E00\u7684\u4E2D\u56FD\u753B\u6784\u56FE\u3002` };
  }
  function evaluateBranchSeal(formatId, x, y) {
    const format = BRANCH_FORMATS[formatId];
    if (!format) return { acceptable: false, line: "\u8FD8\u6CA1\u6709\u9009\u597D\u753B\u5E45\u3002" };
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1 || y < 0 || y > 1) {
      return { acceptable: false, line: "\u5370\u7AE0\u8FD8\u6CA1\u6709\u843D\u5728\u753B\u5E45\u91CC\u3002" };
    }
    const minX = formatId === "portrait" ? 0.75 : formatId === "square" ? 0.71 : 0.68;
    const maxX = formatId === "portrait" ? 0.89 : 0.88;
    const minY = formatId === "portrait" ? 0.45 : 0.42;
    const maxY = formatId === "portrait" ? 0.7 : 0.68;
    if (x < minX) return { acceptable: false, line: "\u5370\u7AE0\u538B\u8FD1\u4E86\u679D\u77F3\u3002\u628A\u5B83\u79FB\u5230\u53F3\u4FA7\u7A7A\u5899\uFF0C\u8BA9\u4E3B\u4F53\u5148\u8BF4\u8BDD\u3002" };
    if (x > maxX) return { acceptable: false, line: "\u5370\u7AE0\u6324\u5230\u753B\u8FB9\u4E86\uFF1B\u5F80\u91CC\u6536\u4E00\u70B9\uFF0C\u7559\u51FA\u547C\u5438\u3002" };
    if (y < minY) return { acceptable: false, line: "\u5370\u7AE0\u592A\u9AD8\uFF0C\u548C\u5165\u753B\u7684\u6885\u679D\u4E89\u5148\uFF1B\u8BD5\u8BD5\u4E2D\u4E0B\u90E8\u7684\u7A7A\u767D\u3002" };
    if (y > maxY) return { acceptable: false, line: "\u5370\u7AE0\u538B\u5411\u94FA\u5730\uFF0C\u79BB\u5F00\u4E86\u7A7A\u5899\uFF1B\u5F80\u4E0A\u63D0\u4E00\u70B9\u3002" };
    return { acceptable: true, line: "\u5C0F\u5370\u843D\u5728\u53F3\u4FA7\u4E2D\u4E0B\u65B9\u7684\u7A7A\u767D\u91CC\uFF0C\u4E0E\u5DE6\u4E0A\u6885\u679D\u3001\u5DE6\u4E0B\u77F3\u5934\u76F8\u7167\u5E94\uFF0C\u4E5F\u6CA1\u6709\u5835\u4F4F\u753B\u8FB9\u3002" };
  }

  // src/core/liuyuan-composition-save.ts
  var STORAGE_PREFIX = "gusu-liuyuan-composition-practice-v1-";
  var emptyDraft = () => ({ version: 1 });
  var record = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
  var unit = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
  function parseCompositionDraft(raw) {
    if (!raw) return emptyDraft();
    try {
      const parsed = JSON.parse(raw);
      if (!record(parsed) || parsed.version !== 1) return emptyDraft();
      const draft2 = emptyDraft();
      if (record(parsed.orchid) && record(parsed.orchid.state)) {
        const { view, distance, seen } = parsed.orchid.state;
        if ((view === 0 || view === 1 || view === 2) && (distance === "near" || distance === "far") && Number.isInteger(seen) && seen >= 1 && seen <= 63) {
          const state = { view, distance, seen };
          draft2.orchid = { state, passed: parsed.orchid.passed === true && assessComposition(state).passed };
        }
      }
      if (record(parsed.atlas)) {
        const atlas = parsed.atlas;
        const solved = atlas.solved;
        const format = atlas.frameFormat;
        if (Array.isArray(solved) && solved.length === 3 && solved.every((value) => typeof value === "boolean") && typeof format === "string" && format in BRANCH_FORMATS && Number.isInteger(atlas.stageIndex) && atlas.stageIndex >= 0 && atlas.stageIndex <= 3 && unit(atlas.frameX) && unit(atlas.frameY) && unit(atlas.sealX) && unit(atlas.sealY)) {
          const frameFormat = format;
          const frameLocked = atlas.frameLocked === true && evaluateBranchFrame(frameFormat, atlas.frameX, atlas.frameY).acceptable;
          const compositionDone = atlas.compositionDone === true && frameLocked && solved.every(Boolean) && evaluateBranchSeal(frameFormat, atlas.sealX, atlas.sealY).acceptable;
          const firstUnsolved = solved.findIndex((value) => !value);
          draft2.atlas = {
            stageIndex: firstUnsolved < 0 ? atlas.stageIndex : Math.min(atlas.stageIndex, firstUnsolved),
            solved,
            frameFormat,
            frameX: atlas.frameX,
            frameY: atlas.frameY,
            frameLocked,
            sealX: atlas.sealX,
            sealY: atlas.sealY,
            compositionDone
          };
        }
      }
      return draft2;
    } catch {
      return emptyDraft();
    }
  }
  function loadCompositionDraft(chapter2) {
    try {
      return parseCompositionDraft(localStorage.getItem(`${STORAGE_PREFIX}${chapter2 ? "chapter" : "study"}`));
    } catch {
      return emptyDraft();
    }
  }
  function canReturnFromCompletedAlbum(requested, chapter2, floristMet, draft2) {
    const orchid = draft2.orchid;
    const atlas = draft2.atlas;
    return requested && (!chapter2 || floristMet) && orchid?.passed === true && assessComposition(orchid.state).passed && atlas?.compositionDone === true && atlas.solved.every(Boolean) && atlas.frameLocked && evaluateBranchFrame(atlas.frameFormat, atlas.frameX, atlas.frameY).acceptable && evaluateBranchSeal(atlas.frameFormat, atlas.sealX, atlas.sealY).acceptable;
  }

  // src/core/liuyuan-florist-beat.ts
  function advanceFloristBeat(state, action, porridgeDelivered) {
    if (!porridgeDelivered) return {
      state: "unmet",
      line: "\u82B1\u5320\u5934\u4E5F\u4E0D\u62AC\uFF1A\u201C\u82B1\u623F\u7684\u7CA5\uFF1F\u6401\u6A90\u4E0B\u3002\u522B\u8E29\u90A3\u6761\u7EBF\uFF0C\u521A\u57F9\u7684\u571F\u3002\u201D",
      showChoices: false,
      heardClue: false
    };
    if (action === "approach") return {
      state: "choice",
      line: state === "heard" ? "\u82B1\u5320\u53C8\u57CB\u5934\u7ED9\u76C6\u5170\u6362\u571F\u3002\u4F60\u8FD8\u53EF\u4EE5\u95EE\u4E00\u53E5\uFF0C\u6216\u770B\u4E00\u770B\u4ED6\u7684\u6D3B\u8BA1\u3002" : "\u82B1\u5320\u628A\u5170\u76C6\u6276\u6B63\uFF1A\u201C\u90A3\u4F4D\u7684\u7CA5\u7559\u7740\u3002\u5FD9\u5B8C\u4E86\uFF0C\u4ED6\u4F1A\u6765\u62FF\u3002\u201D\u4F60\u671B\u5411\u9662\u5916\uFF0C\u7FFB\u7EB8\u58F0\u65F6\u65AD\u65F6\u7EED\u3002",
      showChoices: true,
      heardClue: false
    };
    if (state !== "choice") return {
      state,
      line: "\u5148\u8D70\u8FD1\u82B1\u5320\uFF0C\u770B\u770B\u4ED6\u5FD9\u4EC0\u4E48\u3002",
      showChoices: false,
      heardClue: false
    };
    return action === "ask" ? {
      state: "heard",
      line: "\u201C\u521A\u624D\u8BF4\u7684\u90A3\u4F4D\uFF0C\u5728\u54EA\u513F\u770B\u4E66\uFF1F\u201D\u201C\u4E66\u658B\u91CC\u90A3\u4F4D\u3002\u201D\u201C\u54EA\u4E00\u95F4\uFF1F\u201D\u201C\u4ED6\u53C8\u4E0D\u5F52\u6211\u7BA1\u3002\u201D\u4ED6\u62E8\u4E86\u62E8\u5170\u571F\uFF1A\u201C\u90A3\u6811\u5F00\u524D\uFF0C\u82DE\u5C16\u50CF\u7B14\u5934\u3002\u6211\u4EEC\u7BA1\u5B83\u53EB\u7B14\u6811\u3002\u201D",
      showChoices: false,
      heardClue: true
    } : {
      state: "heard",
      line: "\u4F60\u6CA1\u50AC\u4ED6\uFF0C\u7B49\u4ED6\u628A\u76C6\u6CBF\u7684\u6E7F\u6CE5\u62B9\u51C0\u3002\u4F60\u671B\u5411\u9662\u5916\uFF0C\u4ED6\u987A\u7740\u4F60\u7684\u76EE\u5149\u8BF4\uFF1A\u201C\u90A3\u6811\u5F00\u524D\uFF0C\u82DE\u5C16\u50CF\u7B14\u5934\u3002\u6211\u4EEC\u7BA1\u5B83\u53EB\u7B14\u6811\u3002\u201D\u8BF4\u5B8C\u53C8\u5FD9\u4ED6\u7684\u5170\u3002",
      showChoices: false,
      heardClue: true
    };
  }

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

  // src/core/liuyuan-progression.ts
  var LIUYUAN_CHAPTER_FLAGS = [
    "ly-errand-offered",
    "ly-huabu-seen",
    "ly-gate-clue",
    "ly-gate-passed",
    "ly-alley-walked",
    "ly-porridge-delivered",
    "ly-florist-met",
    "ly-magnolia-seen",
    "ly-study-found",
    "ly-scholar-met",
    "ly-scholar-trouble-known",
    "ly-leaf-picked",
    "ly-leaf-written",
    "ly-leaf-carried",
    "ly-unlocked"
  ];
  var ALLEY_TASK_ID = "liuyuan-alley-walk";
  var LEAF_TASK_ID = "liuyuan-leaf-writing";
  function addOnce(values, value) {
    if (!values.includes(value)) values.push(value);
  }
  function advanceLiuyuanChapter(progress, flag) {
    if (progress.storyFlags.includes(flag)) return { progress, applied: false, reason: "already-applied" };
    const index = LIUYUAN_CHAPTER_FLAGS.indexOf(flag);
    const requiredFlag = flag === "ly-gate-passed" ? "ly-errand-offered" : flag === "ly-magnolia-seen" || flag === "ly-study-found" ? "ly-porridge-delivered" : index > 0 ? LIUYUAN_CHAPTER_FLAGS[index - 1] : void 0;
    if (requiredFlag && !progress.storyFlags.includes(requiredFlag)) {
      return { progress, applied: false, reason: "missing-previous", requiredFlag };
    }
    const next = {
      ...progress,
      arts: { ...progress.arts },
      gardens: { ...progress.gardens },
      completedTasks: [...progress.completedTasks],
      knowledge: [...progress.knowledge],
      storyFlags: [...progress.storyFlags, flag]
    };
    if (flag === "ly-errand-offered" && next.gardens.liuyuan === "locked") next.gardens.liuyuan = "clue";
    if (flag === "ly-gate-passed") next.gardens.liuyuan = "open";
    if (flag === "ly-alley-walked") {
      next.gardens.liuyuan = "entered";
      if (!next.completedTasks.includes(ALLEY_TASK_ID)) {
        next.completedTasks.push(ALLEY_TASK_ID);
        addOnce(next.knowledge, "liuyuan-cramped-alley");
      }
    }
    if (flag === "ly-florist-met") addOnce(next.knowledge, "liuyuan-magnolia-slip");
    if (flag === "ly-leaf-written" && !next.completedTasks.includes(LEAF_TASK_ID)) {
      next.completedTasks.push(LEAF_TASK_ID);
      next.arts.shu += 1;
    }
    if (flag === "ly-leaf-written") addOnce(next.knowledge, LIUYUAN_TEXT_VARIANT.knowledgeId);
    if (flag === "ly-unlocked") next.gardens.liuyuan = "complete";
    return { progress: next, applied: true, reason: "applied" };
  }
  function commitLiuyuanChapterFlag(flag) {
    const result = advanceLiuyuanChapter(loadProgress(), flag);
    if (result.applied) saveProgress(result.progress);
    return result;
  }
  function awardLiuyuanRainShadow() {
    const progress = loadProgress();
    const task = "liuyuan-rain-shadow";
    if (progress.completedTasks.includes(task)) return false;
    progress.completedTasks.push(task);
    if (!progress.storyFlags.includes("ly-rain-shadow-cleared")) progress.storyFlags.push("ly-rain-shadow-cleared");
    progress.arts.yu += 1;
    saveProgress(progress);
    return true;
  }
  function rememberLiuyuanDrawing(outcome) {
    const progress = loadProgress();
    const memory = `liuyuan-drawing-${outcome}`;
    if (progress.knowledge.includes(memory)) return;
    progress.knowledge.push(memory);
    if (outcome === "saved") addOnce(progress.knowledge, "liuyuan-album-orchid-leaf");
    saveProgress(progress);
  }
  function rememberLiuyuanFloristClue() {
    const progress = loadProgress();
    if (!progress.storyFlags.includes("ly-florist-met") || progress.knowledge.includes("liuyuan-magnolia-slip")) return false;
    progress.knowledge.push("liuyuan-magnolia-slip");
    saveProgress(progress);
    return true;
  }

  // src/core/liuyuan-rain-shadow.ts
  var RAIN_FIELD = { width: 320, height: 208, left: 24, right: 296, top: 32, bottom: 184 };
  var RAIN_ROUND_SECONDS = 7;
  var RAIN_ROUND_NAMES = [
    "\u4E00\u6298 \xB7 \u732B\u62E8\u753B\u7A3F",
    "\u4E8C\u6298 \xB7 \u96E8\u4ECE\u4FA7\u6765",
    "\u4E09\u6298 \xB7 \u56DE\u8EAB\u6709\u8DEF",
    "\u56DB\u6298 \xB7 \u96E8\u4ECE\u540E\u81F3",
    "\u4E94\u6298 \xB7 \u4FA7\u96E8\u6362\u5411",
    "\u516D\u6298 \xB7 \u7A7F\u8FC7\u659C\u96E8"
  ];
  var RAIN_ROUND_COUNT = RAIN_ROUND_NAMES.length;
  var STORY_RAIN_STAGES = [
    { start: 0, name: "\u8FA8\u96E8", tip: "\u5148\u770B\u7AD6\u5411\u96E8\u7F1D\uFF0C\u4E0B\u4E00\u9635\u4EAE\u5904\u4F1A\u6362\u8FB9\u3002" },
    { start: 5.5, name: "\u6362\u5411", tip: "\u96E8\u4ECE\u4FA7\u9762\u6765\u4E86\uFF0C\u6539\u770B\u96E8\u7F1D\u7684\u9AD8\u4F4E\u3002" },
    { start: 10.75, name: "\u4EA4\u96E8", tip: "\u7EB5\u6A2A\u96E8\u52BF\u4EA4\u9519\uFF0C\u5148\u987E\u5C06\u8FD1\u7684\u4E00\u9635\uFF0C\u7D27\u5904\u518D\u62A4\u753B\u3002" }
  ];
  var STORY_RAIN_WAVES = [
    { at: 0.45, axis: "y", gap: 78, stage: 0 },
    { at: 3, axis: "y", gap: 220, stage: 0 },
    { at: 5.5, axis: "x", gap: 76, stage: 1 },
    { at: 8.1, axis: "x", gap: 146, stage: 1 },
    { at: 10.75, axis: "y", gap: 104, stage: 2 },
    { at: 12.45, axis: "x", gap: 64, stage: 2 },
    { at: 14, axis: "y", gap: 236, stage: 2 },
    { at: 15.4, axis: "x", gap: 144, stage: 2 }
  ];
  var STORY_RAIN_BEATS = STORY_RAIN_WAVES.map((wave) => wave.at);
  var STORY_CAT_BEATS = [2.4, 6.65, 9.45, 12.8, 15.9];
  function rainCatDuration(cat) {
    return Math.hypot(cat.toX - cat.fromX, cat.toY - cat.fromY) / cat.speed;
  }
  function rainCatPosition(cat) {
    const t = Math.max(0, Math.min(1, (cat.age - cat.warning) / rainCatDuration(cat)));
    return { x: cat.fromX + (cat.toX - cat.fromX) * t, y: cat.fromY + (cat.toY - cat.fromY) * t };
  }
  function rainCatHits(cat, x, y) {
    if (cat.age < cat.warning || cat.age >= cat.warning + rainCatDuration(cat)) return false;
    const p = rainCatPosition(cat);
    return Math.hypot(x - p.x, y - p.y) <= 8;
  }
  function rainStoryStage(s) {
    return s.rainTime >= STORY_RAIN_STAGES[2].start ? 2 : s.rainTime >= STORY_RAIN_STAGES[1].start ? 1 : 0;
  }
  var RAIN_ROUND_TIPS = [
    "\u6361\u753B\u540E\u770B\u9752\u8272\u96E8\u7F1D\uFF0C\u4EAE\u5904\u4E0D\u6321\u96E8\u3002",
    "\u96E8\u4ECE\u5DE6\u53F3\u6765\uFF0C\u96E8\u7F1D\u770B\u9AD8\u4F4E\u3002",
    "\u7EB5\u96E8\u6A2A\u96E8\u4EA4\u66FF\uFF0C\u522B\u5B88\u7740\u6361\u753B\u5904\u3002",
    "\u96E8\u5148\u4ECE\u4E0B\u65B9\u6765\uFF0C\u7559\u610F\u7BAD\u5934\u3002",
    "\u5148\u53F3\u540E\u5DE6\uFF0C\u7F3A\u53E3\u4E5F\u6362\u4E86\u4F4D\u7F6E\u3002",
    "\u96E8\u52BF\u4EA4\u9519\u3002\u770B\u51C6\u7F3A\u53E3\uFF0C\u7D27\u5904\u518D\u62A4\u753B\u3002"
  ];
  var WINDOWS = [
    { x: 78, y: 128 },
    { x: 239, y: 76 },
    { x: 105, y: 65 },
    { x: 236, y: 140 },
    { x: 92, y: 105 },
    { x: 218, y: 64 }
  ];
  function rainWindow(state) {
    return WINDOWS[Math.max(0, Math.min(RAIN_ROUND_COUNT - 1, state.round))];
  }
  function rainPickupSeconds(state) {
    return state.gentle ? 6 : 4;
  }
  function rainSecondsLeft(state) {
    return Math.max(0, Math.ceil(state.collected ? rainDuration(state) - state.rainTime : rainPickupSeconds(state) - state.time));
  }
  var rainDuration = (state) => state.story ? 18 : RAIN_ROUND_SECONDS;
  var rainRoundCount = (state) => state.story ? 1 : RAIN_ROUND_COUNT;
  var rainHealthCapacity = (state) => state.story ? 3 : state.gentle ? 7 : 5;
  var rainHitGrace = (state) => state.story ? 0.6 : 0.85;
  function createRainShadow(gentle = false, story = false) {
    const health = rainHealthCapacity({ story, gentle });
    return {
      story,
      phase: "ready",
      round: 0,
      time: 0,
      rainTime: 0,
      total: 0,
      health,
      x: 160,
      y: 157,
      collected: false,
      marks: 0,
      hits: 0,
      shield: 0,
      cooldown: 0,
      invulnerable: 0,
      nextBand: 0,
      bands: [],
      cat: null,
      nextCat: 0,
      catHits: 0,
      lastHit: "",
      gentle,
      result: "",
      direction: 0,
      moving: false,
      roundStart: { x: 160, y: 157, health, hits: 0 }
    };
  }
  function retryRainShadow(state, gentle = state.gentle) {
    if (state.phase !== "lost" && state.phase !== "ready") return state;
    const next = createRainShadow(gentle, state.story);
    next.round = state.round;
    next.marks = state.round;
    next.x = state.roundStart.x;
    next.y = state.roundStart.y;
    next.health = gentle === state.gentle ? state.roundStart.health : gentle ? rainHealthCapacity(next) : Math.min(rainHealthCapacity(next), state.roundStart.health);
    next.hits = state.roundStart.hits;
    next.total = Math.max(0, state.total - state.time);
    next.roundStart = { x: next.x, y: next.y, health: next.health, hits: next.hits };
    return next;
  }
  function startRainShadow(state) {
    if (state.phase === "ready") state.phase = "running";
  }
  function pauseRainShadow(state) {
    if (state.phase === "running") state.phase = "paused";
  }
  function guardRainShadow(state) {
    if (state.phase === "running" && state.cooldown === 0) {
      state.shield = 0.6;
      state.cooldown = 2;
    }
  }
  function bandPosition(band) {
    return band.from + band.sign * Math.max(0, band.age - band.warning) * band.speed;
  }
  function rainBandLifetime(band) {
    if (band.speed <= 0) return Infinity;
    const end = band.axis === "y" ? band.sign > 0 ? RAIN_FIELD.bottom + 16 : RAIN_FIELD.top - 16 : band.sign > 0 ? RAIN_FIELD.right + 16 : RAIN_FIELD.left - 16;
    return band.warning + Math.abs(end - band.from) / band.speed;
  }
  function rainBandHits(band, x, y) {
    if (band.age < band.warning) return false;
    const along = band.axis === "y" ? y : x;
    const across = band.axis === "y" ? x : y;
    return Math.abs(along - bandPosition(band)) <= 9 && Math.abs(across - band.gap) > band.opening / 2 - 3;
  }
  function makeBand(state, index) {
    if (state.story) {
      const wave = STORY_RAIN_WAVES[index];
      const { axis: axis2, gap: gap2, stage } = wave;
      const sign2 = index % 2 ? -1 : 1;
      return {
        axis: axis2,
        sign: sign2,
        from: axis2 === "y" ? sign2 > 0 ? 20 : 196 : sign2 > 0 ? 12 : 308,
        gap: gap2,
        age: 0,
        opening: (state.gentle ? [104, 88, 72] : [84, 66, 50])[stage],
        warning: (state.gentle ? [1.6, 1.35, 1.2] : [1.35, 1.1, 0.95])[stage],
        speed: (state.gentle ? [70, 84, 96] : [82, 100, 116])[stage]
      };
    }
    const axis = state.round === 0 || state.round === 3 ? "y" : state.round === 1 || state.round === 4 ? "x" : index % 2 ? "x" : "y";
    const sign = (index % 2 ? -1 : 1) * (state.round >= 3 ? -1 : 1);
    const shift = state.round >= 3 ? 1 : 0;
    const gap = axis === "y" ? [78, 239, 105, 220][(index + shift) % 4] : [128, 76, 145, 65][(index + shift) % 4];
    return {
      axis,
      sign,
      from: axis === "y" ? sign > 0 ? 20 : 196 : sign > 0 ? 12 : 308,
      gap,
      opening: state.gentle ? 76 : state.round === 0 ? 70 : state.round === 5 ? 48 : 62,
      warning: state.gentle || state.round === 0 ? 1.25 : 0.95,
      age: 0,
      speed: state.gentle ? 76 : state.round === 0 ? 88 : state.round === 5 ? 116 : 96
    };
  }
  function step(state, dt, input) {
    state.time += dt;
    state.total += dt;
    state.cooldown = Math.max(0, state.cooldown - dt);
    state.shield = Math.max(0, state.shield - dt);
    state.invulnerable = Math.max(0, state.invulnerable - dt);
    if (input.guard) guardRainShadow(state);
    let dx = input.x, dy = input.y;
    if (input.target) {
      dx = input.target.x - state.x;
      dy = input.target.y - state.y;
    }
    const length = Math.hypot(dx, dy);
    state.moving = length > 0.1;
    if (length) {
      state.direction = dy > 0 ? 0 : dy < 0 ? 3 : dx > 0 ? 2 : 1;
      const distance = (state.shield > 0 ? 62 : 108) * dt;
      const amount = input.target ? Math.min(distance, length) : distance;
      state.x += dx / length * amount;
      state.y += dy / length * amount;
    }
    state.x = Math.max(RAIN_FIELD.left + 4, Math.min(RAIN_FIELD.right - 4, state.x));
    state.y = Math.max(RAIN_FIELD.top + 4, Math.min(RAIN_FIELD.bottom - 4, state.y));
    const light = rainWindow(state);
    if (!state.collected) {
      if (state.time >= 0.7 && Math.hypot(state.x - light.x, state.y - light.y) <= 13) {
        state.collected = true;
        state.marks++;
        state.rainTime = 0;
      } else {
        if (state.time >= rainPickupSeconds(state)) {
          state.phase = "lost";
          state.result = "\u732B\u62E8\u843D\u7684\u753B\u7A3F\u8FD8\u5728\u5730\u4E0A\u3002\u8D70\u5230\u91D1\u8272\u753B\u7A3F\u5904\uFF0C\u5C31\u4F1A\u81EA\u52A8\u6361\u8D77\u3002";
        }
        return;
      }
    }
    state.rainTime += dt;
    const beats = state.story ? STORY_RAIN_BEATS : state.round === 2 || state.round === 5 ? [0.35, 1.9, 3.45, 4.8] : [0.35, 2.5, 4.65];
    while (state.nextBand < beats.length && state.rainTime >= beats[state.nextBand]) {
      state.bands.push(makeBand(state, state.nextBand));
      state.nextBand++;
    }
    for (const band of state.bands) band.age += dt;
    state.bands = state.bands.filter((band) => band.age < rainBandLifetime(band));
    if (state.story && state.nextCat < STORY_CAT_BEATS.length && state.rainTime >= STORY_CAT_BEATS[state.nextCat]) {
      const band = state.bands.find((b) => b.age < b.warning) ?? state.bands[state.bands.length - 1];
      const horizontal = !band || band.axis === "y";
      const stage = rainStoryStage(state);
      state.cat = {
        fromX: horizontal ? state.x < 160 ? 30 : 290 : state.x,
        fromY: horizontal ? state.y : state.y < 108 ? 38 : 178,
        toX: state.x,
        toY: state.y,
        age: 0,
        warning: (state.gentle ? [1.5, 1.35, 1.25] : [1.15, 1, 0.9])[stage],
        speed: (state.gentle ? [120, 135, 145] : [155, 175, 190])[stage]
      };
      if (Math.hypot(state.cat.toX - state.cat.fromX, state.cat.toY - state.cat.fromY) < 24) {
        if (horizontal) state.cat.fromX = state.x < 160 ? state.x + 24 : state.x - 24;
        else state.cat.fromY = state.y < 108 ? state.y + 24 : state.y - 24;
      }
      state.nextCat++;
    }
    if (state.cat) {
      state.cat.age += dt;
      if (state.cat.age >= state.cat.warning + rainCatDuration(state.cat) + 0.5) state.cat = null;
    }
    const catHit = !!state.cat && rainCatHits(state.cat, state.x, state.y);
    const rainHit = state.shield === 0 && state.bands.some((band) => rainBandHits(band, state.x, state.y));
    if (state.invulnerable === 0 && (catHit || rainHit)) {
      state.health--;
      state.hits++;
      state.invulnerable = rainHitGrace(state);
      state.lastHit = catHit ? "cat" : "rain";
      if (catHit) state.catHits++;
    }
    if (state.health <= 0) {
      state.phase = "lost";
      state.result = state.lastHit === "cat" ? "HP 0/3 \xB7 \u732B\u6251\u4E2D\u4E86\u3002\u56DE\u6A90\u4E0B\u7F13\u4E00\u7F13\uFF0C\u518D\u770B\u5B83\u4F0F\u8EAB\u7684\u6251\u5411\uFF0C\u4FA7\u79FB\u8BA9\u5F00\uFF1B\u62A4\u753B\u4E0D\u80FD\u6321\u732B\u3002" : state.story ? "HP 0/3 \xB7 \u6DCB\u96E8\u5931\u624B\u4E86\u3002\u56DE\u6A90\u4E0B\u7F13\u4E00\u7F13\uFF0C\u770B\u51C6\u96E8\u7F1D\uFF0C\u518D\u6765\u4E00\u56DE\u3002" : "\u96E8\u70B9\u6D78\u6E7F\u4E86\u7EB8\u89D2\u3002\u770B\u51C6\u9884\u544A\u7684\u7F3A\u53E3\uFF0C\u518D\u6765\u4E00\u56DE\u3002";
      return;
    }
    if (state.rainTime >= rainDuration(state)) {
      if (state.round === rainRoundCount(state) - 1) {
        state.phase = "won";
        state.result = `${state.story ? "\u753B\u7A3F\u62A2\u56DE\u4E86" : "\u516D\u9875\u753B\u7A3F\u90FD\u62FE\u56DE\u4E86"}\u3002${state.hits === 0 ? "\u7EB8\u89D2\u5B8C\u597D" : "\u7EB8\u89D2\u7565\u4E71\uFF0C\u753B\u610F\u8FD8\u5728"}\u3002\u732B\u8E72\u5728\u6A90\u4E0B\uFF0C\u50CF\u662F\u4EC0\u4E48\u4E5F\u6CA1\u505A\u3002`;
        return;
      }
      state.round++;
      state.time = 0;
      state.rainTime = 0;
      state.collected = false;
      state.nextBand = 0;
      state.bands = [];
      state.invulnerable = 0.6;
      state.roundStart = { x: state.x, y: state.y, health: state.health, hits: state.hits };
    }
  }
  function updateRainShadow(state, seconds, input) {
    if (state.phase !== "running" || !Number.isFinite(seconds) || seconds <= 0) return;
    let remaining = Math.min(0.1, seconds);
    while (remaining > 0 && state.phase === "running") {
      const dt = Math.min(1 / 120, remaining);
      step(state, dt, input);
      remaining -= dt;
    }
  }

  // src/render/scholar-sprite.ts
  var SCHOLAR_FRAMES = [
    [
      { sx: 159, sy: 25, sw: 164, sh: 341 },
      { sx: 457, sy: 25, sw: 165, sh: 348 },
      { sx: 757, sy: 25, sw: 164, sh: 348 }
    ],
    [
      { sx: 159, sy: 375, sw: 175, sh: 345 },
      { sx: 450, sy: 375, sw: 180, sh: 340 },
      { sx: 754, sy: 375, sw: 174, sh: 345 }
    ],
    [
      { sx: 147, sy: 722, sw: 177, sh: 345 },
      { sx: 451, sy: 722, sw: 188, sh: 345 },
      { sx: 750, sy: 722, sw: 183, sh: 345 }
    ],
    [
      { sx: 157, sy: 1069, sw: 175, sh: 337 },
      { sx: 454, sy: 1069, sw: 176, sh: 341 },
      { sx: 749, sy: 1069, sw: 179, sh: 343 }
    ]
  ];
  function scholarFrame(direction, phase) {
    return SCHOLAR_FRAMES[Math.max(0, Math.min(3, Math.floor(direction)))][Math.max(0, Math.min(2, Math.floor(phase)))];
  }
  function drawScholarAtFoot(ctx2, sprite2, direction, phase, footX, footY, height) {
    drawSpriteFrameAtFoot(ctx2, sprite2, scholarFrame(direction, phase), footX, footY, height);
  }
  function drawSpriteFrameAtFoot(ctx2, sprite2, frame, footX, footY, height) {
    const drawnHeight = Math.round(height);
    const drawnWidth = Math.round(drawnHeight * frame.sw / frame.sh);
    ctx2.drawImage(
      sprite2,
      frame.sx,
      frame.sy,
      frame.sw,
      frame.sh,
      Math.round(footX) - Math.floor(drawnWidth / 2),
      Math.round(footY) - drawnHeight,
      drawnWidth,
      drawnHeight
    );
  }
  function drawScholarGroundShadow(ctx2, footX, footY, height) {
    const x = Math.round(footX), y = Math.round(footY);
    const outer = Math.round(height * 0.4), inner = Math.round(height * 0.29);
    ctx2.fillStyle = "rgba(19, 27, 21, .12)";
    ctx2.fillRect(x - Math.floor(outer / 2), y - 3, outer, 5);
    ctx2.fillStyle = "rgba(19, 27, 21, .23)";
    ctx2.fillRect(x - Math.floor(inner / 2), y - 2, inner, 3);
  }

  // src/render/rain-shadow-vignettes.ts
  function rainCatShadowMarks(cat) {
    const distance = Math.hypot(cat.toX - cat.fromX, cat.toY - cat.fromY);
    const count = Math.max(1, Math.min(3, Math.ceil(distance / 28)));
    return Array.from({ length: count }, (_, i) => {
      const t = (i + 1) / count;
      return { x: cat.fromX + (cat.toX - cat.fromX) * t, y: cat.fromY + (cat.toY - cat.fromY) * t, t };
    });
  }
  function drawRainCatPounceHint(ctx2, cat, quiet = false) {
    if (cat.age >= cat.warning) return;
    const dx = Math.sign(cat.toX - cat.fromX), dy = Math.sign(cat.toY - cat.fromY);
    const progress = quiet ? 0.75 : Math.min(1, cat.age / cat.warning);
    const pieces = [
      [-5, -2, 10, 5],
      [4, -3, 5, 5],
      [4, -5, 2, 2],
      [7, -5, 2, 2],
      [7, 2, 5, 2],
      [3, 4, 4, 1],
      [-6, 3, 3, 2],
      [-10, -2, 4, 2],
      [-10, -5, 2, 3]
    ];
    for (const mark of rainCatShadowMarks(cat)) {
      ctx2.fillStyle = mark.t === 1 ? progress > 0.8 ? "#968a75" : "#a69c86" : mark.t <= progress ? "#b4ac98" : "#c5c0b1";
      for (const [u, v, w, h] of pieces) for (let a = 0; a < w; a++) for (let b = 0; b < h; b++) {
        const x = Math.round(mark.x + dx * (u + a) - dy * (v + b));
        const y = Math.round(mark.y + dy * (u + a) + dx * (v + b));
        if (x >= RAIN_FIELD.left && x < RAIN_FIELD.right && y >= RAIN_FIELD.top && y < RAIN_FIELD.bottom)
          ctx2.fillRect(x, y, 1, 1);
      }
    }
  }
  var RAIN_DRAWING_NAMES = ["\u5170\u53F6", "\u7AF9\u679D", "\u6885\u68A2", "\u53E0\u77F3", "\u8549\u53F6", "\u8377\u53F6"];
  var SKETCHES = [
    [[8, 19, 9, 9], [9, 9, 5, 4], [5, 4, 2, 8], [9, 19, 13, 5], [13, 5, 17, 3], [10, 19, 18, 10], [18, 10, 21, 12], [9, 17, 3, 11]],
    [[7, 20, 8, 2], [7, 8, 17, 6], [8, 12, 3, 9], [8, 16, 18, 14], [12, 7, 11, 3], [14, 7, 18, 3], [15, 14, 20, 11], [5, 10, 2, 5]],
    [[3, 19, 8, 14], [8, 14, 11, 8], [11, 8, 17, 5], [17, 5, 21, 3], [11, 8, 9, 3], [8, 14, 17, 13], [17, 13, 20, 9]],
    [
      [2, 18, 4, 12],
      [4, 12, 8, 9],
      [8, 9, 11, 15],
      [11, 15, 9, 19],
      [2, 18, 9, 19],
      [9, 19, 18, 18],
      [18, 18, 21, 10],
      [21, 10, 17, 8],
      [17, 8, 14, 12],
      [14, 12, 12, 5],
      [12, 5, 8, 3],
      [8, 3, 5, 10],
      [9, 6, 10, 10],
      [16, 13, 18, 11]
    ],
    [
      [10, 20, 11, 7],
      [11, 7, 8, 3],
      [8, 3, 3, 5],
      [3, 5, 6, 10],
      [6, 10, 11, 7],
      [11, 7, 17, 2],
      [17, 2, 21, 6],
      [21, 6, 16, 10],
      [16, 10, 11, 7],
      [11, 11, 17, 12],
      [17, 12, 20, 16],
      [20, 16, 13, 15],
      [13, 15, 11, 11]
    ],
    [
      [6, 20, 8, 10],
      [8, 10, 4, 7],
      [4, 7, 2, 11],
      [2, 11, 6, 14],
      [6, 14, 12, 12],
      [12, 12, 14, 8],
      [14, 8, 8, 7],
      [15, 20, 17, 9],
      [17, 9, 15, 5],
      [15, 5, 19, 2],
      [19, 2, 22, 6],
      [22, 6, 17, 9],
      [3, 19, 10, 18]
    ]
  ];
  function rainAlbumState(s) {
    return {
      complete: s.phase === "won" ? rainRoundCount(s) : s.round,
      held: s.collected && s.phase !== "won" ? s.round : null
    };
  }
  function drawRainSketch(ctx2, index, x, y, w, h) {
    if (index === 0) {
      const clusters = [
        ["#536655", [[70, 72, 4, 12], [66, 62, 4, 12], [62, 52, 4, 12], [54, 42, 8, 4], [44, 36, 10, 4], [32, 34, 12, 3]]],
        ["#334e43", [[74, 64, 3, 20], [77, 50, 3, 16], [80, 38, 3, 14], [83, 28, 3, 12], [86, 20, 3, 10]]],
        ["#6e7e5f", [[76, 76, 5, 8], [81, 64, 4, 12], [85, 56, 4, 10], [89, 48, 6, 8], [95, 44, 12, 4], [107, 46, 10, 3]]],
        ["#738269", [[67, 78, 3, 6], [62, 72, 5, 4], [55, 68, 7, 3], [44, 67, 11, 2], [34, 70, 10, 2]]],
        ["#536655", [[92, 68, 2, 16], [94, 57, 2, 12], [96, 48, 2, 11], [97, 43, 3, 6]]],
        ["#aa8266", [[94, 38, 4, 8], [98, 40, 8, 3], [91, 44, 6, 3], [98, 45, 3, 6]]],
        ["#a5624b", [[121, 75, 8, 2], [121, 79, 8, 2], [121, 83, 8, 2], [120, 73, 2, 14], [129, 73, 2, 14]]]
      ];
      for (const [color, points] of clusters) {
        ctx2.fillStyle = color;
        for (const [px, py, pw, ph] of points) ctx2.fillRect(
          Math.round(x + px * w / 160),
          Math.round(y + py * h / 104),
          Math.max(1, Math.round(pw * w / 160)),
          Math.max(1, Math.round(ph * h / 104))
        );
      }
      return;
    }
    ctx2.fillStyle = "#637267";
    for (const [ax, ay, bx, by] of SKETCHES[index % SKETCHES.length]) {
      const length = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
      for (let i = 0; i <= length; i++) {
        const t = length ? i / length : 0;
        ctx2.fillRect(
          Math.round(x + (ax + (bx - ax) * t) * w / 24),
          Math.round(y + (ay + (by - ay) * t) * h / 22),
          1,
          1
        );
      }
    }
    if (index === 2) {
      ctx2.fillStyle = "#aa877e";
      for (const [px, py] of [[9, 3], [17, 5], [20, 9]]) ctx2.fillRect(Math.round(x + px * w / 24), Math.round(y + py * h / 22), 2, 2);
    }
    ctx2.fillStyle = "#a7745e";
    ctx2.fillRect(Math.round(x + w - 3), Math.round(y + h - 3), 2, 2);
  }
  function drawRainAlbum(ctx2, s, quiet = false) {
    ctx2.imageSmoothingEnabled = false;
    ctx2.fillStyle = "#e5e1d5";
    ctx2.fillRect(0, 0, 320, 43);
    const { complete, held } = rainAlbumState(s);
    if (s.story) {
      ctx2.fillStyle = "#bdb69e";
      ctx2.fillRect(6, 4, 55, 36);
      ctx2.fillStyle = "#f1e9d7";
      ctx2.fillRect(5, 2, 55, 36);
      ctx2.fillStyle = "#f8eed9";
      ctx2.fillRect(6, 3, 53, 1);
      drawRainSketch(ctx2, 0, 6, 3, 52, 33);
      ctx2.fillStyle = "#53675b";
      ctx2.font = "10px monospace";
      ctx2.fillText(complete ? "\u5170\u7A3F\u62A4\u597D\u4E86 \xB7 \u7B49\u4F60\u6536\u597D" : held !== null ? "\u5170\u7A3F\u5728\u624B\u4E2D \xB7 \u6B63\u5728\u62A4\u753B" : "\u82B1\u5320\u7684\u5170\u7A3F \xB7 \u5148\u628A\u7EB8\u9875\u62FE\u8D77", 70, 16);
      ctx2.font = "8px monospace";
      ctx2.fillText(complete ? "\u732B\u8E72\u56DE\u6A90\u4E0B\uFF0C\u50CF\u4EC0\u4E48\u4E5F\u6CA1\u505A\u3002" : s.cat ? s.cat.age < s.cat.warning ? "\u732B\u4F0F\u8EAB\uFF01\u4FA7\u79FB\u8BA9\u5F00\uFF0C\u62A4\u753B\u4E0D\u6321\u732B\u3002" : s.cat.age < s.cat.warning + rainCatDuration(s.cat) ? "\u732B\u6251\u6765\u4E86\uFF01\u8BA9\u5F00\u521A\u624D\u7684\u732B\u5F71\u3002" : Math.hypot(s.x - s.cat.toX, s.y - s.cat.toY) > 16 ? "\u732B\u6B6A\u5934\uFF1A\u54A6\uFF1F\u2026\u2026\u8FD8\u5F97\u770B\u96E8\u7F1D\u3002" : "\u732B\u843D\u56DE\u77F3\u5730\uFF0C\u8FD8\u5F97\u770B\u96E8\u7F1D\u3002" : "\u62FE\u753B \u2192 \u907F\u96E8\u3001\u8BA9\u732B \u2192 \u6536\u597D", 70, 31);
      drawRainCat(ctx2, 302, 35, -1, complete && !quiet ? "groom" : "sit", quiet ? 0 : s.total);
      return;
    }
    for (let i = 0; i < rainRoundCount(s); i++) {
      const x = 5 + i * 53, arrived = i < complete, inHand = i === held;
      ctx2.fillStyle = arrived || inHand ? "#f1e9d7" : "#d7d8cb";
      ctx2.fillRect(x, 2, 45, 27);
      ctx2.fillStyle = inHand ? "#b19962" : arrived ? "#6f8771" : "#b7bdae";
      ctx2.fillRect(x, 2, 45, 1);
      ctx2.fillRect(x, 28, 45, 1);
      if (arrived || inHand || i === s.round) drawRainSketch(ctx2, i, x + 6, 4, 31, 23);
      else {
        ctx2.fillStyle = "#bdc4b5";
        ctx2.fillRect(x + 18, 12, 8, 1);
      }
      if (arrived) {
        ctx2.fillStyle = "#799078";
        ctx2.fillRect(x + 37, 4, 5, 5);
        ctx2.fillStyle = "#eee9d9";
        ctx2.fillRect(x + 38, 6, 1, 1);
        ctx2.fillRect(x + 39, 5, 2, 1);
      }
      ctx2.font = "8px monospace";
      ctx2.fillStyle = "#53675b";
      ctx2.fillText(`${RAIN_DRAWING_NAMES[i]}${inHand ? "\xB7\u624B\u4E2D" : arrived ? "\xB7\u5165\u518C" : "\xB7\u5F85\u62FE"}`, x + 1, 39);
    }
  }
  function drawRainCat(ctx2, x, y, facing, pose, time) {
    const pixel = (dx, dy, w, h, color) => {
      ctx2.fillStyle = color;
      ctx2.fillRect(
        Math.round(x + (dx + (pose === "look" && dy < -8 ? 1 : 0)) * facing - (facing < 0 ? w : 0)),
        Math.round(y + dy + ((pose === "crouch" || pose === "pounce") && dy < -8 ? 4 : pose === "look" && dy < -8 ? 1 : 0)),
        w,
        h
      );
    };
    const gait = pose === "walk" ? Math.floor(time * 12) % 2 * 2 : 0;
    const blink = Math.floor(time * 2) % 9 === 8;
    pixel(-8, 0, 16, 2, "#87917c");
    pixel(-7, -8, 15, 8, "#52584a");
    pixel(-5, -10, 11, 2, "#52584a");
    pixel(-1, -16, 11, 8, "#52584a");
    pixel(1, -18, 7, 2, "#52584a");
    pixel(-6, -9, 13, 8, "#b8aa8b");
    pixel(-5, -8, 4, 5, "#69715c");
    pixel(-5, -10, 10, 1, "#e2d5b9");
    pixel(-3, -6, 6, 4, "#ded0b2");
    pixel(-3, -8, 1, 2, "#777e6d");
    pixel(0, -8, 1, 2, "#8b8b7a");
    pixel(-4, -2, 3, 3, "#ddd1b6");
    pixel(3, -2 - gait, 3, 3, "#ddd1b6");
    pixel(0, -16, 9, 8, "#ddd1b6");
    pixel(0, -19, 3, 4, "#8b8b7a");
    pixel(7, -19, 2, 4, "#8b8b7a");
    pixel(1, -17, 1, 2, "#be9986");
    pixel(7, -17, 1, 2, "#be9986");
    pixel(2, -15, 5, 1, "#efe2c4");
    pixel(4, -15, 1, 2, "#9b9c86");
    pixel(2, -13, blink ? 2 : 1, 1, "#43584a");
    pixel(6, -13, blink ? 2 : 1, 1, "#43584a");
    pixel(4, -11, 1, 1, "#a57968");
    pixel(8, -10, 3, 1, "#9e9b83");
    pixel(3, -10, 3, 1, "#f0e2c5");
    pixel(-2, -10, 3, 1, "#9e9b83");
    if (pose === "paw") {
      pixel(6, -6, 7, 2, "#ddd1b6");
      pixel(12, -6, 1, 2, "#818775");
    }
    if (pose === "groom") {
      pixel(6, -10, 2, 3, "#ddd1b6");
      pixel(4, -9, 2, 1, "#af8f80");
    }
    if (pose === "pounce") {
      pixel(5, -3, 9, 2, "#ddd1b6");
      pixel(-9, -3, 5, 2, "#ddd1b6");
    }
    pixel(-9, -8, 3, 6, "#8b8b7a");
    pixel(-11, -12 + Math.floor(time * 5) % 2, 3, 6, "#8b8b7a");
  }

  // src/render/rain-shadow-ink.ts
  var RAIN_INK = {
    ink: "#87998f",
    tail: "#b4c2b8",
    pale: "#fffdf3"
  };
  function rainInkCells(b, quiet = false) {
    if (b.age < b.warning) return [];
    const isY = b.axis === "y", p = bandPosition(b);
    const alongMin = isY ? RAIN_FIELD.top : RAIN_FIELD.left, alongMax = isY ? RAIN_FIELD.bottom : RAIN_FIELD.right;
    const acrossMin = isY ? RAIN_FIELD.left : RAIN_FIELD.top, acrossMax = isY ? RAIN_FIELD.right : RAIN_FIELD.bottom;
    const lo = Math.max(alongMin, Math.ceil(p - 9 - 0.5));
    const hi = Math.min(alongMax - 1, Math.floor(p + 9 - 0.5));
    const phase = quiet ? 0 : Math.floor(Math.max(0, b.age - b.warning) * 5);
    const cells = [];
    for (let a = lo; a <= hi; a++) for (let n = acrossMin; n < acrossMax; n++) {
      if (Math.abs(n + 0.5 - b.gap) <= b.opening / 2 - 3) continue;
      const d = a + 0.5 - p;
      const group = Math.floor(n / 13), local = (n + group * 3) % 13;
      const bend = Math.floor(d * (group % 3 === 0 ? 0.4 : 0.8));
      const stroke = (local + bend + phase + group * 7 % 11 + 26) % 13;
      const pivot = group % 5 - 2, length = 7 + group * 7 % 8;
      const head = Math.abs(d - pivot) < 2;
      const width = head ? 3 + group % 2 : 1;
      const strong = stroke <= width && Math.abs(d - pivot) < length / 2 && (n * 3 + Math.floor(d) * 5 + group + 130) % 17 !== 0;
      const glint = stroke === 6 && Math.abs(d) < 2 && group % 5 === 1;
      if (!strong && !glint) continue;
      cells.push({
        x: isY ? n : a,
        y: isY ? a : n,
        color: glint || head && stroke > 0 && stroke < width ? RAIN_INK.pale : head ? RAIN_INK.ink : RAIN_INK.tail
      });
    }
    return cells;
  }
  function drawRainGapHint(ctx2, b) {
    const isY = b.axis === "y", preview = b.age < b.warning;
    const p = preview ? isY ? b.sign > 0 ? RAIN_FIELD.top + 4 : RAIN_FIELD.bottom - 5 : b.sign > 0 ? RAIN_FIELD.left + 4 : RAIN_FIELD.right - 5 : bandPosition(b);
    const alongMin = isY ? RAIN_FIELD.top : RAIN_FIELD.left, alongMax = isY ? RAIN_FIELD.bottom : RAIN_FIELD.right;
    if (p < alongMin || p >= alongMax) return;
    for (const side of [-1, 1]) {
      const across = b.gap + side * (b.opening / 2 - 5);
      for (let i = -2; i <= 2; i++) {
        const n = across - side * Math.abs(i), a = p + i;
        const x = Math.round(isY ? n : a), y = Math.round(isY ? a : n);
        if (x >= RAIN_FIELD.left && x < RAIN_FIELD.right && y >= RAIN_FIELD.top && y < RAIN_FIELD.bottom) {
          ctx2.fillStyle = "#48755f";
          ctx2.fillRect(x, y, 1, 1);
        }
      }
    }
    const cx = isY ? b.gap : p, cy = isY ? p : b.gap;
    const dot = (dx, dy, color) => {
      const x = Math.round(cx + dx), y = Math.round(cy + dy);
      if (x >= RAIN_FIELD.left && x < RAIN_FIELD.right && y >= RAIN_FIELD.top && y < RAIN_FIELD.bottom) {
        ctx2.fillStyle = color;
        ctx2.fillRect(x, y, 1, 1);
      }
    };
    for (let dy = -6; dy <= 0; dy++) {
      const width = [1, 3, 5, 6, 7, 8, 7][dy + 6];
      for (let dx = -width; dx <= width; dx++) dot(
        dx,
        dy,
        Math.abs(dx) === width || dy === 0 ? "#65775d" : (dx + dy) % 4 === 0 ? "#d4c49e" : "#ede1bd"
      );
    }
    for (let dy = -5; dy <= 5; dy++) dot(0, dy, dy < 0 ? "#b5a27e" : "#75674f");
    dot(1, 5, "#75674f");
    dot(2, 4, "#75674f");
  }
  function drawRainInkBand(ctx2, b, quiet = false) {
    for (const cell of rainInkCells(b, quiet)) {
      ctx2.fillStyle = cell.color;
      ctx2.fillRect(cell.x, cell.y, 1, 1);
    }
  }
  function drawRainInkMargins(ctx2, time, quiet = false) {
    const dot = (x, y, color) => {
      x = Math.round(x);
      y = Math.round(y);
      if (x < 0 || x >= 320 || y < 32 || y >= RAIN_FIELD.bottom || x >= RAIN_FIELD.left && x < RAIN_FIELD.right) return;
      ctx2.fillStyle = color;
      ctx2.fillRect(x, y, 1, 1);
    };
    const bend = quiet ? 0 : Math.round(Math.sin(time * 0.65));
    const branch = (x, y, dx, length, color) => {
      for (let i = 0; i < length; i++) dot(x + i * dx, y + Math.floor(i * 0.55), color);
    };
    const leaf = (x, y, dx, dy, length, color) => {
      for (let i = 0; i < length; i++) {
        const py = y + i * dy + Math.floor(i / 4) * bend;
        dot(x + i * dx, py, color);
        if (i > 1 && i < length - 2) dot(x + i * dx, py + 1, color);
      }
    };
    for (const [x, y, dx, size] of [[1, 45, 1, 13], [318, 72, -1, 14], [3, 138, 1, 10]]) {
      branch(x, y, dx, size, "#9ca89b");
      for (let j = 0; j < 3; j++) leaf(x + dx * (j * 4 + 2), y + j * 2, dx, 1, 7 - j, "#a6b1a1");
    }
    branch(-4, 61, 1, 25, "#66776a");
    branch(324, 147, -1, 29, "#5b6d63");
    for (const [x, y, dx, dy, size] of [
      [2, 64, 1, 1, 12],
      [8, 70, -1, 1, 11],
      [14, 75, 1, 1, 9],
      [4, 86, 1, 0, 12],
      [12, 83, -1, 1, 14],
      [317, 151, -1, 1, 13],
      [309, 155, 1, 1, 10],
      [304, 159, -1, 1, 11],
      [319, 166, -1, 0, 10],
      [312, 168, 1, 1, 12]
    ]) leaf(x, y, dx, dy, size, "#56695f");
  }

  // src/render/liuyuan-rain-shadow.ts
  var RAIN_BACKGROUND_OPACITY = 0.4;
  var RAIN_BAMBOO_DEPTH = 152;
  function drawRainShadow(ctx2, s, scholar, quiet = false, backdrop, foreground) {
    ctx2.imageSmoothingEnabled = false;
    ctx2.globalAlpha = 1;
    const rect = (x, y, w, h, color) => {
      ctx2.fillStyle = color;
      ctx2.fillRect(Math.round(x), Math.round(y), w, h);
    };
    const entities = [];
    rect(0, 0, 320, 208, "#f0eee3");
    const artReady = !!backdrop?.complete && backdrop.naturalWidth > 0 && backdrop.naturalHeight > 0;
    if (artReady) {
      ctx2.globalAlpha = RAIN_BACKGROUND_OPACITY;
      ctx2.drawImage(backdrop, 0, 0, 320, 208);
      ctx2.globalAlpha = 1;
    } else {
      drawRainInkMargins(ctx2, s.total, quiet);
      for (let x = 24; x < 296; x += 52) for (let y = 64; y < 184; y += 40) {
        rect(x, y, 19 + (x + y) % 9, 1, "#cbd0c2");
        rect(x + 7, y + 2, 9, 1, "#d6dacc");
      }
    }
    const stage = rainStoryStage(s);
    if (!artReady) {
      ctx2.fillStyle = "#465b50";
      ctx2.font = "10px monospace";
      ctx2.fillText(s.story ? "\u96E8\u4E2D\u62A2\u753B" : RAIN_ROUND_NAMES[s.round], 12, 15);
      ctx2.fillText(s.phase === "won" ? "\u5DF2\u62A4\u597D" : s.collected ? s.story ? `${stage + 1}/3 ${STORY_RAIN_STAGES[stage].name}` : "\u62A4\u753B\u907F\u96E8" : "\u5148\u6361\u753B\u7A3F", 172, 15);
      ctx2.fillText(`${s.marks}/${rainRoundCount(s)}`, 280, 15);
    }
    const light = rainWindow(s);
    if (!s.collected || s.rainTime < 1.2) {
      if (!s.collected) {
        const progress = Math.min(1, s.time / 0.7);
        const fall = s.phase === "ready" || quiet ? 0 : -24 * (1 - progress * progress);
        const sway = s.phase === "running" && !quiet && s.time < 0.7 ? Math.round(Math.sin(progress * Math.PI * 2) * 2) : 0;
        rect(light.x - 9, light.y + 7, 20, 2, "#a9ac99");
        rect(light.x - 10 + sway, light.y - 7 + fall, 20, 14, "#f2e7c9");
        rect(light.x - 9 + sway, light.y - 6 + fall, 18, 1, "#fbf0d5");
        rect(light.x - 9 + sway, light.y + 5 + fall, 18, 1, "#d2c3a0");
        rect(light.x - 11 + sway, light.y - 8 + fall, 2, 16, "#a28b63");
        rect(light.x + 9 + sway, light.y - 8 + fall, 2, 16, "#a28b63");
        drawRainSketch(ctx2, s.round, light.x - 9 + sway, light.y - 6 + fall, 18, 12);
        if (!quiet && s.phase === "running" && s.time >= 0.7 && s.time < 1) {
          const spread = 13 + (s.time - 0.7) * 20;
          rect(light.x - spread, light.y + 8, 3, 1, "#aa9b78");
          rect(light.x + spread, light.y + 8, 3, 1, "#aa9b78");
        }
      }
      ctx2.fillStyle = s.collected ? "#536a50" : "#795b2d";
      ctx2.font = "9px monospace";
      ctx2.fillText(s.collected ? "\u5DF2\u6361" : "\u6361\u753B", light.x - 9, light.y + 23);
    }
    if (!s.cat || s.phase === "won") {
      const side = light.x > 160 ? 1 : -1;
      const t = s.collected ? quiet ? 1 : Math.min(1, s.rainTime / 1.2) : 0;
      const start = light.x + side * 23;
      const cx = start + ((side > 0 ? 306 : 14) - start) * t;
      const cy = light.y + 1 + (168 - light.y - 1) * t;
      const pose = t > 0 && t < 1 ? "walk" : t === 1 && Math.floor(s.total) % 4 === 2 ? "groom" : !s.collected && s.phase === "running" && s.time < 0.35 ? "paw" : "sit";
      entities.push({ depth: cy, paint: () => {
        drawRainCat(ctx2, cx, cy, t > 0 && t < 1 ? side : -side, quiet ? "sit" : pose, quiet ? 0 : s.total);
        if (s.phase === "ready" || !s.collected && s.time >= 0.7 && s.time < 1.5) {
          rect(cx - 11, cy - 33, 23, 11, "#eee8d9");
          ctx2.fillStyle = "#596d5c";
          ctx2.font = "8px monospace";
          ctx2.fillText("\u55B5\uFF1F", cx - 7, cy - 25);
        }
      } });
    }
    if (s.cat && s.phase !== "won") drawRainCatPounceHint(ctx2, s.cat, quiet);
    for (const b of s.phase === "won" ? [] : s.bands) {
      if (b.age < b.warning) {
        drawRainGapHint(ctx2, b);
        const isY = b.axis === "y";
        ctx2.fillStyle = "#586c63";
        ctx2.font = "12px monospace";
        ctx2.fillText(isY ? b.sign > 0 ? "\u2193" : "\u2191" : b.sign > 0 ? "\u2192" : "\u2190", isY ? 155 : b.sign > 0 ? 8 : 301, isY ? b.sign > 0 ? 30 : 199 : 108);
        continue;
      }
      drawRainInkBand(ctx2, b, quiet);
      drawRainGapHint(ctx2, b);
    }
    if (s.cat && s.phase !== "won") {
      const cat = s.cat, p = rainCatPosition(cat), warning = cat.age < cat.warning;
      const active = cat.age < cat.warning + rainCatDuration(cat);
      const horizontal = cat.fromX !== cat.toX;
      const facing = horizontal ? Math.sign(cat.toX - cat.fromX) : cat.fromX < 160 ? 1 : -1;
      entities.push({ depth: p.y + 6, paint: () => {
        if (!warning && active && !quiet) {
          const sign = horizontal ? Math.sign(cat.toX - cat.fromX) : Math.sign(cat.toY - cat.fromY);
          for (let i = 1; i <= 3; i++) rect(p.x - (horizontal ? sign * i * 7 : 0), p.y - (horizontal ? 0 : sign * i * 7), 3, 1, "#b6ad94");
        }
        const puzzled = !active && Math.hypot(s.x - p.x, s.y - p.y) > 16;
        drawRainCat(ctx2, p.x, p.y + 6, facing, warning ? "crouch" : active ? "pounce" : puzzled && !quiet ? "look" : "groom", quiet ? 0 : s.total);
        if (puzzled && !quiet) {
          ctx2.fillStyle = "#6f7462";
          ctx2.font = "8px monospace";
          ctx2.fillText("\u54A6\uFF1F", Math.max(25, Math.min(273, p.x - 7)), Math.max(44, p.y - 19));
        }
        if (active && !warning) rect(p.x - 3, p.y - 2, 6, 4, "#a88961");
      } });
    }
    if (s.collected && s.rainTime < 0.65 && !quiet) {
      const t = Math.min(1, s.rainTime / 0.4);
      const px = light.x + (s.x - light.x) * t, py = light.y + (s.y - 18 - light.y) * t;
      rect(px - 4, py - 3, 8, 6, "#efe3c4");
      ctx2.fillStyle = "#6e795e";
      ctx2.font = "9px monospace";
      ctx2.fillText(s.story ? "\u62FE\u8D77\u5170\u7A3F" : `\u62FE\u8D77${RAIN_DRAWING_NAMES[s.round]}`, Math.max(25, Math.min(246, s.x - 20)), Math.max(43, s.y - 25 - s.rainTime * 8));
    }
    entities.push({ depth: s.y + 6, paint: () => {
      if (!(s.phase === "running" && s.invulnerable > 0 && Math.floor(s.total * 14) % 2)) {
        rect(s.x - 6, s.y + 5, 12, 2, "#899783");
        if (scholar?.complete && scholar.naturalWidth) {
          ctx2.save();
          ctx2.shadowBlur = 0;
          ctx2.shadowColor = "#344d42";
          for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
            ctx2.shadowOffsetX = dx;
            ctx2.shadowOffsetY = dy;
            drawScholarAtFoot(ctx2, scholar, s.direction, s.moving ? 1 + Math.floor(s.total * 7) % 2 : 0, s.x, s.y + 6, 22);
          }
          ctx2.restore();
          drawScholarAtFoot(ctx2, scholar, s.direction, s.moving ? 1 + Math.floor(s.total * 7) % 2 : 0, s.x, s.y + 6, 22);
        } else {
          rect(s.x - 3, s.y - 10, 6, 4, "#40564d");
          rect(s.x - 2, s.y - 6, 4, 3, "#d8c3a2");
          rect(s.x - 5, s.y - 3, 10, 9, "#4e7167");
        }
        if (s.collected) {
          rect(s.x + 4, s.y - 7, 5, 7, "#ebdfc2");
          rect(s.x + 4, s.y - 5, 3, 1, "#7d8771");
          rect(s.x + 4, s.y - 7, 5, 1, "#fbefce");
          rect(s.x + 8, s.y - 6, 1, 6, "#b5a47e");
          rect(s.x + 5, s.y - 1, 3, 1, "#c4b390");
        }
        rect(s.x - 3, s.y - 3, 6, 6, "#344d42");
        rect(s.x - 2, s.y - 2, 4, 4, "#f4ecce");
        const ux = s.x + (s.shield > 0 ? 0 : 8), uy = s.y - 22;
        for (let dy = 0; dy < 5; dy++) {
          const w = [3, 6, 9, 11, 10][dy];
          rect(ux - w, uy + dy, w * 2 + 1, 1, dy === 4 ? "#69765c" : "#e3d6ad");
          rect(ux, uy + dy, 1, 1, "#a89a76");
        }
        rect(ux, uy + 5, 1, 10, "#74684c");
      }
      if (s.shield > 0) {
        for (const dx of [-11, 9]) {
          rect(s.x + dx, s.y - 12, 2, 4, "#b39864");
          rect(s.x + dx, s.y + 7, 2, 3, "#b39864");
        }
      }
      if (s.collected && s.hits > 0 && s.invulnerable > Math.max(0, rainHitGrace(s) - 0.4)) {
        const age = rainHitGrace(s) - s.invulnerable;
        if (!quiet) for (const sign of [-1, 1]) {
          rect(s.x + sign * (7 + age * 22), s.y - 6 - age * 10, 2, 2, "#779197");
          rect(s.x + sign * (11 + age * 16), s.y + 2 + age * 6, 1, 2, "#96a7a4");
        }
        ctx2.fillStyle = "#875d59";
        ctx2.font = "8px monospace";
        ctx2.fillText(s.lastHit === "cat" ? "\u732B\u6251 HP \u22121" : "\u96E8\u6DCB HP \u22121", Math.max(25, Math.min(245, s.x - 24)), Math.max(42, s.y - 23));
      }
    } });
    if (artReady && foreground?.complete && foreground.naturalWidth && foreground.naturalHeight) {
      entities.push({ depth: RAIN_BAMBOO_DEPTH, paint: () => {
        ctx2.save();
        ctx2.globalAlpha = 0.55;
        ctx2.drawImage(foreground, 0, 0, 320, 208);
        ctx2.restore();
        ctx2.globalAlpha = 1;
      } });
    }
    entities.sort((a, b) => a.depth - b.depth).forEach((entity) => entity.paint());
    rect(18, 188, 286, 19, "#e9e6da");
    for (let i = 0; i < rainHealthCapacity(s); i++) {
      const x = 24 + i * 12, color = i < s.health ? "#9a6c65" : "#c4c4b6";
      rect(x, 196, 3, 2, color);
      rect(x + 5, 196, 3, 2, color);
      rect(x, 198, 8, 2, color);
      rect(x + 1, 200, 6, 1, color);
      rect(x + 2, 201, 4, 1, color);
      rect(x + 3, 202, 2, 1, color);
    }
    ctx2.fillStyle = "#52675c";
    ctx2.font = "8px monospace";
    ctx2.fillText(`HP ${s.health}/${rainHealthCapacity(s)}`, 24, 194);
    ctx2.fillText(`${s.collected ? "\u907F\u96E8" : "\u6361\u753B"} ${rainSecondsLeft(s)} \u79D2`, 132, 194);
    ctx2.fillText(s.cooldown > 0 ? "\u62A4\u753B\u56DE\u6C14" : "\u62A4\u753B\u53EF\u7528", 232, 194);
    const remaining = s.collected ? 1 - s.rainTime / rainDuration(s) : 1 - s.time / rainPickupSeconds(s);
    rect(132, 197, 76, 3, "#bbc2b3");
    rect(132, 197, Math.round(76 * Math.max(0, remaining)), 3, "#788b79");
    if (s.story) for (const part of STORY_RAIN_STAGES.slice(1)) rect(132 + 76 * part.start / rainDuration(s), 197, 1, 3, "#e6e3d5");
    rect(232, 197, 64, 3, "#bbc2b3");
    rect(232, 197, Math.round(64 * (1 - s.cooldown / 2)), 3, "#aa9164");
    if (s.phase !== "running" && !(artReady && (s.phase === "ready" || s.phase === "paused"))) {
      const y = s.phase === "ready" ? 47 : s.phase === "paused" ? 25 : 81;
      rect(76, y, 168, 28, "#eee8d9");
      rect(76, y, 168, 1, "#a7b49f");
      ctx2.fillStyle = "#465a50";
      ctx2.font = "11px monospace";
      ctx2.fillText({ ready: "\u732B\u62E8\u753B \xB7 \u62FE\u753B\u907F\u96E8", paused: "\u7A0D\u6B47 \xB7 \u65F6\u95F4\u5DF2\u505C", won: s.story ? "\u5170\u7A3F\u5DF2\u62A2\u56DE\u6A90\u4E0B" : "\u516D\u9875\u753B\u7A3F\u90FD\u62FE\u56DE\u4E86", lost: "\u518D\u8BD5\u4E00\u56DE" }[s.phase], 91, y + 18);
      if (s.phase === "won") {
        rect(151, 117, 18, 18, "#ae7d66");
        rect(153, 119, 14, 14, "#ede2ca");
        ctx2.fillStyle = "#97664f";
        ctx2.font = "9px monospace";
        ctx2.fillText("\u597D", 155, 129);
        ctx2.fillStyle = "#5a6d5d";
        ctx2.font = "9px monospace";
        ctx2.fillText("\u732B\uFF1A\u4E0D\u662F\u6211\u3002", 119, 153);
      }
    }
  }

  // src/render/rain-shadow-viewport.ts
  var RAIN_VIEWPORT = { width: 1280, height: 720, scale: 3, left: 160, top: 48 };
  function rainDragDelta(dx, dy, width, height) {
    if (width <= 0 || height <= 0) return { x: 0, y: 0 };
    return {
      x: dx * RAIN_VIEWPORT.width / (width * RAIN_VIEWPORT.scale),
      y: dy * RAIN_VIEWPORT.height / (height * RAIN_VIEWPORT.scale)
    };
  }
  function drawRainViewport(ctx2, s, scholar, quiet = false, background, foreground) {
    ctx2.setTransform(1, 0, 0, 1, 0, 0);
    ctx2.globalAlpha = 1;
    ctx2.fillStyle = "#f0eee3";
    ctx2.fillRect(0, 0, RAIN_VIEWPORT.width, RAIN_VIEWPORT.height);
    ctx2.save();
    ctx2.translate(RAIN_VIEWPORT.left, RAIN_VIEWPORT.top);
    ctx2.scale(RAIN_VIEWPORT.scale, RAIN_VIEWPORT.scale);
    drawRainShadow(ctx2, s, scholar, quiet, background, foreground);
    ctx2.restore();
  }

  // src/audio/rain-shadow-audio.ts
  function rainAudioFrame(s) {
    return {
      phase: s.phase,
      marks: s.marks,
      hits: s.hits,
      lastHit: s.lastHit,
      band: s.nextBand,
      cat: s.nextCat,
      catPhase: !s.cat ? "none" : s.cat.age < s.cat.warning ? "aim" : s.cat.age < s.cat.warning + rainCatDuration(s.cat) ? "leap" : "land",
      guard: s.shield > 0
    };
  }
  function rainAudioEvents(before, after) {
    if (before.phase !== "running") return [];
    if (after.phase === "lost") return ["lose"];
    if (after.phase === "won") return ["win"];
    if (after.phase !== "running") return [];
    if (after.hits > before.hits) return [after.lastHit === "cat" ? "hit-cat" : "hit-rain"];
    const cues = [];
    if (after.marks > before.marks) cues.push("pickup");
    if (after.cat > before.cat && after.catPhase === "aim") cues.push("cat-ready");
    if (after.cat === before.cat && before.catPhase === "aim" && after.catPhase === "leap") cues.push("cat-leap");
    if (after.cat === before.cat && before.catPhase === "leap" && after.catPhase === "land") cues.push("cat-land");
    if (after.guard && !before.guard) cues.push("guard");
    if (after.band > before.band && !cues.length) cues.push("rain");
    return cues;
  }
  var NOTES = {
    pickup: [[0, 660, 760, 0.09, "sine"], [0.08, 880, 880, 0.13, "sine"]],
    rain: [[0, 420, 230, 0.08, "sine"]],
    "cat-ready": [[0, 540, 690, 0.09, "sine"], [0.085, 690, 480, 0.1, "sine"]],
    "cat-leap": [[0, 170, 100, 0.1, "triangle"]],
    "cat-land": [[0, 440, 380, 0.08, "sine"]],
    "hit-rain": [[0, 280, 160, 0.13, "triangle"]],
    "hit-cat": [[0, 155, 110, 0.15, "triangle"]],
    guard: [[0, 350, 510, 0.1, "sine"]],
    win: [[0, 440, 440, 0.14, "sine"], [0.12, 550, 550, 0.14, "sine"], [0.24, 660, 660, 0.18, "sine"]],
    lose: [[0, 240, 180, 0.2, "sine"]]
  };
  function createRainAudio(factory = () => {
    const Ctor = window.AudioContext ?? window.webkitAudioContext;
    return Ctor ? new Ctor() : void 0;
  }) {
    let ctx2, enabled = false, generation = 0;
    const voices = /* @__PURE__ */ new Set();
    function stopVoices() {
      for (const voice of [...voices]) {
        try {
          voice.osc.stop();
        } catch {
        }
        voice.release();
      }
    }
    function pause() {
      generation++;
      enabled = false;
      stopVoices();
      try {
        void ctx2?.suspend().catch(() => {
        });
      } catch {
      }
    }
    async function enable(on) {
      if (!on) {
        pause();
        return false;
      }
      const request = ++generation;
      enabled = true;
      try {
        ctx2 ??= factory();
        if (!ctx2) {
          enabled = false;
          return false;
        }
        await ctx2.resume();
        if (request !== generation) {
          if (!enabled) {
            try {
              await ctx2.suspend();
            } catch {
            }
          }
          return false;
        }
        enabled = ctx2.state === "running";
        return enabled;
      } catch {
        if (request === generation) {
          enabled = false;
          stopVoices();
        }
        return false;
      }
    }
    function play(cue) {
      if (!enabled || !ctx2 || ctx2.state !== "running") return;
      try {
        const now = ctx2.currentTime;
        for (const [delay, start, end, duration, type] of NOTES[cue]) {
          if (voices.size >= 10) {
            const first = voices.values().next().value;
            try {
              first.osc.stop();
            } catch {
            }
            first.release();
          }
          const osc = ctx2.createOscillator(), gain = ctx2.createGain();
          const t = now + delay;
          osc.type = type;
          osc.frequency.setValueAtTime(start, t);
          osc.frequency.linearRampToValueAtTime(end, t + duration);
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(cue === "rain" ? 9e-3 : 0.025, t + 0.01);
          gain.gain.exponentialRampToValueAtTime(1e-4, t + duration);
          osc.connect(gain);
          gain.connect(ctx2.destination);
          const voice = { osc, gain, release: () => {
            osc.disconnect();
            gain.disconnect();
            voices.delete(voice);
          } };
          voices.add(voice);
          osc.onended = voice.release;
          osc.start(t);
          osc.stop(t + duration + 0.025);
        }
      } catch {
        pause();
      }
    }
    return { enable, play, pause };
  }

  // src/ui/liuyuan-rain-shadow.ts
  function createRainShadowUI(onWin, onLeave, story = false) {
    const node = (id) => document.getElementById(id);
    const arena = node("rainArena");
    arena.width = RAIN_VIEWPORT.width;
    arena.height = RAIN_VIEWPORT.height;
    const ctx2 = arena.getContext("2d");
    const album = node("rainAlbum");
    const albumCtx = album.getContext("2d");
    const quiet = node("rainQuiet");
    const sound = node("rainSound"), soundStatus = node("rainSoundStatus");
    const audio = createRainAudio();
    let soundRevision = 0;
    quiet.checked = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    const scholar = new Image();
    scholar.src = "../assets/characters/scholar-player-sprites-v1.png";
    const artParams = new URLSearchParams(location.search);
    const backdrop = artParams.get("playtest") === "1" ? new Image() : void 0;
    const foreground = backdrop ? new Image() : void 0;
    if (foreground) foreground.src = "../research-art/rain-bamboo-foreground-v1.png";
    const artStatus = node("rainArtStatus");
    artStatus.hidden = !backdrop;
    if (backdrop) {
      backdrop.src = "../research-art/rain-bamboo-open-blank-v4.png";
      artStatus.textContent = "\u753B\u5883\u7F8E\u672F\u8BD5\u4F5C\uFF1A\u501F\u58A8\u7AF9\u98CE\u96E8\u7684\u7B14\u610F\uFF0C\u4E0D\u662F\u7559\u56ED\u5B9E\u666F\u590D\u539F\u3002\u96E8\u4E1D\u4E4B\u95F4\u7684\u5C0F\u7A7A\u767D\u4E0D\u6321\u96E8\uFF0C\u7EB8\u4F1E\u4E0E\u4E24\u4FA7\u77ED\u53F6\u63D0\u793A\u53EF\u907F\u96E8\u4F4D\u7F6E\u3002";
      backdrop.addEventListener("error", () => {
        artStatus.textContent = "\u80CC\u666F\u5019\u9009\u6682\u672A\u8F7D\u5165\uFF0C\u4F7F\u7528\u7B80\u5316\u753B\u9762\uFF1B\u8D70\u4F4D\u4E0E\u96E8\u7F1D\u63D0\u793A\u4E0D\u53D7\u5F71\u54CD\u3002";
      });
    }
    const action = node("rainAction");
    const pause = node("rainPause");
    const gentle = node("rainGentle");
    const feedback = node("lanternFeedback");
    const hud = node("rainHud");
    const keys2 = /* @__PURE__ */ new Set();
    const touches = /* @__PURE__ */ new Map();
    let s = createRainShadow();
    let open = false;
    let pointer = null;
    let target;
    let previousStatus = "";
    const clear = () => {
      keys2.clear();
      touches.clear();
      pointer = null;
      target = void 0;
    };
    const silence = () => {
      soundRevision++;
      audio.pause();
    };
    async function unlockSound() {
      const revision = ++soundRevision, requested = sound.checked;
      const ok = await audio.enable(requested);
      if (revision !== soundRevision) return;
      soundStatus.hidden = ok || !requested;
      if (!ok && requested) {
        sound.checked = false;
        soundStatus.textContent = "\u6B64\u6D4F\u89C8\u5668\u6682\u672A\u5F00\u542F\u58F0\u97F3\uFF1B\u8D70\u4F4D\u4E0E\u63D0\u793A\u4E0D\u53D7\u5F71\u54CD\u3002";
      }
    }
    function render() {
      drawRainViewport(ctx2, s, scholar, quiet.checked, backdrop, foreground);
      drawRainAlbum(albumCtx, s, quiet.checked);
      album.hidden = s.phase !== "won";
      const stage = rainStoryStage(s);
      hud.textContent = `${s.story ? "\u96E8\u4E2D\u62A2\u753B" : RAIN_ROUND_NAMES[s.round]} \xB7 ${s.collected ? s.story ? `${stage + 1}/3 ${STORY_RAIN_STAGES[stage].name}` : "\u62A4\u753B\u907F\u96E8" : "\u5148\u6361\u753B\u7A3F"} ${rainSecondsLeft(s)} \u79D2 \xB7 HP ${s.health}/${rainHealthCapacity(s)} \xB7 \u62FE\u56DE ${s.marks}/${rainRoundCount(s)} \xB7 ${s.cooldown > 0 ? "\u6491\u4F1E\u56DE\u6C14\u4E2D" : "\u6491\u7A33\u4F1E\u53EF\u7528"}`;
      action.textContent = s.phase === "ready" ? s.story ? "\u62A2\u56DE\u753B\u7A3F" : s.round === 0 ? "\u5F00\u59CB\u7A7F\u5ECA" : "\u5F00\u59CB\u8FD9\u4E00\u6298" : s.phase === "paused" ? s.story ? "\u7EE7\u7EED\u62A2\u753B" : "\u7EE7\u7EED\u8FD9\u4E00\u6298" : s.phase === "lost" ? "\u518D\u8BD5\u4E00\u56DE" : s.phase === "won" ? "\u6536\u597D\u753B\u7A3F" : s.story ? "\u6B63\u5728\u62A4\u753B" : "\u6B63\u5728\u7A7F\u5ECA";
      action.disabled = s.phase === "running";
      pause.hidden = s.phase !== "running";
      gentle.disabled = s.phase !== "ready" && s.phase !== "lost";
      const catStatus = s.cat ? s.cat.age < s.cat.warning ? "aim" : "leap" : "";
      const status2 = `${s.phase}:${s.round}:${s.health}:${s.marks}:${s.invulnerable > 0}:${stage}:${catStatus}:${s.nextCat}`;
      if (status2 !== previousStatus) {
        previousStatus = status2;
        const progress = rainAlbumState(s);
        album.setAttribute("aria-label", s.story ? `\u5170\u7A3F\uFF1A${progress.complete ? "\u5DF2\u62A4\u597D\uFF0C\u5F85\u786E\u8BA4\u6536\u597D" : progress.held !== null ? "\u5728\u624B\u4E2D\uFF0C\u6B63\u5728\u907F\u96E8" : "\u5F85\u62FE\u8D77"}` : `\u753B\u7A3F\u518C\uFF1A\u5DF2\u62A4\u597D ${progress.complete}/${rainRoundCount(s)} \u9875${progress.held !== null ? `\uFF0C${RAIN_DRAWING_NAMES[progress.held]}\u5728\u624B\u4E2D` : ""}`);
        feedback.textContent = s.phase === "ready" ? `${s.story ? "\u6301\u4F1E\u53BB\u6551\u753B\uFF1B\u659C\u96E8\u4F1A\u4ECE\u4F1E\u4FA7\u6253\u6765\uFF0CX\u6491\u7A33\u4F1E\u77ED\u65F6\u62A4\u753B\u30023 HP\uFF1A\u6DCB\u96E8\u6216\u88AB\u732B\u6251\u4E2D\uFF0C\u90FD\u6263 1 HP\u3002" : ""}\u5148\u62FE\u753B\uFF0C\u518D\u907F\u96E8\uFF1B\u4EAE\u5904\u4E0D\u6321\u96E8\u3002${s.story ? "\u732B\u4F0F\u8EAB\u65F6\u9501\u5B9A\u6251\u5411\uFF0C\u4FA7\u79FB\u8BA9\u5F00\uFF1B\u4F1E\u6321\u96E8\u4E0D\u6321\u732B\u3002" : "\u732B\u628A\u7EC3\u4E60\u753B\u7A3F\u62E8\u843D\u4E86\u3002"}` : s.phase === "paused" ? "\u65F6\u95F4\u5DF2\u505C\u3002\u51C6\u5907\u597D\u518D\u7EE7\u7EED\uFF0C\u4E0D\u4F1A\u5728\u5207\u6362\u9875\u9762\u65F6\u6DCB\u6E7F\u753B\u7A3F\u3002" : s.phase === "won" || s.phase === "lost" ? s.result : `${s.collected ? `\u753B\u7A3F\u5DF2\u62FE\u8D77\u3002${catStatus === "aim" ? "\u732B\u4F0F\u8EAB\u4E86\uFF01\u5730\u9762\u732B\u5F71\u9884\u793A\u6251\u5411\uFF0C\u4FA7\u79FB\u8BA9\u5F00\uFF0C\u4E0D\u4F1A\u8FFD\u7740\u8F6C\u5F2F\u3002" : s.story ? STORY_RAIN_STAGES[stage].tip : RAIN_ROUND_TIPS[s.round]}` : `${s.story ? "\u5170\u7A3F\u88AB\u732B\u62E8\u843D\u4E86\u3002" : "\u732B\u53C8\u62E8\u843D\u4E00\u9875\u3002"}\u8D70\u5230\u6807\u7740\u201C\u6361\u753B\u201D\u7684\u91D1\u8272\u4F4D\u7F6E\uFF1B\u8FD9\u65F6\u8FD8\u6CA1\u6709\u96E8\u3002`}${s.hits > 0 && s.invulnerable > 0 ? s.lastHit === "cat" ? " \u732B\u6251\u4E2D\uFF01HP \u22121\uFF0C\u77ED\u6682\u53D7\u51FB\u4FDD\u62A4\u3002" : " \u6DCB\u96E8\uFF01HP \u22121\uFF0C\u77ED\u6682\u53D7\u51FB\u4FDD\u62A4\u3002" : ""}`;
      }
    }
    function activate() {
      if (!open) return;
      if (s.phase === "won") {
        open = false;
        clear();
        silence();
        onWin(s);
        return;
      }
      if (s.phase === "lost") s = retryRainShadow(s, gentle.checked);
      if (s.phase === "paused") s.phase = "running";
      else startRainShadow(s);
      if (sound.checked) void unlockSound();
      clear();
      render();
    }
    action.addEventListener("click", activate);
    quiet.addEventListener("change", render);
    sound.addEventListener("change", () => {
      void unlockSound();
    });
    pause.addEventListener("click", () => {
      pauseRainShadow(s);
      clear();
      silence();
      render();
    });
    gentle.addEventListener("change", () => {
      if (s.phase === "ready" || s.phase === "lost") {
        s = retryRainShadow(s, gentle.checked);
        render();
      }
    });
    node("lanternLeave").addEventListener("click", () => {
      if (open) {
        open = false;
        clear();
        silence();
        onLeave(s);
      }
    });
    function bindHold(button, direction2) {
      button.addEventListener("pointerdown", (e) => {
        if (!open || s.phase !== "running") return;
        e.preventDefault();
        button.setPointerCapture(e.pointerId);
        const held = touches.get(direction2) ?? /* @__PURE__ */ new Set();
        held.add(e.pointerId);
        touches.set(direction2, held);
      });
      for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) button.addEventListener(type, (e) => {
        const held = touches.get(direction2);
        held?.delete(e.pointerId);
        if (!held?.size) touches.delete(direction2);
      });
    }
    bindHold(node("rainGuard"), "guard");
    node("rainGuard").addEventListener("click", () => {
      if (open) {
        const held = s.shield > 0;
        guardRainShadow(s);
        if (!held && s.shield > 0) audio.play("guard");
        render();
      }
    });
    for (const b of document.querySelectorAll("[data-rain-dir]")) {
      bindHold(b, b.dataset.rainDir);
    }
    arena.addEventListener("pointerdown", (e) => {
      if (!open || s.phase !== "running" || pointer) return;
      e.preventDefault();
      arena.setPointerCapture(e.pointerId);
      pointer = { id: e.pointerId, x: e.clientX, y: e.clientY, playerX: s.x, playerY: s.y };
    });
    arena.addEventListener("pointermove", (e) => {
      if (!pointer || pointer.id !== e.pointerId) return;
      const r = arena.getBoundingClientRect();
      const delta = rainDragDelta(e.clientX - pointer.x, e.clientY - pointer.y, r.width, r.height);
      target = { x: pointer.playerX + delta.x, y: pointer.playerY + delta.y };
    });
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) arena.addEventListener(type, (e) => {
      if (pointer?.id !== e.pointerId) return;
      pointer = null;
      target = void 0;
    });
    window.addEventListener("blur", () => {
      if (open) {
        pauseRainShadow(s);
        clear();
        silence();
        render();
      }
    });
    document.addEventListener?.("visibilitychange", () => {
      if (open && document.hidden) {
        pauseRainShadow(s);
        clear();
        silence();
        render();
      }
    });
    window.addEventListener("pagehide", silence);
    const direction = { arrowup: "up", w: "up", arrowdown: "down", s: "down", arrowleft: "left", a: "left", arrowright: "right", d: "right", " ": "guard", x: "guard" };
    return {
      show() {
        silence();
        open = true;
        s = createRainShadow(gentle.checked, story);
        previousStatus = "";
        clear();
        render();
        action.focus?.();
      },
      close() {
        open = false;
        clear();
        silence();
      },
      keyDown(key, repeat) {
        if (!open) return;
        if (key === "Enter" && !repeat) activate();
        else if ((key === "Escape" || key.toLowerCase() === "p") && !repeat) {
          if (s.phase === "paused") activate();
          else {
            pauseRainShadow(s);
            clear();
            silence();
            render();
          }
        } else if (s.phase === "running" && direction[key.toLowerCase()]) keys2.add(key.toLowerCase());
      },
      keyUp(key) {
        keys2.delete(key.toLowerCase());
      },
      tick(dt) {
        if (!open) return;
        const active = (d) => [...keys2].some((key) => direction[key] === d) || touches.has(d);
        const before = rainAudioFrame(s);
        updateRainShadow(s, dt, {
          x: Number(active("right")) - Number(active("left")),
          y: Number(active("down")) - Number(active("up")),
          guard: active("guard"),
          target
        });
        for (const cue of rainAudioEvents(before, rainAudioFrame(s))) audio.play(cue);
        render();
      }
    };
  }

  // src/render/liuyuan-drawing-incident.ts
  function drawDrawingIncident(ctx2, x, y, seconds) {
    const rect = (dx, dy, w, h, color) => {
      ctx2.fillStyle = color;
      ctx2.fillRect(Math.round(x + dx), Math.round(y + dy), w, h);
    };
    const paw = Math.floor(seconds * 2) % 6 >= 4 ? 4 : 0;
    rect(-16, -1, 48, 3, "#949b8a");
    rect(10, -12, 24, 16, "#e9dec1");
    rect(10, -12, 2, 16, "#aa9065");
    rect(32, -12, 2, 16, "#aa9065");
    rect(20, -8, 2, 9, "#64745d");
    rect(16, -6, 4, 2, "#64745d");
    rect(22, -3, 6, 2, "#64745d");
    rect(-13, -17, 21, 13, "#b8ae97");
    rect(-11, -5, 4, 5, "#777d70");
    rect(3 + paw, -6, 7, 3, "#a69c86");
    rect(-1, -24, 13, 11, "#d2c5a9");
    rect(-1, -28, 3, 5, "#777d70");
    rect(9, -28, 3, 5, "#777d70");
    rect(6, -20, 2, 2, "#405448");
    rect(11, -16, 3, 2, "#8a7967");
    rect(-19, -20, 4, 17, "#898878");
    rect(-16, -6, 5, 3, "#898878");
  }

  // src/core/liuyuan-modern-route.ts
  function modernRouteHref(page, from, draft2 = false, returning = false) {
    const query = new URLSearchParams({ route: "modern", from });
    if (draft2) query.set("draft", "1");
    if (returning) query.set("return", "1");
    carryLiuyuanPlaytest(query);
    return `${page}?${query}`;
  }
  function canEnterModernReturn(search, progress, from, prerequisite) {
    const query = new URLSearchParams(search);
    return query.get("return") === "1" && canEnterModernRoute(search, progress, from, prerequisite);
  }
  function canEnterModernRoute(search, progress, from, prerequisite) {
    const query = new URLSearchParams(search);
    return query.get("route") === "modern" && query.get("from") === from && hasStoryFlag(progress, prerequisite);
  }

  // src/data/liuyuan-flower-study.ts
  var LIUYUAN_FLOWER_ID = "liuyuan-flower-work-yard-study-v3";
  var LIUYUAN_FLOWER_W = 111;
  var LIUYUAN_FLOWER_H = 56;
  var LIUYUAN_FLOWER_WORLD_W = LIUYUAN_FLOWER_W * 16;
  var LIUYUAN_FLOWER_WORLD_H = LIUYUAN_FLOWER_H * 16;
  var LIUYUAN_FLOWER_SPAWN = { x: 820, y: 500 };
  var LIUYUAN_FLOWER_WORKER = { x: 565, y: 450 };
  var LIUYUAN_FLOWER_WORKER_STAND = { x: 650, y: 485 };
  var LIUYUAN_FLOWER_BUCKET = { x: 480, y: 445 };
  var LIUYUAN_FLOWER_EAST_EXIT = { x: 1675, y: 445 };
  var LIUYUAN_FLOWER_REQUIRED_FEET = [
    { id: "\u9662\u53E3", ...LIUYUAN_FLOWER_SPAWN, radius: 16, mustStand: true },
    { id: "\u6A90\u4E0B\u7CA5\u6876", ...LIUYUAN_FLOWER_BUCKET, radius: 90 },
    { id: "\u82B1\u5320\u65C1", ...LIUYUAN_FLOWER_WORKER_STAND, radius: 55 },
    { id: "\u4E1C\u4FA7\u8F6C\u573A", ...LIUYUAN_FLOWER_EAST_EXIT, radius: 80, mustStand: true }
  ];
  var YARD_FLOOR = [
    [350, 348],
    [1570, 348],
    [1640, 390],
    [1640, 585],
    [1580, 685],
    [1540, 852],
    [790, 896],
    [695, 824],
    [595, 685],
    [350, 525]
  ];
  var EAST_PASSAGE = [
    [1570, 350],
    [1776, 340],
    [1776, 565],
    [1600, 565]
  ];
  function insidePolygon(x, y, points) {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [xi, yi] = points[i], [xj, yj] = points[j];
      if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function bands(id, points, tile) {
    const result = [];
    for (let y = 0; y < LIUYUAN_FLOWER_H; y++) {
      let start = -1;
      for (let x = 0; x <= LIUYUAN_FLOWER_W; x++) {
        const open = x < LIUYUAN_FLOWER_W && insidePolygon(x * 16 + 8, y * 16 + 8, points);
        if (open && start < 0) start = x;
        if (!open && start >= 0) {
          result.push({ id: `${id}-${y}-${start}`, x: start, y, w: x - start, h: 1, tile });
          start = -1;
        }
      }
    }
    return result;
  }
  var LIUYUAN_FLOWER_DRAFT_REGIONS = [
    ...bands("flower-yard-floor", YARD_FLOOR, T.PATH),
    ...bands("flower-east-passage", EAST_PASSAGE, T.CORR)
  ];
  var LIUYUAN_FLOWER_GEOMETRY = [
    { id: "flower-work-table", colliders: [{ x: 110, y: 260, w: 275, h: 185 }] },
    { id: "flower-rear-potting-bed", colliders: [{ x: 610, y: 235, w: 960, h: 110 }] },
    { id: "flower-worker-foot", colliders: [{ x: 522, y: 427, w: 84, h: 32 }] },
    {
      id: "flower-front-left-eave",
      occluder: {
        id: "flower-front-left-eave",
        depthY: 875,
        polygons: [[[0, 575], [300, 565], [605, 760], [760, 896], [0, 896]]]
      }
    },
    {
      id: "flower-front-right-eave",
      occluder: {
        id: "flower-front-right-eave",
        depthY: 830,
        polygons: [[[1590, 630], [1776, 615], [1776, 896], [1660, 896]]]
      }
    }
  ];
  var LIUYUAN_FLOWER_OBSTACLES = LIUYUAN_FLOWER_GEOMETRY.flatMap((object) => object.colliders ?? []);
  function buildLiuyuanFlowerStudyMap(regions = LIUYUAN_FLOWER_DRAFT_REGIONS) {
    const map = new Uint8Array(LIUYUAN_FLOWER_W * LIUYUAN_FLOWER_H);
    map.fill(T.WALL);
    for (const region of regions) for (let y = region.y; y < region.y + region.h; y++) {
      for (let x = region.x; x < region.x + region.w; x++) {
        if (x >= 0 && y >= 0 && x < LIUYUAN_FLOWER_W && y < LIUYUAN_FLOWER_H) {
          map[y * LIUYUAN_FLOWER_W + x] = region.tile;
        }
      }
    }
    return {
      map,
      w: LIUYUAN_FLOWER_W,
      h: LIUYUAN_FLOWER_H,
      spawn: { ...LIUYUAN_FLOWER_SPAWN },
      obstacles: LIUYUAN_FLOWER_OBSTACLES
    };
  }

  // src/data/liuyuan-character-scale.ts
  var LIUYUAN_CHARACTER_SCALE = {
    entry: { farFootY: 250, nearFootY: 656, farHeight: 60, nearHeight: 63, cameraZoom: 2 },
    court: { worldHeight: 84, cameraZoom: 1.5 },
    lvyin: { worldHeight: 84, cameraZoom: 1.5 },
    flower: { worldHeight: 84, cameraZoom: 1.5, kneelingFloristHeight: 72 },
    eastHall: { worldHeight: 84, cameraZoom: 1.5 },
    stoneForest: { worldHeight: 84, cameraZoom: 1.5 },
    studyCourt: { worldHeight: 120, cameraZoom: 0.9 },
    studyInterior: { worldHeight: 180, cameraZoom: 0.75 }
  };
  var CHAPTER_SCENE_SCALE = {
    "liuyuan-tree-court-no-water-study-v1": LIUYUAN_CHARACTER_SCALE.court,
    "liuyuan-lvyin-pond-study-v1": LIUYUAN_CHARACTER_SCALE.lvyin,
    "liuyuan-flower-work-yard-study-v3": LIUYUAN_CHARACTER_SCALE.flower,
    "liuyuan-east-hall-magnolia-court-study-v1": LIUYUAN_CHARACTER_SCALE.eastHall,
    "liuyuan-stone-forest-court-study-v1": LIUYUAN_CHARACTER_SCALE.stoneForest,
    "liuyuan-study-court-research-v1": LIUYUAN_CHARACTER_SCALE.studyCourt,
    "liuyuan-study-interior-research-v1": LIUYUAN_CHARACTER_SCALE.studyInterior
  };
  var CHAPTER_SCENE_ZOOM = {
    "liuyuan-entrance-topology-study": LIUYUAN_CHARACTER_SCALE.entry.cameraZoom,
    "liuyuan-tree-court-no-water-study-v1": LIUYUAN_CHARACTER_SCALE.court.cameraZoom,
    "liuyuan-lvyin-pond-study-v1": LIUYUAN_CHARACTER_SCALE.lvyin.cameraZoom,
    "liuyuan-flower-work-yard-study-v3": LIUYUAN_CHARACTER_SCALE.flower.cameraZoom,
    "liuyuan-east-hall-magnolia-court-study-v1": LIUYUAN_CHARACTER_SCALE.eastHall.cameraZoom,
    "liuyuan-stone-forest-court-study-v1": LIUYUAN_CHARACTER_SCALE.stoneForest.cameraZoom,
    "liuyuan-study-court-research-v1": LIUYUAN_CHARACTER_SCALE.studyCourt.cameraZoom,
    "liuyuan-study-interior-research-v1": LIUYUAN_CHARACTER_SCALE.studyInterior.cameraZoom
  };

  // src/render/liuyuan-bucket.ts
  function carryingLiuyuanPorridge(progress) {
    return hasStoryFlag(progress, "ly-errand-offered") && !hasStoryFlag(progress, "ly-porridge-delivered");
  }
  function liuyuanBucketAnchor(footX, footY, actorHeight2, direction, carried) {
    const side = direction === 2 ? -1 : 1;
    return {
      x: footX + (carried ? side * actorHeight2 * 0.27 : 0),
      y: footY - (carried ? actorHeight2 * 0.16 : 0)
    };
  }
  function drawLiuyuanPorridgeBucket(ctx2, footX, footY, actorHeight2, direction, carried, grounded = !carried) {
    const h = Math.max(9, Math.round(actorHeight2 * 0.23));
    const w = Math.max(8, Math.round(h * 0.78));
    const anchor = liuyuanBucketAnchor(footX, footY, actorHeight2, direction, carried);
    const x = Math.round(anchor.x - w / 2);
    const bottom = Math.round(anchor.y);
    const y = bottom - h;
    if (grounded) {
      ctx2.fillStyle = "rgba(23, 31, 24, .2)";
      ctx2.fillRect(x - 2, bottom - 1, w + 4, 3);
    }
    ctx2.fillStyle = "#3c3830";
    ctx2.fillRect(x - 1, y + 2, w + 2, h - 1);
    ctx2.fillStyle = "#78634b";
    ctx2.fillRect(x + 1, y + 3, w - 2, h - 4);
    ctx2.fillStyle = "#a58a65";
    ctx2.fillRect(x + 2, y + 4, Math.max(1, Math.floor(w / 3)), h - 6);
    ctx2.fillStyle = "#463c32";
    ctx2.fillRect(x, y + Math.floor(h * 0.6), w, 2);
    ctx2.fillStyle = "#c0b4a0";
    ctx2.fillRect(x, y, w, 3);
    ctx2.fillStyle = "#4b4033";
    ctx2.fillRect(x + 1, y - 4, 2, 4);
    ctx2.fillRect(x + w - 3, y - 4, 2, 4);
    ctx2.fillRect(x + 2, y - 5, Math.max(1, w - 4), 2);
  }

  // src/core/liuyuan-view-memory.ts
  function chapterSceneHref(page, draft2 = false) {
    const query = new URLSearchParams({ chapter: "1" });
    if (draft2) query.set("draft", "1");
    carryLiuyuanPlaytest(query);
    return `${page}?${query}`;
  }

  // src/core/liuyuan-composition-route.ts
  function compositionRouteHref(page, chapter2, draft2, albumDone = false) {
    const query = new URLSearchParams();
    if (chapter2) query.set("chapter", "1");
    if (draft2) query.set("draft", "1");
    if (albumDone) query.set("album", "done");
    carryLiuyuanPlaytest(query);
    return `${page}${query.toString() ? `?${query}` : ""}`;
  }

  // src/liuyuan-flower.ts
  var canvas = document.getElementById("scene");
  var ctx = canvas.getContext("2d");
  var status = document.getElementById("status");
  var stageNote = document.getElementById("stageNote");
  var showGeometry = document.getElementById("showGeometry");
  var coords = document.getElementById("coords");
  var reset = document.getElementById("reset");
  var lookButton = document.getElementById("look");
  var dialogueActions = document.getElementById("dialogueActions");
  var dialoguePrompt = document.getElementById("dialoguePrompt");
  var leafCarryPrompt = document.getElementById("leafCarryPrompt");
  var sceneMessage = document.getElementById("sceneMessage");
  var interactionCue = document.getElementById("interactionCue");
  var askStudy = document.getElementById("askStudy");
  var watchSoil = document.getElementById("watchSoil");
  var recallClue = document.getElementById("recallClue");
  var borrowAlbum = document.getElementById("borrowAlbum");
  var continueChapter = document.getElementById("continueChapter");
  var helpDrawing = document.getElementById("helpDrawing");
  var drawingPanel = document.getElementById("lanternPuzzle");
  var drawingOpen = false;
  var drawingPractice = false;
  var drawingFoot = { x: LIUYUAN_FLOWER_WORKER.x + 70, y: LIUYUAN_FLOWER_WORKER.y + 70 };
  function drawingAvailable() {
    return chapter && !modernReturn && hasStoryFlag(loadProgress(), "ly-porridge-delivered") && !loadProgress().knowledge.includes("liuyuan-album-orchid-leaf");
  }
  function drawingIsNearest() {
    const distance = Math.hypot(actor.x - drawingFoot.x, actor.y - drawingFoot.y);
    return drawingAvailable() && distance < 90 && distance <= Math.hypot(actor.x - LIUYUAN_FLOWER_WORKER.x, actor.y - LIUYUAN_FLOWER_WORKER.y) && distance <= Math.hypot(actor.x - LIUYUAN_FLOWER_BUCKET.x, actor.y - LIUYUAN_FLOWER_BUCKET.y);
  }
  var drawingGame = createRainShadowUI(finishDrawing, leaveDrawing, true);
  function openDrawing(practice = false) {
    if (drawingOpen || transitionUrl || !practice && !drawingIsNearest()) return;
    drawingPractice = practice;
    drawingOpen = true;
    keys.clear();
    pressed.clear();
    dialogueActions.hidden = true;
    sceneMessage.hidden = true;
    drawingPanel.hidden = false;
    document.getElementById("drawingShade").hidden = false;
    drawingGame.show();
  }
  function closeDrawing() {
    drawingOpen = false;
    drawingPanel.hidden = true;
    drawingGame.close();
    document.getElementById("drawingShade").hidden = true;
    keys.clear();
    pressed.clear();
    helpDrawing.focus?.();
  }
  function drawingClue() {
    if (!hasStoryFlag(loadProgress(), "ly-florist-met")) commitLiuyuanChapterFlag("ly-florist-met");
    rememberLiuyuanFloristClue();
    floristBeat = "heard";
    recallClue.hidden = false;
  }
  function finishDrawing(state) {
    closeDrawing();
    if (drawingPractice) {
      showSceneMessage("\u753B\u7A3F\u6536\u597D\u4E86\u3002\u8FD9\u6B21\u662F\u72EC\u7ACB\u7EC3\u4E60\uFF0C\u4E0D\u8BB0\u5F55\u5956\u52B1\u3002");
      return;
    }
    const awarded = awardLiuyuanRainShadow();
    rememberLiuyuanDrawing("saved");
    drawingClue();
    showSceneMessage(`${state.hits === 0 ? "\u4F60\u628A\u5170\u7A3F\u5B8C\u597D\u5730\u9012\u56DE\u6A90\u4E0B\u3002" : state.hits > state.catHits ? "\u7EB8\u89D2\u7565\u6E7F\uFF0C\u5170\u53F6\u7684\u7B14\u52BF\u8FD8\u770B\u5F97\u6E05\u3002" : "\u7EB8\u89D2\u88AB\u732B\u8E6D\u76B1\u4E86\uFF0C\u5170\u53F6\u7684\u7B14\u52BF\u8FD8\u770B\u5F97\u6E05\u3002"}\u82B1\u5320\u628A\u7A3F\u9875\u8BA9\u7ED9\u4F60\uFF1A\u201C\u7559\u7740\u770B\u5427\u3002\u627E\u4E66\u658B\u90A3\u4F4D\uFF0C\u5148\u8BA4\u7B14\u6811\uFF0C\u522B\u6025\u7740\u78B0\u4ED6\u7684\u7EB8\u3002\u201D${awarded ? " \u5FA1 +1\u3002" : " \u5FA1\u5956\u52B1\u5DF2\u9886\u53D6\u3002"}\u753B\u518C\u6536\u5F55\uFF1A\u6A90\u4E0B\u5170\u7A3F\u3002`);
  }
  function leaveDrawing(state) {
    closeDrawing();
    if (drawingPractice) {
      showSceneMessage("\u6536\u8D77\u7EC3\u4E60\uFF0C\u56DE\u5230\u9662\u91CC\u3002");
      return;
    }
    if (state.phase === "ready") {
      showSceneMessage("\u4F60\u6536\u56DE\u624B\uFF0C\u5148\u770B\u82B1\u5320\u5FD9\u4ED6\u7684\u6D3B\u3002");
      return;
    }
    const wet = state.collected && state.hits > state.catHits;
    rememberLiuyuanDrawing(wet ? "smudged" : "left");
    drawingClue();
    showSceneMessage(wet ? "\u82B1\u5320\u62A2\u8FC7\u6E7F\u7EB8\u538B\u56DE\u6A90\u4E0B\uFF1A\u201C\u8FD9\u5F20\u5148\u667E\u7740\u3002\u4F60\u82E5\u627E\u4E66\u658B\u90A3\u4F4D\uFF0C\u8BA4\u7B14\u6811\u53BB\uFF1B\u4ED6\u7684\u7EB8\uFF0C\u6BD4\u6211\u8FD9\u5F20\u8FD8\u4E0D\u80AF\u79BB\u624B\u3002\u201D\u5931\u624B\u6CA1\u6709\u5C5E\u6027\u5956\u52B1\uFF0C\u4ECD\u53EF\u7EE7\u7EED\u5BFB\u4EBA\u3002" : state.catHits > 0 ? "\u82B1\u5320\u63A5\u8FC7\u88AB\u732B\u8E6D\u76B1\u7684\u753B\u7A3F\uFF0C\u629A\u5E73\u7EB8\u89D2\uFF1A\u201C\u732B\u7684\u4E8B\u6211\u6765\u7BA1\u3002\u627E\u4EBA\u5C31\u8BA4\u7B14\u6811\u53BB\u3002\u201D\u8FD9\u56DE\u6CA1\u6709\u5C5E\u6027\u5956\u52B1\uFF0C\u4ECD\u53EF\u7EE7\u7EED\u5BFB\u4EBA\u3002" : "\u4F60\u9000\u56DE\u6A90\u4E0B\uFF0C\u82B1\u5320\u81EA\u5DF1\u62FE\u8D77\u753B\u7A3F\u538B\u7A33\uFF1A\u201C\u732B\u7684\u4E8B\u6211\u6765\u7BA1\u3002\u627E\u4EBA\u5C31\u8BA4\u7B14\u6811\u53BB\u3002\u201D\u8FD9\u56DE\u6CA1\u6709\u5C5E\u6027\u5956\u52B1\uFF0C\u4ECD\u53EF\u7EE7\u7EED\u5BFB\u4EBA\u3002");
  }
  helpDrawing.addEventListener("click", () => openDrawing());
  var storyTransition = document.getElementById("storyTransition");
  var transitionWords = document.getElementById("transitionWords");
  var transitionContinue = document.getElementById("transitionContinue");
  var transitionUrl = "";
  var transitionLeaving = false;
  function finishTransition() {
    if (!transitionUrl || transitionLeaving) return;
    transitionLeaving = true;
    location.assign(transitionUrl);
  }
  transitionContinue.addEventListener("click", finishTransition);
  var toLvyinReturn = document.getElementById("toLvyinReturn");
  var returnWithStory = document.getElementById("returnWithStory");
  var leafCarryActions = document.getElementById("leafCarryActions");
  var placeInBucket = document.getElementById("placeInBucket");
  var keepInSleeve = document.getElementById("keepInSleeve");
  var routeNotice = document.getElementById("routeNotice");
  var pageQuery = new URLSearchParams(location.search);
  var chapter = pageQuery.get("chapter") === "1";
  var modernReturn = canEnterModernReturn(location.search, loadProgress(), "east-hall", "ly-leaf-written");
  var returnLvyin = document.getElementById("returnLvyin");
  if (chapter) {
    returnLvyin.href = chapterSceneHref("liuyuan-lvyin.html", pageQuery.get("draft") === "1");
    document.getElementById("editorLink").hidden = true;
    document.getElementById("toolSeparator").hidden = true;
    document.getElementById("sceneBadge").textContent = "CH3 \xB7 \u7559\u56ED \xB7 \u82B1\u6728\u9662";
  }
  if (modernReturn) {
    returnLvyin.hidden = true;
    document.getElementById("sceneTools").hidden = true;
    document.getElementById("sceneBadge").textContent = "CH3 \xB7 \u7559\u56ED \xB7 \u8FD4\u7A0B";
    routeNotice.textContent = "\u7559\u56ED\u7AE0\u8FD4\u7A0B\uFF1A\u56DE\u5230\u6E38\u620F\u589E\u8BBE\u7684\u82B1\u6728\u4F5C\u4E1A\u9662\uFF0C\u5148\u53D6\u7A7A\u6876\uFF0C\u518D\u6CBF\u5F53\u4EE3\u533A\u57DF\u987A\u5E8F\u56DE\u4E34\u6C60\u3002\u6876\u5185\u85CF\u53F6\u662F\u865A\u6784\u4EBA\u7269\u7684\u529E\u6CD5\uFF0C\u975E\u7559\u56ED\u65E7\u65E5\u95E8\u623F\u5236\u5EA6\uFF1B\u573A\u666F\u76F8\u63A5\u4ECD\u662F\u6E38\u620F\u526A\u63A5\u3002";
  }
  stageNote.hidden = chapter || modernReturn;
  var mayContinue = () => chapter && hasStoryFlag(loadProgress(), "ly-porridge-delivered") && Math.hypot(actor.x - LIUYUAN_FLOWER_EAST_EXIT.x, actor.y - LIUYUAN_FLOWER_EAST_EXIT.y) < 120;
  continueChapter.addEventListener("click", () => {
    if (!mayContinue() || transitionUrl) return;
    transitionUrl = modernRouteHref("liuyuan-east-hall.html", "flower", pageQuery.get("draft") === "1");
    keys.clear();
    pressed.clear();
    document.getElementById("transitionTitle").textContent = hasStoryFlag(loadProgress(), "ly-florist-met") ? "\u5FAA\u7740\u201C\u7B14\u6811\u201D" : "\u9662\u5916\u7684\u7FFB\u7EB8\u58F0";
    transitionWords.textContent = returnFromAlbum ? "\u753B\u8C31\u7559\u5728\u82B1\u5320\u6A90\u4E0B\uFF0C\u7EB8\u89D2\u4E0A\u7684\u201C\u7B14\u6811\u201D\u5374\u8FD8\u6CA1\u6709\u7740\u843D\u3002\u8D70\u51FA\u4F5C\u4E1A\u9662\uFF0C\u4F60\u60F3\u518D\u770B\u770B\u90A3\u4E9B\u6811\u3002" : "\u7CA5\u6876\u7559\u5728\u6A90\u4E0B\uFF0C\u82B1\u5320\u53C8\u4F4E\u5934\u5FD9\u4ED6\u7684\u5170\u3002\u4F60\u8BB0\u7740\u90A3\u53E5\u201C\u82DE\u5C16\u50CF\u7B14\u5934\u201D\uFF0C\u5F80\u9662\u5916\u5BFB\u53BB\u3002";
    if (!hasStoryFlag(loadProgress(), "ly-florist-met"))
      transitionWords.textContent = "\u7CA5\u5DF2\u9001\u5230\uFF0C\u7A7A\u6876\u6682\u7559\u6A90\u4E0B\u3002\u82B1\u5320\u63D0\u8D77\u6709\u4EBA\u5728\u4E66\u658B\u91CC\u5FD9\u5F97\u5FD8\u4E86\u5403\u996D\uFF1B\u9662\u5916\u9690\u7EA6\u6709\u7FFB\u7EB8\u58F0\u3002\u4F60\u60F3\u8FC7\u53BB\u770B\u770B\uFF0C\u518D\u56DE\u6765\u53D6\u6876\u3002";
    if (loadProgress().knowledge.includes("liuyuan-album-orchid-leaf"))
      transitionWords.textContent = "\u5170\u7A3F\u6536\u5728\u8EAB\u8FB9\uFF0C\u82B1\u5320\u90A3\u53E5\u201C\u522B\u6025\u7740\u78B0\u4ED6\u7684\u7EB8\u201D\u5374\u8BA9\u4F60\u7559\u4E86\u5FC3\u3002\u5FAA\u7740\u7B14\u6811\u5F80\u524D\u8D70\uFF0C\u4E66\u658B\u91CC\u7684\u4EBA\u4F1A\u600E\u6837\u770B\u5F85\u6765\u5BA2\uFF1F";
    else if (loadProgress().knowledge.includes("liuyuan-drawing-smudged"))
      transitionWords.textContent = "\u6E7F\u7EB8\u8FD8\u667E\u5728\u6A90\u4E0B\u3002\u82B1\u5320\u8BF4\uFF0C\u4E66\u658B\u90A3\u4F4D\u4E5F\u62A4\u7740\u4E00\u5F20\u7EB8\uFF1B\u4F60\u5E26\u7740\u8FD9\u70B9\u7591\u95EE\uFF0C\u5FAA\u7B14\u6811\u5F80\u524D\u627E\u3002";
    storyTransition.hidden = false;
    transitionContinue.focus();
  });
  var previewRequested = new URLSearchParams(location.search).get("draft") === "1";
  var draft = readScenePlateDraft(
    LIUYUAN_FLOWER_ID,
    LIUYUAN_FLOWER_WORLD_W,
    LIUYUAN_FLOWER_WORLD_H,
    buildLiuyuanFlowerStudyMap,
    LIUYUAN_FLOWER_REQUIRED_FEET
  );
  var actorHeight = Math.round(LIUYUAN_CHARACTER_SCALE.flower.worldHeight * (draft?.actorScalePercent ?? 100) / 100);
  var scene2 = buildLiuyuanFlowerStudyMap(draft?.regions ?? LIUYUAN_FLOWER_DRAFT_REGIONS);
  var geometry = draft?.geometry ?? LIUYUAN_FLOWER_GEOMETRY;
  var obstacles = geometry.flatMap((object) => object.colliders ?? []);
  var albumReturnRequested = pageQuery.get("album") === "done";
  var returnFromAlbum = canReturnFromCompletedAlbum(
    albumReturnRequested,
    chapter,
    hasStoryFlag(loadProgress(), "ly-florist-met"),
    loadCompositionDraft(chapter)
  );
  var returnFootOpen = !collides(
    scene2.map,
    LIUYUAN_FLOWER_WORKER_STAND.x,
    LIUYUAN_FLOWER_WORKER_STAND.y,
    scene2.w,
    scene2.h,
    obstacles,
    STANDARD_PLAYER_PROFILE
  );
  var actor = {
    ...modernReturn ? LIUYUAN_FLOWER_EAST_EXIT : returnFromAlbum && returnFootOpen ? LIUYUAN_FLOWER_WORKER_STAND : LIUYUAN_FLOWER_SPAWN,
    dir: 1,
    moving: false,
    walkTime: 0
  };
  var carryingBucket = modernReturn ? hasStoryFlag(loadProgress(), "ly-leaf-carried") : chapter && carryingLiuyuanPorridge(loadProgress());
  var bucketDelivered = modernReturn ? !hasStoryFlag(loadProgress(), "ly-leaf-carried") : chapter && hasStoryFlag(loadProgress(), "ly-porridge-delivered");
  var mayReturnToLvyin = () => modernReturn && hasStoryFlag(loadProgress(), "ly-leaf-carried") && near(LIUYUAN_FLOWER_SPAWN, 115);
  returnWithStory.addEventListener("click", () => {
    if (!mayReturnToLvyin() || transitionUrl) return;
    transitionUrl = modernRouteHref("liuyuan-entry.html", "flower", previewRequested, true);
    keys.clear();
    pressed.clear();
    document.getElementById("transitionTitle").textContent = "\u6876\u8F7B\uFF0C\u5B57\u91CD";
    document.getElementById("transitionImage").src = "../assets/scene25d/liuyuan-entrance-walkable-study-v2.svg?v=6";
    transitionWords.textContent = "\u7CA5\u9001\u5B8C\u4E86\uFF0C\u63D0\u8D77\u7A7A\u6876\u5374\u6BD4\u6765\u65F6\u66F4\u5C0F\u5FC3\u3002\u4F60\u6CBF\u6765\u8DEF\u7A7F\u8FC7\u4E34\u6C60\u4E0E\u5C0F\u5EAD\uFF0C\u53F6\u7247\u5939\u5728\u6876\u5185\uFF0C\u6CA1\u6709\u518D\u62FF\u51FA\u6765\u770B\u3002\u5939\u5F04\u90A3\u5934\uFF0C\u4E54\u79BE\u8FD8\u5B88\u7740\u62C5\u5B50\uFF1B\u95E8\u623F\u7684\u706F\u7B3C\u4E5F\u8FD8\u6CA1\u4FEE\u597D\u3002";
    transitionContinue.textContent = "\u8D70\u5165\u5939\u5F04 \xB7 Enter / E";
    storyTransition.hidden = false;
    transitionContinue.focus();
  });
  toLvyinReturn.addEventListener("click", () => {
    if (!transitionUrl && mayReturnToLvyin()) location.assign(modernRouteHref("liuyuan-lvyin.html", "flower", previewRequested, true));
  });
  placeInBucket.addEventListener("click", () => {
    if (!modernReturn || !near(LIUYUAN_FLOWER_BUCKET, 115)) return;
    commitLiuyuanChapterFlag("ly-leaf-carried");
    carryingBucket = true;
    bucketDelivered = false;
    leafCarryActions.hidden = true;
    status.textContent = "\u7A7A\u6876\u63D0\u8D77\uFF0C\u53F6\u7247\u5939\u5728\u6876\u5185\u3002\u6CBF\u77F3\u8DEF\u56DE\u5230\u9662\u53E3\uFF0C\u95E8\u5916\u8FD8\u7B49\u7740\u8FD8\u6876\u3002";
    showSceneMessage(status.textContent);
  });
  keepInSleeve.addEventListener("click", () => {
    if (!modernReturn || !near(LIUYUAN_FLOWER_BUCKET, 115)) return;
    status.textContent = "\u6E7F\u58A8\u5728\u8863\u7F1D\u8FB9\u8E6D\u51FA\u6BDB\u8FB9\u3002\u4F60\u628A\u53F6\u7247\u62BD\u51FA\u6765\uFF0C\u8FD8\u662F\u5F97\u53E6\u627E\u7A33\u59A5\u7684\u5730\u65B9\u3002";
    leafCarryPrompt.textContent = status.textContent;
  });
  document.getElementById("closeLeafCarry").addEventListener("click", () => {
    leafCarryActions.hidden = true;
  });
  document.getElementById("closeFloristDialogue").addEventListener("click", () => {
    dialogueActions.hidden = true;
  });
  var keys = /* @__PURE__ */ new Set();
  var pressed = /* @__PURE__ */ new Set();
  var lastTime = 0;
  var incidentTime = 0;
  var workerGreeting = false;
  var floristBeat = hasStoryFlag(loadProgress(), "ly-florist-met") && chapter ? "heard" : "unmet";
  var mayBorrowAlbum = () => near(LIUYUAN_FLOWER_WORKER, 125) && (chapter ? hasStoryFlag(loadProgress(), "ly-porridge-delivered") && hasStoryFlag(loadProgress(), "ly-florist-met") : workerGreeting);
  borrowAlbum.addEventListener("click", () => {
    if (!drawingOpen && !transitionUrl && mayBorrowAlbum()) location.assign(compositionRouteHref("liuyuan-composition-study.html", chapter, previewRequested));
  });
  var art = new Image();
  var pixelArt = document.createElement("canvas");
  pixelArt.width = 888;
  pixelArt.height = 448;
  var pixelCtx = pixelArt.getContext("2d");
  var pixelArtReady = false;
  art.addEventListener("load", () => {
    pixelCtx.imageSmoothingEnabled = true;
    pixelCtx.drawImage(art, 0, 0, pixelArt.width, pixelArt.height);
    pixelArtReady = true;
  });
  art.src = "../assets/scene25d/liuyuan-flower-work-yard-study-v1.png";
  var sprite = new Image();
  sprite.src = "../assets/characters/scholar-player-sprites-v1.png";
  var florist = new Image();
  florist.src = "../assets/characters/liuyuan-florist-concept-v1.png";
  var FLORIST_CROP = { x: 162, y: 101, w: 941, h: 1086 };
  var FLORIST_WORLD_HEIGHT = LIUYUAN_CHARACTER_SCALE.flower.kneelingFloristHeight;
  var FLORIST_WORLD_WIDTH = Math.round(FLORIST_WORLD_HEIGHT * FLORIST_CROP.w / FLORIST_CROP.h);
  function near(point, radius) {
    return Math.hypot(actor.x - point.x, actor.y - point.y) < radius;
  }
  function showSceneMessage(words) {
    sceneMessage.textContent = words;
    sceneMessage.hidden = false;
  }
  function speakToFlorist(action) {
    if (!near(LIUYUAN_FLOWER_WORKER, 125) || !chapter) return;
    const delivered = hasStoryFlag(loadProgress(), "ly-porridge-delivered");
    const result = advanceFloristBeat(floristBeat, action, delivered);
    floristBeat = result.state;
    dialogueActions.hidden = !result.showChoices;
    status.textContent = result.line;
    if (result.heardClue) {
      const advanced = commitLiuyuanChapterFlag("ly-florist-met");
      if (advanced.reason === "missing-previous") {
        status.textContent = "\u5148\u628A\u8FD9\u8D9F\u9001\u7CA5\u7684\u6765\u610F\u529E\u59A5\u3002";
        return;
      }
      rememberLiuyuanFloristClue();
      recallClue.hidden = false;
      status.textContent += " \u4ED6\u53C8\u62FF\u8D77\u4E00\u9875\u7A7A\u767D\u5170\u8C31\uFF1A\u201C\u82E5\u6709\u95F2\uFF0C\u66FF\u6211\u53D6\u4E00\u666F\u3002\u522B\u53EA\u753B\u82B1\uFF0C\u7ED9\u5B57\u7559\u4E2A\u4F4D\u7F6E\u3002\u201D";
    }
    if (result.showChoices) {
      dialoguePrompt.textContent = result.line;
      sceneMessage.hidden = true;
      keys.clear();
      pressed.clear();
    } else showSceneMessage(status.textContent);
  }
  askStudy.addEventListener("click", () => speakToFlorist("ask"));
  watchSoil.addEventListener("click", () => speakToFlorist("watch"));
  recallClue.addEventListener("click", () => {
    if (!loadProgress().knowledge.includes("liuyuan-magnolia-slip")) return;
    status.textContent = "\u7EB8\u89D2\u53EA\u8BB0\u4E86\u4E24\u4E2A\u5B57\uFF1A\u201C\u7B14\u6811\u201D\u3002\u82B1\u5320\u6CA1\u8BF4\u662F\u54EA\u5EA7\u9662\u91CC\u7684\u6811\u3002";
    showSceneMessage(status.textContent);
  });
  function interact() {
    if (transitionUrl || drawingOpen) return;
    if (modernReturn) {
      if (near(LIUYUAN_FLOWER_BUCKET, 115) && !hasStoryFlag(loadProgress(), "ly-leaf-carried")) {
        leafCarryActions.hidden = false;
        status.textContent = "\u6A90\u4E0B\u7684\u7CA5\u6876\u5DF2\u7ECF\u7A7A\u4E86\u3002\u53F6\u7247\u5C1A\u6709\u6E7F\u58A8\uFF0C\u4F60\u8981\u653E\u5728\u54EA\u91CC\uFF1F";
        leafCarryPrompt.textContent = status.textContent;
        sceneMessage.hidden = true;
        keys.clear();
        pressed.clear();
      } else status.textContent = mayReturnToLvyin() ? "\u6CBF\u6765\u65F6\u7684\u77F3\u8DEF\u56DE\u4E34\u6C60\uFF0C\u6876\u91CC\u7684\u53F6\u6682\u4E14\u4E0D\u8981\u62FF\u51FA\u6765\u3002" : "\u82B1\u5320\u8FD8\u5728\u5FD9\u3002\u53D6\u597D\u7A7A\u6876\uFF0C\u518D\u5411\u9662\u53E3\u8D70\u3002";
      return;
    }
    const bucketDistance = Math.hypot(actor.x - LIUYUAN_FLOWER_BUCKET.x, actor.y - LIUYUAN_FLOWER_BUCKET.y);
    const workerDistance = Math.hypot(actor.x - LIUYUAN_FLOWER_WORKER.x, actor.y - LIUYUAN_FLOWER_WORKER.y);
    if (drawingIsNearest()) {
      openDrawing();
      return;
    }
    if (bucketDistance < 115 && (workerDistance >= 125 || bucketDistance <= workerDistance)) {
      if (!chapter) {
        status.textContent = "\u72EC\u7ACB\u8BD5\u8D70\u53EA\u770B\u4F5C\u4E1A\u9662\uFF0C\u4E0D\u8BB0\u5F55\u9001\u7CA5\u8FDB\u5EA6\u3002";
        return;
      }
      if (!hasStoryFlag(loadProgress(), "ly-alley-walked")) {
        status.textContent = "\u5148\u4ECE\u5939\u5F04\u628A\u7CA5\u63D0\u8FDB\u6765\u3002";
        return;
      }
      if (hasStoryFlag(loadProgress(), "ly-porridge-delivered")) {
        status.textContent = "\u7CA5\u6876\u5DF2\u7ECF\u653E\u5728\u6A90\u4E0B\u4E86\u3002";
        showSceneMessage(status.textContent);
        return;
      }
      const result = commitLiuyuanChapterFlag("ly-porridge-delivered");
      carryingBucket = chapter && carryingLiuyuanPorridge(loadProgress());
      bucketDelivered = chapter && hasStoryFlag(loadProgress(), "ly-porridge-delivered");
      dialogueActions.hidden = true;
      floristBeat = "unmet";
      status.textContent = result.applied || hasStoryFlag(loadProgress(), "ly-porridge-delivered") ? "\u4F60\u628A\u7CA5\u6876\u6401\u5728\u6A90\u4E0B\u3002\u82B1\u5320\u62E8\u7740\u5170\u571F\uFF1A\u201C\u4E66\u658B\u90A3\u4F4D\u7684\u7CA5\uFF0C\u7B49\u4ED6\u5FD9\u5B8C\u81EA\u5DF1\u6765\u62FF\u3002\u4E00\u5199\u8D77\u6765\uFF0C\u996D\u4E5F\u987E\u4E0D\u4E0A\u3002\u201D\u9662\u5916\u9690\u7EA6\u6709\u7FFB\u7EB8\u58F0\u3002" : "\u5148\u628A\u8FD9\u8D9F\u9001\u7CA5\u7684\u6765\u610F\u529E\u59A5\u3002";
      showSceneMessage(status.textContent);
      return;
    }
    if (workerDistance < 125) {
      if (!chapter) {
        workerGreeting = true;
        status.textContent = "\u82B1\u5320\u4F4E\u5934\u7ED9\u76C6\u5170\u6362\u571F\uFF0C\u53C8\u9012\u6765\u4E00\u9875\u7A7A\u767D\u5170\u8C31\uFF1A\u201C\u53D6\u4E00\u666F\uFF0C\u53F3\u8FB9\u7ED9\u5B57\u7559\u5904\u3002\u201D\u8FD9\u8D9F\u8BD5\u8D70\u4E0D\u63A8\u8FDB\u7AE0\u8282\u3002";
        return;
      }
      workerGreeting = true;
      speakToFlorist("approach");
      return;
    }
    if (near(LIUYUAN_FLOWER_EAST_EXIT, 120)) {
      if (!chapter) {
        status.textContent = "\u8FD9\u6761\u8FB9\u754C\u6682\u4F5C\u51E0\u4F55\u8BD5\u8D70\uFF1B\u8DE8\u56ED\u6E38\u7EBF\u8FD8\u9700\u6838\u56FE\u3002";
        return;
      }
      status.textContent = hasStoryFlag(loadProgress(), "ly-florist-met") ? "\u4E1C\u5ECA\u4ECD\u901A\u5411\u522B\u7684\u9662\u5B50\u3002\u82B1\u5320\u8BF4\u7684\u201C\u7B14\u6811\u201D\uFF0C\u8FD8\u4E0D\u77E5\u9053\u6307\u54EA\u682A\u3002" : hasStoryFlag(loadProgress(), "ly-porridge-delivered") ? "\u7CA5\u6876\u5DF2\u653E\u59A5\u3002\u9662\u5916\u9690\u7EA6\u6709\u7FFB\u7EB8\u58F0\uFF1B\u53EF\u4EE5\u8FC7\u53BB\u770B\u770B\uFF0C\u4E5F\u53EF\u4EE5\u56DE\u5170\u76C6\u65C1\u95EE\u4E00\u53E5\u3002" : "\u5148\u628A\u8FD9\u8D9F\u7CA5\u9001\u5230\u6A90\u4E0B\u3002";
      showSceneMessage(status.textContent);
      return;
    }
    status.textContent = workerGreeting ? "\u77F3\u5730\u655E\u4EAE\uFF1B\u6A90\u4E0B\u53EF\u653E\u6876\uFF0C\u82B1\u5320\u8FD8\u8E72\u5728\u5170\u76C6\u65C1\u3002" : "\u82B1\u5320\u6B63\u5FD9\u7740\u7ED9\u5170\u6362\u571F\u3002";
  }
  var directions = { arrowup: "up", w: "up", arrowdown: "down", s: "down", arrowleft: "left", a: "left", arrowright: "right", d: "right" };
  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (drawingOpen) {
      if (key === "tab") {
        const buttons = [...drawingPanel.querySelectorAll("button:not([disabled]):not([hidden]), input:not([disabled])")];
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (first && (event.shiftKey && document.activeElement === first || !event.shiftKey && document.activeElement === last)) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        }
        return;
      }
      const target = event.target;
      if ((target?.tagName === "BUTTON" || target?.tagName === "INPUT") && (event.key === "Enter" || event.key === " " && target.id !== "rainGuard")) return;
      if (!event.metaKey && !event.ctrlKey && !event.altKey) {
        drawingGame.keyDown(event.key, event.repeat);
        if (["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "enter", "escape"].includes(key) || /^[wasdxp]$/.test(key)) event.preventDefault();
      }
      return;
    }
    if (transitionUrl) {
      event.preventDefault();
      if (!event.repeat && ["enter", "e", "escape", " "].includes(key)) finishTransition();
      else if (key === "tab") transitionContinue.focus();
      return;
    }
    if (key === "escape" && (!dialogueActions.hidden || !leafCarryActions.hidden)) {
      event.preventDefault();
      dialogueActions.hidden = true;
      leafCarryActions.hidden = true;
      return;
    }
    if (!leafCarryActions.hidden && (key === "1" || key === "2")) {
      event.preventDefault();
      if (!event.repeat) (key === "1" ? placeInBucket : keepInSleeve).click();
      return;
    }
    if (!dialogueActions.hidden && (key === "1" || key === "2")) {
      event.preventDefault();
      if (!event.repeat) speakToFlorist(key === "1" ? "ask" : "watch");
      return;
    }
    if (key === "e") {
      event.preventDefault();
      if (!event.repeat) interact();
      return;
    }
    const direction = directions[key];
    if (direction) {
      event.preventDefault();
      if (dialogueActions.hidden && leafCarryActions.hidden) keys.add(direction);
    }
  });
  window.addEventListener("keyup", (event) => {
    drawingGame.keyUp(event.key);
    const direction = directions[event.key.toLowerCase()];
    if (direction) keys.delete(direction);
  });
  window.addEventListener("blur", () => {
    keys.clear();
    pressed.clear();
  });
  for (const button of document.querySelectorAll("[data-dir]")) {
    const dir = button.dataset.dir;
    button.addEventListener("pointerdown", (event) => {
      if (transitionUrl || drawingOpen) return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      pressed.add(dir);
    });
    button.addEventListener("pointerup", () => pressed.delete(dir));
    button.addEventListener("pointercancel", () => pressed.delete(dir));
    button.addEventListener("lostpointercapture", () => pressed.delete(dir));
  }
  lookButton.addEventListener("click", interact);
  reset.addEventListener("click", () => {
    if (drawingOpen || transitionUrl) return;
    actor.x = modernReturn ? LIUYUAN_FLOWER_EAST_EXIT.x : LIUYUAN_FLOWER_SPAWN.x;
    actor.y = modernReturn ? LIUYUAN_FLOWER_EAST_EXIT.y : LIUYUAN_FLOWER_SPAWN.y;
    actor.dir = modernReturn ? 1 : 1;
    keys.clear();
    pressed.clear();
    dialogueActions.hidden = true;
    floristBeat = "unmet";
    workerGreeting = false;
    leafCarryActions.hidden = true;
    sceneMessage.hidden = true;
    carryingBucket = modernReturn ? hasStoryFlag(loadProgress(), "ly-leaf-carried") : chapter && carryingLiuyuanPorridge(loadProgress());
    bucketDelivered = modernReturn ? !hasStoryFlag(loadProgress(), "ly-leaf-carried") : chapter && hasStoryFlag(loadProgress(), "ly-porridge-delivered");
    status.textContent = modernReturn ? carryingBucket ? "\u4F60\u56DE\u5230\u9662\u4E1C\u4FA7\uFF1B\u7A7A\u6876\u5DF2\u63D0\u5728\u624B\u4E2D\uFF0C\u6CBF\u77F3\u8DEF\u56DE\u4E34\u6C60\u3002" : "\u4F60\u56DE\u5230\u9662\u4E1C\u4FA7\uFF1B\u7A7A\u6876\u8FD8\u5728\u6A90\u4E0B\u3002" : "\u53C8\u56DE\u5230\u9662\u53E3\u3002\u82B1\u5320\u4ECD\u5728\u6362\u5170\u571F\u3002";
  });
  function drawGeometry() {
    ctx.save();
    ctx.globalAlpha = 0.5;
    for (let y = 0; y < scene2.h; y++) for (let x = 0; x < scene2.w; x++) {
      const tile = scene2.map[y * scene2.w + x];
      if ([T.PATH, T.CORR, T.PLAT, T.WATER].includes(tile)) {
        ctx.fillStyle = tile === T.WATER ? "#4c8dff" : tile === T.CORR ? "#27bfc2" : tile === T.PLAT ? "#f4d35e" : "#52d879";
        ctx.fillRect(x * 16, y * 16, 16, 16);
      }
    }
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = "#ef5350";
    for (const object of geometry) for (const shape of object.colliders ?? []) {
      ctx.beginPath();
      if ("x" in shape) ctx.rect(shape.x, shape.y, shape.w, shape.h);
      else shape.points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    for (const object of geometry) for (const polygon of object.occluder?.polygons ?? []) {
      ctx.beginPath();
      polygon.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.closePath();
      ctx.strokeStyle = "#35d8e6";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    const p = STANDARD_PLAYER_PROFILE;
    ctx.strokeStyle = "#ff64a8";
    ctx.lineWidth = 1;
    ctx.strokeRect(actor.x - p.halfW, actor.y - p.topInset, p.halfW * 2, p.topInset - p.bottomInset);
  }
  function draw() {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#c6c6b9";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const zoom = LIUYUAN_CHARACTER_SCALE.flower.cameraZoom, viewW = canvas.width / zoom, viewH = canvas.height / zoom;
    const cameraX = Math.max(0, Math.min(LIUYUAN_FLOWER_WORLD_W - viewW, actor.x - viewW * 0.55));
    const cameraY = Math.max(0, Math.min(LIUYUAN_FLOWER_WORLD_H - viewH, actor.y - viewH * 0.9));
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(-Math.round(cameraX), -Math.round(cameraY));
    if (art.complete && art.naturalWidth) ctx.drawImage(pixelArtReady ? pixelArt : art, 0, 0, LIUYUAN_FLOWER_WORLD_W, LIUYUAN_FLOWER_WORLD_H);
    const drawFlorist = () => {
      if (florist.complete && florist.naturalWidth) {
        ctx.fillStyle = "rgba(20,32,25,.22)";
        ctx.fillRect(LIUYUAN_FLOWER_WORKER.x - 18, LIUYUAN_FLOWER_WORKER.y - 2, 36, 4);
        ctx.drawImage(
          florist,
          FLORIST_CROP.x,
          FLORIST_CROP.y,
          FLORIST_CROP.w,
          FLORIST_CROP.h,
          LIUYUAN_FLOWER_WORKER.x - Math.floor(FLORIST_WORLD_WIDTH / 2),
          LIUYUAN_FLOWER_WORKER.y - FLORIST_WORLD_HEIGHT,
          FLORIST_WORLD_WIDTH,
          FLORIST_WORLD_HEIGHT
        );
      }
    };
    const drawScholar = () => {
      drawScholarGroundShadow(ctx, actor.x, actor.y, actorHeight);
      if (sprite.complete && sprite.naturalWidth) {
        const frame = actor.moving ? 1 + Math.floor(actor.walkTime * 6) % 2 : 0;
        drawScholarAtFoot(ctx, sprite, actor.dir, frame, actor.x, actor.y, actorHeight);
      } else {
        ctx.fillStyle = "#344e44";
        ctx.fillRect(actor.x - 6, actor.y - 38, 12, 38);
      }
      if (carryingBucket) drawLiuyuanPorridgeBucket(ctx, actor.x, actor.y, actorHeight, actor.dir, true);
    };
    if (bucketDelivered) drawLiuyuanPorridgeBucket(
      ctx,
      LIUYUAN_FLOWER_BUCKET.x,
      LIUYUAN_FLOWER_BUCKET.y,
      actorHeight,
      0,
      false
    );
    const actors = [{ y: actor.y, draw: drawScholar }, { y: LIUYUAN_FLOWER_WORKER.y, draw: drawFlorist }];
    if (drawingAvailable()) {
      const { x, y } = drawingFoot;
      actors.push({ y, draw: () => drawDrawingIncident(ctx, x, y, incidentTime) });
    }
    for (const item of actors.sort((a, b) => a.y - b.y)) item.draw();
    if (art.complete && art.naturalWidth) for (const object of geometry) {
      const occluder = object.occluder;
      if (!occluder || actor.y >= occluder.depthY) continue;
      ctx.save();
      ctx.beginPath();
      for (const polygon of occluder.polygons) {
        polygon.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
        ctx.closePath();
      }
      ctx.clip();
      ctx.drawImage(pixelArtReady ? pixelArt : art, 0, 0, LIUYUAN_FLOWER_WORLD_W, LIUYUAN_FLOWER_WORLD_H);
      ctx.restore();
    }
    if (showGeometry.checked) drawGeometry();
    ctx.restore();
  }
  function tick(now) {
    const dt = Math.min(0.05, (now - (lastTime || now)) / 1e3);
    lastTime = now;
    if (!drawingOpen && !transitionUrl) incidentTime += dt;
    if (drawingOpen) {
      actor.moving = false;
      drawingGame.tick(dt);
      draw();
      requestAnimationFrame(tick);
      return;
    }
    if (transitionUrl) {
      actor.moving = false;
      draw();
      requestAnimationFrame(tick);
      return;
    }
    const active = (dir) => keys.has(dir) || pressed.has(dir);
    const dx = Number(active("right")) - Number(active("left")), dy = Number(active("down")) - Number(active("up"));
    actor.moving = dialogueActions.hidden && leafCarryActions.hidden && (dx !== 0 || dy !== 0);
    if (actor.moving) {
      sceneMessage.hidden = true;
      actor.dir = dy > 0 ? 0 : dy < 0 ? 3 : dx > 0 ? 2 : 1;
      actor.walkTime += dt;
      const length = Math.hypot(dx, dy);
      moveEntity(scene2.map, actor, dx / length * 95 * dt, dy / length * 95 * dt, scene2.w, scene2.h, obstacles, STANDARD_PLAYER_PROFILE);
    }
    if (!dialogueActions.hidden && !near(LIUYUAN_FLOWER_WORKER, 165)) {
      dialogueActions.hidden = true;
      floristBeat = "unmet";
    }
    if (modernReturn && !leafCarryActions.hidden && !near(LIUYUAN_FLOWER_BUCKET, 140))
      leafCarryActions.hidden = true;
    stageNote.textContent = modernReturn ? carryingBucket ? "\u53F6\u7247\u5DF2\u968F\u7A7A\u6876\u5E26\u5728\u8EAB\u8FB9\uFF0C\u6CBF\u77F3\u9662\u8D70\u5411\u4E34\u6C60\u3002" : "\u56DE\u6A90\u4E0B\u53D6\u7A7A\u6876\uFF0C\u518D\u6CBF\u77F3\u9662\u8D70\u5411\u4E34\u6C60\u3002" : near(LIUYUAN_FLOWER_WORKER, 150) ? "\u82B1\u5320\u7ED9\u76C6\u5170\u6362\u571F\uFF0C\u5934\u4E5F\u4E0D\u62AC\u3002" : near(LIUYUAN_FLOWER_BUCKET, 140) ? "\u6A90\u4E0B\u6709\u4E00\u5757\u53EF\u6401\u7CA5\u6876\u7684\u77F3\u5730\u3002" : "\u77F3\u9662\u91CC\u6709\u4EBA\u8E72\u7740\u6362\u5170\u571F\u3002";
    continueChapter.hidden = !mayContinue();
    continueChapter.textContent = hasStoryFlag(loadProgress(), "ly-florist-met") ? "\u6CBF\u4E1C\u5ECA \xB7 \u5BFB\u4E66\u658B" : "\u6CBF\u4E1C\u5ECA \xB7 \u542C\u7EB8\u58F0";
    toLvyinReturn.hidden = !mayReturnToLvyin();
    returnWithStory.hidden = !mayReturnToLvyin();
    borrowAlbum.hidden = modernReturn || !mayBorrowAlbum();
    helpDrawing.hidden = !drawingIsNearest() || !dialogueActions.hidden;
    const viewCollected = document.getElementById("viewCollected");
    viewCollected.hidden = !loadProgress().knowledge.includes("liuyuan-album-orchid-leaf");
    viewCollected.href = chapterSceneHref("journal.html", previewRequested);
    const bucketDistance = Math.hypot(actor.x - LIUYUAN_FLOWER_BUCKET.x, actor.y - LIUYUAN_FLOWER_BUCKET.y);
    const workerDistance = Math.hypot(actor.x - LIUYUAN_FLOWER_WORKER.x, actor.y - LIUYUAN_FLOWER_WORKER.y);
    const cue = drawingIsNearest() ? "E \xB7 \u62A2\u4F4F\u732B\u722A\u8FB9\u7684\u5170\u7A3F" : modernReturn && !hasStoryFlag(loadProgress(), "ly-leaf-carried") && bucketDistance < 115 ? "E \xB7 \u53D6\u7A7A\u6876" : chapter && !hasStoryFlag(loadProgress(), "ly-porridge-delivered") && bucketDistance < 115 && (workerDistance >= 125 || bucketDistance <= workerDistance) ? "E \xB7 \u653E\u4E0B\u7CA5\u6876" : chapter && workerDistance < 125 && hasStoryFlag(loadProgress(), "ly-porridge-delivered") && !hasStoryFlag(loadProgress(), "ly-florist-met") ? "E \xB7 \u4E0E\u82B1\u5320\u8BF4\u8BDD" : "";
    interactionCue.hidden = !cue || !dialogueActions.hidden || !leafCarryActions.hidden || !sceneMessage.hidden;
    interactionCue.textContent = cue;
    if (chapter && !modernReturn && !hasStoryFlag(loadProgress(), "ly-porridge-delivered") && near(LIUYUAN_FLOWER_EAST_EXIT, 120)) {
      interactionCue.textContent = "\u5148\u5230\u6A90\u4E0B\u653E\u7CA5";
      interactionCue.hidden = !sceneMessage.hidden;
    }
    coords.hidden = !showGeometry.checked;
    if (showGeometry.checked) coords.textContent = `\u811A\u70B9 (${Math.round(actor.x)}, ${Math.round(actor.y)})`;
    draw();
    requestAnimationFrame(tick);
  }
  if (previewRequested && !draft) status.textContent = "\u6CA1\u6709\u627E\u5230\u53EF\u7528\u4E14\u5267\u60C5\u811A\u70B9\u8FDE\u901A\u7684\u8349\u7A3F\uFF0C\u6B63\u663E\u793A\u4EE3\u7801\u51E0\u4F55\uFF1B\u7F16\u8F91\u5668\u539F\u7A3F\u672A\u5220\u9664\u3002";
  if (draft) status.textContent = "\u6B63\u5728\u9884\u89C8\u7F16\u8F91\u5668\u8349\u7A3F\uFF1B\u53EF\u8D70\u9762\u4E0E\u82B1\u5320\u78B0\u649E\u5DF2\u540C\u6B65\u3002";
  if (collides(scene2.map, actor.x, actor.y, scene2.w, scene2.h, obstacles, STANDARD_PLAYER_PROFILE)) status.textContent = "\u51FA\u751F\u70B9\u88AB\u5F53\u524D\u51E0\u4F55\u5C01\u4F4F\uFF0C\u8BF7\u56DE\u7F16\u8F91\u5668\u68C0\u67E5\u3002";
  else if (returnFromAlbum) status.textContent = "\u4F60\u628A\u5170\u8C31\u4E0E\u753B\u8C31\u4EA4\u56DE\u9662\u4E2D\u3002\u82B1\u5320\u628A\u7EB8\u9875\u538B\u5728\u6A90\u4E0B\u667E\u7740\uFF0C\u53C8\u53BB\u7167\u770B\u90A3\u76C6\u5170\uFF1B\u9001\u7CA5\u4E0E\u5BFB\u4EBA\u7684\u6B63\u4E8B\u4ECD\u5F97\u5F80\u4E0B\u529E\u3002";
  else if (albumReturnRequested) status.textContent = "\u753B\u8C31\u8FD8\u6CA1\u6709\u5B8C\u6574\u4EA4\u6210\u3002\u5148\u4E0E\u82B1\u5320\u8BF4\u8BDD\uFF0C\u518D\u628A\u5170\u8C31\u548C\u753B\u8C31\u90FD\u505A\u5B8C\u3002";
  else if (modernReturn && carryingBucket) status.textContent = "\u7A7A\u6876\u5DF2\u63D0\u5728\u624B\u4E2D\uFF1B\u53F6\u7247\u4ECD\u5939\u5728\u6876\u91CC\u3002\u6CBF\u77F3\u8DEF\u56DE\u4E34\u6C60\u3002";
  if (pageQuery.get("minigame") === "rain-shadow") openDrawing(true);
  recallClue.hidden = !loadProgress().knowledge.includes("liuyuan-magnolia-slip");
  requestAnimationFrame(tick);
})();

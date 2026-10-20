import { TILE, TUNING, VIEW_H, VIEW_W } from './config.js';
import { createVariantCollation } from './ui/liuyuan-variant-collation.js';
import { canCollateLiuyuan, LIUYUAN_VARIANT_COLLATED } from './core/liuyuan-variant-collation.js';
import { chapterSceneHref } from './core/liuyuan-view-memory.js';
import { Engine } from './core/engine.js';
import { moveEntity } from './core/physics.js';
import { hasStoryFlag, loadProgress, markStoryFlag, type StoryFlag } from './core/progression.js';
import { buildFuxueMap, FUXUE_TILE_REGIONS, HOME_INTERACTIONS, type HomeInteraction, type HomeInteractionId } from './data/fuxue.js';
import {
  FUXUE_ACTOR_PROFILE,
  FUXUE_EFFECTS,
  FUXUE_GEOMETRY,
  validateFuxueGeometry,
} from './data/fuxue-geometry.js';
import { readFuxueGeometryDraft } from './data/geometry-draft.js';
import {
  drawFuxueGeometryDebug,
  drawFuxueOccluder,
  drawFuxueScene,
  drawFuxueWater,
  drawInteractionMark,
  drawShen,
} from './render/fuxue.js';
import { compareDepthLayers } from './render/occlusion.js';
import { drawPlayer } from './render/scene.js';
import { drawTileGeometryDebug } from './render/geometry-debug.js';

const canvas = document.getElementById('homeGame') as HTMLCanvasElement;
canvas.width = VIEW_W; canvas.height = VIEW_H;
const ctx = canvas.getContext('2d')!;
ctx.imageSmoothingEnabled = false;
const params = new URLSearchParams(location.search);
(document.getElementById('homeJournal') as HTMLAnchorElement).href=chapterSceneHref('journal.html');
(document.getElementById('homeCity') as HTMLAnchorElement).href=chapterSceneHref('sucheng.html');
const debugGeometry = params.get('debug') === 'geometry';

if (debugGeometry) {
  const geometryErrors = validateFuxueGeometry();
  if (geometryErrors.length) console.warn('[府学几何校验]', ...geometryErrors);
  else console.info('[府学几何校验] 通过');
  const editorLink = document.createElement('a');
  editorLink.href = 'geometry-editor.html';
  editorLink.textContent = '编辑几何轮廓';
  editorLink.title = '打开可拖拽的碰撞与遮挡轮廓编辑器';
  document.querySelector('.nav-actions')?.prepend(editorLink);
}

const ZOOM = 3;
const viewW = VIEW_W / ZOOM;
const viewH = VIEW_H / ZOOM;
const draft = debugGeometry && params.get('draft') === '1'
  ? readFuxueGeometryDraft()
  : null;
const data = buildFuxueMap(draft?.tileRegions ?? FUXUE_TILE_REGIONS);
const runtimeGeometry = draft?.geometry ?? FUXUE_GEOMETRY;
const runtimeObstacles = runtimeGeometry.flatMap((object) => object.colliders ?? []);
const runtimeOccluders = runtimeGeometry.flatMap((object) => object.occluder ? [object.occluder] : []);
const runtimeEffects = draft
  ? runtimeGeometry.flatMap((object) => object.effects ?? [])
  : FUXUE_EFFECTS;

if (debugGeometry && params.get('draft') === '1') {
  const previewNote = document.createElement('span');
  previewNote.className = 'geometry-draft-note';
  previewNote.textContent = draft ? '正在预览几何草稿' : '未找到草稿，显示正式版本';
  document.querySelector('.nav-actions')?.prepend(previewNote);
}
const worldW = data.w * TILE;
const worldH = data.h * TILE;
const engine = new Engine();
const player = { x: data.spawn.x, y: data.spawn.y, dir: 3, moving: false, wt: 0 };
const cam = {
  x: Math.max(0, Math.min(worldW - viewW, player.x - viewW / 2)),
  y: Math.max(0, Math.min(worldH - viewH, player.y - viewH / 2)),
};
let now = 0;
let dialogueOpen = false;
let oriented = hasStoryFlag(loadProgress(), 'home-orientation-complete');
let guMet = hasStoryFlag(loadProgress(), 'gu-met');
const canglangDone = loadProgress().completedTasks.includes('canglang-three-windows');

const objective = document.getElementById('homeObjective')!;
const prompt = document.getElementById('interactionPrompt') as HTMLElement;
const promptText = prompt.querySelector('span')!;
const dialogue = document.getElementById('homeDialogue') as HTMLElement;
const dialogueSpeaker = document.getElementById('dialogueSpeaker')!;
const dialogueLine = document.getElementById('dialogueLine')!;
const dialogueAside = document.getElementById('dialogueAside')!;
const dialogueNext = document.getElementById('dialogueNext') as HTMLButtonElement;
const dialogueChoices = document.getElementById('dialogueChoices') as HTMLElement;
const homeAlbum = document.getElementById('homeAlbum') as HTMLElement;
const albumWindows = document.getElementById('albumWindows')!;
const albumResult = document.getElementById('albumResult')!;
const albumClose = document.getElementById('albumClose') as HTMLButtonElement;

type Choice = { label: string; response: Beat[]; done?: () => void };
type Beat = { speaker: string; line: string; aside?: string; choices?: Choice[] };
let beats: Beat[] = [];
let beatIndex = 0;
let afterDialogue: (() => void) | null = null;
let albumOpen = false;
const variant=createVariantCollation(()=>{engine.clearInput();updateObjective();canvas.focus();},()=>interact('bookcase',true));
window.addEventListener('keydown',event=>variant.key(event));

const objectFlags: Partial<Record<HomeInteractionId, StoryFlag>> = {
  desk: 'home-desk-known',
  rubbings: 'home-rubbings-known',
  courtyard: 'home-courtyard-heard',
  gate: 'home-gate-known',
  bookcase: 'home-bookcase-book-known',
  corner: 'home-corner-leaf-known',
};

const known = new Set<HomeInteractionId>();
for (const [id, flag] of Object.entries(objectFlags) as Array<[HomeInteractionId, StoryFlag]>) {
  if (hasStoryFlag(loadProgress(), flag)) known.add(id);
}

function updateObjective(): void {
  if (canCollateLiuyuan(loadProgress()) && !loadProgress().knowledge.includes(LIUYUAN_VARIANT_COLLATED)) {
    objective.textContent='到斋舍书架，核一核叶上那个不同的字';
  } else if (canCollateLiuyuan(loadProgress()) && !oriented) {
    objective.textContent='异文已记入园谱。可回看这一程，再继续探索府学';
  } else if (canglangDone && !hasStoryFlag(loadProgress(), 'fuxue-first-return-seen')) {
    objective.textContent = '回斋舍，把三窗记录收入园谱';
  } else if (!oriented && !known.has('desk')) {
    objective.textContent = '先去西侧斋舍放下书箱';
  } else if (!oriented) {
    objective.textContent = '再认一认这座院子';
  } else if (!guMet) {
    objective.textContent = '到明伦堂院看看';
  } else if (!hasStoryFlag(loadProgress(), 'first-lesson-offered')) {
    objective.textContent = '查看明伦堂前压着的残页';
  } else {
    objective.textContent = '从西学门走进苏州';
  }
}

function openDialogue(nextBeats: Beat[], done?: () => void): void {
  beats = nextBeats;
  beatIndex = 0;
  afterDialogue = done ?? null;
  dialogueOpen = true;
  dialogue.hidden = false;
  prompt.hidden = true;
  renderDialogue();
  dialogueNext.focus();
}

function renderDialogue(): void {
  const beat = beats[beatIndex];
  dialogue.dataset.portrait = beat.speaker.includes('沈砚秋') || beat.speaker.includes('陌生学子')
    ? 'shen' : beat.speaker === '学子' ? 'player' : 'none';
  dialogueSpeaker.textContent = beat.speaker;
  dialogueLine.textContent = beat.line;
  dialogueAside.textContent = beat.aside ?? '';
  dialogueChoices.replaceChildren();
  const choices = beat.choices ?? [];
  dialogueChoices.hidden = choices.length === 0;
  dialogueNext.hidden = choices.length > 0;
  for (const choice of choices) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = choice.label;
    button.addEventListener('click', () => {
      beats = choice.response;
      beatIndex = 0;
      if (choice.done) afterDialogue = choice.done;
      renderDialogue();
    });
    dialogueChoices.append(button);
  }
  dialogueNext.textContent = beatIndex === beats.length - 1 ? '收起' : '继续';
}

function closeDialogue(): void {
  dialogueOpen = false;
  dialogue.hidden = true;
  const done = afterDialogue;
  afterDialogue = null;
  done?.();
  updateObjective();
  canvas.focus();
}

dialogueNext.addEventListener('click', () => {
  if (beatIndex < beats.length - 1) {
    beatIndex += 1;
    renderDialogue();
  } else closeDialogue();
});

function registerKnown(id: HomeInteractionId): Beat[] {
  const flag = objectFlags[id];
  if (flag) markStoryFlag(flag);
  known.add(id);
  const followup: Beat[] = [];
  const orientationCount = (['rubbings', 'courtyard', 'gate'] as HomeInteractionId[])
    .filter((item) => known.has(item)).length;
  if (!oriented && known.has('desk') && orientationCount >= 2) {
    oriented = true;
    markStoryFlag('shen-met');
    markStoryFlag('home-orientation-complete');
    followup.push({
      speaker: '沈砚秋',
      line: '我叫沈砚秋。砚台的砚，秋水的秋。往后若找不着路，先来院里寻我。只是我也未必总在这里。',
      aside: '院子没有弹出地图，却已经开始变得可以辨认。',
    });
    followup.push({ speaker: '沈砚秋', line: '我去交名册。清晨还早，你自己看看。', aside: '院子安静下来。没有新的任务卡。' });
  }
  return followup;
}

function chestContents(): string[] {
  const progress = loadProgress();
  const items: string[] = [];
  if (hasStoryFlag(progress, 'home-bookcase-book-known')) items.push('一册无名旧书');
  if (hasStoryFlag(progress, 'home-pages-known')) items.push('一叠空白课页');
  if (hasStoryFlag(progress, 'home-corner-leaf-known')) items.push('来处不明的旧纸');
  if (hasStoryFlag(progress, 'home-broken-leaf-seen')) items.push('一小片碎叶');
  if (hasStoryFlag(progress, 'home-teacher-letter-known')) items.push('一封没有写完的旧信');
  return items;
}

function openAlbumReturn(): void {
  albumOpen = true;
  homeAlbum.hidden = false;
  prompt.hidden = true;
  albumResult.textContent = '窗框还是空的，笔却是新添的。';
  albumClose.disabled = true;
  for (const button of albumWindows.querySelectorAll<HTMLButtonElement>('button[data-fragment]')) {
    delete button.dataset.placed;
    button.disabled = false;
  }
  albumWindows.querySelector<HTMLButtonElement>('button')?.focus();
}

albumWindows.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-fragment]');
  if (!button || button.dataset.placed === 'true') return;
  button.dataset.placed = 'true';
  button.disabled = true;
  const placed = albumWindows.querySelectorAll('[data-placed="true"]').length;
  albumResult.textContent = placed < 3
    ? `第${placed === 1 ? '一' : '二'}处景落进窗框。水色还没有连起来。`
    : '三处水景连起来，成了一段沿廊移动的长卷。';
  if (placed === 3) {
    albumClose.disabled = false;
    window.setTimeout(() => albumClose.focus(), TUNING.albumStrokeMs);
  }
});

albumClose.addEventListener('click', () => {
  if (albumClose.disabled) return;
  markStoryFlag('fuxue-first-return-seen');
  albumOpen = false;
  homeAlbum.hidden = true;
  openDialogue([
    { speaker: '园谱书案', line: '沧浪亭页的三扇空窗有了景。苏城东南，也浮出一点新墨。', aside: '数 · 观位初识　｜　网师园 · 新线索' },
  ]);
});

function interact(id: HomeInteractionId, otherBooks=false): void {
  if (id === 'shen') {
    openDialogue(oriented ? [
      { speaker: '沈砚秋', line: '明伦堂在北边。东面那重院门通向文庙，平日不要拿它当近路。', aside: '他一边说，一边给怀里的书重新理齐。' },
    ] : [
      { speaker: '陌生学子', line: '斋舍在西边。先把书箱放下，再自己看看。', aside: '他没有替你带路，只朝开着门的侧屋偏了偏头。' },
    ]);
    return;
  }

  if (id === 'desk') {
    const extra = registerKnown(id);
    if (canglangDone && !hasStoryFlag(loadProgress(), 'fuxue-first-return-seen')) {
      openDialogue([
        { speaker: '窗下书案', line: '窗框还是空的，笔却是新添的。', aside: '把三处水景亲手放回园谱。次序由你。' },
      ], openAlbumReturn);
    } else {
      openDialogue([
        { speaker: '沈砚秋', line: '这张案空着，你先用。' },
        { speaker: '沈砚秋', line: '窗纸是新换的，案角却旧。前一个人在这里磨过许多年墨。' },
        { speaker: '窗下书案', line: '你把书箱放稳了。', aside: '案角有一道被衣袖磨亮的弧。' },
        ...extra,
      ]);
    }
    return;
  }

  if (id === 'bed') {
    openDialogue([{ speaker: '斋舍床铺', line: '被褥晒过太阳，仍留着一点棉布和木头的气味。', aside: '歇息可以恢复心力，也会让府学的时辰向后推移。当前原型不结算数值。' }]);
    return;
  }
  if (id === 'chest') {
    const items = chestContents();
    openDialogue([{ speaker: '随身箱笼', line: items.length
      ? `箱中已经收着：${items.join('、')}。`
      : '换洗衣物、纸笔各归其处。箱底还空着，容得下几件真正想留下的东西。',
    aside: items.length ? '这些不是奖励清单，是你亲手带回来的东西。' : undefined }]);
    return;
  }
  if (id === 'rubbings') {
    const extra = registerKnown(id);
    openDialogue([
      { speaker: '卷起的拓片', line: '纸背透出高低不一的墨色。卷首压着一块小木牌，却没有写给新生看的说明。', aside: '等守碑人愿意让你动手，金石与《平江图》的线才会展开。' },
      ...extra,
    ]);
    return;
  }
  if (id === 'bookcase') {
    if (canCollateLiuyuan(loadProgress()) && !otherBooks) {
      engine.clearInput();variant.show(); return;
    }
    if (hasStoryFlag(loadProgress(), 'home-bookcase-book-known')) {
      openDialogue([{ speaker: '书架下层', line: '那处空位还斜着。无名旧书与空白课页已经收进你的箱笼。' }]);
    } else {
      openDialogue([
        { speaker: '书架下层', line: '最下一层斜塞着一册没有函套的书，书脊磨得发白。' },
        { speaker: '案头课页', line: '半叠课页只写了一半，笔迹不是你的。' },
        { speaker: '沈砚秋', line: '这本搁在这儿很久了。没人认领，你先收着。' },
        { speaker: '沈砚秋', line: '课页也带走——你总要写自己的。', aside: '你把书和课页一起收进了箱笼。' },
      ], () => {
        markStoryFlag('home-bookcase-book-known');
        markStoryFlag('home-pages-known');
        known.add('bookcase');
      });
    }
    return;
  }
  if (id === 'corner') {
    if (hasStoryFlag(loadProgress(), 'home-corner-leaf-known')) {
      openDialogue([{ speaker: '堂后檐角', line: '碎瓦仍旧潮着。那张对折的旧纸已经不在瓦缝里了。' }]);
    } else {
      openDialogue([
        { speaker: '堂后檐角', line: '檐角堆着几片碎瓦，比别处潮。' },
        { speaker: '堂后檐角', line: '瓦缝里压着一张对折的纸，边角被雨水泡软。' },
        { speaker: '学子', line: '纸上只有几笔水纹，没有落款，也没有地名。', aside: '你把那张纸收了起来。没有新任务出现。' },
      ], () => {
        markStoryFlag('home-corner-leaf-known');
        known.add('corner');
      });
    }
    return;
  }
  if (id === 'courtyard') {
    const extra = registerKnown(id);
    openDialogue([
      { speaker: '老树下', line: '墙外有人试了一句昆腔。只唱到半句，水声便把余音带远了。', aside: '你不知道声音来自哪一条巷子，只记住了它离这里并不近。' },
      ...extra,
    ]);
    return;
  }
  if (id === 'minglun') {
    if (!oriented) {
      openDialogue([{ speaker: '沈砚秋', line: '先生还没有来。先去斋舍把书箱安顿好。' }]);
    } else if (!guMet) {
      openDialogue([
        { speaker: '陌生师长', line: '“你看完了？”', aside: '有人从书架另一侧取走压纸的镇石。你这才发现，他一直在那里。' },
        { speaker: '顾惟清', line: '“没看完也好。先把这卷书放回架上。”', aside: '认得字，不一定认得它该在何处。今天他没有立刻给你课题。' },
      ], () => { guMet = true; markStoryFlag('gu-met'); });
    } else if (!hasStoryFlag(loadProgress(), 'first-lesson-offered')) {
      openDialogue([
        { speaker: '顾惟清', line: '府学东顾，草树之外有一带水。沧浪亭的园谱上，偏偏空着三扇窗。' },
        { speaker: '顾惟清', line: '沿复廊走一遍。先看，再对，最后把三处景合起来。', aside: '课一 · 数艺初修 · 观位' },
      ], () => markStoryFlag('first-lesson-offered'));
    } else if (canglangDone && hasStoryFlag(loadProgress(), 'fuxue-first-return-seen')) {
      openDialogue([
        { speaker: '明伦堂院', line: '镇纸挪了一寸，落在书的东南角。' },
        { speaker: '顾惟清', line: '窗，有没有动？', choices: [
          {
            label: '窗没动，是看的人挪了地方。',
            response: [
              { speaker: '顾惟清', line: '嗯。看的人挪了地方，画就跟着挪。' },
              { speaker: '顾惟清', line: '东南那边，你自己留意。' },
            ],
          },
          {
            label: '我还说不准，只知道三处景连成了一卷。',
            response: [
              { speaker: '顾惟清', line: '记着这句。往后你还会改一次。' },
              { speaker: '顾惟清', line: '东南那边，你自己留意。' },
            ],
          },
        ] },
      ]);
    } else {
      openDialogue([{ speaker: '明伦堂院', line: '案上的残页已经收好。顾先生没有催你，只将镇纸往苏城东南挪了一寸。' }]);
    }
    return;
  }
  if (id === 'gate') {
    const extra = registerKnown(id);
    if (!oriented) {
      openDialogue([{ speaker: '西学门', line: '先认得回来，再忙着出去。' }, ...extra]);
    } else if (!hasStoryFlag(loadProgress(), 'first-lesson-offered')) {
      openDialogue([{ speaker: '西学门', line: '街声就在门外，但今日的课题还没有落到你手里。' }]);
    } else {
      openDialogue([
        { speaker: '沈砚秋', line: '出这门往东，先见水，再见墙。沧浪亭不在街上，在水的南边。' },
        { speaker: '沈砚秋', line: '图只画了路。你看桥，别只看字。', aside: '展开《蘇城全圖》' },
      ], () => {
        markStoryFlag('city-map-introduced');
        location.href = 'sucheng.html';
      });
    }
  }
}

function nearestInteraction(): HomeInteraction | null {
  let best: HomeInteraction | null = null;
  let bestD: number = TUNING.homeInteractRadius;
  for (const item of HOME_INTERACTIONS) {
    const radius = item.id === 'corner' ? TUNING.cornerTriggerRadius : TUNING.homeInteractRadius;
    const d = Math.hypot(player.x - item.x, player.y - item.y);
    if (d < Math.min(bestD, radius)) { best = item; bestD = d; }
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
engine.onCancel = () => { if(variant.open) variant.hide(); else if (dialogueOpen) closeDialogue(); };
engine.onTap = engine.onInteract;
engine.attachKeys();
engine.attachTap(canvas);
engine.attachTouchControls(document.querySelector('[data-touch-controls]'));

function clamp(value: number, max: number): number {
  return Math.max(0, Math.min(max, value));
}

function draw(): void {
  const near = !dialogueOpen && !albumOpen && !variant.open ? nearestInteraction() : null;
  prompt.hidden = !near;
  if (near) promptText.textContent = near.label;

  // 背景、角色和前景共用同一整数相机，避免门檐裁片相对底图抖动/错位。
  const renderCam = { x: Math.round(cam.x), y: Math.round(cam.y) };

  ctx.fillStyle = '#242620';
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
      draw: () => drawFuxueOccluder(ctx, renderCam, occluder),
    })),
    { depthY: shen.y, order: 100, draw: () => drawShen(ctx, shen.x, shen.y, renderCam, now) },
    { depthY: player.y, order: 101, draw: () => drawPlayer(ctx, player, renderCam) },
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
      FUXUE_ACTOR_PROFILE,
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
      FUXUE_ACTOR_PROFILE,
    );
  } else player.wt = 0;

  const targetX = clamp(player.x - viewW / 2, worldW - viewW);
  const targetY = clamp(player.y - viewH / 2, worldH - viewH);
  cam.x += (targetX - cam.x) * TUNING.camLerp;
  cam.y += (targetY - cam.y) * TUNING.camLerp;
  draw();
});

updateObjective();
const forcedScene = params.get('scene');
const debugAt = params.get('at');
if (debugAt === 'gate-front') {
  player.x = 22.5 * TILE; player.y = 22 * TILE;
  canvas.focus();
} else if (debugAt === 'gate-under') {
  player.x = 22.5 * TILE; player.y = 20 * TILE;
  canvas.focus();
} else if (debugAt === 'gate') {
  player.x = 22.5 * TILE; player.y = 18.5 * TILE;
  canvas.focus();
} else if (debugAt === 'gate-inner') {
  player.x = 22.5 * TILE; player.y = 17 * TILE;
  canvas.focus();
} else if (debugAt === 'tree-back') {
  player.x = 20 * TILE; player.y = 11.5 * TILE;
  canvas.focus();
} else if (debugAt === 'tree-front') {
  player.x = 14.5 * TILE; player.y = 14.25 * TILE;
  canvas.focus();
} else if (debugAt === 'room-step') {
  player.x = 8.5 * TILE; player.y = 11.3 * TILE;
  canvas.focus();
} else if (debugAt === 'room-inside') {
  player.x = 8.5 * TILE; player.y = 9.75 * TILE;
  canvas.focus();
} else if (debugAt === 'bridge-north') {
  player.x = 29.5 * TILE; player.y = 11.2 * TILE;
  canvas.focus();
} else if (debugAt === 'bridge-center') {
  player.x = 29.5 * TILE; player.y = 12.5 * TILE;
  canvas.focus();
} else if (debugAt === 'bridge-south') {
  player.x = 29.5 * TILE; player.y = 13.8 * TILE;
  canvas.focus();
} else if (debugAt === 'room-bed-front') {
  player.x = 6.2 * TILE; player.y = 10.7 * TILE;
  canvas.focus();
} else if (debugAt === 'room-bed-back') {
  player.x = 7.5 * TILE; player.y = 9.75 * TILE;
  canvas.focus();
} else if (debugAt === 'hall-axis') {
  player.x = 22 * TILE; player.y = 7.5 * TILE;
  canvas.focus();
} else if (debugAt === 'corner') {
  player.x = 33 * TILE; player.y = 4.5 * TILE;
  canvas.focus();
} else if (forcedScene === 'briefing') {
  player.x = 22 * TILE; player.y = 8 * TILE;
  interact('minglun');
} else if (forcedScene === 'return') {
  player.x = 13 * TILE; player.y = 10 * TILE;
  interact('desk');
} else if (forcedScene === 'arrival' || (!oriented && !known.size && !canCollateLiuyuan(loadProgress()))) {
  openDialogue([
    { speaker: '沈砚秋', line: '斋舍在西边。先把书箱放下，再自己看看。', aside: '方向键或 WASD 行走；靠近物件时按 E。' },
  ]);
} else canvas.focus();

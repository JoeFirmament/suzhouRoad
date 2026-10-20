import { RAIN_FIELD, createRainShadow, startRainShadow, updateRainShadow, pauseRainShadow, rainBandHits, type RainBand } from '../src/core/liuyuan-rain-shadow.js';
import { drawRainShadow, RAIN_BACKGROUND_OPACITY } from '../src/render/liuyuan-rain-shadow.js';
import { drawRainAlbum, drawRainSketch, rainAlbumState, rainCatShadowMarks, drawRainCatPounceHint } from '../src/render/rain-shadow-vignettes.js';
import { rainTestInput } from './rain-shadow-test-input.js';
import { rainInkCells, drawRainInkMargins, drawRainGapHint, RAIN_INK } from '../src/render/rain-shadow-ink.js';
import { RAIN_VIEWPORT, rainDragDelta, drawRainViewport } from '../src/render/rain-shadow-viewport.js';

function assert(v: unknown, message: string): asserts v { if (!v) throw new Error(message); }
for (const axis of ['x','y'] as const) for (const sign of [-1,1])
  for (const position of [19.25,31.4,76,110.75,183.8,296.4,308])
    for (const quiet of [false,true]) {
      const band: RainBand = { axis, sign, from: position-sign*100*.4,
        age:1.4,warning:1,speed:100,gap:axis==='y'?78:76,opening:50 };
      const snapshot=JSON.stringify(band), cells=rainInkCells(band,quiet);
      const painted=new Set(cells.map(c=>`${c.x},${c.y}`));
      assert(painted.size===cells.length,'雨墨层不能重复绘制同一像素');
      for(const c of cells) assert(Number.isInteger(c.x)&&Number.isInteger(c.y)
        &&c.x>=RAIN_FIELD.left&&c.x<RAIN_FIELD.right&&c.y>=RAIN_FIELD.top&&c.y<RAIN_FIELD.bottom
        &&rainBandHits(band,c.x+.5,c.y+.5),'墨迹须裁切地面并与像素中心的实际危险判定一致');
      let dangerous=0;
      for(let y=RAIN_FIELD.top;y<RAIN_FIELD.bottom;y++) for(let x=RAIN_FIELD.left;x<RAIN_FIELD.right;x++)
        if(rainBandHits(band,x+.5,y+.5)) dangerous++;
      if(dangerous>500) assert(painted.size>dangerous*.06&&painted.size<dangerous*.38,
        '写意雨须有可读的密度与笔迹空白，不能退回填满矩形底墨');
      assert(snapshot===JSON.stringify(band),'墨迹变化不能写模拟状态');
      if(position===110.75) assert(cells.some(c=>c.color===RAIN_INK.ink)
        &&cells.some(c=>c.color===RAIN_INK.pale), '墨丝与少量淡色雨点要同时存在');
      band.age=.5;assert(rainInkCells(band,quiet).length===0,'预告期不提前画伤害雨');
    }
const commands: unknown[] = [];
const imageAlphas:number[]=[];
const ctx = new Proxy({ fillStyle: '', font: '', imageSmoothingEnabled: false,globalAlpha:1 }, {
  get(target, property) {
    if (property in target) return target[property as keyof typeof target];
    return (...args: unknown[]) => {
      if(property==='drawImage') imageAlphas.push(target.globalAlpha);
      return commands.push([property, target.fillStyle, ...args]);
    };
  },
}) as unknown as CanvasRenderingContext2D;
for(const quiet of [false,true]) {
  commands.length=0;drawRainInkMargins(ctx,4.2,quiet);
  assert(commands.length>0,'檐外须有原创枝叶层次');
  for(const command of commands as unknown[][]) {
    const [, , x,y,w,h]=command as [string,string,number,number,number,number];
    assert(Number.isInteger(x)&&Number.isInteger(y)&&w===1&&h===1
      &&(x<RAIN_FIELD.left||x>=RAIN_FIELD.right)&&y>=32&&y<RAIN_FIELD.bottom,
      '檐外枝叶不得遮盖可走地面、人物核心、雨缝与猫影');
  }
  commands.length=0;drawRainInkMargins(ctx,4.2,quiet);const frozen=JSON.stringify(commands);
  commands.length=0;drawRainInkMargins(ctx,4.2,quiet);
  assert(frozen===JSON.stringify(commands),'同一模拟时间的枝叶必须稳定');
}
commands.length=0;drawRainInkMargins(ctx,1,true);const still=JSON.stringify(commands);
commands.length=0;drawRainInkMargins(ctx,7,true);
assert(still===JSON.stringify(commands),'少动效枝叶不摆动，静态姿态仍保留');
for(const axis of ['x','y'] as const) for(const sign of [-1,1]) for(const age of [.2,1.4]) {
  const band:RainBand={axis,sign,from:axis==='y'?110:160,age,warning:1,speed:0,gap:axis==='y'?104:76,opening:50};
  commands.length=0;const before=JSON.stringify(band);drawRainGapHint(ctx,band);
  const marks=(commands as unknown[][]).filter(c=>c[0]==='fillRect');
  assert(marks.length>70&&before===JSON.stringify(band),'预告/运动都有纸伞及两侧短叶提示，不画长边框、不写模拟');
  assert(!(commands as unknown[][]).some(c=>c[0]==='fillText'),'纸伞替代文字，不在画面上标注雨缝');
  for(const command of marks) {
    const [, , x,y,w,h]=command as [string,string,number,number,number,number];
    assert(w===1&&h===1&&Math.abs((axis==='y'?x:y)-band.gap)<band.opening/2-3,
      '双叶提示须在有效雨缝内侧，不夸大安全范围');
  }
}
const artState=createRainShadow(false,true),art={complete:true,naturalWidth:1555,naturalHeight:1011} as HTMLImageElement;
imageAlphas.length=0;
commands.length=0;const artBefore=JSON.stringify(artState);drawRainShadow(ctx,artState,undefined,false,art);
assert(JSON.stringify(artState)===artBefore&&commands.some(c=>(c as unknown[])[0]==='drawImage'),
  '已加载的原创背景必须真正绘到画布，不改变比例/物理');
assert(imageAlphas.length===1&&imageAlphas[0]===RAIN_BACKGROUND_OPACITY
  &&RAIN_BACKGROUND_OPACITY<=.45&&ctx.globalAlpha===1,'只淡化背景，不能把猫、角色、雨墨和UI一起压淡');
assert(!(commands as unknown[][]).some(c=>c[0]==='fillRect'&&Number(c[4])>=150&&Number(c[5])>=100&&c[1]!=='#f0eee3'),
  '背景上不得重新覆盖大面积灰石板舞台/柱框');
commands.length=0;drawRainShadow(ctx,artState,undefined,false,{...art,naturalWidth:0} as HTMLImageElement);
assert(!commands.some(c=>(c as unknown[])[0]==='drawImage'),'背景加载失败要回退，不绘制坏图');
assert(JSON.stringify(commands).includes('#52584a'),'猫要有低饱和深墨轮廓，不能与背景同明度');
console.log('辨识度：仅背景40%墨色、前景不跟随淡化，纸伞无标字且不夸大雨缝，猫有墨边；无框写意雨裁切通过。');
assert(RAIN_VIEWPORT.width===1280&&RAIN_VIEWPORT.height===720&&RAIN_VIEWPORT.scale===3,
  '输出固定720P，整数放大逻辑空间，不增加窗口可走区域');
for(const [width,height] of [[1280,720],[960,540],[640,360],[320,180]]) {
  const delta=rainDragDelta(82*3*width/1280,-29*3*height/720,width,height);
  assert(Math.abs(delta.x-82)<1e-9&&Math.abs(delta.y+29)<1e-9,
    '不同显示尺寸的同一逻辑拖拽应得到相同目标，不改变速度/距离');
}
assert(rainDragDelta(10,10,0,0).x===0,'隐藏/零尺寸画布不能产生无限输入');
commands.length=0;drawRainViewport(ctx,artState,undefined,false,art);
assert((commands as unknown[][]).some(c=>c[0]==='scale'&&c[2]===3&&c[3]===3)
  &&(commands as unknown[][]).some(c=>c[0]==='translate'&&c[2]===160&&c[3]===48),
  '场景、纸伞、猫、雨滴共用同一720P投影，不能各自拉伸');
const fore={complete:true,naturalWidth:1555,naturalHeight:1011,src:'transparent-bamboo-test'} as HTMLImageElement;
const scholar={complete:true,naturalWidth:1400,naturalHeight:1430,src:'scholar-test'} as HTMLImageElement;
for(const y of [100,178]) {
  artState.y=y;commands.length=0;const before=JSON.stringify(artState);
  drawRainShadow(ctx,artState,scholar,false,art,fore);
  const draws=(commands as unknown[][]).filter(c=>c[0]==='drawImage');
  const foregroundIndex=draws.findIndex(c=>c[2]===fore),heroIndex=draws.findIndex(c=>c[2]===scholar);
  assert(foregroundIndex>=0&&heroIndex>=0&&(y<152?heroIndex<foregroundIndex:foregroundIndex<heroIndex),
    '脚点在竹子落地线后/前，须分别重绘前景/让角色居前');
  assert(before===JSON.stringify(artState)&&ctx.globalAlpha===1,'遮挡排序不改物理/HP，不把HUD压淡');
}
artState.phase='lost';artState.invulnerable=.4;artState.total=1.1;commands.length=0;
drawRainShadow(ctx,artState,scholar,false,art,fore);
assert(commands.some(c=>(c as unknown[])[0]==='drawImage'&&(c as unknown[])[2]===scholar),
  '失败/暂停不能冻结在受击闪烁的不可见帧，角色必须仍可见');
console.log('720P公平性与层次：不同显示尺寸拖拽等价、固定投影、竹前/竹后排序、失败不隐藏主角通过。');
const signatures = new Set<string>();
for (let i = 0; i < 6; i++) {
  commands.length = 0; drawRainSketch(ctx, i, 0, 0, 24, 22);
  signatures.add(JSON.stringify(commands));
}
assert(signatures.size === 6, '六幅原创画稿不能只换名称、实际画面相同');
for (const story of [false, true]) for (const quiet of [false, true]) {
  const s = createRainShadow(false, story); startRainShadow(s);
  for (let frame = 0; frame < 5000 && s.phase === 'running'; frame++) {
    updateRainShadow(s, .016, rainTestInput(s));
    const before = JSON.stringify(s);
    drawRainShadow(ctx, s, undefined, quiet); drawRainAlbum(ctx, s);
    assert(JSON.stringify(s) === before, '动效、画稿册不得修改移动、判定、回气、计时或奖励');
    if (s.collected && s.phase === 'running') assert(rainAlbumState(s).complete === s.round,
      '拾起但尚未撑过雨，不能显示成已入册');
    commands.length = 0;
  }
  assert(s.phase === 'won' && rainAlbumState(s).complete === (story ? 1 : 6)
    && rainAlbumState(s).held === null, '剧情单页与底层六折的完成数量必须分别正确');
  const before = JSON.stringify(s); drawRainShadow(ctx, s, undefined, quiet);
  assert(JSON.stringify(s) === before, '结束演出不得推进游戏或发奖');
}
const paused = createRainShadow(); startRainShadow(paused); updateRainShadow(paused, .1, { x: 1, y: 0 });
pauseRainShadow(paused);
commands.length = 0; drawRainShadow(ctx, paused); const first = JSON.stringify(commands);
commands.length = 0; drawRainShadow(ctx, paused);
assert(JSON.stringify(commands) === first, '暂停时演出也必须冻结，不能用实时时钟继续播放');
assert(!ctx.imageSmoothingEnabled, '必须保留像素边缘');
const catPause=createRainShadow(false,true);startRainShadow(catPause);catPause.collected=true;catPause.rainTime=2.39;
updateRainShadow(catPause,.016,{x:0,y:0});pauseRainShadow(catPause);
assert(catPause.cat,'绘制回归必须包含已生成的真实猫扑');
for(const quiet of [false,true]) {
  const snapshot=JSON.stringify(catPause);commands.length=0;drawRainShadow(ctx,catPause,undefined,quiet);
  const firstCat=JSON.stringify(commands);
  assert(firstCat.includes('#a69c86') && !firstCat.includes('#947047'),
    '少动效保留明确的落点猫影，不恢复旧褐色直线');
  commands.length=0;drawRainShadow(ctx,catPause,undefined,quiet);
  assert(JSON.stringify(commands)===firstCat && JSON.stringify(catPause)===snapshot,'猫扑暂停演出冻结且不改模拟');
}
for (const [fromX,fromY,toX,toY] of [[160,100,230,100],[160,100,90,100],
  [160,100,160,165],[160,100,160,40],[52,36,28,36],[290,154,290,178]]) {
  const cat={fromX,fromY,toX,toY,age:.2,warning:1,speed:175};
  const marks=rainCatShadowMarks(cat),last=marks[marks.length-1];
  assert(last.x===toX && last.y===toY && marks.length>=1 && marks.length<=3,
    '四方向/贴边短扑的最后猫影中心必须是已锁定落点');
  for(const quiet of [false,true]) {
    commands.length=0;const before=JSON.stringify(cat);drawRainCatPounceHint(ctx,cat,quiet);
    assert(commands.length>0 && before===JSON.stringify(cat),'两种动效模式都绘制猫影，且只读');
    for(const command of commands as unknown[][]) {
      const [, , x,y,w,h]=command as [string,string,number,number,number,number];
      assert(Number.isInteger(x)&&Number.isInteger(y)&&w===1&&h===1
        &&x>=RAIN_FIELD.left&&x<RAIN_FIELD.right&&y>=RAIN_FIELD.top&&y<RAIN_FIELD.bottom,
        '猫影按逻辑像素绘制且不越出地面，不压到墙/屋檐');
    }
  }
  cat.age=cat.warning;commands.length=0;drawRainCatPounceHint(ctx,cat);
  assert(commands.length===0,'实体扑出后预告猫影撤去，不能留下假危险');
}
console.log('猫影预告：四向与贴边落点一致、整数像素/地面裁切、少动效不隐藏、扑出后撤影且绘制不改模拟通过。');
const landing=createRainShadow(false,true);landing.phase='paused';landing.collected=true;
landing.cat={fromX:30,fromY:128,toX:78,toY:128,age:1.4,warning:1,speed:175};
landing.x=120;landing.y=90;
commands.length=0;const landingBefore=JSON.stringify(landing);drawRainShadow(ctx,landing);
assert(JSON.stringify(commands).includes('咦？') && JSON.stringify(landing)===landingBefore,
  '落地歪头反应应可见，但不能移动猫、修改HP或复活碰撞');
commands.length=0;drawRainShadow(ctx,landing,undefined,true);
assert(!JSON.stringify(commands).includes('咦？'),'少动效略去装饰反应，不取消实体猫或玩法提示');
console.log('抢画画面：六稿不同、剧情单页/底层六折、已捡/入册分离、普通/少动效不改状态、暂停演出冻结通过。');

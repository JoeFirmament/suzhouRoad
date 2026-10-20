import {
  guanyunStudyHref, safeStoneForestReturnFoot, stoneForestPrevious, stoneForestReturnHref, windowStudyHref,
} from '../src/core/liuyuan-research-link.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
const entry = { x: 525, y: 390 };
const outbound = windowStudyHref({ x: 530.25, y: 395.5 }, true, true);
const returnHref = stoneForestReturnHref(outbound.slice(outbound.indexOf('?')));
assert(returnHref?.startsWith('liuyuan-stone-forest.html?'), '研究支线须有固定返回场景');
assert(returnHref?.includes('draft=1'), '编辑器草稿预览须在往返后继续生效');
assert(returnHref?.includes('parent=return-walk'), '嵌套研究往返须保留最初圆门片段来源');
const foot = safeStoneForestReturnFoot(returnHref!.slice(returnHref!.indexOf('?')), entry, () => false);
assert(foot?.x === 530.25 && foot.y === 395.5, '返回须保留离开前脚点');
assert(!safeStoneForestReturnFoot('?researchFrom=window-study&returnX=1200&returnY=390', entry, () => false),
  '远离观察点的 URL 不得成为任意传送');
assert(!safeStoneForestReturnFoot('?researchFrom=window-study&returnX=NaN&returnY=390', entry, () => false),
  '非数字坐标必须拒绝');
assert(!safeStoneForestReturnFoot('?researchFrom=window-study&returnX=530&returnY=395', entry, () => true),
  '碰撞内脚点不得恢复');
assert(!safeStoneForestReturnFoot('?researchFrom=stone-forest&returnX=530&returnY=395', entry, () => false),
  '错误来源不得恢复');
assert(stoneForestReturnHref('?debug=geometry') === null, '独立打开不能伪造返回入口');
const directPrevious = stoneForestPrevious('?debug=geometry&draft=1');
assert(!directPrevious.fromReturnWalk && directPrevious.href.startsWith('geometry-editor.html?scene='),
  '独立石林研究不能默认跳进花房章节');
const east = { x: 1635, y: 530 };
const guanyunOutbound = guanyunStudyHref({ x: 1630, y: 535 }, true, true);
const guanyunBack = stoneForestReturnHref(guanyunOutbound.slice(guanyunOutbound.indexOf('?')), 'guanyun-study');
const nestedPrevious = stoneForestPrevious(guanyunBack?.slice(guanyunBack.indexOf('?')) ?? '');
assert(nestedPrevious.fromReturnWalk && nestedPrevious.href.includes('researchFrom=stone-forest')
  && nestedPrevious.href.includes('draft=1'), '经冠云峰返石林后仍须回原圆门研究与草稿');
assert(guanyunBack?.includes('researchFrom=guanyun-study') && guanyunBack.includes('parent=return-walk')
  && guanyunBack.includes('draft=1'), '东园研究剪接须保留来源与草稿');
const eastFoot = safeStoneForestReturnFoot(guanyunBack!.slice(guanyunBack!.indexOf('?')),
  east, () => false, 'guanyun-study');
assert(eastFoot?.x === 1630 && eastFoot.y === 535, '东园返回须恢复石林东侧脚点');
assert(!safeStoneForestReturnFoot(guanyunBack!.slice(guanyunBack!.indexOf('?')),
  entry, () => false), '东园返场不能冒充三窗轩前脚点');
assert(!safeStoneForestReturnFoot('?researchFrom=guanyun-study&returnX=500&returnY=390',
  east, () => false, 'guanyun-study'), '东园研究返场不得跨图跳到石林西侧');
assert(!safeStoneForestReturnFoot(guanyunBack!.slice(guanyunBack!.indexOf('?')),
  east, () => true, 'guanyun-study'), '东园返场不能落在用户草稿碰撞内');
console.log('留园石林—三窗／冠云峰研究剪接：往返脚点、来源、范围、草稿与碰撞校验通过。');

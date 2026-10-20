import { CORRIDOR_ROUTE } from './corridor-geometry.js';
import { LIUYUAN_WINDOW_ROOM_FEET, LIUYUAN_WINDOW_ROOM_SPAWN } from './liuyuan-window-room-study.js';
import { LIUYUAN_YOUYICUN_FEET, LIUYUAN_YOUYICUN_SPAWN } from './liuyuan-youyicun-study.js';
import { LIUYUAN_FLOWER_WORKER_STAND } from './liuyuan-flower-study.js';
import { LIUYUAN_ENTRY_OBLIQUE_FEET } from './liuyuan-entry-oblique-study.js';
import { LIUYUAN_ENTRY_LOWER_FEET, LIUYUAN_ENTRY_LOWER_NPC_FEET } from './liuyuan-entry-lower-camera-study.js';

/** New scene plates are editor sources, not approved runtime geometry. */
export interface SceneStoryAnchor {
  id: string;
  x: number;
  y: number;
  label: string;
  kind: 'interaction' | 'trigger' | 'npc' | 'visual' | 'boundary';
  scriptRef: string;
  note: string;
  /** Research-only staging markers may be visible but are not CH3 route actions. */
  routeRequired?: boolean;
}

export interface SceneRouteNode {
  id: string;
  x: number;
  y: number;
  label: string;
  kind: 'entry' | 'portal' | 'waypoint' | 'goal';
  level?: number; // 0 = ground, 1+ = upper gallery / rockery walk; not screen y.
  anchorId?: string;
  note: string;
}

export interface SceneRouteEdge {
  from: string;
  to: string;
  state: 'candidate' | 'confirmed' | 'blocked';
  via?: 'walk' | 'stairs' | 'bridge';
  note: string;
}

export interface SceneRouteGraph {
  nodes: SceneRouteNode[];
  edges: SceneRouteEdge[];
}

export interface ScenePlate {
  id: string;
  label: string;
  asset: string;
  width: number;
  height: number;
  tileW: number;
  tileH: number;
  note: string;
  storyAnchors?: readonly SceneStoryAnchor[];
  routeGraph?: SceneRouteGraph;
}

const SCENE_PLATES_BASE: readonly ScenePlate[] = [
  {
    id: 'canglang-whole-garden-study-v2', label: '沧浪亭全园 · 灰绿视觉试稿 v2',
    asset: '../assets/scene25d/canglang-whole-garden-study-v2.png',
    width: 1120, height: 1408, tileW: 70, tileH: 88,
    note: '保留导览图的南桥、西南园外水、中央山林与北侧建筑群；按全园统一灰绿石色重绘。复廊双通道、厅堂门位及桥头—山径的实际可走关系仍未通过验收；仅供视觉对比和剧本锚点标定，不得作为正式碰撞底图。旧 v1 与其浏览器草稿保留。',
    storyAnchors: [
      { id: 'canglang-v2-south-bridge', x: 675, y: 1165, label: '隔水入园', kind: 'trigger', scriptRef: 'CH1-02/03', note: '桥与园外水关系为现状导览图依据；桥头站位与晚清细部待复核。' },
      { id: 'canglang-v2-hill', x: 480, y: 660, label: '山林初见', kind: 'visual', scriptRef: 'CH1-03', note: '入园先感到山与墙，不弹全景说明；具体树位不作史实。' },
      { id: 'canglang-v2-corridor', x: 275, y: 790, label: '外水内山 · 复廊', kind: 'trigger', scriptRef: 'CH1-03/04', note: '此处只是剧本定位。双侧廊道的地面尚不清晰，不能沿生成图直接铺可走网格；三窗为艺术加工。' },
      { id: 'canglang-v2-north-halls', x: 390, y: 420, label: '堂馆区', kind: 'visual', scriptRef: 'CH1-03', note: '堂馆分区依园林局概述；单座建筑名称、门位和晚清状态待平面与史料逐一核准。' },
    ],
  },
  {
    id: 'canglang-whole-garden-study', label: '沧浪亭全园 · 旧试稿 v1（保留草稿）',
    asset: '../assets/scene25d/canglang-whole-garden-study-v1.png',
    width: 1120, height: 1408, tileW: 70, tileH: 88,
    note: '参照沧浪亭全景导览图及实景照转译；厅堂门路、复廊双通道和南门动线仍需人工核对。仅作编辑器标定底图，不是正式关卡。',
  },
  {
    id: 'canglang-corridor', label: '沧浪亭 · 复廊近景英雄场景（可玩底图）',
    asset: '../assets/canglang/corridor-hero-v4-motifs.png',
    width: 793, height: 496, tileW: 50, tileH: 31,
    note: '与 corridor.html 同一张近景图，以 793×496 逻辑坐标标注三窗、路线与水纹。正式试玩使用受约束中心线和细小横向微调，不使用普通 Tile 自由行走；编辑器草稿先供人工核图，尚不自动替换该页玩法数据。各窗纹样参考沧浪亭花窗类型作差异化演绎，右上柿树为艺术配置；三窗位置、具体纹样序列与树位不得标作历史原貌。',
    storyAnchors: [
      { id: 'cl-corridor-window-1', x: 153, y: 275, label: '第一窗 · 看', kind: 'interaction', scriptRef: 'CH1-04', note: '游戏窗位；脚点沿廊线，不在水面；窗纹取冰裂系作像素转译。' },
      { id: 'cl-corridor-window-2', x: 314, y: 274, label: '第二窗 · 对', kind: 'interaction', scriptRef: 'CH1-04', note: '艺术加工的中段取景点；窗纹取花瓶系作像素转译。' },
      { id: 'cl-corridor-window-3', x: 489, y: 278, label: '第三窗 · 合', kind: 'interaction', scriptRef: 'CH1-04', note: '艺术加工的末段取景点；窗纹取荷花系作像素转译。' },
    ],
    routeGraph: {
      nodes: CORRIDOR_ROUTE.map((point, index) => ({
        id: `cl-corridor-route-${index + 1}`, x: point.x, y: point.y,
        label: index === 0 ? '西端入廊' : index === CORRIDOR_ROUTE.length - 1 ? '东端止步' : `廊线 ${index + 1}`,
        kind: index === 0 ? 'entry' as const : index === CORRIDOR_ROUTE.length - 1 ? 'goal' as const : 'waypoint' as const,
        anchorId: index >= 1 && index <= 3 ? `cl-corridor-window-${index}` : undefined,
        note: '仅对齐当前试玩中心线；编辑器改动不自动改写游戏受约束运动。',
      })),
      edges: CORRIDOR_ROUTE.slice(1).map((_, index) => ({
        from: `cl-corridor-route-${index + 1}`, to: `cl-corridor-route-${index + 2}`,
        state: 'candidate' as const, via: 'walk' as const,
        note: '候选标注线；游戏仍以代码中的受约束路径为准。',
      })),
    },
  },
  {
    id: 'wangshi-whole-garden-study', label: '网师园宅园 · 待校准底图',
    asset: '../assets/scene25d/wangshi-whole-garden-study-v1.png',
    width: 1248, height: 1248, tileW: 78, tileH: 78,
    note: '参照全园平面及实景：东部住宅、西部池园和内园均保留。房间出入口、后门及 1890 年状态仍待人工核对；不是正式关卡。',
  },
  {
    id: 'liuyuan-tree-court-no-water-study-v1', label: '留园 · 古木交柯小庭游戏试走 v1',
    asset: '../assets/scene25d/liuyuan-tree-court-no-water-study-v1.png',
    width: 1776, height: 896, tileW: 111, tileH: 56,
    note: '局部游戏场景试走版：本幕不画园外河道，也不提前展示园内中池；代码已按图面铺庭院/西廊 Tile、封墙与花台、拆前景屋檐遮挡。CH3 入口放桶后可剪接进此切片，走到西廊尽头再剪接绿荫轩；剪接只表示空间先后，不声称两幕已按历史门洞坐标拼接。北墙六漏窗与西向曲廊只取现状关系；树形、窗格、墙位、铺地尺寸均未作 1890 断代或实测核对，不得作正式关卡。旧入口白模草稿不迁移。',
    storyAnchors: [
      { id: 'ly-court-v1-windows', x: 1180, y: 365, label: '北墙六漏窗（视觉候选）', kind: 'visual', scriptRef: 'CH3-04', note: '六窗数目据现状文字；窗格样式和 1890 年存貌未核，不许穿窗。' },
      { id: 'ly-court-v1-window-foot', x: 1160, y: 615, label: '停步隔窗看', kind: 'interaction', scriptRef: 'CH3-04', note: '这是站在花台南侧的游戏观察脚点，不是窗的真实历史站位；不弹导游式说明卡。' },
      { id: 'ly-court-v1-west-passage', x: 340, y: 420, label: '向西走的窄廊（候选）', kind: 'boundary', scriptRef: 'CH3-04', note: '此幕不见水；下一幕才从绿荫轩方向打开中部池园。确切转角和门位尚待平面及照片标定。' },
    ],
    routeGraph: {
      nodes: [
        { id: 'court-entry', x: 1600, y: 680, label: '小庭东侧', kind: 'entry', note: '局部切片出生点；与入口白模的接点待标定。' },
        { id: 'window-foot', x: 1160, y: 615, label: '隔窗停步', kind: 'waypoint', anchorId: 'ly-court-v1-window-foot', note: '在花台南侧看，不穿窗。' },
        { id: 'court-middle', x: 880, y: 635, label: '小庭铺地', kind: 'waypoint', note: '可绕行而非沿任务箭头。' },
        { id: 'west-turn', x: 650, y: 610, label: '转向西廊', kind: 'waypoint', note: '与屋檐前景分层。' },
        { id: 'passage-mouth', x: 440, y: 535, label: '窄廊口', kind: 'waypoint', note: '脚下铺地必须连续。' },
        { id: 'passage-bend', x: 340, y: 420, label: '西廊中段', kind: 'waypoint', anchorId: 'ly-court-v1-west-passage', note: '墙与廊相邻，仍未核真实转角。' },
        { id: 'court-west-exit', x: 330, y: 305, label: '西廊尽头', kind: 'goal', note: '局部场景止步点；下一场景才可见园内中池。' },
      ],
      edges: [
        ['court-entry', 'window-foot'], ['window-foot', 'court-middle'],
        ['court-middle', 'west-turn'], ['west-turn', 'passage-mouth'],
        ['passage-mouth', 'passage-bend'], ['passage-bend', 'court-west-exit'],
      ].map(([from, to]) => ({ from, to, state: 'candidate' as const, via: 'walk' as const,
        note: '只确认当前试走图上的脚点路径；门墙历史坐标未核。' })),
    },
  },
  {
    id: 'liuyuan-lvyin-pond-study-v1', label: '留园 · 绿荫轩临池游戏试走 v1',
    asset: '../assets/scene25d/liuyuan-lvyin-pond-study-v1.png',
    width: 1776, height: 896, tileW: 111, tileH: 56,
    note: '临池试切片：依据园林局所述绿荫轩临中部池园及古木交柯后西折的现状关系。CH3 模式可由小庭西廊尽头镜头剪接到本切片，但尚未按实际门洞坐标拼接。东侧干路、敞轩与同一片池水可试走；栏杆、柱位、植栽和历史门位尚未实测，不能当作 1890 复原或正式通关图。',
    storyAnchors: [
      { id: 'ly-lvyin-east-entry', x: 1660, y: 740, label: '由东侧石路入', kind: 'boundary', scriptRef: 'CH3-04', note: '玩法接入脚点；CH3 模式可剪接至此，但与前一幕实际门洞尚未对齐。' },
      { id: 'ly-lvyin-bank', x: 930, y: 690, label: '中池初见', kind: 'interaction', scriptRef: 'CH3-04', note: '玩家亲走至此再完整见池；不是园外河。' },
      { id: 'ly-lvyin-pavilion', x: 250, y: 470, label: '绿荫轩临水处', kind: 'interaction', scriptRef: 'CH3-04', note: '临水敞轩的现状关系有据；柱脚和栏位是视觉候选。' },
    ],
    routeGraph: {
      nodes: [
        { id: 'lvyin-entry', x: 1660, y: 740, label: '东侧石路', kind: 'entry', anchorId: 'ly-lvyin-east-entry', note: '独立切片出生点。' },
        { id: 'lvyin-east-bank', x: 1380, y: 730, label: '池东南石路', kind: 'waypoint', note: '水岸之外的干路。' },
        { id: 'lvyin-bank', x: 930, y: 690, label: '临池停步', kind: 'waypoint', anchorId: 'ly-lvyin-bank', note: '栏内地面。' },
        { id: 'lvyin-west-paving', x: 590, y: 665, label: '轩前石路', kind: 'waypoint', note: '靠南绕开池栏。' },
        { id: 'lvyin-steps', x: 405, y: 575, label: '轩前台阶', kind: 'waypoint', note: '与亭柱落地范围分开。' },
        { id: 'lvyin-pavilion', x: 250, y: 470, label: '绿荫轩', kind: 'goal', anchorId: 'ly-lvyin-pavilion', note: '可站立的敞轩地面。' },
      ],
      edges: [
        ['lvyin-entry', 'lvyin-east-bank'], ['lvyin-east-bank', 'lvyin-bank'],
        ['lvyin-bank', 'lvyin-west-paving'], ['lvyin-west-paving', 'lvyin-steps'],
        ['lvyin-steps', 'lvyin-pavilion'],
      ].map(([from, to]) => ({ from, to, state: 'candidate' as const, via: 'walk' as const,
        note: '仅为当前视觉试稿的游戏路线；实景栏位与历史门位尚未验收。' })),
    },
  },
  {
    id: 'liuyuan-guanyun-court-study-v2', label: '留园 · 冠云峰／林泉耆硕之馆 v2（研究候选）',
    asset: '../assets/scene25d/liuyuan-guanyun-court-study-v2.png',
    width: 1536, height: 1024, tileW: 96, tileH: 64,
    note: '按园林局资料校正为南侧林泉耆硕之馆—浣云沼—冠云峰—北侧冠云楼，南厅檐廊纳入画面。建筑具体外观、左右亭廊门位、池岸和植栽尚未实测；仅独立试走，不接 CH3 正式结算。v1 开放前庭仅作误差对照。',
    storyAnchors: [
      { id: 'ly-guanyun-v2-hall', x: 757, y: 941, label: '林泉耆硕之馆北向廊下（候选）', kind: 'boundary', scriptRef: 'CH3-06', note: '此建筑在冠云峰南侧的关系有官方资料依据；本图廊柱与门位非实测。' },
      { id: 'ly-guanyun-v2-view', x: 758, y: 638, label: '厅北临沼望峰', kind: 'interaction', scriptRef: 'CH3-06', note: '从南侧经沼望峰再见北楼；水岸形状待核。' },
      { id: 'ly-guanyun-v2-left', x: 361, y: 414, label: '西岸路候选', kind: 'boundary', scriptRef: 'CH3-06', note: '只供图面试走，不认定历史门位。' },
      { id: 'ly-guanyun-v2-right', x: 1180, y: 405, label: '东岸路候选', kind: 'boundary', scriptRef: 'CH3-06', note: '只供图面试走，不认定历史门位。' },
    ],
    routeGraph: {
      nodes: [
        { id: 'g2-hall', x: 757, y: 941, label: '南厅北向廊下', kind: 'entry', anchorId: 'ly-guanyun-v2-hall', note: '独立试走出生点。' },
        { id: 'g2-passage', x: 757, y: 724, label: '南厅檐下', kind: 'waypoint', note: '屋檐遮挡路径。' },
        { id: 'g2-view', x: 758, y: 638, label: '沼前赏峰', kind: 'waypoint', anchorId: 'ly-guanyun-v2-view', note: '站在水南的铺地。' },
        { id: 'g2-west-terrace', x: 379, y: 664, label: '西侧转弯', kind: 'waypoint', note: '绕开水沼左端。' },
        { id: 'g2-west-bank', x: 361, y: 414, label: '西岸路', kind: 'goal', anchorId: 'ly-guanyun-v2-left', note: '暂不指定通往何门。' },
        { id: 'g2-east-terrace', x: 1160, y: 665, label: '东侧转弯', kind: 'waypoint', note: '绕开水沼右端。' },
        { id: 'g2-east-bank', x: 1180, y: 405, label: '东岸路', kind: 'goal', anchorId: 'ly-guanyun-v2-right', note: '暂不指定通往何门。' },
      ],
      edges: [
        ['g2-hall','g2-passage'], ['g2-passage','g2-view'],
        ['g2-view','g2-west-terrace'], ['g2-west-terrace','g2-west-bank'],
        ['g2-view','g2-east-terrace'], ['g2-east-terrace','g2-east-bank'],
      ].map(([from,to]) => ({ from,to,state:'candidate' as const,via:'walk' as const,
        note:'只验证研究图的可走脚点，不认定晚清门洞。' })),
    },
  },
  {
    id: 'liuyuan-guanyun-court-study-v1', label: '留园 · 冠云峰前院 v1（研究候选）',
    asset: '../assets/scene25d/liuyuan-guanyun-court-study-v1.png',
    width: 1536, height: 1024, tileW: 96, tileH: 64,
    note: '旧版误差对照：缺少南侧林泉耆硕之馆的围合，北侧冠云楼也画得像一层厅堂。v2 已改构图；本版仍保留编辑器草稿，不得作为正式实景场景。',
    storyAnchors: [
      { id: 'ly-guanyun-entry', x: 535, y: 904, label: '前院入口候选', kind: 'boundary', scriptRef: 'CH3-06', note: '图面脚点，并非历史门洞。' },
      { id: 'ly-guanyun-view', x: 790, y: 856, label: '浣云沼前望冠云峰', kind: 'interaction', scriptRef: 'CH3-06', note: '峰、沼、后方建筑关系见园林局现状资料；精确位置未核。' },
      { id: 'ly-guanyun-left', x: 155, y: 725, label: '西岸路候选', kind: 'boundary', scriptRef: 'CH3-06', note: '只验证图面左侧干路。' },
      { id: 'ly-guanyun-right', x: 1455, y: 726, label: '东岸路候选', kind: 'boundary', scriptRef: 'CH3-06', note: '只验证图面右侧干路。' },
    ],
    routeGraph: {
      nodes: [
        { id: 'guanyun-entry', x: 535, y: 904, label: '前庭', kind: 'entry', anchorId: 'ly-guanyun-entry', note: '独立切片出生点。' },
        { id: 'guanyun-view', x: 790, y: 856, label: '临沼赏石', kind: 'waypoint', anchorId: 'ly-guanyun-view', note: '沼前铺地的观察点。' },
        { id: 'guanyun-left-bend', x: 290, y: 851, label: '西侧转弯', kind: 'waypoint', note: '避开前景石堆。' },
        { id: 'guanyun-left', x: 155, y: 725, label: '西岸路', kind: 'goal', anchorId: 'ly-guanyun-left', note: '候选侧路，非真实门位。' },
        { id: 'guanyun-right-bend', x: 1350, y: 890, label: '东侧转弯', kind: 'waypoint', note: '从前庭绕向右岸。' },
        { id: 'guanyun-right-bank', x: 1480, y: 855, label: '东岸脚', kind: 'waypoint', note: '先绕过岸石，再向北走。' },
        { id: 'guanyun-right', x: 1455, y: 726, label: '东岸路', kind: 'goal', anchorId: 'ly-guanyun-right', note: '候选侧路，非真实门位。' },
      ],
      edges: [
        ['guanyun-entry','guanyun-view'], ['guanyun-entry','guanyun-left-bend'],
        ['guanyun-left-bend','guanyun-left'], ['guanyun-view','guanyun-right-bend'],
        ['guanyun-right-bend','guanyun-right-bank'], ['guanyun-right-bank','guanyun-right'],
      ].map(([from,to]) => ({ from,to,state:'candidate' as const,via:'walk' as const,
        note:'仅为生成图的玩法候选通路；不是实景或晚清门路定位。' })),
    },
  },
  {
    id: 'liuyuan-dongtian-three-windows-study-v1', label: '留园 · 洞天一碧三窗辨影（研究切片）',
    asset: '../research-art/liuyuan-dongtian-three-windows-game-study-v2.png',
    width: 960, height: 544, tileW: 60, tileH: 34,
    note: '用本地图版所载三面环墙、中扁八角及两侧六角、东竹西蕉制作的独立游戏化房间。美术图原始像素 1672×941，只在此编辑器与小样页缩放到 960×544 世界坐标。前景地面可走；墙角、铺地、窗距、入口与清末存貌未测绘，不连 CH3 正式门路。编辑器草稿只供本幕试走。',
    storyAnchors: [
      { id: 'ly-dongtian-west-banana', ...LIUYUAN_WINDOW_ROOM_FEET.west,
        label: '西窗 · 蕉影', kind: 'interaction', scriptRef: 'CH3-06 研究候选',
        note: '同形六角窗之一；脚点是为游戏绘制的可达站位，不是实测位置。' },
      { id: 'ly-dongtian-middle-stone', ...LIUYUAN_WINDOW_ROOM_FEET.middle,
        label: '中窗 · 石与藤', kind: 'interaction', scriptRef: 'CH3-06 研究候选',
        note: '扁八角窗只用于校方向；现状窗后石藤有图版，清末状态仍未核。' },
      { id: 'ly-dongtian-east-bamboo', ...LIUYUAN_WINDOW_ROOM_FEET.east,
        label: '东窗 · 竹影', kind: 'interaction', scriptRef: 'CH3-06 研究候选',
        note: '另一孔六角窗；东竹的方位来自本地检索原文，未作同期断代。' },
    ],
    routeGraph: {
      nodes: [
        { id: 'dongtian-room-spawn', ...LIUYUAN_WINDOW_ROOM_SPAWN,
          label: '屋内铺地', kind: 'entry', note: '独立小样出生脚点；非历史入口。' },
        { id: 'dongtian-west', ...LIUYUAN_WINDOW_ROOM_FEET.west,
          label: '西窗前', kind: 'goal', anchorId: 'ly-dongtian-west-banana', note: '赴蕉影观察。' },
        { id: 'dongtian-middle', ...LIUYUAN_WINDOW_ROOM_FEET.middle,
          label: '中窗前', kind: 'waypoint', anchorId: 'ly-dongtian-middle-stone', note: '从石藤校方向。' },
        { id: 'dongtian-east', ...LIUYUAN_WINDOW_ROOM_FEET.east,
          label: '东窗前', kind: 'goal', anchorId: 'ly-dongtian-east-bamboo', note: '赴竹影观察。' },
      ],
      edges: [
        { from: 'dongtian-room-spawn', to: 'dongtian-middle', state: 'candidate', via: 'walk', note: '图面可走，不证明真实入口。' },
        { from: 'dongtian-middle', to: 'dongtian-west', state: 'candidate', via: 'walk', note: '同室窗前铺地，历史铺装未核。' },
        { from: 'dongtian-middle', to: 'dongtian-east', state: 'candidate', via: 'walk', note: '同室窗前铺地，历史铺装未核。' },
      ],
    },
  },
  {
    id: 'liuyuan-youyicun-transition-study-v1', label: '留园 · 现状圆门几何（旧游线待核）',
    asset: '../research-art/liuyuan-youyicun-transition-pixel-study-v1.png',
    width: 1536, height: 1024, tileW: 96, tileH: 64,
    note: '参照《游苏备览》游线及《园庭信步》现状圆门图版制作的像素化几何候选。档案研究的可检索论文文字提示：1909 年“又一村”指林泉耆硕之馆西侧相接廊段；原图版尚未核，故本圆门不得充作旧游线同一门。圆门与铺地是图面演绎，不是 1890 年门位或清末原貌。保留原 ID 与浏览器草稿，仅供拖拽 Tile、碰撞、遮挡和独立试走；不写 CH3 进度。',
    storyAnchors: [
      { id: 'ly-youyicun-entry', ...LIUYUAN_YOUYICUN_SPAWN, label: '现状圆门图面起点', kind: 'boundary', scriptRef: '独立几何研究', note: '只是本图出生脚点，不代表西部花房历史接点。' },
      { id: 'ly-youyicun-front', ...LIUYUAN_YOUYICUN_FEET.gateFront, label: '门前回望', kind: 'interaction', scriptRef: '独立几何研究', note: '圆门在现状图版可见；本图门位与拍摄视角仍为艺术加工。' },
      { id: 'ly-youyicun-threshold', ...LIUYUAN_YOUYICUN_FEET.threshold, label: '门槛试走', kind: 'trigger', scriptRef: '独立几何研究', note: '仅测试画面能否穿门，不写章节旗标。' },
      { id: 'ly-youyicun-inner', ...LIUYUAN_YOUYICUN_FEET.gardenSide, label: '门后图面', kind: 'interaction', scriptRef: '独立几何研究', note: '图面植株、脚点和旧游线对应关系均未核。' },
      { id: 'ly-youyicun-onward', ...LIUYUAN_YOUYICUN_FEET.onward, label: '图面终点 · 止步', kind: 'boundary', scriptRef: '独立几何研究', note: '1909 档案研究提示旧“又一村”另为厅西廊段；本圆门不自动接四面厅或石林。' },
    ],
    routeGraph: {
      nodes: [
        { id: 'youyicun-entry', ...LIUYUAN_YOUYICUN_SPAWN, label: '图面起点', kind: 'entry', anchorId: 'ly-youyicun-entry', note: '不代表花木院历史来路。' },
        { id: 'youyicun-front', ...LIUYUAN_YOUYICUN_FEET.gateFront, label: '门前', kind: 'waypoint', anchorId: 'ly-youyicun-front', note: '从前景铺地接近圆门。' },
        { id: 'youyicun-threshold', ...LIUYUAN_YOUYICUN_FEET.threshold, label: '门槛', kind: 'waypoint', anchorId: 'ly-youyicun-threshold', note: '圆门中心脚点，视觉需复核。' },
        { id: 'youyicun-inner', ...LIUYUAN_YOUYICUN_FEET.gardenSide, label: '门后', kind: 'waypoint', anchorId: 'ly-youyicun-inner', note: '不代表清末实测。' },
        { id: 'youyicun-onward', ...LIUYUAN_YOUYICUN_FEET.onward, label: '图面止步点', kind: 'goal', anchorId: 'ly-youyicun-onward', note: '不推定为四面厅方向。' },
      ],
      edges: [
        ['youyicun-entry', 'youyicun-front'], ['youyicun-front', 'youyicun-threshold'],
        ['youyicun-threshold', 'youyicun-inner'], ['youyicun-inner', 'youyicun-onward'],
      ].map(([from, to]) => ({ from, to, state: 'candidate' as const, via: 'walk' as const,
        note: '仅验证生成研究图上的铺地连通；真实门位与年代待核。' })),
    },
  },
  {
    id: 'liuyuan-stone-forest-court-study-v1', label: '留园 · 石林小院绕峰试走（石形修订图 v2）',
    asset: '../assets/scene25d/liuyuan-stone-forest-court-study-v2.png',
    width: 1776, height: 896, tileW: 111, tileH: 56,
    note: '基于园林局《揖峰轩》、民国《游苏备览》与《透园观石》图12/13形成的游戏切片；v2 石形按刘恕所述不同小石形态重新绘制，不对应具体实石身份。图12把传经堂、还读馆、揖峰轩、洞天一碧及三组隔院分开；当前画面压缩多个小院，只供研究游走和观石，不作为 1890 实测平面或 CH3-06 正式院路。',
    storyAnchors: [
      { id: 'ly-stone-entry', x: 465, y: 550, label: '西侧院路进入', kind: 'boundary', scriptRef: 'CH3-05/06', note: '只作石林小院局部试走入口；从西部花房横穿中部的关卡尚未制作。' },
      { id: 'ly-stone-yifeng', x: 525, y: 390, label: '揖峰轩前停步', kind: 'interaction', scriptRef: 'CH3-06', note: '书房/赏石建筑现状关系有据；本图立面和门位未验 1890。' },
      { id: 'ly-stone-peak', x: 975, y: 710, label: '主石前看石（晚翠峰位置意向）', kind: 'interaction', scriptRef: 'CH3-06', note: '晚翠峰是史料中的观赏中心，但这块生成石不是其实景外形，脚点亦为游戏拟制。' },
      { id: 'ly-stone-east', x: 1635, y: 530, label: '向东园廊道', kind: 'boundary', scriptRef: 'CH3-06', note: '盛氏东扩在石林小院东侧通东园有研究依据；实际门洞坐标待测绘。' },
    ],
    routeGraph: {
      nodes: [
        { id: 'stone-entry', x: 465, y: 550, label: '西侧院路', kind: 'entry', anchorId: 'ly-stone-entry', note: '独立切片出生脚点。' },
        { id: 'stone-yifeng', x: 525, y: 390, label: '揖峰轩前', kind: 'waypoint', anchorId: 'ly-stone-yifeng', note: '可停在廊下，不穿柱脚。' },
        { id: 'stone-front-left', x: 575, y: 620, label: '峰石西南', kind: 'waypoint', note: '从窄处转向峰石前方。' },
        { id: 'stone-front-turn', x: 730, y: 700, label: '峰石前折', kind: 'waypoint', note: '不切过峰石根脚。' },
        { id: 'stone-peak-view', x: 975, y: 710, label: '主石前', kind: 'waypoint', anchorId: 'ly-stone-peak', note: '仅验证当前底图上的铺地观石脚点。' },
        { id: 'stone-front-right', x: 1280, y: 710, label: '峰石东南', kind: 'waypoint', note: '沿石路转向右廊。' },
        { id: 'stone-east-bend', x: 1480, y: 620, label: '东侧小院', kind: 'waypoint', note: '避开峰石和右廊柱。' },
        { id: 'stone-east-exit', x: 1635, y: 530, label: '东园方向', kind: 'goal', anchorId: 'ly-stone-east', note: '仅试走到东侧廊口。' },
      ],
      edges: [
        ['stone-entry','stone-yifeng'], ['stone-entry','stone-front-left'],
        ['stone-front-left','stone-front-turn'], ['stone-front-turn','stone-peak-view'],
        ['stone-peak-view','stone-front-right'], ['stone-front-right','stone-east-bend'],
        ['stone-east-bend','stone-east-exit'],
      ].map(([from,to]) => ({ from,to,state:'candidate' as const,via:'walk' as const,
        note:'只验证当前生成画面上的通路与角色脚点，不声称历史门洞精确位置。' })),
    },
  },
  {
    id: 'liuyuan-study-court-research-v1', label: '留园 · 北缘书斋院独立研究试走 v1',
    asset: '../assets/scene25d/liuyuan-study-court-research-v1.png',
    width: 1536, height: 1024, tileW: 96, tileH: 64,
    note: '依据现状资料“石林北侧围合书斋院、二层硬山屋坐西朝东、斋前回廊与湖石花坛”制作的原创游戏底图。南缘开口、树位、窗格、铺地尺度和柱位全是游戏候选，不能称清末复原；旧名“还读我书斋／处”与现名有冲突，不在图上画匾。独立研究不写存档；当代游线游戏模式可在听声轻叩后结算虚构找书斋事件。',
    storyAnchors: [
      { id: 'ly-study-court-entry', x: 720, y: 842, label: '院中研究出生点', kind: 'boundary', scriptRef: 'CH3-06/独立研究', note: '不代表石林旧门洞。' },
      { id: 'ly-study-court-door', x: 480, y: 695, label: '西侧书房门前可站脚点', kind: 'interaction', scriptRef: 'CH3-06/独立研究', note: '在铺地上听声、轻叩的游戏脚点；它不是门洞坐标，清末门位与匾额未核。' },
      { id: 'ly-study-court-tree', x: 924, y: 734, label: '绕花台', kind: 'interaction', scriptRef: 'CH3-06/独立研究', note: '湖石花台有现状依据；具体树种、株位与花台尺寸为美术候选。' },
      { id: 'ly-study-court-corridor', x: 1325, y: 660, label: '东侧廊下止步', kind: 'boundary', scriptRef: 'CH3-06/独立研究', note: '只测试小院绕行，不推断通向何处。' },
    ],
    routeGraph: {
      nodes: [
        { id: 'study-entry', x: 720, y: 842, label: '院中', kind: 'entry', anchorId: 'ly-study-court-entry', note: '独立研究出生点。' },
        { id: 'study-door', x: 480, y: 695, label: '书房门前铺地', kind: 'goal', anchorId: 'ly-study-court-door', note: '站定后可听或叩；不是旧门洞坐标。' },
        { id: 'study-tree', x: 924, y: 734, label: '花台南侧', kind: 'waypoint', anchorId: 'ly-study-court-tree', note: '不得踩入树根石床。' },
        { id: 'study-south-turn', x: 1265, y: 780, label: '花台东南转弯', kind: 'waypoint', note: '沿图面铺地绕过花台。' },
        { id: 'study-corridor', x: 1325, y: 660, label: '东廊止步', kind: 'goal', anchorId: 'ly-study-court-corridor', note: '不连接历史门洞。' },
      ],
      edges: [
        { from: 'study-entry', to: 'study-door', state: 'candidate', via: 'walk', note: '游戏图面路径，不是清末实测。' },
        { from: 'study-entry', to: 'study-tree', state: 'candidate', via: 'walk', note: '在花台前绕行。' },
        { from: 'study-tree', to: 'study-south-turn', state: 'candidate', via: 'walk', note: '沿花台南侧绕过。' },
        { from: 'study-south-turn', to: 'study-corridor', state: 'candidate', via: 'walk', note: '仅供研究试走。' },
      ],
    },
  },
  {
    id: 'liuyuan-study-interior-research-v1', label: '留园 · 书斋内景人物研究试走 v1',
    asset: '../assets/scene25d/liuyuan-study-interior-research-v1.png',
    width: 1536, height: 1024, tileW: 96, tileH: 64,
    note: 'CH3-07/08 室内人物节拍研究图：书案、架、窗外蕉影与门槛都是游戏演出候选，无清末原位照片。独立试走不写章节旗标；当代游线游戏模式可在人物对话中记录虚构事件。卷纸/过手台词属虚构人物处境，不是清末门房制度证据；不与书斋院假接历史门路。',
    storyAnchors: [
      { id: 'ly-study-room-entry', x: 770, y: 840, label: '室内研究出生点', kind: 'boundary', scriptRef: 'CH3-07/独立研究', note: '独立镜头落点，非已核旧门。' },
      { id: 'ly-study-room-copyist', x: 630, y: 510, label: '抄书人旁', kind: 'npc', scriptRef: 'CH3-07/游戏合成', note: '虚构无名角色；需亲近才开口。当代游线章模式才写 ly-scholar-met。' },
      { id: 'ly-study-room-desk', x: 480, y: 500, label: '案头纸笔', kind: 'interaction', scriptRef: 'CH3-07/独立研究', note: '能看见纸笔，不声称桌案是历史原物。' },
      { id: 'ly-study-room-shelf', x: 1120, y: 465, label: '书架', kind: 'interaction', scriptRef: 'CH3-07/独立研究', note: '可选观察；架位及书籍均为演出。' },
      { id: 'ly-study-room-window', x: 815, y: 440, label: '窗外蕉影', kind: 'interaction', scriptRef: 'CH3-07/独立研究', note: '留园石林一带蕉影有总体文字依据；本窗与株位未核。' },
    ],
    routeGraph: {
      nodes: [
        { id: 'study-room-entry', x: 770, y: 840, label: '门槛内', kind: 'entry', anchorId: 'ly-study-room-entry', note: '研究落点。' },
        { id: 'study-room-person', x: 630, y: 510, label: '人旁', kind: 'waypoint', anchorId: 'ly-study-room-copyist', note: '走近听见第一句。' },
        { id: 'study-room-desk', x: 480, y: 500, label: '案前', kind: 'goal', anchorId: 'ly-study-room-desk', note: '纸笔供玩家亲看。' },
        { id: 'study-room-window', x: 815, y: 440, label: '窗前', kind: 'goal', anchorId: 'ly-study-room-window', note: '蕉叶从窗格外见。' },
        { id: 'study-room-shelf', x: 1120, y: 465, label: '架前', kind: 'goal', anchorId: 'ly-study-room-shelf', note: '可选观察。' },
      ],
      edges: [
        ['study-room-entry','study-room-person'], ['study-room-person','study-room-desk'],
        ['study-room-person','study-room-window'], ['study-room-window','study-room-shelf'],
      ].map(([from,to]) => ({ from,to,state:'candidate' as const,via:'walk' as const,
        note:'只验证这张研究图内部可走关系，不声称清末室内尺度。' })),
    },
  },
  {
    id: 'liuyuan-flower-work-yard-study-v3', label: '留园 · 花木作业院游戏试走 v3（盆兰工作区）',
    asset: '../assets/scene25d/liuyuan-flower-work-yard-study-v1.png',
    width: 1776, height: 896, tileW: 111, tileH: 56,
    note: 'CH3-05 花房/花匠机制的视觉候选：民国《游苏备览》在小蓬莱一段记花房与蔬圃，确切旧址待核；本图只作花木作业院的玩法演绎，不复原 1890 旧门位。盆中的是兰；本幕不摆盆栽玉兰，也不把玉兰塞进墙脚。',
    storyAnchors: [
      { id: 'ly-flower-v1-entry', x: 820, y: 500, label: '由园路进入作业院', kind: 'boundary', scriptRef: 'CH3-05', note: '镜头从院中开阔石面接入，能看见檐下桶位与花匠；与绿荫轩之间是剧情剪接，不是已核实的旧门洞。' },
      { id: 'ly-flower-v1-bucket', x: 520, y: 500, label: '檐下放粥桶 · 玩家脚点', kind: 'interaction', scriptRef: 'CH3-05', note: '玩家站在桶位 (480,445) 前的安全铺地交粥；送粥关系为剧本演绎，不声称留存实物。' },
      { id: 'ly-flower-v1-worker', ...LIUYUAN_FLOWER_WORKER_STAND, label: '花匠身侧 · 玩家脚点', kind: 'npc', scriptRef: 'CH3-05', note: '玩家站在花匠 (565,450) 身侧而非踩其碰撞盒；盛氏雇花工/兰花培育有后出记载，具体人物虚构。' },
      { id: 'ly-flower-v1-east-exit', x: 1675, y: 445, label: '返园路方向（占位）', kind: 'boundary', scriptRef: 'CH3-06', note: '民国游记把花房和东园分在不同段落；这里不是直通东部书斋的历史门洞。' },
    ],
    routeGraph: {
      nodes: [
        { id: 'flower-entry', x: 820, y: 500, label: '院地镜头落点', kind: 'entry', anchorId: 'ly-flower-v1-entry', note: '本切片出生点；不是历史门洞。' },
        { id: 'flower-bucket', x: 520, y: 500, label: '檐下桶位前', kind: 'waypoint', anchorId: 'ly-flower-v1-bucket', note: '可站立脚点，不进工作台。' },
        { id: 'flower-worker', ...LIUYUAN_FLOWER_WORKER_STAND, label: '花匠身侧', kind: 'waypoint', anchorId: 'ly-flower-v1-worker', note: '不踩新培土；兰谱交画返回本脚点。' },
        { id: 'flower-east-exit', x: 1675, y: 445, label: '返园路试走边界', kind: 'goal', anchorId: 'ly-flower-v1-east-exit', note: '仍需制作跨园过渡；并非旧门位。' },
      ],
      edges: [
        ['flower-entry', 'flower-bucket'], ['flower-bucket', 'flower-worker'],
        ['flower-worker', 'flower-east-exit'],
      ].map(([from, to]) => ({ from, to, state: 'candidate' as const, via: 'walk' as const,
        note: '只验证此图可走脚点；真实花房与东部院落通路未考定。' })),
    },
  },
  {
    id: 'liuyuan-east-hall-magnolia-court-study-v1', label: '留园 · 东部宅院厅前双玉兰（植栽语法候选）',
    asset: '../assets/scene25d/liuyuan-east-hall-magnolia-court-study-v1.png',
    width: 1776, height: 896, tileW: 111, tileH: 56,
    note: '按《长物志》玉兰宜种厅事前、对列数株，制作宅院厅前的两株地植乔木；左侧盆兰工作檐与右侧较自由的园景用于对比。此图只示范“宅的厅前局部有秩序、园的游赏植栽较自由”的设计语法，不证明留园 1890 年某一实名厅堂前有这两株或此门位。当代游线游戏模式可在亲看两树后推进虚构“笔树”线索，独立研究不推进；仍不可把此厅当作还读我书斋或直接结算四门谜题。',
    storyAnchors: [
      { id: 'ly-east-pair-left', x: 520, y: 365, label: '左侧地植玉兰', kind: 'visual', scriptRef: 'CH3-06', note: '树根位于堂前树池，非盆栽；具体历史株位待核。' },
      { id: 'ly-east-pair-right', x: 1390, y: 420, label: '右侧地植玉兰', kind: 'visual', scriptRef: 'CH3-06', note: '两株形成局部厅堂轴线，不要求整个园林对称。' },
      { id: 'ly-east-hall-threshold', x: 1010, y: 390, label: '厅堂门槛候选', kind: 'boundary', scriptRef: 'CH3-06/07', note: '未核是否对应还读我书斋及 1890 匾额；禁止凭生成图定名。' },
      { id: 'ly-east-side-garden', x: 1630, y: 270, label: '侧园自由植栽', kind: 'visual', scriptRef: 'CH3-06', note: '游赏区用非对称疏密，不作花坛式镜像。' },
      { id: 'ly-east-left-view-foot', x: 530, y: 550, label: '左树池外观察脚点', kind: 'interaction', scriptRef: 'CH3-06', note: '玩家足部在石路；与树根视觉锚点分开。' },
      { id: 'ly-east-right-view-foot', x: 1390, y: 580, label: '右树池外观察脚点', kind: 'interaction', scriptRef: 'CH3-06', note: '玩家足部在树池南侧；与树冠/树根视觉锚点分开。' },
      { id: 'ly-east-door-foot', x: 980, y: 410, label: '门前止步脚点', kind: 'boundary', scriptRef: 'CH3-06/07', note: '未核门内，脚点只到阶前。' },
    ],
    routeGraph: {
      nodes: [
        { id: 'east-hall-entry', x: 385, y: 575, label: '西侧院地', kind: 'entry', note: '从花木作业区剪接，不是已核旧门位。' },
        { id: 'east-hall-left-tree', x: 530, y: 550, label: '左树前', kind: 'waypoint', anchorId: 'ly-east-left-view-foot', note: '停在树池南侧，不穿树根。' },
        { id: 'east-hall-center', x: 970, y: 545, label: '厅前中路', kind: 'waypoint', note: '从两株之间看厅堂。' },
        { id: 'east-hall-door', x: 980, y: 410, label: '未命名厅前', kind: 'waypoint', anchorId: 'ly-east-door-foot', note: '只到门槛，未标定厅内。' },
        { id: 'east-hall-right-tree', x: 1390, y: 580, label: '右树前', kind: 'waypoint', anchorId: 'ly-east-right-view-foot', note: '树池南侧可站；两树成局部厅前一对。' },
        { id: 'east-hall-east-bend', x: 1660, y: 590, label: '侧廊转角', kind: 'waypoint', note: '绕过右树池，不斜穿。' },
        { id: 'east-hall-east-exit', x: 1675, y: 475, label: '下一院方向', kind: 'goal', note: '东侧出口只作玩法边界。' },
      ],
      edges: [
        ['east-hall-entry','east-hall-left-tree'], ['east-hall-left-tree','east-hall-center'],
        ['east-hall-center','east-hall-door'], ['east-hall-center','east-hall-right-tree'],
        ['east-hall-right-tree','east-hall-east-bend'], ['east-hall-east-bend','east-hall-east-exit'],
      ].map(([from,to]) => ({ from,to,state:'candidate' as const,via:'walk' as const,
        note:'仅此游戏切片的脚点路径，不对应 1890 历史门洞。' })),
    },
  },
  {
    id: 'liuyuan-entry-gate-style-study-v1', label: '留园 · 门外至门厅研究 v1【风格未通过】',
    asset: '../research-art/liuyuan-entry-gate-style-study-v1.png',
    width: 1664, height: 944, tileW: 104, tileH: 59,
    note: '风格复核未通过：图面是细腻绘画而非统一像素资产，且门与两侧花池过于对称、近正面；不能作为合格入口替换。仅留独立研究底图供比例、地面和前景校验。门扇、灯、树石及街面宽度未经实景/年代核位；并非 1890 留园入口复原，也不接 CH3 进度。既有入口草稿不迁移、不覆盖。详见 LIUYUAN_VISUAL_STYLE_AUDIT.md。',
    storyAnchors: [
      { id: 'ly-gate-study-threshold', x: 830, y: 428, label: '门槛观察脚点候选', kind: 'boundary', scriptRef: '独立几何研究',
        note: '只看可走地面与门柱比例，不表示已核真实门位，也不写 CH3 旗标。' },
    ],
    routeGraph: {
      nodes: [
        { id: 'study-street', x: 830, y: 755, label: '门外石路', kind: 'entry', note: '风格研究出生点。' },
        { id: 'study-approach', x: 830, y: 560, label: '门前', kind: 'waypoint', note: '宽石路收向门洞。' },
        { id: 'study-threshold', x: 830, y: 428, label: '门槛', kind: 'waypoint', anchorId: 'ly-gate-study-threshold', note: '只校脚点和门柱，不作旧门证据。' },
        { id: 'study-hall', x: 830, y: 315, label: '门厅地面', kind: 'goal', note: '切片在厅内止步；下一幕真实接口待核。' },
      ],
      edges: [
        ['study-street', 'study-approach'], ['study-approach', 'study-threshold'], ['study-threshold', 'study-hall'],
      ].map(([from, to]) => ({ from, to, state: 'candidate' as const, via: 'walk' as const,
        note: '按此游戏图铺地标定的候选脚点，不对应清末测绘。' })),
    },
  },
  {
    id: 'liuyuan-entry-gate-misty-study-v2', label: '留园 · 粉墙黛瓦门墙试走 v2【独立研究】',
    asset: '../research-art/liuyuan-entry-gate-misty-pixel-study-v3.png',
    width: 1664, height: 944, tileW: 104, tileH: 59,
    note: '本张只是门外—门厅一镜的冷调像素语法/脚点研究，不覆盖整条入口夹弄、不接 CH3、不把生成门柱树位或铺地认作 1890 实景。与旧 v1 独立场景 ID，保留所有旧草稿；图中的石地材质暂为未定位的游戏候选，不能将花街纹样凭空铺在入口。',
    storyAnchors: [
      { id: 'ly-gate-misty-threshold', x: 1020, y: 517, label: '门槛研究脚点', kind: 'boundary', scriptRef: '独立几何研究',
        note: '用于人物比例与进门遮挡校准，未核实清末门位或门槛形制。' },
    ],
    routeGraph: {
      nodes: [
        { id: 'misty-street', x: 835, y: 782, label: '门外石路', kind: 'entry', note: '此图研究出生点。' },
        { id: 'misty-approach', x: 946, y: 630, label: '门前收束', kind: 'waypoint', note: '沿图面可见石路行走。' },
        { id: 'misty-threshold', x: 1020, y: 517, label: '门槛', kind: 'waypoint', anchorId: 'ly-gate-misty-threshold', note: '鞋底跨线，不穿柱脚。' },
        { id: 'misty-hall', x: 1020, y: 340, label: '门内止步', kind: 'goal', note: '切片止于室内可见地面；下一段夹弄不在本图。' },
      ],
      edges: [
        ['misty-street', 'misty-approach'], ['misty-approach', 'misty-threshold'], ['misty-threshold', 'misty-hall'],
      ].map(([from, to]) => ({ from, to, state: 'candidate' as const, via: 'walk' as const,
        note: '游戏研究图候选脚点，不是已核清末游线。' })),
    },
  },
  {
    id: 'liuyuan-entry-lower-camera-study-v1', label: '留园 · 门外至第一见光 · 低机位研究【未接章流】',
    asset: '../research-art/liuyuan-entry-lower-camera-gameplay-candidate-v1.png',
    width: 1672, height: 941, tileW: 105, tileH: 59,
    note: '从头生成的低机位游戏镜头；门外空地给乔禾、老叟、书生，门右留门房修灯位置。植物和铺地是游戏化构图候选，未核旧门、树种株位与花街纹样。独立新 ID 保留所有旧入口草稿；仅校一镜脚点、门柱和角色，不写 CH3，也不等于入口整链换装或画风批准。',
    storyAnchors: [
      { id: 'ly-lower-vendor', ...LIUYUAN_ENTRY_LOWER_NPC_FEET.oldVendor,
        label: '乔老叟脚点研究', kind: 'npc', scriptRef: 'CH3-01 镜头候选',
        note: '坐姿精灵的鞋底落在此点；人物不烘焙进底图，站位不是史实。', routeRequired: false },
      { id: 'ly-lower-qiao', ...LIUYUAN_ENTRY_LOWER_NPC_FEET.qiao,
        label: '乔禾脚点研究', kind: 'npc', scriptRef: 'CH3-02 镜头候选',
        note: '与老叟分开校比例和前后层级；街面位置是剧情虚构。', routeRequired: false },
      { id: 'ly-lower-gatekeeper', ...LIUYUAN_ENTRY_LOWER_NPC_FEET.gatekeeper,
        label: '门房修灯脚点研究', kind: 'npc', scriptRef: 'CH3-03 镜头候选',
        note: '在右门柱外的可走石地试摆；可选扶灯属于剧情虚构。', routeRequired: false },
      { id: 'ly-lower-threshold', ...LIUYUAN_ENTRY_LOWER_FEET.threshold, label: '单门门槛候选脚点',
        kind: 'boundary', scriptRef: '独立几何研究', note: '只检过门与檐口遮挡；清末门位未核。' },
    ],
    routeGraph: {
      nodes: Object.entries(LIUYUAN_ENTRY_LOWER_FEET).map(([id, foot], index, all) => ({
        id: `lower-${id}`, x: foot.x, y: foot.y, label: id,
        kind: index === 0 ? 'entry' as const : index === all.length - 1 ? 'goal' as const : 'waypoint' as const,
        anchorId: id === 'threshold' ? 'ly-lower-threshold' : undefined,
        note: '生成图的可见石地脚点，非史实坐标；目前只负责首镜。',
      })),
      edges: Object.keys(LIUYUAN_ENTRY_LOWER_FEET).slice(1).map((id, index, ids) => ({
        from: `lower-${index === 0 ? 'street' : ids[index - 1]}`, to: `lower-${id}`,
        state: 'candidate' as const, via: 'walk' as const,
        note: '新底图专用路线；不得套用旧 1008×688 白模、旧斜俯视草稿或推定清末门位。',
      })),
    },
  },
  {
    id: 'liuyuan-entry-oblique-shot-study-v1', label: '留园 · 入口斜俯视首镜头校位【未接章流】',
    asset: '../research-art/liuyuan-entry-oblique-pixel-study-v1.png',
    width: 1536, height: 1024, tileW: 96, tileH: 64,
    note: '按府学高位斜俯视重新研究门外—门槛—门内转折，独立场景 ID 不覆盖入口白模与玩家草稿。图面为 AI 辅助原创像素候选，门、树、铺地和墙线未核实清末原位；只校人物、脚点、碰撞、前景檐，不写 CH3 状态，不算整条入口可玩。',
    storyAnchors: [
      { id: 'ly-entry-oblique-gate', ...LIUYUAN_ENTRY_OBLIQUE_FEET.threshold,
        label: '门槛脚点候选', kind: 'boundary', scriptRef: '独立几何研究',
        note: '本图只校过门和前景瓦面；不是历史旧门定位。' },
      { id: 'ly-entry-oblique-lightwell', ...LIUYUAN_ENTRY_OBLIQUE_FEET.lightwell,
        label: '第一次见光候选', kind: 'visual', scriptRef: '独立几何研究',
        note: '只作收放节拍，不把生成植栽作为实景或解谜题目。' },
    ],
    routeGraph: {
      nodes: Object.entries(LIUYUAN_ENTRY_OBLIQUE_FEET).map(([id, foot], index, all) => ({
        id: `oblique-${id}`, x: foot.x, y: foot.y, label: id,
        kind: index === 0 ? 'entry' as const : index === all.length - 1 ? 'goal' as const : 'waypoint' as const,
        anchorId: id === 'threshold' ? 'ly-entry-oblique-gate'
          : id === 'lightwell' ? 'ly-entry-oblique-lightwell' : undefined,
        note: '仅此候选图的图面脚点；不映射或覆盖现有入口 11 段坐标。',
      })),
      edges: Object.keys(LIUYUAN_ENTRY_OBLIQUE_FEET).slice(1).map((id, index, ids) => ({
        from: `oblique-${index === 0 ? 'street' : ids[index - 1]}`,
        to: `oblique-${id}`, state: 'candidate' as const, via: 'walk' as const,
        note: '图面铺地的候选连线；需默认几何和玩家草稿分别验证。',
      })),
    },
  },
  {
    id: 'liuyuan-alley-misty-study-v1', label: '留园 · 门内冷调夹弄试走 v1【独立研究】',
    asset: '../research-art/liuyuan-alley-misty-pixel-study-v1.png',
    width: 1664, height: 944, tileW: 104, tileH: 59,
    note: '本镜承接粉墙黛瓦门墙的色板与相机，研究狭径行走、墙脚碰撞和石板/小灰石块的图面交接。墙线、树位、铺地转折及清末坐标均未核；不把花街图版误植在夹弄，不替换正式 CH3 白模，不覆盖旧草稿。',
    storyAnchors: [{ id: 'ly-alley-misty-bend', x: 1095, y: 480, label: '窄巷转角研究脚点', kind: 'boundary', scriptRef: '独立几何研究',
      note: '只校准玩家在转角停步与人物缩尺；不是旧路门位证据。' }],
    routeGraph: {
      nodes: [
        { id: 'alley-threshold', x: 800, y: 850, label: '门槛内', kind: 'entry', note: '独立研究出生点。' },
        { id: 'alley-first-narrow', x: 915, y: 640, label: '入窄巷', kind: 'waypoint', note: '沿可见铺地向里。' },
        { id: 'alley-bend', x: 1095, y: 480, label: '转角', kind: 'waypoint', anchorId: 'ly-alley-misty-bend', note: '石材变化仅作研究候选。' },
        { id: 'alley-end', x: 1190, y: 320, label: '巷尾止步', kind: 'goal', note: '不直接接 CH3 小庭，接口未核。' },
      ],
      edges: [
        ['alley-threshold', 'alley-first-narrow'], ['alley-first-narrow', 'alley-bend'], ['alley-bend', 'alley-end'],
      ].map(([from, to]) => ({ from, to, state: 'candidate' as const, via: 'walk' as const,
        note: '按研究图铺地标定脚点，非清末测绘。' })),
    },
  },
  {
    id: 'liuyuan-entrance-topology-study', label: '留园 · 烟雨夹弄（章节入口）',
    asset: '../assets/scene25d/liuyuan-entrance-walkable-study-v2.svg',
    width: 1008, height: 688, tileW: 63, tileH: 43,
    note: '编辑器与正式试玩共用同一张 1008×688 游戏场景，沿用原有脚点、Tile、剧情与返程链，不迁移或覆盖浏览器草稿。南门两翼、第二天井东侧及北墙六窗已补代码原生浅立面；北廊画面仅静态裁切复核，旧草稿遮挡仍待实走。无入口原位图版的菱形花街已撤为普通石板。六窗轮廓借现状地方志文字作原创像素剪影，第二窗纹名和清末存貌未核，不作实物摹本。六窗是实墙；西折出口通向下一幕。',
    storyAnchors: [
      { id: 'ly-entry-gate', x: 520, y: 610, label: '南侧小门', kind: 'trigger', scriptRef: 'CH3-03/04', note: '故事入口；具体历史门位待核。' },
      { id: 'ly-entry-second-court', x: 430, y: 374, label: '曲廊后的第二小庭', kind: 'trigger', scriptRef: 'CH3-04', note: '先收后放的中段，不在此直接展示全池。' },
      { id: 'ly-entry-window', x: 420, y: 232, label: '北墙隔窗窥园', kind: 'visual', scriptRef: 'CH3-04', note: '站在窗南侧，只见局部景；窗本身不可穿过。' },
      { id: 'ly-entry-shade', x: 290, y: 232, label: '西折小庭方向', kind: 'boundary', scriptRef: 'CH3-04', note: '入口段终点；剧情接入小庭，不宣称历史门洞相接。' },
    ],
    routeGraph: {
      nodes: [
        { id: 'street', x: 520, y: 656, label: '街面', kind: 'entry', note: '章节出生点' },
        { id: 'gate', x: 520, y: 610, label: '小门', kind: 'portal', anchorId: 'ly-entry-gate', note: '入口门槛' },
        { id: 'hall', x: 520, y: 550, label: '前厅', kind: 'waypoint', note: '由小门入内' },
        { id: 'well-one', x: 520, y: 480, label: '第一天井', kind: 'waypoint', note: '第一次见光' },
        { id: 'south-corridor', x: 520, y: 400, label: '狭长廊', kind: 'waypoint', note: '向北收窄' },
        { id: 'west-bend', x: 430, y: 400, label: '向西折', kind: 'waypoint', note: '必须分段转弯，不穿墙斜切' },
        { id: 'second-court', x: 430, y: 374, label: '第二小庭', kind: 'waypoint', anchorId: 'ly-entry-second-court', note: '连续行走验证点' },
        { id: 'north-corridor', x: 430, y: 300, label: '北向窄廊', kind: 'waypoint', note: '从庭院继续向北' },
        { id: 'tree-court', x: 430, y: 250, label: '古木交柯附近', kind: 'waypoint', note: '仅示意相邻空间' },
        { id: 'window', x: 420, y: 232, label: '北侧漏窗前', kind: 'waypoint', anchorId: 'ly-entry-window', note: '不穿窗；只可局部窥园' },
        { id: 'west-exit', x: 340, y: 232, label: '折向西', kind: 'waypoint', note: '从古木交柯向西走' },
        { id: 'green-shade', x: 290, y: 232, label: '绿荫轩方向', kind: 'goal', anchorId: 'ly-entry-shade', note: '此处停止，池园接口待制作' },
      ],
      edges: [
        ['street', 'gate'], ['gate', 'hall'], ['hall', 'well-one'], ['well-one', 'south-corridor'],
        ['south-corridor', 'west-bend'], ['west-bend', 'second-court'], ['second-court', 'north-corridor'],
        ['north-corridor', 'tree-court'], ['tree-court', 'window'], ['window', 'west-exit'],
        ['west-exit', 'green-shade'],
      ].map(([from, to]) => ({ from, to, state: 'confirmed' as const, via: 'walk' as const, note: '代码默认 Tile 与章节脚点共用此段；历史门位不作复原声明。' })),
    },
  },
  {
    id: 'liuyuan-whole-garden-study-v2', label: '留园 · 旧全园误稿 v2（禁止铺碰撞）',
    asset: '../assets/scene25d/liuyuan-whole-garden-study-v2.png',
    width: 1536, height: 1024, tileW: 96, tileH: 64,
    note: '已否决作实景或碰撞底图：西侧被画成多片湖沼和浮桥，主池破碎，北部成规整花圃；与留园测绘及官方“中池、西山、东厅”的格局明显不合。入口屋顶亦遮住脚点。仅保留旧图供误差对照，v1 及浏览器草稿也不删除。',
    storyAnchors: [
      { id: 'ly-v2-small-gate', x: 665, y: 905, label: '南侧小门', kind: 'trigger', scriptRef: 'CH3-03/04', note: '入口已收窄；历史门位与可走脚点待平面和实走核对。' },
      { id: 'ly-v2-alley', x: 820, y: 735, label: '三弯夹弄', kind: 'trigger', scriptRef: 'CH3-04', note: '屋顶掩蔽了局部地面；未标定连续可走 Tile 前，不结算御·行路。' },
      { id: 'ly-v2-pond-reveal', x: 735, y: 585, label: '出弄见池', kind: 'visual', scriptRef: 'CH3-04', note: '收放关系是镜头目标，机位与门洞需手工校准。' },
      { id: 'ly-v2-flower-work', x: 955, y: 735, label: '旧花匠占位（废）', kind: 'npc', scriptRef: 'CH3-05', note: '花房与东园关系不符，此点只供误稿审计；盆兰与玉兰不可混用。' },
      { id: 'ly-v2-four-doors', x: 1130, y: 400, label: '旧四门占位（废）', kind: 'trigger', scriptRef: 'CH3-06', note: '四门并排模型已撤销；各院应分栋考证，不得据此结算。' },
      { id: 'ly-v2-study', x: 1220, y: 465, label: '还读我书斋候选', kind: 'interaction', scriptRef: 'CH3-07/08/09', note: '斋名与芭蕉叶玩法见剧本；具体建筑与株位仍待核。' },
    ],
  },
  {
    id: 'liuyuan-whole-garden-study', label: '留园 · 四区视觉试稿 v1',
    asset: '../assets/scene25d/liuyuan-whole-garden-study-v1.png',
    width: 1536, height: 1024, tileW: 96, tileH: 64,
    note: '按带北箭头的全园导览图及园林局四区说明约束西山、中池、东厅与北部栽植区。入口图像尚未表现剧本必需的窄暗曲折夹弄；1890 东园扩建、各书斋门位及花房株位也待核。只供美术与剧本锚点对照，尚不可铺正式可走网格。',
    storyAnchors: [
      { id: 'ly-v1-alley-threshold', x: 665, y: 850, label: '小门与夹弄待重画', kind: 'trigger', scriptRef: 'CH3-03/04', note: '现图南入口过于敞亮，未满足三弯后豁然开朗；正式夹弄需另制或重画，不能在此直接结算御·行路。' },
      { id: 'ly-v1-flower-work', x: 850, y: 790, label: '旧花房占位（未核）', kind: 'npc', scriptRef: 'CH3-05', note: '民国游记将花房置于西部小蓬莱一带；此图南部点位不可用作正式入口。花匠盆中是兰，不画玉兰盆苗。' },
      { id: 'ly-v1-four-doors', x: 1130, y: 400, label: '旧四门占位（废）', kind: 'trigger', scriptRef: 'CH3-06', note: '四门并排模型已撤销；真实建筑分在相连的不同院落，不能据生成图定位。' },
      { id: 'ly-v1-study', x: 1220, y: 465, label: '旧书斋占位（未核）', kind: 'interaction', scriptRef: 'CH3-07/08/09', note: '书斋、蕉叶及门额都未落位；盛氏时期还读我书斋/处名称存来源冲突，不能给 1890 匾额定字。' },
      { id: 'ly-v1-middle-pond', x: 650, y: 455, label: '中央池园', kind: 'visual', scriptRef: 'CH3-04', note: '出窄弄后的空间释放；水边可走线、池岸碰撞和桥头仍待人工标定。' },
    ],
  },
  {
    id: 'tuisi-whole-garden-study', label: '退思园 · 西宅东园试稿',
    asset: '../assets/scene25d/tuisi-whole-garden-study-v1.png',
    width: 1536, height: 1024, tileW: 96, tileH: 64,
    note: '参考退思园平面与官方解说；西宅—中庭—东园关系保留。人物/道具坐标是剧本编辑锚点，须逐点拖拽复核；树只供观看，不是交互。',
    storyAnchors: [
      { id: 'tuisi-house-gate', x: 300, y: 580, label: '任宅无匾门', kind: 'trigger', scriptRef: 'CH8-04', note: '门、影壁、门厅；不可画商号或灯笼式样。' },
      { id: 'tuisi-moon-gate', x: 845, y: 275, label: '西宅入东园', kind: 'trigger', scriptRef: 'CH8-05', note: '三进宅—中庭—月洞门转场；生活陈设独立，砖额不放未经核定的字。' },
      { id: 'tuisi-pond-reveal', x: 940, y: 400, label: '一池环屋', kind: 'visual', scriptRef: 'CH8-06/07', note: '水与四周房子的关系由玩家观察得出，不弹说明卡。' },
      { id: 'tuisi-old-tree', x: 1115, y: 225, label: '池边老树', kind: 'visual', scriptRef: 'CH8-08', note: '只看见；不发任务、不弹提示、不进日志。位置与树龄均待核。' },
      { id: 'tuisi-water-terrace', x: 1270, y: 740, label: '退一步取景', kind: 'interaction', scriptRef: 'CH8-09', note: '玩家主动退一步并取景；跨水月台的真实对应物待核。' },
      { id: 'tuisi-upper-gallery-permission', x: 1165, y: 425, label: '先问可否借廊', kind: 'npc', scriptRef: 'CH8-10', note: '访园礼触发候选点；老仆许可外廊、内宅门不可穿。坐标需对图重校。' },
      { id: 'tuisi-upper-gallery', x: 1190, y: 355, label: '天桥俯看', kind: 'trigger', scriptRef: 'CH8-11', note: '二层廊的高低层关系要单独建几何，不得当作平面桥。' },
    ],
  },
  {
    id: 'ouyuan-whole-garden-study', label: '耦园 · 中宅双园试稿',
    asset: '../assets/scene25d/ouyuan-whole-garden-study-v1.png',
    width: 1536, height: 1024, tileW: 96, tileH: 64,
    note: '参考全园平面和官方分区：中宅、西小园、东大园；今日入口未必是 1890 入口。标记仅供剧本排演。',
    storyAnchors: [
      { id: 'ouyuan-house-gate', x: 500, y: 825, label: '小新桥巷入宅', kind: 'trigger', scriptRef: 'CH7-02', note: '门无匾；历史入口需复核，不以今日检票口替代。' },
      { id: 'ouyuan-central-halls', x: 560, y: 385, label: '中宅四进', kind: 'trigger', scriptRef: 'CH7-03', note: '门厅—轿厅—载酒堂—楼厅；书案、茶具等生活陈设用独立精灵。' },
      { id: 'ouyuan-east-pond', x: 1085, y: 515, label: '东园池与黄石', kind: 'interaction', scriptRef: 'CH7-04/09', note: '池西边步道为操作点，与西园井成对；东园黄石而非泛化白色湖石。' },
      { id: 'ouyuan-west-well', x: 215, y: 320, label: '西园井与湖石', kind: 'interaction', scriptRef: 'CH7-05/06/09', note: '玩家主动在东池、西井两端完成配对。' },
      { id: 'ouyuan-stone-bench', x: 905, y: 585, label: '老仆石凳', kind: 'npc', scriptRef: 'CH7-07', note: '人物触发对话；不得提前代玩家说出答案。' },
      { id: 'ouyuan-sedan-hall', x: 550, y: 635, label: '轿厅对联', kind: 'interaction', scriptRef: 'CH7-08', note: '对联另制可读道具；文字按剧本与考据复核。' },
      { id: 'ouyuan-west-library', x: 165, y: 520, label: '鲽砚庐双砚', kind: 'interaction', scriptRef: 'CH7-10', note: '匾与两块砚石独立道具；所在房间待实地图核。' },
    ],
    routeGraph: {
      nodes: [
        { id: 'entry', x: 500, y: 825, label: '巷口入宅', kind: 'entry', anchorId: 'ouyuan-house-gate', note: '入口年代和门位待复核。' },
        { id: 'front-hall', x: 525, y: 755, label: '前厅', kind: 'waypoint', note: '只沿可见门槛入厅，屋顶裁切需配合。' },
        { id: 'sedan-hall', x: 550, y: 635, label: '轿厅', kind: 'goal', anchorId: 'ouyuan-sedan-hall', note: '对联交互在厅内。' },
        { id: 'middle-hall', x: 555, y: 505, label: '中进', kind: 'waypoint', note: '南北厅堂连续性须逐门核对。' },
        { id: 'central-halls', x: 560, y: 385, label: '载酒堂／楼厅', kind: 'goal', anchorId: 'ouyuan-central-halls', note: '内外室层级与可走门槛须拆出；陈设另作精灵。' },
        { id: 'west-portal', x: 410, y: 395, label: '通西园门', kind: 'portal', note: '候选门洞；按平面核实，不要穿墙。' },
        { id: 'west-well', x: 215, y: 320, label: '西园井', kind: 'goal', anchorId: 'ouyuan-west-well', note: '步点应在井旁，不在井水上。' },
        { id: 'west-library', x: 165, y: 520, label: '鲽砚庐', kind: 'goal', anchorId: 'ouyuan-west-library', note: '藏书楼入口与楼层待核。' },
        { id: 'east-portal', x: 785, y: 395, label: '通东园门', kind: 'portal', note: '候选门洞；东园黄石近景不能挡路。' },
        { id: 'east-walk', x: 925, y: 440, label: '东园西路', kind: 'waypoint', note: '绕黄石抵池边。' },
        { id: 'east-pond', x: 1085, y: 515, label: '东园池', kind: 'goal', anchorId: 'ouyuan-east-pond', note: '池边安全站位；不可落在水中。' },
        { id: 'east-pavilion', x: 1375, y: 455, label: '东园亭', kind: 'waypoint', note: '亭与池岸的连接须对照片复核。' },
        { id: 'south-court', x: 795, y: 635, label: '南庭回路', kind: 'waypoint', note: '草地不可全部默认为可走；按实际踏步收窄。' },
        { id: 'stone-bench', x: 905, y: 585, label: '石凳', kind: 'goal', anchorId: 'ouyuan-stone-bench', note: '老仆活动点。' },
      ],
      edges: [
        { from: 'entry', to: 'front-hall', state: 'candidate', note: '巷口至前厅。' },
        { from: 'front-hall', to: 'sedan-hall', state: 'candidate', note: '南北厅堂门槛。' },
        { from: 'sedan-hall', to: 'middle-hall', state: 'candidate', note: '中轴下一进。' },
        { from: 'middle-hall', to: 'central-halls', state: 'candidate', note: '中轴正厅。' },
        { from: 'central-halls', to: 'west-portal', state: 'candidate', note: '经宅入西园。' },
        { from: 'west-portal', to: 'west-well', state: 'candidate', note: '西园井旁路。' },
        { from: 'west-well', to: 'west-library', state: 'candidate', note: '西园至鲽砚庐。' },
        { from: 'central-halls', to: 'east-portal', state: 'candidate', note: '经宅入东园。' },
        { from: 'east-portal', to: 'east-walk', state: 'candidate', note: '东园西路。' },
        { from: 'east-walk', to: 'east-pond', state: 'candidate', note: '到池西岸。' },
        { from: 'east-pond', to: 'east-pavilion', state: 'candidate', note: '沿池岸到亭。' },
        { from: 'east-portal', to: 'south-court', state: 'candidate', note: '庭院分路。' },
        { from: 'south-court', to: 'stone-bench', state: 'candidate', note: '老仆石凳。' },
        { from: 'stone-bench', to: 'east-pond', state: 'candidate', note: '石凳至池岸回路，需实测门洞。' },
      ],
    },
  },
  {
    id: 'zhuozheng-whole-garden-study-v4', label: '拙政园 · 东向旧门修订试稿 v4',
    asset: '../assets/scene25d/zhuozheng-whole-garden-study-v4.png',
    width: 1536, height: 1024, tileW: 96, tileH: 64,
    note: '依园林局所载东部旧入口朝东、通百家巷的关系，去掉 v3 东部南向正门，在东侧补窄巷与小门；保留西补园、中会馆、东归田园居的产权墙。旧门精确位置、各厅池与 1890 建筑断代未核；不得把此图当历史测绘或可走关卡。',
    storyAnchors: [
      { id: 'zz-v4-buyuan-gate', x: 190, y: 810, label: '西部补园私门', kind: 'boundary', scriptRef: 'CH2-01', note: '门房推托发生于街层；门位与形制仍待史料核定，园内初访不可进入。' },
      { id: 'zz-v4-huiguan-gate', x: 580, y: 805, label: '中部会馆门', kind: 'boundary', scriptRef: 'CH2-02/03', note: '门和石刻应在近景制作；当前图仅表达与补园不同的产权。' },
      { id: 'zz-v4-west-middle-wall', x: 355, y: 450, label: '西中隔墙', kind: 'boundary', scriptRef: 'CH2-08/10', note: '无普通通路；墙线具体坐标是美术候选。' },
      { id: 'zz-v4-middle-east-wall', x: 1035, y: 470, label: '中东隔墙', kind: 'boundary', scriptRef: 'CH2-07/08/10', note: '夜间翻墙应另作受控转场，不可将墙画成开放门洞。' },
      { id: 'zz-v4-east-old-gate', x: 1490, y: 765, label: '东部旧入口 · 朝百家巷', kind: 'boundary', scriptRef: 'CH2-01/07', note: '东向旧门有史料依据；此坐标、门形及 1890 开闭状态尚未核实，不能视作常规入口。' },
      { id: 'zz-v4-east-ruin', x: 1240, y: 570, label: '东部残园', kind: 'visual', scriptRef: 'CH2-07/08', note: '荒芜程度为剧情演绎，不是逐物复原。' },
      { id: 'zz-v4-window', x: 970, y: 335, label: '那扇窗 · 待核机位', kind: 'visual', scriptRef: 'CH2-09', note: '仅剧情一次性镜头，不在地图上提前提示。' },
      { id: 'zz-v4-wall-sketch', x: 1220, y: 745, label: '画三道墙', kind: 'interaction', scriptRef: 'CH2-10', note: '东部离园前由玩家亲手画，实际安全站位待标定。' },
    ],
    routeGraph: {
      // CH2 夜入东园的候选骨架；白天三闸在城图街层，不从这里连接西园或会馆。
      nodes: [
        { id: 'east-night-entry', x: 1460, y: 685, label: '东部墙内落脚', kind: 'entry', note: '乔瓷带入后的落脚候选；不是白天从旧门入园。' },
        { id: 'east-south-path', x: 1375, y: 710, label: '东园南侧小径', kind: 'waypoint', note: '避开水边与墙根；地面宽度须人工校准。' },
        { id: 'east-sketch', x: 1220, y: 745, label: '画三道墙', kind: 'goal', anchorId: 'zz-v4-wall-sketch', note: 'CH2-10 临离园站位；不提前展示交互。' },
        { id: 'east-observe', x: 1165, y: 635, label: '隔墙观察', kind: 'waypoint', note: '仅从东园侧看中西分界；不跨墙。' },
      ],
      edges: [
        { from: 'east-night-entry', to: 'east-south-path', state: 'candidate', note: '夜间入园后沿东侧旱路行走。' },
        { from: 'east-south-path', to: 'east-sketch', state: 'candidate', note: '沿南侧路到记墙点。' },
        { from: 'east-sketch', to: 'east-observe', state: 'candidate', note: '东部观察边界，不能跨入会馆。' },
      ],
    },
  },
  {
    id: 'zhuozheng-whole-garden-study-v3', label: '拙政园 · 旧三界试稿 v3（南门错误）',
    asset: '../assets/scene25d/zhuozheng-whole-garden-study-v3.png',
    width: 1536, height: 1024, tileW: 96, tileH: 64,
    note: '旧试稿保留草稿：虽撤去 v2 南侧长直河及巨型东塘，但把东部旧门错误地画在南面；园林局记载其朝东通百家巷。不得作为正式几何来源，改用 v4 继续标定。',
    storyAnchors: [
      { id: 'zz-v3-buyuan-gate', x: 190, y: 808, label: '西部补园私门', kind: 'boundary', scriptRef: 'CH2-01', note: '张氏家园在西，初访不可入；确切 1890 门位与门房待史料核定。' },
      { id: 'zz-v3-huiguan-gate', x: 580, y: 802, label: '中部会馆门', kind: 'boundary', scriptRef: 'CH2-02/03', note: '会馆与补园各有产权，不可画成同一游览入口；石刻做独立可读道具。' },
      { id: 'zz-v3-west-middle-wall', x: 355, y: 420, label: '西中产权墙', kind: 'boundary', scriptRef: 'CH2-08/10', note: '边界位置为视觉候选；不许预设可通过门洞。' },
      { id: 'zz-v3-middle-east-wall', x: 1030, y: 450, label: '中东产权墙', kind: 'boundary', scriptRef: 'CH2-07/08/10', note: '夜间翻墙的精确位置待核；此处不得当作日常通路。' },
      { id: 'zz-v3-east-ruin', x: 1250, y: 590, label: '归田园居残园', kind: 'visual', scriptRef: 'CH2-07/08', note: '荒芜程度是剧本演绎；不能称逐物复原，也不应画成占满东部的沼泽。' },
      { id: 'zz-v3-window', x: 960, y: 330, label: '那扇窗 · 机位待核', kind: 'visual', scriptRef: 'CH2-09', note: '玩家退身时才出现一次；当前坐标不是历史窗位。' },
      { id: 'zz-v3-wall-sketch', x: 1220, y: 745, label: '画三道墙', kind: 'interaction', scriptRef: 'CH2-10', note: '回到东部临离园时由玩家亲手画；不提前弹任务卡。' },
    ],
  },
  {
    id: 'zhuozheng-whole-garden-study', label: '拙政园 · 旧误稿 v2（保留草稿）',
    asset: '../assets/scene25d/zhuozheng-whole-garden-study-v2.png',
    width: 1536, height: 1024, tileW: 96, tileH: 64,
    note: '旧误稿仅供比较及保留浏览器草稿：南侧长直河未核、东部巨型荒塘失真，且西部私园门的锚点错标到东部。不得作为正式几何来源；改用 v3 重新标定。',
    storyAnchors: [
      { id: 'zz-private-gate', x: 1250, y: 850, label: '东园外墙', kind: 'boundary', scriptRef: 'CH2-01/07', note: '初访不可入；夜间从归田园居废址一侧翻墙。实际夜路另场制作。' },
      { id: 'zz-huiguan-gate', x: 620, y: 600, label: '会馆门', kind: 'boundary', scriptRef: 'CH2-02', note: '中部不是公共入口；不可做为普通开门交互。' },
      { id: 'zz-middle-wall', x: 930, y: 435, label: '中东隔墙', kind: 'boundary', scriptRef: 'CH2-08', note: '三块地的边界是玩法核心；碰撞必须闭合。' },
      { id: 'zz-watcher-window', x: 865, y: 320, label: '那扇窗', kind: 'visual', scriptRef: 'CH2-09', note: '仅此一次、不可回看；在玩家做完观察正要退时出现。' },
      { id: 'zz-wall-sketch', x: 1120, y: 730, label: '画三道墙', kind: 'interaction', scriptRef: 'CH2-10', note: '应在返回荒园、准备离开时触发，不提前发任务卡。' },
    ],
  },
  {
    id: 'huanxiu-whole-garden-study', label: '环秀山庄 · 山径试稿',
    asset: '../assets/scene25d/huanxiu-whole-garden-study-v1.png',
    width: 1536, height: 1024, tileW: 96, tileH: 64,
    note: '以今日假山平面约束水石拓扑，西侧庄屋为演绎；1980 年代复建建筑不得作为 1890 实景。山体路径拓扑和层高尚未核，不能上线。',
    storyAnchors: [
      { id: 'hx-yizhuang-gate', x: 360, y: 810, label: '汪氏义庄门', kind: 'trigger', scriptRef: 'CH6-02', note: '朴素院墙，不画飞檐；园名不是街坊称呼。' },
      { id: 'hx-ledger', x: 300, y: 300, label: '账房划线', kind: 'interaction', scriptRef: 'CH6-03/04', note: '算盘、账册、被划掉的两行要做独立可读道具。' },
      { id: 'hx-east-inscription', x: 625, y: 245, label: '东偏有园', kind: 'interaction', scriptRef: 'CH6-05', note: '嵌墙碑为剧本演绎；不在碑上写园名。' },
      { id: 'hx-mountain-first-view', x: 760, y: 630, label: '第一眼山', kind: 'visual', scriptRef: 'CH6-06', note: '山脚步道看藤—水—补秋舫—山；不出现交互提示。' },
      { id: 'hx-copy-scroll', x: 325, y: 120, label: '旧箱与摹本', kind: 'interaction', scriptRef: 'CH6-08', note: '卷子是摹本，绝非《具区林屋图》真迹。' },
      { id: 'hx-summit-path', x: 930, y: 185, label: '登山与峰洞', kind: 'trigger', scriptRef: 'CH6-09/10', note: '御·行路；峰、溪、水榭、洞四处标记需再细分，山路须另建高低层几何。' },
    ],
  },
  {
    id: 'yipu-whole-garden-study', label: '艺圃 · 旧试稿 v2（缺延光阁）',
    asset: '../assets/scene25d/yipu-whole-garden-study-v2.png',
    width: 1184, height: 1328, tileW: 74, tileH: 83,
    note: '旧图保留浏览器草稿：虽有东宅西园、池南土山、池东乳鱼亭与西侧小院，却漏掉池北横跨水面的延光阁主体；不可作为正式几何底图。',
    storyAnchors: [
      { id: 'yipu-guild-gate', x: 1080, y: 1040, label: '深巷公所门', kind: 'trigger', scriptRef: 'CH9-03', note: '1890 为七襄公所；门额内容和位置待考。' },
      { id: 'yipu-busy-forecourt', x: 945, y: 990, label: '活计占满前院', kind: 'visual', scriptRef: 'CH9-04', note: '让玩家第一眼看不到园；货物精灵可移除，不涂死在底图。' },
      { id: 'yipu-inset-tablet', x: 690, y: 580, label: '廊下规条碑', kind: 'interaction', scriptRef: 'CH9-05/11', note: '嵌墙青石，不是碑亭；碑刻位置属于剧本演绎。' },
      { id: 'yipu-pond-seat', x: 675, y: 765, label: '池边少一笔', kind: 'interaction', scriptRef: 'CH9-06/08/09', note: '池东步道上的候选操作点；同一机位看水、墙、山，可坐下、摊园谱，之后听声。' },
      { id: 'yipu-south-earth-hill', x: 380, y: 1050, label: '池南土山', kind: 'interaction', scriptRef: 'CH9-07', note: '土山为主、湖石护坡；不得画成纯湖石大山。' },
      { id: 'yipu-west-moon-gate', x: 255, y: 800, label: '芹庐月洞门', kind: 'trigger', scriptRef: 'CH9-07', note: '进入西院与小池，门洞需可通过。' },
      { id: 'yipu-accounts', x: 950, y: 1060, label: '司事账桌', kind: 'npc', scriptRef: 'CH9-10', note: '司事收账、石块压纸；只给场景物证，不念制度说明。' },
    ],
    routeGraph: {
      nodes: [
        { id: 'entry', x: 1080, y: 1040, label: '东侧巷门', kind: 'entry', anchorId: 'yipu-guild-gate', note: '1890 公所入口待核，不把今日门额当证据。' },
        { id: 'forecourt', x: 945, y: 990, label: '忙碌前院', kind: 'waypoint', anchorId: 'yipu-busy-forecourt', note: '货物可移；留出人物通路。' },
        { id: 'accounts', x: 950, y: 1060, label: '司事账桌', kind: 'goal', anchorId: 'yipu-accounts', note: 'NPC 交互点须在账桌前。' },
        { id: 'east-south-passage', x: 735, y: 930, label: '东廊南段', kind: 'waypoint', note: '避开墙基和前院小池。' },
        { id: 'east-middle-passage', x: 690, y: 760, label: '东廊池边', kind: 'waypoint', note: '水与廊之间需要独立池岸碰撞。' },
        { id: 'tablet', x: 690, y: 580, label: '廊下青石', kind: 'goal', anchorId: 'yipu-inset-tablet', note: '碑是嵌墙，不占步道。' },
        { id: 'north-hall', x: 650, y: 300, label: '北部堂屋', kind: 'waypoint', note: '宅园交界与厅内门槛待核。' },
        { id: 'pond-seat', x: 675, y: 765, label: '池东坐点', kind: 'goal', anchorId: 'yipu-pond-seat', note: 'CH9-08/09 共享机位，人物不能站水里。' },
        { id: 'south-turn', x: 565, y: 955, label: '池南转折', kind: 'waypoint', note: '沿岸向土山，不从水面抄近路。' },
        { id: 'earth-hill', x: 380, y: 1050, label: '土山脚', kind: 'goal', anchorId: 'yipu-south-earth-hill', note: '主体土山；湖石仅局部护坡。' },
        { id: 'west-moon-gate', x: 255, y: 800, label: '芹庐月门', kind: 'portal', anchorId: 'yipu-west-moon-gate', note: '月洞门下必须可通行。' },
        { id: 'west-bank', x: 190, y: 600, label: '池西窄路', kind: 'waypoint', note: '池岸与墙之间宽度待实测。' },
        { id: 'north-west-court', x: 350, y: 305, label: '北西庭院', kind: 'waypoint', note: '与北堂连通，形成环池回路。' },
      ],
      edges: [
        { from: 'entry', to: 'forecourt', state: 'candidate', note: '东巷入公所。' },
        { from: 'forecourt', to: 'accounts', state: 'candidate', note: '前院至账桌。' },
        { from: 'forecourt', to: 'east-south-passage', state: 'candidate', note: '经前院入东廊。' },
        { from: 'east-south-passage', to: 'east-middle-passage', state: 'candidate', note: '东廊沿池北行。' },
        { from: 'east-middle-passage', to: 'tablet', state: 'candidate', note: '廊下见碑。' },
        { from: 'tablet', to: 'north-hall', state: 'candidate', note: '廊至北部堂屋。' },
        { from: 'east-middle-passage', to: 'pond-seat', state: 'candidate', note: '步道至坐点。' },
        { from: 'pond-seat', to: 'south-turn', state: 'candidate', note: '沿池东南岸走。' },
        { from: 'south-turn', to: 'earth-hill', state: 'candidate', note: '池南至土山。' },
        { from: 'earth-hill', to: 'west-moon-gate', state: 'candidate', note: '山脚转西院；核月门方位。' },
        { from: 'west-moon-gate', to: 'west-bank', state: 'candidate', note: '西侧窄路。' },
        { from: 'west-bank', to: 'north-west-court', state: 'candidate', note: '绕池西北行。' },
        { from: 'north-west-court', to: 'north-hall', state: 'candidate', note: '经北庭回到堂屋，形成环线。' },
      ],
    },
  },
];

const yipuV2 = SCENE_PLATES_BASE.find((plate) => plate.id === 'yipu-whole-garden-study')!;
const yipuV3: ScenePlate = {
  ...yipuV2,
  id: 'yipu-whole-garden-study-v3',
  label: '艺圃 · 池北延光阁修订试稿 v3',
  asset: '../assets/scene25d/yipu-whole-garden-study-v3.png',
  note: '池北补出横向五开间临水延光阁，北接庭院与主厅，东侧保留入阁路径；延光阁为晚清七襄公所时期空间，不照搬 1984 年匾额。阁前缘、支柱、廊门和水面扣除区仍需人工核对，不能直接当正式碰撞底图。v2 与浏览器草稿保留。',
  storyAnchors: [
    ...(yipuV2.storyAnchors ?? []),
    { id: 'yipu-v3-yanguangge', x: 420, y: 515, label: '延光阁 · 临水向南', kind: 'visual', scriptRef: 'CH9-06/08/09', note: '池北五开间水榭，为玩家池东坐点所见的对景；可进入但不另发任务。阁内脚点与水面界线待编辑器实走。' },
  ],
  routeGraph: {
    nodes: [
      ...(yipuV2.routeGraph?.nodes ?? []),
      { id: 'yanguangge-east-portal', x: 560, y: 520, label: '延光阁东端门', kind: 'portal', note: '与东侧廊道的门洞候选；不可穿墙或落水。' },
      { id: 'yanguangge-floor', x: 420, y: 515, label: '延光阁临水廊面', kind: 'goal', anchorId: 'yipu-v3-yanguangge', note: '五开间水榭内的候选脚点；阁前缘下方为水，碰撞必须沿栏杆截止。' },
    ],
    edges: [
      ...(yipuV2.routeGraph?.edges ?? []),
      { from: 'tablet', to: 'yanguangge-east-portal', state: 'candidate', note: '仅保留路线意图；v3 图上碑位至阁东门之间被东侧建筑和庭墙切断，不能直接开放 Tile，须重核底图和门廊连接。' },
      { from: 'yanguangge-east-portal', to: 'yanguangge-floor', state: 'candidate', note: '沿水榭室内地面西行；不得走进池面。' },
    ],
  },
};

const lvyinExistingPlate = SCENE_PLATES_BASE.find((plate) => plate.id === 'liuyuan-lvyin-pond-study-v1')!;
const lvyinPixelStudy: ScenePlate = {
  ...lvyinExistingPlate,
  id: 'liuyuan-lvyin-pond-pixel-study-v2',
  label: '留园 · 绿荫轩临池像素语言【独立校位】',
  asset: '../research-art/liuyuan-lvyin-pixel-language-study-v2.png',
  storyAnchors: lvyinExistingPlate.storyAnchors?.map((anchor) => ({
    ...anchor, scriptRef: '独立几何研究',
    note: `${anchor.note} 本独立稿只用于像素与原轮廓对照，不触发 CH3。`,
  })),
  note: '用旧临池图作几何编辑目标、入口斜俯视图作像素语言参照；针对树冠重复和单调驳岸修订的现状启发研究稿。沿用旧图岸路和栏杆的代码轮廓作对照，未逐像素复核新图的栏脚与水线，且旧图本身并非清末测绘；不接 CH3、不替换旧图或草稿。到池边按 E 的主动望池操作可在独立页校画面节奏。',
};

export const SCENE_PLATES: readonly ScenePlate[] = [
  ...SCENE_PLATES_BASE.slice(0, -1),
  lvyinPixelStudy,
  yipuV3,
  yipuV2,
];

/** 只有这些试玩页会在 ?draft=1 时读取同场景的编辑器 Tile/轮廓。 */
export const SCENE_DRAFT_PREVIEWS: Readonly<Record<string, { href: string; label: string }>> = {
  'liuyuan-entrance-topology-study': { href: 'liuyuan-entry.html?draft=1', label: '预览留园入口 · 当前草稿' },
  'liuyuan-entry-gate-misty-study-v2': { href: 'liuyuan-entry-gate-misty-study.html?draft=1', label: '预览冷调门墙 · 独立研究草稿' },
  'liuyuan-entry-oblique-shot-study-v1': { href: 'liuyuan-entry-oblique-study.html?draft=1', label: '预览入口斜俯视首镜头 · 独立校位草稿' },
  'liuyuan-entry-lower-camera-study-v1': { href: 'liuyuan-entry-lower-camera-study.html?draft=1', label: '预览入口低机位 · 独立研究草稿' },
  'liuyuan-alley-misty-study-v1': { href: 'liuyuan-alley-misty-study.html?draft=1', label: '预览冷调夹弄 · 独立研究草稿' },
  'liuyuan-tree-court-no-water-study-v1': { href: 'liuyuan-court.html?draft=1', label: '预览留园小庭 · 当前草稿' },
  'liuyuan-lvyin-pond-study-v1': { href: 'liuyuan-lvyin.html?draft=1', label: '预览绿荫轩临池 · 当前草稿' },
  'liuyuan-lvyin-pond-pixel-study-v2': { href: 'liuyuan-lvyin.html?artStudy=pixel-v2&draft=1', label: '预览绿荫轩像素校位 · 独立草稿' },
  'liuyuan-flower-work-yard-study-v3': { href: 'liuyuan-flower.html?draft=1', label: '预览花木作业院 · 当前草稿' },
  'liuyuan-youyicun-transition-study-v1': { href: 'liuyuan-youyicun-study.html?draft=1', label: '预览现状圆门几何 · 当前草稿' },
  'liuyuan-east-hall-magnolia-court-study-v1': { href: 'liuyuan-east-hall.html?draft=1', label: '预览宅院厅前 · 当前草稿' },
  'liuyuan-stone-forest-court-study-v1': { href: 'liuyuan-stone-forest.html?draft=1', label: '预览石林小院 · 当前草稿' },
  'liuyuan-study-court-research-v1': { href: 'liuyuan-study-court.html?draft=1', label: '预览北缘书斋院 · 当前草稿' },
  'liuyuan-study-interior-research-v1': { href: 'liuyuan-study-interior.html?draft=1', label: '预览书斋内景 · 当前草稿' },
  'liuyuan-dongtian-three-windows-study-v1': { href: 'liuyuan-window-study.html?debug=geometry&draft=1', label: '预览三窗辨影 · 当前草稿' },
  'liuyuan-guanyun-court-study-v1': { href: 'liuyuan-guanyun.html?draft=1', label: '预览冠云峰旧稿 · 当前草稿' },
  'liuyuan-guanyun-court-study-v2': { href: 'liuyuan-guanyun-v2.html?draft=1', label: '预览冠云峰／南厅 v2 · 当前草稿' },
};

/**
 * 私有制作端的 RAG 候选索引。这里只存定位线索，不收录书中图片或原文。
 * pending 条目不得进入清末故事层、园谱、正式场景美术或游戏资源包。
 */
export interface SceneResearchCandidate {
  id: string;
  sceneId: string;
  topic: string;
  sourceTitle: string;
  localPath: string;
  locator: string;
  productionUse: string;
  verifyBeforeUse: string;
  studyAsset?: string;
  studyPage?: string;
  review: 'pending';
  imageRights: 'unreviewed';
}

const CORPUS = '../../SuzhouClassicGardenRag/Project/converted/';

export const SCENE_RESEARCH_CANDIDATES: readonly SceneResearchCandidate[] = [
  {
    id: 'ly-youyicun-round-opening', sceneId: 'liuyuan-youyicun-transition-study-v1',
    topic: '花房／小蓬莱—又一村—四面厅的反向返园路与圆门现状图', sourceTitle: '《园庭信步·风月长留》',
    localPath: `${CORPUS}园庭信步 中国古典园林文化解读 (曹林娣著, Cao Lindi zhu, 曹林娣著, 曹林娣) /hybrid_auto/园庭信步 中国古典园林文化解读 (曹林娣著, Cao Lindi zhu, 曹林娣著, 曹林娣) .md`,
    locator: '图 5-2 留园平面图、图 5-23 柳暗花明又一村；原书扫描已人工看图，照片是现状而非清末',
    productionUse: '只借门洞与“转过去才有园路”的空间关系制作研究切片；不复制扫描像素或门额文字。',
    verifyBeforeUse: '取得可靠清末平面、圆门年代及花房至四面厅实走接口；人工核铺地、树种与人物/门高比例。',
    studyAsset: '../research-art/liuyuan-youyicun-transition-pixel-study-v1.png',
    studyPage: 'liuyuan-youyicun-study.html',
    review: 'pending', imageRights: 'unreviewed',
  },
  {
    id: 'ly-stone-hesuo-frame-depth', sceneId: 'liuyuan-stone-forest-court-study-v1',
    topic: '鹤所方门—空窗—花窗—芭蕉的多重视线', sourceTitle: '《图说苏州园林·门窗》',
    localPath: `${CORPUS}图说苏州园林 门窗 (曹林娣) (z-library.sk, 1lib.sk, z-lib.sk)/hybrid_auto/图说苏州园林 门窗 (曹林娣) (z-library.sk, 1lib.sk, z-lib.sk).md`,
    locator: '图 2-5 至图 2-6、图 5-20 至图 5-22；已人工查看图 2-5，但各图需逐张核位置与朝向',
    productionUse: 'CH3-06 可以设计“看见芭蕉却不能直穿窗”的辨路；生成像素图只演示层次，不是门洞实测。',
    verifyBeforeUse: '对照实景平面标定鹤所与石林小院的门窗；核清末状态和图像授权，再决定正式窗格。',
    studyAsset: '../research-art/liuyuan-stone-forest-pattern-research-v2-pixel.png',
    review: 'pending', imageRights: 'unreviewed',
  },
  {
    id: 'ly-ice-crack-paving-location', sceneId: 'liuyuan-stone-forest-court-study-v1',
    topic: '留园冰裂纹铺地：图案属实，石林小院位置未证实', sourceTitle: '《图说苏州园林·铺地》',
    localPath: `${CORPUS}图说苏州园林 铺地 (曹林娣) (z-library.sk, 1lib.sk, z-lib.sk)/hybrid_auto/图说苏州园林 铺地 (曹林娣) (z-library.sk, 1lib.sk, z-lib.sk).md`,
    locator: '图 1-22；原书图版可见不规则冰裂拼接，但未标园内拍摄点',
    productionUse: '只作材质候选，不据此宣称石林小院或 CH3 必经路面为冰裂纹。',
    verifyBeforeUse: '补带方位的铺地实景照片及测绘，再把纹样实例绑定到具体 Tile 区域。',
    review: 'pending', imageRights: 'unreviewed',
  },
  {
    id: 'ly-stone-dongtian-three-windows', sceneId: 'liuyuan-stone-forest-court-study-v1',
    topic: '“洞天一碧”小屋：中八角、两侧六角；竹与蕉的方位', sourceTitle: '《图说苏州园林·门窗》',
    localPath: `${CORPUS}图说苏州园林 门窗 (曹林娣) (z-library.sk, 1lib.sk, z-lib.sk)/hybrid_auto/图说苏州园林 门窗 (曹林娣) (z-library.sk, 1lib.sk, z-lib.sk).md`,
    locator: '图 5-47、图 5-56 及相邻段落；文字称东侧翠竹、西侧芭蕉，两张图版已人工看图',
    productionUse: '比“认出六角窗”更有戏：玩家须分辨两孔同为六角但窗后竹/蕉不同，再以中间八角窗复核方位。',
    verifyBeforeUse: '核三窗与小屋的同一拍摄部位、清末存貌及真实可走入口；独立研究页现有三窗图，但仍不能据此接成正式石林门路。',
    studyPage: 'liuyuan-window-study.html',
    review: 'pending', imageRights: 'unreviewed',
  },
  {
    id: 'ly-dongtian-window-room-plate', sceneId: 'liuyuan-dongtian-three-windows-study-v1',
    topic: '三窗独立研究房间：中扁八角、西蕉、东竹', sourceTitle: '《图说苏州园林·门窗》',
    localPath: `${CORPUS}图说苏州园林 门窗 (曹林娣) (z-library.sk, 1lib.sk, z-lib.sk)/hybrid_auto/图说苏州园林 门窗 (曹林娣) (z-library.sk, 1lib.sk, z-lib.sk).md`,
    locator: '图 5-47、图 5-56 及相邻文字；2026-10-04 离线文字向量再次命中，图版已人工复看',
    productionUse: '此编辑器条目只标当前游戏研究图的地面、三个可达脚点和草稿，不是实景测绘。',
    verifyBeforeUse: '取得带方向的平面和同期证据后，才能把小屋接入石林章节链。',
    studyAsset: '../research-art/liuyuan-dongtian-three-windows-game-study-v2.png',
    studyPage: 'liuyuan-window-study.html',
    review: 'pending', imageRights: 'unreviewed',
  },
  {
    id: 'ly-g2-hall-window-patterns', sceneId: 'liuyuan-guanyun-court-study-v2',
    topic: '林泉耆硕之馆的南北厅窗式', sourceTitle: '《图说苏州园林·门窗》',
    localPath: `${CORPUS}图说苏州园林 门窗 (曹林娣) (z-library.sk, 1lib.sk, z-lib.sk)/hybrid_auto/图说苏州园林 门窗 (曹林娣) (z-library.sk, 1lib.sk, z-lib.sk).md`,
    locator: '检索“林泉耆硕之馆”；重点核图 5-77、图 6-1、图 6-46 与对应图版',
    productionUse: '可帮助区分南北厅的窗式，但当前 v2 图的门窗不得据 OCR 直接重画。',
    verifyBeforeUse: '核原书图版、拍摄部位和现状照片；逐项确认它属于最终选定的清末故事时段。',
    review: 'pending', imageRights: 'unreviewed',
  },
  {
    id: 'ly-g2-east-expansion-date', sceneId: 'liuyuan-guanyun-court-study-v2',
    topic: '东园扩建年代与馆前陈设', sourceTitle: '《苏州园林匾额楹联鉴赏》第三版',
    localPath: `${CORPUS}苏州园林匾额楹联鉴赏(第三版) (曹林娣) /hybrid_auto/苏州园林匾额楹联鉴赏(第三版) (曹林娣) .md`,
    locator: '检索“1888—1891”“林泉耆硕之馆”“浣云沼”；核原书页码',
    productionUse: '材料给出的东园扩建时间横跨游戏设定年，可作为年代风险警报。',
    verifyBeforeUse: '核原书、园志及档案；未确认前不把现状厅内屏门、窗格或匾额写入清末故事层。',
    review: 'pending', imageRights: 'unreviewed',
  },
  {
    id: 'ly-g2-east-court-sequence', sceneId: 'liuyuan-guanyun-court-study-v2',
    topic: '东部院落与廊窗的空间层次', sourceTitle: '《园林有境》',
    localPath: `${CORPUS}园林有境/hybrid_auto/园林有境.md`,
    locator: '检索“揖峰轩、五峰仙馆、林泉耆硕之馆、冠云楼”',
    productionUse: '提示东部并非一块敞庭；可用来复核分院、廊庑与窗的层次感。',
    verifyBeforeUse: '这是后世论述，须与有方位的平面及多角度实景交叉核对，不能据此定门位。',
    review: 'pending', imageRights: 'unreviewed',
  },
];

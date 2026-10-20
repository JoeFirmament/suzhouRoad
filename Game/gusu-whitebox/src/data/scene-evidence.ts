export type EvidenceGrade = 'A' | 'B' | 'C';
export type ProductionState = 'reference' | 'geometry' | 'playable' | 'verified';

export interface SceneSource {
  id: string;
  title: string;
  url?: string;
  local?: string;
  grade: EvidenceGrade;
  note: string;
}

export interface SceneEvidence {
  id: string;
  title: string;
  period: string;
  state: ProductionState;
  sources: readonly SceneSource[];
  verifiedFacts: readonly string[];
  inferredForPlay: readonly string[];
  redLines: readonly string[];
}

/**
 * 所有正式场景的“实景门槛”。A=同期史料/测绘，B=权威机构与保护规划，C=合理演绎。
 * 旧卡里的“1890”仍是原剧本考据口径，不代表新时间设定已经逐章审定；
 * 参见 Game/姑苏九园-时间设定与史实边界.md，切忌批量换词后宣称已验收。
 * C 级内容可以服务玩法，但不得在台词、图注或美术说明中伪装成原址复原。
 */
export const SCENE_EVIDENCE: readonly SceneEvidence[] = [
  {
    id: 'opening-city-south',
    title: '序章 · 苏州城南水巷',
    period: '光绪十六年前后（约 1890）',
    state: 'geometry',
    sources: [{
      id: 'sucheng-1890', title: '《蘇城全圖》清末城市底本',
      local: '../assets/sucheng1890/', grade: 'A',
      note: '只用于河街格局和城南方向；当前序章小桥与铺面并非某条实名街巷复原。',
    }],
    verifiedFacts: ['城南河街相间，水路是辨认城市方向的重要依据。'],
    inferredForPlay: ['昆曲声绕水而来', '无名小桥与临水岔路', '从水巷步行至府学的连续镜头'],
    redLines: ['不得给未考证的小桥、巷道和店铺安上真实地名', '不得把序章画面称为原址复原'],
  },
  {
    id: 'fuxue-west-home',
    title: '苏州府学 Home · 西学切片',
    period: '光绪十六年前后（约 1890）',
    state: 'playable',
    sources: [{
      id: 'fuxue-museum', title: '苏州碑刻博物馆（苏州文庙管理所）单位简介',
      url: 'https://wglj.suzhou.gov.cn/szwhgdhlyj/wgjjgsz/202110/c3aaa7c3d3b74b0d9cc198d49f28a610.shtml',
      grade: 'B', note: '确认府学文庙沿革、现存明代重修风格、规模与碑刻/拓片功能。',
    }, {
      id: 'fuxue-design', title: '《苏州府学 Home 设计定案》',
      local: '../姑苏九园-苏州府学Home设计定案.md', grade: 'C',
      note: '西学宿舍、个人书案与生活道具为游戏功能切片，不宣称对应现存具体房号。',
    }],
    verifiedFacts: ['府学文庙为庙学复合空间', '府学保存碑刻与拓片', '现存建筑多保留明代重修风格'],
    inferredForPlay: ['西侧斋舍作为玩家宿舍', '院内小水面与桥', '书案、床铺、箱笼的具体摆位'],
    redLines: ['西学门前不画未经证实的河道', '不把当前切片冒充完整府学总平面', '现代文庙广场及 2002 年后设施不得进入 1890 场景'],
  },
  {
    id: 'sucheng-1890-world',
    title: '《蘇城全圖》RPG 世界层',
    period: '清末苏州',
    state: 'geometry',
    sources: [{
      id: 'sucheng-1890', title: '《蘇城全圖》离线底本与转译资产',
      local: '../assets/sucheng1890/', grade: 'A',
      note: '世界层只使用城墙、河道、主街和园址关系；不以《平江图》代替清末日常地图。',
    }, {
      id: 'pingjiang-stele', title: '苏州碑刻博物馆《平江图》说明',
      url: 'https://wglj.suzhou.gov.cn/szwhgdhlyj/wgjjgsz/202110/c3aaa7c3d3b74b0d9cc198d49f28a610.shtml',
      grade: 'B', note: '《平江图》是宋代城市记忆与府学藏碑，不是 1890 日常导航底图。',
    }],
    verifiedFacts: ['府学与沧浪亭位于古城南部且相邻', '城市辨路以河道、桥与街巷共同构成'],
    inferredForPlay: ['地图随课业逐步显墨', '未解锁区域以留白呈现'],
    redLines: ['现代道路和地铁不得写进 1890 世界层', '《平江图》不得作为清末实时导航地图'],
  },
  {
    id: 'canglang-garden',
    title: '沧浪亭 · 整园导航',
    period: '晚清修复后的沧浪亭',
    state: 'playable',
    sources: [{
      id: 'late-qing-visit', title: '清人《游沧浪亭记》',
      url: 'https://ylj.suzhou.gov.cn/szsylj/ylwh/201910/dd3ad8eba81d49ffbef0d51403b9c265.shtml',
      grade: 'A', note: '给出渡桥、山门、假山、水池、廊、面水轩等晚清空间次序。',
    }, {
      id: 'current-visitor-plan', title: '沧浪亭全景导览图（含北箭头）',
      url: 'https://news.2500sz.com/uploadfiles/202509/08/2025090810003176504948.jpg',
      grade: 'B', note: '用于核对今天的入口、桥、水和园界方位；1890 断代仍须与同期史料交叉核查。',
    }, {
      id: 'unesco-plan', title: 'UNESCO 沧浪亭保护范围及缓冲区平面图',
      url: 'https://whc.unesco.org/document/104745', grade: 'B',
      note: '用于现状方位、园界与周边城市关系，不直接代替 1890 建筑断代。',
    }],
    verifiedFacts: ['现状导览图示园南及西侧临外水，南侧经桥入园', '入门见山，山与水构成主景', '复廊联系园内山景与园外水景', '面水轩位于复廊西端'],
    inferredForPlay: ['整园压缩为 1 tile 约 1 米', '三扇教学窗的位置与朱框', '若干树位、花境和支路宽度'],
    redLines: ['不可再将入口桥与园外水画到北侧', '三扇教学窗必须标作艺术加工', '未经逐扇实勘不得给漏窗绑定真实纹样', '保护区图上的现代道路不能直接进入晚清园内'],
  },
  {
    id: 'canglang-corridor',
    title: '沧浪亭 · 复廊近景',
    period: '晚清空间关系 / 游戏近景演绎',
    state: 'playable',
    sources: [{
      id: 'garden-bureau-corridor', title: '苏州市园林局 · 园林建筑“复廊”说明',
      url: 'https://ylj.suzhou.gov.cn/szsylj/ylys/201903/484421d38f504f5787a8f307925e3ad7.shtml',
      grade: 'B', note: '确认复廊由两廊夹墙、以漏窗联系两侧景区并产生步移景异。',
    }, {
      id: 'late-qing-visit', title: '清人《游沧浪亭记》',
      url: 'https://ylj.suzhou.gov.cn/szsylj/ylwh/201910/dd3ad8eba81d49ffbef0d51403b9c265.shtml',
      grade: 'A', note: '确认临水建筑、廊线与面水轩等空间关系。',
    }, {
      id: 'canglang-window-figures', title: '曹林娣《图说苏州园林·花窗》沧浪亭图例',
      local: '../../SuzhouClassicGardenRag/Project/converted/图说苏州园林 花窗 (曹林娣) (z-library.sk, 1lib.sk, z-lib.sk)/hybrid_auto/',
      grade: 'C', note: '本地向量召回并人工核图 1-87、3-95、4-69、3-235、3-32、2-86；仅证纹样类型，不证本场具体窗位、序列与年代。',
    }],
    verifiedFacts: ['复廊以中墙和漏窗连接内山外水', '移动会改变透窗所见景物'],
    inferredForPlay: ['受约束中心路径', '三窗看—对—合机制', '差异化花窗纹样与窗外三幅景', '右上柿树与果实'],
    redLines: ['不得宣称具体花窗纹样的顺序、三处窗位或柿树位置是历史原貌', '水纹不得覆盖廊面与石基', '画面不画通长前栏不等于考证证明原址无栏杆'],
  },
  {
    id: 'canglang-whole-garden-study-v2', title: '沧浪亭 · 灰绿视觉试稿 v2', period: '晚清空间关系 / 当代导览方位', state: 'reference',
    sources: [{ id: 'canglang-bureau', title: '苏州市园林局 · 沧浪亭',
      url: 'https://ylj.suzhou.gov.cn/szsylj/sjyc/201904/92cba6ca05a2451bb363c82895cc862e.shtml', grade: 'B',
      note: '外水、山林、复廊与堂馆的总体关系；不能证明图中每一门、每棵树。' }, {
      id: 'canglang-late-qing-walk', title: '清人《游沧浪亭记》',
      url: 'https://ylj.suzhou.gov.cn/szsylj/ylwh/201910/dd3ad8eba81d49ffbef0d51403b9c265.shtml', grade: 'A',
      note: '文中明确廊墙内外皆可行走，故整园图必须表现双侧地面。' }],
    verifiedFacts: ['园外水与园中山借景相接', '复廊墙内外皆可行走'],
    inferredForPlay: ['具体桥头与堂馆落脚点', '三窗视觉谜题位置'],
    redLines: ['当前图的双侧廊道仍不清楚，不得铺为正式可走地图', '不得用单侧窗墙代替复廊'],
  },
  {
    id: 'canglang-whole-garden-study', title: '沧浪亭 · 旧全园试稿 v1',
    period: '晚清空间关系 / 当代导览方位', state: 'reference',
    sources: [{ id: 'canglang-v1-bureau', title: '苏州市园林局 · 沧浪亭',
      url: 'https://ylj.suzhou.gov.cn/szsylj/sjyc/201904/92cba6ca05a2451bb363c82895cc862e.shtml', grade: 'B',
      note: '可约束园外水、复廊、山林和堂馆的总体关系，不证明旧图的门位与细部。' }],
    verifiedFacts: ['园外水经复廊漏窗与园内山景相联系'],
    inferredForPlay: ['旧图的桥头、门位和树位'],
    redLines: ['旧图只供草稿对比，不得替代 v2 或称为实测地图', '未核双侧廊地前不得铺成正式可走区'],
  },
  {
    id: 'wangshi-whole-garden-study', title: '网师园 · 宅园全图待校准稿',
    period: '现状空间关系参考；非 1890 实测', state: 'reference',
    sources: [{ id: 'wangshi-bureau', title: '苏州市园林局 · 网师园',
      url: 'https://ylj.suzhou.gov.cn/szsylj/sjyc/201905/8aaf3adcfdaf485dada9a071aac3867f.shtml', grade: 'B',
      note: '约束东部住宅、西部池园与厅堂名称；不能证明每处晚清门窗和陈设。' }],
    verifiedFacts: ['全园东部为住宅，西部为池园', '东部住宅包含轿厅、万卷堂和撷秀楼'],
    inferredForPlay: ['当前图的各房间门位、后门及小径宽度'],
    redLines: ['现状导览不直接等于 1890 年总平面', '门路未经逐一人工校准，不得作为正式关卡'],
  },
  {
    id: 'tuisi-whole-garden-study', title: '退思园 · 整园试稿', period: '清末时点待审；新筑园', state: 'reference',
    sources: [{ id: 'tuisi-bureau', title: '苏州市园林局 · 退思园',
      url: 'https://ylj.suzhou.gov.cn/szsylj/sjyc/201905/3fdb8e8723cc4a8a88f3e912d0c48af4.shtml', grade: 'B',
      note: '西宅、东园、水榭、退思草堂等格局；现存平面不能直接代表 1890 树木与陈设。' }],
    verifiedFacts: ['住宅位于西侧、园林位于东侧', '东园建筑环绕池水'],
    inferredForPlay: ['池边老树的剧本位置', '跨水月台与天桥的玩家触发坐标'],
    redLines: ['不把现存老树的今日树龄写成故事年代的既定事实', '宅院画理茶扫叶等生活气息；不做阴郁的仪式性陈设', 'CH8-10 借廊通行须区分可走外廊与禁入内宅；候选锚点坐标待校', '剧本视觉伏笔不能变为发光交互点'],
  },
  {
    id: 'ouyuan-whole-garden-study', title: '耦园 · 宅中双园试稿', period: '清末时点待审', state: 'reference',
    sources: [{ id: 'ouyuan-bureau', title: '苏州市园林局 · 耦园',
      url: 'https://ylj.suzhou.gov.cn/szsylj/sjyc/202509/b6e90b58ee1947fe9282ad5d7ecdae08.shtml', grade: 'B',
      note: '中部住宅，东西两园，东园黄石、西园湖石。' }],
    verifiedFacts: ['宅居中、园分东西', '东园黄石、西园湖石'],
    inferredForPlay: ['两块砚石的具体陈放坐标', '石凳上老仆的活动点'],
    redLines: ['今日新入口不能直接充当清末入口', '太极布局不能作为清末已证史实', '保留主家远行而宅院有人照看的生活感，不做悲剧暗示'],
  },
  {
    id: 'liuyuan-tree-court-no-water-study-v1', title: '留园 · 古木交柯小庭游戏试走', period: '现状空间关系参照；非 1890 实测', state: 'reference',
    sources: [{ id: 'liuyuan-court-bureau', title: '苏州市园林局 · 留园',
      url: 'https://ylj.suzhou.gov.cn/szsylj/sjyc/201905/b7c0f2058c75498c9ecbacf234e25b08.shtml', grade: 'B',
      note: '中部有池且绿荫轩临水，但不代表南侧入口就有园外河。' }, {
      id: 'liuyuan-court-windows', title: '苏州市地方志办 · 苏州古典园林漏窗艺术',
      url: 'https://dfzb.suzhou.gov.cn/dfzb/fzxh/201002/4310c9b7dad442b99b209d301b8cdd82.shtml', grade: 'B',
      note: '古木交柯前廊北墙现有六扇漏窗，文中按东到西列出六种纹样；第二项网页缺字，原图、尺寸和晚清存貌未核。' }, {
      id: 'liuyuan-court-road-water', title: '苏州市留园西园单元控规调整',
      url: 'https://www.suzhou.gov.cn/szsrmzf/zdzxghyjzjhjd/202109/fb69b8429f4e4edf9f7ca91918e8f3a7.shtml', grade: 'B',
      note: '留园路与更南面的上塘河是不同的地理边界；不能把街面小门直接画成临河码头。' }],
    verifiedFacts: ['留园中部池水位于园内，不是入口小门前的河道', '古木交柯前廊北墙现有六扇漏窗'],
    inferredForPlay: ['这一小庭的斜俯视机位与西向通路形状', '树冠、花台、铺地和墙面的画面细节'],
    redLines: ['自动路线与碰撞通过仅代表这张图的玩法试走；未做真机逐像素遮挡和真实门位核对，不得作为正式关卡', '不把北墙漏窗画作门洞', '不能把现状树形或窗格纹样冒充 1890 原貌', '入口幕不出现园外河或提前展示完整中池'],
  },
  {
    id: 'liuyuan-lvyin-pond-study-v1', title: '留园 · 绿荫轩临池游戏试走', period: '现状空间关系参照；非 1890 实测', state: 'reference',
    sources: [{ id: 'liuyuan-lvyin-bureau', title: '苏州市园林局 · 绿荫轩',
      url: 'https://ylj.suzhou.gov.cn/szsylj/ylwh/201808/befc4b49080d44989ca9b79439db3840.shtml', grade: 'B',
      note: '绿荫轩为临水敞轩，南有华步小筑庭；今见青枫、榉树的位置不直接视为 1890 原貌。' }, {
      id: 'liuyuan-lvyin-garden', title: '苏州市园林局 · 留园',
      url: 'https://ylj.suzhou.gov.cn/szsylj/sjyc/201905/b7c0f2058c75498c9ecbacf234e25b08.shtml', grade: 'B',
      note: '中部主池与东南建筑、西北山的总体关系。' }, {
      id: 'liuyuan-lvyin-historic', title: '苏州市园林局 · 《游苏备览·留园》',
      url: 'https://ylj.suzhou.gov.cn/szsylj/ylwh/201807/37222ea7f68c4ddd9cc08c9e769f39d7.shtml', grade: 'B',
      note: '民国记述池南有绿荫轩，能支持较早的空间关系，不足以精确复原 1890 年栏杆和柱位。' }],
    verifiedFacts: ['绿荫轩是园内中池南侧的临水敞轩', '园内中部以一片主池组织建筑与山景'],
    inferredForPlay: ['东侧进入脚点及轩前连贯石路', '具体栏杆、柱脚、树位、池岸和镜头构图'],
    redLines: ['只作为可行走视觉试稿，不把生成图当实测平面', '不将今日匾额、树形、栏杆或铺地形态写成 1890 既定事实', '临池水面属于园内中池，不是留园门外河道', '到花木作业院的镜头剪接只表示故事先后，不能冒充实测旧门洞'],
  },
  {
    id: 'liuyuan-lvyin-pond-pixel-study-v2', title: '留园 · 绿荫轩临池像素语言独立校位',
    period: '现状空间关系启发的游戏研究；非 1890 实测', state: 'reference',
    sources: [{
      id: 'lvyin-v2-bureau', title: '苏州市园林局 · 绿荫轩',
      url: 'https://ylj.suzhou.gov.cn/szsylj/ylwh/201808/befc4b49080d44989ca9b79439db3840.shtml',
      grade: 'B', note: '仅支持绿荫轩临水及与华步小筑的现状空间关系，不证本图逐柱逐树。'
    }, {
      id: 'lvyin-v2-rag', title: '本地 garden_knowledge · 《园林有境》留园水池与观景文字',
      local: '../../SuzhouClassicGardenRag/Project/converted/园林有境/hybrid_auto/园林有境.md',
      grade: 'C', note: '2026-10-10 离线文字向量召回留园水池及游廊一般论；未召回绿荫轩栏位、铺地或清末岸线的定点证据。'
    }, {
      id: 'lvyin-v2-art', title: '绿荫轩像素语言生成与拒用记录',
      local: '../research-art/liuyuan-lvyin-pixel-language-study-v2.prompt.md',
      grade: 'C', note: '旧可走图为几何编辑目标，入口新图仅作风格参照；生成稿保留轮廓的程度仍待逐像素审核。'
    }],
    verifiedFacts: ['绿荫轩与园内主池相邻', '园林局现状说明记轩西青枫、东榉树；不等于清末同株'],
    inferredForPlay: ['玩家到池边后才第一次完整看见池景', '沿用旧可走图的岸线、栏杆、石路、柱脚与初见镜头', '新图的树、石、墙与瓦片像素'],
    redLines: ['独立研究不接 CH3、不写旗标、不覆盖正式临池底图和旧玩家草稿',
      '生成稿不能叫 1890 复原；旧图也不是逐点测绘',
      '默认 Tile 通过不能证明新图逐像素对位，须查栏脚、水线、台阶与人物比例',
      '对岸现图并未清楚呈现可亭，不得以此图声称已兑现所有主景要求'],
  },
  {
    id: 'liuyuan-guanyun-court-study-v2', title: '留园冠云峰—林泉耆硕之馆 · 南北对景研究切片',
    period: '清末时点待审；现状资料与民国游记仅供空间参照', state: 'geometry',
    sources: [{ id: 'guanyun-v2-bureau', title: '苏州市园林局 · 留园',
      url: 'https://ylj.suzhou.gov.cn/szsylj/sjyc/201905/b7c0f2058c75498c9ecbacf234e25b08.shtml', grade: 'B',
      note: '林泉耆硕之馆的北侧是冠云峰，峰前为浣云沼，周边有冠云楼等赏石建筑；照片约束峰体剪影。' }, {
      id: 'guanyun-v2-study', title: '刘海燕等《留园冠云峰庭院空间造园要素的量化特征及其意境研究》',
      url: 'https://www.wendangwang.com/doc/ca9f8060008319449905174d', grade: 'B',
      note: '《安徽农业科学》2013, 41(21):8992–8996；在线转录有 OCR 错误，南厅—北楼对景须再核原版图 1。' }, {
      id: 'guanyun-v2-art', title: '冠云峰研究图 v2 图像说明',
      local: '../assets/scene25d/liuyuan-guanyun-court-study-v2.prompt.md', grade: 'C',
      note: '文本生成的 2.5D 研究图；所有具体立面、池岸、亭廊和植栽待核。' }],
    verifiedFacts: ['现状空间：林泉耆硕之馆在冠云峰南侧', '现状空间：冠云峰前有浣云沼，北侧有冠云楼等赏石建筑'],
    inferredForPlay: ['南厅檐廊、两侧岸路、池岸与北楼的图上像素', '所有门口、植栽与侧亭位置'],
    redLines: ['图面几何可通行不代表真实可走门路', '南厅、北楼、浣云沼须逐物核清末选定时点，不能由现状同框推定当时齐备', '不据此结算 CH3 书斋或玉兰状态', '不可将生成图称作清末实景复原；1909 前后改造提示现状亭廊不可自动回填', '旧 v1 缺少南厅围合，仅作误差对照'],
  },
  {
    id: 'liuyuan-guanyun-court-study-v1', title: '留园冠云峰前院 · 峰沼岸路研究切片',
    period: '旧稿，现状照片与民国游记参照；非 1890 实测', state: 'reference',
    sources: [{ id: 'guanyun-bureau', title: '苏州市园林局 · 留园（冠云峰照片）',
      url: 'https://ylj.suzhou.gov.cn/szsylj/sjyc/201905/b7c0f2058c75498c9ecbacf234e25b08.shtml', grade: 'B',
      note: '主峰瘦长多孔，前有浣云沼，背后有赏石建筑；一张照片不能推出周边完整门路。' }, {
      id: 'guanyun-tour', title: '朱揖文《游苏备览·留园》（民国，园林局转录）',
      url: 'https://ylj.suzhou.gov.cn/szsylj/ylwh/201807/37222ea7f68c4ddd9cc08c9e769f39d7.shtml', grade: 'B',
      note: '记石林小院向东园的游览顺序及冠云峰、沼、堂；并非 1890 测绘。' }, {
      id: 'guanyun-asset', title: '冠云峰研究图 v1 图像说明',
      local: '../assets/scene25d/liuyuan-guanyun-court-study-v1.prompt.md', grade: 'C',
      note: '内置图像生成的文本提示与待核细部；不含照片像素输入。' }],
    verifiedFacts: ['现状冠云峰为瘦长多孔峰石，峰前有浣云沼', '东园有围绕主峰的观石建筑'],
    inferredForPlay: ['池岸曲线、左右岸路、厅堂立面、植栽与所有脚点', '前庭到左右侧路的绕行玩法'],
    redLines: ['缺少南侧林泉耆硕之馆围合，北侧冠云楼层次也画错；不得作为正式美术', '候选图不等于真实平面或 1890 园貌', '不把两侧小峰命名为瑞云峰或岫云峰', '未核门位前不得接入正式 CH3 任务结算', '玩家不能涉水或穿过峰基'],
  },
  {
    id: 'liuyuan-dongtian-three-windows-study-v1', title: '留园洞天一碧 · 三窗辨影研究切片',
    period: '现存图版形制；清末同貌与小屋通路未核', state: 'geometry',
    sources: [{
      id: 'dongtian-doors-book', title: '曹林娣《图说苏州园林·门窗》图 5-47、5-56',
      local: '../../SuzhouClassicGardenRag/Project/converted/图说苏州园林 门窗 (曹林娣) (z-library.sk, 1lib.sk, z-lib.sk)/hybrid_auto/图说苏州园林 门窗 (曹林娣) (z-library.sk, 1lib.sk, z-lib.sk).md',
      grade: 'B', note: '本地文字向量检索命中并人工复看两张原书图版；中扁八角、两侧六角及东竹西蕉有文字依据。扫描图仅内部研究。' }, {
      id: 'dongtian-art-prompt', title: '原创像素研究图制作记录',
      local: '../research-art/liuyuan-dongtian-three-windows-game-study-v2.prompt.md',
      grade: 'C', note: '图像生成提示、参考图用途和未核内容；不是现状测绘或清末复原。' }],
    verifiedFacts: ['资料描述洞天一碧小屋中间扁八角窗、东西两侧六角窗', '资料记东侧竹、西侧蕉；两张书中图版已人工复看'],
    inferredForPlay: ['三壁在单镜头中的展开方式、三窗间距及像素化画面', '前景可走地面、三个观察脚点、玩家入屋位置和纸角谜题'],
    redLines: ['不把生成研究图当作实测小屋或清末原貌', '未核真实出入口与石林院路，不接 CH3 正式转场与奖励', '不将原书扫描图复制进公开游戏素材', '窗框形制须可辨；墙基不可穿越，观察点须从出生点可达'],
  },
  {
    id: 'liuyuan-youyicun-transition-study-v1', title: '留园 · 现状圆门几何研究切片（旧游线未证）',
    period: '现状圆门图版启发；1909“又一村”廊段位置有反证，1890 门位未核', state: 'reference',
    sources: [{
      id: 'youyicun-tour', title: '朱揖文《游苏备览·留园》（苏州市园林局转录）',
      url: 'https://ylj.suzhou.gov.cn/szsylj/ylwh/201807/37222ea7f68c4ddd9cc08c9e769f39d7.shtml', grade: 'B',
      note: '先记冠云峰南有四面厅，后记从其前廊西行至又一村、再往小蓬莱，彼处有花房和蔬圃；本幕将顺序反向作返园路。不能误作中部厅堂，民国文字也不是 1890 门位测绘。',
    }, {
      id: 'youyicun-book-figures', title: '曹林娣《园庭信步》图 5-2、5-23',
      local: '../../SuzhouClassicGardenRag/Project/converted/园庭信步 中国古典园林文化解读 (曹林娣著, Cao Lindi zhu, 曹林娣著, 曹林娣) /hybrid_auto/园庭信步 中国古典园林文化解读 (曹林娣著, Cao Lindi zhu, 曹林娣著, 曹林娣) .md', grade: 'B',
      note: '人工查看现状平面与圆门照片；照片里的盆景展陈、现状植株及门额文字不向清末倒推，原书图未复制入游戏资源。',
    }, {
      id: 'youyicun-1909-archive-study', title: '緒方賢一《留園試論——档案に基づく中国庭園経営の実態》',
      url: 'https://kwansei.repo.nii.ac.jp/record/29225/files/%E7%B7%92%E6%96%B9%E8%B3%A2%E4%B8%80.pdf', grade: 'B',
      note: '搜索引擎可检索的原论文 OCR 指出：1909 年“又一村”是林泉耆硕之馆西侧相接廊段之名，并比较《蘇州留園全図》与改造工程图。本轮原 PDF 返回 429，原图版未复看；须以原版图核实后才可改定旧门路。',
    }, {
      id: 'youyicun-art-record', title: '原创像素研究图制作记录',
      local: '../research-art/liuyuan-youyicun-transition-pixel-study-v1.prompt.md', grade: 'C',
      note: '生成图按原创构图二次像素化，门与铺地尺寸只供试走、拖拽校准。',
    }],
    verifiedFacts: ['民国游线文字将冠云峰南侧四面厅前廊、又一村、小蓬莱及花房置于连续段落', '现状资料可见又一村方向有圆门过渡；尚无证据证明与旧“又一村”廊段同址'],
    inferredForPlay: ['现状圆门在单幅 2.5D 研究图中的构图', '圆门宽度、花畦、铺地形状、人物比例、五个脚点和可走 Tile'],
    redLines: ['不得称为 1890 原址门位或完整花房—四面厅实走线', '1909 档案研究提示旧“又一村”可能是厅西廊段；原图版未核前，现状圆门仅测几何，不得作为旧游线同一门', '现状盆景展陈、葡萄架和可辨门额不进入清末画面', '未核门洞与四面厅实际接口，不接 CH3 进度或石林主线转场', '原书扫描和检索缩略图只用于制作端核查'],
  },
  {
    id: 'liuyuan-stone-forest-court-study-v1', title: '留园石林小院 · 绕峰可走研究切片',
    period: '刘氏原院与盛氏东扩的相对空间关系；非 1890 实测', state: 'geometry',
    sources: [{ id: 'stone-bureau-yifeng', title: '苏州市园林局 · 揖峰轩',
      url: 'https://ylj.suzhou.gov.cn/szsylj/ylwh/201604/f5d094ab93ef489896d01e7252578d4b.shtml', grade: 'B',
      note: '引刘恕《石林小院说》记晚翠峰、四峰二石、揖峰轩，并述小石有如圭、如璧、如垂英、如败蕉叶的不同姿态；这是石形差异的创作依据，不等于每块现存实石身份。' }, {
      id: 'stone-period-tour', title: '朱揖文《游苏备览·留园》（民国，园林局转录）',
      url: 'https://ylj.suzhou.gov.cn/szsylj/ylwh/201807/37222ea7f68c4ddd9cc08c9e769f39d7.shtml', grade: 'B',
      note: '记楠木厅之后的石林小院、揖峰轩，再由揖峰轩入东园；不能据此推 1890 年门洞坐标。' }, {
      id: 'stone-layout-study', title: '《透园观石：留园石林小院园林空间营建逻辑》',
      url: 'https://www.geores.com.cn/la/CN/abstract/article/1673-1530/78696', grade: 'B',
      note: '2026-10-10 已读用户本地 PDF 并视觉核图2、7、12、13：传经堂、还读馆、揖峰轩、洞天一碧、晚翠峰、半间和留夹分开；图13区分刘氏原院流线与当代游线，注称1888—1891盛氏扩园修改主入口。分析图不是1890门位实测。' }],
    verifiedFacts: ['石林小院以晚翠峰等峰石为中心，揖峰轩是观石书房', '图12所示格局中，还读馆在石林北侧，传经堂在西，揖峰轩和洞天一碧分处主石南北两侧；原院不是四门并排', '盛氏东扩在原院东墙开口通冠云峰院落；图13所绘早期入口流线与现行游线不同'],
    inferredForPlay: ['单一画面压缩数个小院的方式', 'v2 石形区分细高主峰、屏帆石、斜片与低伏石；不对应具体实名石的精确外形', '本图蕉竹株位、廊柱、铺地、人物脚点和碰撞边界'],
    redLines: ['仅作独立可走研究切片，不凭生成图给 1890 精确门位；一张图压缩数院，不可升级成完整院路', '不得把 v2 生成石形当作晚翠、独秀、段锦等实石的照片复原', '不把揖峰轩认作寒士所在的还读我书斋', '尚无已核实的西部花房至此的连续关卡，不能假装相邻', '冠云峰 v2 既有画面按玩家意见保留，本次不借石林石形修改它', '峰石根部不可走、廊柱不可穿，前景屋檐须按落地线遮挡'],
  },
  {
    id: 'liuyuan-study-court-research-v1', title: '留园北缘书斋院 · 围合与绕行研究切片',
    period: '现状空间启发；旧名和 1890 门位未核', state: 'geometry',
    sources: [{ id: 'study-court-local-rag', title: '离线 garden_knowledge 文字向量 · 曹林娣《苏州园林匾额楹联鉴赏》摘录',
      local: 'LIUYUAN_STUDY_COURT_AUDIT.md', grade: 'C',
      note: '召回刘氏还读馆、盛氏名称候选及两层硬山屋/回廊信息；OCR 原书页未复核，只作候选。' }, {
      id: 'study-court-shanghai-bureau', title: '上海市绿化和市容管理局 · 最有文化的古建筑——书房',
      url: 'https://lhsr.sh.gov.cn/jnylwh/20210726/b06653a5ca864616bea2fcf31e3c8020.html', grade: 'B',
      note: '明确揖峰轩之北有围合小院，还我读书处为坐西面东二层硬山屋，院前回廊、湖石花坛和古木；此为后出现状介绍。' }, {
      id: 'study-court-liuyuan-photo', title: '留园署名文章 · 留园之书斋',
      url: 'https://www.sohu.com/a/215827991_680285', grade: 'B',
      note: '人工查看该署名文章内现状照片：二层木格窗、灰瓦低廊与院中乔木。不能从照片反推清末门路或树种。' }, {
      id: 'study-court-art', title: '原创研究底图生成记录',
      local: '../assets/scene25d/liuyuan-study-court-research-v1.prompt.md', grade: 'C',
      note: '内置 imagegen 生成，仅供编辑器研究与独立试走；未使用书图/网页照片作为游戏贴图。' }],
    verifiedFacts: ['揖峰轩北侧存在封闭的还我读书处院落', '现状书房为二层硬山顶、坐西面东，院前有回廊、湖石花坛和乔木'],
    inferredForPlay: ['本图南缘入口、窗格、乔木和石花台的具体株位', '书房门前纸声来源与铺地上的可站脚点分开；二者均为游戏画面候选', '角色脚点、Tile 与遮挡轮廓'],
    redLines: ['不得把现状布置称为 1890 复原；旧门位和时期仍待核', '旧名“还读我书斋／还读我书处”来源冲突，图上不画匾、不把它设为唯一谜底', '独立打开不提交 ly-study-found；当代游线模式仅在玩家听声后轻叩时提交虚构剧情事件，不把石林剪接冒充实门', '生成树石外形不对应可指认的现存株石'],
  },
  {
    id: 'liuyuan-study-interior-research-v1', title: '留园书斋内景 · 人物与纸声研究切片',
    period: '清末故事的室内演出；具体内装、窗和门位未核', state: 'geometry',
    sources: [{ id: 'study-room-local-rag', title: '离线 garden_knowledge 文字向量 · 曹林娣《苏州园林匾额楹联鉴赏》摘录',
      local: 'LIUYUAN_STUDY_INTERIOR_AUDIT.md', grade: 'C',
      note: '只召回书斋院围合、二层硬山、坐西朝东等空间概述，没有桌案、架、窗、人物的原位资料；原书图版未核。' }, {
      id: 'study-room-bureau', title: '苏州市园林局 · 留园',
      url: 'https://ylj.suzhou.gov.cn/szsylj/sjyc/201905/b7c0f2058c75498c9ecbacf234e25b08.shtml', grade: 'B',
      note: '石林小院与还我读书处同属相邻院落，概述竹石倚墙、芭蕉映窗；不指明本书斋某扇窗。' }, {
      id: 'study-room-script', title: '《姑苏九园-剧本-CH3留园》CH3-07',
      local: '../姑苏九园-剧本-CH3留园.md', grade: 'C',
      note: '无名寒士、纸笔、书架、窗外蕉影及对话是人物演出；与史实空间分层。' }, {
      id: 'study-room-art', title: '原创内景与人物生成记录',
      local: '../assets/scene25d/liuyuan-study-interior-research-v1.prompt.md', grade: 'C',
      note: '内置 imagegen 独立生成底图与真透明角色精灵；未复制书图或网页照片。' }],
    verifiedFacts: ['留园石林小院一带有相邻书斋院及蕉影窗景的总体记述'],
    inferredForPlay: ['图中所有室内陈设、窗格、蕉叶株位、门槛和地板', '无名抄书人及书案—窗边的观察节拍、卷纸又放下的动作', '人物尺寸、脚点、碰撞及书案前景遮挡'],
    redLines: ['独立打开不写 CH3 旗标；当代游线模式在亲近抄书人和得知卷纸难题后分别记虚构剧情事件，不假接书斋院旧门', '桌案书架与窗不是 1890 年的考定陈设；不可标作复原', '窗外蕉影只是全园描述用于演出，未核本窗原位；不可作唯一史实谜底', '“园里的纸出门要过手”没有直接清末留园史料，只能是虚构寒士的处境，不得写入史实知识条', '生成像素图及角色不能替代定向实景照片或原书图版'],
  },
  {
    id: 'liuyuan-flower-work-yard-study-v3', title: '留园 · 花木作业院（盆兰工作区）', period: '盛氏花木培育的后出记载；非 1890 实测', state: 'geometry',
    sources: [{ id: 'liuyuan-flower-bureau', title: '苏州市园林局 · 留园',
      url: 'https://ylj.suzhou.gov.cn/szsylj/sjyc/201905/b7c0f2058c75498c9ecbacf234e25b08.shtml', grade: 'B',
      note: '花木作业区与中部主池、东部厅堂是不同分区；不能把花房硬贴在池边。' }, {
      id: 'liuyuan-flower-historic', title: '苏州市园林局转录 · 《游苏备览·留园》',
      url: 'https://ylj.suzhou.gov.cn/szsylj/ylwh/201807/37222ea7f68c4ddd9cc08c9e769f39d7.shtml', grade: 'B',
      note: '民国文字记花房、蔬圃的游线，不是 1890 年测绘。' }, {
      id: 'liuyuan-flower-tree', title: 'Flora of China · Yulania denudata',
      url: 'https://www.efloras.org/florataxon.aspx?flora_id=2&taxon_id=250090269', grade: 'B',
      note: '白玉兰是落叶乔木，花芽卵形；本幕不画玉兰，正式树的观察点须另作东园场景。' }, {
      id: 'liuyuan-flower-script', title: '《姑苏九园-剧本-CH3留园》CH3-05',
      local: '../姑苏九园-剧本-CH3留园.md', grade: 'C',
      note: '花匠换土的是盆兰；原剧本此幕近看玉兰的节拍需移至东部堂前，不把树缩成盆苗。' }],
    verifiedFacts: ['白玉兰为乔木，不能当作搬动的盆栽', '留园有花木作业/花房的后出记载'],
    inferredForPlay: ['这处花木作业院与房屋的精确位置', '花匠、粥桶和由临池处通往此地的镜头剪接'],
    redLines: ['盆兰与玉兰不可混成一盆', '墙脚单株玉兰 v2 图已否决，不可用作本幕', '到东部书斋的旧通路与四门方位尚未核，不得凭此图直接标为史实'],
  },
  {
    id: 'liuyuan-east-hall-magnolia-court-study-v1', title: '留园东部宅院厅前双玉兰 · 植栽语法候选',
    period: '明代造园通则用于晚清故事的设计演绎；非 1890 实植证据', state: 'reference',
    sources: [{ id: 'changwuzhi-magnolia', title: '文震亨《长物志》卷二 · 玉兰',
      url: 'https://www.shidianguji.com/zh/mid-page/7577890052246061106', grade: 'A',
      note: '“宜种厅事前，对列数株”是原书的厅前玉兰取法，不是留园指定厅堂的存树记录。' }, {
      id: 'suzhou-garden-planting', title: '苏州市园林局 · 植物',
      url: 'https://ylj.suzhou.gov.cn/szsylj/ylwh/201903/d978d21439a549c88244479c92ffda86.shtml', grade: 'B',
      note: '园林游赏植栽以疏密、高低和空间关联组织，不宜将整座园镜像化；厅堂附近须顾采光。' }, {
      id: 'liuyuan-east-hall-script', title: '《姑苏九园-剧本-CH3留园》CH3-06',
      local: '../姑苏九园-剧本-CH3留园.md', grade: 'C',
      note: '旧稿曾把厅前双树和匾额合成谜题；CH3-06 已改为串联院落寻书斋，本图只保留植栽语法试演。' }],
    verifiedFacts: ['《长物志》记玉兰宜种厅事前、对列数株', '园林游赏区花木可用非对称疏密组织'],
    inferredForPlay: ['图中两株玉兰的具体株位、树龄、厅堂立面和通道', '旧稿试图把此厅对应某实名建筑，现已撤销'],
    redLines: ['不得把这张图称作留园 1890 年还读我书斋实景', '宅院厅前成对植树是设计取法，不是所有苏州宅院都必须如此', '独立打开不推进主线；仅从花木院携带当代游线标记且已遇花匠时，观察两树后可结算虚构线索 ly-magnolia-seen；绝不在此结算 ly-study-found'],
  },
  {
    id: 'liuyuan-entry-gate-style-study-v1', title: '留园入口 · 门外至门厅斜俯视研究',
    period: '现状空间节奏参考；门位、构件年代均未核', state: 'reference',
    sources: [{ id: 'entry-gate-study-rag', title: '《园林有境》· 华步小筑狭径与留园入口收放',
      local: '../../SuzhouClassicGardenRag/Project/converted/园林有境/hybrid_auto/园林有境.md', grade: 'C',
      note: '2026-10-10 离线 garden_knowledge 文字召回：狭长小径、时暗时明、几经转折；原文同时提醒不能以今证古。没有旧门位和门厅尺寸。' }, {
      id: 'entry-gate-study-bureau', title: '苏州市园林局 · 留园',
      url: 'https://ylj.suzhou.gov.cn/szsylj/sjyc/201905/b7c0f2058c75498c9ecbacf234e25b08.shtml', grade: 'B',
      note: '只支持院落以门洞、曲廊相联并有空间对比；不支持生成图的门扇、灯、树石和街面坐标。' }, {
      id: 'entry-gate-study-art', title: '门外至门厅斜俯视风格研究生成记录',
      local: '../research-art/liuyuan-entry-gate-style-study-v1.prompt.md', grade: 'C',
      note: '以项目府学 Home 和留园小庭作风格参考生成；研究图不进入正式公开资源。' }],
    verifiedFacts: ['现状留园入口通过门洞、廊道与小庭组织由窄到开、时暗时明的游览节奏'],
    inferredForPlay: ['这一镜的门、门柱、灯、树石、种植池和石路形态', '门外至厅内的脚点、比例、碰撞与遮挡候选'],
    redLines: ['2026-10-10 风格审查未通过：平滑绘画、对称通用庭院构图；不制作试玩页，不接 CH3 旗标，不替换原入口章节图', '不得声称 1890 留园门位或门厅实景复原', '灯笼、门扇、树石、墙线未经定向照片/测绘核对，不作园谱史实', '重做像素语言并通过并排审查后，仍须校真实浏览器四方向、触屏、脚底盒、檐口遮挡与年代证据'],
  },
  {
    id: 'liuyuan-entry-gate-misty-study-v2', title: '留园入口 · 粉墙黛瓦门墙独立研究切片',
    period: '现状空间节奏参考／清末门位未核；游戏美术试稿', state: 'reference',
    sources: [{ id: 'misty-gate-rag', title: '《园林有境》· 华步小筑狭径',
      local: '../../SuzhouClassicGardenRag/Project/converted/园林有境/hybrid_auto/园林有境.md', grade: 'C',
      note: '2026-10-10 离线 garden_knowledge 文字向量召回，提到砖砌门洞和狭长小径，并明言今不能证古；不给本图门位、门高和树石原位。' }, {
      id: 'misty-gate-art', title: '入口—小庭烟雨像素语言生成/边界记录',
      local: '../research-art/liuyuan-misty-style-pair-v2.prompt.md', grade: 'C',
      note: '图为本项目内置 imagegen 研究候选；按冷旧白粉墙、黛瓦、灰石与漫射光调色，不可当实景照片或正式像素母版。' }, {
      id: 'misty-gate-paving', title: '留园铺地向量资料与原位待核清单',
      local: 'LIUYUAN_PAVING_RESEARCH.md', grade: 'C',
      note: '检索虽得留园花街/冰裂等图版，均未指向本门口；此图暂不画花街纹样。' }],
    verifiedFacts: ['本地资料仅支持留园部分入口空间的狭径、门洞、收放节奏，不支持此图具体门位'],
    inferredForPlay: ['本镜粉墙、黛瓦、石路、门柱位置及鞋底过门的可走几何', '雨后柔光与冷调的统一美术语法'],
    redLines: ['独立研究试玩不接 CH3、不写章节进度、不替代正式入口白模与玩家草稿',
      '未核树位、门扇、柱距、门槛、铺地位置和清末状态，不称 1890 留园原貌',
      '生成图仍有细碎纹理且只是一镜，须经统一像素网格、人物比例、遮挡、素材权利与相邻镜头验收后才可晋级'],
  },
  {
    id: 'liuyuan-alley-misty-study-v1', title: '留园门内 · 粉墙黛瓦夹弄独立研究切片',
    period: '当代空间节奏参考／清末门路未核；游戏美术试稿', state: 'reference',
    sources: [{ id: 'misty-alley-rag', title: '《园林有境》· 华步小筑狭径',
      local: '../../SuzhouClassicGardenRag/Project/converted/园林有境/hybrid_auto/园林有境.md', grade: 'C',
      note: '2026-10-10 离线 garden_knowledge 文字向量再查：提到砖砌门洞与狭长小径，同时提醒今不能证古；不给本图墙线、植物、铺地或旧门口坐标。' }, {
      id: 'misty-alley-art', title: '门内夹弄冷调研究生成与边界记录',
      local: '../research-art/liuyuan-alley-misty-pixel-study-v1.prompt.md', grade: 'C',
      note: '以内置 imagegen 生成新图，以门墙 v3 仅作色板/镜头参考；非实景照片或合格像素母版。' }, {
      id: 'misty-alley-paving', title: '留园铺地向量资料与原位待核清单',
      local: 'LIUYUAN_PAVING_RESEARCH.md', grade: 'C',
      note: '石板/小灰石块衔接只作游戏图面候选，留园花街图版未定位此夹弄。' }],
    verifiedFacts: ['本地资料只支持留园入口某处有狭长小径的空间节奏，不能确定本图曲折和墙位'],
    inferredForPlay: ['本镜墙线、植栽、铺地材质交接及鞋底路线、柱脚碰撞', '与冷调门墙研究图相邻的游戏美术语法'],
    redLines: ['独立试走不接 CH3、不写章节存档、不替换正式夹弄与玩家旧草稿',
      '门墙到本镜及本镜到古木交柯的实际接口未核，不拼成所谓清末实景通路',
      '生成图仍有平滑灰阶纹理；须核像素网格、人物比例、遮挡、原位和素材使用权后才可晋级'],
  },
  {
    id: 'liuyuan-entry-lower-camera-study-v1', title: '留园入口 · 低机位首镜头研究',
    period: '现状空间节奏启发／旧门位未核；游戏美术候选', state: 'reference',
    sources: [{ id: 'lower-entry-rag', title: '《园林有境》· 现状狭径与今古边界',
      local: '../../SuzhouClassicGardenRag/Project/converted/园林有境/hybrid_auto/园林有境.md', grade: 'C',
      note: '离线向量检索仅给现状入口空间收放的研究线索，也提醒今景不可直接当旧貌。' }, {
      id: 'lower-entry-bureau', title: '苏州市园林局 · 留园建筑',
      url: 'https://ylj.suzhou.gov.cn/szsylj/ylys/201903/484421d38f504f5787a8f307925e3ad7.shtml', grade: 'B',
      note: '支持园内曲廊转折、小院等类型，不证明本图门柱、树位和铺地坐标。' }, {
      id: 'lower-entry-process', title: '低机位研究图生成词与边界',
      local: '../research-art/liuyuan-entry-lower-camera-gameplay-candidate-v1.prompt.md', grade: 'C',
      note: '原创生成的可走空间假说；无旧门测绘或历史照片的证明力。' }],
    verifiedFacts: ['留园现状可借鉴狭径与小院先收后放的体验；本图具体位置未核'],
    inferredForPlay: ['单门、门外让路空间、门内见光与折返脚点', '独立人物、门柱碰撞、檐口遮挡及植物疏密'],
    redLines: ['只作独立研究页，不接 CH3、不写章旗标、不覆盖旧入口草稿',
      '不得称为清末留园入口原貌；门位、墙线、植株和铺地均为游戏化候选',
      '底图及风格提示词未经玩家批准；浏览器实走、人物比例和邻镜转场通过前不可晋级正式场景'],
  },
  {
    id: 'liuyuan-entry-oblique-shot-study-v1', title: '留园入口 · 斜俯视首镜头几何校位',
    period: '当代入口空间收放启发／清末门位未核；原创游戏候选', state: 'reference',
    sources: [{ id: 'oblique-entry-rag', title: '《园林有境》· 华步小筑狭径',
      local: '../../SuzhouClassicGardenRag/Project/converted/园林有境/hybrid_auto/园林有境.md', grade: 'C',
      note: '2026-10-10 离线 garden_knowledge 文字向量实查，仅支持留园一处砖洞狭径与先收后放，不给图中门、树、石地的旧址。' }, {
      id: 'oblique-entry-bureau', title: '苏州市园林局 · 建筑',
      url: 'https://ylj.suzhou.gov.cn/szsylj/ylys/201903/484421d38f504f5787a8f307925e3ad7.shtml', grade: 'B',
      note: '支持古木交柯、华步小筑一类曲廊转折小院的现状类型，非图中几何坐标。' }, {
      id: 'oblique-entry-art', title: '入口斜俯视生成词及晋级边界',
      local: '../research-art/liuyuan-entry-oblique-pixel-study-v1.prompt.md', grade: 'C',
      note: '内置 imagegen 以府学镜头为参考生成并修订；非实景扫描，不具备清末门柱、铺地、树位的来源。' }],
    verifiedFacts: ['留园入口现状体验有狭径与小院的收放节奏；本图任何具体门位均未核'],
    inferredForPlay: ['1536×1024 世界中的门外—门槛—转角脚点', '门柱碰撞、前景瓦檐深度与书生比例候选'],
    redLines: ['本首镜不接 CH3、不写旗标，不顶替正式入口 11 段路径或旧草稿',
      '生成门墙、树位、石地、柱距和回廊转角都不是 1890 留园原貌证据',
      '即使默认 Tile 连通，也须统一编辑器草稿、实际浏览器画面、人物/NPC 同屏和相邻镜头核验后才能晋级'],
  },
  {
    id: 'liuyuan-entrance-topology-study', title: '留园入口 · 烟雨夹弄游戏场景', period: '艺术化游戏空间；非清末原址复原', state: 'playable',
    sources: [{ id: 'liuyuan-entry-bureau', title: '苏州市园林局 · 留园',
      url: 'https://ylj.suzhou.gov.cn/szsylj/sjyc/201905/b7c0f2058c75498c9ecbacf234e25b08.shtml', grade: 'B',
      note: '校对园内中部池园与廊道的总体关系，不证明白模中的尺寸和门位。' }, {
      id: 'liuyuan-entry-local-gazetteer', title: '苏州市地方志办 · 苏州古典园林漏窗艺术',
      url: 'https://dfzb.suzhou.gov.cn/dfzb/fzxh/201002/4310c9b7dad442b99b209d301b8cdd82.shtml', grade: 'B',
      note: '古木交柯前廊北墙有六扇漏窗，按东到西列纹样；第二项网页缺字。游戏像素剪影只作现状启发，不是实物摹本或晚清窗形。漏窗取景，不是通路。' }, {
      id: 'liuyuan-entry-teaching', title: '留园入口空间层次教学示意',
      url: 'https://www.huijujiaoyu.com/sys-nd/14.html', grade: 'C',
      note: '只取小门、前厅、天井、曲廊、小庭、古木交柯北墙漏窗、西折绿荫轩的现状空间序列；图并非晚清测绘。' }, {
      id: 'liuyuan-entry-2024-paper', title: '张钰 · 留园入口收放空间分析（2024）',
      url: 'https://pdf.hanspub.org/Design20240100000_40977282.pdf', grade: 'C',
      note: '第 52–53 页正文支持小院—曲廊—天井—窄通道—古木交柯—绿荫轩的现状体验顺序；图 1 本轮未能视觉核查，不能据此定转角、比例、门位或清末构件。' }, {
      id: 'liuyuan-entry-visual-perception-2026', title: '孙旻恺等 · 基于视觉感知的留园入口空间序列研究（2026）',
      url: 'https://www.gardenmagazine.cn/ylzz/article/html/20250810001', grade: 'B',
      note: '已核期刊 HTML 全文与图1：实验使用2023现状门厅口—古木交柯—连续漏窗—华步小筑—绿荫轩约50米路线；30人招募、28组有效VR观看数据。仅支持视线引导/收放体验，不证清末门位、人物行走游戏乐趣或现有Tile比例。' }, {
      id: 'liuyuan-entry-ch3', title: '《姑苏九园-剧本-CH3留园》', local: '../姑苏九园-剧本-CH3留园.md', grade: 'C',
      note: '校准玩家先行走、后窥园的叙事节奏。' }],
    verifiedFacts: ['留园中部为池园山水，入口通道以曲廊及小庭组织空间层次', '古木交柯前廊北墙现有六扇漏窗，隔窗观景而非穿行'],
    inferredForPlay: ['各段长度、宽度、脚点及 CH3 触发坐标', '粉墙灰瓦、异质铺地、竹影、乔木与门外器物的原创游戏化布置'],
    redLines: ['不得将游戏场景称为 1890 留园实测平面或旧门位复原', '六扇漏窗不可做门洞；从古木交柯须西折进小庭', '不把隔窗窥园等同于已经看到完整池园', '未经许可的实景照片及论文图版不得直接贴入游戏资产', '编辑器玩家草稿和实际浏览器遮挡仍应单独核对，代码默认场景不得覆盖草稿'],
  },
  {
    id: 'liuyuan-whole-garden-study-v2', title: '留园 · 旧全园误稿 v2（禁止铺碰撞）', period: '约 1890 / 现状空间关系', state: 'reference',
    sources: [{ id: 'liuyuan-bureau-v2', title: '苏州市园林局 · 留园',
      url: 'https://ylj.suzhou.gov.cn/szsylj/sjyc/201905/b7c0f2058c75498c9ecbacf234e25b08.shtml', grade: 'B',
      note: '四区关系与园内空间收放；图中南侧夹弄的具体转折不作为史实。' }, {
      id: 'liuyuan-ch3-v2', title: '《姑苏九园-剧本-CH3留园》', local: '../姑苏九园-剧本-CH3留园.md', grade: 'C',
      note: '小门—窄暗夹弄—豁然见池为剧情节奏。' }],
    verifiedFacts: ['留园中部以山水为主，东部以厅堂为主，西部以山林为主'],
    inferredForPlay: ['夹弄三弯与花匠交粥位置', '四处书斋门位和蕉叶位置'],
    redLines: ['整园构图与测绘图偏差过大；该资产仅供误稿对照，不得作为最终图或碰撞底图', '屋顶遮挡的脚下通道不得开放玩家移动', '不把现代盆景陈列搬进 1890 年'],
  },
  {
    id: 'liuyuan-whole-garden-study', title: '留园 · 四区视觉试稿', period: '约 1890', state: 'reference',
    sources: [{ id: 'liuyuan-bureau', title: '苏州市园林局 · 留园',
      url: 'https://ylj.suzhou.gov.cn/szsylj/sjyc/201905/b7c0f2058c75498c9ecbacf234e25b08.shtml', grade: 'B',
      note: '今日四区与中部山水、东部厅堂、西部山林的关系；不直接证明 1890 每座建筑。' }, {
      id: 'liuyuan-plan', title: '留园全景导览平面（北箭头）',
      url: 'https://cyk200.pixnet.net/album/photo/794177082', grade: 'B',
      note: '只核现状方位、比例与路径意向；现代设施、盆景展与售票区不得搬入晚清。' }, {
      id: 'liuyuan-ch3', title: '《姑苏九园-剧本-CH3留园》',
      local: '../姑苏九园-剧本-CH3留园.md', grade: 'C',
      note: '送粥、花房、玉兰、四扇门、蕉叶传信为剧本层；关键交互须分离精灵。' }],
    verifiedFacts: ['留园现状分中、东、西、北四景区', '中部以池园山水为主，东部厅堂院落密集，西部有山林'],
    inferredForPlay: ['南花房交粥点的坐标', '四处书斋门位的谜题顺序', '玉兰与芭蕉的具体株位'],
    redLines: ['现图南入口未实现窄暗夹弄，不得结算 CH3-04', '现代售票、停车与盆景展示不得混入 1890 场景', '1888–1891 扩建中的设施不得未核即画成 1890 已完成原貌'],
  },
  {
    id: 'zhuozheng-whole-garden-study-v4', title: '拙政园 · 东向旧门修订试稿 v4', period: '约 1890 / 现状布局参照', state: 'reference',
    sources: [{ id: 'zhuozheng-east-old-gate', title: '苏州市园林局 · 东部旧额',
      url: 'https://ylj.suzhou.gov.cn/szsylj/ylwh/201910/a05ea346c8fa44faa59ec419db471056.shtml', grade: 'B',
      note: '记述东部旧门位于住宅夹弄、朝东通百家巷；现今南门为 1962 年新辟。' }, {
      id: 'zhuozheng-bureau-v4', title: '苏州市园林局 · 拙政园',
      url: 'https://ylj.suzhou.gov.cn/szsylj/sjyc/201905/c1df393edc8745abb20e8a9bd5525782.shtml', grade: 'B',
      note: '东中西三部，中央大水、西池曲尺形、东部开阔；现状不等于 1890 门墙原貌。' }, {
      id: 'zhuozheng-ch2-v4', title: '《姑苏九园-剧本-CH2拙政园》', local: '../姑苏九园-剧本-CH2拙政园.md', grade: 'C',
      note: '三闸在世界层，夜入东部后只作有限观察。' }],
    verifiedFacts: ['东部旧入口朝东通百家巷，不是 1962 年后南门', '西园水池呈曲尺形，中央大水为主'],
    inferredForPlay: ['东部残园荒芜程度', '三段产权墙与旧入口的图上精确坐标', '夜间攀墙与窗的镜头机位'],
    redLines: ['不得恢复东部南向游客正门', '不得让西中东三园成为日常贯通游线', '生成画面不能冒充 1890 测绘'],
  },
  {
    id: 'zhuozheng-whole-garden-study-v3', title: '拙政园 · 三界重绘试稿 v3', period: '约 1890', state: 'reference',
    sources: [{ id: 'zhuozheng-bureau', title: '苏州市园林局 · 拙政园',
      url: 'https://ylj.suzhou.gov.cn/szsylj/ylwh/201604/0aa1729654784346a463e9e46d2cbcae.shtml', grade: 'B',
      note: '今园为西补园、中原拙政园、东归田园居；现状边界不能直接等于 1890 开门状态。' }, {
      id: 'zhuozheng-plan', title: '现状全园导览图',
      url: 'https://news.2500sz.com/doc/2025/09/08/1169624.shtml', grade: 'B',
      note: '供北向、三块地相对比例、池岸与城街关系参考；禁止抄今天的游线及馆舍。' }, {
      id: 'zhuozheng-ch2', title: '《姑苏九园-剧本-CH2拙政园》',
      local: '../姑苏九园-剧本-CH2拙政园.md', grade: 'C',
      note: '西园私门、中部会馆、东园夜行与那扇窗的剧情坐标仍须逐一核。' }],
    verifiedFacts: ['东、中、西三部分区可辨', '中部水面为主要空间要素', '西部为旧补园、东部为原归田园居'],
    inferredForPlay: ['东归田园居遗址的荒芜程度', '夜间翻墙和窥窗的精确位置'],
    redLines: ['不得把今日三园连通游线搬到 1890', '荒园是剧本空间演绎，不宣称逐物历史复原', '旧 v2 南侧直河与巨型荒塘没有依据', 'CH2-02 文案方向已改，实际门位及绕墙街路仍待核'],
  },
  {
    id: 'zhuozheng-whole-garden-study', title: '拙政园 · 旧误稿 v2', period: '约 1890 / 废弃视觉试稿', state: 'reference',
    sources: [{ id: 'zhuozheng-bureau-legacy', title: '苏州市园林局 · 拙政园',
      url: 'https://ylj.suzhou.gov.cn/szsylj/sjyc/201905/c1df393edc8745abb20e8a9bd5525782.shtml', grade: 'B',
      note: '用于识别旧稿与实景三分区、水体关系的冲突。' }],
    verifiedFacts: ['全园分东、中、西三部分，中央为大水主体'],
    inferredForPlay: ['旧图仅供比较与浏览器草稿迁移'],
    redLines: ['旧稿南侧长直河、巨型东塘和错位私门均不得进入正式关卡'],
  },
  {
    id: 'huanxiu-whole-garden-study', title: '环秀山庄 · 山径试稿', period: '约 1890', state: 'reference',
    sources: [{ id: 'huanxiu-restoration', title: '苏州市园林局 · 陈从周与园林修复',
      url: 'https://ylj.suzhou.gov.cn/szsylj/ryyl/201902/4320700c8322412998c7f39c3f4a70ae.shtml', grade: 'B',
      note: '确认山体以外部分建筑后世重建，不能照现状画入晚清。' }, {
      id: 'huanxiu-rockery', title: '苏州市园林局 · 叠山',
      url: 'https://ylj.suzhou.gov.cn/szsylj/ylys/201903/0306817832f64a68bfd66c830d1ff994.shtml', grade: 'B',
      note: '假山、涧谷、池水的关系。' }],
    verifiedFacts: ['湖石大假山是空间主景', '山水之间存在纵深涧谷'],
    inferredForPlay: ['西义庄庄屋布局', '上山路径的具体转折、峰洞四辨点'],
    redLines: ['1980 年代复建建筑不可画作 1890 原貌', '摹本不能当《具区林屋图》真迹'],
  },
  {
    id: 'yipu-whole-garden-study-v3', title: '艺圃 · 池北延光阁修订试稿 v3', period: '约 1890 / 现状与地方志交叉参照', state: 'reference',
    sources: [{ id: 'yipu-yanguangge-bureau', title: '苏州市园林局 · 延光阁',
      url: 'https://ylj.suzhou.gov.cn/szsylj/ylwh/201604/6a6fdbc9c24140adbe9e6ece60acd923.shtml', grade: 'B',
      note: '明确延光阁在池北、为大型水榭、南望假山；今日匾额为 1984 年书，不得放入晚清画面。' }, {
      id: 'yipu-local-gazetteer', title: '苏州市地方志办公室 · 苏州园林：你不知道的秘密',
      url: 'https://dfzb.suzhou.gov.cn/dfzb/fzxh/201704/298ecfc1035f44b4b24ed541427af4d5.shtml', grade: 'B',
      note: '说明清初姜氏艺圃已有延光阁之名；但不能直接证明现存池北水榭的具体晚清木构。' }, {
      id: 'yipu-ch9-v3', title: '《姑苏九园-剧本-CH9艺圃》', local: '../姑苏九园-剧本-CH9艺圃.md', grade: 'C',
      note: '公所活计、池边少一笔与听声玩法属于游戏剧本。' }],
    verifiedFacts: ['延光阁是池北临水建筑，朝南可望池南假山', '延光阁之名在姜氏艺圃时期已有记述'],
    inferredForPlay: ['v3 图中五开间比例、门洞与支柱坐标', '延光阁和东廊的玩家行走连接'],
    redLines: ['不得把 1984 年书写的现存匾额画进 1890 场景', '现存阁与同名旧阁不能未经核证便说成同一原物', '阁面下方水面不得铺可走 Tile'],
  },
  {
    id: 'yipu-whole-garden-study', title: '艺圃 · 公所宅园试稿', period: '约 1890', state: 'reference',
    sources: [{ id: 'yipu-bureau', title: '苏州市园林局 · 艺圃',
      url: 'https://ylj.suzhou.gov.cn/szsylj/sjyc/201905/40478a4c651f48088b8888dd8d9141f0.shtml', grade: 'B',
      note: '方池、池南土山、乳鱼亭及芹庐等关系。' }, {
      id: 'yipu-guild', title: '苏州市园林局 · 七襄公所记',
      url: 'https://ylj.suzhou.gov.cn/szsylj/ylwh/201808/ad2d3e6f1350414cba449cd24ed9f7d8.shtml', grade: 'A',
      note: '确认园在晚清用作七襄公所，不应画成无人的纯观赏园。' }],
    verifiedFacts: ['东宅西园、园以方池为核心', '池南有土山、池东有乳鱼亭', '晚清曾作七襄公所'],
    inferredForPlay: ['货物、账桌、规条碑的具体摆位', '玩家坐下做少一笔的池边点'],
    redLines: ['不得复用方向错误的 v1 底图', 'v2 漏掉池北延光阁，不得作正式碰撞底图', '后世修缮住宅及现代茶座不入 1890 场景'],
  },
];

export function validateSceneEvidence(): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const scene of SCENE_EVIDENCE) {
    if (ids.has(scene.id)) errors.push(`${scene.id}: 场景证据 id 重复`);
    ids.add(scene.id);
    if (!scene.period.trim()) errors.push(`${scene.id}: 缺年代口径`);
    if (!scene.sources.length) errors.push(`${scene.id}: 至少需要一个来源`);
    if (!scene.verifiedFacts.length) errors.push(`${scene.id}: 缺已核事实`);
    if (!scene.redLines.length) errors.push(`${scene.id}: 缺制作红线`);
    for (const source of scene.sources) {
      if (!source.url && !source.local) errors.push(`${scene.id}.${source.id}: 来源缺 URL 或本地路径`);
    }
  }
  return errors;
}

/* ============================================================================
 * 苏州古典园林 · 世界文化遗产数据集
 * Nine Classical Gardens of Suzhou — UNESCO World Heritage
 *
 * 数据来源说明：
 *   - 地理信息 / 历史沿革：综合公开史料与维基百科条目整理
 *   - 人物关系：依据 CBDB（中国历代人物传记数据库，https://cbdb.fas.harvard.edu）
 *     的人物关联结构（亲属 / 师友 / 同僚 / 委托营造 / 艺术合作）整理
 *   - 本文件为前端可配置数据源；接入真实 CBDB API / RAG 后端请见 main.js / rag.js
 * ========================================================================== */

const GARDENS = [
  {
    id: "zhuozheng",
    name: "拙政园",
    nameEn: "Humble Administrator's Garden",
    pinyin: "Zhuōzhèng Yuán",
    built: "明·正德年间（约1513年）",
    unesco: 1997,
    district: "苏州市姑苏区东北街",
    lat: 31.3252,
    lng: 120.6267,
    area: "约 5.2 公顷（现存）",
    summary:
      "苏州现存最大的古典园林，明代御史王献臣罢官归乡后所筑，取潘岳《闲居赋》'拙者之为政'之意命名。文徵明曾参与规划并绘《拙政园图》，全园以水为中心，疏朗自然，为江南文人园林典范。",
    wiki: "https://zh.wikipedia.org/wiki/拙政园",
    wikiSummary:
      "拙政园是位于中国江苏省苏州市的一座园林，始建於明代正德年间，是江南古典园林的代表作，与北京颐和园、承德避暑山庄、苏州留园合称中国四大名园。1997年列入世界文化遗产。",
    owners: [
      { name: "王献臣", period: "明·正德（约1513）", role: "创建者", note: "御史，罢官归里后营建，奠定园林格局" },
      { name: "徐氏（徐少泉）", period: "明·嘉靖—崇祯（约200年）", role: "继承者", note: "王献臣之子早逝，园归徐氏，长期易主" },
      { name: "陈之遴", period: "清·顺治", role: "所有者", note: "仕清，远在京城，园渐荒废" },
      { name: "蒋棨 / 查氏", period: "清·康熙—乾隆", role: "修复者", note: "多次易主与重修" },
      { name: "李秀成", period: "清·咸丰（1860后）", role: "占用者", note: "太平天国忠王，据园建忠王府" },
      { name: "八旗奉直会馆", period: "清·同治后", role: "管理者", note: "改为官署会馆" },
    ],
  },
  {
    id: "liuyuan",
    name: "留园",
    nameEn: "Lingering Garden",
    pinyin: "Liú Yuán",
    built: "明·万历二十一年（1593年）",
    unesco: 1997,
    district: "苏州市姑苏区留园路338号",
    lat: 31.3189,
    lng: 120.5875,
    area: "约 2.3 公顷",
    summary:
      "明万历年间太仆寺少卿徐泰时建，初名'东园'。清乾隆时刘恕重筑，称'寒碧山庄'；同治盛康购得后更名'留园'。以建筑空间处理精湛、奇石冠绝著称，与拙政园并称苏州双璧。",
    wiki: "https://zh.wikipedia.org/wiki/留园",
    wikiSummary:
      "留园是中国江苏省苏州著名古典园林，园内分东、中、西、北四部分，以建筑艺术精湛、奇峰异石著称，1997年作为苏州古典园林之一列入世界文化遗产。",
    owners: [
      { name: "徐泰时", period: "明·万历（1593）", role: "创建者", note: "太仆寺少卿，筑'东园'" },
      { name: "刘恕", period: "清·乾隆—嘉庆（1794）", role: "重建者", note: "更名'寒碧山庄'，蓄名石'冠云峰'" },
      { name: "盛康", period: "清·同治（1873）", role: "所有者", note: "购园改名'留园'，盛宣怀之父" },
      { name: "盛宣怀", period: "清·光绪", role: "继承者", note: "洋务重臣，盛康之子" },
    ],
  },
  {
    id: "wangshi",
    name: "网师园",
    nameEn: "Garden of the Master of the Nets",
    pinyin: "Wǎngshī Yuán",
    built: "南宋·淳熙年间（约1174年）",
    unesco: 1997,
    district: "苏州市姑苏区阔家头巷11号",
    lat: 31.3047,
    lng: 120.6269,
    area: "约 0.54 公顷",
    summary:
      "南宋侍郎史正志始建'万卷堂'与'渔隐'，取'渔隐'之意。清乾隆瞿远村重建，定名'网师园'，以精巧紧凑、夜花园闻名，是小型宅园的最佳范例。",
    wiki: "https://zh.wikipedia.org/wiki/网师园",
    wikiSummary:
      "网师园是苏州小型古典园林的代表，占地仅半公顷却布局精巧，以叠石和水池见长，1997年作为苏州古典园林之一列入世界文化遗产。",
    owners: [
      { name: "史正志", period: "南宋·淳熙（约1174）", role: "创建者", note: "吏部侍郎，筑'万卷堂''渔隐'" },
      { name: "瞿远村", period: "清·乾隆（1785）", role: "重建者", note: "叠石理水，定名'网师园'" },
      { name: "李鸿裔", period: "清·同治", role: "所有者", note: "改名'苏邻小筑'" },
      { name: "张作梅 / 何亚农", period: "民国", role: "所有者", note: "近代收藏家，保护园景" },
    ],
  },
  {
    id: "huanxiu",
    name: "环秀山庄",
    nameEn: "Mountain Villa with Embracing Beauty",
    pinyin: "Huánxiù Shānzhuāng",
    built: "唐·五代（钱氏金谷园）；清·嘉庆重修",
    unesco: 1997,
    district: "苏州市姑苏区景德路272号",
    lat: 31.3075,
    lng: 120.6197,
    area: "约 0.2 公顷（以假山为核心）",
    summary:
      "五代吴越钱氏'金谷园'故址，明代申时行宅，清嘉庆蒋楫、毕沅、孙士毅相继居此。叠山大师戈裕良以一块太湖石横劈数峰，营造出尺幅千里的湖石假山，被誉為'独步江南'。",
    wiki: "https://zh.wikipedia.org/wiki/环秀山庄",
    wikiSummary:
      "环秀山庄以戈裕良所叠湖石假山闻名，虽占地不大，却以玲珑峭拔的假山著称，1997年作为苏州古典园林之一列入世界文化遗产。",
    owners: [
      { name: "钱氏（吴越）", period: "五代·唐", role: "创建者", note: "'金谷园'故址" },
      { name: "申时行", period: "明", role: "宅主", note: "大学士，宅园所在" },
      { name: "蒋楫", period: "清·嘉庆", role: "所有者", note: "凿池叠山" },
      { name: "毕沅", period: "清·嘉庆", role: "所有者", note: "经学家、湖广总督" },
      { name: "孙士毅", period: "清·嘉庆", role: "所有者", note: "大学士" },
      { name: "戈裕良", period: "清·嘉庆", role: "叠山师", note: "叠湖石假山，冠绝一代" },
    ],
  },
  {
    id: "canglang",
    name: "沧浪亭",
    nameEn: "Canglang Pavilion",
    pinyin: "Cānglàng Tíng",
    built: "北宋·庆历四年（1044年）",
    unesco: 2000,
    district: "苏州市姑苏区人民路沧浪亭街3号",
    lat: 31.2919,
    lng: 120.6156,
    area: "约 1.08 公顷",
    summary:
      "苏州最古的园林，北宋诗人苏舜钦购地筑亭，取《楚辞·渔父》'沧浪之水清兮'命名。南宋为韩世忠宅，明清多次重修。以'未入园林先成景'的复廊借景手法独树一帜。",
    wiki: "https://zh.wikipedia.org/wiki/沧浪亭",
    wikiSummary:
      "沧浪亭是苏州现存最古老的园林，始建於北宋，以临水复廊和借景手法著称，2000年作为苏州古典园林扩展项目列入世界文化遗产。",
    owners: [
      { name: "苏舜钦", period: "北宋·庆历（1044）", role: "创建者", note: "诗人，购废园筑亭，文徵明曾绘图" },
      { name: "韩世忠 / 梁红玉", period: "南宋", role: "所有者", note: "抗金名将，扩为宅园" },
      { name: "可政和尚", period: "明·洪武", role: "修复者", note: "改寺并重建沧浪亭" },
      { name: "梁章钜", period: "清·道光", role: "重修者", note: "题'五百名贤祠'" },
    ],
  },
  {
    id: "shizi",
    name: "狮子林",
    nameEn: "Lion Grove Garden",
    pinyin: "Shīzi Lín",
    built: "元·至正二年（1342年）",
    unesco: 2000,
    district: "苏州市姑苏区园林路23号",
    lat: 31.3211,
    lng: 120.6275,
    area: "约 1.1 公顷",
    summary:
      "元代天如禅师为纪念其师中峰明本所建，因园内太湖石峰状如狮子而得名。倪瓒绘《狮子林图》，乾隆六下江南曾驻跸并仿建于承德、圆明园。以'假山王国'著称。",
    wiki: "https://zh.wikipedia.org/wiki/狮子林",
    wikiSummary:
      "狮子林始建于元代，以形态各异的湖石假山闻名，有'假山王国'之称，2000年作为苏州古典园林扩展项目列入世界文化遗产。",
    owners: [
      { name: "天如禅师（维则）", period: "元·至正（1342）", role: "创建者", note: "为纪念其师中峰明本建寺园" },
      { name: "倪瓒", period: "元·至正", role: "艺术合作", note: "绘《狮子林图》，传世名作" },
      { name: "黄熙", period: "清·乾隆", role: "所有者", note: "状元，园称'画禅寺'" },
      { name: "贝氏（贝润生）", period: "民国", role: "所有者", note: "颜料巨商，大规模修葺" },
    ],
  },
  {
    id: "ouyuan",
    name: "耦园",
    nameEn: "Couple's Garden Retreat",
    pinyin: "Ǒu Yuán",
    built: "清初（涉园）；清·同治（1874）重建",
    unesco: 2000,
    district: "苏州市姑苏区小新桥巷6号",
    lat: 31.3125,
    lng: 120.6397,
    area: "约 0.8 公顷",
    summary:
      "清初陆锦筑'涉园'，同治年间安徽巡抚沈秉成罢官归里，与妻子严永华共同营建，取'偶'（夫妇成双）与'耦耕'之意更名'耦园'。东花园与西花园分列住宅两侧，寓意夫妻唱和。",
    wiki: "https://zh.wikipedia.org/wiki/耦园",
    wikiSummary:
      "耦园以夫妇隐逸唱和为主题，东、西花园对称分列，2000年作为苏州古典园林扩展项目列入世界文化遗产。",
    owners: [
      { name: "陆锦", period: "清·顺治", role: "创建者", note: "筑'涉园'" },
      { name: "沈秉成", period: "清·同治（1874）", role: "重建者", note: "安徽巡抚，与妻严永华共建" },
      { name: "严永华", period: "清·同治", role: "共建者", note: "沈秉成妻，才女，题咏唱和" },
    ],
  },
  {
    id: "yipu",
    name: "艺圃",
    nameEn: "Garden of Cultivation",
    pinyin: "Yì Pǔ",
    built: "明·嘉靖（约1541年）",
    unesco: 2000,
    district: "苏州市姑苏区文衙弄5号",
    lat: 31.3103,
    lng: 120.6006,
    area: "约 0.38 公顷",
    summary:
      "明代袁祖庚筑'药圃'，文徵明曾孙文震孟居此时改名'艺圃'。园以水池居中、质朴疏朗见长，是保存明代风格的佳作。姜埰、姜实节父子继居，称'敬亭山房'。",
    wiki: "https://zh.wikipedia.org/wiki/艺圃",
    wikiSummary:
      "艺圃又名醉颖堂、药圃，以明代园林风格保存完好著称，2000年作为苏州古典园林扩展项目列入世界文化遗产。",
    owners: [
      { name: "袁祖庚", period: "明·嘉靖（约1541）", role: "创建者", note: "筑'药圃''醉颖堂'" },
      { name: "文震孟", period: "明·天启—崇祯", role: "所有者", note: "文徵明曾孙，更名'艺圃'" },
      { name: "姜埰", period: "清·顺治", role: "所有者", note: "更名'敬亭山房'" },
      { name: "姜实节", period: "清·康熙", role: "继承者", note: "姜埰子，守园不仕" },
    ],
  },
  {
    id: "tuisi",
    name: "退思园",
    nameEn: "Retreat & Reflection Garden",
    pinyin: "Tuìsī Yuán",
    built: "清·光绪十一年（1885年）",
    unesco: 2000,
    district: "苏州市吴江区同里镇古镇内",
    lat: 31.1419,
    lng: 120.7169,
    area: "约 0.65 公顷",
    summary:
      "清光绪年间，安徽凤颍六泗兵备道任兰生罢官归乡，取《左传》'进思尽忠，退思补过'之意建园。由画家袁龙规划设计，贴水而筑，布局纵横，为同里古镇明珠。",
    wiki: "https://zh.wikipedia.org/wiki/退思园",
    wikiSummary:
      "退思园位于吴江同里镇，建于清代，以贴水建筑和横向布局独特别致，2000年作为苏州古典园林扩展项目列入世界文化遗产。",
    owners: [
      { name: "任兰生", period: "清·光绪（1885）", role: "创建者", note: "兵备道，罢官后营建" },
      { name: "袁龙", period: "清·光绪", role: "设计者", note: "画家，规划园林布局" },
      { name: "任传薪", period: "清·光绪末", role: "继承者", note: "任兰生子，于园中办丽则女学" },
    ],
  },
];

/* ----------------------------------------------------------------------------
 * 人物关系网络（CBDB 风格）
 * 节点类型：person（人物）/ garden（园林）
 * 边类型 edge.type：
 *   kinship   亲属（曾祖孙、夫妻等）
 *   commission 委托营造 / 设计
 *   artistic   艺术合作（绘图、题咏）
 *   ownership  拥有 / 居住
 * 接入真实 CBDB：见 network.js，可替换为 CBDB API 返回的同构 JSON
 * -------------------------------------------------------------------------- */

const PEOPLE = [
  { id: "wen_zhengming", name: "文徵明", life: "1470–1559", role: "书画家 / 园林设计", dynasty: "明", desc: "吴门画派领袖，参与规划拙政园并绘《拙政园图》《沧浪亭图》。" },
  { id: "wang_xianchen", name: "王献臣", life: "明中期", role: "御史 / 园主", dynasty: "明", desc: "拙政园创建者，罢官归里后营建。" },
  { id: "xu_taishi", name: "徐泰时", life: "明后期", role: "太仆寺少卿 / 园主", dynasty: "明", desc: "留园（东园）创建者。" },
  { id: "liu_shu", name: "刘恕", life: "清中期", role: "收藏家 / 园主", dynasty: "清", desc: "重筑留园，更名'寒碧山庄'。" },
  { id: "sheng_kang", name: "盛康", life: "清后期", role: "官员 / 园主", dynasty: "清", desc: "购留园并定今名，盛宣怀之父。" },
  { id: "sheng_xuanhuai", name: "盛宣怀", life: "1844–1916", role: "洋务重臣", dynasty: "清", desc: "盛康之子，近代实业家。" },
  { id: "shi_zhengzhi", name: "史正志", life: "宋", role: "吏部侍郎 / 园主", dynasty: "南宋", desc: "网师园前身'万卷堂''渔隐'创建者。" },
  { id: "qu_yuancun", name: "瞿远村", life: "清中期", role: "园主 / 叠山", dynasty: "清", desc: "重建网师园，定今名。" },
  { id: "su_shunqin", name: "苏舜钦", life: "1008–1048", role: "诗人 / 园主", dynasty: "北宋", desc: "沧浪亭创建者，取《楚辞》命名。" },
  { id: "han_shizhong", name: "韩世忠", life: "1089–1151", role: "抗金名将", dynasty: "南宋", desc: "南宋时居沧浪亭旧址，与梁红玉唱和。" },
  { id: "tianru", name: "天如禅师", life: "元", role: "僧人 / 创建者", dynasty: "元", desc: "狮子林创建者，纪念其师中峰明本。" },
  { id: "ni_zan", name: "倪瓒", life: "1301–1374", role: "画家", dynasty: "元", desc: "绘《狮子林图》，与狮子林因缘深厚。" },
  { id: "shen_shixing", name: "申时行", life: "1535–1614", role: "大学士", dynasty: "明", desc: "环秀山庄一带为其宅园。" },
  { id: "ge_yuliang", name: "戈裕良", life: "清", role: "叠山大师", dynasty: "清", desc: "环秀山庄湖石假山作者，冠绝一代。" },
  { id: "lu_jin", name: "陆锦", life: "清", role: "园主", dynasty: "清", desc: "耦园前身'涉园'创建者。" },
  { id: "shen_bingcheng", name: "沈秉成", life: "清", role: "安徽巡抚 / 园主", dynasty: "清", desc: "与妻严永华共建耦园。" },
  { id: "yan_yonghua", name: "严永华", life: "清", role: "才女 / 园主", dynasty: "清", desc: "沈秉成妻，耦园唱和主角。" },
  { id: "yuan_zugeng", name: "袁祖庚", life: "明", role: "园主", dynasty: "明", desc: "艺圃前身'药圃'创建者。" },
  { id: "wen_zhenmeng", name: "文震孟", life: "1574–1636", role: "状元 / 园主", dynasty: "明", desc: "文徵明曾孙，居艺圃并定名。" },
  { id: "jiang_cai", name: "姜埰", life: "1607–1673", role: "官员 / 园主", dynasty: "明—清", desc: "入清后居艺圃，更名'敬亭山房'。" },
  { id: "ren_lansheng", name: "任兰生", life: "清", role: "兵备道 / 园主", dynasty: "清", desc: "退思园创建者。" },
  { id: "yuan_long", name: "袁龙", life: "清", role: "画家 / 设计", dynasty: "清", desc: "退思园规划设计师。" },
];

const RELATIONS = [
  // 人物 ↔ 园林（ownership / commission / artistic）
  { source: "wang_xianchen", target: "zhuozheng", type: "ownership", label: "创建" },
  { source: "wen_zhengming", target: "zhuozheng", type: "commission", label: "设计·绘图" },
  { source: "xu_taishi", target: "liuyuan", type: "ownership", label: "创建" },
  { source: "liu_shu", target: "liuyuan", type: "ownership", label: "重建" },
  { source: "sheng_kang", target: "liuyuan", type: "ownership", label: "购园定名" },
  { source: "sheng_xuanhuai", target: "liuyuan", type: "ownership", label: "继承" },
  { source: "shi_zhengzhi", target: "wangshi", type: "ownership", label: "创建" },
  { source: "qu_yuancun", target: "wangshi", type: "ownership", label: "重建" },
  { source: "su_shunqin", target: "canglang", type: "ownership", label: "创建" },
  { source: "wen_zhengming", target: "canglang", type: "artistic", label: "绘图" },
  { source: "han_shizhong", target: "canglang", type: "ownership", label: "居园" },
  { source: "tianru", target: "shizi", type: "ownership", label: "创建" },
  { source: "ni_zan", target: "shizi", type: "artistic", label: "绘图" },
  { source: "shen_shixing", target: "huanxiu", type: "ownership", label: "宅园" },
  { source: "ge_yuliang", target: "huanxiu", type: "commission", label: "叠山" },
  { source: "lu_jin", target: "ouyuan", type: "ownership", label: "创建(涉园)" },
  { source: "shen_bingcheng", target: "ouyuan", type: "ownership", label: "重建" },
  { source: "yan_yonghua", target: "ouyuan", type: "ownership", label: "共建" },
  { source: "yuan_zugeng", target: "yipu", type: "ownership", label: "创建(药圃)" },
  { source: "wen_zhenmeng", target: "yipu", type: "ownership", label: "居园定名" },
  { source: "jiang_cai", target: "yipu", type: "ownership", label: "居园" },
  { source: "ren_lansheng", target: "tuisi", type: "ownership", label: "创建" },
  { source: "yuan_long", target: "tuisi", type: "commission", label: "设计" },

  // 人物 ↔ 人物（kinship / artistic / 师承）
  { source: "wen_zhengming", target: "wen_zhenmeng", type: "kinship", label: "曾祖—曾孙" },
  { source: "shen_bingcheng", target: "yan_yonghua", type: "kinship", label: "夫妻" },
  { source: "sheng_kang", target: "sheng_xuanhuai", type: "kinship", label: "父子" },
  { source: "tianru", target: "ni_zan", type: "artistic", label: "师承·画缘" },
  { source: "wen_zhengming", target: "ni_zan", type: "artistic", label: "画派传承" },
];

/* 关系类型 → 颜色 / 说明（供图例与连线样式使用） */
const RELATION_TYPES = {
  kinship:   { color: "#b5402f", label: "亲属" },
  commission:{ color: "#3f6f5a", label: "委托营造" },
  artistic:  { color: "#c79a3b", label: "艺术合作" },
  ownership: { color: "#5b7aa6", label: "拥有 / 居住" },
};

/* ----------------------------------------------------------------------------
 * RAG 离线演示知识库（占位）
 * 接入真实 RAG 后端：在 rag.js 中配置 RAG_CONFIG.endpoint 即可。
 * 这里仅用于无后端时演示"输入关键词 → 返回专业知识"的交互。
 * -------------------------------------------------------------------------- */
const RAG_KNOWLEDGE = [
  { kw: ["叠山", "假山", "戈裕良", "环秀山庄"], answer: "叠山是江南园林的核心技艺。环秀山庄的湖石假山出自清代叠山大师戈裕良之手，他以一块太湖石横劈数峰，于方寸之间营造'尺幅千里'之势，被誉為'独步江南'。其法重在'皴、漏、透、瘦'的石材挑选与'主峰突出、客山奔趋'的章法。" },
  { kw: ["借景", "复廊", "沧浪亭", "沧浪"], answer: "借景是中国园林'因地制宜、巧于因借'的经典手法。沧浪亭以一道复廊临水而建，'未入园林先成景'——园外之水与园内之山通过漏窗互借，是中国古典园林借景的教科书式范例。" },
  { kw: ["文人园林", "拙政园", "文徵明", "水"], answer: "文人园林（士大夫园林）以'虽由人作，宛自天开'为审美理想。拙政园以水为中心，疏朗淡泊，文徵明参与规划并绘《拙政园图》三十一景，体现了'拙者之为政'的隐逸情怀与诗书画一体的文人趣味。" },
  { kw: ["贴水", "退思园", "横向", "任兰生"], answer: "退思园由画家袁龙设计，突破传统纵向序列，采用横向布局、贴水而筑，建筑贴近水面如浮于水上，是小型宅园中'因水成景'的杰出代表，亦见《左传》'退思补过'的命名深意。" },
  { kw: ["耦园", "夫妻", "严永华", "沈秉成"], answer: "耦园取'偶'（成双）与'耦耕'之意，东、西花园分列住宅两侧，为清安徽巡抚沈秉成与妻子严永华唱和隐居之所，是中国园林中罕见的以夫妻情感为主题意象的实例。" },
  { kw: ["狮子林", "倪瓒", "假山王国", "天如"], answer: "狮子林为元代天如禅师所建，以状如狮子的湖石假山群闻名，号'假山王国'。画家倪瓒绘《狮子林图》传世，乾隆南巡后于承德避暑山庄与圆明园仿建。其假山洞壑盘旋，最宜捉迷藏式游观。" },
  { kw: ["世界遗产", "unesco", "九座", "申报"], answer: "苏州古典园林于1997年（拙政园、留园、网师园、环秀山庄）和2000年（沧浪亭、狮子林、耦园、艺圃、退思园）两批共九座列入《世界遗产名录》，符合'人类想像与创造性的天才杰作'与'中国景观设计巅峰'的突出普遍价值标准。" },
  { kw: ["理水", "水池", "艺圃", "网师园"], answer: "理水是园林理景四要素（叠山、理水、建筑、植物）之一。艺圃以水池居中、质朴疏朗，网师园以半亩方塘见精巧，皆以水体聚气、映景、通幽，体现'一勺代水'的写意精神。" },
  { kw: ["cbdb", "人物关系", "数据库"], answer: "CBDB（China Biographical Database，中国历代人物传记数据库）收录公元7—19世纪人物的亲属、师友、同僚、仕宦等关联。本页人物关系图即依其关联结构（kinship / commission / artistic / ownership）整理，可替换为 CBDB API 实时数据。" },
];

/* 暴露到全局供各模块使用 */
window.GARDEN_DATA = { GARDENS, PEOPLE, RELATIONS, RELATION_TYPES, RAG_KNOWLEDGE };

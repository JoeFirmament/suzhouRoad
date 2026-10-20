"use strict";
(() => {
  // src/config.ts
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

  // src/render/pixel.ts
  function px(g, x, y, w, h, color) {
    g.fillStyle = color;
    g.fillRect(x | 0, y | 0, w | 0, h | 0);
  }

  // src/render/annotation.ts
  var A = {
    font: TYPE_LAYERS.annote.font,
    ink: TYPE_LAYERS.annote.ink,
    size: TYPE_LAYERS.annote.size,
    lineHeight: TYPE_LAYERS.annote.lineHeight ?? 1.75,
    label: TYPE_LAYERS.annote.label ?? "\u4ECA\u6309",
    labelInk: TYPE_LAYERS.annote.labelInk ?? TYPE_LAYERS.annote.ink,
    rule: TYPE_LAYERS.annote.rule ?? TYPE_LAYERS.annote.ink,
    ground: TYPE_LAYERS.annote.ground ?? PALETTE.wall
  };
  var HAND = {
    font: TYPE_LAYERS.hand.font,
    ink: TYPE_LAYERS.hand.ink,
    size: TYPE_LAYERS.hand.size,
    lineHeight: TYPE_LAYERS.hand.lineHeight ?? 1.6,
    seal: TYPE_LAYERS.hand.seal ?? PALETTE.zhu
  };
  var ANNOTATIONS = [
    /* —— 1 —— */
    {
      id: "CH4-13",
      chapter: "CH4 \u72EE\u5B50\u6797",
      type: "name",
      body: "\u6B64\u56ED\u540E\u6765\u5C61\u6613\u5176\u4E3B\u3002\u6C11\u56FD\u516D\u5E74\uFF081917\uFF09\u91CD\u4FEE\u540E\uFF0C\u51A0\u56DE\u300C\u72EE\u5B50\u6797\u300D\u65E7\u540D\u3002",
      afterAction: "\u73A9\u5BB6\u753B\u5B8C\u72EE\u5B50\u6797\u90A3\u4E00\u9875\uFF08\u56ED\u6001 complete\uFF09",
      note: '\u5168\u4F5C"\u4ECA\u6309 \xB7 \u540D\u7269\u578B"\u9996\u4F8B\u3002\u6B64\u524D\u53EA\u53EB"\u7AE0\u672B\u77E5\u8BC6\u6761"\uFF0Cv1.2 \u7EB3\u5165\u7EDF\u4E00\u4F53\u4F8B\u3002'
    },
    /* —— 2 —— 引文型首例 */
    {
      id: "CH5-09",
      chapter: "CH5 \u7F51\u5E08\u56ED",
      type: "quote",
      quote: "\u767D\u672C\u975E\u8272\uFF0C\u800C\u8272\u81EA\u751F\uFF1B\u6C60\u6C34\u65E0\u8272\uFF0C\u800C\u8272\u6700\u4E30\u3002\u8272\u4E2D\u6C42\u8272\uFF0C\u4E0D\u5982\u65E0\u8272\u4E2D\u6C42\u8272\u3002",
      attribution: "\u9648\u4ECE\u5468\u300A\u56ED\u6797\u6E05\u8BAE\u300B",
      edition: "\u5F85\u6838",
      afterAction: "\u73A9\u5BB6\u5728\u56ED\u8C31\u9875\u811A\u9898\u5B8C\u90A3\u4E00\u884C\uFF08\u4E09\u53E5\u767D\u8BDD\u4E4B\u4E00\uFF09",
      note: '\u73A9\u5BB6\u521A\u7528\u767D\u8BDD\u8BF4\u4E86\u540C\u4E00\u4EF6\u4E8B\uFF1B\u4E00\u767E\u5E74\u524D\u9648\u4ECE\u5468\u7528\u6587\u8A00\u8BF4\u4E86\u540C\u4E00\u4EF6\u4E8B\u3002\u8FD9\u4E0D\u662F"\u73A9\u5BB6\u8BF4\u5F97\u7B28\u3001\u4E13\u5BB6\u8BF4\u5F97\u597D"\u2014\u2014\u662F\u9694\u4E86\u4E00\u767E\u5E74\uFF0C\u4E24\u4E2A\u4EBA\u60F3\u5230\u4E86\u4E00\u5904\u3002\u26A0\uFE0F \u8BE5\u6BB5\u4EA6\u5E38\u88AB\u5F15\u4F5C\u300A\u8BF4\u56ED\u300B\u8BED\uFF0C\u539F\u4E66\u672A\u8C03\u9605\uFF0C\u4E66\u540D\u5F52\u5C5E\u5F85\u5B9A\u3002'
    },
    /* —— 3 —— */
    {
      id: "CH5-11",
      chapter: "CH5 \u7F51\u5E08\u56ED",
      type: "name",
      body: "\u540E\u4E16\u53EB\u7F51\u5E08\u56ED\u3002",
      afterAction: "`wangshi` \u2192 `complete`\uFF08\u56DE\u5E9C\u5B66\uFF09",
      note: '\u4E0E\u56ED\u8C31\u9875\u6B63\u9898\u300C\u82CF\u90BB\u5C0F\u7B51\uFF0F\u7F51\u5E08\u56ED\u300D\u5E76\u5217\u5199\u6CD5\u914D\u5957\u2014\u2014\u4E24\u4E2A\u540D\u5B57\u5E76\u6392\uFF0C\u662F\u672C\u7AE0"\u540D\u5B9E"\u4E3B\u9898\u7684\u6536\u53E3\u3002'
    },
    /* —— 4 —— */
    {
      id: "CH6-11",
      chapter: "CH6 \u73AF\u79C0\u5C71\u5E84",
      type: "quote",
      quote: "\u73AF\u79C0\u5C71\u5E84\u5047\u5C71\uFF0C\u5141\u79F0\u4E0A\u9009\uFF0C\u53E0\u5C71\u4E4B\u6CD5\u5177\u5907\u3002\u9020\u56ED\u8005\u4E0D\u89C1\u6B64\u5C71\uFF0C\u6B63\u5982\u5B66\u8BD7\u8005\u672A\u89C1\u674E\u675C\u3002",
      attribution: "\u9648\u4ECE\u5468\u300A\u82CF\u5DDE\u73AF\u79C0\u5C71\u5E84\u300B",
      edition: "\u5F85\u6838",
      afterAction: "\u73A9\u5BB6\u81EA\u5DF1\u8BA4\u51FA\u90A3\u662F\u592A\u6E56\u6797\u5C4B\u6D1E\u3001\u5E76\u5728\u56ED\u8C31\u9875\u4E0B\u9898\u5B8C\u4E00\u884C",
      note: "\u5BF9\u5E9C\u5B66\u5B66\u5B50\uFF0C\u8FD9\u53E5\u8BDD\u7684\u91CD\u91CF\u662F\u53CC\u91CD\u7684\uFF1A\u4ED6\u8BFB\u7684\u8BD7\u4E66\u91CC\u674E\u675C\u662F\u6807\u51C6\uFF0C\u800C\u73B0\u5728\u6709\u4EBA\u628A\u4E00\u5EA7\u5C71\u653E\u8FDB\u4E86\u90A3\u4E2A\u6807\u51C6\u91CC\u3002"
    },
    /* —— 5 —— */
    {
      id: "CH6-13",
      chapter: "CH6 \u73AF\u79C0\u5C71\u5E84",
      type: "name",
      body: "\u5802\u4E0A\u90A3\u56DB\u4E2A\u5B57\uFF0C\u540E\u6765\u6210\u4E86\u8FD9\u5EA7\u56ED\u7684\u540D\u5B57\u3002",
      afterAction: "`huanxiu` \u2192 `complete`\uFF08\u56DE\u5E9C\u5B66\uFF09",
      note: "\u56ED\u540D\u4E09\u5C42\uFF1A\u4FD7\u540D\u300C\u6C6A\u56ED\u300D\uFF0F\u56ED\u540D\u300C\u9890\u56ED\u300D\uFF0F\u5802\u989D\u300C\u73AF\u79C0\u5C71\u5E84\u300D\u3002\u540E\u4E16\u7528\u6765\u53EB\u8FD9\u5EA7\u56ED\u7684\u90A3\u56DB\u4E2A\u5B57\uFF0C\u5C31\u660E\u660E\u767D\u767D\u6302\u5728\u5802\u4E0A\uFF0C\u53EF\u5B83\u4E0D\u662F\u56ED\u540D\u3002"
    },
    /* —— 6 —— */
    {
      id: "CH7-11",
      chapter: "CH7 \u8026\u56ED",
      type: "quote",
      quote: "\u300C\u4EE5\u697C\u73AF\u56ED\uFF0C\u4EE5\u6C34\u73AF\u697C\u300D\uFF0C\u6B64\u6211\u54C1\u8026\u56ED\u4E4B\u8BBA\u3002",
      attribution: "\u9648\u4ECE\u5468\u3008\u6021\u56ED\u4E0E\u8026\u56ED\u3009",
      edition: "\u5F85\u6838",
      afterAction: "\u73A9\u5BB6\u5728\u56ED\u8C31\u90A3\u4E00\u9875\u9898\u5B8C\u4E00\u884C\uFF08\u4E09\u53E5\u4E4B\u4E00\uFF09",
      note: '\u4E0D\u70B9\u7834"\u592A\u6781"\u662F 2002 \u5E74\u7684\u4E8B\uFF08\u89C4\u683C 2\uFF1A\u4ECA\u6309\u4E0D\u89E3\u9898\uFF09\u3002'
    },
    /* —— 7 —— */
    {
      id: "CH7-13",
      chapter: "CH7 \u8026\u56ED",
      type: "name",
      body: "\u8FD9\u56ED\u5B50\u4ECE\u524D\u53EB\u300C\u6D89\u56ED\u300D\u2014\u2014\u300C\u56ED\u65E5\u6D89\u4EE5\u6210\u8DA3\u300D\u3002\u540E\u6765\u6C88\u6C0F\u6269\u6210\u4E00\u5B85\u4E24\u56ED\uFF0C\u6539\u540D\u300C\u8026\u56ED\u300D\u3002",
      afterAction: "`ouyuan` \u2192 `complete`\uFF08\u56DE\u5E9C\u5B66\uFF09",
      note: '\u4E0E CH5\uFF08\u4E24\u4E2A\u540D\u5B57\u5E76\u6392\uFF09\u3001CH9\uFF08\u4E00\u5757\u77F3\u5934\u4E94\u4E2A\u540D\u5B57\uFF09\u6784\u6210"\u540D"\u7684\u4E09\u8FDE\u6536\u675F\u3002'
    },
    /* —— 8 —— */
    {
      id: "CH8-12",
      chapter: "CH8 \u9000\u601D\u56ED",
      type: "quote",
      quote: "\u4EFB\u6C0F\u9000\u601D\u56ED\u4E8E\u6C5F\u5357\u56ED\u6797\u4E2D\u72EC\u8F9F\u8E4A\u5F84\uFF0C\u5177\u8D34\u6C34\u56ED\u4E4B\u7279\u4F8B\u3002\u5C71\u3001\u4EAD\u3001\u9986\u3001\u5ECA\u3001\u8F69\u3001\u69AD\u7B49\u7686\u7D27\u8D34\u6C34\u9762\uFF0C\u56ED\u5982\u51FA\u6C34\u4E0A\u3002\u2026\u2026\u4F59\u8C13\u4E4B\u5927\u56ED\u5B9C\u4F9D\u6C34\uFF0C\u5C0F\u56ED\u91CD\u8D34\u6C34\u3002",
      attribution: "\u9648\u4ECE\u5468\u300A\u8BF4\u56ED\u300B",
      edition: "\u5F85\u6838",
      afterAction: "\u73A9\u5BB6\u9898\u5B8C\u81EA\u5DF1\u90A3\u4E00\u884C\uFF08\u4E0E\u963F\u69FF\u4E24\u79CD\u7EB8\u5E76\u6392\u8D34\u5728\u540C\u4E00\u9875\uFF09",
      note: '\u524D\u4E09\u6B21\u662F\u540E\u4EBA\u8BC4\u8BBA\u8FD9\u5EA7\u56ED\uFF1B\u8FD9\u4E00\u6B21\u662F\u540E\u4EBA\u7ED9\u8FD9\u5EA7\u56ED\u8D77\u4E86\u4E00\u4E2A\u7C7B\u578B\u540D\u2014\u2014\u300C\u8D34\u6C34\u56ED\u300D\u3002\u9648\u4ECE\u5468\u8BF4\u7684\u662F"\u8FD9\u5EA7\u56ED\u5C5E\u4E8E\u54EA\u4E00\u7C7B"\uFF0C\u800C\u73A9\u5BB6\u5DF2\u7ECF\u8D8A\u8FC7\u4E86\u8FD9\u4E00\u5C42\u2014\u2014\u4ED6\u770B\u89C1\u7684\u662F"\u5916\u9762\u8FD8\u6709\u4EC0\u4E48"\u3002\u4ECA\u6309\u6BD4\u73A9\u5BB6\u6162\u4E00\u6B65\u3002'
    },
    /* —— 9 —— */
    {
      id: "CH8-13",
      chapter: "CH8 \u9000\u601D\u56ED",
      type: "name",
      body: "\u5218\u6566\u6862\u6536\u4E86\u5341\u4E94\u5EA7\u56ED\uFF0C\u5168\u5728\u57CE\u91CC\uFF1B\u9000\u601D\u56ED\u4E0D\u5728\u5176\u4E2D\u3002",
      afterAction: "`tuisi` \u2192 `complete`\uFF08\u56DE\u5E9C\u5B66\uFF09",
      note: "\u4E5D\u56ED\u552F\u4E00\u5728\u57CE\u5916\u7684\u4E00\u5EA7\u3002"
    },
    /* —— 10 —— 引文型首次轮换 */
    {
      id: "CH9-12",
      chapter: "CH9 \u827A\u5703",
      type: "quote",
      quote: "\u5E03\u5C40\u7B80\u7EC3\u5F00\u6717\uFF0C\u6C60\u5CB8\u4F4E\u5E73\uFF0C\u6C34\u9762\u96C6\u4E2D\uFF0C\u65E0\u58C5\u585E\u5C40\u4FC3\u4E4B\u611F\uFF0C\u98CE\u683C\u81EA\u7136\u6734\u8D28\uFF0C\u8F83\u591A\u5730\u4FDD\u5B58\u4E86\u5EFA\u56ED\u521D\u671F\u7684\u89C4\u5236\u3002",
      attribution: "\u5218\u6566\u6862\u300A\u82CF\u5DDE\u53E4\u5178\u56ED\u6797\u300B",
      edition: "\u5F85\u6838\uFF08\u636E\u591A\u65B9\u8F6C\u5F15\uFF09",
      afterAction: "\u73A9\u5BB6\u5728\u753B\u9875\u4E0A\u4E00\u7B14\u4E00\u7B14\u64E6\u5230\u53EA\u5269\u6C34\xB7\u5899\xB7\u5C71",
      note: '\u2B50 CH5\u2013CH8 \u8FDE\u7EED\u56DB\u6B21\u5F15\u6587\u578B\u90FD\u662F\u9648\u4ECE\u5468\uFF0CCH9 \u6362\u6210\u5218\u6566\u6862\u3002\u7406\u7531\u4E0D\u662F"\u8BE5\u6362\u4E86"\uFF0C\u662F"\u8FD9\u4E00\u7AE0\u6362\u5F97\u52A8"\uFF1A\u827A\u5703\u5728\u5218\u6566\u6862\u5341\u4E94\u5904\u5B9E\u4F8B\u4E4B\u5185\uFF08\u7B2C\u516B\uFF09\uFF0C\u9000\u601D\u56ED\u4E0D\u5728\u3002\u5185\u5BB9\u4E0A\u5DE7\u5408\u6781\u51C6\u2014\u2014\u5218\u6566\u6862\u8BF4\u7684\u300C\u6C60\u5CB8\u4F4E\u5E73\uFF0F\u6C34\u9762\u96C6\u4E2D\u300D\u6B63\u662F\u73A9\u5BB6\u521A\u521A\u64E6\u5269\u7684\u90A3\u4E09\u6837\u3002'
    },
    /* —— 11 —— */
    {
      id: "CH9-13",
      chapter: "CH9 \u827A\u5703",
      type: "name",
      body: "\u9189\u9896\u5802 \u2192 \u836F\u5703 \u2192 \u656C\u4EAD\u5C71\u623F\uFF08\u9890\u5703\uFF09\u2192 \u827A\u5703 \u2192 \u4E03\u8944\u516C\u6240\u3002\u4E00\u5757\u77F3\u5934\uFF0C\u4E94\u4E2A\u540D\u5B57\uFF0C\u524D\u540E\u4E09\u767E\u5E74\u3002",
      afterAction: "`yipu` \u2192 `complete`\uFF08\u56DE\u5E9C\u5B66\uFF0C\u7B2C\u4E00\u90E8\u4E09\u9875\u9F50\uFF09",
      note: "\u7B2C\u4E00\u90E8\u7684\u7B54\u6848\u662F\uFF1A\u540D\u5B57\u662F\u4E00\u5C42\u4E00\u5C42\u52A0\u4E0A\u53BB\u7684\uFF0C\u800C\u6700\u540E\u7559\u4E0B\u7684\u5F80\u5F80\u662F\u6700\u4E0D\u8D77\u773C\u7684\u90A3\u4E2A\u3002"
    },
    /* —— 12 —— 整幕今按（规范 §2.6.7 例外） */
    {
      id: "finale-act2",
      chapter: "\u7EC8\u7AE0 \xB7 \u4E59\u5E55",
      type: "quote",
      quote: "\u6CA1\u6709\u54EA\u4E9B\u56ED\u6797\u6BD4\u5386\u53F2\u540D\u57CE\u82CF\u5DDE\u7684\u56ED\u6797\u66F4\u80FD\u4F53\u73B0\u51FA\u4E2D\u56FD\u53E4\u5178\u56ED\u6797\u8BBE\u8BA1\u7684\u7406\u60F3\u54C1\u8D28\u3002\u54AB\u5C3A\u4E4B\u5185\u518D\u9020\u4E7E\u5764\uFF0C\u82CF\u5DDE\u56ED\u6797\u88AB\u516C\u8BA4\u662F\u5B9E\u73B0\u8FD9\u4E00\u8BBE\u8BA1\u601D\u60F3\u7684\u5178\u8303\u3002",
      attribution: "UNESCO \u4E16\u754C\u9057\u4EA7\u59D4\u5458\u4F1A\uFF081997\uFF0C\u90A3\u4E0D\u52D2\u65AF\uFF09",
      edition: "\u4E16\u754C\u9057\u4EA7\u540D\u5F55 \xB7 \u82CF\u5DDE\u53E4\u5178\u56ED\u6797",
      afterAction: "\u7532\u5E55\u73A9\u5BB6\u843D\u6B3E\u3001\u7B2C\u5341\u5F20\u7A7A\u9875\u6309\u4E0B\u53D6\u666F\u5323\u4E4B\u540E",
      note: "\u2B50 \u6574\u5E55\u7686\u4ECA\u6309\u2014\u2014\u89C4\u8303 \xA72.6.7 \u7684\u4F8B\u5916\uFF0C\u4E0D\u662F\u8D8A\u754C\uFF0C\u662F\u8FD9\u4E00\u5C42\u7684\u7EC8\u70B9\u3002\u672C\u5E55\u91CC\u4E3B\u89D2\u4E0D\u5728\u573A\u3001NPC \u4E0D\u51FA\u73B0\u3001\u4E0D\u5165 knowledge\u3001\u4E0D\u7ED9 flag\u3001\u4E0D\u8FDB\u56ED\u8C31\u3001\u4E0D\u4E0A\u300A\u8607\u57CE\u5168\u5716\u300B\u3002"
    }
  ];
  var DEFAULT_TIMING = {
    delayMs: TUNING.annotationDelayMs,
    fadeMs: TUNING.annotationFadeMs,
    steps: TUNING.annotationSteps
  };
  function annotationAlpha(actionAt, now, timing = DEFAULT_TIMING) {
    const elapsed = now - actionAt;
    if (elapsed < timing.delayMs) return 0;
    const t = Math.min(1, (elapsed - timing.delayMs) / Math.max(1, timing.fadeMs));
    return Math.round(t * timing.steps) / timing.steps;
  }
  function annotationCountdown(actionAt, now, timing = DEFAULT_TIMING) {
    return Math.max(0, timing.delayMs - (now - actionAt));
  }
  function wrap(g, text, maxW) {
    const lines = [];
    let line = "";
    for (const ch of text) {
      const probe = line + ch;
      if (g.measureText(probe).width > maxW && line) {
        lines.push(line);
        line = ch;
      } else {
        line = probe;
      }
    }
    if (line) lines.push(line);
    return lines;
  }
  function drawAnnotation(g, ann, box, actionAt, now, timing = DEFAULT_TIMING) {
    const alpha = annotationAlpha(actionAt, now, timing);
    if (alpha <= 0) return { height: 0, drawn: false };
    const pad = box.pad ?? 14;
    const textW = box.w - pad * 2;
    const lineH = A.size * A.lineHeight;
    g.font = `${A.size}px ${A.font}`;
    const bodyLines = ann.body ? wrap(g, ann.body, textW) : [];
    const quoteLines = ann.quote ? wrap(g, `\u300C${ann.quote}\u300D`, textW) : [];
    const srcLines = [];
    if (ann.attribution) {
      g.font = `${A.size - 1}px ${A.font}`;
      srcLines.push(...wrap(g, `\u2014 ${ann.attribution}${ann.edition ? `\u3014${ann.edition}\u3015` : ""}`, textW));
    }
    const h = pad * 2 + lineH + (bodyLines.length + quoteLines.length) * lineH + (srcLines.length ? 6 + srcLines.length * (lineH - 4) : 0);
    g.save();
    g.globalAlpha = alpha;
    px(g, box.x, box.y, box.w, h, A.ground);
    px(g, box.x, box.y, 2, h, A.rule);
    g.textAlign = "left";
    g.textBaseline = "alphabetic";
    g.fillStyle = A.labelInk;
    g.font = `${A.size - 1}px ${A.font}`;
    g.fillText(A.label, box.x + pad, box.y + pad + A.size - 1);
    let cursorY = box.y + pad + lineH + A.size - 1;
    g.fillStyle = A.ink;
    g.font = `${A.size}px ${A.font}`;
    for (const l of bodyLines) {
      g.fillText(l, box.x + pad, cursorY);
      cursorY += lineH;
    }
    for (const l of quoteLines) {
      g.fillText(l, box.x + pad, cursorY);
      cursorY += lineH;
    }
    if (srcLines.length) {
      cursorY += 6;
      g.fillStyle = A.labelInk;
      g.font = `${A.size - 1}px ${A.font}`;
      for (const l of srcLines) {
        g.fillText(l, box.x + pad, cursorY);
        cursorY += lineH - 4;
      }
    }
    g.restore();
    return { height: h, drawn: true };
  }
  function drawHandSample(g, text, x, y, w, alpha = 1) {
    const pad = 14, lineH = HAND.size * HAND.lineHeight;
    g.save();
    g.globalAlpha = alpha;
    g.font = `${HAND.size}px ${HAND.font}`;
    g.textAlign = "left";
    g.textBaseline = "alphabetic";
    const lines = wrap(g, text, w - pad * 2);
    const h = pad * 2 + lines.length * lineH;
    px(g, x, y, w, h, PALETTE.paper);
    g.fillStyle = HAND.ink;
    let cy = y + pad + HAND.size;
    for (const l of lines) {
      g.fillText(l, x + pad, cy);
      cy += lineH;
    }
    px(g, x + w - pad - 14, y + 6, 14, 14, HAND.seal);
    g.restore();
    return h;
  }
  var FORBIDDEN_EVALUATIVE = [
    "\u56E0\u6B64",
    "\u8FD9\u8BF4\u660E",
    "\u8BC1\u660E\u4E86",
    "\u53EF\u89C1",
    "\u6B63\u786E\u7B54\u6848",
    "\u4F60\u5E94\u8BE5",
    "\u9707\u64BC",
    "\u4E86\u4E0D\u8D77",
    "\u7EDD\u5999",
    "\u53EF\u60DC",
    "\u53EF\u60DC\u4E86"
  ];
  function lintAnnotation(ann) {
    const out = [];
    const push = (level, spec, msg) => out.push({ level, spec, msg, id: ann.id });
    if (!ann.afterAction.trim()) push("error", "\u89C4\u683C1", "\u7F3A afterAction\uFF1A\u4ECA\u6309\u5FC5\u987B\u5199\u660E\u6392\u5728\u73A9\u5BB6\u54EA\u4E2A\u52A8\u4F5C\u4E4B\u540E\u3002");
    if (ann.type === "quote") {
      if (!ann.quote) push("error", "\u89C4\u683C3", "\u5F15\u6587\u578B\u7F3A quote\uFF08\u539F\u53E5\uFF09\u3002");
      if (!ann.attribution) push("error", "\u89C4\u683C3", "\u5F15\u6587\u578B\u7F3A attribution\uFF08\u4EBA\u540D + \u4E66\u540D\uFF09\u3002");
      if (!ann.edition) push("warn", "\u89C4\u683C3", "\u7F3A edition\uFF08\u7248\u672C\u9875\u7801\uFF09\u2014\u2014\u987B\u586B\u6216\u586B\u300C\u5F85\u6838\u300D\u3002");
    }
    if (ann.type === "name" && ann.quote) {
      push("error", "\u89C4\u683C3", "\u540D\u7269\u578B\u4E0D\u8BB8\u5F15\u6587\uFF08\u5F15\u6587\u578B\u624D\u662F\u5F15\u6587\u7684\u5BB9\u5668\uFF09\u3002");
    }
    const scan = ann.body ?? "";
    for (const w of FORBIDDEN_EVALUATIVE) {
      if (scan.includes(w)) push("warn", "\u89C4\u683C2", `body \u51FA\u73B0\u8BC4\u4EF7/\u89E3\u91CA\u8BCD\u300C${w}\u300D\u2014\u2014\u4ECA\u6309\u662F\u56DE\u58F0\u4E0D\u662F\u89E3\u7B54\u3002`);
    }
    return out;
  }
  function checkLayerSeparation() {
    const out = [];
    const push = (msg) => out.push({ level: "error", spec: "\u89C4\u683C5", id: "TYPE_LAYERS", msg });
    const { world, hand, annote } = TYPE_LAYERS;
    if (hand.font === annote.font) push("\u624B\u8FF9\u4E0E\u4ECA\u6309\u7528\u4E86\u540C\u4E00\u5B57\u4F53 \u2014\u2014 \u5206\u79BB\u5931\u8D25\uFF08\u5B57\u4F53\u662F\u4E00\u4E2A\u8F74\uFF09\u3002");
    if (hand.ink === annote.ink) push("\u624B\u8FF9\u4E0E\u4ECA\u6309\u7528\u4E86\u540C\u4E00\u58A8\u8272 \u2014\u2014 \u5206\u79BB\u5931\u8D25\uFF08\u58A8\u8272\u662F\u4E00\u4E2A\u8F74\uFF09\u3002");
    if (hand.size === annote.size) push('\u624B\u8FF9\u4E0E\u4ECA\u6309\u5B57\u53F7\u76F8\u540C \u2014\u2014 \u4ECA\u6309\u987B\u662F"\u5C0F\u5B57"\u3002');
    if (!hand.seal) push("\u73A9\u5BB6\u624B\u8FF9\u7F3A\u6731\u5370 \u2014\u2014 \u5370\u662F\u624B\u8FF9\u7684\u8EAB\u4EFD\u6807\u8BB0\u3002");
    if (annote.seal) push("\u4ECA\u6309\u5E26\u4E86\u5370 \u2014\u2014 \u4ECA\u6309\u7EDD\u65E0\u5370\uFF08\u5370\u5C5E\u4E8E\u624B\u8FF9\uFF0C\u4E0D\u5C5E\u4E8E\u540E\u4E16\u4E4B\u8BC4\uFF09\u3002");
    if (!annote.label) push("\u4ECA\u6309\u7F3A\u8D77\u9996\u4E8C\u5B57\uFF08\u89C4\u683C 5 \u660E\u6587\u8981\u6C42\u4EE5\u300C\u4ECA\u6309\u300D\u8D77\u9996\uFF09\u3002");
    if (!annote.rule) push("\u4ECA\u6309\u7F3A\u5DE6\u4FA7\u754C\u884C\uFF08\u4E0E\u624B\u8FF9\u7684\u89C6\u89C9\u5206\u79BB\u5C11\u4E00\u4E2A\u8F74\uFF09\u3002");
    if (!annote.ground) push("\u4ECA\u6309\u7F3A\u8D34\u6761\u7EB8\u5E95\u3002");
    if (annote.ground === PALETTE.paper) push("\u4ECA\u6309\u7EB8\u5E95\u4E0E\u6B63\u6587\u7EB8\u76F8\u540C \u2014\u2014 \u8D34\u6761\u7EB8\u5E95\u5E94\u66F4\u4EAE\u66F4\u51B7\u3002");
    if (annote.size >= world.size) push("\u4ECA\u6309\u5B57\u53F7\u672A\u5C0F\u4E8E\u6B63\u6587 \u2014\u2014 \u53E4\u7C4D\u6309\u8BED\u662F\u5C0F\u5B57\u3002");
    return out;
  }
  function runAllChecks() {
    return [
      ...ANNOTATIONS.flatMap(lintAnnotation),
      ...checkLayerSeparation()
    ];
  }

  // src/annotation-lab.ts
  var W = 880;
  var H = 560;
  var canvas = document.getElementById("labCanvas");
  canvas.width = W;
  canvas.height = H;
  var ctx = canvas.getContext("2d", { alpha: false });
  ctx.imageSmoothingEnabled = false;
  var SAMPLES = {
    "CH4-13": { world: "\u6D89\u56ED \xB7 \u4E00\u9053\u5899\uFF0C\u4E24\u68F5\u94F6\u674F\u3002\uFF08\u9875\u811A\uFF09", hand: "\u5899\u91CC\u6709\u4E24\u68F5\u94F6\u674F\u3002" },
    "CH5-09": { world: "\u56ED\u8C31 \xB7 \u5377\u4E09 \xB7 \u82CF\u90BB\u5C0F\u7B51\uFF0F\u7F51\u5E08\u56ED", hand: "\u5CB8\u4E0A\u7684\u5899\u662F\u767D\u7684\u3002\u6C34\u91CC\u7684\u5899\uFF0C\u4E5F\u662F\u767D\u7684\u2014\u2014\u53EF\u6C34\u4E0D\u662F\u3002" },
    "CH5-11": { world: "\u7AE0\u672B \xB7 \u56DE\u5E9C\u5B66 \xB7 \u644A\u5F00\u56ED\u8C31", hand: "\u8FD9\u4E00\u9875\uFF0C\u6211\u9898\u4E86\u4E24\u4E2A\u540D\u5B57\u3002" },
    "CH6-11": { world: "\u56ED\u8C31 \xB7 \u5377\u4E94 \xB7 \u6C6A\u56ED", hand: "\u5C71\u4E0D\u662F\u7167\u753B\u5806\u7684\u3002\u753B\u548C\u5C71\uFF0C\u90FD\u7167\u7740\u540C\u4E00\u4E2A\u4E1C\u897F\u3002" },
    "CH6-13": { world: "\u7AE0\u672B \xB7 \u56DE\u5E9C\u5B66 \xB7 \u5802\u4E0A\u90A3\u56DB\u4E2A\u5B57", hand: "\u5802\u4E0A\u6302\u7740\u56DB\u4E2A\u5B57\uFF0C\u6211\u6CA1\u6562\u5FF5\u3002" },
    "CH7-11": { world: "\u56ED\u8C31 \xB7 \u5377\u516B \xB7 \u8026\u56ED", hand: "\u6211\u6570\u4E86\u4E00\u904D\uFF1A\u4E1C\u8FB9\u6709\u6C34\uFF0C\u897F\u8FB9\u6CA1\u6709\u3002" },
    "CH7-13": { world: "\u7AE0\u672B \xB7 \u56DE\u5E9C\u5B66 \xB7 \u95E8\u53E3\u90A3\u5757\u533E", hand: "\u8FD9\u56ED\u5B50\u95E8\u53E3\u7684\u5B57\uFF0C\u6211\u770B\u4E86\u5F88\u4E45\u3002" },
    "CH8-12": { world: "\u56ED\u8C31 \xB7 \u5377\u4E5D \xB7 \uFF08\u4E24\u79CD\u7EB8\u5E76\u6392\uFF09", hand: "\u56ED\u5B50\u662F\u65B0\u7684\u3002\u6811\u4E0D\u662F\u3002" },
    "CH8-13": { world: "\u7AE0\u672B \xB7 \u56DE\u5E9C\u5B66 \xB7 \u8D70\u4E86\u4E00\u5929\u6C34\u8DEF", hand: "\u8FD9\u4E00\u8D9F\uFF0C\u6211\u8D70\u4E86\u4E00\u6574\u5929\u7684\u8239\u3002" },
    "CH9-12": { world: "\u56ED\u8C31 \xB7 \u5377\u4E00 \xB7 \u4E03\u8944\u516C\u6240\uFF08\u753B\u9875\uFF09", hand: "\u64E6\u5230\u53EA\u5269\u6C34\u3001\u5899\u3001\u5C71\u3002" },
    "CH9-13": { world: "\u7AE0\u672B \xB7 \u56DE\u5E9C\u5B66 \xB7 \u7B2C\u4E00\u90E8\u4E09\u9875\u9F50", hand: "\u6211\u9898\u7684\u540D\u5B57\uFF0C\u662F\u6700\u540E\u90A3\u4E2A\u3002" },
    "finale-act2": { world: "\uFF08\u7532\u5E55\u6536\u675F \xB7 \u300A\u8607\u57CE\u5168\u5716\u300B\u5BF9\u6298\uFF09", hand: "\u3014\u843D\u6B3E\u3015" }
  };
  var state = {
    idx: 0,
    /** 玩家的动作时刻（rAF timeStamp）。这就是时序锚点。 */
    actionAt: 0,
    /** 对照模式：三层同时以 alpha=1 并排显示。 */
    compare: false,
    timing: { ...DEFAULT_TIMING },
    lastFrame: 0
  };
  var current = () => ANNOTATIONS[state.idx];
  var sample = () => SAMPLES[current().id] ?? { world: "", hand: "" };
  function replay() {
    state.actionAt = performance.now();
  }
  function drawStage(now) {
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = PALETTE.inkPale;
    ctx.lineWidth = 1;
    ctx.strokeRect(28.5, 24.5, W - 57, H - 48);
    ctx.beginPath();
    ctx.moveTo(W / 2, 24);
    ctx.lineTo(W / 2, H - 24);
    ctx.stroke();
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = PALETTE.inkMid;
    ctx.font = `11px ${TYPE_LAYERS.world.font}`;
    ctx.fillText(`${current().chapter}\u3000\xB7\u3000${current().id}`, 44, 46);
    const elapsed = now - state.actionAt;
    let status, statusInk;
    if (state.compare) {
      status = "\u5BF9\u7167\u6A21\u5F0F \xB7 \u4E09\u5C42\u540C\u65F6\u5168\u663E";
      statusInk = PALETTE.qing;
    } else if (elapsed < state.timing.delayMs) {
      status = `\u2460 \u52A8\u4F5C\u5DF2\u53D1\u751F \u2192\u3000\u7A0D\u987F\u4E2D\uFF08\u8FD8\u5269 ${Math.round(annotationCountdown(state.actionAt, now, state.timing))} ms\uFF09`;
      statusInk = PALETTE.zhu;
    } else if (annotationAlpha(state.actionAt, now, state.timing) < 1) {
      status = "\u2461 \u7A0D\u987F\u7ED3\u675F \u2192\u3000\u4ECA\u6309\u9636\u68AF\u6D6E\u73B0\u4E2D";
      statusInk = TUNING.annotationDelayMs > 0 ? PALETTE.gold : PALETTE.ink;
    } else {
      status = "\u2462 \u4ECA\u6309\u5DF2\u6D6E\u73B0\uFF08\u5DF2\u7A33\u5B9A\uFF09";
      statusInk = PALETTE.qing;
    }
    ctx.fillStyle = statusInk;
    ctx.font = '11px "PingFang SC",sans-serif';
    ctx.textAlign = "right";
    ctx.fillText(status, W - 44, 46);
    ctx.textAlign = "left";
    const halfW = W / 2 - 44 - 14;
    const lx = 44, rx = W / 2 + 14;
    let ly = 84;
    ctx.fillStyle = PALETTE.inkMid;
    ctx.font = '10px "PingFang SC",sans-serif';
    ctx.fillText("\u4E16\u754C\u6587\u5B57\uFF08\u6E05\u672B\uFF09", lx, ly);
    ly += 20;
    ctx.fillStyle = TYPE_LAYERS.world.ink;
    ctx.font = `${TYPE_LAYERS.world.size}px ${TYPE_LAYERS.world.font}`;
    ly += drawWrapped(ctx, sample().world, lx, ly, halfW, 26);
    ly += 24;
    ctx.fillStyle = PALETTE.inkMid;
    ctx.font = '10px "PingFang SC",sans-serif';
    ctx.fillText("\u73A9\u5BB6\u624B\u8FF9\uFF08\u5E26\u6731\u5370\uFF09", lx, ly);
    ly += 10;
    const handH = drawHandSample(ctx, sample().hand, lx, ly, halfW, 1);
    ly += handH + 22;
    let ry = 84;
    ctx.fillStyle = PALETTE.inkMid;
    ctx.font = '10px "PingFang SC",sans-serif';
    ctx.fillText(`\u4ECA\u6309\uFF08\u540E\u4E16\u4E4B\u8BC4 \xB7 ${current().type === "quote" ? "\u5F15\u6587\u578B" : "\u540D\u7269\u578B"}\uFF09`, rx, ry);
    ry += 20;
    const res = state.compare ? forceDraw(ctx, current(), { x: rx, y: ry, w: halfW }) : drawAnnotation(ctx, current(), { x: rx, y: ry, w: halfW }, state.actionAt, now, state.timing);
    if (!res.drawn) {
      ctx.save();
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = PALETTE.inkPale;
      ctx.strokeRect(rx + 0.5, ry + 0.5, halfW - 1, 96.5);
      ctx.setLineDash([]);
      ctx.fillStyle = PALETTE.inkPale;
      ctx.font = '11px "PingFang SC",sans-serif';
      ctx.fillText("\u2014 \u8FD9\u4E00\u5904\u8FD8\u7A7A\u7740\u3002\u4ECA\u6309\u53EA\u5728\u73A9\u5BB6\u52A8\u4F5C\u4E4B\u540E\u51FA\u73B0\u3002", rx + 12, ry + 30);
      ctx.fillText(`\uFF08${current().afterAction}\uFF09`, rx + 12, ry + 50);
      ctx.restore();
    }
    drawTimeline(now);
    if (state.compare) {
      ctx.fillStyle = PALETTE.inkMid;
      ctx.font = '10px "PingFang SC",sans-serif';
      ctx.fillText("\u4E03\u4E2A\u5206\u79BB\u8F74\uFF1A\u5B57\u4F53\uFF0F\u58A8\u8272\uFF0F\u5B57\u53F7\uFF0F\u8D77\u9996\uFF0F\u754C\u884C\uFF0F\u7EB8\u5E95\uFF0F\u65F6\u5E8F\u3000\uFF08+ \u5370\uFF1A\u624B\u8FF9\u6709\uFF0C\u4ECA\u6309\u65E0\uFF09", 44, H - 36);
    }
  }
  function forceDraw(g, ann, box) {
    return drawAnnotation(g, ann, box, 0, 1e6, { delayMs: 0, fadeMs: 0, steps: 1 });
  }
  function drawWrapped(g, text, x, y, maxW, lineH) {
    let line = "", rows = 0;
    for (const ch of text) {
      if (g.measureText(line + ch).width > maxW && line) {
        g.fillText(line, x, y + rows * lineH);
        line = ch;
        rows++;
      } else line += ch;
    }
    if (line) {
      g.fillText(line, x, y + rows * lineH);
      rows++;
    }
    return rows * lineH;
  }
  function drawTimeline(now) {
    const y = H - 78, x0 = 44, x1 = W - 44;
    const total = state.timing.delayMs + state.timing.fadeMs;
    const span = Math.max(total * 1.35, 1200);
    const t = Math.max(0, now - state.actionAt);
    ctx.fillStyle = PALETTE.inkPale;
    ctx.fillRect(x0, y, x1 - x0, 1);
    const px1 = x0 + (x1 - x0) * Math.min(1, t / span);
    const split = x0 + (x1 - x0) * (state.timing.delayMs / span);
    ctx.fillStyle = PALETTE.inkPale;
    ctx.fillRect(x0, y - 3, Math.max(0, split - x0), 7);
    const fadeEnd = x0 + (x1 - x0) * Math.min(1.25, total / span);
    ctx.fillStyle = PALETTE.qing;
    ctx.fillRect(split, y - 3, Math.max(0, fadeEnd - split), 7);
    ctx.fillStyle = PALETTE.zhu;
    ctx.fillRect(px1 - 1, y - 8, 2, 17);
    ctx.font = '10px "PingFang SC",sans-serif';
    ctx.fillStyle = PALETTE.inkMid;
    ctx.textAlign = "left";
    ctx.fillText("\u73A9\u5BB6\u52A8\u4F5C", x0, y + 22);
    ctx.fillText(`\u7A0D\u987F ${state.timing.delayMs}ms`, split - 30, y + 22);
    ctx.textAlign = "right";
    ctx.fillText(`\u9636\u68AF\u6D6E\u73B0 ${state.timing.fadeMs}ms / ${state.timing.steps} \u7EA7`, x1, y + 22);
    ctx.textAlign = "left";
  }
  var listEl = document.getElementById("annList");
  ANNOTATIONS.forEach((a, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<b>${a.id}</b><span>${a.chapter}</span><em>${a.type === "quote" ? "\u5F15\u6587" : "\u540D\u7269"}</em><i>${a.type === "quote" ? esc(a.attribution ?? "") : esc(a.body ?? "")}</i>`;
    li.addEventListener("click", () => {
      state.idx = i;
      [...Array.from(listEl.children)].forEach((c, j) => c.classList.toggle("on", j === i));
      replay();
      renderDetail();
    });
    if (i === 0) li.classList.add("on");
    listEl.append(li);
  });
  function esc(s) {
    return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
  }
  var detailEl = document.getElementById("annDetail");
  function renderDetail() {
    const a = current();
    detailEl.innerHTML = `
    <dl>
      <dt>\u573A\u53F7</dt><dd>${esc(a.id)}</dd>
      <dt>\u578B</dt><dd>${a.type === "quote" ? "\u5F15\u6587\u578B\uFF08\u5F15\u539F\u53E5\uFF0C\u5FC5\u6807\u4EBA\u540D+\u4E66\u540D\uFF09" : "\u540D\u7269\u578B\uFF08\u53EA\u6B63\u540D\u3001\u53EA\u4EA4\u4EE3\u6CBF\u9769\uFF0C\u4E0D\u5F15\u6587\uFF09"}</dd>
      ${a.quote ? `<dt>\u539F\u53E5</dt><dd class="q">\u300C${esc(a.quote)}\u300D</dd>
      <dt>\u51FA\u5904</dt><dd>${esc(a.attribution ?? "")}${a.edition ? `\u3000<span class="warn">\u3014${esc(a.edition)}\u3015</span>` : ""}</dd>` : ""}
      ${a.body ? `<dt>\u6B63\u6587</dt><dd>${esc(a.body)}</dd>` : ""}
      <dt>\u65F6\u5E8F\u951A\u70B9</dt><dd>\u6392\u5728\u6B64\u52A8\u4F5C\u4E4B\u540E\uFF1A<b>${esc(a.afterAction)}</b></dd>
      ${a.note ? `<dt>\u4E3A\u4EC0\u4E48\u503C\u94B1</dt><dd class="note">${esc(a.note)}</dd>` : ""}
    </dl>`;
  }
  function renderLint() {
    const findings = runAllChecks();
    const specs = ["\u89C4\u683C1 \u65F6\u5E8F\u5728\u73A9\u5BB6\u4E4B\u540E", "\u89C4\u683C2 \u4E0D\u89E3\u9898", "\u89C4\u683C3 \u5FC5\u6807\u51FA\u5904", "\u89C4\u683C4 \u53EA\u7ED9\u73A9\u5BB6", "\u89C4\u683C5 \u4E0E\u624B\u8FF9\u5206\u79BB"];
    const bySpec = {};
    for (const f of findings) (bySpec[f.spec] ??= []).push(`${f.level === "error" ? "\u2715" : "!"} ${f.id}\uFF1A${f.msg}`);
    const box = document.getElementById("lintBox");
    box.innerHTML = specs.map((s) => {
      const key = s.slice(0, 3);
      const items = bySpec[key] ?? [];
      const hasError = items.some((i) => i.startsWith("\u2715"));
      const cls = hasError ? "bad" : items.length ? "warnrow" : "ok";
      const mark = hasError ? "\u2715" : items.length ? "!" : "\u2713";
      return `<div class="lintrow ${cls}"><b>${mark}</b><span>${s}</span>` + (items.length ? `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : "<em>\u901A\u8FC7</em>") + "</div>";
    }).join("");
    document.getElementById("lintSummary").textContent = findings.length === 0 ? "\u5168\u90E8\u901A\u8FC7" : `${findings.filter((f) => f.level === "error").length} \u5904\u9519\u8BEF \xB7 ${findings.filter((f) => f.level === "warn").length} \u5904\u63D0\u793A`;
  }
  function detectFont(family) {
    const probe = "\u6C38\u548C\u4E5D\u5E74\u5C81\u5728\u7678\u4E11";
    const c = document.createElement("canvas").getContext("2d");
    c.font = `32px ${family}`;
    const a = c.measureText(probe).width;
    c.font = `32px monospace`;
    const b = c.measureText(probe).width;
    return Math.abs(a - b) > 0.5;
  }
  function renderFontProbe() {
    const el = document.getElementById("fontProbe");
    const kai = detectFont(TYPE_LAYERS.hand.font);
    const song = detectFont(TYPE_LAYERS.world.font);
    el.innerHTML = `
    <div class="${kai ? "ok" : "bad"}"><b>${kai ? "\u2713" : "\u2715"}</b><span>\u624B\u8FF9\u5B57\u4F53\uFF08\u6977\u4F53\uFF09\u53EF\u7528</span><em>${esc(TYPE_LAYERS.hand.font.split(",")[0])}</em></div>
    <div class="${song ? "ok" : "bad"}"><b>${song ? "\u2713" : "\u2715"}</b><span>\u4E16\u754C\uFF0F\u4ECA\u6309\u5B57\u4F53\uFF08\u5B8B\u4F53\uFF09\u53EF\u7528</span><em>${esc(TYPE_LAYERS.world.font.split(",")[0])}</em></div>`;
    if (!kai) {
      el.insertAdjacentHTML(
        "afterend",
        '<p class="alert">\u26A0\uFE0F \u8FD9\u53F0\u673A\u5668\u6CA1\u6709\u6977\u4F53\u56DE\u9000\uFF0C\u624B\u8FF9\u4F1A\u9000\u6210\u5B8B\u4F53\u2014\u2014\u300C\u5B57\u4F53\u8F74\u300D\u5931\u6548\uFF0C\u5206\u79BB\u53EA\u5269\u58A8\u8272\uFF0F\u5B57\u53F7\uFF0F\u8D77\u5370\uFF0F\u754C\u884C\uFF0F\u7EB8\u5E95\uFF0F\u65F6\u5E8F\u516D\u4E2A\u8F74\u3002\u4ECD\u9700\u80FD\u8FA8\u8BA4\uFF0C\u4F46\u4E0D\u662F\u6700\u4F73\u72B6\u6001\u3002</p>'
      );
    }
  }
  function bindSlider(id, key, fmt) {
    const input = document.getElementById(id);
    const out = document.getElementById(id + "Out");
    const sync = () => {
      out.textContent = fmt(Number(input.value));
    };
    input.value = String(state.timing[key]);
    sync();
    input.addEventListener("input", () => {
      state.timing[key] = Number(input.value);
      sync();
      if (state.timing.delayMs + state.timing.fadeMs < 1) state.timing.fadeMs = 1;
    });
  }
  bindSlider("delayRange", "delayMs", (v) => v === TUNING.annotationDelayMs ? `${v} ms\u3000\uFF08\uFF1D TUNING \u5F53\u524D\u503C\uFF09` : `${v} ms`);
  bindSlider("fadeRange", "fadeMs", (v) => `${v} ms`);
  bindSlider("stepsRange", "steps", (v) => `${v} \u7EA7`);
  document.getElementById("replayBtn").addEventListener("click", replay);
  document.getElementById("compareBtn").addEventListener("click", (e) => {
    state.compare = !state.compare;
    e.currentTarget.classList.toggle("on", state.compare);
    e.currentTarget.textContent = state.compare ? "\u5BF9\u7167\u6A21\u5F0F \xB7 \u5F00" : "\u5BF9\u7167\u6A21\u5F0F \xB7 \u5173";
  });
  document.getElementById("resetTimingBtn").addEventListener("click", () => {
    state.timing = { ...DEFAULT_TIMING };
    document.getElementById("delayRange").value = String(state.timing.delayMs);
    document.getElementById("fadeRange").value = String(state.timing.fadeMs);
    document.getElementById("stepsRange").value = String(state.timing.steps);
    ["delayRange", "fadeRange", "stepsRange"].forEach((id) => {
      const i = document.getElementById(id);
      i.dispatchEvent(new Event("input"));
    });
  });
  document.getElementById("tidyBtn").addEventListener("click", (e) => {
    const btn = e.currentTarget;
    btn.classList.toggle("on");
    document.body.classList.toggle("tidy", btn.classList.contains("on"));
  });
  function loop(now) {
    state.lastFrame = now;
    drawStage(now);
    const elapsed = now - state.actionAt;
    const alpha = annotationAlpha(state.actionAt, now, state.timing);
    const readout = document.getElementById("readout");
    readout.textContent = state.compare ? "\u5BF9\u7167\u6A21\u5F0F\uFF1A\u4E09\u5C42\u5747 alpha = 1.00" : `elapsed ${Math.round(elapsed)} ms\u3000\xB7\u3000\u4ECA\u6309 alpha = ${alpha.toFixed(2)}\u3000\xB7\u3000${alpha === 0 ? "\uFF08\u8FD8\u5728\u300C\u7A0D\u987F\u300D\u91CC\u2014\u2014\u8FD9\u6B63\u662F\u89C4\u683C 1 \u7684\u6267\u884C\uFF09" : alpha < 1 ? "\uFF08\u9636\u68AF\u6D6E\u73B0\u4E2D\uFF09" : "\uFF08\u5DF2\u7A33\u5B9A\uFF09"}`;
    requestAnimationFrame(loop);
  }
  renderDetail();
  renderLint();
  renderFontProbe();
  state.actionAt = performance.now();
  if (location.hash.startsWith("#show")) {
    state.actionAt = performance.now() - 1e6;
    const want = location.hash.slice(6);
    const at = ANNOTATIONS.findIndex((a) => a.id === want);
    if (at >= 0) {
      state.idx = at;
      Array.from(listEl.children).forEach((c, j) => c.classList.toggle("on", j === at));
      renderDetail();
    }
  }
  document.getElementById("sizesOut").textContent = `\u4E16\u754C ${TYPE_LAYERS.world.size}px \uFF0F \u624B\u8FF9 ${TYPE_LAYERS.hand.size}px \uFF0F \u4ECA\u6309 ${TYPE_LAYERS.annote.size}px`;
  document.getElementById("inksOut").textContent = `\u4E16\u754C ${TYPE_LAYERS.world.ink} \uFF0F \u624B\u8FF9 ${TYPE_LAYERS.hand.ink} \uFF0F \u4ECA\u6309 ${TYPE_LAYERS.annote.ink}`;
  requestAnimationFrame(loop);
})();

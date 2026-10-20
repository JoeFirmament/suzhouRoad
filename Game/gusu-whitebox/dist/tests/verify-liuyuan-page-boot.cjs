"use strict";

// scripts/verify-liuyuan-page-boot.ts
var import_node_fs = require("node:fs");
var import_node_vm = require("node:vm");

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

// scripts/verify-liuyuan-page-boot.ts
function assert(value, message) {
  if (!value) throw new Error(message);
}
var context2d = new Proxy({}, { get: (_, property) => property === "measureText" ? () => ({ width: 0 }) : () => void 0 });
function element() {
  return {
    hidden: false,
    checked: false,
    textContent: "",
    innerHTML: "",
    href: "",
    dataset: {},
    width: 960,
    height: 640,
    addEventListener() {
    },
    getContext: () => context2d,
    querySelector: () => element(),
    querySelectorAll: () => [],
    replaceChildren() {
    },
    append() {
    }
  };
}
var scenePages = [
  "liuyuan-entry",
  "liuyuan-court",
  "liuyuan-lvyin",
  "liuyuan-flower",
  "liuyuan-east-hall",
  "liuyuan-stone-forest",
  "liuyuan-study-court",
  "liuyuan-study-interior",
  "liuyuan-leaf-writing-study"
];
var forwardQueries = {
  "liuyuan-entry": "",
  "liuyuan-court": "?chapter=1",
  "liuyuan-lvyin": "?chapter=1",
  "liuyuan-flower": "?chapter=1",
  "liuyuan-east-hall": "?route=modern&from=flower",
  "liuyuan-stone-forest": "?route=modern&from=east-hall",
  "liuyuan-study-court": "?route=modern&from=stone-forest",
  "liuyuan-study-interior": "?route=modern&from=study-court",
  "liuyuan-leaf-writing-study": "?route=modern&from=study-interior"
};
var returnQueries = {
  "liuyuan-entry": "?route=modern&from=court&return=1",
  "liuyuan-court": "?route=modern&from=lvyin&return=1",
  "liuyuan-lvyin": "?route=modern&from=flower&return=1",
  "liuyuan-flower": "?route=modern&from=east-hall&return=1",
  "liuyuan-east-hall": "?route=modern&from=stone-forest&return=1",
  "liuyuan-stone-forest": "?route=modern&from=study-court&return=1",
  "liuyuan-study-court": "?route=modern&from=leaf&return=1"
};
function boot(page, search, flags) {
  const html = (0, import_node_fs.readFileSync)(`${page}.html`, "utf8");
  const script = html.match(/<script src="(dist\/[^"]+\.js)(?:\?[^"]+)?"/);
  assert(script, `${page} \u672A\u5F15\u7528\u6B63\u5F0F\u6253\u5305\u811A\u672C`);
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  const nodes = {};
  const document = {
    getElementById: (id) => {
      if (!ids.has(id)) return null;
      return nodes[id] ??= element();
    },
    createElement: () => element(),
    querySelectorAll: () => []
  };
  const progress = {
    version: 1,
    arts: { li: 0, yue: 0, she: 0, yu: 1, shu: 1, shuMath: 0 },
    gardens: {
      canglang: "open",
      wangshi: "locked",
      zhuozheng: "locked",
      shizilin: "locked",
      liuyuan: flags.includes("ly-unlocked") ? "complete" : "entered",
      ouyuan: "locked",
      yipu: "locked",
      huanxiu: "locked",
      tuisi: "locked"
    },
    completedTasks: [],
    knowledge: ["liuyuan-magnolia-slip"],
    storyFlags: flags,
    updatedAt: 1
  };
  const frames = [];
  class FakeImage {
    constructor() {
      this.complete = false;
      this.naturalWidth = 0;
      this.naturalHeight = 0;
      this.src = "";
    }
    addEventListener() {
    }
  }
  (0, import_node_vm.runInNewContext)((0, import_node_fs.readFileSync)(script[1], "utf8"), {
    document,
    window: { name: "", addEventListener() {
    } },
    location: { search, assign() {
    }, href: "" },
    localStorage: { getItem: (key) => key === "gusu-nine-gardens-rpg-v1" ? JSON.stringify(progress) : null },
    Image: FakeImage,
    URLSearchParams,
    structuredClone,
    requestAnimationFrame: (callback) => {
      frames.push(callback);
      return frames.length;
    }
  }, { filename: `${page}${search}` });
  frames.shift()?.(16);
  return nodes;
}
var throughLeaf = LIUYUAN_CHAPTER_FLAGS.slice(0, 13);
var carrying = LIUYUAN_CHAPTER_FLAGS.slice(0, 14);
for (const page of scenePages) {
  boot(page, "", []);
  boot(page, forwardQueries[page], throughLeaf);
  boot(page, `${forwardQueries[page]}${forwardQueries[page].includes("?") ? "&" : "?"}draft=1`, throughLeaf);
}
for (const [page, search] of Object.entries(returnQueries)) {
  boot(page, search, carrying);
  boot(page, `${search}&draft=1`, carrying);
}
for (const [page, button] of [
  ["liuyuan-court", "toEntryReturn"],
  ["liuyuan-lvyin", "toCourtReturn"],
  ["liuyuan-flower", "toLvyinReturn"],
  ["liuyuan-east-hall", "toFlowerReturn"],
  ["liuyuan-stone-forest", "toEastHallReturn"],
  ["liuyuan-study-court", "toStoneReturn"]
]) {
  const denied = boot(page, returnQueries[page], []);
  assert(denied[button]?.hidden, `${page} \u5355\u9760\u8FD4\u7A0B URL \u4E0D\u5F97\u663E\u793A\u8DE8\u5E55\u6309\u94AE`);
}
var deniedExit = boot("liuyuan-entry", returnQueries["liuyuan-entry"], []);
assert(deniedExit.chapterComplete?.hidden, "\u5355\u9760\u5165\u53E3\u8FD4\u7A0B URL \u4E0D\u5F97\u663E\u793A\u5B8C\u6210\u5361");
var finished = boot("liuyuan-entry", returnQueries["liuyuan-entry"], LIUYUAN_CHAPTER_FLAGS);
assert(
  finished.chapterComplete && !finished.chapterComplete.hidden,
  "\u5B8C\u6210\u5B58\u6863\u91CD\u8FDB\u8857\u9762\u65F6\uFF0C\u7AE0\u672B\u57CE\u56FE\uFF0F\u56ED\u8C31\u5165\u53E3\u5FC5\u987B\u663E\u793A"
);
console.log("\u7559\u56ED\u4E5D\u5E55\uFF1A\u72EC\u7ACB\u3001\u7AE0\u8282\u3001\u8FD4\u7A0B\u3001\u65E0\u8349\u7A3F\u56DE\u9000\u53CA\u5B8C\u6210\u6001\u9875\u9762\u542F\u52A8\u4E0E\u9996\u5E27\u901A\u8FC7\u3002");

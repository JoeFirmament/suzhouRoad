"use strict";
(() => {
  // src/core/progression.ts
  var SAVE_KEY = "gusu-nine-gardens-rpg-v1";
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
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return cloneDefault();
      const saved = JSON.parse(raw);
      const base = cloneDefault();
      return {
        ...base,
        ...saved,
        arts: { ...base.arts, ...saved.arts ?? {} },
        gardens: { ...base.gardens, ...saved.gardens ?? {} },
        completedTasks: Array.isArray(saved.completedTasks) ? saved.completedTasks : [],
        knowledge: Array.isArray(saved.knowledge) ? saved.knowledge : [],
        storyFlags: Array.isArray(saved.storyFlags) ? saved.storyFlags : [],
        updatedAt: typeof saved.updatedAt === "number" ? saved.updatedAt : 0
      };
    } catch {
      return cloneDefault();
    }
  }
  function hasStoryFlag(progress2, flag) {
    const alias = FLAG_ALIASES[flag];
    return progress2.storyFlags.includes(flag) || !!alias && progress2.storyFlags.includes(alias);
  }
  function markStoryFlag(flag) {
    const progress2 = loadProgress();
    if (!progress2.storyFlags.includes(flag)) {
      progress2.storyFlags.push(flag);
      saveProgress(progress2);
    }
    return progress2;
  }
  function saveProgress(progress2) {
    try {
      progress2.updatedAt = Date.now();
      localStorage.setItem(SAVE_KEY, JSON.stringify(progress2));
    } catch {
    }
  }
  function resetProgress() {
    const progress2 = cloneDefault();
    saveProgress(progress2);
    return progress2;
  }
  function hasStarted(progress2) {
    return progress2.updatedAt > 0 || progress2.completedTasks.length > 0 || progress2.storyFlags.length > 0;
  }

  // src/intro.ts
  var beats = [
    {
      scene: "arrival",
      place: "\u6E05\u672B \xB7 \u82CF\u5DDE\u57CE\u5357",
      speaker: "",
      title: "\uFF3B\u9694\u6C34\u4F20\u6765\u66F2\u7B1B\u4E0E\u7F13\u6162\u7684\u62CD\u677F\uFF3D",
      body: "\u6C34\u9762\u5148\u6709\u4E86\u58F0\u97F3\u3002",
      duration: 5200
    },
    {
      scene: "arrival",
      place: "\u57CE\u5357\u6C34\u8FB9 \xB7 \u6E05\u6668",
      speaker: "\u4F60",
      title: "\u66F2\u58F0\u5728\u6C34\u90A3\u8FB9\uFF0C\u53C8\u50CF\u4ECE\u524D\u9762\u7684\u5DF7\u5B50\u91CC\u6765\u3002",
      body: "\u77F3\u9762\u8FD8\u6E7F\u3002\u4F60\u5FAA\u7740\u58F0\u97F3\uFF0C\u8D70\u8FDB\u4E00\u6761\u4E0D\u719F\u6089\u7684\u8DEF\u3002",
      duration: 6500
    },
    {
      scene: "fork",
      place: "\u4E34\u6C34\u5C94\u8DEF",
      speaker: "\u964C\u751F\u5B66\u5B50",
      title: "\u201C\u518D\u5F80\u524D\uFF0C\u662F\u53BB\u542C\u66F2\uFF0C\u4E0D\u662F\u53BB\u5E9C\u5B66\u3002\u201D",
      body: "\u4ED6\u8D8A\u8FC7\u4F60\u4E24\u6B65\uFF0C\u770B\u89C1\u4F60\u8170\u95F4\u7684\u5E9C\u5B66\u540D\u5E16\uFF0C\u624D\u505C\u4E0B\u6765\u3002",
      duration: 7e3
    },
    {
      scene: "fork",
      place: "\u4E34\u6C34\u5C94\u8DEF",
      speaker: "\u964C\u751F\u5B66\u5B50",
      title: "\u201C\u5531\u5728\u6C34\u90A3\u8FB9\uFF0C\u58F0\u97F3\u5374\u7ED5\u5230\u8FD9\u91CC\u3002\u201D",
      body: "\u201C\u82CF\u5DDE\u7684\u8DEF\uFF0C\u4E0D\u80FD\u53EA\u62FF\u8033\u6735\u8BA4\u3002\u6211\u4E5F\u56DE\u5E9C\u5B66\u2014\u2014\u8DDF\u7D27\u4E9B\u3002\u201D",
      duration: 7500
    },
    {
      scene: "gate",
      place: "\u82CF\u5DDE\u5E9C\u5B66 \xB7 \u95E8\u524D",
      speaker: "\u964C\u751F\u5B66\u5B50",
      title: "\u201C\u5230\u4E86\u3002\u5148\u522B\u5FD9\u7740\u627E\u5148\u751F\u3002\u201D",
      body: "\u201C\u4F60\u8FDE\u4E66\u7BB1\u5F80\u54EA\u513F\u653E\u90FD\u4E0D\u77E5\u9053\u3002\u201D",
      duration: 6500
    },
    {
      scene: "gate",
      place: "\u82CF\u5DDE\u5E9C\u5B66 \xB7 \u95E8\u69DB",
      speaker: "\u964C\u751F\u5B66\u5B50",
      title: "\u201C\u8FDB\u6765\u3002\u201D",
      body: "\u6E05\u6668\u8FD8\u65E9\u3002\u4ECE\u653E\u4E0B\u4E66\u7BB1\u5F00\u59CB\u3002",
      duration: Infinity
    }
  ];
  var progress = loadProgress();
  var continueButton = document.getElementById("continueButton");
  var newGameButton = document.getElementById("newGameButton");
  var saveGlimpse = document.getElementById("saveGlimpse");
  var opening = document.getElementById("opening");
  var openingImage = document.getElementById("openingImage");
  var openingAnimation = document.getElementById("openingAnimation");
  var animationCtx = openingAnimation.getContext("2d", { alpha: true });
  var openingPlace = document.getElementById("openingPlace");
  var openingSpeaker = document.getElementById("openingSpeaker");
  var openingTitle = document.getElementById("openingTitle");
  var openingBody = document.getElementById("openingBody");
  var openingCount = document.getElementById("openingCount");
  var openingNext = document.getElementById("openingNext");
  var skipOpening = document.getElementById("skipOpening");
  var confirmLayer = document.getElementById("newGameConfirm");
  var cancelNewGame = document.getElementById("cancelNewGame");
  var confirmNewGame = document.getElementById("confirmNewGame");
  var beatIndex = 0;
  var sceneStartedAt = performance.now();
  var reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var playerSprite = new Image();
  playerSprite.src = "../assets/characters/scholar-player-sprites-v1.png";
  var shenSprite = new Image();
  shenSprite.src = "../assets/characters/shen-yanqiu-sprites-v1.png";
  var SPRITE_CELL = 362;
  var actorColors = {
    student: { robe: "#d8ceae", robeDark: "#7e796d", accent: "#8f271d" },
    shen: { robe: "#6fa89e", robeDark: "#2a514c", accent: "#c8a04b" },
    ajin: { robe: "#b0bfa8", robeDark: "#6b4c2f", accent: "#c8a04b" },
    teacher: { robe: "#7e796d", robeDark: "#2b2824", accent: "#a39d90" }
  };
  function pxRect(x, y, w, h, color) {
    animationCtx.fillStyle = color;
    animationCtx.fillRect(Math.round(x), Math.round(y), w, h);
  }
  function drawActor(x, y, colors, walking, time, facing = 1, carryingPaper = false) {
    const step = walking && !reducedMotion ? Math.floor(time / 170) % 2 : 0;
    const bob = walking && !reducedMotion ? step : 0;
    const dir = facing < 0 ? -1 : 1;
    const yy = Math.round(y - bob);
    pxRect(x - 8, yy + 1, 17, 3, "rgba(23,21,18,.38)");
    pxRect(x - 6, yy - 35, 13, 4, "#2b2824");
    pxRect(x - 8, yy - 31, 17, 4, "#171512");
    pxRect(x - 5, yy - 27, 11, 8, "#c8a47c");
    pxRect(x - 7, yy - 19, 15, 18, colors.robe);
    pxRect(x - 7, yy - 8, 15, 4, colors.accent);
    pxRect(x - 7, yy - 3, 15, 3, colors.robeDark);
    pxRect(x - 5 - step, yy, 4, 5, colors.robeDark);
    pxRect(x + 2 + step, yy, 4, 5, colors.robeDark);
    pxRect(x + dir * 7 - (dir < 0 ? 3 : 0), yy - 18 + step, 4, 11, "#b6906c");
    if (carryingPaper) {
      const paperX = x + dir * 11 - (dir < 0 ? 10 : 0);
      pxRect(paperX, yy - 18, 9, 7, "#f2ead6");
      pxRect(paperX + 1, yy - 16, 7, 1, "#a39d90");
    }
  }
  function drawStudent(x, y, walking, time, facing = "right") {
    if (!playerSprite.complete || playerSprite.naturalWidth === 0) {
      drawActor(x, y, actorColors.student, walking, time, facing === "left" ? -1 : 1, true);
      return;
    }
    const step = walking && !reducedMotion ? Math.floor(time / 170) % 2 : 0;
    const bob = walking && !reducedMotion ? step : 0;
    const row = { front: 0, left: 1, right: 2, back: 3 }[facing];
    const frame = walking ? step + 1 : 0;
    const yy = Math.round(y - bob);
    pxRect(x - 8, yy + 1, 17, 3, "rgba(23,21,18,.38)");
    animationCtx.drawImage(
      playerSprite,
      frame * SPRITE_CELL,
      row * SPRITE_CELL,
      SPRITE_CELL,
      SPRITE_CELL,
      Math.round(x - 18),
      Math.round(yy - 48),
      36,
      49
    );
  }
  function drawShen(x, y, walking, time, facing = "left") {
    if (!shenSprite.complete || shenSprite.naturalWidth === 0) {
      drawActor(x, y, actorColors.shen, walking, time, facing === "left" ? -1 : 1);
      return;
    }
    const step = walking && !reducedMotion ? Math.floor(time / 170) % 2 : 0;
    const bob = walking && !reducedMotion ? step : 0;
    const row = { front: 0, left: 1, right: 2, back: 3 }[facing];
    const frame = walking ? step + 1 : 0;
    const yy = Math.round(y - bob);
    pxRect(x - 8, yy + 1, 17, 3, "rgba(23,21,18,.38)");
    animationCtx.drawImage(
      shenSprite,
      frame * SPRITE_CELL,
      row * SPRITE_CELL,
      SPRITE_CELL,
      SPRITE_CELL,
      Math.round(x - 18),
      Math.round(yy - 48),
      36,
      49
    );
  }
  function drawOpeningAnimation(time) {
    animationCtx.clearRect(0, 0, openingAnimation.width, openingAnimation.height);
    animationCtx.imageSmoothingEnabled = false;
    if (opening.hidden) {
      requestAnimationFrame(drawOpeningAnimation);
      return;
    }
    let elapsed = time - sceneStartedAt;
    const beatDuration = reducedMotion ? Math.min(beats[beatIndex].duration, 2200) : beats[beatIndex].duration;
    if (elapsed >= beatDuration && beatIndex < beats.length - 1) {
      beatIndex += 1;
      renderOpening();
      elapsed = 0;
    }
    const walk = reducedMotion ? 1 : Math.min(elapsed / Math.max(3400, beats[beatIndex].duration - 1e3), 1);
    const bobTime = reducedMotion ? 0 : elapsed;
    if (beatIndex === 0) {
      if (elapsed > 1300) drawStudent(38 + walk * 52, 112, walk < 1, bobTime, "right");
      for (let i = 0; i < 5; i++) pxRect(24 + i * 26, 120 - i, 7, 1, "rgba(200,160,75,.32)");
    } else if (beatIndex === 1) {
      drawStudent(62 + walk * 126, 112, walk < 1, bobTime, "right");
    } else if (beatIndex === 2) {
      drawStudent(133, 112, false, bobTime, "right");
      drawShen(250 - walk * 70, 112, walk < 0.82, bobTime, "left");
    } else if (beatIndex === 3) {
      const leave = Math.max(0, (walk - 0.45) / 0.55);
      drawStudent(136 + leave * 54, 112, leave > 0, bobTime, "right");
      drawShen(181 + leave * 54, 112, leave > 0, bobTime, leave > 0 ? "right" : "left");
    } else if (beatIndex === 4) {
      drawShen(154 + walk * 54, 112, walk < 1, bobTime, "right");
      drawStudent(112 + walk * 54, 112, walk < 1, bobTime, "right");
    } else {
      drawStudent(178, 112, false, bobTime, "right");
      drawShen(221, 112, false, bobTime, "left");
    }
    requestAnimationFrame(drawOpeningAnimation);
  }
  function chapterLabel(data) {
    return data.completedTasks.includes("canglang-three-windows") ? "\u7AE0\u95F4 \xB7 \u65B0\u7684\u58A8\u75D5" : "\u7B2C\u4E00\u7AE0 \xB7 \u6C34\u5916\u6709\u56ED";
  }
  function continueTarget(data) {
    if (data.completedTasks.includes("canglang-three-windows")) return "home.html";
    if (!hasStoryFlag(data, "home-orientation-complete")) return "home.html?scene=arrival";
    if (hasStoryFlag(data, "fuxue-briefing-seen")) return "sucheng.html";
    return "home.html";
  }
  function renderSave(data) {
    const started = hasStarted(data);
    continueButton.disabled = !started;
    if (!started) return;
    const completedGardens = Object.values(data.gardens).filter((state) => state === "complete").length;
    const artsStarted = Object.values(data.arts).filter((value) => value > 0).length;
    saveGlimpse.innerHTML = `<p>\u672C\u5730\u6E38\u5386\u8BB0\u5F55</p><strong>${chapterLabel(data)}</strong><span>\u5DF2\u8BBF ${completedGardens} / 9 \u56ED\u3000\xB7\u3000\u516D\u827A\u521D\u4FEE ${artsStarted} / 6</span>`;
  }
  function renderOpening() {
    const beat = beats[beatIndex];
    sceneStartedAt = performance.now();
    openingImage.dataset.scene = beat.scene;
    openingPlace.textContent = beat.place;
    openingSpeaker.textContent = beat.speaker;
    openingTitle.textContent = beat.title;
    openingBody.textContent = beat.body;
    openingCount.textContent = beatIndex === beats.length - 1 ? "\u95E8\u69DB\u4E4B\u5185\uFF0C\u884C\u52A8\u7531\u4F60\u5F00\u59CB" : "";
    openingNext.hidden = beatIndex !== beats.length - 1;
    openingNext.textContent = "\u8DE8\u8FC7\u95E8\u69DB";
  }
  function startOpening() {
    beatIndex = 0;
    opening.hidden = false;
    renderOpening();
    openingNext.focus();
  }
  function finishOpening() {
    markStoryFlag("opening-arrival-seen");
    location.href = "home.html?scene=arrival";
  }
  continueButton.addEventListener("click", () => {
    if (!hasStoryFlag(progress, "opening-arrival-seen")) startOpening();
    else location.href = continueTarget(progress);
  });
  newGameButton.addEventListener("click", () => {
    if (hasStarted(progress)) {
      confirmLayer.hidden = false;
      cancelNewGame.focus();
    } else {
      resetProgress();
      startOpening();
    }
  });
  cancelNewGame.addEventListener("click", () => {
    confirmLayer.hidden = true;
    newGameButton.focus();
  });
  confirmNewGame.addEventListener("click", () => {
    resetProgress();
    confirmLayer.hidden = true;
    startOpening();
  });
  openingNext.addEventListener("click", () => {
    if (beatIndex === beats.length - 1) finishOpening();
  });
  skipOpening.addEventListener("click", finishOpening);
  addEventListener("keydown", (event) => {
    if (!opening.hidden && !openingNext.hidden && ["Enter", " "].includes(event.key)) {
      event.preventDefault();
      openingNext.click();
    }
  });
  renderSave(progress);
  if (new URLSearchParams(location.search).get("mode") === "opening") startOpening();
  requestAnimationFrame(drawOpeningAnimation);
})();

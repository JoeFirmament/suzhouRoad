/* ============================================================================
 * 主控 · 初始化各模块 + 九园卡片 + 全局联动 + 移动端导航
 * ========================================================================== */
(function () {
  const { GARDENS } = window.GARDEN_DATA;

  function buildCards() {
    const grid = document.getElementById("gardenGrid");
    grid.innerHTML = GARDENS.map((g, i) => `
      <div class="garden-card" data-id="${g.id}">
        <div class="gc-thumb">
          <span class="gc-num">${String(i + 1).padStart(2, "0")}</span>
          <span class="gc-year">世遗 ${g.unesco}</span>
        </div>
        <div class="gc-body">
          <h3>${g.name}</h3>
          <div class="gc-en">${g.nameEn}</div>
          <div class="gc-meta">${g.built} · ${g.district.split("苏州市")[1] || g.district}</div>
          <p class="gc-sum">${g.summary}</p>
        </div>
      </div>`).join("");

    grid.querySelectorAll(".garden-card").forEach(card => {
      card.addEventListener("click", () => {
        const id = card.dataset.id;
        highlightCard(id);
        window.GardenMap.selectGarden(id); // 触发地图飞行 + 弹窗，并联动历史
      });
    });
  }

  function highlightCard(id) {
    document.querySelectorAll(".garden-card").forEach(c =>
      c.classList.toggle("active", c.dataset.id === id));
  }

  // 地图标记点击 → 高亮卡片 + 历史聚焦
  window.GardenApp = {
    focusGarden(id) {
      highlightCard(id);
      if (window.GardenHistory) window.GardenHistory.focusGarden(id);
    },
  };

  function initNav() {
    const toggle = document.getElementById("navToggle");
    const nav = document.getElementById("topNav");
    toggle.addEventListener("click", () => nav.classList.toggle("open"));
    nav.querySelectorAll("a").forEach(a =>
      a.addEventListener("click", () => nav.classList.remove("open")));
  }

  document.addEventListener("DOMContentLoaded", () => {
    buildCards();
    initNav();
    window.GardenMap.init();
    window.GardenHistory.init();
    window.GardenNetwork.init();
    window.GardenWiki.init();
    window.GardenRAG.init();
  });
})();

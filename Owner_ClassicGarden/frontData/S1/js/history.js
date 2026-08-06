/* ============================================================================
 * 历史脉络 · 历代主人与园史时间轴
 * 按园林分组，每园按 owner 顺序排列；支持单园筛选与全局联动高亮。
 * ========================================================================== */
(function () {
  const { GARDENS } = window.GARDEN_DATA;
  let currentFilter = "all";

  function init() {
    const sel = document.getElementById("gardenFilter");
    GARDENS.forEach(g => {
      const o = document.createElement("option");
      o.value = g.id; o.textContent = g.name;
      sel.appendChild(o);
    });
    sel.addEventListener("change", e => {
      currentFilter = e.target.value;
      render();
    });
    render();
  }

  function render() {
    const wrap = document.getElementById("timeline");
    const list = currentFilter === "all" ? GARDENS : GARDENS.filter(g => g.id === currentFilter);
    wrap.innerHTML = list.map(g => `
      <div class="tl-group" data-g="${g.id}">
        <span class="tl-group-head">${g.name} · ${g.built}</span>
        ${g.owners.map(o => `
          <div class="tl-item">
            <div class="tl-period">${o.period}</div>
            <div class="tl-card">
              <span class="tl-name">${o.name}</span>
              <span class="tl-role">${o.role}</span>
              <p class="tl-note">${o.note}</p>
            </div>
          </div>`).join("")}
      </div>`).join("");
  }

  // 全局联动：地图/卡片选中某园时，时间轴聚焦该园
  function focusGarden(id) {
    const sel = document.getElementById("gardenFilter");
    if (sel.value !== id) { sel.value = id; currentFilter = id; render(); }
    const grp = document.querySelector(`.tl-group[data-g="${id}"]`);
    if (grp) grp.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  window.GardenHistory = { init, focusGarden };
})();

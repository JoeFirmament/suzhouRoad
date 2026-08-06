/* ============================================================================
 * 维基百科内容 · 摘要卡片 + 原文链接
 * ========================================================================== */
(function () {
  const { GARDENS } = window.GARDEN_DATA;

  function init() {
    const grid = document.getElementById("wikiGrid");
    grid.innerHTML = GARDENS.map(g => `
      <div class="wiki-card">
        <h3>${g.name}</h3>
        <div class="wc-en">${g.nameEn}</div>
        <p>${g.wikiSummary}</p>
        <a href="${g.wiki}" target="_blank" rel="noopener">阅读维基原文 →</a>
      </div>`).join("");
  }

  window.GardenWiki = { init };
})();

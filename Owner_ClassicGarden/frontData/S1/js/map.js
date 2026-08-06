/* ============================================================================
 * 地理信息 · Leaflet 地图
 * 以真实坐标标注九座园林，点击标记 / 列表可联动高亮。
 * ========================================================================== */
(function () {
  const { GARDENS } = window.GARDEN_DATA;
  let map, markers = {};

  function init() {
    // 苏州古城中心
    map = L.map("leafletMap", { scrollWheelZoom: false }).setView([31.30, 120.62], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18,
    }).addTo(map);

    GARDENS.forEach((g, i) => {
      const m = L.marker([g.lat, g.lng]).addTo(map);
      m.bindPopup(`
        <h4>${g.name} <span style="font-size:11px;color:#5b5249">${g.nameEn}</span></h4>
        <p><b>地址：</b>${g.district}</p>
        <p><b>创建：</b>${g.built}</p>
        <p><b>世遗：</b>${g.unesco} 年</p>
        <p><b>首任园主：</b>${g.owners[0].name}（${g.owners[0].role}）</p>
      `);
      m.on("click", () => selectGarden(g.id));
      markers[g.id] = m;
    });

    buildSideList();
    fitBounds();
  }

  function buildSideList() {
    const ul = document.getElementById("mapList");
    ul.innerHTML = GARDENS.map((g, i) => `
      <li data-id="${g.id}">
        <b>${String(i + 1).padStart(2, "0")} ${g.name}</b>
        <small>${g.district} · ${g.lat.toFixed(4)}, ${g.lng.toFixed(4)}</small>
      </li>`).join("");
    ul.querySelectorAll("li").forEach(li => {
      li.addEventListener("click", () => selectGarden(li.dataset.id));
    });
  }

  function fitBounds() {
    const b = L.latLngBounds(GARDENS.map(g => [g.lat, g.lng]));
    map.fitBounds(b.pad(0.2));
  }

  function selectGarden(id) {
    const g = GARDENS.find(x => x.id === id);
    if (!g) return;
    map.flyTo([g.lat, g.lng], 14, { duration: .8 });
    markers[id].openPopup();
    // 高亮侧栏
    document.querySelectorAll("#mapList li").forEach(li =>
      li.classList.toggle("active", li.dataset.id === id));
    // 同步其它模块
    if (window.GardenApp) window.GardenApp.focusGarden(id);
  }

  window.GardenMap = { init, selectGarden };
})();

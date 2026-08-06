/* ============================================================================
 * 人物关系图（CBDB 风格）· D3 力导向网络
 * 节点：人物(person) / 园林(garden)；边：亲属 / 委托营造 / 艺术合作 / 拥有居住
 * 数据可在 networkDataFromCBDB() 处替换为 CBDB API 返回的同构 JSON。
 * ========================================================================== */
(function () {
  const { GARDENS, PEOPLE, RELATIONS, RELATION_TYPES } = window.GARDEN_DATA;

  function buildGraph() {
    const nodes = [];
    PEOPLE.forEach(p => nodes.push({ id: p.id, label: p.name, type: "person", data: p }));
    GARDENS.forEach(g => nodes.push({ id: g.id, label: g.name, type: "garden", data: g }));

    const links = RELATIONS.map(r => ({
      source: r.source, target: r.target, type: r.type, label: r.label,
      color: RELATION_TYPES[r.type].color,
    }));

    // 度数（用于节点半径）
    const deg = {};
    links.forEach(l => { deg[l.source] = (deg[l.source] || 0) + 1; deg[l.target] = (deg[l.target] || 0) + 1; });
    nodes.forEach(n => n.degree = deg[n.id] || 1);
    return { nodes, links };
  }

  // ★ 接入真实 CBDB：把下面的静态数据换成 fetch('https://cbdb.fas.harvard.edu/...')
  //   返回 { nodes:[{id,label,type,data}], links:[{source,target,type,label}] } 即可。
  function networkDataFromCBDB() { return buildGraph(); }

  function init() {
    const { nodes, links } = networkDataFromCBDB();
    const container = document.getElementById("networkGraph");
    const W = container.clientWidth, H = container.clientHeight;

    const svg = d3.select("#networkGraph")
      .append("svg")
      .attr("width", W).attr("height", H)
      .attr("viewBox", [0, 0, W, H]);

    const sim = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(d => d.type === "ownership" ? 70 : 110).strength(.5))
      .force("charge", d3.forceManyBody().strength(-260))
      .force("center", d3.forceCenter(W / 2, H / 2))
      .force("collide", d3.forceCollide().radius(d => nodeR(d) + 6));

    const link = svg.append("g").attr("class", "links")
      .selectAll("line").data(links).join("line")
      .attr("class", "link").attr("stroke", d => d.color).attr("stroke-width", 1.6);

    const node = svg.append("g").attr("class", "nodes")
      .selectAll("g").data(nodes).join("g").attr("class", d => "node " + d.type);

    node.append("circle")
      .attr("r", d => nodeR(d))
      .on("mouseenter", (e, d) => showDetail(d))
      .on("click", (e, d) => showDetail(d, true))
      .call(drag(sim));

    node.append("text")
      .attr("x", d => nodeR(d) + 4)
      .attr("y", 4)
      .attr("font-size", d => d.type === "garden" ? 13 : 11)
      .attr("fill", d => d.type === "garden" ? "#8f2f22" : "#2b2622")
      .text(d => d.label);

    // 提示标签（悬停显示边关系）
    const tip = d3.select("body").append("div")
      .attr("class", "nd-tooltip")
      .style("position", "absolute").style("pointer-events", "none")
      .style("background", "#2b2622").style("color", "#f4efe4")
      .style("padding", "4px 9px").style("border-radius", "6px")
      .style("font-size", "12px").style("opacity", 0).style("z-index", 2000);

    link.on("mouseenter", (e, d) => {
        tip.style("opacity", 1).html(`${labelOf(d.source)} —${d.label}→ ${labelOf(d.target)}`);
      })
      .on("mousemove", e => tip.style("left", (e.pageX + 12) + "px").style("top", (e.pageY - 10) + "px"))
      .on("mouseleave", () => tip.style("opacity", 0));

    sim.on("tick", () => {
      link.attr("x1", d => d.source.x).attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    buildLegend();
  }

  function nodeR(d) {
    if (d.type === "garden") return 11;
    return 7 + Math.min(d.degree, 6) * 1.1;
  }
  function labelOf(n) { return n.label || n.id; }

  function buildLegend() {
    const el = document.getElementById("networkLegend");
    const relRows = Object.entries(RELATION_TYPES).map(([k, v]) =>
      `<div class="lg-row"><span class="lg-line" style="background:${v.color}"></span>${v.label}</div>`).join("");
    el.innerHTML = `
      <h4>关系类型</h4>${relRows}
      <h4 style="margin-top:12px">节点</h4>
      <div class="lg-row"><span class="lg-dot" style="background:#3f6f5a"></span>人物（园主 / 文人）</div>
      <div class="lg-row"><span class="lg-dot" style="background:#b5402f"></span>园林</div>`;
  }

  function showDetail(d, pinned) {
    const box = document.getElementById("nodeDetail");
    if (d.type === "person") {
      const p = d.data;
      const rels = RELATIONS.filter(r => r.source === d.id || r.target === d.id)
        .map(r => {
          const other = r.source === d.id ? r.target : r.source;
          const n = [...PEOPLE, ...GARDENS].find(x => x.id === other);
          const dir = r.source === d.id ? "→" : "←";
          return `<li>${RELATION_TYPES[r.type].label} ${dir} <b>${n ? n.name : other}</b>（${r.label}）</li>`;
        }).join("");
      box.innerHTML = `
        <div class="nd-tag" style="background:#3f6f5a;color:#fff">人物 · ${p.dynasty}</div>
        <div class="nd-title">${p.name}</div>
        <div class="nd-row">生卒：${p.life}</div>
        <div class="nd-row">身份：${p.role}</div>
        <div class="nd-row">${p.desc}</div>
        <div class="nd-rel"><b>关联关系</b><ul style="padding-left:0;margin:6px 0 0">${rels}</ul></div>`;
    } else {
      const g = d.data;
      box.innerHTML = `
        <div class="nd-tag" style="background:#b5402f;color:#fff">园林 · 世遗 ${g.unesco}</div>
        <div class="nd-title">${g.name}</div>
        <div class="nd-row">${g.nameEn}</div>
        <div class="nd-row">地址：${g.district}</div>
        <div class="nd-row">创建：${g.built}</div>
        <div class="nd-row">${g.summary}</div>
        <div class="nd-rel"><b>历代主人</b><ul style="padding-left:16px;margin:6px 0 0">${g.owners.map(o => `<li>${o.name}（${o.role}）</li>`).join("")}</ul></div>`;
    }
  }

  function drag(sim) {
    return d3.drag()
      .on("start", (e, d) => { if (!e.active) sim.alphaTarget(.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y; })
      .on("end", (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; });
  }

  window.GardenNetwork = { init };
})();

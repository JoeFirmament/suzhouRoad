/* ============================================================
 *  九园集 — 主交互逻辑
 *  地图 · 卡片 · 时间线 · CBDB关系网络 · 维基百科 · RAG问答
 * ============================================================ */

/* ============================================================
 *  RAG API 配置
 *  ── 接入您的 RAG 系统：将 RAG_API.url 改为您的检索接口地址，
 *     并按返回格式调整 fetchRAG() 函数。
 *     当前为离线演示模式，使用 RAG_KNOWLEDGE 本地知识库模拟检索。
 * ============================================================ */
const RAG_API = {
  enabled: false,                       // 设为 true 启用真实 API
  url: 'https://your-rag-endpoint/api/search',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  // 请求体构造：可根据您的接口调整
  buildBody: (query) => ({ query, top_k: 5 }),
  // 响应解析：将您的返回映射为 {title, source, author, content, tags, score}
  parseResponse: (data) => data.results || [],
};

// ---- 知识库与卡片场景辅助 ----
const SUGGESTIONS = [
  '借景手法有哪些', '戈裕良叠山', '拙政园历史', '网师园殿春簃',
  '花木配植寓意', '园林建筑类型', '世界遗产', '退思园贴水',
];

/* ---------- 工具函数 ---------- */
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const el = (tag, cls, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
};

/* ============================================================
 *  1. 导航
 * ============================================================ */
window.addEventListener('scroll', () => {
  const nav = $('#nav');
  if (window.scrollY > 30) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
});

/* ============================================================
 *  2. 地图 (Leaflet)
 * ============================================================ */
let map, markers = {};
const activeGarden = { id: null };

function initMap() {
  map = L.map('map', {
    center: [31.29, 120.63],
    zoom: 13,
    scrollWheelZoom: false,
    zoomControl: true,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(map);

  GARDENS.forEach((g, i) => {
    const icon = L.divIcon({
      className: '',
      html: `<div class="garden-marker" id="mk-${g.id}"><span>${i + 1}</span></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -28],
    });
    const m = L.marker([g.lat, g.lng], { icon }).addTo(map);
    m.bindPopup(`
      <div class="pp-name">${g.name}</div>
      <div class="pp-addr">${g.address}</div>
      <div class="pp-tag">${g.builtPeriod} · ${g.unescoYear}年列入世遗</div>
    `);
    m.on('click', () => selectGarden(g.id));
    markers[g.id] = m;
  });

  // 名录列表
  const list = $('#legend-list');
  GARDENS.forEach((g, i) => {
    const item = el('div', 'legend-item', `
      <div class="legend-dot"></div>
      <div class="legend-text">
        <div class="ln">${i + 1}. ${g.name} <span style="color:var(--ink-faded);font-weight:400;">${g.nameEn}</span></div>
        <div class="yr">${g.builtPeriod} · ${g.unescoYear}年申遗</div>
      </div>
    `);
    item.addEventListener('click', () => selectGarden(g.id, true));
    item.dataset.id = g.id;
    list.appendChild(item);
  });
}

function selectGarden(id, fly = false) {
  activeGarden.id = id;
  const g = GARDENS.find(x => x.id === id);
  if (!g) return;

  // 标记高亮
  $$('.garden-marker').forEach(m => m.classList.remove('active'));
  const mk = document.getElementById('mk-' + id);
  if (mk) mk.classList.add('active');

  // 列表高亮
  $$('.legend-item').forEach(li => li.classList.toggle('active', li.dataset.id === id));

  // 卡片高亮
  $$('.garden-card').forEach(c => c.classList.toggle('active', c.dataset.id === id));

  // 地图飞行 + 打开弹窗
  if (fly) map.flyTo([g.lat, g.lng], 15, { duration: 0.8 });
  setTimeout(() => markers[id] && markers[id].openPopup(), fly ? 400 : 0);

  // 时间线切换
  renderTimeline(id);
}

/* ============================================================
 *  3. 园林卡片
 * ============================================================ */
function renderGardenCards() {
  const grid = $('#garden-grid');
  GARDENS.forEach((g, i) => {
    const card = el('div', 'garden-card');
    card.dataset.id = g.id;
    card.innerHTML = `
      <div class="card-banner">
        <svg viewBox="0 0 340 130" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="p${i}" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M0 20 Q10 10 20 20 T40 20" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
            </pattern>
          </defs>
          <rect width="340" height="130" fill="#355c40"/>
          <rect width="340" height="130" fill="url(#p${i})"/>
          <g opacity="0.5">
            <path d="M0 100 Q85 70 170 90 T340 80 L340 130 L0 130 Z" fill="rgba(255,255,255,0.12)"/>
            <path d="M0 110 Q85 90 170 105 T340 95 L340 130 L0 130 Z" fill="rgba(255,255,255,0.08)"/>
          </g>
          <g stroke="rgba(255,255,255,0.3)" stroke-width="1" fill="none">
            <rect x="20" y="25" width="20" height="30"/>
            <polygon points="30,20 18,25 42,25"/>
            <rect x="300" y="30" width="22" height="28"/>
            <polygon points="311,22 296,30 326,30"/>
          </g>
        </svg>
        <div class="card-name-bg">${g.name}</div>
      </div>
      <div class="card-body">
        <h3>${g.name} <span class="en">${g.nameEn}</span></h3>
        <div class="card-meta">
          <span class="card-tag unesco">世遗 ${g.unescoYear}</span>
          <span class="card-tag dynasty">${g.builtPeriod}</span>
          <span class="card-tag">${g.area}</span>
        </div>
        <p class="card-feature">${g.feature}</p>
        <div class="card-foot">
          <span>${g.owners.length} 位主人</span>
          <span class="more">查看详情 →</span>
        </div>
      </div>
    `;
    card.addEventListener('click', () => {
      selectGarden(g.id, true);
      $('#timeline-section').scrollIntoView({ behavior: 'smooth' });
    });
    grid.appendChild(card);
  });
}

/* ============================================================
 *  4. 时间线
 * ============================================================ */
let tlCurrentId = 'canglang';

function initTimelineControls() {
  const ctrl = $('#tl-controls');
  GARDENS.forEach((g, i) => {
    const b = el('button', 'tl-btn', `${i + 1}. ${g.name}`);
    if (g.id === tlCurrentId) b.classList.add('active');
    b.addEventListener('click', () => {
      tlCurrentId = g.id;
      $$('.tl-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      renderTimeline(g.id);
    });
    ctrl.appendChild(b);
  });
}

function renderTimeline(gardenId) {
  const g = GARDENS.find(x => x.id === gardenId);
  if (!g) return;
  tlCurrentId = gardenId;

  // 同步按钮高亮
  $$('.tl-btn').forEach((b, i) => b.classList.toggle('active', GARDENS[i].id === gardenId));

  const track = $('#timeline-track');
  track.innerHTML = '';

  // 合并历史事件与主人更迭
  const events = g.timeline.map(t => ({ ...t, type: 'event' }));
  // 主人也加入时间线（取 owners 中 period 起始年近似）
  g.owners.forEach(o => {
    const yr = parseInt(o.period.match(/\d{3,4}/));
    if (yr && !events.some(e => e.year === yr)) {
      events.push({ year: yr, event: `${o.name}（${o.role}）`, type: 'owner', note: o.note });
    }
  });
  events.sort((a, b) => a.year - b.year);

  const minYear = Math.min(...events.map(e => e.year));
  const maxYear = Math.max(...events.map(e => e.year));
  const range = maxYear - minYear || 1;
  const trackWidth = Math.max(events.length * 160, 800);

  // 轴
  const axis = el('div', 'timeline-axis');
  axis.style.right = '3rem';
  track.appendChild(axis);

  events.forEach((e, i) => {
    const pct = ((e.year - minYear) / range) * (trackWidth - 120) + 60;
    const ev = el('div', 'tl-event ' + (i % 2 === 0 ? 'above' : 'below'));
    if (e.type === 'owner') ev.classList.add('owner');
    ev.style.left = pct + 'px';
    const noteText = e.note ? `<br><span style="color:var(--ink-faded);font-size:0.74rem;">${e.note}</span>` : '';
    ev.innerHTML = `
      <div class="dot"></div>
      <div class="year">${e.year}</div>
      <div class="desc">${e.event}${noteText}</div>
    `;
    track.appendChild(ev);
  });

  track.style.width = trackWidth + 'px';
}

/* ============================================================
 *  5. CBDB 人物关系网络 (vis-network)
 * ============================================================ */
let network, nodesDS, edgesDS;
const dynastyColors = {
  song:   '#9e3b3b',
  yuan:   '#b08d57',
  ming:   '#4a7c59',
  qing:   '#355c40',
  modern: '#c9a872',
};
const dynastyLabels = {
  song: '宋代', yuan: '元代', ming: '明代', qing: '清代', modern: '近现代',
};
const activeDynasties = new Set(Object.keys(dynastyColors));

function initNetwork() {
  // 筛选按钮
  const filters = $('#network-filters');
  Object.entries(dynastyLabels).forEach(([key, label]) => {
    const b = el('div', 'nf-btn active');
    b.innerHTML = `<span class="nf-dot" style="background:${dynastyColors[key]}"></span> ${label}`;
    b.dataset.dynasty = key;
    b.addEventListener('click', () => {
      if (activeDynasties.has(key)) {
        activeDynasties.delete(key);
        b.classList.remove('active');
      } else {
        activeDynasties.add(key);
        b.classList.add('active');
      }
      updateNetwork();
    });
    filters.appendChild(b);
  });

  const nodes = PERSONS.map(p => ({
    id: p.id,
    label: p.name,
    title: `<b>${p.name}</b>（${p.dates}）<br>${p.dynasty}代 · ${p.role}<br>关联园林：${p.garden}`,
    group: p.group,
    garden: p.garden,
  }));
  const edges = RELATIONS.map((r, i) => ({
    id: 'e' + i,
    from: r.from,
    to: r.to,
    label: r.type,
    title: r.note,
    font: { size: 10, color: '#8a7f70', background: 'rgba(246,241,230,0.9)', strokeWidth: 2, strokeWidthSelected: 2 },
    color: { color: '#ddd3bf', highlight: '#9e3b3b', hover: '#4a7c59' },
    width: 1.5,
    smooth: { type: 'curvedCW', roundness: 0.15 },
  }));

  nodesDS = new vis.DataSet(nodes);
  edgesDS = new vis.DataSet(edges);

  const container = $('#network');
  const data = { nodes: nodesDS, edges: edgesDS };
  const options = {
    nodes: {
      shape: 'dot',
      size: 18,
      font: { size: 14, face: 'Noto Serif SC', color: '#2b2620', multi: false },
      borderWidth: 2,
      shadow: { enabled: true, color: 'rgba(43,38,32,0.15)', size: 6, x: 0, y: 2 },
    },
    edges: {
      arrows: { to: { enabled: false } },
      smooth: true,
    },
    groups: {
      song:   { color: { background: '#fff', border: dynastyColors.song }, font: { color: dynastyColors.song } },
      yuan:   { color: { background: '#fff', border: dynastyColors.yuan }, font: { color: dynastyColors.yuan } },
      ming:   { color: { background: '#fff', border: dynastyColors.ming }, font: { color: dynastyColors.ming } },
      qing:   { color: { background: '#fff', border: dynastyColors.qing }, font: { color: dynastyColors.qing } },
      modern: { color: { background: '#fff', border: dynastyColors.modern }, font: { color: dynastyColors.modern } },
    },
    physics: {
      enabled: true,
      barnesHut: {
        gravitationalConstant: -8000,
        centralGravity: 0.3,
        springLength: 130,
        springConstant: 0.04,
        damping: 0.4,
        avoidOverlap: 0.3,
      },
      stabilization: { iterations: 200 },
    },
    interaction: {
      hover: true,
      tooltipDelay: 150,
      navigationButtons: false,
      keyboard: false,
    },
  };

  network = new vis.Network(container, data, options);

  network.on('click', (params) => {
    if (params.nodes.length > 0) {
      showPersonDetail(params.nodes[0]);
    } else {
      $('#person-detail').innerHTML = '<p class="pd-empty">点击网络中的节点，查看人物传记信息。</p>';
    }
  });
}

function updateNetwork() {
  const visibleNodeIds = new Set(
    PERSONS.filter(p => activeDynasties.has(p.group)).map(p => p.id)
  );
  nodesDS.forEach(n => {
    try { nodesDS.update({ id: n.id, hidden: !visibleNodeIds.has(n.id) }); } catch (e) {}
  });
  edgesDS.forEach(e => {
    const fromVisible = visibleNodeIds.has(e.from);
    const toVisible = visibleNodeIds.has(e.to);
    try { edgesDS.update({ id: e.id, hidden: !(fromVisible && toVisible) }); } catch (err) {}
  });
}

function showPersonDetail(personId) {
  const p = PERSONS.find(x => x.id === personId);
  if (!p) return;
  const rels = RELATIONS.filter(r => r.from === p.id || r.to === p.id);
  const relHtml = rels.map(r => {
    const otherId = r.from === p.id ? r.to : r.from;
    const other = PERSONS.find(x => x.id === otherId);
    const dir = r.from === p.id ? '→' : '←';
    return `<div>· ${dir} <b>${other ? other.name : '?'}</b>（${r.type}）${r.note ? '：' + r.note : ''}</div>`;
  }).join('');

  $('#person-detail').innerHTML = `
    <div class="pd-name">${p.name}</div>
    <div class="pd-row"><b>生卒：</b>${p.dates}</div>
    <div class="pd-row"><b>朝代：</b>${p.dynasty}代</div>
    <div class="pd-row"><b>关联园林：</b>${p.garden}</div>
    <div class="pd-row"><b>身份：</b>${p.role}</div>
    <div class="pd-row"><b>CBDB：</b>${p.cbdb}</div>
    ${rels.length ? `<div class="pd-row" style="margin-top:0.6rem;padding-top:0.6rem;border-top:1px dashed var(--border);"><b>关系（${rels.length}）：</b>${relHtml}</div>` : ''}
  `;
}

/* ============================================================
 *  6. 维基百科
 * ============================================================ */
let wikiCurrentId = null;

function initWikiList() {
  const list = $('#wiki-list');
  GARDENS.forEach((g, i) => {
    const item = el('div', 'wiki-item');
    item.dataset.id = g.id;
    item.innerHTML = `
      <div>
        <div class="wn">${i + 1}. ${g.name}</div>
        <div class="we">${g.nameEn}</div>
      </div>
    `;
    item.addEventListener('click', () => loadWiki(g.id));
    list.appendChild(item);
  });
  // 默认加载第一个
  loadWiki(GARDENS[1].id); // 拙政园
}

async function loadWiki(gardenId) {
  const g = GARDENS.find(x => x.id === gardenId);
  if (!g) return;
  wikiCurrentId = gardenId;

  $$('.wiki-item').forEach(it => it.classList.toggle('active', it.dataset.id === gardenId));
  const content = $('#wiki-content');
  content.innerHTML = `
    <div class="wiki-loading">
      <div class="spinner"></div>
      <p>正在从 Wikipedia 获取 ${g.name} 条目……</p>
    </div>
  `;

  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${g.wikiTitle}?redirect=true`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Network');
    const data = await res.json();

    let extract = data.extract || '暂无摘要内容。';
    // 高亮关键词
    extract = extract.replace(/(Suzhou|UNESCO|World Heritage|garden|classical)/gi, '<b style="color:var(--jade-deep)">$1</b>');

    content.innerHTML = `
      <h3>${g.name} <span style="font-size:0.9rem;color:var(--ink-faded);">${g.nameEn}</span></h3>
      <div class="wiki-en-title">${data.description || g.namePinyin} · Wikipedia Article</div>
      ${data.originalimage ? `<img src="${data.originalimage.source}" alt="${g.name}" style="width:100%;max-height:260px;object-fit:cover;border-radius:8px;margin:1rem 0;border:1px solid var(--border-soft);"/>` : ''}
      <div class="wiki-text"><p>${extract}</p></div>
      <div class="wiki-foot">
        <span>来源：English Wikipedia REST API</span>
        <a class="wiki-link-ext" href="${data.content_urls ? data.content_urls.desktop.page : 'https://en.wikipedia.org/wiki/' + g.wikiTitle}" target="_blank" rel="noopener">
          阅读完整条目 ↗
        </a>
      </div>
    `;
  } catch (err) {
    // 回退：显示内置描述
    content.innerHTML = `
      <h3>${g.name} <span style="font-size:0.9rem;color:var(--ink-faded);">${g.nameEn}</span></h3>
      <div class="wiki-en-title">${g.namePinyin} · 内置资料（在线获取失败）</div>
      <div class="wiki-text"><p>${g.desc}</p></div>
      <div class="wiki-foot">
        <span>数据来源：本地内置</span>
        <a class="wiki-link-ext" href="https://en.wikipedia.org/wiki/${g.wikiTitle}" target="_blank" rel="noopener">
          前往 Wikipedia 查看 ↗
        </a>
      </div>
    `;
  }
}

/* ============================================================
 *  7. RAG 知识问答
 * ============================================================ */
function initRAG() {
  // 建议词
  const chips = $('#rag-chips');
  SUGGESTIONS.forEach(s => {
    const c = el('div', 'rag-chip', s);
    c.addEventListener('click', () => {
      $('#rag-input').value = s;
      doRAGSearch(s);
    });
    chips.appendChild(c);
  });

  // 发送
  $('#rag-send').addEventListener('click', () => {
    const q = $('#rag-input').value.trim();
    if (q) doRAGSearch(q);
  });
  $('#rag-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const q = $('#rag-input').value.trim();
      if (q) doRAGSearch(q);
    }
  });
}

async function doRAGSearch(query) {
  const results = $('#rag-results');
  results.innerHTML = `
    <div class="rag-thinking">
      <div class="dots"><span></span><span></span><span></span></div>
      <span>正在检索知识库「${query}」……</span>
    </div>
  `;

  let hits = [];

  if (RAG_API.enabled) {
    // ── 真实 API 模式 ──
    try {
      const res = await fetch(RAG_API.url, {
        method: RAG_API.method,
        headers: RAG_API.headers,
        body: JSON.stringify(RAG_API.buildBody(query)),
      });
      const data = await res.json();
      hits = RAG_API.parseResponse(data);
    } catch (err) {
      results.innerHTML = `<div class="rag-empty"><p>⚠️ RAG API 请求失败：${err.message}</p><p style="font-size:0.82rem;">请检查 app.js 中 RAG_API 配置。</p></div>`;
      return;
    }
  } else {
    // ── 离线演示模式：本地知识库模拟检索 ──
    await new Promise(r => setTimeout(r, 700)); // 模拟延迟
    hits = searchLocalKB(query);
  }

  if (hits.length === 0) {
    results.innerHTML = `
      <div class="rag-empty">
        <p>未找到与「${query}」直接相关的内容。</p>
        <p style="font-size:0.82rem;margin-top:0.5rem;">试试：借景、叠石、理水、拙政园、网师园、花木、建筑等关键词。</p>
      </div>
    `;
    return;
  }

  results.innerHTML = `<div style="font-size:0.85rem;color:var(--ink-faded);margin-bottom:0.8rem;">检索到 ${hits.length} 条相关知识：</div>`;
  hits.forEach((h, i) => {
    const scorePct = Math.round((h.score || 0) * 100);
    // 关键词高亮
    let content = h.content;
    const terms = query.match(/[\u4e00-\u9fa5]+|\w+/g) || [];
    terms.forEach(term => {
      if (term.length >= 2) {
        content = content.replace(new RegExp(escapeReg(term), 'gi'), (m) => `<mark>${m}</mark>`);
      }
    });
    const r = el('div', 'rag-result');
    r.style.animationDelay = (i * 0.08) + 's';
    r.innerHTML = `
      <div class="rr-title">${h.title}</div>
      <div class="rr-source">
        <span class="src-tag">来源</span>
        ${h.source}${h.author ? ' · ' + h.author : ''}
      </div>
      <div class="rr-content">${content}</div>
      ${h.tags ? `<div class="rr-tags">${h.tags.map(t => `<span>#${t}</span>`).join('')}</div>` : ''}
      <div class="rr-score">
        相关度
        <div class="rag-bar"><div class="rag-bar-fill" style="width:${scorePct}%"></div></div>
        ${scorePct}%
      </div>
    `;
    results.appendChild(r);
  });
}

function searchLocalKB(query) {
  const q = query.toLowerCase();
  const scored = RAG_KNOWLEDGE.map(item => {
    let score = 0;
    // 关键词匹配
    item.keywords.forEach(kw => {
      if (q.includes(kw.toLowerCase()) || kw.toLowerCase().includes(q)) {
        score += kw.length >= 3 ? 0.4 : 0.25;
      }
    });
    // 标题匹配
    if (item.title.toLowerCase().includes(q)) score += 0.3;
    // 标签匹配
    item.tags.forEach(tg => {
      if (q.includes(tg.toLowerCase())) score += 0.2;
    });
    // 内容包含
    if (item.content.toLowerCase().includes(q)) score += 0.1;
    return { ...item, score: Math.min(score, 1) };
  }).filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  return scored;
}

function escapeReg(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* ============================================================
 *  8. 初始化
 * ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  renderGardenCards();
  initTimelineControls();
  renderTimeline(tlCurrentId);
  initNetwork();
  initWikiList();
  initRAG();
});

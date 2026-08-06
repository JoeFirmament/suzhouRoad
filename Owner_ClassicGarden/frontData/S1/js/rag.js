/* ============================================================================
 * 园林知识库 · RAG 检索界面
 *
 * ★ 接入您蒸馏园林书籍后部署的 RAG 系统：
 *   修改下方 RAG_CONFIG.endpoint 为您的服务地址即可。
 *   - 若服务为 OpenAI 风格 chat/completions：返回 {choices:[{message:{content}}]}
 *   - 若为简单 query→text：返回 {answer} / {text} / 纯文本 均可识别
 *   未配置 endpoint 时，使用内置离线知识库演示交互。
 * ========================================================================== */
(function () {
  const { RAG_KNOWLEDGE } = window.GARDEN_DATA;

  const RAG_CONFIG = {
    endpoint: "",          // ← 填入您的 RAG 后端 URL，例如 "https://your-rag.example.com/api/query"
    method: "POST",        // 请求方法
    mode: "auto",          // "auto" | "remote" | "local"
    headers: { "Content-Type": "application/json" },
    // 自定义请求体构造（可选）；默认发送 { query }
    buildBody: (q) => ({ query: q, prompt: q }),
    // 自定义响应解析（可选）；默认自适应多种结构
    parseResponse: (data) => {
      if (data?.choices?.[0]?.message?.content) return data.choices[0].message.content;
      if (typeof data?.answer === "string") return data.answer;
      if (typeof data?.text === "string") return data.text;
      if (typeof data?.result === "string") return data.result;
      if (typeof data === "string") return data;
      return null;
    },
  };

  function init() {
    const form = document.getElementById("ragForm");
    const input = document.getElementById("ragInput");
    const sendBtn = document.getElementById("ragSend");
    const status = document.getElementById("ragStatus");

    // 快速提问
    const sugg = document.getElementById("ragSuggestions");
    const samples = ["戈裕良的叠山有什么特点？", "借景手法在沧浪亭如何体现？", "耦园与夫妻唱和", "退思园为何贴水而建？", "九座园林何时列入世遗？"];
    sugg.innerHTML = samples.map(s => `<button type="button">${s}</button>`).join("");
    sugg.querySelectorAll("button").forEach(b =>
      b.addEventListener("click", () => { input.value = b.textContent; form.requestSubmit(); }));

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const q = input.value.trim();
      if (!q) return;
      addMsg(q, "user");
      input.value = "";
      sendBtn.disabled = true;

      const placeholder = addMsg("检索中…", "bot", true);
      try {
        const answer = await query(q);
        placeholder.querySelector(".msg-bubble").innerHTML =
          escapeHtml(answer).replace(/\n/g, "<br>") + `<span class="src">来源：园林知识库（RAG）</span>`;
      } catch (err) {
        placeholder.querySelector(".msg-bubble").textContent = "检索失败：" + err.message;
      } finally {
        sendBtn.disabled = false;
      }
    });

    // 状态提示：当前模式
    if (RAG_CONFIG.endpoint && RAG_CONFIG.mode !== "local") {
      status.innerHTML = `已连接远程 RAG 后端：<code>${RAG_CONFIG.endpoint}</code>`;
    } else {
      status.innerHTML = `当前为 <b>离线演示模式</b>：使用内置知识库。配置 <code>RAG_CONFIG.endpoint</code> 可接入您的系统。`;
    }
  }

  async function query(q) {
    const useRemote = RAG_CONFIG.endpoint && RAG_CONFIG.mode !== "local";
    if (useRemote) {
      try {
        const resp = await fetch(RAG_CONFIG.endpoint, {
          method: RAG_CONFIG.method,
          headers: RAG_CONFIG.headers,
          body: JSON.stringify(RAG_CONFIG.buildBody(q)),
        });
        const data = await resp.json().catch(() => resp.text());
        const text = RAG_CONFIG.parseResponse(data);
        if (text) return text;
        throw new Error("后端返回格式无法解析");
      } catch (e) {
        // 远程失败时优雅降级到本地
        const local = localAnswer(q);
        return local + "\n\n（注：远程 RAG 调用失败，已回退至离线演示知识库）";
      }
    }
    // 本地演示：模拟轻微延迟
    await new Promise(r => setTimeout(r, 350));
    return localAnswer(q);
  }

  function localAnswer(q) {
    const ql = q.toLowerCase();
    let best = null, bestScore = 0;
    for (const item of RAG_KNOWLEDGE) {
      let score = 0;
      for (const k of item.kw) {
        if (ql.includes(k.toLowerCase())) score += k.length; // 长词命中权重更高
      }
      if (score > bestScore) { bestScore = score; best = item; }
    }
    if (best) return best.answer;
    return "抱歉，离线演示知识库中暂无与「" + q + "」直接匹配的内容。\n\n可尝试关键词：叠山 / 借景 / 理水 / 文人园林 / 耦园 / 狮子林 / 世界遗产 / CBDB 等；或接入您部署的 RAG 后端以获得完整典籍检索能力。";
  }

  function addMsg(text, who, pending) {
    const wrap = document.getElementById("ragMessages");
    const div = document.createElement("div");
    div.className = "msg " + who;
    const bubble = document.createElement("div");
    bubble.className = "msg-bubble";
    bubble.textContent = text;
    div.appendChild(bubble);
    wrap.appendChild(div);
    wrap.scrollTop = wrap.scrollHeight;
    return div;
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  window.GardenRAG = { init };
})();

/* Bảng Tin — đọc data/news.json + data/market.json, render 5 section.
   Mỗi file fetch độc lập: một file hỏng không kéo sập phần còn lại. */

(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const num = (n, opts) =>
    n == null || isNaN(n) ? "?" : Number(n).toLocaleString("vi-VN", opts);

  const vnd = (n) => num(n, { maximumFractionDigits: 0 });

  const pct = (n) => {
    if (n == null || isNaN(n)) return "?";
    const v = Number(n);
    return (v > 0 ? "+" : "") + v.toLocaleString("vi-VN", { maximumFractionDigits: 2 }) + "%";
  };

  const trendCls = (n) => (n > 0 ? "up" : n < 0 ? "down" : "flat");

  const signed = (n) => (n > 0 ? "+" : "") + vnd(n);

  // ---------- fetch ----------

  async function loadJSON(path) {
    const res = await fetch(`${path}?v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  function sectionError(ids, msg) {
    for (const id of ids) {
      const el = $(id);
      if (el) el.innerHTML = `<div class="section-error">${esc(msg)}</div>`;
    }
  }

  // ---------- staleness ----------

  const HOUR = 3600 * 1000;

  function hoursSince(iso) {
    const t = Date.parse(iso);
    return isNaN(t) ? null : (Date.now() - t) / HOUR;
  }

  // Ngày giao dịch gần nhất đã đóng cửa (VN, T2-T6, sau 16h).
  function lastTradingDate() {
    const vn = new Date(Date.now() + 7 * HOUR); // đọc các trường UTC như giờ VN
    let d = new Date(vn);
    const wd = d.getUTCDay();
    if (wd === 0 || wd === 6 || d.getUTCHours() < 16) {
      do {
        d = new Date(d.getTime() - 24 * HOUR);
      } while (d.getUTCDay() === 0 || d.getUTCDay() === 6);
    }
    return d.toISOString().slice(0, 10);
  }

  // ---------- header ----------

  function renderToday() {
    $("#today").textContent = new Intl.DateTimeFormat("vi-VN", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(new Date());
  }

  function addBadge(html, cls = "") {
    $("#update-badges").insertAdjacentHTML("beforeend", `<span class="badge ${cls}">${html}</span>`);
  }

  // ---------- finance ----------

  const ACTION_CLS = {
    "GIỮ": "hold",
    "MUA THÊM": "buy",
    "CHỐT LỜI MỘT PHẦN": "watch",
    "THEO DÕI SÁT": "watch",
    "CẮT LỖ": "sell",
  };

  function rangeBar(h) {
    if (!h.stoploss || !h.target || !h.price) return "";
    const lo = h.stoploss, hi = h.target;
    const pos = (v) => Math.min(98, Math.max(2, ((v - lo) / (hi - lo)) * 100));
    return `
      <div class="range">
        <div class="range-track">
          <span class="range-cost" style="left:${pos(h.avg_cost)}%" title="Giá vốn ${vnd(h.avg_cost)}"></span>
          <span class="range-marker" style="left:${pos(h.price)}%"></span>
        </div>
        <div class="range-labels">
          <span>Cắt lỗ <span class="num">${vnd(lo)}</span></span>
          <span>Mục tiêu <span class="num">${vnd(hi)}</span></span>
        </div>
      </div>`;
  }

  function holdingCard(h) {
    const cls = ACTION_CLS[h.action] || "hold";
    return `
      <article class="card">
        <div class="holding-head">
          <span class="ticker">${esc(h.ticker)}<small>${vnd(h.qty)} cp · vốn ${vnd(h.avg_cost)}</small></span>
          <span class="chip ${cls}">${esc(h.action || "")}</span>
        </div>
        <div class="holding-nums">
          <span class="stat"><span class="label">Giá</span>
            <span class="value num">${vnd(h.price)} <small class="${trendCls(h.change_pct)}">${pct(h.change_pct)}</small></span></span>
          <span class="stat"><span class="label">Giá trị</span>
            <span class="value num">${vnd(h.value)}</span></span>
          <span class="stat"><span class="label">Lãi/lỗ</span>
            <span class="value num ${trendCls(h.pnl)}">${signed(h.pnl)} (${pct(h.pnl_pct)})</span></span>
        </div>
        ${rangeBar(h)}
        ${h.comment ? `<p class="holding-comment">${esc(h.comment)}</p>` : ""}
      </article>`;
  }

  function renderMarket(m) {
    const vni = m.vnindex || {};
    const t = m.totals || {};

    const strip = `
      <div class="market-strip">
        <div class="card stat">
          <span class="label">VN-Index · phiên ${esc(m.session_date || "?")}</span>
          <span class="value num">${num(vni.close, { maximumFractionDigits: 2 })}</span>
          <span class="sub num ${trendCls(vni.change)}">${signed(vni.change)} (${pct(vni.change_pct)})</span>
        </div>
        <div class="card stat">
          <span class="label">Tổng danh mục</span>
          <span class="value num">${vnd(t.value)}</span>
          <span class="sub num">vốn ${vnd(t.cost)}</span>
        </div>
        <div class="card stat">
          <span class="label">Lãi/lỗ</span>
          <span class="value num ${trendCls(t.pnl)}">${signed(t.pnl)}</span>
          <span class="sub num ${trendCls(t.pnl)}">${pct(t.pnl_pct)}</span>
        </div>
        ${vni.note ? `<div class="card span-note"><p class="vnindex-note">${esc(vni.note)}</p></div>` : ""}
      </div>`;

    const holdings = `
      <div class="holdings-grid">
        ${(m.holdings || []).map(holdingCard).join("")}
      </div>`;

    const adv = m.advice || {};
    const advice = `
      <div class="card advice">
        <h3>Lời khuyên hôm nay</h3>
        <p class="summary">${esc(adv.summary || "")}</p>
        <ul>${(adv.actions || []).map((a) => `<li>${esc(a)}</li>`).join("")}</ul>
        <p class="disclaimer">${esc(adv.disclaimer || "")}</p>
      </div>`;

    const watch = `
      <div class="watch-grid">
        <div class="card">
          <h3 class="card-title">Watchlist</h3>
          ${(m.watchlist || []).map((w) => `
            <div class="watch-row">
              <span class="ticker">${esc(w.ticker)}</span>
              <span class="price num">${vnd(w.price)} <small class="${trendCls(w.change_pct)}">${pct(w.change_pct)}</small></span>
              <span class="comment">${esc(w.comment || "")}</span>
            </div>`).join("")}
        </div>
        <div class="card">
          <h3 class="card-title">Vàng SJC (triệu/lượng)</h3>
          <span class="gold-price num">${num((m.gold || {}).sjc_buy / 1e6, { maximumFractionDigits: 1 })}
            / ${num((m.gold || {}).sjc_sell / 1e6, { maximumFractionDigits: 1 })}</span>
          <p class="gold-note">${esc((m.gold || {}).note || "")}</p>
        </div>
      </div>`;

    const news = (m.news_vn || []).length ? `
      <div class="news-list" style="margin-top:10px">
        ${m.news_vn.map((n) => `
          <a class="news-item" href="${esc(n.url)}" target="_blank" rel="noopener">
            <span class="title">${esc(n.title)}</span>
            <p class="summary">${esc(n.summary || "")}</p>
            <div class="meta"><span class="src">${esc(n.source || "")}</span></div>
          </a>`).join("")}
      </div>` : "";

    $("#market-body").innerHTML = strip + holdings + advice + watch + news;

    // Badge cập nhật + cảnh báo
    const stale = m.session_date && m.session_date < lastTradingDate();
    addBadge(`Thị trường <strong>${esc(m.updated_at_vn || "?")}</strong>`, stale ? "stale" : "");
    if (stale) $("#session-note").textContent = `Phiên gần nhất: ${m.session_date}`;
    if (m.data_quality && m.data_quality !== "live") addBadge("Giá từ nguồn dự phòng", "warn");
  }

  // ---------- news sections ----------

  function newsItem(n, withWhy) {
    return `
      <a class="news-item" href="${esc(n.url)}" target="_blank" rel="noopener">
        <span class="title">${esc(n.title)}${n.hot ? '<span class="hot-chip">HOT</span>' : ""}</span>
        <p class="summary">${esc(n.summary || "")}</p>
        ${withWhy && n.why_it_matters ? `<p class="why"><b>Vì sao quan trọng:</b> ${esc(n.why_it_matters)}</p>` : ""}
        <div class="meta"><span class="src">${esc(n.source || "")}</span>${n.published ? ` · ${esc(n.published)}` : ""}</div>
      </a>`;
  }

  function repoItem(r) {
    return `
      <a class="repo" href="${esc(r.url)}" target="_blank" rel="noopener">
        <div class="repo-top">
          <span class="repo-name">${esc(r.repo)}</span>
          <span class="repo-gain num">+${vnd(r.stars_period)} ★</span>
        </div>
        <p class="repo-desc">${esc(r.desc || "")}</p>
        <div class="repo-meta">${esc(r.lang || "")} · <span class="num">${vnd(r.stars)}</span> ★ tổng</div>
      </a>`;
  }

  function renderNews(d) {
    $("#ai-body").innerHTML =
      `<div class="news-list">${(d.ai || []).map((n) => newsItem(n, true)).join("")}</div>`;

    const gh = d.github || {};
    $("#github-body").innerHTML = `
      <div class="gh-cols">
        <div class="gh-col">
          <h3>Hôm nay</h3>
          <div class="repo-list">${(gh.daily || []).map(repoItem).join("")}</div>
        </div>
        <div class="gh-col">
          <h3>Tuần này</h3>
          <div class="repo-list">${(gh.weekly || []).map(repoItem).join("")}</div>
        </div>
      </div>
      ${gh.trend_note ? `<div class="card trend-note"><p>${esc(gh.trend_note)}</p></div>` : ""}`;

    const tk = d.tiktok || {};
    $("#tiktok-body").innerHTML = `
      <div class="tiktok-grid">
        ${(tk.trends || []).map((t) => `
          <article class="card trend-card">
            <h3 class="trend-name">${esc(t.name)}</h3>
            <p class="trend-desc">${esc(t.desc || "")}</p>
            ${t.fit ? `<p class="fit"><b>Hợp với kênh:</b> ${esc(t.fit)}</p>` : ""}
            ${t.idea ? `<p class="idea"><b>Ý tưởng video:</b> ${esc(t.idea)}</p>` : ""}
          </article>`).join("")}
      </div>
      ${(tk.sounds || []).length ? `
        <div class="card sounds">
          <h3 class="card-title">Nhạc &amp; sound đang trend</h3>
          ${tk.sounds.map((s) => `
            <div class="sound-row">
              <span class="name">${esc(s.name)}</span>
              <span class="desc">${esc(s.desc || "")}</span>
            </div>`).join("")}
        </div>` : ""}
      ${tk.note ? `<div class="card tiktok-note"><p>${esc(tk.note)}</p></div>` : ""}`;

    $("#tech-body").innerHTML =
      `<div class="news-list two-col">${(d.tech || []).map((n) => newsItem(n, false)).join("")}</div>`;

    const h = hoursSince(d.updated_at);
    const stale = h != null && h > 26;
    addBadge(`Tin sáng <strong>${esc(d.updated_at_vn || "?")}</strong>`, stale ? "stale" : "");
    if (stale) addBadge("Dữ liệu cũ", "stale");
  }

  // ---------- nav active state ----------

  function watchNav() {
    const links = [...document.querySelectorAll("#nav a")];
    const byId = Object.fromEntries(links.map((a) => [a.getAttribute("href").slice(1), a]));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            links.forEach((a) => a.classList.remove("active"));
            byId[e.target.id]?.classList.add("active");
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    document.querySelectorAll("main section").forEach((s) => io.observe(s));
  }

  // ---------- boot ----------

  renderToday();
  watchNav();

  loadJSON("data/market.json")
    .then(renderMarket)
    .catch(() => sectionError(["#market-body"], "Không tải được dữ liệu thị trường. Thử lại sau."));

  loadJSON("data/news.json")
    .then(renderNews)
    .catch(() =>
      sectionError(["#ai-body", "#github-body", "#tiktok-body", "#tech-body"],
        "Không tải được bản tin. Thử lại sau."));
})();

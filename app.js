/* One Vision — views and charts. Depends on d3 v7, data.js (window.OV) and model.js (window.OVM). */
(function () {
  "use strict";
  const X = window.OVM, { B, E, byId, M, MID, PILLARS, FAM, FAM_SHORT, CORE, NAT, NRANK } = X;
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const sum = (a, f) => a.reduce((s, x) => s + (f ? f(x) : x), 0);
  const C = { brand: "#5048e5", brand2: "#7b74ff", deep: "#3a32c9", peer: "#eb6834", nat: "#a3a5bd", ink: "#1c1d3a", ink2: "#55587a", muted: "#9496b4",
              panel: "#ffffff", line: "#e9eaf6", line2: "#d9dbef", soft: "#f5f6fd", soft2: "#eceefb", good: "#1f9d61", warn: "#d79a00", bad: "#e0444f" };
  const FAMC = { HOU: "#5048e5", LAP: "#eb6834", PL: "#1baf7a", BL: "#eda100", UCL: "#e87ba4", MIC: "#2a8fd6" };
  const PILC = { growth: "#5048e5", credit: "#eb6834", ops: "#1baf7a", xsell: "#eda100", risk: "#e87ba4", market: "#2a8fd6" };
  const BANDC = { lead: C.good, steady: C.warn, lag: C.bad, na: C.nat };
  const f0 = v => (+v).toLocaleString("en-IN", { maximumFractionDigits: 0 });
  const f1 = v => (+v).toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const pct0 = v => (v === null || !isFinite(v) ? "–" : (v * 100).toFixed(0) + "%"), pct1 = v => (v === null || !isFinite(v) ? "–" : (v * 100).toFixed(1) + "%");
  const rt = (n, d) => (d > 0 ? n / d : null);
  const state = { view: null, id: null, sec: "overview", ca: null, cb: null, csec: "summary", peer: "state", zone: "All", st: "All", sort: "score", q: "" };

  // ------------------------------------------------------------------ icons & sections
  const I = {
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    list: '<circle cx="5" cy="6" r="1.4"/><circle cx="5" cy="12" r="1.4"/><circle cx="5" cy="18" r="1.4"/><path d="M9 6h11M9 12h11M9 18h11"/>',
    compare: '<path d="M8 3v18M16 3v18M3 8h5M16 16h5"/>',
    overview: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    scorecard: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 3v4"/>',
    sales: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    credit: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
    ops: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 14l2.5 2.5L16 11"/>',
    insurance: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    risk: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',
    market: '<circle cx="12" cy="10" r="3"/><path d="M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11z"/>',
    strategy: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    peers: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 14.5c2.8 0 6 1.7 6 5"/>',
    memo: '<path d="M5 3h10l4 4v14H5z"/><path d="M9 11h6M9 15h6M9 7h3"/>',
    whatif: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    twins: '<circle cx="8" cy="9" r="3.2"/><circle cx="16" cy="9" r="3.2"/><path d="M2.5 20c0-3 2.5-5.5 5.5-5.5S13.5 17 13.5 20M10.5 20c0-3 2.5-5.5 5.5-5.5S21.5 17 21.5 20"/>',
    opps: '<circle cx="12" cy="12" r="8.5"/><path d="M9 8.5h6M9 11.5h6M12 11.5c2 0 3-1.2 3-3M10 15.5l4-4"/>',
    ask: '<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.9 2.1 2.1.9-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z"/>',
  };
  const icon = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${I[k]}</svg>`;
  const SECS = [
    { id: "overview", name: "Overview" }, { id: "scorecard", name: "Scorecard" }, { id: "sales", name: "Sales & sourcing" },
    { id: "credit", name: "Credit decisions" }, { id: "ops", name: "Operations" }, { id: "insurance", name: "Insurance" },
    { id: "risk", name: "Portfolio risk" }, { id: "market", name: "Local market" }, { id: "strategy", name: "Strategy lenses" },
    { id: "peers", name: "Peer benchmark" }, { id: "twins", name: "Twin finder", grp: "Decide" }, { id: "whatif", name: "What-if lab", grp: "Decide" }, { id: "memo", name: "Consultant memo", grp: "Decide" }];

  // ------------------------------------------------------------------ tooltip
  const tipEl = $("#tip");
  function tip(html, ev) {
    tipEl.innerHTML = html; tipEl.classList.add("on");
    const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    let x = ev.clientX + 14, y = ev.clientY + 14;
    if (x + w > innerWidth - 8) x = ev.clientX - w - 14;
    if (y + h > innerHeight - 8) y = ev.clientY - h - 14;
    tipEl.style.left = x + "px"; tipEl.style.top = y + "px";
  }
  const untip = () => tipEl.classList.remove("on");
  const svgIn = (el, W, H, label) => d3.select(el).append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("role", "img").attr("aria-label", label);
  const width = (el, d) => el.clientWidth || d || 520;

  // ------------------------------------------------------------------ hex map of India
  const GEO = X.OV.geo, S = GEO.S;
  const CELLS = [];
  for (const [r, q0, q1] of GEO.runs) for (let q = q0; q <= q1; q++) CELLS.push({ r, q, lon: 68 + q * S + (r % 2) * S / 2, lat: 6 + r * S * 0.866 });
  const cellOf = (lat, lon) => { const r = Math.round((lat - 6) / (S * 0.866)); const q = Math.round((lon - 68 - (r % 2) * S / 2) / S); return r + "," + q; };
  const JIT = {};
  { const groups = {}; for (const b of B) if (b.lat != null) (groups[b.lat + "," + b.lon] = groups[b.lat + "," + b.lon] || []).push(b);
    for (const g of Object.values(groups)) g.forEach((b, i) => { const a = (i / g.length) * 2 * Math.PI, rr = g.length > 1 ? 0.09 + 0.012 * g.length : 0; JIT[b.id] = [b.lon + rr * Math.cos(a), b.lat + rr * Math.sin(a)]; }); }
  const hexPath = R => { let p = ""; for (let k = 0; k < 6; k++) { const a = Math.PI / 180 * (60 * k - 90); p += (k ? "L" : "M") + (R * Math.cos(a)).toFixed(2) + "," + (R * Math.sin(a)).toFixed(2); } return p + "Z"; };

  function hexMap(el, opt) {
    el.innerHTML = "";
    const W = width(el, 600), H = Math.max(opt.minH || 300, el.clientHeight || W * 1.05);
    const proj = d3.geoMercator().fitExtent([[10, 10], [W - 10, H - 10]], { type: "MultiPoint", coordinates: CELLS.map(c => [c.lon, c.lat]) });
    const cell = Math.abs(proj([78 + S, 20])[0] - proj([78, 20])[0]), R = (cell / Math.sqrt(3)) * 1.02;
    const svg = svgIn(el, W, H, opt.label || "Hex map of India");
    const path = hexPath(R * 0.9);
    const val = opt.cellVal || null, vmax = val ? d3.max([...val.values()]) || 1 : 1;
    const ramp = opt.dark ? d3.interpolateRgb("#9d98ff", "#ffffff") : isDark() ? d3.interpolateRgb("#3a3e70", "#a8a2ff") : d3.interpolateRgb("#cfd0f6", C.deep);
    svg.append("g").selectAll("path").data(CELLS).join("path").attr("d", path)
      .attr("transform", c => { const [x, y] = proj([c.lon, c.lat]); return `translate(${x},${y})`; })
      .attr("fill", c => { const v = val && val.get(c.r + "," + c.q); return v !== undefined && v !== null && (v || opt.colorOf) ? (opt.colorOf ? opt.colorOf(v) : ramp(0.3 + 0.7 * Math.sqrt(v / vmax))) : opt.dark ? "rgba(255,255,255,.2)" : "#e3e4f6"; })
      .on("mousemove", (ev, c) => { const v = val && val.get(c.r + "," + c.q); if (v && opt.cellTip) tip(opt.cellTip(c.r + "," + c.q, v), ev); }).on("mouseleave", untip);
    const g = svg.append("g");
    let sel = null;
    if (opt.branches) {
      const rs = d3.scaleSqrt().domain([0, d3.max(E, b => b.core_da)]).range([opt.rMin || 2.2, opt.rMax || 10]);
      const list = opt.branches.filter(b => b.lat != null).sort((a, b) => (opt.isOn(a) ? 1 : 0) - (opt.isOn(b) ? 1 : 0) || b.core_da - a.core_da);
      sel = g.selectAll("circle").data(list).join("circle")
        .attr("cx", b => proj(JIT[b.id])[0]).attr("cy", b => proj(JIT[b.id])[1])
        .attr("r", b => (opt.r ? opt.r(b, rs) : rs(Math.max(0, b.core_da))))
        .attr("fill", b => opt.fill(b)).attr("fill-opacity", b => (opt.isOn(b) ? 0.92 : 0.16))
        .attr("stroke", "#fff").attr("stroke-width", b => (opt.isOn(b) ? 1 : 0.4)).style("cursor", "pointer")
        .on("mousemove", (ev, b) => tip(branchTip(b), ev)).on("mouseleave", untip).on("click", (ev, b) => { untip(); go(b.id); });
    }
    const placedC = [];
    for (const co of opt.callouts || []) {
      const b = co.b, [x, y] = proj(JIT[b.id] || [b.lon, b.lat]);
      g.append("circle").attr("cx", x).attr("cy", y).attr("r", co.big ? 7 : 5).attr("fill", co.color || C.peer).attr("stroke", "#fff").attr("stroke-width", 2);
      const tw = Math.max(co.title.length * 6.2, co.value.length * 7.6) + 22, th = 38, left = x > W * 0.62;
      const bx = left ? x - tw - 12 : x + 12; let by = Math.max(4, Math.min(H - th - 4, y - th - 6));
      for (let k = 0; k < 8 && placedC.some(p => Math.abs(p[1] - by) < th + 6 && bx < p[0] + p[2] && p[0] < bx + tw); k++) by += th + 8;
      placedC.push([bx, by, tw]);
      if (Math.abs(by - (y - th - 6)) > 4) g.append("line").attr("x1", x).attr("y1", y).attr("x2", left ? bx + tw : bx).attr("y2", by + th / 2).attr("stroke", co.dark ? "#fff" : C.ink2).attr("stroke-width", 1).attr("opacity", 0.6);
      const c = g.append("g").attr("class", "callout").attr("transform", `translate(${bx},${by})`).style("cursor", "pointer").on("click", () => go(b.id));
      c.append("rect").attr("width", tw).attr("height", th).attr("rx", 10);
      c.append("rect").attr("width", 4).attr("height", th - 16).attr("x", 6).attr("y", 8).attr("rx", 2).style("fill", co.color || C.peer).style("filter", "none");
      c.append("text").attr("x", 16).attr("y", 15).text(co.title);
      c.append("text").attr("class", "v").attr("x", 16).attr("y", 30).text(co.value);
    }
    return { svg, proj, sel };
  }
  function branchTip(b) {
    return `<b>${esc(b.name)}</b><br><span class="k">${esc(b.state)} · ${esc(b.zone)} zone</span><br>Health <b>${b.health === null ? "–" : Math.round(b.health)}</b> · ${b.band.name}<br><span class="k">Core disbursal</span> ${X.cr(b.core_da)} <span class="k">(Aug–Sep)</span>`;
  }
  const bandLegend = () => ["lead", "steady", "lag"].map(k => `<span><i style="background:${BANDC[k]}"></i>${{ lead: "▲ Leader", steady: "■ Steady", lag: "▼ Lagging" }[k]}</span>`).join("") + `<span class="muted">size = core disbursal</span>`;

  // ------------------------------------------------------------------ small chart kit
  function ringSVG(v, color, opt = {}) {
    const R = 40, w = opt.w || 8, a = d3.arc().innerRadius(R - w).outerRadius(R).cornerRadius(w / 2).startAngle(0);
    const vv = Math.max(0, Math.min(1, v || 0));
    const da = opt.data ? Object.entries(opt.data).filter(([, x]) => x !== undefined && x !== null).map(([k, x]) => ` data-${k}="${x}"`).join("") : "";
    return `<svg viewBox="-50 -50 100 100" aria-hidden="true" class="${opt.cls || ""}"${da}><path d="${a.endAngle(2 * Math.PI)()}" fill="${opt.track || C.soft2}"/>` +
      `<path class="rv" d="${a.endAngle(2 * Math.PI * vv)()}" fill="${color}"/>` +
      `<text y="${opt.sub ? 2 : 6}" text-anchor="middle" style="font:600 ${opt.fs || 19}px var(--ui);fill:${opt.ink || C.ink}">${opt.text ?? Math.round(vv * 100) + "%"}</text>` +
      (opt.sub ? `<text y="17" text-anchor="middle" style="font:500 9px var(--ui);fill:${opt.subInk || C.muted}">${opt.sub}</text>` : "") + `</svg>`;
  }
  function deltaTxt(v, p, dir, kind) {
    if (v === null || p === null || v === undefined || p === undefined) return `<span class="delta eq">no peer value</span>`;
    const d = v - p, eq = Math.abs(d) < (kind === "pts" ? 0.0005 : 0.05), good = d * dir > 0;
    const t = kind === "pts" ? `${Math.abs(d * 100).toFixed(1)} pts` : kind === "cr" ? X.cr(Math.abs(d)) : kind === "pct" ? `${Math.abs(d * 100).toFixed(0)}%` : f1(Math.abs(d));
    return `<span class="delta ${eq ? "eq" : good ? "up" : "dn"}">${d >= 0 ? "▲" : "▼"} ${t}</span>`;
  }
  // ring KPI card: share-type metric
  function ringCard(title, v, p, dir, color, extra) {
    return `<div class="card rkc"><div class="t">${title}</div><div class="rk">${ringSVG(v, color)}<div><div class="v">${pct1(v)}</div>
      <div>${deltaTxt(v, p, dir, "pts")}</div><div class="cmp">peers ${pct1(p)}</div></div></div>${extra ? `<div class="c">${extra}</div>` : ""}</div>`;
  }
  function multiRing(el, items, center) {
    el.innerHTML = "";
    const W = Math.min(width(el, 320), 300), H = W, cx = W / 2, cy = H / 2, R0 = W / 2 - 6, w = Math.max(7, W / 34), gap = w + 5;
    const svg = svgIn(el, W, H, "Pillar rings").style("width", W + "px").style("max-width", "100%").style("margin", "0 auto");
    items.forEach((it, i) => {
      const R = R0 - i * gap, a = d3.arc().innerRadius(R - w).outerRadius(R).cornerRadius(w / 2).startAngle(-0.75 * Math.PI);
      svg.append("path").attr("transform", `translate(${cx},${cy})`).attr("d", a.endAngle(0.75 * Math.PI)()).attr("fill", C.soft2);
      if (it.peer !== null) { const pa = -0.75 * Math.PI + 1.5 * Math.PI * it.peer / 100; svg.append("line").attr("x1", cx + Math.sin(pa) * (R - w - 2)).attr("y1", cy - Math.cos(pa) * (R - w - 2)).attr("x2", cx + Math.sin(pa) * (R + 2)).attr("y2", cy - Math.cos(pa) * (R + 2)).attr("stroke", C.peer).attr("stroke-width", 2.2).attr("stroke-linecap", "round"); }
      if (it.val !== null) svg.append("path").attr("transform", `translate(${cx},${cy})`).attr("d", a.endAngle(-0.75 * Math.PI + 1.5 * Math.PI * it.val / 100)()).attr("fill", it.color)
        .on("mousemove", ev => tip(`<b>${it.name}</b><br>Branch <b>${Math.round(it.val)}</b> · peers ${it.peer === null ? "–" : Math.round(it.peer)}<br><span class="k">${it.note || ""}</span>`, ev)).on("mouseleave", untip);
    });
    const ri = R0 - items.length * gap;
    svg.append("circle").attr("cx", cx).attr("cy", cy).attr("r", ri - 4).attr("fill", C.soft);
    svg.append("text").attr("x", cx).attr("y", cy - ri * 0.38).attr("text-anchor", "middle").style("font", `600 ${Math.max(8.5, ri * 0.13)}px var(--ui)`).style("fill", C.muted).style("letter-spacing", ".12em").text(center.top);
    svg.append("text").attr("x", cx).attr("y", cy + ri * 0.2).attr("text-anchor", "middle").style("font", `600 ${ri * (String(center.big).length > 3 ? 0.42 : 0.58)}px var(--ui)`).style("fill", C.ink).text(center.big);
    svg.append("text").attr("x", cx).attr("y", cy + ri * 0.48).attr("text-anchor", "middle").style("font", `500 ${Math.max(8.5, ri * 0.13)}px var(--ui)`).style("fill", C.muted).text(center.sub);
  }
  function donut(el, items, center, opt = {}) {
    el.innerHTML = "";
    const W = Math.min(width(el, 260), opt.max || 240), H = W, R = W / 2 - 4;
    const svg = svgIn(el, W, H, opt.label || "Donut").style("width", W + "px").style("max-width", "100%").style("margin", "0 auto").append("g").attr("transform", `translate(${W / 2},${H / 2})`);
    const tot = sum(items, d => d.v);
    const arcs = d3.pie().sort(null).value(d => d.v).padAngle(0.025)(items.filter(d => d.v > 0));
    const a = d3.arc().innerRadius(R * 0.66).outerRadius(R).cornerRadius(5);
    svg.selectAll("path").data(arcs).join("path").attr("d", a).attr("fill", d => d.data.c)
      .on("mousemove", (ev, d) => tip(`<b>${esc(d.data.k)}</b><br>${opt.fmt ? opt.fmt(d.data.v) : f0(d.data.v)} · ${pct1(d.data.v / tot)}`, ev)).on("mouseleave", untip);
    svg.append("text").attr("text-anchor", "middle").attr("y", 2).style("font", `600 ${R * 0.34}px var(--ui)`).style("fill", C.ink).text(center.big);
    svg.append("text").attr("text-anchor", "middle").attr("y", R * 0.24).style("font", `500 ${Math.max(10, R * 0.11)}px var(--ui)`).style("fill", C.muted).text(center.sub);
  }
  const legendRows = (items, tot, fmt) => `<div class="hr-leg">${items.map(d => `<div class="hr-row" style="grid-template-columns:12px minmax(0,1fr) 70px 46px"><i style="border-color:${d.c}"></i><span class="n">${esc(d.k)}</span><span class="a">${fmt ? fmt(d.v) : f0(d.v)}</span><span class="p" style="color:var(--muted)">${pct0(tot ? d.v / tot : 0)}</span></div>`).join("")}</div>`;

  // grouped vertical bars over categories
  function vbars(el, cats, series, opt = {}) {
    el.innerHTML = "";
    const W = width(el), H = opt.h || 240, mg = { t: 18, r: 8, b: 30, l: 44 };
    const svg = svgIn(el, W, H, opt.label || "Bar chart");
    const x0 = d3.scaleBand().domain(cats).range([mg.l, W - mg.r]).paddingInner(0.28).paddingOuter(0.12);
    const x1 = d3.scaleBand().domain(series.map(s => s.name)).range([0, x0.bandwidth()]).padding(0.12);
    const ymax = d3.max(series.flatMap(s => s.v)) || 1;
    const y = d3.scaleLinear().domain([0, ymax * 1.12]).range([H - mg.b, mg.t]).nice();
    svg.append("g").attr("class", "gridl").selectAll("line").data(y.ticks(4)).join("line").attr("x1", mg.l).attr("x2", W - mg.r).attr("y1", d => y(d)).attr("y2", d => y(d));
    svg.append("g").attr("class", "ax").attr("transform", `translate(${mg.l},0)`).call(d3.axisLeft(y).ticks(4).tickFormat(opt.yf || (d => d)).tickSizeOuter(0)).select(".domain").remove();
    svg.append("g").attr("class", "ax").attr("transform", `translate(0,${H - mg.b})`).call(d3.axisBottom(x0).tickFormat(opt.xf || (d => d)).tickSizeOuter(0));
    series.forEach((s, si) => {
      const bw = series.length > 1 ? x1.bandwidth() : Math.min(x0.bandwidth(), 46);
      const off = series.length > 1 ? x1(s.name) : (x0.bandwidth() - bw) / 2;
      svg.append("g").selectAll("rect").data(s.v.map((v, i) => [cats[i], v, i])).join("rect")
        .attr("x", d => x0(d[0]) + off).attr("width", bw).attr("y", d => y(Math.max(0, d[1]))).attr("height", d => Math.max(0, y(0) - y(Math.max(0, d[1]))))
        .attr("rx", Math.min(6, bw / 3)).attr("fill", d => (s.colorAt ? s.colorAt(d[2]) : s.c)).attr("opacity", d => (s.opAt ? s.opAt(d[2]) : 1))
        .on("mousemove", (ev, d) => tip(`<b>${(opt.xf || (k => k))(d[0])}</b><br><span style="color:${s.c}">●</span> ${esc(s.name)}: <b>${opt.tf ? opt.tf(d[1]) : f1(d[1])}</b>${opt.extra ? opt.extra(d[2], si) : ""}`, ev)).on("mouseleave", untip);
      if (opt.labels) svg.append("g").selectAll("text").data(s.v.map((v, i) => [cats[i], v, i])).join("text").attr("class", "lbl").attr("text-anchor", "middle")
        .attr("x", d => x0(d[0]) + off + bw / 2).attr("y", d => y(Math.max(0, d[1])) - 5).text(d => opt.labels(d[1], d[2], si));
    });
  }
  // dumbbell: branch vs peers on a shared % scale
  function dumbbell(el, rows, opt = {}) {
    el.innerHTML = "";
    rows = rows.filter(r => r.a !== null || r.b !== null);
    if (!rows.length) { el.innerHTML = `<div class="empty">Not enough volume to compare.</div>`; return; }
    const W = width(el), rh = 34, mg = { t: 22, r: 50, b: 8, l: Math.min(150, W * 0.32) }, H = mg.t + mg.b + rows.length * rh;
    const svg = svgIn(el, W, H, opt.label || "Dumbbell");
    const vals = rows.flatMap(r => [r.a, r.b]).filter(v => v !== null);
    const x = d3.scaleLinear().domain(opt.domain || [Math.max(0, d3.min(vals) - 0.08), Math.min(1, d3.max(vals) + 0.06)]).range([mg.l, W - mg.r]).nice();
    svg.append("g").attr("class", "gridl").selectAll("line").data(x.ticks(5)).join("line").attr("x1", d => x(d)).attr("x2", d => x(d)).attr("y1", mg.t - 6).attr("y2", H - mg.b);
    svg.append("g").selectAll("text").data(x.ticks(5)).join("text").attr("class", "axl").attr("text-anchor", "middle").attr("x", d => x(d)).attr("y", 11).text(d => (opt.tf || pct0)(d));
    const g = svg.selectAll("g.r").data(rows).join("g").attr("class", "r").attr("transform", (d, i) => `translate(0,${mg.t + i * rh + rh / 2})`);
    g.append("text").attr("x", mg.l - 10).attr("y", 4).attr("text-anchor", "end").attr("class", "lbl").text(d => d.k);
    g.filter(d => d.a !== null && d.b !== null).append("line").attr("x1", d => x(d.a)).attr("x2", d => x(d.b)).attr("stroke", C.line2).attr("stroke-width", 4).attr("stroke-linecap", "round");
    g.filter(d => d.b !== null).append("circle").attr("cx", d => x(d.b)).attr("r", 6).attr("fill", C.peer).attr("stroke", "#fff").attr("stroke-width", 2);
    g.filter(d => d.a !== null).append("circle").attr("cx", d => x(d.a)).attr("r", 7.5).attr("fill", C.brand).attr("stroke", "#fff").attr("stroke-width", 2);
    g.append("text").attr("x", W - 4).attr("y", 4).attr("text-anchor", "end").attr("class", "lbl-b").text(d => (d.a === null ? "–" : (opt.tf || pct0)(d.a)));
    g.append("rect").attr("x", 0).attr("y", -rh / 2).attr("width", W).attr("height", rh).attr("fill", "transparent")
      .on("mousemove", (ev, d) => tip(`<b>${esc(d.k)}</b><br><span style="color:${C.brand}">●</span> ${esc(opt.an || "Branch")}: <b>${d.a === null ? "–" : (opt.tf || pct1)(d.a)}</b>${d.na ? ` <span class="k">(${f0(d.na)} ${opt.unit || ""})</span>` : ""}<br><span style="color:${C.peer}">●</span> ${esc(opt.bn || "Peers")}: <b>${d.b === null ? "–" : (opt.tf || pct1)(d.b)}</b>`, ev)).on("mouseleave", untip);
  }
  // 100% stacked horizontal bars
  function stack100(el, rows, keys, colors, opt = {}) {
    el.innerHTML = "";
    const W = width(el), rh = 40, mg = { t: 6, r: 6, b: 6, l: opt.l || 110 }, H = mg.t + mg.b + rows.length * rh;
    const svg = svgIn(el, W, H, opt.label || "Composition");
    const x = d3.scaleLinear().domain([0, 1]).range([mg.l, W - mg.r]);
    rows.forEach((r, i) => {
      const tot = sum(keys, k => r.parts[k] || 0), y0 = mg.t + i * rh + 6;
      svg.append("text").attr("x", mg.l - 10).attr("y", y0 + 18).attr("text-anchor", "end").attr("class", r.me ? "lbl-b" : "lbl").text(r.name);
      let acc = 0;
      keys.forEach((k, j) => {
        const s = tot ? (r.parts[k] || 0) / tot : 0; if (s <= 0) return;
        const xx = x(acc), ww = Math.max(0, x(acc + s) - x(acc) - 2);
        svg.append("rect").attr("x", xx).attr("y", y0).attr("width", ww).attr("height", 26).attr("rx", 6).attr("fill", colors[j])
          .on("mousemove", ev => tip(`<b>${esc(r.name)}</b><br><span style="color:${colors[j]}">●</span> ${esc(k)}: <b>${pct1(s)}</b>${opt.vf ? ` <span class="k">(${opt.vf(r.parts[k])})</span>` : ""}`, ev)).on("mouseleave", untip);
        if (ww > 34) svg.append("text").attr("x", xx + ww / 2).attr("y", y0 + 17).attr("text-anchor", "middle").attr("class", "lbl-w").style("font-size", "11px").text(pct0(s));
        acc += s;
      });
    });
  }
  function lineChart(el, series, xs, opt) {
    el.innerHTML = "";
    const W = width(el), H = opt.h || 250, mg = { t: 14, r: 18, b: 28, l: 44 };
    const svg = svgIn(el, W, H, opt.label);
    const x = d3.scalePoint().domain(xs).range([mg.l + 6, W - mg.r - 6]);
    const all = series.flatMap(s => s.v.filter(v => v !== null && isFinite(v)));
    if (!all.length) { el.innerHTML = `<div class="empty">Not enough volume to plot.</div>`; return; }
    const y = d3.scaleLinear().domain(opt.domain || [Math.min(0, d3.min(all)), d3.max(all) * 1.15 || 1]).range([H - mg.b, mg.t]).nice();
    svg.append("g").attr("class", "gridl").selectAll("line").data(y.ticks(4)).join("line").attr("x1", mg.l).attr("x2", W - mg.r).attr("y1", d => y(d)).attr("y2", d => y(d));
    svg.append("g").attr("class", "ax").attr("transform", `translate(${mg.l},0)`).call(d3.axisLeft(y).ticks(4).tickFormat(opt.yf).tickSizeOuter(0)).select(".domain").remove();
    svg.append("g").attr("class", "ax").attr("transform", `translate(0,${H - mg.b})`).call(d3.axisBottom(x).tickFormat(opt.xf || (d => d)).tickSizeOuter(0));
    if (opt.ref !== undefined) svg.append("line").attr("x1", mg.l).attr("x2", W - mg.r).attr("y1", y(opt.ref)).attr("y2", y(opt.ref)).attr("stroke", C.nat).attr("stroke-dasharray", "4 3");
    const line = d3.line().defined(v => v !== null && isFinite(v)).x((v, i) => x(xs[i])).y(v => y(v)).curve(xs.length > 4 ? d3.curveMonotoneX : d3.curveLinear);
    for (const s of series) {
      if (s.area) svg.append("path").attr("d", d3.area().defined(v => v !== null).x((v, i) => x(xs[i])).y0(y(y.domain()[0])).y1(v => y(v)).curve(d3.curveMonotoneX)(s.v)).attr("fill", s.c).attr("opacity", 0.08);
      svg.append("path").attr("d", line(s.v)).attr("fill", "none").attr("stroke", s.c).attr("stroke-width", s.w || 2).attr("stroke-dasharray", s.dash || null);
      svg.append("g").selectAll("circle").data(s.v.map((v, i) => [i, v]).filter(d => d[1] !== null && isFinite(d[1]))).join("circle").attr("cx", d => x(xs[d[0]])).attr("cy", d => y(d[1])).attr("r", s.w > 2 ? 4 : 3).attr("fill", s.c).attr("stroke", "#fff").attr("stroke-width", 1.5);
      if (opt.endLabels) { const li = s.v.length - 1; if (s.v[li] !== null) svg.append("text").attr("class", "lbl-b").attr("x", x(xs[li]) + 8).attr("y", y(s.v[li]) + 4).style("fill", s.c).text(opt.tf(s.v[li])); }
    }
    const hl = svg.append("line").attr("y1", mg.t).attr("y2", H - mg.b).attr("stroke", C.ink2).style("opacity", 0);
    svg.append("rect").attr("x", mg.l).attr("y", mg.t).attr("width", W - mg.l - mg.r).attr("height", H - mg.t - mg.b).attr("fill", "transparent")
      .on("mousemove", ev => {
        const [mx] = d3.pointer(ev); const i = d3.minIndex(xs, d => Math.abs(x(d) - mx));
        hl.attr("x1", x(xs[i])).attr("x2", x(xs[i])).style("opacity", 0.3);
        tip(`<b>${(opt.xf || (d => d))(xs[i])}</b><br>` + series.map(s => `<span style="color:${s.c}">●</span> ${esc(s.name)}: <b>${s.v[i] === null ? "–" : opt.tf(s.v[i])}</b>`).join("<br>") + (opt.extra ? opt.extra(i) : ""), ev);
      }).on("mouseleave", () => { hl.style("opacity", 0); untip(); });
  }
  function renderPareto(el, rows, what) {
    el.innerHTML = "";
    const tot = sum(rows, r => r[1]);
    rows = rows.filter(r => r[1] > 0).sort((a, b) => b[1] - a[1]);
    if (!tot) { el.innerHTML = `<div class="empty">No ${what} recorded for this branch.</div>`; return ""; }
    let cum = 0; const data = rows.map(([k, v]) => { const s = v / tot; cum += s; return { k, v, s, cum }; });
    const vital = data.findIndex(d => d.cum >= 0.8) + 1;
    const W = width(el), rh = 28, mg = { t: 4, r: 70, b: 4, l: Math.min(170, W * 0.36) }, H = mg.t + mg.b + data.length * rh;
    const svg = svgIn(el, W, H, `Pareto of ${what}`);
    const x = d3.scaleLinear().domain([0, d3.max(data, d => d.s)]).range([mg.l, W - mg.r - 34]);
    const g = svg.selectAll("g").data(data).join("g").attr("transform", (d, i) => `translate(0,${mg.t + i * rh})`);
    g.append("text").attr("x", mg.l - 8).attr("y", rh / 2 + 4).attr("text-anchor", "end").attr("class", "lbl").text(d => d.k);
    g.append("rect").attr("x", mg.l).attr("y", 5).attr("height", rh - 10).attr("width", d => Math.max(2, x(d.s) - mg.l)).attr("rx", 6).attr("fill", (d, i) => (i < vital ? C.brand : C.line2));
    g.append("text").attr("x", d => x(d.s) + 6).attr("y", rh / 2 + 4).attr("class", "lbl-b").text(d => pct0(d.s));
    g.append("text").attr("x", W - 4).attr("y", rh / 2 + 4).attr("text-anchor", "end").attr("class", "axl").text(d => "Σ " + pct0(d.cum));
    g.on("mousemove", (ev, d) => tip(`<b>${esc(d.k)}</b><br>${f0(d.v)} ${what} · ${pct1(d.s)}<br><span class="k">cumulative ${pct0(d.cum)}</span>`, ev)).on("mouseleave", untip);
    return `${vital} of ${data.length} reasons explain 80% of ${f0(tot)} ${what}`;
  }
  // Orion-style rank pills
  function pills(items, maxv) {
    return `<div class="pills">${items.map(it => `<div class="pill-r"><div class="track"><div class="fill" style="width:${Math.max(18, (it.v / maxv) * 100)}%;background:${it.c};color:${it.c}"><span>${esc(it.k)}</span></div>${it.p !== undefined ? `<i class="ghost" style="left:calc(${Math.min(100, (it.p / maxv) * 100)}% - 1px)" title="peers"></i>` : ""}</div><div class="val">${it.label}<small>${it.sub || ""}</small></div></div>`).join("")}</div>`;
  }
  const MON = m => ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][+m.slice(5) - 1] + " " + m.slice(2, 4);
  const legend = items => `<div class="legend">${items.map(([c, t, k]) => `<span><i class="${k || ""}" style="${k === "dash" ? "" : "background:" + c}"></i>${t}</span>`).join("")}</div>`;
  const LEG = (b, P) => legend([[C.brand, esc(b.name)], [C.peer, esc(P.name), "line"]]);

  // ------------------------------------------------------------------ search
  const SEARCH = E.map(b => ({ b, k: (b.name + " " + b.id + " " + b.state).toLowerCase() }));
  function searchBox(input, box) {
    let sel = -1, hits = [];
    const render = () => {
      const q = input.value.trim().toLowerCase();
      if (!q) { box.classList.remove("on"); return; }
      hits = SEARCH.filter(x => x.k.includes(q)).slice(0, 8);
      box.innerHTML = hits.length ? hits.map((x, i) => `<a href="#/b/${encodeURIComponent(x.b.id)}/${state.sec}" class="${i === sel ? "sel" : ""}">${esc(x.b.name)}<span>${esc(x.b.state)} · ${Math.round(x.b.health)}</span></a>`).join("") : `<a>No branch matches “${esc(q)}”</a>`;
      box.classList.add("on");
    };
    input.addEventListener("input", () => { sel = -1; render(); });
    input.addEventListener("keydown", e => {
      if (e.key === "ArrowDown") { sel = Math.min(hits.length - 1, sel + 1); render(); e.preventDefault(); }
      else if (e.key === "ArrowUp") { sel = Math.max(0, sel - 1); render(); e.preventDefault(); }
      else if (e.key === "Enter" && hits.length) go(hits[Math.max(0, sel)].b.id);
      else if (e.key === "Escape") box.classList.remove("on");
    });
    box.addEventListener("click", () => { box.classList.remove("on"); input.value = ""; });
    document.addEventListener("click", e => { if (!input.parentNode.contains(e.target)) box.classList.remove("on"); });
  }
  const go = id => { location.hash = `#/b/${encodeURIComponent(id)}/${state.view === "branch" ? state.sec : "overview"}`; $("#topSugg").classList.remove("on"); $("#topSearch").value = ""; };

  // ------------------------------------------------------------------ nav
  function renderNav() {
    const b = state.id && byId[state.id];
    let h = `<div class="nav-g">Network</div>
      <a class="nav-i ${state.view === "landing" ? "on" : ""}" href="#/">${icon("home")}Network home</a>
      <a class="nav-i ${state.view === "pick" ? "on" : ""}" href="#/pick">${icon("list")}Choose a branch</a>
      <a class="nav-i ${state.view === "compare" ? "on" : ""}" href="${cHash(state.ca || state.id, state.cb, "summary")}">${icon("compare")}Compare two</a>
      <a class="nav-i ${state.view === "opps" ? "on" : ""}" href="#/opps">${icon("opps")}Opportunity map</a>
      <a class="nav-i ${state.view === "ask" ? "on" : ""}" href="#/ask">${icon("ask")}Ask One Vision<em class="new">AI</em></a>`;
    if (state.view === "compare") {
      const ca = byId[state.ca], cb = byId[state.cb];
      h += `<div class="nav-g">Comparison</div>` + (ca && cb ? `<div class="nav-b"><span class="hs" style="background:${CA}">A</span><span><b>${esc(ca.name)}</b>vs ${esc(cb.name)}</span><span class="hs" style="background:${CB}">B</span></div>` : "");
      h += CSECS.map(s => `<a class="nav-i ${state.csec === s.id ? "on" : ""} ${ca && cb ? "" : "off"}" href="${cHash(state.ca, state.cb, s.id)}">${icon(s.ic)}${s.name}</a>`).join("");
      $("#nav").innerHTML = h;
      $("#sideFoot").innerHTML = `${NRANK} branches · 6 datasets<br>A = indigo · B = orange`;
      $("#crumbs").innerHTML = `<b>Compare two</b>` + (ca && cb ? `›<span>${esc(ca.name)} vs ${esc(cb.name)}</span>` : "");
      $("#peerCtl").classList.add("hide");
      return;
    }
    h += `<div class="nav-g">Branch 360</div>`;
    if (b) h += `<div class="nav-b"><span class="hs" style="background:${BANDC[b.band.id]}">${Math.round(b.health)}</span><span><b>${esc(b.name)}</b>${esc(b.state)}</span></div>`;
    h += SECS.map(s => (s.grp && s.grp !== (SECS[SECS.indexOf(s) - 1] || {}).grp ? `<div class="nav-g">${s.grp}</div>` : "") + `<a class="nav-i ${state.view === "branch" && state.sec === s.id ? "on" : ""} ${b ? "" : "off"}" href="${b ? `#/b/${encodeURIComponent(b.id)}/${s.id}` : "#/pick"}">${icon(s.id)}${s.name}</a>`).join("");
    $("#nav").innerHTML = h;
    $("#sideFoot").innerHTML = `${NRANK} branches · 6 datasets<br>Sales Aug–Sep · Credit 13 mo · Risk Jul–Sep 2026`;
    const sec = SECS.find(s => s.id === state.sec);
    $("#crumbs").innerHTML = state.view === "branch" && b ? `<span>Branch 360</span>›<b>${esc(b.name)}</b>›<span>${sec ? sec.name : ""}</span>` : state.view === "pick" ? `<b>Choose a branch</b>` : state.view === "opps" ? `<span>Network</span>›<b>Opportunity map</b>` : state.view === "ask" ? `<span>Network</span>›<b>Ask One Vision</b>` : `<b>Network home</b>`;
    $("#peerCtl").classList.toggle("hide", state.view !== "branch");
    $("#peerSeg").innerHTML = X.PEER_MODES.map(p => `<button class="${p.id === state.peer ? "on" : ""}" data-p="${p.id}">${p.name}</button>`).join("");
  }
  $("#peerSeg").addEventListener("click", e => { const p = e.target.dataset.p; if (!p) return; state.peer = p; render(); });

  // ------------------------------------------------------------------ landing
  const ZC = { North: "#7b74ff", South: "#ffffff", West: "#ffcf7a", East: "#7fe0c3" };
  // network filter: zone · state · health band · product family; every number on the landing page follows it
  const NF = { zone: "All", st: "All", band: "All", fam: "All" };
  const nfList = () => E.filter(b => (NF.zone === "All" || b.zone === NF.zone) && (NF.st === "All" || b.state === NF.st) && (NF.band === "All" || b.band.id === NF.band));
  const nfDa = b => (NF.fam === "All" ? b.core_da : b["sf_da_" + NF.fam] || 0);
  function nfBar() {
    const sts = [...new Set(E.filter(b => NF.zone === "All" || b.zone === NF.zone).map(b => b.state))].sort();
    const on = ["zone", "st", "band", "fam"].filter(k => NF[k] !== "All").length;
    return `<div class="card nf-bar" id="nfBar"><div class="nf-t">${FUN_I}<b>Filter the network</b>${on ? `<span class="cf-n">${on}</span>` : ""}</div>
      <label>Zone<div class="seg" data-k="zone">${ZONES.map(z => `<button type="button" class="${z === NF.zone ? "on" : ""}" data-v="${z}">${z}</button>`).join("")}</div></label>
      <label>State<select data-k="st"><option value="All">All states</option>${sts.map(s => `<option ${s === NF.st ? "selected" : ""}>${esc(s)}</option>`).join("")}</select></label>
      <label>Health<div class="seg" data-k="band">${[["All", "All"], ["lead", "▲ Leaders"], ["steady", "■ Steady"], ["lag", "▼ Lagging"]].map(([v, t]) => `<button type="button" class="${v === NF.band ? "on" : ""}" data-v="${v}">${t}</button>`).join("")}</div></label>
      <label>Product<select data-k="fam"><option value="All">All core products</option>${CORE.map(f => `<option value="${f}" ${f === NF.fam ? "selected" : ""}>${esc(FAM[f])}</option>`).join("")}</select></label>
      ${on ? `<button type="button" class="ghost-btn nf-reset">Reset</button>` : ""}</div>`;
  }
  function nfBind() {
    const bar = $("#nfBar"); if (!bar) return;
    const set = (k, v) => { NF[k] = v; if (k === "zone" && NF.st !== "All" && !E.some(b => b.state === NF.st && (v === "All" || b.zone === v))) NF.st = "All"; const y = scrollY; renderLanding(); scrollTo(0, y); };
    bar.querySelectorAll(".seg").forEach(s => s.onclick = e => { const v = e.target.closest("button")?.dataset.v; if (v) set(s.dataset.k, v); });
    bar.querySelectorAll("select").forEach(s => s.onchange = () => set(s.dataset.k, s.value));
    const r = bar.querySelector(".nf-reset"); if (r) r.onclick = () => { Object.assign(NF, { zone: "All", st: "All", band: "All", fam: "All" }); const y = scrollY; renderLanding(); scrollTo(0, y); };
  }
  function renderLanding() {
    const L = nfList(), N = L.length ? X.agg(L) : X.agg(E), fam = NF.fam, fn = fam === "All" ? "core products" : FAM[fam];
    const ins = X.value(MID.attach, N, false);
    const bnc = fam === "All" ? N.r_bn_09 / N.r_du_09 : rt(N["rf_bn_" + fam], N["rf_du_" + fam]);
    const appr = fam === "All" ? rt(N.c_san, N.c_dec) : rt(N["cf_san_" + fam], N["cf_dec_" + fam]), dec = fam === "All" ? N.c_dec : N["cf_dec_" + fam];
    const zones = ["North", "South", "West", "East"].map(z => ({ z, v: sum(L.filter(b => b.zone === z), nfDa), n: L.filter(b => b.zone === z).length })).filter(z => z.n);
    const zt = sum(zones, z => z.v) || 1;
    const top = [...L].sort((a, b) => b.health - a.health);
    const mom = [...L].filter(b => b.v.mom !== null && b.san_prev >= 3).sort((a, b) => b.v.mom - a.v.mom);
    const li = (arr, f) => arr.length ? `<ol class="lead-list">${arr.slice(0, 5).map((b, i) => `<li><span class="n">${i + 1}</span><a href="#/b/${encodeURIComponent(b.id)}/overview">${esc(b.name)}</a><span class="muted">${f(b)}</span></li>`).join("")}</ol>` : `<div class="empty">No branch in this filter.</div>`;
    const states = [...new Set(L.map(b => b.state))].map(s => ({ s, list: L.filter(b => b.state === s) })).filter(x => x.list.length >= (L.length < E.length ? 1 : 6)).sort((a, b) => sum(b.list, nfDa) - sum(a.list, nfDa));
    const scope = [NF.zone !== "All" ? NF.zone + " zone" : "", NF.st !== "All" ? NF.st : "", NF.band !== "All" ? { lead: "leaders", steady: "steady", lag: "lagging" }[NF.band] : "", fam !== "All" ? FAM[fam] : ""].filter(Boolean).join(" · ");
    $("#view").innerHTML = `<div class="view-in">
      <div class="greet"><div><h1>${greeting()}</h1><p>Here is how ${L.length === E.length ? NRANK : `${L.length} of ${NRANK}`} branches are doing${scope ? ` · <b>${esc(scope)}</b>` : ""} · data to ${esc(X.OV.meta.windows.risk || "Sep 2026")}</p></div>
        <div class="greet-r"><a class="pill-btn" href="#/ask">${icon("ask")}Ask a question</a><a class="pill-btn dark" href="#/opps">${icon("opps")}Where is the money?</a></div></div>
      ${nfBar()}
      <section class="hero"><div class="hero-g">
        <div>
          <div class="eyebrow">Lending branch network · Aug–Oct 2026</div>
          <h1>One Vision<span>Every branch, one honest scorecard — and a consultant's read on what to do next.</span></h1>
          <p class="lede">Sales, credit, operations, insurance, risk and collections joined at branch level for ${NRANK} branches.</p>
          <div class="cta"><a class="btn primary" href="#/pick">Analyse a branch<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></a><a class="btn ghost" href="#/c">Compare two branches</a></div>
          <div style="margin-top:24px"><div class="eyebrow">${fam === "All" ? "Core disbursal" : esc(FAM[fam]) + " disbursal"} by zone · Aug–Sep</div>
            <div class="big" style="color:#fff;margin-top:6px">${X.cr(zt)}</div>
            <div class="zone-bar">${zones.map(z => `<i style="width:${(z.v / zt) * 100}%;background:${ZC[z.z]}"></i>`).join("")}</div>
            ${zones.map(z => `<div class="zl"><i style="background:${ZC[z.z]}"></i><span>${z.z} · ${z.n} branches</span><b>${X.cr(z.v)}</b><span>${pct0(z.v / zt)}</span></div>`).join("")}
          </div>
        </div>
        <div><div class="globe"><div id="globeMap" class="map"></div></div></div>
        <div class="hero-r">
          <div class="kp rk">${ringSVG(appr, C.brand)}<div><div class="t">Approval rate</div><div class="v">${pct1(appr)}</div><div class="c">${f0(dec || 0)} decisions · 13 months${fam !== "All" ? " · " + esc(fam) : ""}</div></div></div>
          <div class="kp rk">${ringSVG(ins, C.peer)}<div><div class="t">New loans insured</div><div class="v">${pct1(ins)}</div><div class="c">${X.cr(N.i_prem_as)} premium · Aug–Sep${fam !== "All" ? " · all products" : ""}</div></div></div>
          <div class="kp rk">${ringSVG((bnc || 0) / 0.15, C.bad, { text: pct1(bnc), fs: 15 })}<div><div class="t">EMI bounce, new loans</div><div class="v">${pct1(bnc)}</div><div class="c">Sep 2026 · ${fam !== "All" ? esc(fam) + " book" : "scored branches"}</div></div></div>
        </div>
      </div></section>
      <div class="land-strip">
        <form class="card ask-mini" id="landAsk"><div><div class="eyebrow">Ask One Vision</div><b>Ask the network a question, get a map back</b></div>
          <div class="ask-box sm"><input placeholder="e.g. UP branches with high bounce but good approval" aria-label="Ask a question"><button>Ask</button></div></form>
        <a class="card opp-mini" href="#/opps"><div class="eyebrow">Opportunity map</div><div class="big" id="oppTot">…<small class="cmp"> /month</small></div><span>of upside if every branch matched its state peers · see where →</span></a>
      </div>
      <div class="g g3">
        <div class="card"><div class="card-h"><h3>Healthiest branches</h3><span class="sub">health score</span></div>${li(top, b => Math.round(b.health))}</div>
        <div class="card"><div class="card-h"><h3>Fastest momentum</h3><span class="sub">sanctions Jul–Sep vs Apr–Jun</span></div>${li(mom, b => X.fmt(MID.mom, b.v.mom))}</div>
        <div class="card"><div class="card-h"><h3>Need attention first</h3><span class="sub">lowest health · ≥ ₹5 Cr</span></div>${li(top.filter(b => b.core_da >= 5).reverse(), b => Math.round(b.health))}</div>
      </div>
      <div class="card"><div class="card-h"><h3>States at a glance</h3><span class="sub">average pillar score of each state's branches (percentile) · click a row to see its branches</span></div><div id="stateHeat" class="chart scroll-x"></div></div>
    </div>`;
    nfBind();
    // globe: hexes shaded by disbursal of the filtered branches, callouts for the four biggest
    const cv = new Map(); for (const b of L) if (b.lat != null) { const k = cellOf(b.lat, b.lon); cv.set(k, (cv.get(k) || 0) + Math.max(0, nfDa(b))); }
    const big = [...L].sort((a, b) => nfDa(b) - nfDa(a)).slice(0, 4).filter(b => b.lat != null);
    hexMap($("#globeMap"), { dark: true, cellVal: cv, minH: 300, cellTip: (k, v) => `<b>${X.cr(v)}</b> ${esc(fn)} disbursal in this hex<br><span class="k">${L.filter(b => b.lat != null && cellOf(b.lat, b.lon) === k).map(b => esc(b.name)).slice(0, 4).join(", ")}</span>`,
      callouts: big.map((b, i) => ({ b, title: b.name, value: X.cr(nfDa(b)), color: [C.peer, "#1baf7a", "#eda100", "#e87ba4"][i] })), label: "India hex map shaded by disbursal" });
    const inL = new Set(L.map(b => b.id));
    setTimeout(() => { const e = $("#oppTot"); if (e) e.firstChild.textContent = X.cr(sum(oppAll().filter(r => inL.has(r.b.id)), r => r.by.all)); }, 60);
    $("#landAsk").onsubmit = e => { e.preventDefault(); const q = e.target.querySelector("input").value.trim(); location.hash = "#/ask" + (q ? "?q=" + encodeURIComponent(q) : ""); };
    heatTable($("#stateHeat"), states.map(x => ({ name: x.s, sub: `${x.list.length} branches`, vals: PILLARS.map(p => avg(x.list.map(b => b.pill[p.id]))), health: avg(x.list.map(b => b.health)), onClick: () => { state.zone = NF.zone; state.st = x.s; location.hash = "#/pick"; } })), [...PILLARS.map(p => p.name), "Health"]);
  }
  function greeting() { const h = new Date().getHours(); return h < 5 ? "Good evening" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; }
  const avg = a => { const v = a.filter(x => x !== null && x !== undefined); return v.length ? sum(v) / v.length : null; };
  function heatTable(el, rows, headers, opt = {}) {
    el.innerHTML = "";
    const W = Math.max(width(el), 640), rh = 34, mg = { t: 34, l: opt.l || 170, r: 8 }, H = mg.t + rows.length * rh + 6;
    const svg = svgIn(el, W, H, "Heat table");
    const cw = (W - mg.l - mg.r) / headers.length;
    const allv = rows.flatMap(r => [...r.vals, r.health]).filter(v => v !== null);
    const lo = opt.domain ? opt.domain[0] : d3.quantile(allv.slice().sort(d3.ascending), 0.05), hi = opt.domain ? opt.domain[1] : d3.quantile(allv.slice().sort(d3.ascending), 0.95);
    const col = d3.scaleSequential(t => (isDark() ? d3.interpolateRgb("#1d2039", "#8d86ff") : d3.interpolateRgb("#f1f0fe", C.deep))(t)).domain([lo, hi]).clamp(true), mid = (lo + hi) / 2;
    headers.forEach((h, j) => svg.append("text").attr("x", mg.l + j * cw + cw / 2).attr("y", 20).attr("text-anchor", "middle").attr("class", "axl").style("font-weight", 600).text(h));
    rows.forEach((r, i) => {
      const y0 = mg.t + i * rh, g = svg.append("g").style("cursor", r.onClick ? "pointer" : null).on("click", () => r.onClick && r.onClick());
      if (r.me) g.append("rect").attr("x", 0).attr("y", y0).attr("width", W).attr("height", rh - 2).attr("rx", 8).attr("fill", "#fde9df");
      g.append("text").attr("x", 8).attr("y", y0 + 15).attr("class", "lbl-b").style("stroke", r.me ? "#fde9df" : "#fff").text(r.name);
      if (r.sub) g.append("text").attr("x", 8).attr("y", y0 + 28).attr("class", "axl").text(r.sub);
      [...r.vals, r.health].forEach((v, j) => {
        g.append("rect").attr("x", mg.l + j * cw + 2).attr("y", y0 + 2).attr("width", cw - 4).attr("height", rh - 6).attr("rx", 7).attr("fill", v === null ? C.soft : col(v))
          .on("mousemove", ev => tip(`<b>${esc(r.name)}</b><br>${headers[j]}: <b>${v === null ? "–" : Math.round(v)}</b>`, ev)).on("mouseleave", untip);
        g.append("text").attr("x", mg.l + j * cw + cw / 2).attr("y", y0 + rh / 2 + 3).attr("text-anchor", "middle").style("font", "600 12px var(--ui)").style("fill", v !== null && v > mid ? "#fff" : C.ink).text(v === null ? "–" : Math.round(v));
      });
    });
  }

  // ------------------------------------------------------------------ picker
  const ZONES = ["All", "North", "South", "West", "East"];
  function renderPick() {
    const states = [...new Set(E.filter(b => state.zone === "All" || b.zone === state.zone).map(b => b.state))].sort();
    if (!states.includes(state.st)) state.st = "All";
    $("#view").innerHTML = `<div class="view-in">
      <div class="sh"><div><h1>Choose a branch <span>· step 1 of 2</span></h1></div></div>
      <div class="pick-controls">
        <div class="seg" id="zoneSeg">${ZONES.map(z => `<button class="${z === state.zone ? "on" : ""}" data-z="${z}">${z}</button>`).join("")}</div>
        <select id="stateSel" aria-label="State"><option value="All">All states</option>${states.map(s => `<option ${s === state.st ? "selected" : ""}>${esc(s)}</option>`).join("")}</select>
        <select id="sortSel" aria-label="Sort"><option value="score">Sort: health score</option><option value="disb">Sort: disbursal</option><option value="name">Sort: name</option></select>
        <input id="pickSearch" type="search" placeholder="Filter by name…" aria-label="Filter by name" value="${esc(state.q)}">
      </div>
      <div class="pick-body"><div class="card pick-list" id="pickList"></div>
        <div class="card pick-map"><div class="card-h"><h3 id="pickMapTitle"></h3><span class="sub" id="pickCount"></span></div><div id="pickMap" class="map"></div><div class="legend">${bandLegend()}</div></div></div></div>`;
    $("#zoneSeg").onclick = e => { const z = e.target.dataset.z; if (!z) return; state.zone = z; state.st = "All"; renderPick(); };
    $("#stateSel").onchange = e => { state.st = e.target.value; renderPick(); };
    $("#sortSel").value = state.sort; $("#sortSel").onchange = e => { state.sort = e.target.value; renderPickList(); };
    $("#pickSearch").oninput = e => { state.q = e.target.value; renderPickList(); };
    renderPickList();
  }
  function renderPickList() {
    const q = state.q.trim().toLowerCase();
    const list = E.filter(b => (state.zone === "All" || b.zone === state.zone) && (state.st === "All" || b.state === state.st) && (!q || (b.name + " " + b.id).toLowerCase().includes(q)));
    list.sort({ score: (a, b) => b.health - a.health, disb: (a, b) => b.core_da - a.core_da, name: (a, b) => a.name.localeCompare(b.name) }[state.sort]);
    $("#pickList").innerHTML = list.length ? list.map(b => `<a class="b-row" data-id="${esc(b.id)}" href="#/b/${encodeURIComponent(b.id)}/overview">
      <span class="score-dot ${b.band.id}">${Math.round(b.health)}</span><span><b>${esc(b.name)}</b><small>${esc(b.state)} · ${esc(b.zone)} · #${b.rank} of ${NRANK}</small></span>
      <span class="r"><b>${X.cr(b.core_da)}</b><br>${b.band.icon} ${b.band.name}</span></a>`).join("") : `<div class="empty">No branches match these filters.</div>`;
    $("#pickCount").textContent = `${list.length} of ${E.length} branches`;
    $("#pickMapTitle").textContent = state.st !== "All" ? state.st : state.zone !== "All" ? state.zone + " zone" : "All India";
    const on = new Set(list.map(b => b.id));
    const m = hexMap($("#pickMap"), { branches: E, isOn: b => on.has(b.id), fill: b => BANDC[b.band.id], minH: 480 });
    $("#pickList").onmouseover = e => { const r = e.target.closest(".b-row"); m.sel.attr("stroke", b => (r && b.id === r.dataset.id ? C.ink : "#fff")).attr("stroke-width", b => (r && b.id === r.dataset.id ? 2.5 : on.has(b.id) ? 1 : 0.4)); };
  }

  // ------------------------------------------------------------------ branch shell
  let CUR = null;
  function renderBranch() {
    const b = byId[state.id];
    if (!b) { location.hash = "#/pick"; return; }
    const P = X.peers(b, state.peer); CUR = { b, P };
    const rk = X.rankIn(b, P.list), i = SECS.findIndex(s => s.id === state.sec), sec = SECS[i] || SECS[0];
    document.title = `${b.name} · ${sec.name} · One Vision`;
    const prev = SECS[i - 1], next = SECS[i + 1], link = s => `#/b/${encodeURIComponent(b.id)}/${s.id}`;
    $("#view").innerHTML = `<div class="view-in">
      <div class="bh">${ringSVG(b.health / 100, BANDC[b.band.id], { track: "rgba(28,29,58,.08)", ink: C.ink, text: Math.round(b.health), fs: 26, w: 7, cls: "ring", data: { ring: b.health / 100, num: b.health, w: 7, from: LAST_H === null ? undefined : LAST_H / 100 } })}<button class="how how-w" data-how="health" title="How is the health score calculated?" aria-label="How is the health score calculated?">ⓘ</button>
        <div><h2>${esc(b.name)}</h2><div class="meta">${esc(b.zone)} zone · ${esc(b.state)} · local market ${esc(b.mk_name)}</div></div>
        <div class="chips"><span class="chip">${b.band.icon} <b>${b.band.name}</b></span><span class="chip">#<b>${b.rank}</b> of ${NRANK} nationally</span><span class="chip">#<b>${rk.r}</b> of ${rk.n} · ${esc(P.name)}</span><span class="chip"><b>${X.cr(b.core_da)}</b> core disbursal</span><a class="chip chip-btn" href="${cHash(b.id, null, "summary")}">⇄ Compare</a></div></div>
      <div class="sh"><div><h1>${sec.name}</h1></div><div class="pager">${prev ? `<a href="${link(prev)}">← ${prev.name}</a>` : ""}${next ? `<a href="${link(next)}">${next.name} →</a>` : `<button class="ghost-btn" onclick="window.print()">Print / save PDF</button>`}</div>
        <div class="ins" id="insight"></div></div>
      ${HERO[sec.id] ? HERO[sec.id](b, P) : ""}<div id="sec"></div></div>`;
    (SEC[sec.id] || SEC.overview)(b, P, $("#sec"));
    LAST_H = b.health;
  }
  const setInsight = html => { $("#insight").innerHTML = html; };

  // =================================================================== SECTIONS
  const SEC = {};

  // ---------------- overview
  SEC.overview = (b, P, el) => {
    const s = X.swot(b, P), ge = X.geCell(b), vd = X.verdict(b, P);
    const pp = peerPillars(P), opp = sum(s.O.filter(o => o.unit === "/month"), o => o.val);
    const v = id => b.v[id], pv = id => X.peerValue(MID[id], P);
    setInsight(`<b>${esc(b.name)}</b> is a <b>${b.band.name.toLowerCase()}</b> branch: healthier than ${Math.round(b.health)}% of the network. It is strongest on <b>${vd.best ? vd.best.name.toLowerCase() : "–"}</b> and weakest on <b>${vd.worst ? vd.worst.name.toLowerCase() : "–"}</b>; the GE–McKinsey call is <b>${ge.verdict.toLowerCase()}</b>${opp > 0 ? `, with about <b>${X.cr(opp)} a month</b> of sized upside` : ""}.`);
    el.innerHTML = `
      <div class="g g-ov">
        <div class="card"><div class="card-h"><h3>Health, pillar by pillar</h3><span class="sub">percentile vs network</span></div>
          <div id="mring" class="chart" style="display:grid;place-items:center"></div>
          <div class="hr-head"><span></span><span>Pillar</span><span>Branch</span><span>Peers</span><span></span></div>
          <div class="hr-leg">${PILLARS.map(p => `<div class="hr-row"><i style="border-color:${PILC[p.id]}"></i><span class="n">${p.name}${p.w ? "" : " (context)"}</span><span class="a">${b.pill[p.id] === null ? "–" : Math.round(b.pill[p.id])}</span><span class="p">${pp[p.id] === null ? "–" : Math.round(pp[p.id])}</span><span class="bar"><s style="width:${b.pill[p.id] || 0}%;background:${PILC[p.id]}"></s></span></div>`).join("")}</div></div>
        <div class="card" style="display:flex;flex-direction:column"><div class="card-h"><h3>Where it sits</h3><span class="sub">${esc(P.name)} highlighted</span></div><div id="ovMap" class="map"></div></div>
        <div class="card"><div class="card-h"><h3>The verdict</h3></div>
          <div class="stat"><div class="l">GE–McKinsey call</div><div class="v t">${ge.verdict}</div></div>
          <div class="stat"><div class="l">Upside on the table</div><div class="v">${opp > 0 ? X.cr(opp) : "–"}<small class="cmp"> /month · ${s.O.length} moves</small></div></div>
          <div class="stat"><div class="l">Early warnings firing</div><div class="v">${s.T.length}</div><div class="cmp">${s.T.length ? esc(s.T.map(t => t.title).join(" · ")) : "none"}</div></div>
          <div class="stat"><div class="l">Sanction momentum</div><div class="v">${X.fmt(MID.mom, v("mom"))}</div><div>${deltaTxt(v("mom"), pv("mom"), 1, "pct")} <span class="cmp">vs ${X.fmt(MID.mom, pv("mom"))} peers</span></div></div>
        </div>
      </div>
      <div class="g g4">
        ${ringCard("Approval rate", v("appr"), pv("appr"), 1, C.brand, "13 months of decisions")}
        ${ringCard("Insurance attach", v("attach"), pv("attach"), 1, C.peer, "loans disbursed Aug–Sep")}
        ${ringCard("Docket first-time-right", v("ftr"), pv("ftr"), 1, "#1baf7a", "HL & MSME dockets")}
        ${ringCard("Book with CIBIL > 730", v("cibil"), pv("cibil"), 1, "#e87ba4", "share of AUM, Sep")}
      </div>
      <div class="card" style="margin-bottom:18px"><div class="card-h"><h3>Sanctions, month by month</h3><span class="sub">Nov 2025 – Sep 2026 · indigo = above its own average</span></div>
        <div style="display:flex;gap:28px;align-items:flex-end;flex-wrap:wrap;margin-bottom:6px"><div><div class="cmp">Sanctioned, 11 months</div><div class="big">${X.cr(sum(X.FULL, m => b["cm_sa_" + m] || 0))}</div></div>
        <div><div class="cmp">Sanctions</div><div class="big" style="font-size:24px">${f0(sum(X.FULL, m => b["cm_san_" + m] || 0))}</div></div>
        <div><div class="cmp">Jul–Sep vs Apr–Jun</div><div class="big" style="font-size:24px">${X.fmt(MID.mom, v("mom"))}</div></div></div>
        <div id="ovStrip" class="chart"></div></div>
      <div class="card"><div class="card-h"><h3>SWOT at a glance</h3><a class="sub" href="#/b/${encodeURIComponent(b.id)}/strategy">open strategy lenses →</a></div>
        <div class="swot-mini">${[["S", "Strength", C.good, s.S[0] && { t: s.S[0].title, p: s.S[0].text }], ["W", "Weakness", C.bad, s.W[0] && { t: s.W[0].title, p: s.W[0].text }],
          ["O", "Opportunity", C.brand, s.O[0] && { t: s.O[0].title + " · " + X.cr(s.O[0].val) + s.O[0].unit, p: s.O[0].text }], ["T", "Threat", C.ink, s.T[0] && { t: s.T[0].title, p: s.T[0].text }]]
          .map(([k, n, c, x]) => `<a class="sm" href="#/b/${encodeURIComponent(b.id)}/strategy"><span class="k" style="background:${c}">${k}</span><b>${x ? esc(x.t) : "Nothing flagged"}</b><p>${x ? esc(x.p) : `No ${n.toLowerCase()} stands out against ${esc(P.name)}.`}</p></a>`).join("")}</div></div>`;
    multiRing($("#mring"), PILLARS.map(p => ({ name: p.name, val: b.pill[p.id], peer: pp[p.id], color: PILC[p.id], note: p.w ? `${p.w * 100}% of health · ${p.src}` : "context only" })), { top: "HEALTH", big: Math.round(b.health), sub: `#${b.rank} of ${NRANK}` });
    const ids = new Set(P.list.map(x => x.id));
    hexMap($("#ovMap"), { branches: E, isOn: x => ids.has(x.id), fill: x => (x.id === b.id ? C.brand : ids.has(x.id) ? "#8c86f5" : C.nat), r: (x, rs) => (ids.has(x.id) ? 3.2 : 1.6), minH: 300,
      callouts: [{ b, title: b.name, value: X.cr(b.core_da) + " · health " + Math.round(b.health), color: C.brand, big: true }] });
    const xs = X.FULL, vals = xs.map(m => b["cm_sa_" + m] || 0), mean = sum(vals) / vals.length;
    vbars($("#ovStrip"), xs, [{ name: "Sanctioned ₹", c: C.brand, v: vals, colorAt: i => (vals[i] >= mean ? C.brand : "#c9c6fb") }],
      { h: 200, xf: MON, yf: d => "₹" + d, tf: v => X.cr(v), label: "Monthly sanctioned amount", extra: i => `<br><span class="k">${f0(b["cm_san_" + xs[i]] || 0)} sanctions · ${f0(b["cm_dec_" + xs[i]] || 0)} decisions</span>` });
  };
  function peerPillars(P) {
    const out = {};
    for (const Pi of PILLARS) out[Pi.id] = avg(M.filter(m => m.p === Pi.id).map(m => X.pctOf(m, m.level ? X.peerValue(m, P) : X.value(m, P.agg))));
    return out;
  }

  // ---------------- scorecard
  SEC.scorecard = (b, P, el) => {
    const ws = PILLARS.filter(p => p.w && b.pill[p.id] !== null), wsum = sum(ws, p => p.w), pp = peerPillars(P);
    const best = M.filter(m => b.pct[m.id] !== null && m.p !== "market").sort((x, y) => b.pct[y.id] - b.pct[x.id]);
    setInsight(`Its best metric is <b>${best[0].label.toLowerCase()}</b> (better than ${Math.round(b.pct[best[0].id])}% of branches) and its weakest is <b>${best[best.length - 1].label.toLowerCase()}</b> (${Math.round(b.pct[best[best.length - 1].id])}). The five weighted pillars blend to ${Math.round(b.composite)}, which ranks it <b>#${b.rank} of ${NRANK}</b>.`);
    el.innerHTML = `<div class="g g2">
      <div class="card" style="position:sticky;top:84px;align-self:start"><div class="card-h"><h3>Shape of the branch</h3>${LEG(b, P)}</div><div id="radar" class="chart"></div>
        <h4 style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin:10px 0 6px">How the score is built</h4>
        <div class="hr-head" style="grid-template-columns:140px minmax(0,1fr) 40px 50px"><span>Pillar · weight</span><span></span><span style="text-align:right">Score</span><span style="text-align:right">Adds</span></div>
        ${ws.map(p => { const sc = b.pill[p.id]; return `<div class="hr-row" style="grid-template-columns:140px minmax(0,1fr) 40px 50px;padding:6px 0"><span class="n">${p.name}<span class="cmp"> · ${Math.round((p.w / wsum) * 100)}%</span></span><span class="bar" style="height:8px"><s style="width:${sc}%;background:${PILC[p.id]}"></s><s style="left:calc(${pp[p.id] ?? 0}% - 1px);width:2px;background:${C.peer};top:-4px;bottom:-4px"></s></span><span class="a">${Math.round(sc)}</span><span class="p" style="color:var(--ink2)">+${((sc * p.w) / wsum).toFixed(1)}</span></div>`; }).join("")}
        <p class="note">Orange tick = ${esc(P.name)}. The weighted blend (${Math.round(b.composite)}) is re-ranked across ${NRANK} branches to give the health score ${Math.round(b.health)}.</p></div>
      <div class="card"><div class="card-h"><h3>Every metric behind the score</h3><span class="sub">value · peers · percentile</span></div><div id="metricTable"></div></div></div>`;
    radar($("#radar"), b, P, pp); metricTable($("#metricTable"), b, P);
  };
  function radar(el, b, P, pp) {
    el.innerHTML = "";
    const W = Math.min(width(el), 540), H = W * 0.84, R = W * 0.3, cx = W / 2, cy = H / 2 + 4, n = PILLARS.length;
    const ang = i => -Math.PI / 2 + (i * 2 * Math.PI) / n, pt = (i, v) => [cx + Math.cos(ang(i)) * R * (v / 100), cy + Math.sin(ang(i)) * R * (v / 100)];
    const svg = svgIn(el, W, H, "Radar of pillar percentiles");
    for (const v of [25, 50, 75, 100]) svg.append("polygon").attr("points", PILLARS.map((_, i) => pt(i, v)).join(" ")).attr("fill", v === 100 ? C.soft : "none").attr("stroke", v === 50 ? C.nat : C.line).attr("stroke-dasharray", v === 50 ? "4 3" : null);
    PILLARS.forEach((Pi, i) => {
      svg.append("line").attr("x1", cx).attr("y1", cy).attr("x2", pt(i, 100)[0]).attr("y2", pt(i, 100)[1]).attr("stroke", C.line);
      const [lx, ly] = pt(i, 124), anchor = Math.abs(lx - cx) < 8 ? "middle" : lx > cx ? "start" : "end";
      const t = svg.append("text").attr("x", lx).attr("y", ly).attr("text-anchor", anchor).attr("class", "lbl-b").text(Pi.name);
      t.append("tspan").attr("x", lx).attr("dy", 15).attr("class", "axl").text(b.pill[Pi.id] === null ? "no data" : `${Math.round(b.pill[Pi.id])} · peers ${pp[Pi.id] === null ? "–" : Math.round(pp[Pi.id])}`);
    });
    const poly = (vals, color, fill) => svg.append("polygon").attr("points", PILLARS.map((Pi, i) => pt(i, vals[Pi.id] ?? 0)).join(" ")).attr("fill", fill ? color : "none").attr("fill-opacity", fill ? 0.18 : 0).attr("stroke", color).attr("stroke-width", 2).attr("stroke-linejoin", "round");
    poly(pp, C.peer, false); poly(b.pill, C.brand, true);
    PILLARS.forEach((Pi, i) => { if (b.pill[Pi.id] === null) return; const [x, y] = pt(i, b.pill[Pi.id]); svg.append("circle").attr("cx", x).attr("cy", y).attr("r", 5).attr("fill", C.brand).attr("stroke", "#fff").attr("stroke-width", 2)
      .on("mousemove", ev => tip(`<b>${Pi.name}</b> <span class="k">(${Pi.src})</span><br>Branch <b>${Math.round(b.pill[Pi.id])}</b> · peers ${pp[Pi.id] === null ? "–" : Math.round(pp[Pi.id])}`, ev)).on("mouseleave", untip); });
  }
  function metricTable(el, b, P) {
    let h = `<table class="mtab"><tbody>`;
    for (const Pi of PILLARS) {
      h += `<tr class="ph"><td colspan="5"><span style="color:${PILC[Pi.id]}">●</span> ${Pi.name}${Pi.w ? "" : " · context"} <span style="font-weight:400;letter-spacing:0;text-transform:none">· ${Pi.src}</span></td></tr>`;
      for (const m of M.filter(m => m.p === Pi.id)) {
        const v = b.v[m.id], p = b.pct[m.id], pv = X.peerValue(m, P), pp = X.pctOf(m, m.level ? pv : X.value(m, P.agg));
        h += `<tr data-m="${m.id}"><td class="nm">${m.label}<small>${m.sub}</small></td><td class="val">${X.fmt(m, v)}</td><td class="peer">${X.fmt(m, pv)}</td>
          <td><div class="pbar">${p === null ? "" : `<i style="width:${p}%;background:${PILC[Pi.id]}"></i>`}${pp === null ? "" : `<b style="left:calc(${pp}% - 1px)"></b>`}</div></td><td class="pn">${p === null ? "–" : Math.round(p)}</td></tr>`;
      }
    }
    el.innerHTML = h + `</tbody></table><p class="note">Orange = ${esc(P.name)}. Rates are pulled toward the network average in proportion to volume, so a branch with a handful of loans can't top the table on luck.</p>`;
    el.onmousemove = ev => { const r = ev.target.closest("tr[data-m]"); if (!r) return untip(); const m = MID[r.dataset.m]; tip(`<b>${m.label}</b><br>Branch: <b>${X.fmt(m, b.v[m.id])}</b> — better than ${b.pct[m.id] === null ? "–" : Math.round(b.pct[m.id])}% of branches<br>${esc(P.name)}: ${X.fmt(m, X.peerValue(m, P))}<br>Network median: ${X.fmt(m, X.quantile(m, 0.5))}`, ev); };
    el.onmouseleave = untip;
    el.onclick = ev => { const r = ev.target.closest("tr[data-m]"); if (r) { untip(); openHow("metric:" + r.dataset.m); } };
    el.querySelector(".note").insertAdjacentHTML("beforeend", " Click any row to see the calculation.");
  }

  // ---------------- sales
  SEC.sales = (b, P, el) => {
    const A = P.agg, n = Math.max(1, P.others.length);
    const conv = rt(b.core_da, b.core_la), pconv = rt(A.core_da, A.core_la);
    const chB = X.shares(b, "sch_la_", X.CHANNELS), top = Object.entries(chB).sort((a, c) => c[1] - a[1])[0];
    const mixB = X.shares(b, "sf_da_", CORE, b.core_da), mixP = X.shares(A, "sf_da_", CORE, A.core_da);
    const lead = CORE.slice().sort((x, y) => mixB[y] - mixB[x])[0];
    const tk = rt(b.core_da * 100, b.core_dn), ptk = rt(A.core_da * 100, A.core_dn);
    const chg = (k) => rt(b[k + "_9"] - b[k + "_8"], b[k + "_8"]);
    setInsight(`It turned <b>${pct0(conv)}</b> of the ₹ it logged in into disbursal (peers ${pct0(pconv)}). <b>${FAM[lead]}</b> is ${pct0(mixB[lead])} of its core book, and <b>${top ? (top[0] === "Self" ? "walk-ins" : top[0]) : "–"}</b> brings ${pct0(top ? top[1] : 0)} of logins. Disbursal moved <b>${chg("s_da") === null ? "–" : (chg("s_da") >= 0 ? "+" : "") + pct0(chg("s_da"))}</b> from August to September.`);
    el.innerHTML = `<div class="g g-12">
      <div class="card"><div class="card-h"><h3>Pipeline funnel</h3><span class="sub">Aug–Sep · all products</span></div><div id="funnel"></div></div>
      <div class="card"><div class="card-h"><h3>August vs September</h3>${legend([["#c9c6fb", "August"], [C.brand, "September"]])}</div><div id="augsep" class="chart"></div></div></div>
      <div class="g g2">
      <div class="card"><div class="card-h"><h3>Product mix</h3><span class="sub">core disbursal Aug–Sep · black tick = peers' share</span></div><div id="mix"></div></div>
      <div class="card"><div class="card-h"><h3>Where logins come from</h3><span class="sub">share of ₹ logged in</span></div><div id="chan" class="chart"></div><div id="chanLeg" style="margin-top:8px"></div></div></div>
      <div class="g g3">
        <div class="card"><div class="cmp">Average ticket (core)</div><div class="big">${tk === null ? "–" : "₹" + f1(tk) + " L"}</div><div>${deltaTxt(tk, ptk, 1)} <span class="cmp">vs ₹${ptk === null ? "–" : f1(ptk)} L peers</span></div></div>
        <div class="card"><div class="cmp">Processing fee per ₹100 disbursed</div><div class="big">₹${f1(rt(b.s_pf * 100, b.s_da) || 0)}</div><div>${deltaTxt(rt(b.s_pf * 100, b.s_da), rt(A.s_pf * 100, A.s_da), 1)} <span class="cmp">vs ₹${f1(rt(A.s_pf * 100, A.s_da) || 0)} peers</span></div></div>
        <div class="card"><div class="cmp">Loans disbursed (core) · Aug–Sep</div><div class="big">${f0(b.core_dn)}</div><div class="cmp">avg peer branch ${f0(A.core_dn / n)}</div></div></div>`;
    // funnel
    const st = [["Logged in", b.s_la, b.s_lc, "logins"], ["Sanctioned", b.s_sa, b.s_sc, "sanctions"], ["Disbursed", b.s_da, b.s_dn, "loans"]];
    const pst = [A.s_la, A.s_sa, A.s_da];
    $("#funnel").innerHTML = `<div class="fun">${st.map(([k, v, c, u], i) => `<div class="fun-row"><div class="lab">${k}<b>${X.cr(v)}</b></div>
      <div class="barw"><div class="bar" style="width:${Math.max(42, Math.sqrt(v / (st[0][1] || 1)) * 100)}%;background:${["#c9c6fb", "#8c86f5", C.brand][i]}">${f0(c)} ${u}</div></div>
      <div class="cv">${i ? `<b>${pct0(rt(v, st[i - 1][1]))}</b>of previous · peers ${pct0(rt(pst[i], pst[i - 1]))}` : `<b>100%</b>of ₹ logged in`}</div></div>`).join("")}</div>
      <p class="note">Disbursals in a month can come from earlier sanctions, so stage ratios are flow ratios, not cohort conversion.</p>`;
    vbars($("#augsep"), ["Logged in", "Sanctioned", "Disbursed"], [{ name: "August", c: "#c9c6fb", v: [b.s_la_8, b.s_sa_8, b.s_da_8] }, { name: "September", c: C.brand, v: [b.s_la_9, b.s_sa_9, b.s_da_9] }],
      { h: 250, yf: d => "₹" + d, tf: v => X.cr(v), labels: (v, i, si) => (si ? (() => { const a = [b.s_la_8, b.s_sa_8, b.s_da_8][i]; return a > 0 ? (v >= a ? "+" : "−") + Math.abs(((v - a) / a) * 100).toFixed(0) + "%" : ""; })() : "") });
    const mx = Math.max(...CORE.map(f => Math.max(mixB[f], mixP[f]))) || 1;
    $("#mix").innerHTML = pills(CORE.filter(f => mixB[f] > 0.001 || mixP[f] > 0.02).sort((x, y) => mixB[y] - mixB[x]).map(f => ({ k: FAM[f], v: mixB[f], p: mixP[f], c: FAMC[f], label: X.cr(b["sf_da_" + f]), sub: `${pct0(mixB[f])} · peers ${pct0(mixP[f])}` })), mx);
    const chs = X.CHANNELS.filter(c => (b["sch_la_" + c] || 0) + (A["sch_la_" + c] || 0) > 0), chc = ["#5048e5", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#2a8fd6", "#8c86f5", "#f4a27c", "#a3a5bd"];
    stack100($("#chan"), [{ name: b.name, me: true, parts: Object.fromEntries(chs.map(c => [c, b["sch_la_" + c]])) }, { name: "Peers", parts: Object.fromEntries(chs.map(c => [c, A["sch_la_" + c]])) }], chs, chs.map(c => chc[X.CHANNELS.indexOf(c)]), { vf: v => X.cr(v), l: 120 });
    $("#chanLeg").innerHTML = legend(chs.map(c => [chc[X.CHANNELS.indexOf(c)], c === "Self" ? "Self / walk-in" : c, "sq"]));
  };

  // ---------------- credit
  SEC.credit = (b, P, el) => {
    const A = P.agg, xs = X.FULL;
    const ap = rt(b.c_san, b.c_dec), app = rt(A.c_san, A.c_dec);
    const rej = X.OV.meta.rej.map(r => [r, b["cr_" + r] || 0]).sort((x, y) => y[1] - x[1]);
    const rejTot = sum(rej, r => r[1]);
    setInsight(`It approved <b>${pct1(ap)}</b> of ${f0(b.c_dec)} decided applications over 13 months (peers ${pct1(app)}). ${rejTot ? `The top reason for saying no is <b>${esc(rej[0][0].toLowerCase())}</b> (${pct0(rej[0][1] / rejTot)} of rejections). ` : ""}${pct0(rt(b.c_booked, b.c_san))} of its sanctions became loans, against ${pct0(rt(A.c_booked, A.c_san))} for peers.`);
    el.innerHTML = `<div class="g g-21">
      <div class="card"><div class="card-h"><h3>Decisions per month</h3>${legend([[C.brand, "Sanctioned", "sq"], ["#d9dbef", "Rejected / other", "sq"]])}</div><div id="decBars" class="chart"></div>
        <div class="card-h" style="margin:8px 0 0"><h3 style="font-size:13px">Approval rate</h3>${LEG(b, P)}</div><div id="apprLine" class="chart"></div></div>
      <div class="card"><div class="card-h"><h3>What happened to applications</h3><span class="sub">13 months</span></div><div id="outDonut" class="chart" style="display:grid;place-items:center"></div><div id="outLeg"></div></div></div>
      <div class="g g2">
        <div class="card"><div class="card-h"><h3>Approval by product</h3>${LEG(b, P)}</div><div id="apProd" class="chart"></div></div>
        <div class="card"><div class="card-h"><h3>Approval by source & customer</h3>${LEG(b, P)}</div><div id="apSrc" class="chart"></div></div></div>
      <div class="g g2">
        <div class="card"><div class="card-h"><h3>Why loans are turned down</h3><span class="sub" id="rejNote"></span></div><div id="rejPar" class="chart"></div></div>
        <div class="card"><div class="card-h"><h3>After the sanction</h3><span class="sub">share of sanctions</span></div><div id="after" class="chart"></div>${legend([[C.brand, "Became a loan", "sq"], ["#eda100", "Awaiting", "sq"], [C.bad, "Lapsed / cancelled", "sq"]])}</div></div>`;
    const sanc = xs.map(m => b["cm_san_" + m] || 0), dec = xs.map(m => b["cm_dec_" + m] || 0);
    // stacked: sanctioned + rest
    const el1 = $("#decBars"); el1.innerHTML = "";
    { const W = width(el1), H = 190, mg = { t: 10, r: 18, b: 24, l: 44 }, svg = svgIn(el1, W, H, "Decisions per month");
      const x = d3.scaleBand().domain(xs).range([mg.l, W - mg.r]).padding(0.3), y = d3.scaleLinear().domain([0, (d3.max(dec) || 1) * 1.1]).range([H - mg.b, mg.t]).nice();
      svg.append("g").attr("class", "gridl").selectAll("line").data(y.ticks(4)).join("line").attr("x1", mg.l).attr("x2", W - mg.r).attr("y1", d => y(d)).attr("y2", d => y(d));
      svg.append("g").attr("class", "ax").attr("transform", `translate(${mg.l},0)`).call(d3.axisLeft(y).ticks(4).tickSizeOuter(0)).select(".domain").remove();
      svg.append("g").attr("class", "ax").attr("transform", `translate(0,${H - mg.b})`).call(d3.axisBottom(x).tickFormat(MON).tickSizeOuter(0));
      xs.forEach((m, i) => {
        svg.append("rect").attr("x", x(m)).attr("width", x.bandwidth()).attr("y", y(dec[i])).attr("height", y(0) - y(dec[i])).attr("rx", 5).attr("fill", "#d9dbef");
        svg.append("rect").attr("x", x(m)).attr("width", x.bandwidth()).attr("y", y(sanc[i])).attr("height", y(0) - y(sanc[i])).attr("rx", 5).attr("fill", C.brand);
        svg.append("rect").attr("x", x(m) - 3).attr("width", x.bandwidth() + 6).attr("y", mg.t).attr("height", H - mg.t - mg.b).attr("fill", "transparent")
          .on("mousemove", ev => tip(`<b>${MON(m)}</b><br>${f0(dec[i])} decisions · <b>${f0(sanc[i])}</b> sanctioned<br><span class="k">${X.cr(b["cm_sa_" + m] || 0)} sanctioned</span>`, ev)).on("mouseleave", untip);
      }); }
    lineChart($("#apprLine"), [{ name: P.name, c: C.peer, v: xs.map(m => rt(A["cm_san_" + m], A["cm_dec_" + m])) }, { name: b.name, c: C.brand, w: 2.5, v: xs.map(m => (b["cm_dec_" + m] >= 5 ? rt(b["cm_san_" + m], b["cm_dec_" + m]) : null)) }], xs,
      { h: 150, label: "Approval rate by month", xf: MON, yf: d => (d * 100).toFixed(0) + "%", tf: pct1, domain: [0, null].map((v, i) => (i ? 0.8 : 0)) });
    const out = [{ k: "Sanctioned", v: b.c_san, c: C.brand }, { k: "Auto-rejected by system", v: b.c_gated, c: "#8c86f5" }, { k: "Declined by underwriter", v: b.c_declined, c: C.peer }, { k: "Cancelled", v: b.c_cancelled, c: "#d9dbef" }];
    donut($("#outDonut"), out, { big: pct0(ap), sub: "approved" }, { label: "Application outcomes" });
    $("#outLeg").innerHTML = legendRows(out, sum(out, d => d.v));
    dumbbell($("#apProd"), CORE.map(f => ({ k: FAM[f], a: b["cf_dec_" + f] >= 15 ? rt(b["cf_san_" + f], b["cf_dec_" + f]) : null, b: A["cf_dec_" + f] >= 15 ? rt(A["cf_san_" + f], A["cf_dec_" + f]) : null, na: b["cf_dec_" + f] })), { unit: "decisions", domain: [0, 1] });
    dumbbell($("#apSrc"), [...["DSA", "Connector", "CSC", "Others"].map(s => ({ k: s === "Others" ? "Other sources" : s, a: b["cs_dec_" + s] >= 15 ? rt(b["cs_san_" + s], b["cs_dec_" + s]) : null, b: A["cs_dec_" + s] >= 15 ? rt(A["cs_san_" + s], A["cs_dec_" + s]) : null, na: b["cs_dec_" + s] })),
      { k: "Salaried", a: b.co_dec_Sal >= 15 ? rt(b.co_san_Sal, b.co_dec_Sal) : null, b: rt(A.co_san_Sal, A.co_dec_Sal), na: b.co_dec_Sal }, { k: "Self-employed", a: b.co_dec_SE >= 15 ? rt(b.co_san_SE, b.co_dec_SE) : null, b: rt(A.co_san_SE, A.co_dec_SE), na: b.co_dec_SE }], { unit: "decisions", domain: [0, 1] });
    $("#rejNote").textContent = renderPareto($("#rejPar"), rej, "rejections") || "";
    const aw = (o) => Math.max(0, o.c_san - o.c_booked - o.c_lapsed);
    stack100($("#after"), [{ name: b.name, me: true, parts: { "Became a loan": b.c_booked, Awaiting: aw(b), "Lapsed / cancelled": b.c_lapsed } }, { name: "Peers", parts: { "Became a loan": A.c_booked, Awaiting: aw(A), "Lapsed / cancelled": A.c_lapsed } }], ["Became a loan", "Awaiting", "Lapsed / cancelled"], [C.brand, "#eda100", C.bad], { vf: v => f0(v) + " sanctions" });
  };

  // ---------------- operations
  const OM = ["2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"];
  SEC.ops = (b, P, el) => {
    const A = P.agg;
    if ((b.o_loans || 0) < 5) { setInsight(`Operations data covers housing and MSME dockets only, and ${esc(b.name)} has ${f0(b.o_loans || 0)} of them, too few to read.`); el.innerHTML = `<div class="card empty">Not enough HL / MSME dockets at this branch for an operations view.</div>`; return; }
    const ftr = rt(b.o_ftr, b.o_loans), pftr = rt(A.o_ftr, A.o_loans);
    const q = X.OV.meta.qreasons.map(r => [r, b["oq_" + r] || 0]).sort((x, y) => y[1] - x[1]);
    setInsight(`<b>${pct0(ftr)}</b> of its ${f0(b.o_loans)} HL &amp; MSME dockets went through first time right (peers ${pct0(pftr)}). ${q[0][1] ? `The most common query is <b>${esc(q[0][0].toLowerCase())}</b>. ` : ""}It takes <b>${f1(rt(b.o_tat, b.o_tatn) || 0)} days</b> on average from docket login to loan number (peers ${f1(rt(A.o_tat, A.o_tatn) || 0)}).`);
    el.innerHTML = `<div class="g g4">
      ${ringCard("Docket first-time-right", ftr, pftr, 1, "#1baf7a", f0(b.o_loans) + " dockets")}
      ${ringCard("Loan no. within 3 days", rt(b.o_tat3, b.o_tatn), rt(A.o_tat3, A.o_tatn), 1, C.brand, "login → LAN")}
      ${ringCard("Digital e-sign", rt(b.o_esd, b.o_esn), rt(A.o_esd, A.o_esn), 1, "#2a8fd6", "of signed dockets")}
      ${ringCard("e-NACH registered", rt(b.o_enr, b.o_ena), rt(A.o_enr, A.o_ena), 1, C.peer, "where applicable")}</div>
      <div class="g g2">
        <div class="card"><div class="card-h"><h3>First-time-right by month</h3>${LEG(b, P)}</div><div id="ftrLine" class="chart"></div></div>
        <div class="card"><div class="card-h"><h3>Why dockets get queried</h3><span class="sub" id="qNote"></span></div><div id="qPar" class="chart"></div></div></div>
      <div class="g g4">
        <div class="card"><div class="cmp">Avg days, login → loan no.</div><div class="big">${f1(rt(b.o_tat, b.o_tatn) || 0)}</div><div>${deltaTxt(rt(b.o_tat, b.o_tatn), rt(A.o_tat, A.o_tatn), -1)} <span class="cmp">vs ${f1(rt(A.o_tat, A.o_tatn) || 0)} peers</span></div></div>
        <div class="card"><div class="cmp">Documents still pending</div><div class="big">${f0(b.o_docp)}</div><div class="cmp">of ${f0(b.o_docs)} tracked (${pct1(rt(b.o_docp, b.o_docs))})</div></div>
        <div class="card"><div class="cmp">Overdue past due date</div><div class="big" style="color:${b.o_doco ? C.bad : C.ink}">${f0(b.o_doco)}</div><div>${deltaTxt(rt(b.o_doco, b.o_docs), rt(A.o_doco, A.o_docs), -1, "pts")} <span class="cmp">share vs peers</span></div></div>
        <div class="card"><div class="cmp">Overdue by 90+ days</div><div class="big" style="color:${b.o_doc90 ? C.bad : C.ink}">${f0(b.o_doc90)}</div><div class="cmp">as of 14 Oct 2026</div></div></div>`;
    lineChart($("#ftrLine"), [{ name: P.name, c: C.peer, v: OM.map(m => rt(A["om_f_" + m], A["om_n_" + m])) }, { name: b.name, c: C.brand, w: 2.5, area: true, v: OM.map(m => (b["om_n_" + m] >= 3 ? rt(b["om_f_" + m], b["om_n_" + m]) : null)) }], OM,
      { h: 240, label: "First-time-right by month", xf: MON, yf: d => (d * 100).toFixed(0) + "%", tf: pct0, domain: [0, 1], extra: i => `<br><span class="k">${f0(b["om_n_" + OM[i]] || 0)} dockets at the branch</span>` });
    $("#qNote").textContent = renderPareto($("#qPar"), q, "queries") || "";
  };

  // ---------------- insurance
  const ITYPES = ["Life", "Health", "General", "PA", "Motor", "Other"], ITC = ["#5048e5", "#1baf7a", "#2a8fd6", "#eda100", "#eb6834", "#e87ba4"];
  SEC.insurance = (b, P, el) => {
    const A = P.agg, att = X.value(MID.attach, b, false), patt = X.value(MID.attach, A, false);
    const tot = sum(ITYPES, t => b["ip_" + t] || 0), ptot = sum(ITYPES, t => A["ip_" + t] || 0);
    const lead = ITYPES.slice().sort((x, y) => (b["ip_" + y] || 0) - (b["ip_" + x] || 0))[0];
    setInsight(`<b>${pct0(att)}</b> of the loans it disbursed in Aug–Sep carry insurance (peers ${pct0(patt)}), earning ₹${f1(rt(b.i_prem_as * 100, b.core_da) || 0)} of premium per ₹100 lent. ${tot ? `<b>${lead}</b> cover brings ${pct0((b["ip_" + lead] || 0) / tot)} of its premium` : ""}${tot && ptot ? ` (peers ${pct0((A["ip_" + lead] || 0) / ptot)})` : ""}.`);
    el.innerHTML = `<div class="g g4">
      ${ringCard("Insurance attach rate", att, patt, 1, C.peer, "Aug–Sep disbursals")}
      <div class="card"><div class="cmp">Premium per ₹100 lent</div><div class="big">₹${f1(rt(b.i_prem_as * 100, b.core_da) || 0)}</div><div>${deltaTxt(rt(b.i_prem_as * 100, b.core_da), rt(A.i_prem_as * 100, A.core_da), 1)} <span class="cmp">vs ₹${f1(rt(A.i_prem_as * 100, A.core_da) || 0)} peers</span></div></div>
      <div class="card"><div class="cmp">Policies per insured loan</div><div class="big">${(rt(b.i_pol, b.i_loans) || 0).toFixed(2)}×</div><div>${deltaTxt(rt(b.i_pol, b.i_loans), rt(A.i_pol, A.i_loans), 1)} <span class="cmp">vs ${(rt(A.i_pol, A.i_loans) || 0).toFixed(2)}× peers</span></div></div>
      <div class="card"><div class="cmp">Premium, Apr–Oct</div><div class="big">${X.cr(b.i_prem)}</div><div class="cmp">${f0(b.i_loans)} insured loans · ${f0(b.i_pol)} policies</div></div></div>
      <div class="g g2">
        <div class="card"><div class="card-h"><h3>Premium by cover type</h3><span class="sub">rings = branch share · orange tick = peers</span></div>
          <div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px;align-items:center"><div id="insRings" class="chart"></div><div id="insLeg"></div></div></div>
        <div class="card"><div class="card-h"><h3>Insured loans by month of disbursal</h3><span class="sub">bar labels = premium</span></div><div id="insMonth" class="chart"></div></div></div>`;
    multiRing($("#insRings"), ITYPES.map((t, i) => ({ name: t, val: tot ? ((b["ip_" + t] || 0) / tot) * 100 : null, peer: ptot ? ((A["ip_" + t] || 0) / ptot) * 100 : null, color: ITC[i], note: `${X.cr(b["ip_" + t] || 0)} premium · ${f0(b["in_" + t] || 0)} policies` })), { top: "PREMIUM", big: X.cr(tot).replace(" Cr", "").replace(" L", ""), sub: X.cr(tot).includes("Cr") ? "₹ Cr, Apr–Oct" : "₹ L, Apr–Oct" });
    $("#insLeg").innerHTML = `<div class="hr-head" style="grid-template-columns:12px minmax(0,1fr) 40px 40px"><span></span><span>Cover</span><span>Branch</span><span>Peers</span></div>` + ITYPES.map((t, i) => `<div class="hr-row" style="grid-template-columns:12px minmax(0,1fr) 40px 40px"><i style="border-color:${ITC[i]}"></i><span class="n">${t}</span><span class="a">${pct0(tot ? (b["ip_" + t] || 0) / tot : 0)}</span><span class="p">${pct0(ptot ? (A["ip_" + t] || 0) / ptot : 0)}</span></div>`).join("");
    vbars($("#insMonth"), OM, [{ name: "Insured loans", c: C.peer, v: OM.map(m => b["im_n_" + m] || 0), opAt: i => (i === OM.length - 1 ? 0.45 : 1) }], { h: 260, xf: MON, tf: f0, yf: f0, labels: (v, i) => X.cr(b["im_p_" + OM[i]] || 0), extra: i => `<br><span class="k">${X.cr(b["im_p_" + OM[i]] || 0)} premium${i === OM.length - 1 ? " · October is partial" : ""}</span>` });
  };

  // ---------------- risk
  SEC.risk = (b, P, el) => {
    const A = P.agg, ms = ["07", "08", "09"], ML = { "07": "Jul 26", "08": "Aug 26", "09": "Sep 26" };
    const bn = (o, m) => (o["r_du_" + m] >= 15 ? o["r_bn_" + m] / o["r_du_" + m] : null);
    const sec = rt(b.r_saum_09, b.r_aum_09), psec = rt(A.r_saum_09, A.r_aum_09);
    setInsight(`Its new book (loans booked since May) is <b>${X.cr(b.r_aum_09)}</b> across ${f0(b.r_al_09)} active loans. <b>${pct1(bn(b, "09"))}</b> of EMIs due in September bounced (peers ${pct1(bn(A, "09"))}, network ${pct1(bn(NAT, "09"))}); ${pct0(sec)} of the book is secured (peers ${pct0(psec)}).`);
    el.innerHTML = `<div class="g g4">
      ${ringCard("Secured share of book", sec, psec, 1, C.brand, "AUM, Sep 2026")}
      ${ringCard("CIBIL above 730", rt(b.r_caum_09, b.r_aum_09), rt(A.r_caum_09, A.r_aum_09), 1, "#1baf7a", "share of AUM")}
      ${ringCard("New-to-credit borrowers", rt(b.r_naum_09, b.r_aum_09), rt(A.r_naum_09, A.r_aum_09), -1, "#eda100", "share of AUM")}
      ${ringCard("Book in any DPD", rt(b.r_p1_09, b.r_aum_09), rt(A.r_p1_09, A.r_aum_09), -1, C.bad, "share of AUM, Sep")}</div>
      <div class="g g2">
        <div class="card"><div class="card-h"><h3>New book, month by month</h3><span class="sub">AUM of loans booked since May 2026</span></div><div id="aumBars" class="chart"></div></div>
        <div class="card"><div class="card-h"><h3>EMI bounce rate</h3>${legend([[C.brand, esc(b.name)], [C.peer, esc(P.name), "line"], [C.nat, "network", "dash"]])}</div><div id="bnLine" class="chart"></div></div></div>
      <div class="g g2">
        <div class="card"><div class="card-h"><h3>Bounce by product · Sep</h3>${LEG(b, P)}</div><div id="bnProd" class="chart"></div></div>
        <div class="card"><div class="card-h"><h3>Who it lends to · CIBIL mix</h3><span class="sub">share of AUM, Sep 2026</span></div><div id="cibMix" class="chart"></div><div id="cibLeg" style="margin-top:8px"></div></div></div>`;
    vbars($("#aumBars"), ms, [{ name: "AUM", c: C.brand, v: ms.map(m => b["r_aum_" + m] || 0) }], { h: 240, xf: m => ML[m], yf: d => "₹" + d, tf: v => X.cr(v), labels: (v, i) => X.cr(v), extra: i => `<br><span class="k">${f0(b["r_al_" + ms[i]] || 0)} active loans</span>` });
    lineChart($("#bnLine"), [{ name: "Network", c: C.nat, dash: "5 4", v: ms.map(m => bn(NAT, m)) }, { name: P.name, c: C.peer, v: ms.map(m => bn(A, m)) }, { name: b.name, c: C.brand, w: 2.5, v: ms.map(m => bn(b, m)) }], ms,
      { h: 240, label: "EMI bounce", xf: m => ML[m], yf: d => (d * 100).toFixed(0) + "%", tf: pct1, endLabels: true, extra: i => `<br><span class="k">${f0(b["r_bn_" + ms[i]] || 0)} bounced of ${f0(b["r_du_" + ms[i]] || 0)} EMIs due</span>` });
    dumbbell($("#bnProd"), CORE.map(f => ({ k: FAM[f], a: b["rf_du_" + f] >= 15 ? rt(b["rf_bn_" + f], b["rf_du_" + f]) : null, b: A["rf_du_" + f] >= 15 ? rt(A["rf_bn_" + f], A["rf_du_" + f]) : null, na: b["rf_du_" + f] })), { unit: "EMIs due", tf: pct1 });
    const CB = [["rc_ntc", "New to credit"], ["rc_lt680", "≤ 680"], ["rc_681_730", "681–730"], ["rc_731_770", "731–770"], ["rc_771_790", "771–790"], ["rc_ge791", "≥ 791"]];
    const cc = ["#a3a5bd", C.bad, "#f4a27c", "#c9c6fb", "#8c86f5", C.brand];
    stack100($("#cibMix"), [{ name: b.name, me: true, parts: Object.fromEntries(CB.map(([k, n]) => [n, b[k] || 0])) }, { name: "Peers", parts: Object.fromEntries(CB.map(([k, n]) => [n, A[k] || 0])) }], CB.map(c => c[1]), cc, { vf: v => X.cr(v) });
    $("#cibLeg").innerHTML = legend(CB.map((c, i) => [cc[i], c[1], "sq"]));
  };

  // ---------------- local market
  SEC.market = (b, P, el) => {
    const ms = ["08", "09", "10"], ML = { "08": "Aug 26", "09": "Sep 26", "10": "Oct 26*" };
    const key = b.mk_key, isSt = b.mk_level !== "district", stKey = isSt ? "*|*" : (b.mstate || b.state) + "|*", stName = isSt ? "network" : (b.mstate || b.state);
    const mk = m => X.market(key, m), ms_ = m => X.market(stKey, m), nat = m => X.market("*|*", m);
    const cur = mk("09");
    if (!cur) { setInsight("No collections data could be matched to this branch's location."); el.innerHTML = `<div class="card empty">No local market data.</div>`; return; }
    const bb = o => (o && o.b1acc ? o.b1bacc / o.b1acc : null), rr = o => (o && o.b1pos ? o.b1rpos / o.b1pos : null), np = o => (o && o.pos ? o.NPA / o.pos : null);
    const same = E.filter(x => x.mk_key === key && x.id !== b.id).sort((x, y) => y.core_da - x.core_da);
    setInsight(`This branch lends into <b>${esc(b.mk_name)}</b>${b.mk_level === "state" ? " (state level: the nearest district's book is too thin to read on its own)" : ""}, a collections book of <b>${X.fmt(MID.msize, cur.pos)}</b>. In September <b>${pct0(bb(cur))}</b> of B1 accounts there bounced (network ${pct0(bb(nat("09")))}) and <b>${pct1(np(cur))}</b> of the book was NPA. ${same.length ? `${same.length} other branch${same.length > 1 ? "es share" : " shares"} this market.` : "No other scored branch shares this market."}`);
    el.innerHTML = `<div class="g g4">
      <div class="card"><div class="cmp">Local loan book (POS), Sep</div><div class="big">${X.fmt(MID.msize, cur.pos)}</div><div class="cmp">${f0(cur.acc)} accounts</div></div>
      ${ringCard("B1 accounts that bounced", bb(cur), bb(ms_("09")), -1, C.bad, "peer = " + esc(stName))}
      ${ringCard("B1 ₹ resolved", rr(cur), rr(ms_("09")), 1, "#1baf7a", "peer = " + esc(stName))}
      ${ringCard("NPA share of book", np(cur), np(ms_("09")), -1, C.peer, "peer = " + esc(stName))}</div>
      <div class="g g2">
        <div class="card"><div class="card-h"><h3>Bucket mix of the local book</h3><span class="sub">POS by delinquency bucket, Sep</span></div>
          <div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px;align-items:center"><div id="bkDonut" class="chart" style="display:grid;place-items:center"></div><div id="bkLeg"></div></div></div>
        <div class="card"><div class="card-h"><h3>B1 bounce, Aug → Oct</h3>${legend(isSt ? [[C.brand, esc(b.mk_name)], [C.nat, "network", "dash"]] : [[C.brand, esc(b.mk_name)], [C.peer, esc(stName), "line"], [C.nat, "network", "dash"]])}</div><div id="mkLine" class="chart"></div><p class="note">*October is partial (data to mid-month).</p></div></div>
      <div class="card"><div class="card-h"><h3>Other branches lending into ${esc(b.mk_name)}</h3><span class="sub">${same.length} branches</span></div><div class="scroll-x" id="sameTbl"></div></div>`;
    const bk = [["B1", "B1 · 1–30 days", C.brand], ["B2", "B2 · 31–60", "#8c86f5"], ["B3", "B3 · 61–90", "#eda100"], ["NPA", "NPA · 90+", C.bad]].map(([k, n, c]) => ({ k: n, v: cur[k] || 0, c }));
    donut($("#bkDonut"), bk, { big: pct0(np(cur)), sub: "NPA share" }, { fmt: v => X.cr(v), label: "Bucket mix" });
    $("#bkLeg").innerHTML = legendRows(bk, sum(bk, d => d.v), v => X.cr(v));
    lineChart($("#mkLine"), [{ name: "Network", c: C.nat, dash: "5 4", v: ms.map(m => bb(nat(m))) }, ...(isSt ? [] : [{ name: stName, c: C.peer, v: ms.map(m => bb(ms_(m))) }]), { name: b.mk_name, c: C.brand, w: 2.5, v: ms.map(m => bb(mk(m))) }], ms,
      { h: 230, label: "B1 bounce by month", xf: m => ML[m], yf: d => (d * 100).toFixed(0) + "%", tf: pct1, endLabels: true });
    $("#sameTbl").innerHTML = same.length ? `<table class="tbl"><thead><tr><th>Branch</th><th>Health</th><th>Core disb.</th><th>Bounce</th><th>Approval</th></tr></thead><tbody>${[b, ...same.slice(0, 9)].map(x => `<tr class="${x.id === b.id ? "me" : ""}"><td>${x.id === b.id ? esc(x.name) : `<a href="#/b/${encodeURIComponent(x.id)}/market">${esc(x.name)}</a>`}</td><td>${Math.round(x.health)}</td><td>${X.cr(x.core_da)}</td><td>${X.fmt(MID.bounce, x.v.bounce)}</td><td>${X.fmt(MID.appr, x.v.appr)}</td></tr>`).join("")}</tbody></table>` : `<div class="empty">It is the only scored branch in this market.</div>`;
  };

  // ---------------- strategy
  SEC.strategy = (b, P, el) => {
    const s = X.swot(b, P), ge = X.geCell(b), data = X.bcg(b);
    setInsight(`SWOT, BCG, GE–McKinsey and Ansoff, all computed from this branch's numbers against <b>${esc(P.name)}</b>. Call: <b>${ge.verdict.toLowerCase()}</b>. ${data.filter(d => d.q === "Star").length ? `Star product${data.filter(d => d.q === "Star").length > 1 ? "s" : ""}: <b>${data.filter(d => d.q === "Star").map(d => d.name.toLowerCase()).join(", ")}</b>.` : "It has no star product yet."}`);
    const card = (k, name, sub, items, fn, none) => `<div class="sw ${k}"><h3><span class="L">${k}</span><span>${name}<small>${sub}</small></span></h3><ul>${items.length ? items.map(fn).join("") : `<li class="none">${none}</li>`}</ul></div>`;
    el.innerHTML = `<div class="swot">
      ${card("S", "Strengths", "top 30% of the network and ahead of peers", s.S, x => `<li><b>${x.title}<em>${X.topPct(x.pct)}</em></b><p>${esc(x.text)}</p></li>`, "No metric is in the network's top 30% and ahead of peers.")}
      ${card("W", "Weaknesses", "bottom 30% of the network and behind peers", s.W, x => `<li><b>${x.title}<em>${X.topPct(x.pct)}</em></b><p>${esc(x.text)}</p></li>`, "No metric is in the bottom 30% and behind peers.")}
      ${card("O", "Opportunities", "sized in ₹ against " + esc(P.name), s.O, x => `<li><b>${esc(x.title)}<em>${X.cr(x.val)}${x.unit}</em></b><p>${esc(x.text)}</p></li>`, "It already matches or beats peers on conversion, cross-sell and mix.")}
      ${card("T", "Threats", "its book, its dependence, its local market", s.T, x => `<li><b>${esc(x.title)}</b><p>${esc(x.text)}</p></li>`, "No early-warning signal fires.")}</div>
      <div class="g g2">
        <div class="card"><div class="card-h"><h3>BCG growth–share matrix</h3><span class="sub">its products vs the biggest rival branch in the state</span></div><div id="bcg" class="chart"></div><p class="note" id="bcgNote"></p></div>
        <div class="card"><div class="card-h"><h3>GE–McKinsey nine-box</h3><span class="sub">branch strength × market attractiveness</span></div><div id="ge" class="chart"></div><p class="note" id="geNote"></p></div></div>
      <div class="card" style="margin-bottom:18px"><div class="card-h"><h3>Ansoff growth map</h3><span class="sub">four ways to grow, each sized from data</span></div><div id="ansoff" class="ansoff"></div></div>
      <div class="card"><div class="card-h"><h3>Strategy canvas</h3>${legend([[C.brand, esc(b.name)], [C.peer, esc(P.name), "line"], [C.nat, "top quartile", "dash"]])}</div><div id="canvas" class="chart"></div></div>`;
    renderBCG(b, data); renderGE(b, P); renderAnsoff(b, P); renderCanvas(b, P);
  };
  function renderBCG(b, data, el = $("#bcg"), noteEl = $("#bcgNote"), mini = false) {
    el.innerHTML = "";
    const W = width(el), H = Math.round(W * (mini ? 0.9 : 0.72)), m = mini ? { t: 10, r: 8, b: 34, l: 46 } : { t: 14, r: 16, b: 42, l: 62 };
    const svg = svgIn(el, W, H, "BCG matrix");
    const x = d3.scaleLog().domain([0.03, 10]).range([m.l, W - m.r]).clamp(true);
    const y = d3.scaleLinear().domain([Math.min(-0.5, d3.min(data, d => d.g) || 0) * 1.1, Math.max(1, d3.max(data, d => d.g) || 0) * 1.1]).range([H - m.b, m.t]).nice();
    const gm = X.NAT_G;
    for (const [x0, y0, x1, y1, n, an, vp, f] of [[x(0.03), y.range()[1], x(1), y(gm), "Question marks", "start", "top", "#f3f2fe"], [x(1), y.range()[1], x(10), y(gm), "Stars", "end", "top", "#e3e1fd"], [x(0.03), y(gm), x(1), y.range()[0], "Dogs", "start", "bottom", "#f8f8fc"], [x(1), y(gm), x(10), y.range()[0], "Cash cows", "end", "bottom", "#fdf0e8"]]) {
      svg.append("rect").attr("x", x0).attr("y", y0).attr("width", x1 - x0).attr("height", y1 - y0).attr("fill", f);
      svg.append("text").attr("x", an === "start" ? x0 + 8 : x1 - 8).attr("y", vp === "top" ? y0 + 18 : y1 - 8).attr("text-anchor", an).attr("class", "lbl").style("fill", C.muted).text(n);
    }
    svg.append("g").attr("class", "ax").attr("transform", `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickValues(mini ? [0.1, 0.3, 1, 3, 10] : [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10]).tickFormat(d => d + "×").tickSizeOuter(0));
    svg.append("g").attr("class", "ax").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(mini ? 4 : 6).tickFormat(d => (d >= 0 ? "+" : "") + Math.round(d * 100) + "%").tickSizeOuter(0));
    svg.append("text").attr("class", "axl").attr("x", (m.l + W - m.r) / 2).attr("y", H - 6).attr("text-anchor", "middle").text(mini ? "relative share (log)" : "relative share: branch ÷ biggest rival branch in the state (log)");
    svg.append("text").attr("class", "axl").attr("transform", `translate(12,${(m.t + H - m.b) / 2}) rotate(-90)`).attr("text-anchor", "middle").text(mini ? "growth" : "sanction growth, Jul–Sep vs Apr–Jun");
    const r = d3.scaleSqrt().domain([0, d3.max(data, d => d.sa) || 1]).range(mini ? [5, 20] : [7, 30]);
    const g = svg.append("g").selectAll("g").data(data.slice().sort((a, c) => c.sa - a.sa)).join("g").attr("transform", d => `translate(${x(d.rel)},${y(d.g)})`);
    g.append("circle").attr("r", d => r(d.sa)).attr("fill", d => FAMC[d.f]).attr("fill-opacity", 0.85).attr("stroke", "#fff").attr("stroke-width", 2)
      .on("mousemove", (ev, d) => tip(`<b>${d.name}</b> · ${d.q}<br>Sanctioned ${X.cr(d.sa)} in 13 months<br>Relative share <b>${d.relRaw.toFixed(2)}×</b>${d.rival ? ` <span class="k">vs ${esc(d.rival)} (${X.cr(d.rivalSa)})</span>` : ""}<br>Growth <b>${d.gRaw >= 0 ? "+" : ""}${(d.gRaw * 100).toFixed(0)}%</b> <span class="k">vs network ${(gm * 100).toFixed(0)}%</span>`, ev)).on("mouseleave", untip);
    g.append("text").attr("class", "lbl-b").attr("text-anchor", "middle").attr("dy", d => -r(d.sa) - 5).style("font-size", mini ? "10.5px" : null).text(d => (mini && d.sa < (d3.max(data, z => z.sa) || 0) * 0.25 ? "" : d.short));
    const stars = data.filter(d => d.q === "Star").map(d => d.short), dogs = data.filter(d => d.q === "Dog").map(d => d.short);
    if (noteEl) noteEl.innerHTML = data.length ? `Dividing line: network sanction growth (${gm >= 0 ? "+" : ""}${(gm * 100).toFixed(0)}%). ${stars.length ? `<b>Stars:</b> ${stars.join(", ")}. ` : "No star yet. "}${dogs.length ? `<b>Dogs:</b> ${dogs.join(", ")}: fix or de-prioritise.` : ""}` : "Too little sanctioned volume to place its products.";
  }
  function renderGE(b, P) {
    const el = $("#ge"); el.innerHTML = "";
    const W = width(el), H = Math.round(W * 0.72), m = { t: 12, r: 12, b: 42, l: 44 };
    const svg = svgIn(el, W, H, "GE McKinsey nine-box");
    const x = d3.scaleLinear().domain([0, 100]).range([m.l, W - m.r]), y = d3.scaleLinear().domain([0, 100]).range([H - m.b, m.t]);
    const tone = s => (s >= 3 ? "#ddf3e8" : s === 2 ? "#fbefd3" : "#fde2e4"), names = { 4: "Invest", 3: "Grow", 2: "Hold", 1: "Harvest", 0: "Exit" };
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      const x0 = x((i * 100) / 3), x1 = x(((i + 1) * 100) / 3), y0 = y(((j + 1) * 100) / 3), y1 = y((j * 100) / 3);
      svg.append("rect").attr("x", x0 + 2).attr("y", y0 + 2).attr("width", x1 - x0 - 4).attr("height", y1 - y0 - 4).attr("rx", 12).attr("fill", tone(i + j));
      svg.append("text").attr("x", x0 + 10).attr("y", y0 + 20).attr("class", "lbl").style("fill", C.muted).style("stroke", tone(i + j)).text(names[i + j]);
    }
    const pts = P.list.filter(p => p.id !== b.id && p.attract !== null);
    svg.append("g").selectAll("circle").data(pts).join("circle").attr("cx", d => x(d.health)).attr("cy", d => y(d.attract)).attr("r", 4.5).attr("fill", C.peer).attr("fill-opacity", 0.55).attr("stroke", "#fff")
      .style("cursor", "pointer").on("mousemove", (ev, d) => tip(`<b>${esc(d.name)}</b><br>Strength ${Math.round(d.health)} · Market ${Math.round(d.attract)}<br><span class="k">${X.geCell(d).verdict}</span>`, ev)).on("mouseleave", untip).on("click", (ev, d) => go(d.id));
    if (b.attract !== null) {
      svg.append("circle").attr("cx", x(b.health)).attr("cy", y(b.attract)).attr("r", 10).attr("fill", C.brand).attr("stroke", "#fff").attr("stroke-width", 3);
      svg.append("text").attr("x", x(b.health) + (b.health > 70 ? -15 : 15)).attr("y", y(b.attract) + 4).attr("text-anchor", b.health > 70 ? "end" : "start").attr("class", "lbl-b").text(b.name);
    }
    svg.append("g").attr("class", "ax").attr("transform", `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickValues([0, 33, 67, 100]).tickSizeOuter(0));
    svg.append("g").attr("class", "ax").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).tickValues([0, 33, 67, 100]).tickSizeOuter(0));
    svg.append("text").attr("class", "axl").attr("x", (m.l + W - m.r) / 2).attr("y", H - 6).attr("text-anchor", "middle").text("branch strength = health score →");
    svg.append("text").attr("class", "axl").attr("transform", `translate(12,${(m.t + H - m.b) / 2}) rotate(-90)`).attr("text-anchor", "middle").text("market attractiveness →");
    $("#geNote").innerHTML = `<b>${X.geCell(b).verdict}.</b> Attractiveness ${b.attract === null ? "–" : Math.round(b.attract)}/100 blends local book size, B1 resolution, B1 bounce, NPA share and ${esc(b.state)}'s sanction growth. Orange dots: ${esc(P.name)}.`;
  }
  function renderAnsoff(b, P) {
    const q = X.ansoff(b, P);
    const box = (k, risk) => { const items = q[k], tot = sum(items, o => o.val);
      return `<div class="aq ${items.length ? "hot" : ""}"><h4>${k}<em>${risk}</em></h4><div class="risk">${items.length ? "≈ " + X.cr(tot) + " a month on the table" : ""}</div>${items.length ? items.map(o => `<div class="mv"><b>${esc(o.title)}<em>${X.cr(o.val)}${o.unit}</em></b><p>${esc(o.text)}</p></div>`).join("") : `<div class="none">No clear gap against ${esc(P.name)}.</div>`}</div>`; };
    $("#ansoff").innerHTML = `<div></div><div class="ax">Existing products</div><div class="ax">New products</div><div class="ax y">Existing customers</div>${box("Market penetration", "lowest risk")}${box("Product development", "medium risk")}<div class="ax y">New customers</div>${box("Market development", "medium risk")}${box("Diversification", "highest risk")}`;
  }
  function renderCanvas(b, P) {
    const el = $("#canvas"); el.innerHTML = "";
    const ms = M.filter(m => m.p !== "market");
    const W = width(el, 1000), step = (W - 80) / ms.length, rot = step < 84, H = rot ? 380 : 330, mg = { t: 40, r: 16, b: rot ? 96 : 52, l: 44 };
    const svg = svgIn(el, W, H, "Strategy canvas");
    const x = d3.scalePoint().domain(ms.map(m => m.id)).range([mg.l + 10, W - mg.r - 10]), y = d3.scaleLinear().domain([0, 100]).range([H - mg.b, mg.t]);
    svg.append("g").attr("class", "gridl").selectAll("line").data([0, 25, 50, 75, 100]).join("line").attr("x1", mg.l).attr("x2", W - mg.r).attr("y1", d => y(d)).attr("y2", d => y(d));
    svg.append("g").attr("class", "ax").attr("transform", `translate(${mg.l},0)`).call(d3.axisLeft(y).tickValues([0, 25, 50, 75, 100]).tickSizeOuter(0)).select(".domain").remove();
    for (const Pi of PILLARS.filter(p => p.id !== "market")) {
      const g = ms.filter(m => m.p === Pi.id), x0 = Math.max(mg.l, x(g[0].id) - x.step() / 2), x1 = Math.min(W - mg.r, x(g[g.length - 1].id) + x.step() / 2);
      svg.append("rect").attr("x", x0 + 3).attr("width", x1 - x0 - 6).attr("y", 4).attr("height", 22).attr("rx", 11).attr("fill", PILC[Pi.id]).attr("opacity", 0.12);
      svg.append("text").attr("x", (x0 + x1) / 2).attr("y", 19).attr("text-anchor", "middle").style("font", "600 10.5px var(--ui)").style("letter-spacing", ".08em").style("fill", PILC[Pi.id]).text(Pi.name.toUpperCase());
      if (x0 > mg.l + 20) svg.append("line").attr("x1", x0).attr("x2", x0).attr("y1", mg.t).attr("y2", H - mg.b).attr("stroke", C.line);
    }
    const lab = svg.append("g").selectAll("text").data(ms).join("text").attr("class", "axl").style("fill", C.ink2);
    if (rot) lab.attr("text-anchor", "end").attr("transform", d => `translate(${x(d.id) + 4},${H - mg.b + 16}) rotate(-35)`).text(d => d.short); else lab.attr("text-anchor", "middle").attr("x", d => x(d.id)).attr("y", H - mg.b + 20).text(d => d.short);
    const me = ms.map(m => [m.id, b.pct[m.id]]), pr = ms.map(m => [m.id, X.pctOf(m, m.level ? X.peerValue(m, P) : X.value(m, P.agg))]);
    const line = d3.line().defined(d => d[1] !== null).x(d => x(d[0])).y(d => y(d[1]));
    svg.append("line").attr("x1", mg.l).attr("x2", W - mg.r).attr("y1", y(75)).attr("y2", y(75)).attr("stroke", C.nat).attr("stroke-width", 2).attr("stroke-dasharray", "5 4");
    svg.append("path").attr("d", d3.area().defined(d => d[1] !== null).x(d => x(d[0])).y0(y(0)).y1(d => y(d[1]))(me)).attr("fill", C.brand).attr("opacity", 0.07);
    svg.append("path").attr("d", line(pr)).attr("fill", "none").attr("stroke", C.peer).attr("stroke-width", 2);
    svg.append("path").attr("d", line(me)).attr("fill", "none").attr("stroke", C.brand).attr("stroke-width", 2.5);
    svg.append("g").selectAll("circle").data(me.filter(d => d[1] !== null)).join("circle").attr("cx", d => x(d[0])).attr("cy", d => y(d[1])).attr("r", 5).attr("fill", C.brand).attr("stroke", "#fff").attr("stroke-width", 2);
    svg.append("g").selectAll("circle").data(pr.filter(d => d[1] !== null)).join("circle").attr("cx", d => x(d[0])).attr("cy", d => y(d[1])).attr("r", 3.5).attr("fill", C.peer);
    svg.append("g").selectAll("rect").data(ms).join("rect").attr("x", d => x(d.id) - x.step() / 2).attr("width", x.step()).attr("y", mg.t).attr("height", H - mg.b - mg.t).attr("fill", "transparent")
      .on("mousemove", (ev, m) => tip(`<b>${m.label}</b><br>Branch: <b>${X.fmt(m, b.v[m.id])}</b> (${b.pct[m.id] === null ? "–" : Math.round(b.pct[m.id])})<br>${esc(P.name)}: ${X.fmt(m, X.peerValue(m, P))}<br><span class="k">Top-quartile: ${X.fmt(m, X.quantile(m, 0.75))}</span>`, ev)).on("mouseleave", untip);
  }

  // ---------------- peers
  SEC.peers = (b, P, el) => {
    const rk = X.rankIn(b, P.list);
    const near = P.others.sort((a, c) => Math.abs(Math.log((a.core_da + 0.5) / (b.core_da + 0.5))) - Math.abs(Math.log((c.core_da + 0.5) / (b.core_da + 0.5)))).slice(0, 11);
    const rows = [b, ...near].sort((a, c) => c.health - a.health);
    setInsight(`Among <b>${esc(P.name)}</b> it ranks <b>#${rk.r} of ${rk.n}</b>. Below, every peer is plotted by health, and the 11 branches closest to it in size are compared pillar by pillar. Click any branch to open it.`);
    el.innerHTML = `<div class="card" style="margin-bottom:18px"><div class="card-h"><h3>${esc(P.name[0].toUpperCase() + P.name.slice(1))} by health score</h3><span class="sub">${P.list.length} branches · size = core disbursal</span></div><div id="swarm" class="chart"></div></div>
      <div class="card" style="margin-bottom:18px"><div class="card-h"><h3>Closest in size · pillar heat map</h3><span class="sub">percentile, darker = better · click to open</span></div><div id="peerHeat" class="chart scroll-x"></div></div>
      <div class="card"><div class="card-h"><h3>Head to head</h3><span class="sub">the same 12 branches on the headline numbers</span></div><div class="scroll-x" id="nbTbl"></div></div>`;
    swarm($("#swarm"), b, P);
    heatTable($("#peerHeat"), rows.map(x => ({ name: x.name, sub: `${x.state} · ${X.cr(x.core_da)}`, me: x.id === b.id, vals: PILLARS.map(p => x.pill[p.id]), health: x.health, onClick: x.id === b.id ? null : () => go(x.id) })), [...PILLARS.map(p => p.name), "Health"], { l: 200, domain: [0, 100] });
    const cols = [["Health", x => Math.round(x.health)], ["Core disb.", x => X.cr(x.core_da)], ["Approval", x => X.fmt(MID.appr, x.v.appr)], ["Momentum", x => X.fmt(MID.mom, x.v.mom)], ["Bounce", x => X.fmt(MID.bounce, x.v.bounce)], ["Attach", x => X.fmt(MID.attach, x.v.attach)], ["Docket FTR", x => X.fmt(MID.ftr, x.v.ftr)]];
    $("#nbTbl").innerHTML = `<table class="tbl"><thead><tr><th>Branch</th>${cols.map(c => `<th>${c[0]}</th>`).join("")}</tr></thead><tbody>${rows.map(x => `<tr class="${x.id === b.id ? "me" : ""}"><td>${x.id === b.id ? esc(x.name) : `<a href="#/b/${encodeURIComponent(x.id)}/peers">${esc(x.name)}</a>`}</td>${cols.map(c => `<td>${c[1](x)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  };
  function swarm(el, b, P) {
    el.innerHTML = "";
    const data = P.list.map(d => ({ d }));
    const W = width(el, 1000), x = d3.scaleLinear().domain([0, 100]).range([20, W - 20]);
    const rr = d3.scaleSqrt().domain([0, d3.max(data, o => o.d.core_da) || 1]).range([3, data.length > 120 ? 9 : 14]);
    const placed = [];
    for (const o of data.sort((a, c) => c.d.core_da - a.d.core_da)) {
      o.x = x(o.d.health); o.r = rr(o.d.core_da); let yy = 0, k = 0;
      const free = y => placed.every(p => (p.x - o.x) ** 2 + (p.y - y) ** 2 >= (p.r + o.r + 1) ** 2);
      while (!free(yy) && k < 500) { k++; yy = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 2; }
      o.y = yy; placed.push(o);
    }
    const ext = d3.extent(placed, o => o.y), H = Math.max(150, ext[1] - ext[0] + 110), cy = 44 - ext[0];
    const svg = svgIn(el, W, H, "Peers by health");
    for (const [a, c, t, f] of [[0, 100 / 3, "LAGGING", "#fde2e4"], [100 / 3, 200 / 3, "STEADY", "#fbefd3"], [200 / 3, 100, "LEADER", "#ddf3e8"]]) {
      svg.append("rect").attr("x", x(a)).attr("width", x(c) - x(a)).attr("y", 0).attr("height", H - 26).attr("fill", f).attr("opacity", 0.55);
      svg.append("text").attr("x", (x(a) + x(c)) / 2).attr("y", 15).attr("text-anchor", "middle").attr("class", "axl").style("font-weight", 600).style("letter-spacing", ".1em").text(t);
    }
    svg.append("g").attr("class", "ax").attr("transform", `translate(0,${H - 26})`).call(d3.axisBottom(x).tickValues([0, 25, 50, 75, 100]).tickSizeOuter(0));
    svg.append("g").selectAll("circle").data(placed).join("circle").attr("cx", o => o.x).attr("cy", o => cy + o.y).attr("r", o => o.r)
      .attr("fill", o => (o.d.id === b.id ? C.brand : BANDC[o.d.band.id])).attr("fill-opacity", o => (o.d.id === b.id ? 1 : 0.6)).attr("stroke", o => (o.d.id === b.id ? C.ink : "#fff")).attr("stroke-width", o => (o.d.id === b.id ? 2.5 : 1))
      .style("cursor", "pointer").on("mousemove", (ev, o) => tip(branchTip(o.d), ev)).on("mouseleave", untip).on("click", (ev, o) => { untip(); go(o.d.id); });
    const me = placed.find(o => o.d.id === b.id);
    if (me) svg.append("text").attr("x", me.x).attr("y", cy + me.y - me.r - 7).attr("text-anchor", "middle").attr("class", "lbl-b").text(b.name);
  }

  // ---------------- memo
  let AI = null;
  const AIP = fetch("/api/ai-status").then(r => r.json()).then(j => { AI = j.enabled ? j : false; if ((state.view === "branch" && state.sec === "memo") || state.view === "ask") render(); }).catch(() => { AI = false; });
  const MEMO = {};
  function facts(b, P) {
    const s = X.swot(b, P), ge = X.geCell(b);
    return { branch: b.name, state: b.state, zone: b.zone, local_market: b.mk_name, peer_group: P.name, peer_count: P.n,
      health_score: Math.round(b.health), national_rank: `${b.rank} of ${NRANK}`, band: b.band.name,
      pillars: Object.fromEntries(PILLARS.map(p => [p.name, b.pill[p.id] === null ? null : Math.round(b.pill[p.id])])),
      metrics: M.map(m => ({ metric: m.label, value: X.fmt(m, b.v[m.id]), peers: X.fmt(m, X.peerValue(m, P)), percentile: b.pct[m.id] === null ? null : Math.round(b.pct[m.id]) })),
      strengths: s.S.map(x => x.title + ": " + x.text), weaknesses: s.W.map(x => x.title + ": " + x.text),
      opportunities: s.O.map(x => `${x.title} (${X.cr(x.val)}${x.unit}): ${x.text}`), threats: s.T.map(x => x.title + ": " + x.text),
      bcg: X.bcg(b).map(x => `${x.name}: ${x.q} (relative share ${x.relRaw.toFixed(2)}x, growth ${(x.gRaw * 100).toFixed(0)}%)`),
      ge_mckinsey: `${ge.verdict} (strength ${Math.round(b.health)}, market attractiveness ${b.attract === null ? "n/a" : Math.round(b.attract)})`, data_windows: X.OV.meta.windows };
  }
  function ruleMemo(b, P) {
    const s = X.swot(b, P), vd = X.verdict(b, P), ge = X.geCell(b), moves = s.O.slice(0, 3);
    return `<h4>Headline</h4><p>${esc(b.name)} scores <b>${Math.round(b.health)}/100</b> (${b.band.name.toLowerCase()}, #${b.rank} of ${NRANK}). Strongest on <b>${vd.best ? vd.best.name.toLowerCase() : "–"}</b>, weakest on <b>${vd.worst ? vd.worst.name.toLowerCase() : "–"}</b>. GE–McKinsey call: <b>${ge.verdict.toLowerCase()}</b>.</p>
      <h4>What's working</h4>${s.S.length ? `<ul>${s.S.map(x => `<li><b>${x.title}</b>: ${esc(x.text)}.</li>`).join("")}</ul>` : "<p>No metric stands clearly ahead of peers yet.</p>"}
      <h4>What isn't</h4>${s.W.length ? `<ul>${s.W.map(x => `<li><b>${x.title}</b>: ${esc(x.text)}.</li>`).join("")}</ul>` : "<p>No metric is clearly behind peers.</p>"}
      <h4>Priority moves</h4>${moves.length ? `<ol>${moves.map(o => `<li><b>${esc(o.title)}</b> (${X.cr(o.val)}${o.unit}). ${esc(o.text)}</li>`).join("")}</ol>` : "<p>Defend the position: it is at or above peers on conversion, cross-sell and mix.</p>"}
      <h4>Watch-list</h4>${s.T.length ? `<ul>${s.T.map(x => `<li><b>${esc(x.title)}</b>: ${esc(x.text)}</li>`).join("")}</ul>` : "<p>No early-warning signal fires.</p>"}`;
  }
  function md(t) {
    const lines = esc(t).split(/\n/); let out = "", list = null;
    const inline = s => s.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\*(.+?)\*/g, "<em>$1</em>");
    const close = () => { if (list) { out += `</${list}>`; list = null; } };
    for (const l of lines) { let m;
      if ((m = l.match(/^#{1,4}\s+(.*)/))) { close(); out += `<h4>${inline(m[1])}</h4>`; }
      else if ((m = l.match(/^\s*[-*•]\s+(.*)/))) { if (list !== "ul") { close(); out += "<ul>"; list = "ul"; } out += `<li>${inline(m[1])}</li>`; }
      else if ((m = l.match(/^\s*\d+[.)]\s+(.*)/))) { if (list !== "ol") { close(); out += "<ol>"; list = "ol"; } out += `<li>${inline(m[1])}</li>`; }
      else if (l.trim()) { close(); out += `<p>${inline(l)}</p>`; } }
    close(); return out;
  }
  SEC.memo = (b, P, el) => {
    const key = b.id + "|" + state.peer, cached = MEMO[key], s = X.swot(b, P), ge = X.geCell(b), tot = sum(s.O.filter(o => o.unit === "/month"), o => o.val);
    setInsight(`A one-page brief for the branch manager. ${AI ? "Press <b>Write with AI</b> to have the model draft it from the numbers in this dashboard." : "This draft comes from the dashboard's own rules; run <code>python3 ai_server.py</code> to let AI write it."}`);
    el.innerHTML = `<div class="card memo"><div class="mh"><div><div class="eyebrow">To: Branch manager, ${esc(b.name)} · From: One Vision</div><div class="who">${cached ? "Written by AI (" + esc((AI && AI.model) || "model") + ") from the numbers in this dashboard" : "Drafted from the rules behind this dashboard"}</div></div>${AI ? `<button id="memoBtn">✨ ${cached ? "Rewrite" : "Write"} with AI</button>` : ""}</div>
      <div class="memo-grid"><div class="body" id="memoBody">${cached ? md(cached) : ruleMemo(b, P)}</div>
      <aside class="memo-aside"><div class="ma"><span>Health</span><b>${Math.round(b.health)}<small>/100</small></b><em class="band ${b.band.id}">${b.band.icon} ${b.band.name}</em></div>
        <div class="ma"><span>GE–McKinsey call</span><b class="t">${ge.verdict}</b></div>
        <div class="ma"><span>Upside on the table</span><b>${tot > 0 ? X.cr(tot) : "–"}<small>${tot > 0 ? "/month" : ""}</small></b><em>${s.O.length} sized moves</em></div>
        <div class="ma"><span>Early warnings</span><b>${s.T.length}</b><em>${s.T.length ? esc(s.T[0].title) : "none firing"}</em></div></aside></div></div>
      <div class="defs">${defs()}</div>`;
    const bt = $("#memoBtn");
    if (bt) bt.onclick = async () => {
      bt.disabled = true; bt.textContent = "Writing…";
      try {
        const sys = "You are a senior partner at a top strategy consultancy writing a one-page memo to the manager of an Indian retail-lending branch. Use ONLY the numbers in the JSON; never invent figures. Be specific and direct. Use these ### headings: Headline (one-sentence verdict), Situation (2-3 sentences citing health score, rank and the GE-McKinsey call), What's working, What isn't, Three priority moves (numbered; each with the ₹ impact from the data and a concrete first step for the next 30 days), Watch-list. Use ₹ Cr / ₹ L. Under 320 words. Plain markdown.";
        const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "system", content: sys }, { role: "user", content: JSON.stringify(facts(b, P)) }] }) });
        const j = await r.json(); if (!r.ok) throw new Error((j.error && j.error.message) || "AI request failed");
        MEMO[key] = j.choices[0].message.content; if (j.model) AI.model = j.model;
      } catch (e) { $("#memoBody").insertAdjacentHTML("afterbegin", `<p style="color:var(--bad)">AI could not write the memo: ${esc(e.message).slice(0, 200)}. Showing the rule-based draft.</p>`); bt.disabled = false; bt.textContent = "✨ Try again"; return; }
      if (CUR && CUR.b.id === b.id && state.sec === "memo") render();
    };
  };
  function defs() {
    const w = X.OV.meta.windows;
    return `<p><b>Health score.</b> Each metric is a percentile against ${NRANK} branches (100 = best). Pillar = average of its metrics; health = weighted blend (growth 25%, credit 20%, operations 15%, cross-sell 15%, portfolio 25%), re-ranked so 80 means healthier than 80% of branches. Leader / Steady / Lagging are thirds.</p>
      <p><b>Fair comparisons.</b> Rates are shrunk toward the network rate in proportion to volume. Gold &amp; securities loans (booked centrally) are excluded from disbursal, mix and attach rates.</p>
      <p><b>Data windows.</b> Sales ${w.sales}; Credit ${w.credit}; Operations ${w.ops}; Insurance ${w.ins}; Risk ${w.risk}; Collections ${w.coll}.</p>
      <p><b>Local market.</b> Collections has no branch field, so each branch is matched to the nearest collections district (geocoded); districts with under ₹150 Cr of book fall back to the state.</p>
      <p><b>BCG</b> uses 13-month sanctioned ₹ by product; relative share = branch ÷ largest other branch in the state. <b>Opportunities</b> assume the branch reaches its peer group's pooled rate or mix: monthly and indicative, not targets.</p>
      <p><b>Built</b> ${X.OV.meta.built} by <code>pipeline/build.py</code> from the six contest files.</p>`;
  }

  // =================================================================== COMPARE TWO BRANCHES
  const CSECS = [{ id: "summary", name: "Head to head", ic: "scorecard" }, { id: "business", name: "Sales & credit", ic: "sales" }, { id: "service", name: "Ops & insurance", ic: "ops" },
    { id: "risk", name: "Risk & market", ic: "risk" }, { id: "strategy", name: "Strategy", ic: "strategy" }, { id: "memo", name: "Comparison memo", ic: "memo" }];
  const CA = C.brand, CB = C.peer;
  const nearest = (a, pool) => pool.slice().sort((x, y) => Math.abs(Math.log((x.core_da + 0.5) / (a.core_da + 0.5))) - Math.abs(Math.log((y.core_da + 0.5) / (a.core_da + 0.5))))[0];
  function suggestions(a, b) {
    const out = [];
    const st = E.filter(x => x.id !== a.id && x.state === a.state);
    const n1 = nearest(a, st.length ? st : E.filter(x => x.id !== a.id && x.zone === a.zone)); if (n1) out.push(["Closest in size", n1]);
    const lead = (st.length ? st : E.filter(x => x.id !== a.id)).sort((x, y) => y.health - x.health)[0]; if (lead) out.push([`${st.length ? a.state : "Network"} leader`, lead]);
    const zl = E.filter(x => x.id !== a.id && x.zone === a.zone).sort((x, y) => y.health - x.health)[0]; if (zl) out.push([`${a.zone} zone leader`, zl]);
    const mk = E.filter(x => x.id !== a.id && x.mk_key === a.mk_key).sort((x, y) => y.core_da - x.core_da)[0]; if (mk) out.push(["Same local market", mk]);
    const seen = new Set(); return out.filter(([, x]) => x && x.id !== (b && b.id) && !seen.has(x.id) && seen.add(x.id));
  }
  function examplePairs() {
    const big = [...E].sort((p, q) => q.core_da - p.core_da), out = [];
    const st = big[0]; const twin = nearest(st, E.filter(x => x.state === st.state && x.id !== st.id)); if (twin) out.push(["Biggest branch vs its state twin", st, twin]);
    const h = [...E].sort((p, q) => q.health - p.health); out.push(["Healthiest vs least healthy", h[0], h[h.length - 1]]);
    const z = ["North", "South", "West"].map(k => E.filter(x => x.zone === k).sort((p, q) => q.health - p.health)[0]).filter(Boolean); if (z.length >= 2) out.push([`${z[0].zone} leader vs ${z[1].zone} leader`, z[0], z[1]]);
    return out;
  }
  // a branch posing as the "peer group" so the opportunity engine sizes A against B
  const asPeer = b => ({ name: b.name, agg: b, others: [b], list: [b], n: 1 });
  function combo(input, box, onPick) {
    let hits = [], sel = -1;
    const draw = () => { const q = input.value.trim().toLowerCase(); if (!q) { box.classList.remove("on"); return; }
      hits = SEARCH.filter(x => x.k.includes(q)).slice(0, 8);
      box.innerHTML = hits.length ? hits.map((x, i) => `<a data-id="${esc(x.b.id)}" class="${i === sel ? "sel" : ""}">${esc(x.b.name)}<span>${esc(x.b.state)} · ${Math.round(x.b.health)}</span></a>`).join("") : `<a>No match</a>`; box.classList.add("on"); };
    input.addEventListener("input", () => { sel = -1; draw(); });
    input.addEventListener("keydown", e => { if (e.key === "ArrowDown") { sel = Math.min(hits.length - 1, sel + 1); draw(); e.preventDefault(); } else if (e.key === "ArrowUp") { sel = Math.max(0, sel - 1); draw(); e.preventDefault(); } else if (e.key === "Enter" && hits.length) onPick(hits[Math.max(0, sel)].b.id); else if (e.key === "Escape") box.classList.remove("on"); });
    box.addEventListener("mousedown", e => { const a = e.target.closest("a[data-id]"); if (a) { e.preventDefault(); onPick(a.dataset.id); } });
    input.addEventListener("blur", () => setTimeout(() => box.classList.remove("on"), 150));
  }
  const cHash = (a, b, sec) => `#/c/${a ? encodeURIComponent(a) : "-"}/${b ? encodeURIComponent(b) : "-"}/${sec || state.csec || "summary"}`;
  const cardSide = (x, side, other) => {
    const col = side === "A" ? CA : CB;
    if (!x) return `<div class="vs-card empty-side" style="--c:${col}"><div class="vs-tag">Branch ${side}</div><div class="vs-pick"><input id="pick${side}" type="search" placeholder="Search a branch to compare…" autocomplete="off"><div class="sugg" id="sugg${side}"></div></div></div>`;
    return `<div class="vs-card" style="--c:${col}"><div class="vs-tag">Branch ${side}</div>
      <div class="vs-top">${ringSVG(x.health / 100, "#fff", { track: "rgba(255,255,255,.25)", ink: "#fff", text: Math.round(x.health), fs: 24, w: 7, cls: "ring" })}
      <div><h2>${esc(x.name)}</h2><div class="meta">${esc(x.zone)} zone · ${esc(x.state)}</div></div></div>
      <div class="chips"><span class="chip">${x.band.icon} <b>${x.band.name}</b></span><span class="chip">#<b>${x.rank}</b> of ${NRANK}</span><span class="chip"><b>${X.cr(x.core_da)}</b> core</span></div>
      <div class="vs-pick small"><input id="pick${side}" type="search" placeholder="Change branch ${side}…" autocomplete="off"><div class="sugg" id="sugg${side}"></div></div></div>`;
  };
  function renderCompare() {
    const a = byId[state.ca], b = byId[state.cb];
    if (a && !b) { const s = suggestions(a)[0]; if (s) { location.replace(cHash(a.id, s[1].id, state.csec)); return; } }
    const sec = CSECS.find(s => s.id === state.csec) || CSECS[0], i = CSECS.indexOf(sec), prev = CSECS[i - 1], next = CSECS[i + 1];
    document.title = a && b ? `${a.name} vs ${b.name} · One Vision` : "Compare two branches · One Vision";
    const sug = a ? suggestions(a, b) : [];
    $("#view").innerHTML = `<div class="view-in">
      <div class="vs">${cardSide(a, "A", b)}<div class="vs-mid"><span>VS</span>${a && b ? `<a class="swap" href="${cHash(b.id, a.id, sec.id)}" title="Swap A and B">⇄</a>` : ""}</div>${cardSide(b, "B", a)}</div>
      ${a ? `<div class="sugg-row"><span class="muted">Compare ${esc(a.name)} with:</span>${sug.map(([t, x]) => `<a class="chip-l" href="${cHash(a.id, x.id, sec.id)}"><b>${esc(t)}</b> · ${esc(x.name)}</a>`).join("")}</div>` : ""}
      ${a && b ? `<div class="sh"><div><h1>${sec.name}</h1></div><div class="pager">${prev ? `<a href="${cHash(a.id, b.id, prev.id)}">← ${prev.name}</a>` : ""}${next ? `<a href="${cHash(a.id, b.id, next.id)}">${next.name} →</a>` : `<button class="ghost-btn" onclick="window.print()">Print / save PDF</button>`}</div><div class="ins" id="insight"></div></div><div id="sec"></div>`
        : `<div class="card" style="margin-top:8px"><div class="card-h"><h3>Pick two branches to compare them across every lens</h3><span class="sub">scorecard · sales · credit · operations · insurance · risk · local market · strategy</span></div>
          <div class="cmp" style="margin-bottom:10px">Or start with one of these match-ups:</div><div class="sugg-row">${examplePairs().map(([t, x, y]) => `<a class="chip-l" href="${cHash(x.id, y.id, "summary")}"><b>${esc(t)}</b> · ${esc(x.name)} vs ${esc(y.name)}</a>`).join("")}</div></div>`}</div>`;
    combo($("#pickA"), $("#suggA"), id => (location.hash = cHash(id, b && b.id !== id ? b.id : null, sec.id)));
    combo($("#pickB"), $("#suggB"), id => (location.hash = cHash(a ? a.id : null, id, sec.id)));
    if (a && b) (CSEC[sec.id] || CSEC.summary)(a, b, $("#sec"));
  }
  const nm = x => esc(x.name);
  const LEGAB = (a, b) => legend([[CA, nm(a)], [CB, nm(b)]]);
  const winner = (m, a, b) => { const va = a.v[m.id], vb = b.v[m.id]; if (va === null || vb === null) return 0; const d = (va - vb) * m.dir; return Math.abs(d) < 1e-9 ? 0 : d > 0 ? 1 : -1; };
  const CSEC = {};

  // ---------------- head to head
  CSEC.summary = (a, b, el) => {
    const ms = M.filter(m => m.p !== "market"), w = ms.map(m => winner(m, a, b));
    const wa = w.filter(x => x > 0).length, wb = w.filter(x => x < 0).length, tie = w.length - wa - wb;
    const pa = PILLARS.filter(p => p.w && a.pill[p.id] !== null && b.pill[p.id] !== null && a.pill[p.id] > b.pill[p.id]).map(p => p.name.toLowerCase());
    const pb = PILLARS.filter(p => p.w && a.pill[p.id] !== null && b.pill[p.id] !== null && b.pill[p.id] > a.pill[p.id]).map(p => p.name.toLowerCase());
    const lead = a.health >= b.health ? a : b, lag = lead === a ? b : a;
    setInsight(`<b>${nm(lead)}</b> is the healthier branch (${Math.round(lead.health)} vs ${Math.round(lag.health)}). ${nm(a)} wins <b>${wa}</b> of ${ms.length} metrics and ${nm(b)} wins <b>${wb}</b>${tie ? ` (${tie} level)` : ""}. ${pa.length ? `${nm(a)} leads on ${pa.join(", ")}` : ""}${pa.length && pb.length ? "; " : ""}${pb.length ? `${nm(b)} leads on ${pb.join(", ")}` : ""}.`);
    const oa = X.opportunities(a, asPeer(b)).slice(0, 3), ob = X.opportunities(b, asPeer(a)).slice(0, 3);
    el.innerHTML = `<div class="g g3">
        <div class="card score-duel"><div class="card-h"><h3>Scoreboard</h3><span class="sub">${ms.length} scored metrics</span></div>
          <div class="duel-big"><div style="color:${CA}"><b>${wa}</b><span>${nm(a)}</span></div><div class="dash">–</div><div style="color:${CB}"><b>${wb}</b><span>${nm(b)}</span></div></div>
          <div class="duel-bar"><i style="width:${(wa / ms.length) * 100}%;background:${CA}"></i><i style="width:${(tie / ms.length) * 100}%;background:${C.line2}"></i><i style="width:${(wb / ms.length) * 100}%;background:${CB}"></i></div>
          <div class="cmp" style="margin-top:8px">${tie} metric${tie === 1 ? "" : "s"} level or not comparable</div>
          <div class="stat" style="margin-top:14px"><div class="l">Health gap</div><div class="v">${Math.abs(Math.round(a.health - b.health))} pts <small class="cmp">in favour of ${nm(lead)}</small></div></div>
          <div class="stat"><div class="l">Rank gap</div><div class="v">${Math.abs(a.rank - b.rank)} places</div></div></div>
        <div class="card span2"><div class="card-h"><h3>Pillar by pillar</h3>${LEGAB(a, b)}</div><div id="butter" class="chart"></div></div></div>
      <div class="g g2">
        <div class="card"><div class="card-h"><h3>Shape of each branch</h3>${LEGAB(a, b)}</div><div id="cRadar" class="chart"></div></div>
        <div class="card" style="display:flex;flex-direction:column"><div class="card-h"><h3>On the map</h3><span class="sub">${a.state === b.state ? "same state" : esc(a.state) + " · " + esc(b.state)}</span></div><div id="cMap" class="map"></div></div></div>
      <div class="card" style="margin-bottom:18px"><div class="card-h"><h3>Metric by metric</h3><span class="sub">percentile vs network · the dot further right is better</span></div><div id="duel" class="chart"></div></div>
      <div class="g g2">
        <div class="card"><div class="card-h"><h3>What ${nm(a)} could learn from ${nm(b)}</h3><span class="sub">sized as if A matched B</span></div>${lessons(oa, a, b)}</div>
        <div class="card"><div class="card-h"><h3>What ${nm(b)} could learn from ${nm(a)}</h3><span class="sub">sized as if B matched A</span></div>${lessons(ob, b, a)}</div></div>`;
    butterfly($("#butter"), a, b);
    radar2($("#cRadar"), a, b);
    hexMap($("#cMap"), { branches: E, isOn: x => x.id === a.id || x.id === b.id, fill: x => (x.id === a.id ? CA : x.id === b.id ? CB : C.nat), r: (x, rs) => (x.id === a.id || x.id === b.id ? 7 : 1.6), minH: 320,
      callouts: [{ b: a, title: "A · " + a.name, value: `health ${Math.round(a.health)} · ${X.cr(a.core_da)}`, color: CA }, { b, title: "B · " + b.name, value: `health ${Math.round(b.health)} · ${X.cr(b.core_da)}`, color: CB }] });
    duel($("#duel"), a, b);
  };
  function lessons(ops, x, y) {
    if (!ops.length) return `<div class="empty" style="padding:18px">${nm(x)} is at or ahead of ${nm(y)} on conversion, cross-sell, approvals and mix.</div>`;
    return `<div class="sw" style="box-shadow:none;padding:0"><ul>${ops.map(o => `<li><b>${esc(o.title)}<em style="color:var(--brand)">${X.cr(o.val)}${o.unit}</em></b><p>${esc(o.text)}</p></li>`).join("")}</ul></div>`;
  }
  function butterfly(el, a, b) {
    el.innerHTML = "";
    const W = width(el), rh = 44, mg = { t: 10, b: 6 }, H = mg.t + mg.b + PILLARS.length * rh, mid = W / 2, half = mid - 90;
    const svg = svgIn(el, W, H, "Pillar butterfly");
    const x = d3.scaleLinear().domain([0, 100]).range([0, half]);
    PILLARS.forEach((p, i) => {
      const y0 = mg.t + i * rh, va = a.pill[p.id], vb = b.pill[p.id];
      svg.append("rect").attr("x", mid - 80 - x(100)).attr("y", y0 + 10).attr("width", x(100)).attr("height", 22).attr("rx", 11).attr("fill", C.soft2);
      svg.append("rect").attr("x", mid + 80).attr("y", y0 + 10).attr("width", x(100)).attr("height", 22).attr("rx", 11).attr("fill", C.soft2);
      if (va !== null) svg.append("rect").attr("x", mid - 80 - x(va)).attr("y", y0 + 10).attr("width", x(va)).attr("height", 22).attr("rx", 11).attr("fill", CA).attr("opacity", va >= (vb ?? -1) ? 1 : 0.55);
      if (vb !== null) svg.append("rect").attr("x", mid + 80).attr("y", y0 + 10).attr("width", x(vb)).attr("height", 22).attr("rx", 11).attr("fill", CB).attr("opacity", vb >= (va ?? -1) ? 1 : 0.55);
      svg.append("text").attr("x", mid).attr("y", y0 + 25).attr("text-anchor", "middle").attr("class", "lbl-b").text(p.name + (p.w ? "" : " *"));
      svg.append("text").attr("x", mid - 88 - x(va || 0)).attr("y", y0 + 25).attr("text-anchor", "end").attr("class", "lbl-b").text(va === null ? "–" : Math.round(va));
      svg.append("text").attr("x", mid + 88 + x(vb || 0)).attr("y", y0 + 25).attr("class", "lbl-b").text(vb === null ? "–" : Math.round(vb));
      svg.append("rect").attr("x", 0).attr("y", y0).attr("width", W).attr("height", rh).attr("fill", "transparent")
        .on("mousemove", ev => tip(`<b>${p.name}</b> <span class="k">${p.w ? p.w * 100 + "% of health" : "context only"}</span><br><span style="color:${CA}">●</span> ${nm(a)}: <b>${va === null ? "–" : Math.round(va)}</b><br><span style="color:${CB}">●</span> ${nm(b)}: <b>${vb === null ? "–" : Math.round(vb)}</b>`, ev)).on("mouseleave", untip);
    });
  }
  function radar2(el, a, b) {
    el.innerHTML = "";
    const W = Math.min(width(el), 540), H = W * 0.84, R = W * 0.3, cx = W / 2, cy = H / 2 + 4, n = PILLARS.length;
    const ang = i => -Math.PI / 2 + (i * 2 * Math.PI) / n, pt = (i, v) => [cx + Math.cos(ang(i)) * R * (v / 100), cy + Math.sin(ang(i)) * R * (v / 100)];
    const svg = svgIn(el, W, H, "Radar of both branches");
    for (const v of [25, 50, 75, 100]) svg.append("polygon").attr("points", PILLARS.map((_, i) => pt(i, v)).join(" ")).attr("fill", v === 100 ? C.soft : "none").attr("stroke", v === 50 ? C.nat : C.line).attr("stroke-dasharray", v === 50 ? "4 3" : null);
    PILLARS.forEach((Pi, i) => { svg.append("line").attr("x1", cx).attr("y1", cy).attr("x2", pt(i, 100)[0]).attr("y2", pt(i, 100)[1]).attr("stroke", C.line);
      const [lx, ly] = pt(i, 122), an = Math.abs(lx - cx) < 8 ? "middle" : lx > cx ? "start" : "end";
      svg.append("text").attr("x", lx).attr("y", ly).attr("text-anchor", an).attr("class", "lbl-b").text(Pi.name); });
    for (const [x, c] of [[b, CB], [a, CA]]) {
      svg.append("polygon").attr("points", PILLARS.map((Pi, i) => pt(i, x.pill[Pi.id] ?? 0)).join(" ")).attr("fill", c).attr("fill-opacity", 0.14).attr("stroke", c).attr("stroke-width", 2.2).attr("stroke-linejoin", "round");
      PILLARS.forEach((Pi, i) => { if (x.pill[Pi.id] === null) return; const [px, py] = pt(i, x.pill[Pi.id]); svg.append("circle").attr("cx", px).attr("cy", py).attr("r", 4.5).attr("fill", c).attr("stroke", "#fff").attr("stroke-width", 1.5); });
    }
  }
  function duel(el, a, b) {
    el.innerHTML = "";
    const ms = M, W = width(el, 1000), rh = 34, mg = { t: 26, b: 6 }, colL = Math.min(230, W * 0.3), colV = 86, H = mg.t + mg.b + ms.length * rh + PILLARS.length * 22;
    const x0 = colL + colV, x1 = W - colV - 34;
    const svg = svgIn(el, W, H, "Metric duel");
    const x = d3.scaleLinear().domain([0, 100]).range([x0 + 10, x1 - 10]);
    svg.append("text").attr("x", x0 - 8).attr("y", 14).attr("text-anchor", "end").style("font", "600 11px var(--ui)").style("fill", CA).text(a.name.length > 14 ? "A" : a.name);
    svg.append("text").attr("x", x1 + 8).attr("y", 14).style("font", "600 11px var(--ui)").style("fill", CB).text(b.name.length > 14 ? "B" : b.name);
    for (const t of [0, 25, 50, 75, 100]) { svg.append("line").attr("x1", x(t)).attr("x2", x(t)).attr("y1", mg.t - 6).attr("y2", H - mg.b).attr("stroke", t === 50 ? C.line2 : C.line).attr("stroke-dasharray", "2 3"); svg.append("text").attr("x", x(t)).attr("y", 14).attr("text-anchor", "middle").attr("class", "axl").text(t); }
    let y = mg.t;
    for (const P of PILLARS) {
      svg.append("text").attr("x", 0).attr("y", y + 14).style("font", "600 10.5px var(--ui)").style("letter-spacing", ".1em").style("fill", PILC[P.id]).text(P.name.toUpperCase() + (P.w ? "" : " · CONTEXT"));
      y += 22;
      for (const m of ms.filter(m => m.p === P.id)) {
        const pa = a.pct[m.id], pb = b.pct[m.id], w = winner(m, a, b), cy = y + rh / 2;
        svg.append("text").attr("x", 0).attr("y", cy + 4).attr("class", "lbl").text(m.label);
        svg.append("text").attr("x", x0 - 8).attr("y", cy + 4).attr("text-anchor", "end").style("font", `${w > 0 ? 700 : 500} 12.5px var(--ui)`).style("fill", w > 0 ? CA : C.ink2).text(X.fmt(m, a.v[m.id]));
        svg.append("text").attr("x", x1 + 8).attr("y", cy + 4).style("font", `${w < 0 ? 700 : 500} 12.5px var(--ui)`).style("fill", w < 0 ? CB : C.ink2).text(X.fmt(m, b.v[m.id]));
        if (pa !== null && pb !== null) svg.append("line").attr("x1", x(pa)).attr("x2", x(pb)).attr("y1", cy).attr("y2", cy).attr("stroke", C.line2).attr("stroke-width", 4).attr("stroke-linecap", "round");
        if (pb !== null) svg.append("circle").attr("cx", x(pb)).attr("cy", cy).attr("r", 6.5).attr("fill", CB).attr("stroke", "#fff").attr("stroke-width", 2);
        if (pa !== null) svg.append("circle").attr("cx", x(pa)).attr("cy", cy).attr("r", 6.5).attr("fill", CA).attr("stroke", "#fff").attr("stroke-width", 2);
        svg.append("text").attr("x", W - 4).attr("y", cy + 4).attr("text-anchor", "end").style("font", "700 12px var(--ui)").style("fill", w > 0 ? CA : w < 0 ? CB : C.muted).text(w > 0 ? "A" : w < 0 ? "B" : "=");
        svg.append("rect").attr("x", 0).attr("y", y).attr("width", W).attr("height", rh).attr("fill", "transparent")
          .on("mousemove", ev => tip(`<b>${m.label}</b> <span class="k">${m.sub}</span><br><span style="color:${CA}">●</span> ${nm(a)}: <b>${X.fmt(m, a.v[m.id])}</b> · better than ${pa === null ? "–" : Math.round(pa)}%<br><span style="color:${CB}">●</span> ${nm(b)}: <b>${X.fmt(m, b.v[m.id])}</b> · better than ${pb === null ? "–" : Math.round(pb)}%<br><span class="k">network median ${X.fmt(m, X.quantile(m, 0.5))}</span>`, ev)).on("mouseleave", untip);
        y += rh;
      }
    }
    svg.attr("viewBox", `0 0 ${W} ${y + mg.b}`);
  }

  // ---------------- business: sales + credit
  CSEC.business = (a, b, el) => {
    const conv = x => rt(x.core_da, x.core_la), ap = x => rt(x.c_san, x.c_dec);
    const mixA = X.shares(a, "sf_da_", CORE, a.core_da), mixB = X.shares(b, "sf_da_", CORE, b.core_da);
    const topA = CORE.slice().sort((p, q) => mixA[q] - mixA[p])[0], topB = CORE.slice().sort((p, q) => mixB[q] - mixB[p])[0];
    setInsight(`${nm(a)} disbursed <b>${X.cr(a.core_da)}</b> (core, Aug–Sep) against <b>${X.cr(b.core_da)}</b> at ${nm(b)}, converting ${pct0(conv(a))} vs ${pct0(conv(b))} of ₹ logged in. Approval: <b>${pct1(ap(a))}</b> vs <b>${pct1(ap(b))}</b>. Their biggest products are ${FAM[topA].toLowerCase()} and ${FAM[topB].toLowerCase()}${topA === topB ? " (the same)" : ""}.`);
    const xs = X.FULL;
    el.innerHTML = `<div class="g g2">
        <div class="card"><div class="card-h"><h3>Pipeline, side by side</h3><span class="sub">Aug–Sep · ₹ Cr</span></div><div id="cFun" class="chart"></div></div>
        <div class="card"><div class="card-h"><h3>Conversion & approval</h3>${LEGAB(a, b)}</div><div id="cConv" class="chart"></div></div></div>
      <div class="g g2">
        <div class="card"><div class="card-h"><h3>Product mix</h3><span class="sub">share of core disbursal, Aug–Sep</span></div><div id="cMix" class="chart"></div><div id="cMixLeg" style="margin-top:8px"></div></div>
        <div class="card"><div class="card-h"><h3>Sourcing channels</h3><span class="sub">share of ₹ logged in</span></div><div id="cChan" class="chart"></div><div id="cChanLeg" style="margin-top:8px"></div></div></div>
      <div class="g g2">
        <div class="card"><div class="card-h"><h3>Sanctioned ₹ per month</h3>${LEGAB(a, b)}</div><div id="cSan" class="chart"></div></div>
        <div class="card"><div class="card-h"><h3>Approval rate per month</h3>${LEGAB(a, b)}</div><div id="cApM" class="chart"></div></div></div>
      <div class="g g2">
        <div class="card"><div class="card-h"><h3>Approval by product</h3>${LEGAB(a, b)}</div><div id="cApP" class="chart"></div></div>
        <div class="card"><div class="card-h"><h3>Why each says no</h3><span class="sub">share of rejections, 13 months</span></div><div id="cRej" class="chart"></div><div id="cRejLeg" style="margin-top:8px"></div></div></div>`;
    vbars($("#cFun"), ["Logged in", "Sanctioned", "Disbursed"], [{ name: a.name, c: CA, v: [a.s_la, a.s_sa, a.s_da] }, { name: b.name, c: CB, v: [b.s_la, b.s_sa, b.s_da] }], { h: 250, yf: d => "₹" + d, tf: v => X.cr(v), labels: v => X.cr(v) });
    vbars($("#cConv"), ["Login → disbursal", "Approval rate", "Sanction → loan", "Insurance attach"],
      [{ name: a.name, c: CA, v: [conv(a), ap(a), rt(a.c_booked, a.c_san), X.value(MID.attach, a, false)].map(v => v || 0) }, { name: b.name, c: CB, v: [conv(b), ap(b), rt(b.c_booked, b.c_san), X.value(MID.attach, b, false)].map(v => v || 0) }],
      { h: 250, yf: d => (d * 100).toFixed(0) + "%", tf: pct1, labels: v => pct0(v) });
    const fam = CORE.filter(f => mixA[f] + mixB[f] > 0.001);
    stack100($("#cMix"), [{ name: a.name, me: true, parts: Object.fromEntries(fam.map(f => [FAM[f], a["sf_da_" + f]])) }, { name: b.name, parts: Object.fromEntries(fam.map(f => [FAM[f], b["sf_da_" + f]])) }], fam.map(f => FAM[f]), fam.map(f => FAMC[f]), { vf: v => X.cr(v), l: 130 });
    $("#cMixLeg").innerHTML = legend(fam.map(f => [FAMC[f], FAM[f], "sq"]));
    const chs = X.CHANNELS.filter(c => (a["sch_la_" + c] || 0) + (b["sch_la_" + c] || 0) > 0), chc = ["#5048e5", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#2a8fd6", "#8c86f5", "#f4a27c", "#a3a5bd"];
    stack100($("#cChan"), [{ name: a.name, me: true, parts: Object.fromEntries(chs.map(c => [c, a["sch_la_" + c]])) }, { name: b.name, parts: Object.fromEntries(chs.map(c => [c, b["sch_la_" + c]])) }], chs, chs.map(c => chc[X.CHANNELS.indexOf(c)]), { vf: v => X.cr(v), l: 130 });
    $("#cChanLeg").innerHTML = legend(chs.map(c => [chc[X.CHANNELS.indexOf(c)], c === "Self" ? "Self / walk-in" : c, "sq"]));
    lineChart($("#cSan"), [{ name: b.name, c: CB, v: xs.map(m => b["cm_sa_" + m] || 0) }, { name: a.name, c: CA, w: 2.5, area: true, v: xs.map(m => a["cm_sa_" + m] || 0) }], xs, { h: 240, label: "Sanctioned per month", xf: MON, yf: d => "₹" + d, tf: v => X.cr(v) });
    lineChart($("#cApM"), [{ name: b.name, c: CB, v: xs.map(m => (b["cm_dec_" + m] >= 5 ? rt(b["cm_san_" + m], b["cm_dec_" + m]) : null)) }, { name: a.name, c: CA, w: 2.5, v: xs.map(m => (a["cm_dec_" + m] >= 5 ? rt(a["cm_san_" + m], a["cm_dec_" + m]) : null)) }], xs, { h: 240, label: "Approval per month", xf: MON, yf: d => (d * 100).toFixed(0) + "%", tf: pct1, domain: [0, 1] });
    dumbbell($("#cApP"), CORE.map(f => ({ k: FAM[f], a: a["cf_dec_" + f] >= 15 ? rt(a["cf_san_" + f], a["cf_dec_" + f]) : null, b: b["cf_dec_" + f] >= 15 ? rt(b["cf_san_" + f], b["cf_dec_" + f]) : null, na: a["cf_dec_" + f] })), { domain: [0, 1], an: a.name, bn: b.name, unit: "decisions at A" });
    const rj = X.OV.meta.rej.filter(r => (a["cr_" + r] || 0) + (b["cr_" + r] || 0) > 0), rc = ["#5048e5", "#8c86f5", "#eb6834", "#eda100", "#1baf7a", "#e87ba4", "#2a8fd6", "#c9c6fb", "#a3a5bd"];
    stack100($("#cRej"), [{ name: a.name, me: true, parts: Object.fromEntries(rj.map(r => [r, a["cr_" + r]])) }, { name: b.name, parts: Object.fromEntries(rj.map(r => [r, b["cr_" + r]])) }], rj, rj.map(r => rc[X.OV.meta.rej.indexOf(r)]), { vf: v => f0(v) + " rejections", l: 130 });
    $("#cRejLeg").innerHTML = legend(rj.map(r => [rc[X.OV.meta.rej.indexOf(r)], r, "sq"]));
  };

  // ---------------- ops + insurance
  const ringDuel = (title, va, vb, dir, a, b, note) => {
    const w = va === null || vb === null ? 0 : Math.sign((va - vb) * dir);
    return `<div class="card rkc"><div class="t">${title}</div><div class="ring-duel">
      <div>${ringSVG(va, CA)}<b style="color:${w > 0 ? CA : C.ink}">${pct1(va)}</b><span>${nm(a)}</span></div>
      <div>${ringSVG(vb, CB)}<b style="color:${w < 0 ? CB : C.ink}">${pct1(vb)}</b><span>${nm(b)}</span></div></div>${note ? `<div class="c">${note}</div>` : ""}</div>`;
  };
  CSEC.service = (a, b, el) => {
    const ftr = x => rt(x.o_ftr, x.o_loans), att = x => X.value(MID.attach, x, false);
    const prem = x => rt(x.i_prem_as * 100, x.core_da);
    setInsight(`Dockets: <b>${pct0(ftr(a))}</b> first time right at ${nm(a)} vs <b>${pct0(ftr(b))}</b> at ${nm(b)} (${f0(a.o_loans)} and ${f0(b.o_loans)} HL &amp; MSME dockets). Cross-sell: ${pct0(att(a))} vs ${pct0(att(b))} of new loans insured, earning ₹${f1(prem(a) || 0)} vs ₹${f1(prem(b) || 0)} premium per ₹100 lent.`);
    el.innerHTML = `<div class="g g4">
        ${ringDuel("Docket first-time-right", ftr(a), ftr(b), 1, a, b, "HL & MSME dockets")}
        ${ringDuel("Loan no. within 3 days", rt(a.o_tat3, a.o_tatn), rt(b.o_tat3, b.o_tatn), 1, a, b, "login → LAN")}
        ${ringDuel("Digital e-sign", rt(a.o_esd, a.o_esn), rt(b.o_esd, b.o_esn), 1, a, b, "of signed dockets")}
        ${ringDuel("Insurance attach", att(a), att(b), 1, a, b, "loans disbursed Aug–Sep")}</div>
      <div class="g g2">
        <div class="card"><div class="card-h"><h3>First-time-right by month</h3>${LEGAB(a, b)}</div><div id="cFtr" class="chart"></div></div>
        <div class="card"><div class="card-h"><h3>Why dockets get queried</h3><span class="sub">share of queries</span></div><div id="cQ" class="chart"></div><div id="cQLeg" style="margin-top:8px"></div></div></div>
      <div class="g g2">
        <div class="card"><div class="card-h"><h3>Premium mix by cover</h3><span class="sub">share of premium, Apr–Oct</span></div><div id="cIns" class="chart"></div><div id="cInsLeg" style="margin-top:8px"></div></div>
        <div class="card"><div class="card-h"><h3>Insured loans per month</h3>${LEGAB(a, b)}</div><div id="cInsM" class="chart"></div></div></div>
      <div class="card"><div class="card-h"><h3>The numbers</h3></div><div class="scroll-x">${dtable(a, b, [
        ["Avg days, login → loan no.", x => rt(x.o_tat, x.o_tatn), v => f1(v), -1], ["Documents pending", x => x.o_docp, f0, -1], ["Docs overdue (share)", x => rt(x.o_doco, x.o_docs), pct1, -1],
        ["e-NACH registered", x => rt(x.o_enr, x.o_ena), pct1, 1], ["Premium per ₹100 lent", prem, v => "₹" + f1(v), 1], ["Policies per insured loan", x => rt(x.i_pol, x.i_loans), v => v.toFixed(2) + "×", 1],
        ["Premium, Apr–Oct", x => x.i_prem, v => X.cr(v), 1], ["Insured loans, Apr–Oct", x => x.i_loans, f0, 1]])}</div></div>`;
    lineChart($("#cFtr"), [{ name: b.name, c: CB, v: OM.map(m => (b["om_n_" + m] >= 3 ? rt(b["om_f_" + m], b["om_n_" + m]) : null)) }, { name: a.name, c: CA, w: 2.5, v: OM.map(m => (a["om_n_" + m] >= 3 ? rt(a["om_f_" + m], a["om_n_" + m]) : null)) }], OM, { h: 240, label: "FTR by month", xf: MON, yf: d => (d * 100).toFixed(0) + "%", tf: pct0, domain: [0, 1] });
    const qs = X.OV.meta.qreasons.filter(q => (a["oq_" + q] || 0) + (b["oq_" + q] || 0) > 0).sort((p, q) => (b["oq_" + q] + a["oq_" + q]) - (b["oq_" + p] + a["oq_" + p])).slice(0, 8);
    const qc = ["#5048e5", "#8c86f5", "#eb6834", "#eda100", "#1baf7a", "#e87ba4", "#2a8fd6", "#a3a5bd"];
    if (qs.length) { stack100($("#cQ"), [{ name: a.name, me: true, parts: Object.fromEntries(qs.map(q => [q, a["oq_" + q]])) }, { name: b.name, parts: Object.fromEntries(qs.map(q => [q, b["oq_" + q]])) }], qs, qc, { vf: v => f0(v) + " queries", l: 130 }); $("#cQLeg").innerHTML = legend(qs.map((q, i) => [qc[i], q, "sq"])); }
    else $("#cQ").innerHTML = `<div class="empty">No docket queries recorded.</div>`;
    stack100($("#cIns"), [{ name: a.name, me: true, parts: Object.fromEntries(ITYPES.map(t => [t, a["ip_" + t]])) }, { name: b.name, parts: Object.fromEntries(ITYPES.map(t => [t, b["ip_" + t]])) }], ITYPES, ITC, { vf: v => X.cr(v), l: 130 });
    $("#cInsLeg").innerHTML = legend(ITYPES.map((t, i) => [ITC[i], t, "sq"]));
    vbars($("#cInsM"), OM, [{ name: a.name, c: CA, v: OM.map(m => a["im_n_" + m] || 0) }, { name: b.name, c: CB, v: OM.map(m => b["im_n_" + m] || 0) }], { h: 240, xf: MON, tf: f0, yf: f0 });
  };
  function dtable(a, b, rows) {
    return `<table class="tbl"><thead><tr><th>Metric</th><th style="color:${CA}">${nm(a)}</th><th style="color:${CB}">${nm(b)}</th><th>Better</th></tr></thead><tbody>${rows.map(([k, f, fmt, dir]) => {
      const va = f(a), vb = f(b), ok = v => v !== null && v !== undefined && isFinite(v);
      const w = ok(va) && ok(vb) && Math.abs(va - vb) > 1e-9 ? Math.sign((va - vb) * dir) : 0;
      return `<tr><td>${k}</td><td style="${w > 0 ? `color:${CA};font-weight:600` : ""}">${ok(va) ? fmt(va) : "–"}</td><td style="${w < 0 ? `color:${CB};font-weight:600` : ""}">${ok(vb) ? fmt(vb) : "–"}</td><td><b style="color:${w > 0 ? CA : w < 0 ? CB : C.muted}">${w > 0 ? "A" : w < 0 ? "B" : "="}</b></td></tr>`; }).join("")}</tbody></table>`;
  }

  // ---------------- risk + market
  CSEC.risk = (a, b, el) => {
    const ms = ["07", "08", "09"], ML = { "07": "Jul 26", "08": "Aug 26", "09": "Sep 26" };
    const bn = (o, m) => (o["r_du_" + m] >= 15 ? o["r_bn_" + m] / o["r_du_" + m] : null), sec = x => rt(x.r_saum_09, x.r_aum_09);
    const ma = X.market(a.mk_key, "09"), mb = X.market(b.mk_key, "09"), bb = o => (o && o.b1acc ? o.b1bacc / o.b1acc : null), np = o => (o && o.pos ? o.NPA / o.pos : null);
    setInsight(`EMI bounce in September: <b>${pct1(bn(a, "09"))}</b> at ${nm(a)} vs <b>${pct1(bn(b, "09"))}</b> at ${nm(b)} (network ${pct1(bn(NAT, "09"))}). Their new books are ${pct0(sec(a))} and ${pct0(sec(b))} secured. Local markets: ${esc(a.mk_name)} (${pct0(bb(ma))} B1 bounce) ${a.mk_key === b.mk_key ? "— the same market for both." : `vs ${esc(b.mk_name)} (${pct0(bb(mb))}).`}`);
    el.innerHTML = `<div class="g g4">
        ${ringDuel("Secured share of book", sec(a), sec(b), 1, a, b, "AUM, Sep 2026")}
        ${ringDuel("CIBIL above 730", rt(a.r_caum_09, a.r_aum_09), rt(b.r_caum_09, b.r_aum_09), 1, a, b, "share of AUM")}
        ${ringDuel("Book in any DPD", rt(a.r_p1_09, a.r_aum_09), rt(b.r_p1_09, b.r_aum_09), -1, a, b, "lower is better")}
        ${ringDuel("Local B1 bounce", bb(ma), bb(mb), -1, a, b, "their local markets, Sep")}</div>
      <div class="g g2">
        <div class="card"><div class="card-h"><h3>EMI bounce rate</h3>${legend([[CA, nm(a)], [CB, nm(b)], [C.nat, "network", "dash"]])}</div><div id="cBn" class="chart"></div></div>
        <div class="card"><div class="card-h"><h3>New book (AUM)</h3>${LEGAB(a, b)}</div><div id="cAum" class="chart"></div></div></div>
      <div class="g g2">
        <div class="card"><div class="card-h"><h3>Bounce by product · Sep</h3>${LEGAB(a, b)}</div><div id="cBnP" class="chart"></div></div>
        <div class="card"><div class="card-h"><h3>CIBIL mix</h3><span class="sub">share of AUM, Sep 2026</span></div><div id="cCib" class="chart"></div><div id="cCibLeg" style="margin-top:8px"></div></div></div>
      <div class="g g2">
        <div class="card"><div class="card-h"><h3>Local market buckets</h3><span class="sub">POS by bucket, Sep</span></div><div id="cBk" class="chart"></div>${legend([[C.brand, "B1", "sq"], ["#8c86f5", "B2", "sq"], ["#eda100", "B3", "sq"], [C.bad, "NPA", "sq"]])}</div>
        <div class="card"><div class="card-h"><h3>Local markets</h3></div><div class="scroll-x">${dtable(a, b, [
          ["Local loan book (POS)", x => (X.market(x.mk_key, "09") || {}).pos, v => X.fmt(MID.msize, v), 1], ["B1 accounts bouncing", x => bb(X.market(x.mk_key, "09")), pct1, -1],
          ["B1 ₹ resolved", x => { const o = X.market(x.mk_key, "09"); return o && o.b1pos ? o.b1rpos / o.b1pos : null; }, pct1, 1], ["NPA share of book", x => np(X.market(x.mk_key, "09")), pct1, -1], ["Market attractiveness", x => x.attract, v => Math.round(v), 1]]).replace("<tbody>", `<tbody><tr><td>Market</td><td>${esc(a.mk_name)}</td><td>${esc(b.mk_name)}</td><td></td></tr>`)}</div></div></div>`;
    lineChart($("#cBn"), [{ name: "Network", c: C.nat, dash: "5 4", v: ms.map(m => bn(NAT, m)) }, { name: b.name, c: CB, v: ms.map(m => bn(b, m)) }, { name: a.name, c: CA, w: 2.5, v: ms.map(m => bn(a, m)) }], ms, { h: 240, label: "Bounce", xf: m => ML[m], yf: d => (d * 100).toFixed(0) + "%", tf: pct1, endLabels: true });
    vbars($("#cAum"), ms, [{ name: a.name, c: CA, v: ms.map(m => a["r_aum_" + m] || 0) }, { name: b.name, c: CB, v: ms.map(m => b["r_aum_" + m] || 0) }], { h: 240, xf: m => ML[m], yf: d => "₹" + d, tf: v => X.cr(v), labels: v => X.cr(v) });
    dumbbell($("#cBnP"), CORE.map(f => ({ k: FAM[f], a: a["rf_du_" + f] >= 15 ? rt(a["rf_bn_" + f], a["rf_du_" + f]) : null, b: b["rf_du_" + f] >= 15 ? rt(b["rf_bn_" + f], b["rf_du_" + f]) : null, na: a["rf_du_" + f] })), { tf: pct1, an: a.name, bn: b.name, unit: "EMIs due at A" });
    const CBN = [["rc_ntc", "New to credit"], ["rc_lt680", "≤ 680"], ["rc_681_730", "681–730"], ["rc_731_770", "731–770"], ["rc_771_790", "771–790"], ["rc_ge791", "≥ 791"]], cc = ["#a3a5bd", C.bad, "#f4a27c", "#c9c6fb", "#8c86f5", C.brand];
    stack100($("#cCib"), [{ name: a.name, me: true, parts: Object.fromEntries(CBN.map(([k, n]) => [n, a[k] || 0])) }, { name: b.name, parts: Object.fromEntries(CBN.map(([k, n]) => [n, b[k] || 0])) }], CBN.map(c => c[1]), cc, { vf: v => X.cr(v), l: 130 });
    $("#cCibLeg").innerHTML = legend(CBN.map((c, i) => [cc[i], c[1], "sq"]));
    const bk = o => ({ B1: o ? o.B1 : 0, B2: o ? o.B2 : 0, B3: o ? o.B3 : 0, NPA: o ? o.NPA : 0 });
    stack100($("#cBk"), [{ name: a.mk_name, me: true, parts: bk(ma) }, { name: b.mk_name, parts: bk(mb) }], ["B1", "B2", "B3", "NPA"], [C.brand, "#8c86f5", "#eda100", C.bad], { vf: v => X.cr(v), l: 130 });
  };

  // ---------------- strategy
  CSEC.strategy = (a, b, el) => {
    const ga = X.geCell(a), gb = X.geCell(b);
    setInsight(`GE–McKinsey calls: <b>${nm(a)}</b> → ${ga.verdict.toLowerCase()}; <b>${nm(b)}</b> → ${gb.verdict.toLowerCase()}. The SWOTs below are computed against each branch's own state peers, so they show what each should fix in its own context.`);
    const sw = x => { const P = X.peers(x, "state"), s = X.swot(x, P); return { P, s }; };
    const A = sw(a), Bq = sw(b);
    const col = (x, S, c) => `<div class="card"><div class="card-h"><h3 style="color:${c}">${nm(x)}</h3><span class="sub">vs ${esc(S.P.name)}</span></div>
      ${[["S", "Strengths", C.good, S.s.S.map(i => [i.title, i.text])], ["W", "Weaknesses", C.bad, S.s.W.map(i => [i.title, i.text])], ["O", "Opportunities", C.brand, S.s.O.map(i => [i.title + " · " + X.cr(i.val) + i.unit, i.text])], ["T", "Threats", C.ink, S.s.T.map(i => [i.title, i.text])]]
        .map(([k, n, cc, items]) => `<div class="mini-sw"><span class="k" style="background:${cc}">${k}</span><div><b>${n}</b>${items.length ? items.slice(0, 2).map(([t, p]) => `<p><b>${esc(t)}</b> — ${esc(p)}</p>`).join("") : `<p class="muted">Nothing flagged.</p>`}</div></div>`).join("")}</div>`;
    el.innerHTML = `<div class="g g2"><div class="card"><div class="card-h"><h3>GE–McKinsey nine-box</h3>${LEGAB(a, b)}</div><div id="cGe" class="chart"></div></div>
        <div class="card"><div class="card-h"><h3>Product portfolios (BCG)</h3>${legend(CORE.map(f => [FAMC[f], FAM_SHORT[f]]))}</div><div class="g g2" style="margin:0"><div><div class="cmp" style="color:${CA};font-weight:600">${nm(a)}</div><div id="bcgA" class="chart"></div></div><div><div class="cmp" style="color:${CB};font-weight:600">${nm(b)}</div><div id="bcgB" class="chart"></div></div></div><p class="note" id="bcgN"></p></div></div>
      <div class="g g2">${col(a, A, CA)}${col(b, Bq, CB)}</div>
      <div class="card"><div class="card-h"><h3>Strategy canvas</h3>${legend([[CA, nm(a)], [CB, nm(b)], [C.nat, "top quartile", "dash"]])}</div><div id="cCanvas" class="chart"></div></div>`;
    // GE with both
    { const e2 = $("#cGe"), W = width(e2), H = Math.round(W * 0.72), m = { t: 12, r: 12, b: 42, l: 44 }, svg = svgIn(e2, W, H, "GE nine-box");
      const x = d3.scaleLinear().domain([0, 100]).range([m.l, W - m.r]), y = d3.scaleLinear().domain([0, 100]).range([H - m.b, m.t]);
      const tone = s => (s >= 3 ? "#ddf3e8" : s === 2 ? "#fbefd3" : "#fde2e4"), names = { 4: "Invest", 3: "Grow", 2: "Hold", 1: "Harvest", 0: "Exit" };
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const x0 = x(i * 100 / 3), x1 = x((i + 1) * 100 / 3), y0 = y((j + 1) * 100 / 3), y1 = y(j * 100 / 3);
        svg.append("rect").attr("x", x0 + 2).attr("y", y0 + 2).attr("width", x1 - x0 - 4).attr("height", y1 - y0 - 4).attr("rx", 12).attr("fill", tone(i + j));
        svg.append("text").attr("x", x0 + 10).attr("y", y0 + 20).attr("class", "lbl").style("fill", C.muted).style("stroke", tone(i + j)).text(names[i + j]); }
      svg.append("g").selectAll("circle").data(E.filter(p => p.attract !== null && p.id !== a.id && p.id !== b.id)).join("circle").attr("cx", d => x(d.health)).attr("cy", d => y(d.attract)).attr("r", 2).attr("fill", C.nat).attr("opacity", 0.35);
      for (const [p, c, t] of [[b, CB, "B"], [a, CA, "A"]]) if (p.attract !== null) {
        svg.append("circle").attr("cx", x(p.health)).attr("cy", y(p.attract)).attr("r", 11).attr("fill", c).attr("stroke", "#fff").attr("stroke-width", 3);
        svg.append("text").attr("x", x(p.health)).attr("y", y(p.attract) + 4).attr("text-anchor", "middle").attr("class", "lbl-w").text(t); }
      svg.append("g").attr("class", "ax").attr("transform", `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickValues([0, 33, 67, 100]).tickSizeOuter(0));
      svg.append("g").attr("class", "ax").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).tickValues([0, 33, 67, 100]).tickSizeOuter(0));
      svg.append("text").attr("class", "axl").attr("x", (m.l + W - m.r) / 2).attr("y", H - 6).attr("text-anchor", "middle").text("branch strength = health score →");
      svg.append("text").attr("class", "axl").attr("transform", `translate(12,${(m.t + H - m.b) / 2}) rotate(-90)`).attr("text-anchor", "middle").text("market attractiveness →"); }
    const ba = X.bcg(a), bb = X.bcg(b);
    renderBCG(a, ba, $("#bcgA"), null, true); renderBCG(b, bb, $("#bcgB"), null, true);
    const st = d => d.filter(x => x.q === "Star").map(x => x.short).join(", ") || "none";
    $("#bcgN").innerHTML = `Stars — <b style="color:${CA}">${nm(a)}</b>: ${st(ba)} · <b style="color:${CB}">${nm(b)}</b>: ${st(bb)}. Relative share is against the biggest other branch in each one's own state.`;
    // canvas with both
    { const e3 = $("#cCanvas"); e3.innerHTML = ""; const ms = M.filter(m => m.p !== "market");
      const W = width(e3, 1000), step = (W - 80) / ms.length, rot = step < 84, H = rot ? 380 : 330, mg = { t: 40, r: 16, b: rot ? 96 : 52, l: 44 }, svg = svgIn(e3, W, H, "Strategy canvas");
      const x = d3.scalePoint().domain(ms.map(m => m.id)).range([mg.l + 10, W - mg.r - 10]), y = d3.scaleLinear().domain([0, 100]).range([H - mg.b, mg.t]);
      svg.append("g").attr("class", "gridl").selectAll("line").data([0, 25, 50, 75, 100]).join("line").attr("x1", mg.l).attr("x2", W - mg.r).attr("y1", d => y(d)).attr("y2", d => y(d));
      svg.append("g").attr("class", "ax").attr("transform", `translate(${mg.l},0)`).call(d3.axisLeft(y).tickValues([0, 25, 50, 75, 100]).tickSizeOuter(0)).select(".domain").remove();
      for (const Pi of PILLARS.filter(p => p.id !== "market")) { const g = ms.filter(m => m.p === Pi.id), x0 = Math.max(mg.l, x(g[0].id) - x.step() / 2), x1 = Math.min(W - mg.r, x(g[g.length - 1].id) + x.step() / 2);
        svg.append("rect").attr("x", x0 + 3).attr("width", x1 - x0 - 6).attr("y", 4).attr("height", 22).attr("rx", 11).attr("fill", PILC[Pi.id]).attr("opacity", 0.12);
        svg.append("text").attr("x", (x0 + x1) / 2).attr("y", 19).attr("text-anchor", "middle").style("font", "600 10.5px var(--ui)").style("letter-spacing", ".08em").style("fill", PILC[Pi.id]).text(Pi.name.toUpperCase()); }
      const lab = svg.append("g").selectAll("text").data(ms).join("text").attr("class", "axl").style("fill", C.ink2);
      if (rot) lab.attr("text-anchor", "end").attr("transform", d => `translate(${x(d.id) + 4},${H - mg.b + 16}) rotate(-35)`).text(d => d.short); else lab.attr("text-anchor", "middle").attr("x", d => x(d.id)).attr("y", H - mg.b + 20).text(d => d.short);
      svg.append("line").attr("x1", mg.l).attr("x2", W - mg.r).attr("y1", y(75)).attr("y2", y(75)).attr("stroke", C.nat).attr("stroke-width", 2).attr("stroke-dasharray", "5 4");
      const line = d3.line().defined(d => d[1] !== null).x(d => x(d[0])).y(d => y(d[1]));
      for (const [p, c, w] of [[b, CB, 2], [a, CA, 2.5]]) { const pts = ms.map(m => [m.id, p.pct[m.id]]);
        svg.append("path").attr("d", line(pts)).attr("fill", "none").attr("stroke", c).attr("stroke-width", w);
        svg.append("g").selectAll("circle").data(pts.filter(d => d[1] !== null)).join("circle").attr("cx", d => x(d[0])).attr("cy", d => y(d[1])).attr("r", 4.5).attr("fill", c).attr("stroke", "#fff").attr("stroke-width", 1.5); }
      svg.append("g").selectAll("rect").data(ms).join("rect").attr("x", d => x(d.id) - x.step() / 2).attr("width", x.step()).attr("y", mg.t).attr("height", H - mg.b - mg.t).attr("fill", "transparent")
        .on("mousemove", (ev, m) => tip(`<b>${m.label}</b><br><span style="color:${CA}">●</span> ${nm(a)}: <b>${X.fmt(m, a.v[m.id])}</b> (${a.pct[m.id] === null ? "–" : Math.round(a.pct[m.id])})<br><span style="color:${CB}">●</span> ${nm(b)}: <b>${X.fmt(m, b.v[m.id])}</b> (${b.pct[m.id] === null ? "–" : Math.round(b.pct[m.id])})`, ev)).on("mouseleave", untip); }
  };

  // ---------------- comparison memo
  CSEC.memo = (a, b, el) => {
    const key = "c|" + a.id + "|" + b.id, cached = MEMO[key];
    const ms = M.filter(m => m.p !== "market"), wa = ms.filter(m => winner(m, a, b) > 0), wb = ms.filter(m => winner(m, a, b) < 0);
    const big = (list, x, y) => list.slice().sort((m, n) => Math.abs(x.pct[n.id] - y.pct[n.id]) - Math.abs(x.pct[m.id] - y.pct[m.id])).slice(0, 4);
    const oa = X.opportunities(a, asPeer(b)).slice(0, 3), ob = X.opportunities(b, asPeer(a)).slice(0, 3);
    setInsight(`A side-by-side brief for both branch managers and their cluster head. ${AI ? "Press <b>Write with AI</b> for a model-written version." : "Run <code>python3 ai_server.py</code> to let AI write it."}`);
    const lead = a.health >= b.health ? a : b, lag = lead === a ? b : a;
    const rule = `<h4>Verdict</h4><p><b>${nm(lead)}</b> is the stronger branch (health ${Math.round(lead.health)} vs ${Math.round(lag.health)}; rank #${lead.rank} vs #${lag.rank}). ${nm(a)} wins ${wa.length} metrics, ${nm(b)} wins ${wb.length}.</p>
      <h4>Where ${nm(a)} is ahead</h4>${wa.length ? `<ul>${big(wa, a, b).map(m => `<li><b>${m.label}</b>: ${X.fmt(m, a.v[m.id])} vs ${X.fmt(m, b.v[m.id])}.</li>`).join("")}</ul>` : "<p>Nowhere clearly.</p>"}
      <h4>Where ${nm(b)} is ahead</h4>${wb.length ? `<ul>${big(wb, b, a).map(m => `<li><b>${m.label}</b>: ${X.fmt(m, b.v[m.id])} vs ${X.fmt(m, a.v[m.id])}.</li>`).join("")}</ul>` : "<p>Nowhere clearly.</p>"}
      <h4>Playbook for ${nm(a)}</h4>${oa.length ? `<ol>${oa.map(o => `<li><b>${esc(o.title)}</b> (${X.cr(o.val)}${o.unit}). ${esc(o.text)}</li>`).join("")}</ol>` : "<p>Nothing to copy from B on these levers.</p>"}
      <h4>Playbook for ${nm(b)}</h4>${ob.length ? `<ol>${ob.map(o => `<li><b>${esc(o.title)}</b> (${X.cr(o.val)}${o.unit}). ${esc(o.text)}</li>`).join("")}</ol>` : "<p>Nothing to copy from A on these levers.</p>"}`;
    el.innerHTML = `<div class="card memo"><div class="mh"><div><div class="eyebrow">${nm(a)} vs ${nm(b)} · From: One Vision</div><div class="who">${cached ? "Written by AI from the numbers in this dashboard" : "Drafted from the rules behind this dashboard"}</div></div>${AI ? `<button id="memoBtn">✨ ${cached ? "Rewrite" : "Write"} with AI</button>` : ""}</div>
      <div class="memo-grid"><div class="body" id="memoBody">${cached ? md(cached) : rule}</div>
      <aside class="memo-aside"><div class="ma" style="border-left:4px solid ${CA}"><span>A · ${nm(a)}</span><b>${Math.round(a.health)}<small>/100 · #${a.rank}</small></b><em>${X.geCell(a).verdict}</em></div>
        <div class="ma" style="border-left:4px solid ${CB}"><span>B · ${nm(b)}</span><b>${Math.round(b.health)}<small>/100 · #${b.rank}</small></b><em>${X.geCell(b).verdict}</em></div>
        <div class="ma"><span>Metric wins</span><b>${wa.length} – ${wb.length}</b><em>A – B, of ${ms.length}</em></div></aside></div></div>`;
    const bt = $("#memoBtn");
    if (bt) bt.onclick = async () => {
      bt.disabled = true; bt.textContent = "Writing…";
      try {
        const sys = "You are a senior partner at a top strategy consultancy. Write a one-page comparison memo of two Indian retail-lending branches for their cluster head. Use ONLY the numbers in the JSON; never invent figures. Use these ### headings: Verdict (one sentence), Where A is ahead, Where B is ahead, What each should copy from the other (with ₹ impact where given and a 30-day first step), Watch-list. Use ₹ Cr / ₹ L. Under 350 words. Plain markdown.";
        const body = { A: facts(a, X.peers(a, "state")), B: facts(b, X.peers(b, "state")), A_learn_from_B: oa.map(o => `${o.title} (${X.cr(o.val)}${o.unit}): ${o.text}`), B_learn_from_A: ob.map(o => `${o.title} (${X.cr(o.val)}${o.unit}): ${o.text}`) };
        const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "system", content: sys }, { role: "user", content: JSON.stringify(body) }] }) });
        const j = await r.json(); if (!r.ok) throw new Error((j.error && j.error.message) || "AI request failed");
        MEMO[key] = j.choices[0].message.content;
      } catch (e) { $("#memoBody").insertAdjacentHTML("afterbegin", `<p style="color:var(--bad)">AI could not write the memo: ${esc(e.message).slice(0, 200)}.</p>`); bt.disabled = false; bt.textContent = "✨ Try again"; return; }
      if (state.view === "compare" && state.csec === "memo") render();
    };
  };

  // =================================================================== v4 · METHOD DRAWER
  const PCT = v => (v * 100).toFixed(v < 0.1 ? 1 : 0) + "%";
  const howBtn = (key, label) => `<button class="how" data-how="${esc(key)}" title="How is this calculated?" aria-label="How is this calculated?"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/></svg>${label || "How"}</button>`;
  const drawer = document.createElement("aside"); drawer.id = "how"; drawer.className = "drawer"; drawer.setAttribute("aria-hidden", "true");
  document.body.appendChild(drawer);
  const scrim = document.createElement("div"); scrim.className = "scrim"; document.body.appendChild(scrim);
  const closeHow = () => { drawer.classList.remove("on"); scrim.classList.remove("on"); drawer.setAttribute("aria-hidden", "true"); };
  scrim.onclick = closeHow; addEventListener("keydown", e => { if (e.key === "Escape") closeHow(); });
  function openHow(key) {
    const b = (state.view === "branch" && byId[state.id]) || null, P = b ? X.peers(b, state.peer) : null;
    const [k, arg] = key.split(":");
    const H = HOW[k]; if (!H) return;
    const o = H(arg, b, P);
    drawer.innerHTML = `<div class="dr-h"><div><div class="eyebrow">How is this calculated?</div><h3>${o.t}</h3></div><button class="dr-x" aria-label="Close">×</button></div><div class="dr-b">${o.h}</div>`;
    drawer.querySelector(".dr-x").onclick = closeHow;
    drawer.classList.add("on"); scrim.classList.add("on"); drawer.setAttribute("aria-hidden", "false");
  }
  document.addEventListener("click", e => { const t = e.target.closest("[data-how]"); if (t) { e.preventDefault(); e.stopPropagation(); openHow(t.dataset.how); } });
  const step = (n, t, body) => `<div class="hs-step"><span class="n">${n}</span><div><b>${t}</b>${body ? `<p>${body}</p>` : ""}</div></div>`;
  const HOW = {
    health: (a, b) => {
      const ws = PILLARS.filter(p => p.w), wsum = sum(ws, p => p.w);
      return { t: "Health score", h: `${step(1, "20 metrics, each turned into a percentile", `Every metric is ranked against the ${NRANK} scored branches. 100 = best in the network, whichever direction “good” is (low bounce scores high).`)}
        ${step(2, "Small branches are pulled toward the network rate", "Rates use <code>(events + k × network rate) ÷ (volume + k)</code>, so a branch with 6 loans can't top a table on luck. k is set per metric (e.g. 60 decisions for approval).")}
        ${step(3, "Metrics average into five pillars", ws.map(p => `${p.name} <b>${Math.round((p.w / wsum) * 100)}%</b>`).join(" · ") + ". Local market is context only and doesn't count.")}
        ${step(4, "The weighted blend is re-ranked", "So health 80 reads “healthier than 80% of branches”. Leader / Steady / Lagging are the top, middle and bottom thirds.")}
        ${b ? `<div class="hs-ex"><div class="eyebrow">${esc(b.name)}, worked through</div><table class="mtab">${ws.map(p => `<tr><td class="nm">${p.name}</td><td class="val">${b.pill[p.id] === null ? "–" : Math.round(b.pill[p.id])}</td><td class="peer">× ${Math.round((p.w / wsum) * 100)}%</td><td class="pn">${b.pill[p.id] === null ? "–" : "+" + ((b.pill[p.id] * p.w) / wsum).toFixed(1)}</td></tr>`).join("")}
          <tr class="tot"><td class="nm">Weighted blend</td><td></td><td></td><td class="pn">${Math.round(b.composite)}</td></tr><tr class="tot"><td class="nm">Re-ranked → health</td><td></td><td></td><td class="pn">${Math.round(b.health)} · #${b.rank}</td></tr></table></div>` : ""}` };
    },
    metric: (id, b) => {
      const m = MID[id]; if (!m) return { t: "Metric", h: "" };
      let ex = "";
      if (b && !m.level) {
        const n = b[m.num] || 0, d = b[m.den] || 0, raw = d > 0 ? n / d : null;
        ex = `<div class="hs-ex"><div class="eyebrow">${esc(b.name)}, worked through</div><table class="mtab">
          <tr><td class="nm">Events (${m.num})</td><td class="val">${f1(n)}</td></tr><tr><td class="nm">Volume (${m.den})</td><td class="val">${f1(d)}</td></tr>
          ${m.growth ? `<tr><td class="nm">Growth, damped by k=${m.k}</td><td class="val">${X.fmt(m, b.v[m.id])}</td></tr>` : `<tr><td class="nm">Raw rate</td><td class="val">${raw === null ? "–" : X.fmt(m, m.mult ? raw * m.mult : raw)}</td></tr>
          <tr><td class="nm">Network rate (prior)</td><td class="val">${X.fmt(m, m.mult ? m.prior * m.mult : m.prior)}</td></tr><tr><td class="nm">Shrunk with k = ${m.k}</td><td class="val">${X.fmt(m, b.v[m.id])}</td></tr>`}
          <tr class="tot"><td class="nm">Percentile (100 = best)</td><td class="val">${b.pct[m.id] === null ? "–" : Math.round(b.pct[m.id])}</td></tr></table>
          ${d < m.minDen ? `<p class="note">Below the minimum volume of ${m.minDen}, so it isn't scored for this branch.</p>` : ""}</div>`;
      } else if (b) ex = `<div class="hs-ex"><div class="eyebrow">${esc(b.name)}</div><p>${X.fmt(m, b.v[m.id])}, better than ${b.pct[m.id] === null ? "–" : Math.round(b.pct[m.id])}% of branches.</p></div>`;
      return { t: m.label, h: `<p class="lead">${m.sub}. ${m.dir > 0 ? "Higher is better." : "Lower is better."} Pillar: <b>${PILLARS.find(p => p.id === m.p).name}</b>${m.p === "market" ? " (context, not scored)" : ""}.</p>
        ${m.level ? step(1, "A level, not a rate", "Compared as-is; peers are the average branch in the group.") : step(1, "Formula", `<code>${m.num} ÷ ${m.den}</code>${m.mult ? ` × ${m.mult}` : ""}, scored only when volume ≥ ${m.minDen}.`) + step(2, "Shrinkage", `<code>(events + ${m.k} × network) ÷ (volume + ${m.k})</code>: small branches are pulled toward the network rate.`)}
        ${step(m.level ? 2 : 3, "Percentile", `Ranked against ${X.DIST[m.id].length} branches with enough volume. Network median ${X.fmt(m, X.quantile(m, 0.5))}, top 10% at ${X.fmt(m, X.quantile(m, 0.9))}.`)}${ex}` };
    },
    opps: () => ({ t: "Sized opportunities", h: `${step(1, "Benchmark", "Each branch is compared with its peer group's pooled rate or mix (state peers by default).")}
      ${step(2, "Close half the gap", "₹ upside assumes the branch closes the gap to peers and spreads it over the two-month sales window, giving a monthly figure: indicative, not a target.")}
      ${step(3, "Levers", "<b>Conversion</b> = login-to-disbursal yield on today's logins · <b>Approval</b> = extra sanctions at the branch's ticket size · <b>Insurance</b> = premium from more insured loans · <b>Product mix</b> / <b>Channel</b> = white space where peers do ≥ 2.5× the share.")}
      ${step(4, "Collections", "Shown separately as ₹ of book that would leave DPD at the peer DPD rate: a stock, not a monthly flow, so it is never added to the others.")}` }),
    whatif: () => ({ t: "What-if simulator", h: `${step(1, "Move a lever", "Each slider sets a new value for one scored metric, from the network's bottom 5% to its top 5%.")}
      ${step(2, "Re-score exactly", "The new value gets a new percentile, pillars are re-averaged and the weighted blend is re-ranked against the other branches' real blends: same maths as the live score.")}
      ${step(3, "Translate to ₹", "Approval: Δ × monthly decisions × ticket size · Conversion: Δ × monthly logins · Booking: Δ × monthly sanctioned ₹ · Insurance: Δ × monthly loans × network premium per insured loan · Bounce: Δ × EMIs due · DPD: Δ × AUM.")}
      ${step(4, "Assumes everyone else stands still", "Other branches keep today's scores, so the rank is the branch's position if it moved alone.")}` }),
    twins: () => ({ t: "Twin finder", h: `${step(1, "Look-alike score", "Branches are compared on size (log of core disbursal, weight 1.4), product mix (six product shares, 0.55 each), local-market attractiveness (0.8) and local bounce (0.5), each standardised across the network.")}
      ${step(2, "Similarity 0–100", "100 = identical profile; 0 = as different as the 90th-percentile pair.")}
      ${step(3, "Better twins", "Among the 40 closest, branches at least 8 health points ahead, ranked by similarity and health together.")}
      ${step(4, "What explains the gap", "For each metric: (twin percentile − branch percentile) × pillar weight ÷ metrics in the pillar. The biggest contributors are the gap.")}` }),
    ask: () => ({ t: "Ask One Vision", h: `${step(1, "Question → filter", "Your question is turned into a structured query: places (state, zone), conditions on metrics (high / low / good / poor / above x%), a sort and a limit.")}
      ${step(2, "Who interprets it", "With AI on, the model writes the query (it never sees or invents numbers). Offline, a built-in parser understands metric names, states, zones and words like top, worst, high, low.")}
      ${step(3, "High vs good", "“High bounce” means the raw value is in the top third; “good bounce” means the healthy third (low). Every condition is shown as a chip so you can check the reading.")}
      ${step(4, "Answer", "Matches are drawn on the map, plotted on the two most relevant measures and listed.")}` }),
  };

  // =================================================================== v4 · HEADLINE INFOGRAPHICS
  const PICT = {
    person: '<circle cx="12" cy="7" r="4"/><path d="M4 22c0-4.4 3.6-8 8-8s8 3.6 8 8z"/>',
    doc: '<path d="M6 2h8l5 5v15H6z"/>',
    shield: '<path d="M12 2l8 3v6c0 5.5-3.6 9.3-8 11-4.4-1.7-8-5.5-8-11V5z"/>',
    coin: '<circle cx="12" cy="12" r="9"/>',
    dot: '<circle cx="12" cy="12" r="8"/>',
    bank: '<path d="M3 9l9-6 9 6v2H3zM5 12h3v7H5zM10.5 12h3v7h-3zM16 12h3v7h-3zM3 20h18v2H3z"/>',
  };
  function picto(on, n, ic, color, cols) {
    const k = Math.round(on);
    return `<div class="picto" style="grid-template-columns:repeat(${cols || n},1fr)">${d3.range(n).map(i => `<svg viewBox="0 0 24 24" style="fill:${i < k ? color : "#dfe0f3"};animation-delay:${n > 20 ? Math.round(i * 6) : i * 35}ms">${PICT[ic]}</svg>`).join("")}</div>`;
  }
  function hero(o) {
    return `<div class="hero-card" style="--hc:${o.color || C.brand}"><div class="hc-n"><div class="eyebrow">${o.eyebrow}</div><div class="hc-big">${o.big}<small>${o.unit || ""}</small></div></div>
      <div class="hc-s"><p>${o.sentence}</p>${o.foot ? `<div class="cmp">${o.foot}</div>` : ""}</div><div class="hc-p">${o.picto || ""}</div>${o.how ? `<div class="hc-how">${howBtn(o.how)}</div>` : ""}</div>`;
  }
  const outOf = (v, n) => (v === null || v === undefined ? "–" : Math.round(v * n));
  const HERO = {
    overview: (b) => hero({ eyebrow: "Health score", big: Math.round(b.health), unit: "/100", color: BANDC[b.band.id], how: "health",
      sentence: `<b>${esc(b.name)}</b> is healthier than <b>${Math.round(b.health)} of every 100</b> branches in the network.`, foot: `#${b.rank} of ${NRANK} · ${b.band.name}`, picto: picto(b.health / 10, 10, "bank", BANDC[b.band.id]) }),
    scorecard: (b) => { const best = M.filter(m => b.pct[m.id] !== null && m.p !== "market").sort((x, y) => b.pct[y.id] - b.pct[x.id]); const top = best.filter(m => b.pct[m.id] >= 67).length;
      return hero({ eyebrow: "Metrics in the top third", big: top, unit: ` of ${best.length}`, color: C.brand, how: "health", sentence: `It beats two-thirds of the network on <b>${top}</b> of its ${best.length} scored metrics; best of all on <b>${best[0].short.toLowerCase()}</b>.`, picto: picto(top, best.length, "dot", C.brand, Math.min(10, best.length)) }); },
    sales: (b) => { const v = b.core_la > 0 ? b.core_da / b.core_la : null;
      return hero({ eyebrow: "Login-to-disbursal yield", big: v === null ? "–" : "₹" + (v * 10).toFixed(1), unit: " of ₹10", color: C.brand, how: "metric:conv", sentence: `Of every <b>₹10</b> logged in, about <b>₹${v === null ? "–" : (v * 10).toFixed(1)}</b> is disbursed${NAT.core_la > 0 ? ` (network ₹${((NAT.core_da / NAT.core_la) * 10).toFixed(1)})` : ""}.`, picto: picto(v === null ? 0 : v * 10, 10, "coin", C.brand) }); },
    credit: (b) => { const v = rt(b.c_san, b.c_dec);
      return hero({ eyebrow: "Approval rate", big: pct0(v), color: "#eb6834", how: "metric:appr", sentence: `<b>${outOf(v, 10)} in 10</b> applications decided here are approved; the network approves ${outOf(NAT.c_san / NAT.c_dec, 10)} in 10.`, foot: `${f0(b.c_dec || 0)} decisions over 13 months`, picto: picto(v * 10, 10, "person", "#eb6834") }); },
    ops: (b) => { const v = rt(b.o_ftr, b.o_loans);
      return hero({ eyebrow: "Docket first-time-right", big: pct0(v), color: "#1baf7a", how: "metric:ftr", sentence: v === null ? "No HL / MSME dockets in the window." : `<b>${outOf(v, 10)} in 10</b> dockets go through without a query; network ${outOf(NAT.o_ftr / NAT.o_loans, 10)} in 10.`, foot: `${f0(b.o_loans || 0)} dockets`, picto: picto((v || 0) * 10, 10, "doc", "#1baf7a") }); },
    insurance: (b) => { const v = b.v.attach;
      return hero({ eyebrow: "New loans insured", big: pct0(v), color: "#eda100", how: "metric:attach", sentence: `<b>${outOf(v, 10)} in 10</b> new loans leave with cover; ${outOf(X.value(MID.attach, NAT, false), 10)} in 10 across the network.`, foot: `${X.cr(b.i_prem_as || 0)} premium, Aug–Sep`, picto: picto((v || 0) * 10, 10, "shield", "#eda100") }); },
    risk: (b) => { const v = rt(b.r_bn_09, b.r_du_09);
      return hero({ eyebrow: "EMI bounce, new loans", big: pct1(v), color: C.bad, how: "metric:bounce", sentence: v === null ? "Too few EMIs due to say." : `<b>${outOf(v, 100)} of every 100</b> EMIs due in September bounced; network ${outOf(NAT.r_bn_09 / NAT.r_du_09, 100)}.`, picto: picto((v || 0) * 100, 100, "dot", C.bad, 20) }); },
    market: (b) => hero({ eyebrow: "Local market", big: b.attract === null ? "–" : Math.round(b.attract), unit: "/100", color: "#2a8fd6", how: "metric:mnpa",
      sentence: `<b>${esc(b.mk_name)}</b> is more attractive than ${b.attract === null ? "–" : Math.round(b.attract)}% of branch markets (size, collections health, state momentum).`, picto: picto((b.attract || 0) / 10, 10, "bank", "#2a8fd6") }),
    strategy: (b, P) => { const o = X.opportunities(b, P).filter(x => x.unit === "/month"), t = sum(o, x => x.val);
      return hero({ eyebrow: "Sized upside", big: t > 0 ? X.cr(t) : "–", unit: t > 0 ? " /mo" : "", color: C.brand, how: "opps", sentence: `${o.length} moves against ${esc(P.name)}; the biggest is <b>${o[0] ? esc(o[0].title.toLowerCase()) : "–"}</b>.`, picto: picto(Math.min(10, o.length), 10, "coin", C.brand) }); },
    peers: (b, P) => { const r = X.rankIn(b, P.list);
      return hero({ eyebrow: "Rank in peer group", big: "#" + r.r, unit: ` of ${r.n}`, color: C.peer, how: "health", sentence: `Among <b>${esc(P.name)}</b> it sits ${r.r <= r.n / 3 ? "in the top third" : r.r <= (2 * r.n) / 3 ? "mid-table" : "in the bottom third"}.`, picto: picto(((r.n - r.r + 1) / r.n) * 10, 10, "person", C.peer) }); },
  };

  // =================================================================== v4 · MOTION
  // rings and bars grow from zero / from their previous value; the branch header ring morphs between branches
  let LAST_H = null;
  function animate(root) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    root.querySelectorAll(".bar s, .pbar i, .pill-r .fill, .hr-row .bar s").forEach((e, i) => { e.style.animation = `grow-x .7s cubic-bezier(.2,.8,.2,1) ${Math.min(i, 20) * 25}ms both`; });
    root.querySelectorAll("svg[data-ring]").forEach(svg => {
      const p = svg.querySelector("path.rv"), t = svg.querySelector("text"); if (!p) return;
      const v1 = +svg.dataset.ring, w = +svg.dataset.w || 8, from = svg.dataset.from !== undefined ? +svg.dataset.from : 0;
      const a = d3.arc().innerRadius(40 - w).outerRadius(40).cornerRadius(w / 2).startAngle(0);
      d3.select(p).transition().duration(900).ease(d3.easeCubicOut).attrTween("d", () => { const i = d3.interpolate(from, v1); return s => a.endAngle(2 * Math.PI * i(s))(); });
      if (svg.dataset.num) { const n1 = +svg.dataset.num, n0 = svg.dataset.from !== undefined ? from * 100 : 0; d3.select(t).transition().duration(900).ease(d3.easeCubicOut).tween("text", () => { const i = d3.interpolate(n0, n1); return s => (t.textContent = Math.round(i(s))); }); }
    });
  }
  // a pulse ring drawn on a map position
  function pulse(svg, x, y, color) {
    const c = svg.append("circle").attr("cx", x).attr("cy", y).attr("r", 6).attr("fill", "none").attr("stroke", color).attr("stroke-width", 2).attr("pointer-events", "none");
    (function loop() { c.attr("r", 6).attr("opacity", 0.9).transition().duration(1600).ease(d3.easeCubicOut).attr("r", 26).attr("opacity", 0).on("end", () => { if (c.node().isConnected) loop(); }); })();
  }

  // =================================================================== v4 · WHAT-IF SIMULATOR
  const WI = {};   // per branch: overrides
  SEC.whatif = (b, P, el) => {
    const L = X.LEVERS.filter(l => b.v[l.id] !== null && X.DIST[l.id].length > 20);
    const ov = (WI[b.id] = WI[b.id] || {});
    const range = id => { const m = MID[id], d = X.DIST[id]; const lo = Math.min(b.v[id], d[Math.floor(d.length * 0.03)]), hi = Math.max(b.v[id], d[Math.floor(d.length * 0.97)]); return [lo, hi]; };
    setInsight(`Drag a lever to see what it is worth. The score is recomputed with the same maths as the live health score, so the new rank is exact if <b>${esc(b.name)}</b> moved and everyone else stood still.`);
    el.innerHTML = `<div class="g wi">
      <div class="card"><div class="card-h"><h3>Levers</h3><span class="sub">● today · <span style="color:${C.peer}">|</span> ${esc(P.name)} · <span style="color:${C.good}">|</span> top 10%</span>${howBtn("whatif")}</div>
        <div class="wi-pre"><button data-pre="peer">Match peers on everything</button><button data-pre="top">Reach top 10% on its 3 weakest</button><button data-pre="one">Fix the single weakest</button><button data-pre="reset" class="ghost">Reset</button></div>
        <div id="wiL">${L.map(l => { const m = MID[l.id], [lo, hi] = range(l.id), pv = X.peerValue(m, P), tp = X.quantile(m, 0.9), pos = v => ((v - lo) / (hi - lo || 1)) * 100;
          return `<div class="wi-l" data-id="${l.id}"><div class="wi-t"><b>${m.label}</b><span class="cmp">${m.dir > 0 ? "higher is better" : "lower is better"}</span><span class="wi-v" id="wv_${l.id}"></span></div>
            <div class="wi-s"><div class="marks"><i class="now" style="left:${pos(b.v[l.id])}%"></i>${pv !== null && pv >= lo && pv <= hi ? `<i class="pe" style="left:${pos(pv)}%"></i>` : ""}${tp !== null && tp >= lo && tp <= hi ? `<i class="tp" style="left:${pos(tp)}%"></i>` : ""}</div>
            <input type="range" min="${lo}" max="${hi}" step="${(hi - lo) / 200}" value="${ov[l.id] ?? b.v[l.id]}" data-t="${ov[l.id] !== undefined ? 1 : ""}" aria-label="${esc(m.label)}"></div><div class="wi-e" id="we_${l.id}"></div></div>`; }).join("")}</div></div>
      <div class="wi-r"><div class="card wi-res" id="wiRes"></div>
        <div class="card"><div class="card-h"><h3>Where it would land</h3><span class="sub">all ${NRANK} branches by weighted blend</span></div><div id="wiLad" class="chart"></div></div>
        <div class="card"><div class="card-h"><h3>Pillars, before → after</h3></div><div id="wiPil"></div></div></div></div>`;
    const sliders = [...el.querySelectorAll(".wi-l input")];
    const fmtD = (m, d) => (m.fmt === "pct" ? `${d >= 0 ? "+" : "−"}${Math.abs(d * 100).toFixed(1)} pts` : m.fmt === "rs" ? `${d >= 0 ? "+" : "−"}₹${Math.abs(d).toFixed(2)}` : `${d >= 0 ? "+" : "−"}${Math.abs(d).toFixed(2)}`);
    const worth = (l, v) => { const d = v - b.v[l.id], m = MID[l.id], x = l.f(b, m.mult ? d / m.mult : d), ax = Math.abs(x);
      if (ax < (l.unit === "n" ? 0.5 : 0.005)) return { x, txt: "" };
      const flip = t => (t.startsWith("fewer") ? t.replace("fewer", "more") : /^more (dockets|loans)/.test(t) ? t.replace("more", "fewer") : t.replace("more", "less"));
      if (l.unit === "n") return { x, txt: `${f0(ax)} ${x >= 0 ? l.what : flip(l.what)}` };
      if (l.unit === "crb") return { x, txt: `${X.cr(ax)} ${x >= 0 ? l.what : "of book pushed into DPD"}` };
      return { x, txt: `${X.cr(ax)} ${x >= 0 ? l.what : flip(l.what)}` }; };
    let ladder = null, prevH = b.health;
    const update = () => {
      if (!el.isConnected) return;
      for (const s of sliders) { const id = s.closest(".wi-l").dataset.id, v = +s.value; if (s.dataset.t === "1" && Math.abs(v - b.v[id]) > +s.step / 2) ov[id] = v; else delete ov[id]; }
      const sim = X.simulate(b, ov), dH = sim.health - b.health;
      let money = 0, crb = 0, notes = [];
      for (const l of L) {
        const m = MID[l.id], v = ov[l.id] ?? b.v[l.id], w = worth(l, v), d = v - b.v[l.id];
        $("#wv_" + l.id).innerHTML = `${X.fmt(m, v)}${Math.abs(d) > 1e-9 ? ` <em class="${d * m.dir > 0 ? "up" : "dn"}">${fmtD(m, d)}</em>` : ""}`;
        $("#we_" + l.id).textContent = w.txt;
        if (l.unit === "cr") money += w.x; else if (l.unit === "crb") crb += w.x; else if (w.txt) notes.push(w.txt);
      }
      const n = Object.keys(ov).length;
      $("#wiRes").innerHTML = `<div class="wi-top">${ringSVG(sim.health / 100, BANDC[sim.band.id], { text: Math.round(sim.health), fs: 26, w: 9, cls: "wi-ring", data: { ring: sim.health / 100, from: prevH / 100, num: sim.health, w: 9 } })}
        <div><div class="eyebrow">Simulated health</div><div class="wi-rank">#${b.rank} <span>→</span> <b>#${sim.rank}</b></div>
          <div class="wi-band">${b.band.icon} ${b.band.name} ${sim.band.id !== b.band.id ? `→ <b style="color:${BANDC[sim.band.id]}">${sim.band.icon} ${sim.band.name}</b>` : ""}</div>
          <div class="cmp">${dH >= 0 ? "+" : "−"}${Math.abs(dH).toFixed(0)} health points</div></div></div>
        <div class="wi-money"><div><div class="eyebrow">Worth a month</div><div class="big">${money > 0.004 ? X.cr(money) : money < -0.004 ? "−" + X.cr(-money) : "–"}</div></div>${crb ? `<div><div class="eyebrow">Book out of DPD</div><div class="big" style="font-size:24px">${crb > 0 ? X.cr(crb) : "−" + X.cr(-crb)}</div></div>` : ""}</div>
        <p class="wi-say">${n ? `${n === 1 ? "This move" : `These ${n} moves`} take${n === 1 ? "s" : ""} <b>${esc(b.name)}</b> from <b>#${b.rank}</b> to <b>#${sim.rank}</b>${money > 0.004 ? ` and ${n === 1 ? "is" : "are"} worth about <b>${X.cr(money)} a month</b>` : ""}${notes.length ? `, plus ${esc(notes.join(", "))}` : ""}.` : "Move a slider, or try a preset, to see the new rank and what it is worth."}</p>`;
      animate($("#wiRes")); prevH = sim.health;
      // ladder
      if (!ladder) ladder = drawLadder($("#wiLad"), b);
      ladder.move(sim.composite);
      // pillars
      $("#wiPil").innerHTML = PILLARS.filter(p => p.w).map(p => { const a = b.pill[p.id], z = sim.pill[p.id], d = (z || 0) - (a || 0);
        return `<div class="wi-p"><span class="n">${p.name}</span><span class="bar2"><s style="width:${a || 0}%;background:${PILC[p.id]};opacity:.35"></s><s style="width:${z || 0}%;background:${PILC[p.id]};transition:width .4s"></s></span><span class="a">${a === null ? "–" : Math.round(a)} → <b>${z === null ? "–" : Math.round(z)}</b></span><span class="d ${d > 0.5 ? "up" : d < -0.5 ? "dn" : ""}">${Math.abs(d) < 0.5 ? "" : (d > 0 ? "+" : "−") + Math.abs(d).toFixed(0)}</span></div>`; }).join("");
    };
    let raf; sliders.forEach(s => s.addEventListener("input", () => { s.dataset.t = "1"; cancelAnimationFrame(raf); raf = requestAnimationFrame(update); }));
    el.querySelector(".wi-pre").onclick = e => {
      const k = e.target.dataset.pre; if (!k) return;
      const ids = L.map(l => l.id), weak = [...ids].sort((x, y) => b.pct[x] - b.pct[y]);
      for (const s of sliders) {
        const id = s.closest(".wi-l").dataset.id, m = MID[id], pv = X.peerValue(m, P), tp = X.quantile(m, 0.9);
        let v = b.v[id];
        if (k === "peer" && pv !== null && (pv - v) * m.dir > 0) v = pv;
        if (k === "top" && weak.slice(0, 3).includes(id) && (tp - v) * m.dir > 0) v = tp;
        if (k === "one" && weak[0] === id) v = (tp - v) * m.dir > 0 ? tp : v;
        s.value = Math.min(+s.max, Math.max(+s.min, v)); s.dataset.t = v !== b.v[id] ? "1" : "";
      }
      update();
    };
    update();
  };
  function drawLadder(el, b) {
    el.innerHTML = "";
    const W = width(el, 520), H = 120, m = { l: 12, r: 12 };
    const svg = svgIn(el, W, H, "Network ladder");
    const comps = X.ranked.map(x => x.composite), x = d3.scaleLinear().domain(d3.extent(comps)).range([m.l, W - m.r]);
    const bins = d3.bin().domain(x.domain()).thresholds(60)(comps), ymax = d3.max(bins, d => d.length), bw = (W - m.l - m.r) / bins.length;
    svg.append("g").selectAll("rect").data(bins).join("rect").attr("x", d => x(d.x0) + 0.5).attr("width", Math.max(1, bw - 1.5)).attr("y", d => 78 - (d.length / ymax) * 60).attr("height", d => (d.length / ymax) * 60).attr("rx", 1.5)
      .attr("fill", d => { const h = 100 * (1 - X.ranked.filter(z => z.composite > d.x0).length / NRANK); return h >= 200 / 3 ? "#bfe6d1" : h >= 100 / 3 ? "#f6e3a8" : "#f7c6c9"; });
    svg.append("line").attr("x1", m.l).attr("x2", W - m.r).attr("y1", 78.5).attr("y2", 78.5).attr("stroke", C.line2);
    const cut = q => X.ranked[Math.floor(NRANK * q)].composite;
    [[cut(1 / 3), "Leader ↑"], [cut(2 / 3), "Lagging ↓"]].forEach(([v, t], i) => { svg.append("line").attr("x1", x(v)).attr("x2", x(v)).attr("y1", 10).attr("y2", 80).attr("stroke", C.muted).attr("stroke-dasharray", "2 3");
      svg.append("text").attr("class", "axl").attr("x", x(v) + (i ? -4 : 4)).attr("y", 14).attr("text-anchor", i ? "end" : "start").text(t); });
    const old = svg.append("g").attr("transform", `translate(${x(b.composite)},0)`);
    old.append("line").attr("y1", 18).attr("y2", 84).attr("stroke", C.ink2).attr("stroke-width", 1.5).attr("stroke-dasharray", "3 2");
    old.append("text").attr("class", "axl").attr("y", 98).attr("text-anchor", "middle").text("today");
    const nw = svg.append("g").attr("transform", `translate(${x(b.composite)},0)`);
    nw.append("line").attr("y1", 18).attr("y2", 84).attr("stroke", C.brand).attr("stroke-width", 3);
    nw.append("circle").attr("cy", 84).attr("r", 6).attr("fill", C.brand).attr("stroke", "#fff").attr("stroke-width", 2);
    const lab = nw.append("text").attr("y", 114).attr("text-anchor", "middle").style("font", "600 12px var(--ui)").style("fill", C.brand);
    return { move: c => { const px = Math.max(m.l + 30, Math.min(W - m.r - 30, x(c))); nw.transition().duration(450).ease(d3.easeCubicOut).attr("transform", `translate(${x(c)},0)`); lab.attr("x", px - x(c)).text("simulated"); } };
  }

  // =================================================================== v4 · TWIN FINDER
  const TW = {};
  SEC.twins = (b, P, el) => {
    const T = X.twins(b), list = T.better.length ? T.better : T.near.filter(t => t.x.health > b.health).slice(0, 5);
    const pick = TW[b.id] && list.find(t => t.x.id === TW[b.id]) || list[0];
    if (!pick) { setInsight(`No look-alike branch is meaningfully healthier: <b>${esc(b.name)}</b> already leads its kind.`);
      el.innerHTML = `<div class="card empty">Nothing to learn from look-alikes. Try <a href="#/b/${encodeURIComponent(b.id)}/peers">peer benchmark</a> for wider comparison.</div>`; return; }
    const t = pick.x, drv = X.gapDrivers(b, t).filter(d => d.pts > 0).slice(0, 3), ops = X.opportunities(b, asPeer(t)).filter(o => o.unit === "/month");
    const gapPts = drv.reduce((s, d) => s + d.pts, 0), totPts = sum(X.gapDrivers(b, t).filter(d => d.pts > 0), d => d.pts);
    setInsight(`<b>${esc(t.name)}</b> is ${Math.round(pick.sim)}% alike (size, product mix and market) but ${Math.round(t.health - b.health)} health points ahead. <b>${drv.map(d => d.m.short.toLowerCase()).join(", ")}</b> account for ${totPts > 0 ? Math.round((gapPts / totPts) * 100) : 0}% of where it pulls ahead.`);
    el.innerHTML = `<div class="g g-tw">
      <div class="card"><div class="card-h"><h3>Look-alike branches</h3><span class="sub">40 most similar · up = healthier</span>${howBtn("twins")}</div><div id="twSc" class="chart"></div>
        <div class="legend"><span><i style="background:${C.brand}"></i>${esc(b.name)}</span><span><i style="background:${C.good}"></i>better twin</span><span><i style="background:${C.nat}"></i>other look-alikes</span></div></div>
      <div class="card"><div class="card-h"><h3>Better twins</h3><span class="sub">click to study one</span></div>
        <div class="tw-list">${list.slice(0, 5).map(z => `<button class="tw ${z === pick ? "on" : ""}" data-id="${esc(z.x.id)}"><span class="score-dot ${z.x.band.id}">${Math.round(z.x.health)}</span><span><b>${esc(z.x.name)}</b><small>${esc(z.x.state)} · ${X.cr(z.x.core_da)}</small></span><span class="sim"><b>${Math.round(z.sim)}%</b><small>alike</small></span></button>`).join("")}</div></div></div>
      <div class="card tw-hero"><div class="tw-vs">
          <div class="tw-side">${ringSVG(b.health / 100, C.brand, { text: Math.round(b.health), fs: 24, data: { ring: b.health / 100, num: b.health } })}<b>${esc(b.name)}</b><small>#${b.rank}</small></div>
          <div class="tw-mid"><div class="eyebrow">Why they're twins</div>${[["size", "Size"], ["mix", "Product mix"], ["mkt", "Local market"], ["mb1", "Local bounce"]].map(([k, n]) => `<div class="tw-why"><span>${n}</span><span class="bar"><s style="width:${Math.round(pick.parts[k] || 0)}%;background:${C.brand2}"></s></span><b>${Math.round(pick.parts[k] || 0)}</b></div>`).join("")}</div>
          <div class="tw-side">${ringSVG(t.health / 100, C.good, { text: Math.round(t.health), fs: 24, data: { ring: t.health / 100, num: t.health } })}<b>${esc(t.name)}</b><small>#${t.rank}</small></div></div></div>
      <div class="card"><div class="card-h"><h3>What ${esc(t.name)} does differently</h3><span class="sub">the three metrics that explain most of the gap</span></div>
        <div class="tw-drv">${drv.map((d, i) => { const m = d.m; return `<div class="tw-d"><div class="nn">${i + 1}</div><div><b>${m.label}</b><div class="cmp">${m.sub}</div>
          <div class="tw-vals"><span style="color:${C.brand}">${X.fmt(m, b.v[m.id])}</span><span class="arr">→</span><span style="color:${C.good}">${X.fmt(m, t.v[m.id])}</span></div>
          <div class="tw-bar"><i style="left:${b.pct[m.id]}%;background:${C.brand}"></i><i style="left:${t.pct[m.id]}%;background:${C.good}"></i><s style="left:${Math.min(b.pct[m.id], t.pct[m.id])}%;width:${Math.abs(d.gap)}%"></s></div>
          <div class="cmp">percentile ${Math.round(b.pct[m.id])} → ${Math.round(t.pct[m.id])} · worth <b>${d.pts.toFixed(1)}</b> blend points</div></div></div>`; }).join("")}</div>
        <div class="tw-act">${ops.length ? `<div><div class="eyebrow">If it ran like its twin</div><div class="big">${X.cr(sum(ops, o => o.val))}<small class="cmp"> /month</small></div><div class="cmp">${esc(ops.slice(0, 3).map(o => o.title).join(" · "))}</div></div>` : ""}
          <a class="btn primary" href="${cHash(b.id, t.id, "summary")}">Compare side by side →</a><a class="btn ghost-d" href="#/b/${encodeURIComponent(b.id)}/whatif">Try it in the what-if lab</a></div></div>`;
    el.querySelectorAll(".tw").forEach(x => (x.onclick = () => { TW[b.id] = x.dataset.id; render(); }));
    twinScatter($("#twSc"), b, T, list);
  };
  function twinScatter(el, b, T, better) {
    el.innerHTML = "";
    const W = width(el, 520), H = 300, m = { t: 14, r: 16, b: 34, l: 40 };
    const svg = svgIn(el, W, H, "Look-alike branches by similarity and health");
    const pts = T.near, bs = new Set(better.map(t => t.x.id));
    const x = d3.scaleLinear().domain([Math.min(0, d3.min(pts, d => d.sim)), 100]).range([m.l, W - m.r]), y = d3.scaleLinear().domain([0, 100]).range([H - m.b, m.t]);
    svg.append("g").attr("class", "ax").attr("transform", `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(5).tickFormat(d => d + "%").tickSizeOuter(0));
    svg.append("g").attr("class", "ax").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickSizeOuter(0));
    svg.append("text").attr("class", "axl").attr("x", W - m.r).attr("y", H - 4).attr("text-anchor", "end").text("similarity →");
    svg.append("text").attr("class", "axl").attr("x", m.l + 4).attr("y", m.t + 2).text("health ↑");
    svg.append("line").attr("x1", m.l).attr("x2", W - m.r).attr("y1", y(b.health)).attr("y2", y(b.health)).attr("stroke", C.brand).attr("stroke-dasharray", "4 3").attr("opacity", 0.6);
    svg.append("g").selectAll("circle").data(pts).join("circle").attr("cx", d => x(d.sim)).attr("cy", d => y(d.x.health)).attr("r", 0)
      .attr("fill", d => (bs.has(d.x.id) ? C.good : C.nat)).attr("fill-opacity", d => (bs.has(d.x.id) ? 0.9 : 0.55)).attr("stroke", "#fff").style("cursor", "pointer")
      .on("mousemove", (ev, d) => tip(`${branchTip(d.x)}<br><span class="k">${Math.round(d.sim)}% alike</span>`, ev)).on("mouseleave", untip).on("click", (ev, d) => { untip(); TW[b.id] = d.x.id; if (bs.has(d.x.id)) render(); else location.hash = cHash(b.id, d.x.id, "summary"); })
      .transition().duration(600).delay((d, i) => i * 12).attr("r", d => (bs.has(d.x.id) ? 6 : 4.5));
    svg.append("circle").attr("cx", x(100)).attr("cy", y(b.health)).attr("r", 7).attr("fill", C.brand).attr("stroke", "#fff").attr("stroke-width", 2);
    svg.append("text").attr("class", "lbl-b").attr("x", x(100) - 10).attr("y", y(b.health) - 10).attr("text-anchor", "end").text(b.name);
  }

  // =================================================================== v4 · OPPORTUNITY MAP
  const LV = [
    { id: "all", name: "All levers", c: C.brand },
    { id: "conv", name: "Conversion", c: "#5048e5", test: o => o.title.startsWith("Convert") },
    { id: "appr", name: "Approval", c: "#eb6834", test: o => o.title.startsWith("Source cleaner") },
    { id: "ins", name: "Insurance", c: "#eda100", test: o => o.title.startsWith("Attach") },
    { id: "mix", name: "Product mix", c: "#1baf7a", test: o => /^(Launch|Scale up)/.test(o.title) },
    { id: "chan", name: "Channel", c: "#2a8fd6", test: o => o.title.startsWith("Open the") },
    { id: "coll", name: "Collections", c: "#e87ba4", stock: true },
  ];
  let OPPS = null;
  function oppAll() {
    if (OPPS) return OPPS;
    OPPS = E.map(b => {
      const P = X.peers(b, "state"), ops = X.opportunities(b, P), by = {};
      for (const l of LV.slice(1, 6)) by[l.id] = sum(ops.filter(l.test), o => o.val);
      const dp = X.value(MID.dpd, P.agg, false), db = b.r_aum_09 > 0.3 ? b.r_p1_09 / b.r_aum_09 : null;
      by.coll = db !== null && dp !== null && db > dp ? (db - dp) * b.r_aum_09 : 0;
      by.all = by.conv + by.appr + by.ins + by.mix + by.chan;
      const top = LV.slice(1, 6).sort((p, q) => by[q.id] - by[p.id])[0];
      return { b, by, top: by[top.id] > 0 ? top : null, ops };
    });
    return OPPS;
  }
  state.lever = "all";
  function renderOpps() {
    document.title = "Opportunity map · One Vision";
    const A = oppAll(), L = LV.find(l => l.id === state.lever) || LV[0], val = r => r.by[L.id];
    const tot = sum(A, val), withV = A.filter(r => val(r) > 0.001).sort((p, q) => val(q) - val(p));
    const top10 = sum(withV.slice(0, Math.ceil(withV.length * 0.1)), val);
    const states = d3.rollups(withV, v => sum(v, val), r => r.b.state).sort((p, q) => q[1] - p[1]).slice(0, 10);
    const levTot = LV.slice(1, 6).map(l => ({ l, v: sum(A, r => r.by[l.id]) }));
    $("#view").innerHTML = `<div class="view-in">
      <div class="sh"><div><h1>Where is the money? <span>· opportunity map</span></h1></div></div>
      <div class="opp-hero"><div><div class="eyebrow">${L.stock ? "Book that would leave DPD at peer rates" : "Monthly upside if every branch matched its state peers"}</div><div class="hc-big">${X.cr(tot)}<small>${L.stock ? "" : " /month"}</small></div>
        <p>${L.stock ? `${withV.length} branches carry more DPD than their state peers.` : `Spread over ${withV.length} branches, but the top 10% of them hold <b>${pct0(tot > 0 ? top10 / tot : 0)}</b> of it.`} ${howBtn("opps")}</p></div>
        <div class="seg lev" id="levSeg">${LV.map(l => `<button class="${l.id === L.id ? "on" : ""}" data-l="${l.id}" style="--lc:${l.c}"><i></i>${l.name}</button>`).join("")}</div></div>
      <div class="g g-opp">
        <div class="card"><div class="card-h"><h3>${L.name}: ₹ upside by branch</h3><span class="sub">dot size = ₹ · colour = ${L.id === "all" ? "biggest lever" : L.name.toLowerCase()}</span></div><div id="oppMap" class="map"></div>
          <div class="legend">${L.id === "all" ? LV.slice(1, 6).map(l => `<span><i style="background:${l.c}"></i>${l.name}</span>`).join("") : `<span><i style="background:${L.c}"></i>${L.name}</span>`}<span class="muted">click a dot to open the branch</span></div></div>
        <div class="opp-side">
          ${L.id === "all" ? `<div class="card"><div class="card-h"><h3>By lever</h3><span class="sub">₹ / month, network</span></div>${pills(levTot.map(x => ({ k: x.l.name, v: x.v, c: x.l.c, label: X.cr(x.v) })), d3.max(levTot, x => x.v) || 1)}</div>` : ""}
          <div class="card"><div class="card-h"><h3>Biggest prizes</h3><span class="sub">open the what-if lab</span></div>
            <ol class="opp-list">${withV.slice(0, 10).map((r, i) => `<li><span class="n">${i + 1}</span><a href="#/b/${encodeURIComponent(r.b.id)}/whatif"><b>${esc(r.b.name)}</b><small>${esc(r.b.state)} · health ${Math.round(r.b.health)}${L.id === "all" && r.top ? ` · mostly ${r.top.name.toLowerCase()}` : ""}</small></a><span class="v"><i style="width:${(val(r) / val(withV[0])) * 100}%;background:${L.id === "all" && r.top ? r.top.c : L.c}"></i><b>${X.cr(val(r))}</b></span></li>`).join("")}</ol></div></div></div>
      <div class="card"><div class="card-h"><h3>By state</h3><span class="sub">top 10 states · ${L.stock ? "₹ book" : "₹ / month"}</span></div><div id="oppSt" class="chart"></div></div></div>`;
    $("#levSeg").onclick = e => { const l = e.target.closest("[data-l]"); if (!l) return; state.lever = l.dataset.l; renderOpps(); };
    const mx = d3.max(withV, val) || 1, rs = d3.scaleSqrt().domain([0, mx]).range([1.2, 12]);
    const mp = hexMap($("#oppMap"), { branches: A.map(r => r.b), isOn: x => val(OPPA.get(x.id)) > 0.001, minH: innerWidth < 700 ? 280 : 520,
      fill: x => { const r = OPPA.get(x.id); return L.id === "all" ? (r.top ? r.top.c : C.nat) : L.c; }, r: x => rs(Math.max(0, val(OPPA.get(x.id)))) });
    mp.sel.on("mousemove", (ev, x) => { const r = OPPA.get(x.id); tip(`<b>${esc(x.name)}</b><br><span class="k">${esc(x.state)} · health ${Math.round(x.health)}</span><br>${L.name}: <b>${X.cr(val(r))}</b>${L.stock ? "" : " /month"}${L.id === "all" ? "<br>" + LV.slice(1, 6).filter(l => r.by[l.id] > 0.001).map(l => `<span class="k">${l.name}</span> ${X.cr(r.by[l.id])}`).join("<br>") : ""}`, ev); })
      .on("click", (ev, x) => { untip(); location.hash = `#/b/${encodeURIComponent(x.id)}/whatif`; });
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) mp.sel.attr("r", 0).transition().duration(700).delay((d, i) => Math.min(i, 400) * 2).attr("r", x => rs(Math.max(0, val(OPPA.get(x.id)))));
    vbars($("#oppSt"), states.map(s => s[0]), [{ name: L.name, c: L.c === C.brand ? C.brand : L.c, v: states.map(s => s[1]) }], { h: 220, xf: s => (s.length > 12 ? s.slice(0, 11) + "…" : s), yf: d => "₹" + d, tf: v => X.cr(v), label: "Upside by state" });
  }
  let OPPM = null; const OPPA = { get: id => (OPPM = OPPM || new Map(oppAll().map(r => [r.b.id, r]))).get(id) };

  // =================================================================== v4 · ASK ONE VISION
  const FIELDS = {
    health: { name: "Health", get: b => b.health, fmt: v => Math.round(v), dir: 1, syn: ["health", "score", "healthy"] },
    disb: { name: "Core disbursal", get: b => b.core_da, fmt: v => X.cr(v), dir: 1, syn: ["disbursal", "disbursement", "size", "big", "biggest", "largest", "volume"] },
    attract: { name: "Market attractiveness", get: b => b.attract, fmt: v => Math.round(v), dir: 1, syn: ["attractive", "attractiveness"] },
    ...Object.fromEntries(M.map(m => [m.id, { name: m.label, m, get: b => b.v[m.id], fmt: v => X.fmt(m, v), dir: m.dir, syn: [] }])),
    ...Object.fromEntries(PILLARS.map(p => ["p_" + p.id, { name: p.name + " pillar", get: b => b.pill[p.id], fmt: v => Math.round(v), dir: 1, syn: [] }])),
  };
  const SYN = { mom: ["momentum", "growth", "growing", "sanction growth"], conv: ["conversion", "yield", "login"], appr: ["approval", "approvals", "approve", "approved"], pull: ["booking", "booked"],
    gate: ["auto-reject", "auto reject", "rejection", "rejections", "rejected"], ftr: ["ftr", "first time right", "first-time-right", "docket"], tat: ["tat", "turnaround", "3 days"], esign: ["e-sign", "esign", "digital"],
    overdue: ["overdue", "pending docs", "documents"], attach: ["attach", "insurance", "insured", "cross-sell", "cross sell"], prem: ["premium"], ppl: ["policies"], bounce: ["bounce", "bounces", "bouncing"],
    dpd: ["dpd", "delinquency", "delinquent", "overdue book"], cibil: ["cibil", "credit score", "bureau"], mb1: ["local bounce", "market bounce"], mres: ["resolution", "resolve"], mnpa: ["npa"], msize: ["local book", "market size"] };
  for (const k in SYN) if (FIELDS[k]) FIELDS[k].syn = SYN[k];
  const ST_AB = { up: "Uttar Pradesh", mp: "Madhya Pradesh", ap: "Andhra Pradesh", tn: "Tamil Nadu", wb: "West Bengal", hp: "Himachal Pradesh", jk: "Jammu & Kashmir", ncr: "Delhi", nct: "Delhi", tg: "Telangana", ts: "Telangana", rj: "Rajasthan", gj: "Gujarat", mh: "Maharashtra", ka: "Karnataka", kl: "Kerala", hr: "Haryana", pb: "Punjab", br: "Bihar", cg: "Chhattisgarh", jh: "Jharkhand", uk: "Uttarakhand" };
  const STATES = [...new Set(E.map(b => b.state))];
  function localParse(q) {
    const s = " " + q.toLowerCase().replace(/[?,.;!]/g, " ").replace(/\s+/g, " ") + " ", spec = { filters: [], states: [], zone: null, sort: null, limit: null, band: null };
    for (const st of STATES) if (s.includes(" " + st.toLowerCase() + " ")) spec.states.push(st);
    for (const [ab, st] of Object.entries(ST_AB)) if (new RegExp(`\\s${ab}\\s`).test(s) && STATES.includes(st) && !spec.states.includes(st)) spec.states.push(st);
    for (const z of ["north", "south", "east", "west"]) if (new RegExp(`\\s${z}(ern)?\\s`).test(s)) spec.zone = z[0].toUpperCase() + z.slice(1);
    if (/\bleaders?\b/.test(s)) spec.band = "lead"; else if (/\blagg(ing|ards?)\b/.test(s)) spec.band = "lag"; else if (/\bsteady\b/.test(s)) spec.band = "steady";
    let m;
    if ((m = s.match(/\b(top|best|worst|bottom|first|last)\s+(\d+)\b/))) { spec.limit = +m[2]; spec.sortDir = /top|best|first/.test(m[1]) ? "good" : "bad"; }
    // find metric mentions (longest synonyms first) and the qualifier just before / after
    const hits = [];
    const syns = Object.entries(FIELDS).flatMap(([k, f]) => f.syn.map(w => [k, w])).sort((a, b) => b[1].length - a[1].length);
    let rest = s;
    for (const [k, w] of syns) { const i = rest.indexOf(" " + w + " "); if (i >= 0 && !hits.some(h => h.k === k)) { hits.push({ k, i }); rest = rest.slice(0, i) + " " + "#".repeat(w.length) + rest.slice(i + w.length + 1); } }
    hits.sort((a, b) => a.i - b.i);
    for (const h of hits) {
      const before = rest.slice(Math.max(0, h.i - 28), h.i) + " ", after = s.slice(h.i, h.i + 60);
      let f = null; const num = after.match(/(above|over|more than|greater than|>|below|under|less than|<)\s*(\d+(?:\.\d+)?)\s*(%|cr|crore)?/);
      if (num) f = { field: h.k, op: /above|over|more|greater|>/.test(num[1]) ? ">" : "<", value: FIELDS[h.k].m && FIELDS[h.k].m.fmt === "pct" ? +num[2] / 100 : +num[2] };
      else if (/\b(high|higher|highest|more|rising|large)\s+$/.test(before)) f = { field: h.k, level: "high" };
      else if (/\b(low|lower|lowest|less|few|small)\s+$/.test(before)) f = { field: h.k, level: "low" };
      else if (/\b(good|strong|great|better|best|healthy|excellent)\s+$/.test(before)) f = { field: h.k, level: "good" };
      else if (/\b(bad|weak|poor|worse|worst|terrible)\s+$/.test(before)) f = { field: h.k, level: "bad" };
      else if (/^\s*\S+\s+(is|are)?\s*(high|rising)/.test(after.slice(1))) f = { field: h.k, level: "high" };
      else if (/^\s*\S+\s+(is|are)?\s*(low|falling)/.test(after.slice(1))) f = { field: h.k, level: "low" };
      if (f) spec.filters.push(f); else if (!spec.sort) spec.sort = h.k;
    }
    if (!spec.sort) spec.sort = spec.filters.length && spec.limit ? spec.filters[0].field : /biggest|largest/.test(s) ? "disb" : "health";
    if (/biggest|largest/.test(s) && !spec.filters.some(f => f.field === "disb")) spec.sort = "disb";
    if (!spec.sortDir) spec.sortDir = /\b(worst|weakest|bottom|struggling|problem)\b/.test(s) ? "bad" : "good";
    if (/\b(struggling|problem|need attention|weak branches|worst)\b/.test(s) && !spec.filters.length && spec.sort === "health") spec.sortDir = "bad";
    return spec;
  }
  function runSpec(spec) {
    const rawPct = (k, b) => { const f = FIELDS[k], v = f.get(b); if (v === null || v === undefined) return null; if (f.m) { const p = b.pct[f.m.id]; return p === null ? null : f.dir > 0 ? p : 100 - p; } const all = E.map(f.get).filter(x => x !== null).sort((a, c) => a - c); return (d3.bisectLeft(all, v) / all.length) * 100; };
    const good = (k, b) => { const r = rawPct(k, b); return r === null ? null : FIELDS[k].dir > 0 ? r : 100 - r; };
    let list = E.filter(b => (!spec.states || !spec.states.length || spec.states.includes(b.state)) && (!spec.zone || b.zone === spec.zone) && (!spec.band || b.band.id === spec.band));
    for (const f of spec.filters || []) {
      if (!FIELDS[f.field]) continue;
      list = list.filter(b => { const v = FIELDS[f.field].get(b); if (v === null || v === undefined) return false;
        if (f.op) return f.op === ">" ? v > f.value : v < f.value;
        const p = f.level === "high" || f.level === "low" ? rawPct(f.field, b) : good(f.field, b);
        return f.level === "high" || f.level === "good" ? p >= 200 / 3 : p <= 100 / 3; });
    }
    const sk = FIELDS[spec.sort] ? spec.sort : "health", dir = FIELDS[sk].dir * (spec.sortDir === "bad" ? -1 : 1);
    list.sort((a, b) => ((FIELDS[sk].get(b) ?? -1e9 * dir) - (FIELDS[sk].get(a) ?? -1e9 * dir)) * dir);
    if (spec.limit) list = list.slice(0, spec.limit);
    return list;
  }
  function chipsOf(spec) {
    const c = [];
    if (spec.states && spec.states.length) c.push(["place", spec.states.join(" / ")]);
    if (spec.zone) c.push(["place", spec.zone + " zone"]);
    if (spec.band) c.push(["band", { lead: "▲ Leaders", steady: "■ Steady", lag: "▼ Lagging" }[spec.band]]);
    for (const f of spec.filters || []) if (FIELDS[f.field]) c.push(["cond", f.op ? `${FIELDS[f.field].name} ${f.op} ${FIELDS[f.field].m && FIELDS[f.field].m.fmt === "pct" ? (f.value * 100).toFixed(0) + "%" : f.value}` : `${{ high: "High", low: "Low", good: "Good", bad: "Poor" }[f.level]} ${FIELDS[f.field].name.toLowerCase()}`]);
    c.push(["sort", `${spec.sortDir === "bad" ? "Worst" : "Best"} ${FIELDS[spec.sort] ? FIELDS[spec.sort].name.toLowerCase() : "health"} first${spec.limit ? ` · top ${spec.limit}` : ""}`]);
    return c;
  }
  const ASK_EX = ["UP branches with high bounce but good approval", "Top 10 by insurance attach in the South zone", "Lagging branches with good momentum", "Biggest branches in Maharashtra with poor FTR", "Branches with approval above 50% and low CIBIL", "Worst 15 by DPD in Rajasthan"];
  state.ask = state.ask || "";
  let ASKR = null;
  function renderAsk() {
    document.title = "Ask One Vision";
    $("#view").innerHTML = `<div class="view-in">
      <div class="ask-hero"><div class="eyebrow">Ask One Vision${AI ? ` · AI: ${esc(AI.model || "on")}` : " · offline parser"}</div><h1>Ask the network a question.<span>Answers come back as a map, a chart and a list, not a paragraph.</span></h1>
        <form id="askF" class="ask-box"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.9 2.1 2.1.9-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z"/></svg><input id="askQ" placeholder="e.g. UP branches with high bounce but good approval" value="${esc(state.ask)}" aria-label="Ask a question"><button>Ask</button></form>
        <div class="ask-ex">${ASK_EX.map(q => `<button data-q="${esc(q)}">${esc(q)}</button>`).join("")}</div>${howBtn("ask", "How questions are read")}</div>
      <div id="askOut"></div></div>`;
    const submit = q => { state.ask = q; $("#askQ").value = q; ask(q); };
    $("#askF").onsubmit = e => { e.preventDefault(); submit($("#askQ").value.trim()); };
    $("#view").querySelector(".ask-ex").onclick = e => { const q = e.target.dataset.q; if (q) submit(q); };
    if (ASKR && ASKR.q === state.ask) showAsk(ASKR); else if (state.ask) ask(state.ask);
  }
  let ASKN = 0;
  async function ask(q) {
    if (!q) return;
    // answer at once with the built-in reader; the AI (if on) refines it in the background, with a time limit
    const n = ++ASKN, local = localParse(q);
    if (AI === null) await AIP;   // the AI check may still be in flight on first load
    if (n !== ASKN) return;
    ASKR = { q, spec: local, by: "built-in parser", list: runSpec(local), status: AI ? "AI is double-checking the reading…" : "", st: AI ? "busy" : "" };
    if (state.view === "ask") showAsk(ASKR);
    if (!AI) return;
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 25000);
    try {
      const sys = `Convert a question about bank branches into a JSON query. Reply with JSON only, no prose. Schema: {"states":[state names exactly from the list],"zone":null|"North"|"South"|"East"|"West","band":null|"lead"|"steady"|"lag","filters":[{"field":F,"level":"high"|"low"|"good"|"bad"} or {"field":F,"op":">"|"<","value":number}],"sort":F,"sortDir":"good"|"bad","limit":null|integer}. "high/low" = raw value; "good/bad" = healthy/unhealthy direction. Rates are fractions (40% = 0.4). "Biggest/largest/size" means disb (the branch's own core disbursal), never msize. "Struggling/weak/worst branches" with no metric means sort health with sortDir "bad". UP/MP/AP/TN etc. are state abbreviations. Fields F: ${Object.entries(FIELDS).map(([k, f]) => `${k}=${f.name}`).join("; ")}. States: ${STATES.join(", ")}.`;
      const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, signal: ctl.signal, body: JSON.stringify({ messages: [{ role: "system", content: sys }, { role: "user", content: q }] }) });
      const j = await r.json(); if (!r.ok) throw new Error((j.error && j.error.status) || r.status);
      const mm = j.choices[0].message.content.match(/\{[\s\S]*\}/), s2 = JSON.parse(mm[0]);
      if (!s2 || !Array.isArray(s2.filters)) throw new Error("unreadable reply");
      s2.filters = s2.filters.filter(f => FIELDS[f.field]); s2.states = (s2.states || []).filter(x => STATES.includes(x)); if (!FIELDS[s2.sort]) s2.sort = "health";
      if (n !== ASKN) return;
      const same = JSON.stringify(chipsOf(s2)) === JSON.stringify(chipsOf(local));
      ASKR = { q, spec: same ? local : s2, by: same ? "built-in parser · confirmed by AI" : "AI (" + (j.model || AI.model || "model") + ")", list: runSpec(same ? local : s2), status: same ? "" : "Refined by AI", st: same ? "" : "ok" };
    } catch (e) {
      if (n !== ASKN) return;
      ASKR = { ...ASKR, status: e.name === "AbortError" ? "AI didn't answer within 25 s, so this is the built-in reading" : "AI unavailable right now, so this is the built-in reading", st: "warn" };
    } finally { clearTimeout(timer); }
    if (state.view === "ask" && n === ASKN) showAsk(ASKR);
  }
  function showAsk(R) {
    const { spec, list } = R, out = $("#askOut");
    const fs = [...new Set([...(spec.filters || []).map(f => f.field), spec.sort, "health"])].filter(k => FIELDS[k]);
    const xk = fs[0], yk = fs.find(k => k !== xk) || (xk === "disb" ? "health" : "disb");
    const tot = sum(list, b => b.core_da);
    out.innerHTML = `<div class="ask-read"><span class="cmp">Read by ${esc(R.by)} as</span>${chipsOf(spec).map(([k, t]) => `<span class="qchip ${k}">${esc(t)}</span>`).join("")}${R.status ? `<span class="ai-st ${R.st}">${R.st === "busy" ? `<span class="spin"></span>` : ""}${esc(R.status)}</span>` : ""}</div>
      <div class="ask-ans"><div class="hc-big">${list.length}<small> branch${list.length === 1 ? "" : "es"}</small></div><p>${list.length ? `match, holding <b>${X.cr(tot)}</b> of core disbursal (${pct0(tot / sum(E, b => b.core_da))} of the network). Average health <b>${Math.round(avg(list.map(b => b.health)))}</b>${list[0] ? `; first is <a href="#/b/${encodeURIComponent(list[0].id)}/overview"><b>${esc(list[0].name)}</b></a>` : ""}.` : "match. Try loosening a condition: “high” and “good” mean the top third of the network."}</p></div>
      ${list.length ? `<div class="g g2"><div class="card"><div class="card-h"><h3>On the map</h3><span class="sub">${list.length} highlighted</span></div><div id="askMap" class="map"></div></div>
        <div class="card"><div class="card-h"><h3>${esc(FIELDS[xk].name)} vs ${esc(FIELDS[yk].name)}</h3><span class="sub">matches in indigo · network in grey</span></div><div id="askSc" class="chart"></div></div></div>
        <div class="card"><div class="card-h"><h3>The list</h3><span class="sub">click to open · ⇄ to compare the first two</span>${list.length >= 2 ? `<a class="chip-btn chip" href="${cHash(list[0].id, list[1].id, "summary")}">⇄ ${esc(list[0].name)} vs ${esc(list[1].name)}</a>` : ""}</div>
          <div class="scroll-x"><table class="mtab ask-t"><thead><tr><th>#</th><th>Branch</th>${fs.map(k => `<th>${esc(FIELDS[k].name)}</th>`).join("")}<th>Core disbursal</th></tr></thead><tbody>${list.slice(0, 40).map((b, i) => `<tr data-id="${esc(b.id)}"><td class="pn">${i + 1}</td><td class="nm"><b>${esc(b.name)}</b><small>${esc(b.state)}</small></td>${fs.map(k => { const v = FIELDS[k].get(b); return `<td class="val">${v === null || v === undefined ? "–" : FIELDS[k].fmt(v)}</td>`; }).join("")}<td class="val">${X.cr(b.core_da)}</td></tr>`).join("")}</tbody></table></div>${list.length > 40 ? `<p class="note">Showing 40 of ${list.length}.</p>` : ""}</div>` : ""}`;
    if (!list.length) return;
    const on = new Set(list.map(b => b.id));
    const mp = hexMap($("#askMap"), { branches: E, isOn: b => on.has(b.id), fill: b => (on.has(b.id) ? C.brand : C.nat), r: (b, rs) => (on.has(b.id) ? Math.max(3.5, rs(b.core_da)) : 1.6), minH: 380,
      callouts: list.slice(0, 3).map((b, i) => ({ b, title: b.name, value: FIELDS[xk].name + " " + FIELDS[xk].fmt(FIELDS[xk].get(b)), color: [C.brand, C.peer, "#1baf7a"][i] })) });
    askScatter($("#askSc"), on, xk, yk);
    out.querySelector(".ask-t").onclick = e => { const r = e.target.closest("tr[data-id]"); if (r) go(r.dataset.id); };
  }
  function askScatter(el, on, xk, yk) {
    el.innerHTML = "";
    const W = width(el, 520), H = 340, m = { t: 14, r: 16, b: 36, l: 54 }, fx = FIELDS[xk], fy = FIELDS[yk];
    const pts = E.filter(b => fx.get(b) !== null && fx.get(b) !== undefined && fy.get(b) !== null && fy.get(b) !== undefined);
    const logx = xk === "disb", logy = yk === "disb";
    const sc = (lg, ext, r) => (lg ? d3.scaleLog().domain([Math.max(0.05, ext[0]), ext[1]]).clamp(true) : d3.scaleLinear().domain(ext).nice()).range(r);
    const qx = d3.extent(pts, fx.get), qy = d3.extent(pts, fy.get);
    const x = sc(logx, qx, [m.l, W - m.r]), y = sc(logy, qy, [H - m.b, m.t]);
    const svg = svgIn(el, W, H, "Scatter");
    const tf = f => v => (f.m && f.m.fmt === "pct" ? Math.round(v * 100) + "%" : f === FIELDS.disb ? "₹" + v : d3.format("~s")(v));
    svg.append("g").attr("class", "ax").attr("transform", `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(5, logx ? "~s" : undefined).tickFormat(tf(fx)).tickSizeOuter(0));
    svg.append("g").attr("class", "ax").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickFormat(tf(fy)).tickSizeOuter(0));
    svg.append("text").attr("class", "axl").attr("x", W - m.r).attr("y", H - 4).attr("text-anchor", "end").text(fx.name + " →");
    svg.append("text").attr("class", "axl").attr("x", m.l + 4).attr("y", m.t + 2).text("↑ " + fy.name);
    const srt = [...pts].sort((a, b) => on.has(a.id) - on.has(b.id));
    svg.append("g").selectAll("circle").data(srt).join("circle").attr("cx", b => x(fx.get(b))).attr("cy", b => y(fy.get(b))).attr("r", b => (on.has(b.id) ? 5.5 : 3))
      .attr("fill", b => (on.has(b.id) ? C.brand : C.nat)).attr("fill-opacity", b => (on.has(b.id) ? 0.9 : 0.3)).attr("stroke", b => (on.has(b.id) ? "#fff" : "none")).style("cursor", "pointer")
      .on("mousemove", (ev, b) => tip(`${branchTip(b)}<br>${fx.name}: <b>${fx.fmt(fx.get(b))}</b><br>${fy.name}: <b>${fy.fmt(fy.get(b))}</b>`, ev)).on("mouseleave", untip).on("click", (ev, b) => { untip(); go(b.id); });
  }

  // =================================================================== v5 · VISUAL VOCABULARY
  const REJC = ["#5048e5", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#2a8fd6", "#8c86f5", "#f4a27c", "#a3a5bd"];
  const CHC = ["#5048e5", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#2a8fd6", "#8c86f5", "#f4a27c", "#a3a5bd"];

  // ---------- 1 · SANKEY (hand-rolled layered layout; nodes: {id,name,c}, links: {s,t,v})
  function sankey(el, cols, links, opt = {}) {
    el.innerHTML = "";
    const W = Math.max(width(el, 900), opt.minW || 0), H = opt.h || 360, nw = 14, pad = 10, m = { t: 8, b: 8, l: opt.l ?? 4, r: opt.r ?? 150 };
    const svg = svgIn(el, W, H, opt.label || "Sankey diagram"); if (W > width(el, 0) + 1) svg.style("min-width", W + "px");
    const N = {}; cols.forEach((col, ci) => col.forEach(n => (N[n.id] = { ...n, ci, in: 0, out: 0 })));
    links = links.filter(l => l.v > 0 && N[l.s] && N[l.t]);
    for (const l of links) { N[l.s].out += l.v; N[l.t].in += l.v; }
    for (const n of Object.values(N)) n.v = Math.max(n.in, n.out);
    const live = cols.map(col => col.map(n => N[n.id]).filter(n => n.v > 0));
    const k = d3.min(live, col => (H - m.t - m.b - pad * (col.length - 1)) / (d3.sum(col, n => n.v) || 1));
    const xs = live.map((_, i) => m.l + (i * (W - m.l - m.r - nw)) / Math.max(1, live.length - 1));
    live.forEach((col, ci) => { const tot = d3.sum(col, n => n.v * k) + pad * (col.length - 1); let y = m.t + (H - m.t - m.b - tot) / 2;
      for (const n of col) { n.x = xs[ci]; n.y0 = y; n.y1 = y + n.v * k; y = n.y1 + pad; n.so = n.y0; n.to = n.y0; } });
    links.sort((p, q) => N[p.t].y0 - N[q.t].y0 || N[p.s].y0 - N[q.s].y0);
    for (const l of links) { const s = N[l.s], t = N[l.t], h = l.v * k; l.sy = s.so + h / 2; s.so += h; l.ty = t.to + h / 2; t.to += h; l.w = h; }
    const lk = svg.append("g").attr("fill", "none").selectAll("path").data(links).join("path")
      .attr("d", l => { const x0 = N[l.s].x + nw, x1 = N[l.t].x, xm = (x0 + x1) / 2; return `M${x0},${l.sy}C${xm},${l.sy} ${xm},${l.ty} ${x1},${l.ty}`; })
      .attr("stroke", l => l.c || N[l.s].c).attr("stroke-opacity", 0.32).attr("stroke-width", l => Math.max(1, l.w)).attr("class", "sk-link")
      .on("mousemove", (ev, l) => { d3.select(ev.currentTarget).attr("stroke-opacity", 0.6); tip(`<b>${esc(N[l.s].name)} → ${esc(N[l.t].name)}</b><br>${opt.fmt ? opt.fmt(l.raw ?? l.v) : f0(l.v)}${l.note ? `<br><span class="k">${l.note}</span>` : ""}`, ev); })
      .on("mouseleave", ev => { d3.select(ev.currentTarget).attr("stroke-opacity", 0.32); untip(); });
    const nd = svg.append("g").selectAll("g").data(Object.values(N).filter(n => n.v > 0)).join("g");
    nd.append("rect").attr("x", n => n.x).attr("y", n => n.y0).attr("width", nw).attr("height", n => Math.max(1.5, n.y1 - n.y0)).attr("rx", 3).attr("fill", n => n.c)
      .on("mousemove", (ev, n) => { lk.attr("stroke-opacity", l => (l.s === n.id || l.t === n.id ? 0.62 : 0.1)); tip(`<b>${esc(n.name)}</b><br>${opt.fmt ? opt.fmt(n.raw ?? n.v) : f0(n.v)}`, ev); })
      .on("mouseleave", () => { lk.attr("stroke-opacity", 0.32); untip(); });
    const last = live.length - 1;
    // labels: right of each node; the last column is dodged so small nodes don't collide
    const lastN = live[last].slice().sort((p, q) => p.y0 - q.y0); let yy = -1e9;
    for (const n of lastN) { n.ly = Math.max((n.y0 + n.y1) / 2 + 4, yy + 14); yy = n.ly; }
    const over = yy - (H - 2); if (over > 0) for (const n of lastN) n.ly -= over;
    nd.filter(n => n.y1 - n.y0 > 7 || n.ci === 0 || n.ci === last).append("text").attr("class", "lbl-b").style("font-size", "11.5px")
      .attr("x", n => n.x + nw + 6).attr("y", n => (n.ci === last ? n.ly : (n.y0 + n.y1) / 2 + 4)).attr("text-anchor", "start")
      .text(n => `${n.name} · ${opt.short ? opt.short(n.raw ?? n.v) : f0(n.v)}`);
    nd.filter(n => n.ci === last && Math.abs(n.ly - 4 - (n.y0 + n.y1) / 2) > 3).append("line").attr("x1", n => n.x + nw).attr("x2", n => n.x + nw + 4).attr("y1", n => (n.y0 + n.y1) / 2).attr("y2", n => n.ly - 4).attr("stroke", C.muted);
    particles(svg, lk, links);
    return { svg, links: lk };
  }

  // ---------- 2 · NIGHTINGALE ROSE (percentile petals; optional second branch overlaid)
  function rose(el, a, opt = {}) {
    el.innerHTML = "";
    const ms = M.filter(m => m.p !== "market" && !(opt.hide && opt.hide.has(m.p)));
    const W = Math.min(width(el, 520), 560), H = W, cx = W / 2, cy = H / 2, R = W / 2 - 58, R0 = 20;
    const svg = svgIn(el, W, H, "Nightingale rose of metric percentiles").style("width", W + "px").style("max-width", "100%").style("margin", "0 auto").style("display", "block");
    const g = svg.append("g").attr("transform", `translate(${cx},${cy})`);
    const step = (2 * Math.PI) / ms.length, r = v => R0 + (R - R0) * Math.sqrt(Math.max(0, v) / 100);
    [25, 50, 75, 100].forEach(t => g.append("circle").attr("r", r(t)).attr("fill", "none").attr("stroke", C.line2).attr("stroke-dasharray", t === 100 ? null : "2 3"));
    [50, 100].forEach(t => g.append("text").attr("class", "axl").attr("x", 3).attr("y", -r(t) - 3).style("font-size", "9.5px").text(t));
    const arc = d3.arc().innerRadius(R0).padAngle(0.025).cornerRadius(3);
    ms.forEach((m, i) => {
      const a0 = i * step, a1 = (i + 1) * step, va = a.pct[m.id];
      g.append("path").attr("d", arc({ startAngle: a0, endAngle: a1, outerRadius: R })).attr("fill", PILC[m.p]).attr("opacity", 0.06);
      if (va !== null) g.append("path").attr("class", "petal").attr("data-a0", a0).attr("data-a1", a1).attr("data-r0", R0).attr("data-r", r(va)).attr("data-pad", 0.025).attr("data-cr", 3).attr("data-i", i).attr("d", arc({ startAngle: a0, endAngle: a1, outerRadius: r(va) })).attr("fill", opt.b ? CA : PILC[m.p]).attr("fill-opacity", opt.b ? 0.55 : 0.88).attr("stroke", C.panel).attr("stroke-width", 1)
        .on("mousemove", ev => tip(`<b>${m.label}</b><br>${esc(a.name)}: <b>${X.fmt(m, a.v[m.id])}</b> · percentile ${Math.round(va)}${opt.b ? `<br>${esc(opt.b.name)}: <b>${X.fmt(m, opt.b.v[m.id])}</b> · ${opt.b.pct[m.id] === null ? "–" : Math.round(opt.b.pct[m.id])}` : opt.peer ? `<br>${esc(opt.peer.name)}: ${X.fmt(m, X.peerValue(m, opt.peer))}` : ""}`, ev)).on("mouseleave", untip);
      if (opt.b && opt.b.pct[m.id] !== null) g.append("path").attr("d", arc({ startAngle: a0, endAngle: a1, outerRadius: r(opt.b.pct[m.id]) })).attr("fill", "none").attr("stroke", CB).attr("stroke-width", 2.4).attr("pointer-events", "none");
      if (!opt.b && opt.peer) { const pv = X.pctOf(m, m.level ? X.peerValue(m, opt.peer) : X.value(m, opt.peer.agg)); if (pv !== null) g.append("path").attr("d", d3.arc()({ innerRadius: r(pv) - 1.2, outerRadius: r(pv) + 1.2, startAngle: a0 + 0.04, endAngle: a1 - 0.04 })).attr("fill", C.peer).attr("pointer-events", "none"); }
      const am = (a0 + a1) / 2 - Math.PI / 2, lr = R + 12, lx = Math.cos(am) * lr, ly = Math.sin(am) * lr;
      g.append("text").attr("class", "axl").style("fill", C.ink2).style("font-size", "10.5px").attr("x", lx).attr("y", ly + 3).attr("text-anchor", Math.abs(lx) < 12 ? "middle" : lx > 0 ? "start" : "end").text(m.short);
    });
    g.append("circle").attr("r", R0 - 2).attr("fill", C.panel);
    g.append("text").attr("text-anchor", "middle").attr("y", 5).style("font", "700 14px var(--ui)").style("fill", C.ink).text(opt.b ? "vs" : Math.round(a.health));
  }

  // ---------- 3 · STREAM GRAPH (product mix month by month)
  function stream(el, b, opt = {}) {
    el.innerHTML = "";
    const xs = opt.xs || X.FULL, keys = CORE.filter(f => !(opt.hide && opt.hide.has(f)) && sum(xs, m => b["cfm_" + f + "|" + m] || 0) > 0.01);
    if (!keys.length) { el.innerHTML = `<div class="empty">Too little sanctioned volume.</div>`; return; }
    const rows = xs.map(m => Object.fromEntries([["m", m], ...keys.map(f => [f, b["cfm_" + f + "|" + m] || 0])]));
    const W = width(el, 900), H = 280, mg = { t: 16, r: 14, b: 26, l: 14 };
    const svg = svgIn(el, W, H, "Stream graph of sanctions by product");
    const st = d3.stack().keys(keys).offset(d3.stackOffsetWiggle).order(d3.stackOrderInsideOut)(rows);
    const x = d3.scalePoint().domain(xs).range([mg.l, W - mg.r]), y = d3.scaleLinear().domain([d3.min(st, s => d3.min(s, d => d[0])), d3.max(st, s => d3.max(s, d => d[1]))]).range([H - mg.b, mg.t]);
    const area = d3.area().curve(d3.curveBasis).x(d => x(d.data.m)).y0(d => y(d[0])).y1(d => y(d[1]));
    svg.append("g").selectAll("line").data(xs).join("line").attr("x1", d => x(d)).attr("x2", d => x(d)).attr("y1", mg.t).attr("y2", H - mg.b).attr("stroke", C.line).attr("stroke-dasharray", "2 4");
    const cid = "sc" + Math.random().toString(36).slice(2, 7);
    svg.append("clipPath").attr("id", cid).append("rect").attr("class", "wipe").attr("x", 0).attr("y", 0).attr("height", H).attr("width", W).attr("data-w", W);
    const lay = svg.append("g").attr("clip-path", `url(#${cid})`).selectAll("path").data(st).join("path").attr("d", area).attr("fill", s => FAMC[s.key]).attr("fill-opacity", 0.88).attr("stroke", C.panel).attr("stroke-width", 0.8);
    svg.append("g").attr("class", "ax").attr("transform", `translate(0,${H - mg.b})`).call(d3.axisBottom(x).tickFormat(MON).tickSize(0)).select(".domain").remove();
    // label each stream where it is thickest
    for (const s of st) { let bi = 0, bw = 0; s.forEach((d, i) => { if (d[1] - d[0] > bw && i > 0 && i < s.length - 1) { bw = d[1] - d[0]; bi = i; } });
      if (y(s[bi][0]) - y(s[bi][1]) > 16) svg.append("text").attr("x", x(xs[bi])).attr("y", (y(s[bi][0]) + y(s[bi][1])) / 2 + 4).attr("text-anchor", "middle").style("font", "600 11.5px var(--ui)").style("fill", "#fff").attr("pointer-events", "none").text(FAM_SHORT[s.key]); }
    const hl = svg.append("line").attr("y1", mg.t).attr("y2", H - mg.b).attr("stroke", C.ink).attr("stroke-width", 1).attr("opacity", 0);
    svg.append("rect").attr("x", mg.l).attr("y", mg.t).attr("width", W - mg.l - mg.r).attr("height", H - mg.t - mg.b).attr("fill", "transparent")
      .on("mousemove", ev => { const [px] = d3.pointer(ev); const i = Math.max(0, Math.min(xs.length - 1, Math.round(((px - mg.l) / (W - mg.l - mg.r)) * (xs.length - 1)))), m = xs[i], t = sum(keys, f => rows[i][f]);
        hl.attr("x1", x(m)).attr("x2", x(m)).attr("opacity", 0.4);
        tip(`<b>${MON(m)}</b> · ${X.cr(t)} sanctioned<br>${keys.slice().sort((p, q) => rows[i][q] - rows[i][p]).map(f => `<span style="color:${FAMC[f]}">●</span> ${FAM_SHORT[f]} <b>${X.cr(rows[i][f])}</b> <span class="k">${pct0(t ? rows[i][f] / t : 0)}</span>`).join("<br>")}`, ev); })
      .on("mouseleave", () => { hl.attr("opacity", 0); untip(); });
    return lay;
  }

  // ---------- 4 · WATERFALL (₹ bridge)
  function waterfall(el, steps, opt = {}) {
    el.innerHTML = "";
    const W = width(el, 700), H = opt.h || 260, mg = { t: 24, r: 10, b: 46, l: 50 };
    const svg = svgIn(el, W, H, opt.label || "Waterfall");
    let run = 0; const bars = steps.map(s => { if (s.total) { const o = { ...s, y0: 0, y1: s.v ?? run }; run = o.y1; return o; } const o = { ...s, y0: run, y1: run + s.v }; run += s.v; return o; });
    const x = d3.scaleBand().domain(bars.map((d, i) => i)).range([mg.l, W - mg.r]).padding(0.28);
    const y = d3.scaleLinear().domain([Math.min(0, d3.min(bars, d => Math.min(d.y0, d.y1))), d3.max(bars, d => Math.max(d.y0, d.y1)) * 1.08 || 1]).range([H - mg.b, mg.t]).nice();
    svg.append("g").attr("class", "gridl").selectAll("line").data(y.ticks(4)).join("line").attr("x1", mg.l).attr("x2", W - mg.r).attr("y1", d => y(d)).attr("y2", d => y(d));
    svg.append("g").attr("class", "ax").attr("transform", `translate(${mg.l},0)`).call(d3.axisLeft(y).ticks(4).tickFormat(d => "₹" + d).tickSizeOuter(0)).select(".domain").remove();
    bars.forEach((d, i) => {
      if (i) svg.append("line").attr("x1", x(i - 1) + x.bandwidth()).attr("x2", x(i)).attr("y1", y(bars[i - 1].y1)).attr("y2", y(bars[i - 1].y1)).attr("stroke", C.muted).attr("stroke-dasharray", "3 3");
      const top = y(Math.max(d.y0, d.y1)), h = Math.max(1.5, Math.abs(y(d.y0) - y(d.y1)));
      svg.append("rect").attr("class", opt.anim === false ? null : "wf").attr("data-base", d.total ? y(0) : y(d.y0)).attr("data-i", i).attr("x", x(i)).attr("width", x.bandwidth()).attr("y", top).attr("height", h).attr("rx", 5)
        .attr("fill", d.total ? (d.c || C.ink2) : d.v >= 0 ? d.c || C.good : C.bad).attr("fill-opacity", d.total ? 1 : 0.9)
        .on("mousemove", ev => tip(`<b>${esc(d.k)}</b><br>${d.total ? X.cr(d.y1) : (d.v >= 0 ? "+" : "−") + X.cr(Math.abs(d.v))}${d.note ? `<br><span class="k">${esc(d.note)}</span>` : ""}`, ev)).on("mouseleave", untip);
      svg.append("text").attr("x", x(i) + x.bandwidth() / 2).attr("y", top - 6).attr("text-anchor", "middle").style("font", "600 11px var(--ui)").style("fill", C.ink).text(d.total ? X.cr(d.y1) : (d.v >= 0 ? "+" : "−") + X.cr(Math.abs(d.v)));
      const lab = svg.append("text").attr("class", "axl").attr("text-anchor", "middle").attr("x", x(i) + x.bandwidth() / 2).attr("y", H - mg.b + 15).style("fill", d.total ? C.ink : C.ink2).style("font-weight", d.total ? 600 : 400);
      const words = d.k.split(" "), half = Math.ceil(words.length / 2);
      if (x.bandwidth() < d.k.length * 5.6 && words.length > 1) { lab.append("tspan").attr("x", x(i) + x.bandwidth() / 2).text(words.slice(0, half).join(" ")); lab.append("tspan").attr("x", x(i) + x.bandwidth() / 2).attr("dy", 12).text(words.slice(half).join(" ")); } else lab.text(d.k);
    });
  }

  // ---------- 5 · PARALLEL COORDINATES (percentiles, brushable)
  function parallel(el, b, list, onCount) {
    el.innerHTML = "";
    const ms = M.filter(m => m.p !== "market" && X.DIST[m.id].length > 30);
    const W = Math.max(width(el, 1000), 760), H = 380, mg = { t: 44, r: 34, b: 16, l: 34 };
    const svg = svgIn(el, W, H, "Parallel coordinates of metric percentiles"); if (W > width(el, 0) + 1) svg.style("min-width", W + "px");
    const x = d3.scalePoint().domain(ms.map(m => m.id)).range([mg.l, W - mg.r]), y = d3.scaleLinear().domain([0, 100]).range([H - mg.b, mg.t]);
    const line = d => d3.line().defined(p => p[1] !== null).curve(d3.curveMonotoneX)(ms.map(m => [x(m.id), d.pct[m.id] === null ? null : y(d.pct[m.id])]));
    const others = list.filter(d => d.id !== b.id);
    const pl = svg.append("g").attr("fill", "none").selectAll("path").data(others).join("path").attr("d", line).attr("stroke", C.peer).attr("stroke-opacity", 0.22).attr("stroke-width", 1.2).style("cursor", "pointer")
      .on("mousemove", (ev, d) => { d3.select(ev.currentTarget).attr("stroke-opacity", 0.9).attr("stroke-width", 2.4).raise(); tip(branchTip(d), ev); })
      .on("mouseleave", ev => { d3.select(ev.currentTarget).attr("stroke-opacity", ev.currentTarget.dataset.on === "0" ? 0.05 : 0.22).attr("stroke-width", 1.2); untip(); })
      .on("click", (ev, d) => { untip(); go(d.id); });
    svg.append("path").attr("d", line(b)).attr("fill", "none").attr("stroke", C.brand).attr("stroke-width", 3.5).attr("pointer-events", "none");
    svg.append("g").selectAll("circle").data(ms.filter(m => b.pct[m.id] !== null)).join("circle").attr("cx", m => x(m.id)).attr("cy", m => y(b.pct[m.id])).attr("r", 4).attr("fill", C.brand).attr("stroke", C.panel).attr("stroke-width", 1.5).attr("pointer-events", "none");
    const sel = {};
    const apply = () => { let n = 0; pl.each(function (d) { const on = Object.entries(sel).every(([k, [lo, hi]]) => d.pct[k] !== null && d.pct[k] >= lo && d.pct[k] <= hi); this.dataset.on = on ? "1" : "0"; if (on) n++; d3.select(this).attr("stroke-opacity", on ? 0.22 : 0.05); }); onCount && onCount(n, others.length, Object.keys(sel).length); };
    const ax = svg.append("g").selectAll("g").data(ms).join("g").attr("transform", m => `translate(${x(m.id)},0)`);
    ax.append("line").attr("y1", mg.t).attr("y2", H - mg.b).attr("stroke", C.line2);
    ax.append("text").attr("y", (m, i) => mg.t - (i % 2 ? 10 : 26)).attr("text-anchor", "middle").style("font", "600 10.5px var(--ui)").style("fill", m => PILC[m.p]).text(m => m.short);
    ax.filter((m, i) => i === 0).call(g => { g.append("text").attr("x", -6).attr("y", mg.t + 4).attr("text-anchor", "end").attr("class", "axl").style("font-size", "9.5px").text("100"); g.append("text").attr("x", -6).attr("y", H - mg.b).attr("text-anchor", "end").attr("class", "axl").style("font-size", "9.5px").text("0"); });
    ax.each(function (m) {
      const br = d3.brushY().extent([[-10, mg.t], [10, H - mg.b]]).on("brush end", ev => { if (ev.selection) { const [a0, a1] = ev.selection; sel[m.id] = [y.invert(a1), y.invert(a0)]; } else delete sel[m.id]; apply(); });
      d3.select(this).append("g").attr("class", "pc-brush").call(br);
    });
    apply();
  }

  // ---------- 6 · FLOW-MAP ARCS on the hex map
  function arcs(mp, from, tos, opt = {}) {
    const [x0, y0] = mp.proj(JIT[from.id] || [from.lon, from.lat]), g = mp.svg.append("g").attr("class", "arcs").attr("pointer-events", "none");
    const defs = mp.svg.append("defs"), gid = "ag" + Math.random().toString(36).slice(2, 7);
    tos.forEach((t, i) => {
      const [x1, y1] = mp.proj(JIT[t.b.id] || [t.b.lon, t.b.lat]), dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy) || 1, bend = Math.min(140, d * 0.35);
      const cx = (x0 + x1) / 2 - (dy / d) * bend, cy = (y0 + y1) / 2 + (dx / d) * bend - bend * 0.25;
      const lg = defs.append("linearGradient").attr("id", gid + i).attr("gradientUnits", "userSpaceOnUse").attr("x1", x0).attr("y1", y0).attr("x2", x1).attr("y2", y1);
      lg.append("stop").attr("offset", "0%").attr("stop-color", opt.c0 || C.brand); lg.append("stop").attr("offset", "100%").attr("stop-color", t.c || C.good);
      g.append("path").attr("class", "flow-arc").attr("d", `M${x0},${y0}Q${cx},${cy} ${x1},${y1}`).attr("fill", "none").attr("stroke", `url(#${gid}${i})`).attr("stroke-width", t.w || 2.2).attr("stroke-linecap", "round").attr("opacity", 0.9);
      g.append("circle").attr("cx", x1).attr("cy", y1).attr("r", 5.5).attr("fill", t.c || C.good).attr("stroke", C.panel).attr("stroke-width", 2);
      t.px = x1; t.py = y1;
    });
    // labels in a dodged column to the right of the right-most target, with leader lines
    const lt = tos.filter(t => t.label).sort((p, q) => p.py - q.py), lx = Math.max(...lt.map(t => t.px), x0) + 34; let yy = -1e9;
    for (const t of lt) { t.ly = Math.max(t.py, yy + 17); yy = t.ly; }
    for (const t of lt) { g.append("path").attr("d", `M${t.px + 6},${t.py}L${lx - 14},${t.ly}L${lx - 4},${t.ly}`).attr("fill", "none").attr("stroke", C.muted).attr("stroke-width", 0.8);
      g.append("text").attr("class", "lbl-b").style("font-size", "11px").attr("x", lx).attr("y", t.ly + 4).text(t.label); }
    g.append("circle").attr("cx", x0).attr("cy", y0).attr("r", 7.5).attr("fill", opt.c0 || C.brand).attr("stroke", C.panel).attr("stroke-width", 2.5);
    return g;
  }

  // ---------- 7 · SUNBURST (zone → state → branch, zoomable)
  const ZONEC = { North: "#5048e5", South: "#1baf7a", West: "#eb6834", East: "#2a8fd6" };
  function sunburst(el, info) {
    el.innerHTML = "";
    const W = Math.min(width(el, 560), 560), R = W / 2;
    const zones = d3.groups(E, b => b.zone).map(([z, bs]) => ({ name: z, children: d3.groups(bs, b => b.state).map(([s, xs]) => ({ name: s, children: xs.map(b => ({ name: b.name, b, value: Math.max(0.01, b.core_da) })) })) }));
    const root = d3.partition().size([2 * Math.PI, 4])(d3.hierarchy({ name: "India", children: zones }).sum(d => d.value || 0).sort((p, q) => q.value - p.value));
    root.each(d => (d.current = d));
    const svg = svgIn(el, W, W, "Sunburst of zones, states and branches").style("width", W + "px").style("max-width", "100%").style("display", "block").style("margin", "0 auto");
    const g = svg.append("g").attr("transform", `translate(${R},${R})`);
    const ring = R / 4.15;
    const arc = d3.arc().startAngle(d => d.x0).endAngle(d => d.x1).padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.004)).padRadius(R)
      .innerRadius(d => d.y0 * ring + (d.y0 ? 4 : 0)).outerRadius(d => Math.max(d.y0 * ring, d.y1 * ring - 1.5));
    const col = d => { if (d.depth === 3) return BANDC[d.data.b.band.id]; const z = d.depth === 1 ? d : d.parent; return d3.color(ZONEC[z.data.name] || C.brand).copy({ opacity: d.depth === 1 ? 0.95 : 0.6 }) + ""; };
    const vis = d => d.y1 <= 4.01 && d.y0 >= 0.99 && d.x1 > d.x0;
    const path = g.append("g").selectAll("path").data(root.descendants().slice(1)).join("path").attr("fill", col).attr("d", d => arc(d.current)).attr("fill-opacity", d => (vis(d.current) ? 1 : 0))
      .style("cursor", "pointer")
      .on("mousemove", (ev, d) => tip(d.depth === 3 ? branchTip(d.data.b) : `<b>${esc(d.data.name)}</b><br>${X.cr(d.value)} core disbursal<br><span class="k">${d.leaves().length} branches · avg health ${Math.round(d3.mean(d.leaves(), l => l.data.b.health))}</span>`, ev)).on("mouseleave", untip)
      .on("click", (ev, d) => { untip(); if (d.depth === 3) go(d.data.b.id); else zoom(d); });
    const lab = g.append("g").attr("pointer-events", "none").attr("text-anchor", "middle").selectAll("text").data(root.descendants().slice(1).filter(d => d.depth < 3)).join("text")
      .attr("dy", "0.35em").style("font", "600 10.5px var(--ui)").style("fill", "#fff").attr("fill-opacity", d => +labOn(d.current)).attr("transform", d => labT(d.current)).text(d => (d.data.name.length > 13 ? d.data.name.slice(0, 12) + "…" : d.data.name));
    function labOn(d) { return d.y1 <= 3.01 && d.y0 >= 0.99 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.09 * (560 / W) ** 2; }
    function labT(d) { const xx = (((d.x0 + d.x1) / 2) * 180) / Math.PI, yy = ((d.y0 + d.y1) / 2) * ring; return `rotate(${xx - 90}) translate(${yy},0) rotate(${xx < 180 ? 0 : 180})`; }
    const mid = g.append("g").style("cursor", "pointer").on("click", () => zoom(cur.parent || root));
    mid.append("circle").attr("r", ring - 4).attr("fill", C.soft);
    const t1 = mid.append("text").attr("text-anchor", "middle").attr("y", -6).style("font", "600 10px var(--ui)").style("letter-spacing", ".12em").style("fill", C.muted);
    const t2 = mid.append("text").attr("text-anchor", "middle").attr("y", 16).style("font", "700 19px var(--ui)").style("fill", C.ink);
    const t3 = mid.append("text").attr("text-anchor", "middle").attr("y", 32).style("font", "500 10px var(--ui)").style("fill", C.muted);
    let cur = root;
    const centre = d => { t1.text(d === root ? "ALL INDIA" : d.data.name.toUpperCase().slice(0, 16)); t2.text(X.cr(d.value)); t3.text(d === root ? `${E.length} branches · tap a ring` : "tap centre to zoom out"); info && info(d); };
    function zoom(p) {
      cur = p; centre(p);
      root.each(d => (d.target = { x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI, x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI, y0: Math.max(0, d.y0 - p.depth), y1: Math.max(0, d.y1 - p.depth) }));
      const t = svg.transition().duration(matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 650);
      path.transition(t).tween("data", d => { const i = d3.interpolate(d.current, d.target); return s => (d.current = i(s)); })
        .attr("fill-opacity", d => (vis(d.target) ? 1 : 0)).attrTween("d", d => () => arc(d.current));
      lab.transition(t).attr("fill-opacity", d => +labOn(d.target)).attrTween("transform", d => () => labT(d.current));
    }
    centre(root);
  }

  // ---------- 8 · RADIAL "SANCTION CLOCK"
  function sanctionClock(el, b, P, opt = {}) {
    el.innerHTML = "";
    const xs = opt.xs || X.FULL, v = xs.map(m => b["cm_sa_" + m] || 0), n = Math.max(1, P.others.length), pv = xs.map(m => (P.agg["cm_sa_" + m] || 0) / n), mean = d3.mean(v) || 0;
    const W = Math.min(width(el, 380), 380), R = W / 2 - 34, R0 = R * 0.38;
    const svg = svgIn(el, W, W, "Radial chart of monthly sanctions").style("width", W + "px").style("max-width", "100%").style("display", "block").style("margin", "0 auto");
    const g = svg.append("g").attr("transform", `translate(${W / 2},${W / 2})`);
    const mx = d3.max([...v, ...pv]) || 1, r = d3.scaleLinear().domain([0, mx]).range([R0, R]);
    const step = (2 * Math.PI) / xs.length, arc = d3.arc().innerRadius(R0).padAngle(0.05).cornerRadius(4);
    r.ticks(3).slice(1).forEach(t => g.append("circle").attr("r", r(t)).attr("fill", "none").attr("stroke", C.line).attr("stroke-dasharray", "2 3"));
    g.append("circle").attr("r", r(mean)).attr("fill", "none").attr("stroke", C.brand).attr("stroke-opacity", 0.5).attr("stroke-dasharray", "4 3");
    xs.forEach((m, i) => {
      g.append("path").attr("class", "petal").attr("data-a0", i * step).attr("data-a1", (i + 1) * step).attr("data-r0", R0).attr("data-r", r(v[i])).attr("data-pad", 0.05).attr("data-cr", 4).attr("data-i", i).attr("d", arc({ startAngle: i * step, endAngle: (i + 1) * step, outerRadius: r(v[i]) })).attr("fill", v[i] >= mean ? C.brand : C.brand2).attr("fill-opacity", v[i] >= mean ? 1 : 0.45)
        .on("mousemove", ev => tip(`<b>${MON(m)}</b><br>${X.cr(v[i])} sanctioned<br><span class="k">${f0(b["cm_san_" + m] || 0)} sanctions · avg peer branch ${X.cr(pv[i])}</span>`, ev)).on("mouseleave", untip);
      const am = (i + 0.5) * step - Math.PI / 2;
      g.append("circle").attr("cx", Math.cos(am) * r(pv[i])).attr("cy", Math.sin(am) * r(pv[i])).attr("r", 3.2).attr("fill", C.peer).attr("stroke", C.panel).attr("pointer-events", "none");
      g.append("text").attr("class", "axl").style("font-size", "10px").attr("text-anchor", "middle").attr("x", Math.cos(am) * (R + 14)).attr("y", Math.sin(am) * (R + 14) + 3).text(MON(m).slice(0, 3));
    });
    g.append("text").attr("text-anchor", "middle").attr("y", -4).style("font", "700 17px var(--ui)").style("fill", C.ink).text(X.cr(sum(v)));
    g.append("text").attr("text-anchor", "middle").attr("y", 12).style("font", "500 9.5px var(--ui)").style("fill", C.muted).text(xs.length + " months");
  }

  // ---------- 9 · MARIMEKKO of local markets (width = book, height = bucket mix)
  const BKS = [["B1", "B1 · 1–30", "#5048e5"], ["B2", "B2 · 31–60", "#8c86f5"], ["B3", "B3 · 61–90", "#eda100"], ["NPA", "NPA · 90+", "#e0444f"]];
  function marimekko(el, b) {
    el.innerHTML = "";
    const st = b.mstate || b.state, MK9 = X.MKM["09"];
    let ds = Object.entries(MK9).filter(([k]) => k.startsWith(st + "|") && !k.endsWith("|*")).map(([k, o]) => ({ k, name: X.title(o.d), o })).filter(d => d.o.pos > 0).sort((p, q) => q.o.pos - p.o.pos);
    if (ds.length < 2) { el.innerHTML = `<div class="empty">Not enough districts in ${esc(st)} to compare.</div>`; return null; }
    const top = ds.slice(0, 11), rest = ds.slice(11);
    if (rest.length) { const o = { pos: 0, B1: 0, B2: 0, B3: 0, NPA: 0 }; for (const d of rest) for (const kk in o) o[kk] += d.o[kk] || 0; top.push({ k: "rest", name: `${rest.length} more`, o }); }
    if (!top.some(d => d.k === b.mk_key) && MK9[b.mk_key] && !b.mk_key.endsWith("|*")) top.splice(top.length - (rest.length ? 1 : 0), 0, ds.find(d => d.k === b.mk_key));
    const W = Math.max(width(el, 900), 640), H = 300, mg = { t: 10, r: 8, b: 64, l: 40 }, tot = sum(top, d => d.o.pos);
    const svg = svgIn(el, W, H, "Marimekko of district loan books by bucket"); if (W > width(el, 0) + 1) svg.style("min-width", W + "px");
    const y = d3.scaleLinear().domain([0, 1]).range([H - mg.b, mg.t]);
    svg.append("g").attr("class", "ax").attr("transform", `translate(${mg.l},0)`).call(d3.axisLeft(y).ticks(4).tickFormat(d => d * 100 + "%").tickSizeOuter(0)).select(".domain").remove();
    let x0 = mg.l; const aw = W - mg.l - mg.r;
    for (const d of top) {
      const w = Math.max(3, (d.o.pos / tot) * aw), me = d.k === b.mk_key, T = sum(BKS, ([k]) => d.o[k] || 0) || 1; let acc = 0;
      for (const [k, n, c] of BKS) { const s = (d.o[k] || 0) / T;
        svg.append("rect").attr("x", x0 + 1).attr("width", w - 2).attr("y", y(acc + s)).attr("height", Math.max(0, y(acc) - y(acc + s))).attr("fill", c).attr("fill-opacity", me ? 1 : 0.55)
          .on("mousemove", ev => tip(`<b>${esc(d.name)}</b>${me ? " · this branch's market" : ""}<br>${n}: <b>${pct1(s)}</b> of ${X.fmt(MID.msize, d.o.pos)}`, ev)).on("mouseleave", untip);
        acc += s; }
      if (me) svg.append("rect").attr("x", x0 + 0.5).attr("width", w - 1).attr("y", mg.t - 1).attr("height", H - mg.b - mg.t + 2).attr("fill", "none").attr("stroke", C.ink).attr("stroke-width", 2).attr("rx", 2);
      if (w > 22 || me) svg.append("text").attr("class", me ? "lbl-b" : "axl").style("font-size", "10.5px").attr("text-anchor", "end").attr("transform", `translate(${x0 + w / 2 + 3},${H - mg.b + 10}) rotate(-38)`).text(d.name.length > 14 ? d.name.slice(0, 13) + "…" : d.name);
      x0 += w;
    }
    return st;
  }

  // ---------- 10 · HEX CHOROPLETH of local stress
  function stressMap(el, b, key) {
    const cv = new Map(), cn = new Map();
    for (const x of E) { const v = x.v[key]; if (v === null || x.lat == null) continue; const k = cellOf(x.lat, x.lon); cv.set(k, (cv.get(k) || 0) + v); cn.set(k, (cn.get(k) || 0) + 1); }
    for (const [k, v] of cv) cv.set(k, v / cn.get(k));
    const vals = [...cv.values()].sort(d3.ascending), lo = d3.quantile(vals, 0.05), hi = d3.quantile(vals, 0.95);
    const ramp = d3.scaleSequential(d3.interpolateRgbBasis(["#e8f6ef", "#f6e3a8", "#f4a27c", "#e0444f", "#8f1d3a"])).domain([lo, hi]).clamp(true);
    const mp = hexMap(el, { cellVal: cv, colorOf: v => ramp(v), minH: innerWidth < 700 ? 300 : 440, cellTip: (k, v) => `<b>${X.fmt(MID[key], v)}</b> ${MID[key].label.toLowerCase()}<br><span class="k">${E.filter(x => x.lat != null && cellOf(x.lat, x.lon) === k).map(x => esc(x.name)).slice(0, 4).join(", ")}</span>`,
      callouts: [{ b, title: b.name + " · " + b.mk_name, value: MID[key].short + " " + X.fmt(MID[key], b.v[key]), color: C.ink, big: true }], label: "Hex map shaded by local market stress" });
    return { lo, hi, ramp };
  }

  // ---------- 11 · VIOLINS (where the branch sits in each pillar's distribution)
  function violins(el, b, P, opt = {}) {
    el.innerHTML = "";
    const ps = PILLARS.filter(p => p.w && !(opt.hide && opt.hide.has(p.id))), pp = peerPillars(P), pool = opt.pool || E;
    const W = width(el, 600), rh = 58, mg = { t: 8, r: 16, b: 26, l: 118 }, H = mg.t + ps.length * rh + mg.b;
    const svg = svgIn(el, W, H, "Violin plots of pillar scores");
    const x = d3.scaleLinear().domain([0, 100]).range([mg.l, W - mg.r]);
    svg.append("g").attr("class", "ax").attr("transform", `translate(0,${H - mg.b})`).call(d3.axisBottom(x).tickValues([0, 25, 50, 75, 100]).tickSizeOuter(0));
    const kde = (vals, bw) => d3.range(0, 101, 2).map(t => [t, d3.mean(vals, v => Math.exp(-0.5 * ((t - v) / bw) ** 2))]);
    ps.forEach((p, i) => {
      const vals = pool.map(e => e.pill[p.id]).filter(v => v !== null); if (!vals.length) return; const dens = kde(vals, 6), dm = d3.max(dens, d => d[1]) || 1, cy = mg.t + i * rh + rh / 2, hh = rh * 0.42;
      const a = d3.area().curve(d3.curveCatmullRom).x(d => x(d[0])).y0(d => cy - (d[1] / dm) * hh).y1(d => cy + (d[1] / dm) * hh);
      svg.append("path").attr("d", a(dens)).attr("fill", PILC[p.id]).attr("fill-opacity", 0.18).attr("stroke", PILC[p.id]).attr("stroke-opacity", 0.5);
      const q = [0.25, 0.5, 0.75].map(t => d3.quantile(vals.slice().sort(d3.ascending), t));
      svg.append("line").attr("x1", x(q[0])).attr("x2", x(q[2])).attr("y1", cy).attr("y2", cy).attr("stroke", PILC[p.id]).attr("stroke-width", 3).attr("stroke-opacity", 0.5).attr("stroke-linecap", "round");
      svg.append("text").attr("class", "lbl-b").style("font-size", "12px").attr("x", 6).attr("y", cy + 4).text(p.name);
      if (pp[p.id] !== null) svg.append("line").attr("x1", x(pp[p.id])).attr("x2", x(pp[p.id])).attr("y1", cy - hh).attr("y2", cy + hh).attr("stroke", C.peer).attr("stroke-width", 2);
      const v = b.pill[p.id];
      if (v !== null) { svg.append("circle").attr("cx", x(v)).attr("cy", cy).attr("r", 7).attr("fill", PILC[p.id]).attr("stroke", C.panel).attr("stroke-width", 2.5)
        .on("mousemove", ev => tip(`<b>${p.name}</b><br>${esc(b.name)}: <b>${Math.round(v)}</b><br>${esc(P.name)}: ${pp[p.id] === null ? "–" : Math.round(pp[p.id])}<br><span class="k">${esc(opt.poolName || "network")} median ${Math.round(q[1])} · middle half ${Math.round(q[0])}–${Math.round(q[2])}</span>`, ev)).on("mouseleave", untip);
        svg.append("text").style("font", "700 11px var(--ui)").style("fill", C.ink).attr("x", x(v)).attr("y", cy - hh - 2).attr("text-anchor", "middle").text(Math.round(v)); }
    });
  }

  // ---------- 12 · WAFFLE (100 dots)
  function waffle(el, items, opt = {}) {
    const tot = sum(items, d => d.v); if (!tot) { el.innerHTML = `<div class="empty">Nothing to show.</div>`; return; }
    const raw = items.map(d => (d.v / tot) * 100), n = raw.map(Math.floor); let left = 100 - sum(n);
    raw.map((r, i) => [r - Math.floor(r), i]).sort((p, q) => q[0] - p[0]).slice(0, left).forEach(([, i]) => n[i]++);
    const cells = items.flatMap((d, i) => d3.range(n[i]).map(() => i));
    el.innerHTML = `<div class="waffle-w"><div class="waffle">${cells.map((i, j) => `<i style="background:${items[i].c}" data-i="${i}" title="${esc(items[i].k)}"></i>`).join("")}</div>
      <div class="waffle-l">${items.map((d, i) => n[i] ? `<div data-i="${i}"><i style="background:${d.c}"></i><span>${esc(d.k)}</span><b>${n[i]}</b></div>` : "").join("")}<p class="cmp">${opt.foot || `of every 100 · ${f0(tot)} in all`}</p></div></div>`;
    const hi = i => el.querySelectorAll(".waffle i").forEach(c => c.classList.toggle("dim", i !== null && c.dataset.i !== String(i)));
    el.querySelectorAll("[data-i]").forEach(c => { c.onmouseenter = () => hi(c.dataset.i); c.onmouseleave = () => hi(null); });
  }

  // =================================================================== v5 · wiring into sections
  const _sales = SEC.sales;
  SEC.sales = (b, P, el) => {
    _sales(b, P, el);
    el.insertAdjacentHTML("afterbegin", `<div class="card" style="margin-bottom:18px"><div class="card-h"><h3>Where the money flows</h3><span class="sub">₹ logged in by channel → disbursed or not yet → product · Aug–Sep</span></div><div id="skSales" class="chart scroll-x"></div>
      <p class="note">Gold &amp; securities loans are booked centrally, so they are shown but kept out of the core figures elsewhere. A channel's disbursal can come from logins before August, so it is capped at its logins; product flows are scaled to the disbursed total. Hover a band for the exact ₹.</p></div>`);
    el.insertAdjacentHTML("beforeend", `<div class="card" style="margin-top:18px"><div class="card-h"><h3>Product mix, month by month</h3><span class="sub">stream graph · sanctioned ₹ by product, Nov 2025 – Sep 2026</span></div><div id="stream" class="chart"></div>
      <div class="legend" style="margin-top:6px">${CORE.map(f => `<span><i style="background:${FAMC[f]}"></i>${FAM_SHORT[f]}</span>`).join("")}<span class="muted">thickness = ₹ sanctioned</span></div></div>`);
    const chs = X.CHANNELS.filter(c => (b["sch_la_" + c] || 0) > 0.001).sort((p, q) => b["sch_la_" + q] - b["sch_la_" + p]);
    const keep = chs.slice(0, 6), other = chs.slice(6);
    const ch = keep.map(c => ({ id: "c_" + c, name: c === "Self" ? "Walk-in" : c, c: CHC[X.CHANNELS.indexOf(c)], la: b["sch_la_" + c], da: b["sch_da_" + c] || 0 }));
    if (other.length) ch.push({ id: "c_oth", name: "Smaller channels", c: C.nat, la: sum(other, c => b["sch_la_" + c]), da: sum(other, c => b["sch_da_" + c] || 0) });
    const dis = { id: "dis", name: "Disbursed", c: C.good }, nd = { id: "nd", name: "Not disbursed yet", c: C.line2 };
    const L = []; let D = 0;
    for (const c of ch) { const d = Math.min(c.da, c.la); D += d; L.push({ s: c.id, t: "dis", v: d, raw: d, note: `${pct0(c.la ? d / c.la : 0)} of this channel's logins` }, { s: c.id, t: "nd", v: c.la - d, raw: c.la - d }); }
    const fams = [...CORE.map(f => ({ id: "f_" + f, name: FAM_SHORT[f], c: FAMC[f], v: b["sf_da_" + f] || 0 })), { id: "f_oth", name: "Gold & securities (central)", c: "#a3a5bd", v: (b.sf_da_GS || 0) + (b.sf_da_EF || 0) + (b.sf_da_OTH || 0) }].filter(f => f.v > 0.01);
    const fT = sum(fams, f => f.v) || 1;
    for (const f of fams) L.push({ s: "dis", t: f.id, v: (f.v / fT) * D, raw: f.v, c: f.c, note: "actual disbursal in this product" });
    if (D > 0) sankey($("#skSales"), [ch.map(c => ({ id: c.id, name: c.name, c: c.c })), [dis, nd], fams.map(f => ({ id: f.id, name: f.name, c: f.c }))], L, { h: 360, fmt: v => X.cr(v), short: v => X.cr(v), label: "Money flow from channel to product", minW: 760 });
    else $("#skSales").innerHTML = `<div class="empty">No disbursal in the window.</div>`;
    stream($("#stream"), b);
  };

  const _credit = SEC.credit;
  SEC.credit = (b, P, el) => {
    _credit(b, P, el);
    el.insertAdjacentHTML("beforeend", `<div class="g g2" style="margin-top:18px">
      <div class="card"><div class="card-h"><h3>Every 100 rejections</h3><span class="sub">waffle · one dot = 1% of rejections · hover a reason</span></div><div id="waf"></div></div>
      <div class="card"><div class="card-h"><h3>Life of an application</h3><span class="sub">decisions → outcome → after sanction · 13 months</span></div><div id="skCredit" class="chart scroll-x"></div></div></div>`);
    const rej = X.OV.meta.rej.map(r => ({ k: r, v: b["cr_" + r] || 0 })).filter(d => d.v > 0).sort((p, q) => q.v - p.v).map((d, i) => ({ ...d, c: REJC[i % REJC.length] }));
    waffle($("#waf"), rej, { foot: `of every 100 rejections · ${f0(sum(rej, d => d.v))} rejections in all` });
    const out = [["s", "Sanctioned", C.brand, b.c_san], ["g", "Auto-rejected", "#8c86f5", b.c_gated], ["d", "Declined", C.peer, b.c_declined], ["x", "Cancelled", "#c9c6fb", b.c_cancelled]];
    const known = sum(out, o => o[3] || 0), oth = Math.max(0, (b.c_dec || 0) - known);
    const aw = Math.max(0, b.c_san - b.c_booked - b.c_lapsed);
    const L = out.map(([id, , , v]) => ({ s: "dec", t: id, v: v || 0 }));
    if (oth > 0) L.push({ s: "dec", t: "o", v: oth });
    L.push({ s: "s", t: "bk", v: b.c_booked || 0 }, { s: "s", t: "aw", v: aw }, { s: "s", t: "lp", v: b.c_lapsed || 0 });
    sankey($("#skCredit"), [[{ id: "dec", name: "Decisions", c: C.ink2 }], [...out.map(([id, n, c]) => ({ id, name: n, c })), { id: "o", name: "Other / pending", c: C.nat }], [{ id: "bk", name: "Became a loan", c: C.good }, { id: "aw", name: "Awaiting", c: "#eda100" }, { id: "lp", name: "Lapsed", c: C.bad }]],
      L, { h: 300, fmt: v => f0(v) + " applications", short: v => f0(v), label: "Application flow", r: 130, minW: 560 });
  };

  const _score = SEC.scorecard;
  SEC.scorecard = (b, P, el) => {
    _score(b, P, el);
    const rc = $("#radar"); rc.previousElementSibling.querySelector("h3").textContent = "Branch DNA · Nightingale rose";
    rc.insertAdjacentHTML("afterend", `<div class="legend" style="justify-content:center;margin-top:-4px">${PILLARS.filter(p => p.w).map(p => `<span><i style="background:${PILC[p.id]}"></i>${p.name}</span>`).join("")}<span><i class="line" style="background:${C.peer}"></i>${esc(P.name)}</span></div>
      <p class="note" style="text-align:center">Petal length = percentile (area-true). Longer petals = better than more of the network.</p>`);
    rose(rc, b, { peer: P });
    el.insertAdjacentHTML("beforeend", `<div class="card" style="margin-top:18px"><div class="card-h"><h3>Where it sits in each pillar's distribution</h3><span class="sub">violin = all ${NRANK} branches · thick line = middle half · dot = ${esc(b.name)} · orange = ${esc(P.name)}</span></div><div id="viol" class="chart"></div></div>`);
    violins($("#viol"), b, P);
  };

  const _ov = SEC.overview;
  SEC.overview = (b, P, el) => {
    _ov(b, P, el);
    const s = $("#ovStrip"), card = s.closest(".card");
    card.querySelector(".card-h .sub").textContent = "Nov 2025 – Sep 2026 · radial · indigo = above its own average · orange dot = avg peer branch";
    const top = card.querySelector(".card-h").nextElementSibling;
    const wrap = document.createElement("div"); wrap.className = "clock-w"; card.insertBefore(wrap, top); wrap.appendChild(top); top.style.flexDirection = "column"; top.style.alignItems = "flex-start";
    s.remove(); card.querySelectorAll(".cf").forEach(x => x.remove()); const c = document.createElement("div"); c.id = "clock"; c.className = "chart"; wrap.appendChild(c);
    sanctionClock(c, b, P);
  };

  const _mkt = SEC.market;
  SEC.market = (b, P, el) => {
    _mkt(b, P, el);
    if (!X.market(b.mk_key, "09")) return;
    el.insertAdjacentHTML("beforeend", `<div class="g g-mk" style="margin-top:18px">
      <div class="card"><div class="card-h"><h3>Local stress across India</h3><div class="seg sm" id="stSeg"><button data-k="mnpa" class="on">NPA share</button><button data-k="mb1">B1 bounce</button></div></div><div id="stMap" class="map"></div><div id="stLeg" class="grad-leg"></div></div>
      <div class="card"><div class="card-h"><h3>Districts of ${esc(b.mstate || b.state)}</h3><span class="sub">Marimekko · width = loan book · height = bucket mix · outlined = this branch's market</span></div><div id="mekko" class="chart scroll-x"></div>
        <div class="legend">${BKS.map(([, n, c]) => `<span><i style="background:${c}"></i>${n}</span>`).join("")}</div>${b.mk_level === "state" ? `<p class="note">This branch is read at state level (its nearest district's book is thin), so no column is outlined.</p>` : ""}</div></div>`);
    const draw = k => { const r = stressMap($("#stMap"), b, k); $("#stLeg").innerHTML = `<span>${X.fmt(MID[k], r.lo)}</span><i style="background:linear-gradient(90deg,${d3.range(0, 1.01, 0.25).map(t => r.ramp(r.lo + t * (r.hi - r.lo))).join(",")})"></i><span>${X.fmt(MID[k], r.hi)}</span><em>${MID[k].label}, average of branches in each hex</em>`; };
    $("#stSeg").onclick = e => { const k = e.target.dataset.k; if (!k) return; $("#stSeg").querySelectorAll("button").forEach(x => x.classList.toggle("on", x === e.target)); draw(k); };
    draw("mnpa"); marimekko($("#mekko"), b);
  };

  const _peers = SEC.peers;
  SEC.peers = (b, P, el) => {
    _peers(b, P, el);
    $("#swarm").closest(".card").insertAdjacentHTML("afterend", `<div class="card" style="margin-bottom:18px"><div class="card-h"><h3>Every peer, every metric</h3><span class="sub" id="pcN"></span><button class="ghost-btn sm" id="pcReset">Clear filters</button></div>
      <p class="note" style="margin:-6px 0 8px">Parallel coordinates: each line is a branch across its metric percentiles (top = best). <b>Drag along any axis</b> to keep only branches in that range; click a line to open it.</p><div id="pc" class="chart scroll-x"></div></div>`);
    const draw = () => parallel($("#pc"), b, P.list, (n, t, k) => ($("#pcN").innerHTML = k ? `<b>${n}</b> of ${t} peers match ${k} filter${k > 1 ? "s" : ""}` : `${t} peers · indigo = ${esc(b.name)}`));
    $("#pcReset").onclick = draw; draw();
  };

  const shortOpp = o => { const t = o.title; return /^Convert/.test(t) ? "Conversion" : /^Source/.test(t) ? "Approval" : /^Attach/.test(t) ? "Insurance" : /^Open the/.test(t) ? t.replace(/^Open the (.*) channel$/, "$1").replace(/^\w/, c => c.toUpperCase()) + " channel" : /^(Launch|Scale up) /.test(t) ? t.replace(/^(Launch|Scale up) /, "").replace("loan against property", "LAP").replace(/^\w/, c => c.toUpperCase()) : t; };
  const _strat = SEC.strategy;
  SEC.strategy = (b, P, el) => {
    _strat(b, P, el);
    const ops = X.opportunities(b, P).filter(o => o.unit === "/month").slice(0, 6), base = (b.core_da || 0) / 2;
    $("#ansoff").closest(".card").insertAdjacentHTML("afterend", `<div class="card" style="margin-bottom:18px"><div class="card-h"><h3>From today to potential</h3><span class="sub">waterfall · monthly ₹ if each sized move landed (indicative)</span>${howBtn("opps")}</div><div id="wfS" class="chart"></div></div>`);
    if (ops.length) waterfall($("#wfS"), [{ k: "Today (core / month)", v: base, total: true, c: C.ink2 }, ...ops.map((o, i) => ({ k: shortOpp(o), v: o.val, c: [C.brand, C.peer, "#1baf7a", "#eda100", "#2a8fd6", "#e87ba4"][i], note: o.lens })), { k: "Potential", total: true, c: C.brand }], { h: 290, label: "Opportunity waterfall" });
    else $("#wfS").innerHTML = `<div class="empty">No sized gap against ${esc(P.name)}.</div>`;
  };

  const _twins = SEC.twins;
  SEC.twins = (b, P, el) => {
    _twins(b, P, el);
    const T = X.twins(b), list = (T.better.length ? T.better : T.near.filter(t => t.x.health > b.health)).slice(0, 5);
    if (!list.length || !el.querySelector(".tw-hero")) return;
    el.querySelector(".tw-hero").insertAdjacentHTML("beforebegin", `<div class="card" style="margin-bottom:18px"><div class="card-h"><h3>Where its better twins are</h3><span class="sub">flow map · arc thickness = similarity</span></div><div id="twMap" class="map"></div></div>`);
    const mp = hexMap($("#twMap"), { branches: E, isOn: () => false, fill: () => C.nat, r: () => 1.4, minH: innerWidth < 700 ? 300 : 420 });
    arcs(mp, b, list.map(t => ({ b: t.x, w: 1 + t.sim / 22, c: C.good, label: `${t.x.name} · ${Math.round(t.x.health)}` })));
  };

  const _wi = SEC.whatif;
  SEC.whatif = (b, P, el) => {
    _wi(b, P, el);
    $("#wiPil").closest(".card").insertAdjacentHTML("beforebegin", `<div class="card"><div class="card-h"><h3>₹ bridge</h3><span class="sub">today's monthly core disbursal + each lever</span></div><div id="wiWf" class="chart"></div></div>`);
    const L = X.LEVERS.filter(l => l.unit === "cr" && b.v[l.id] !== null);
    let wfDrawn = false;
    const draw = () => {
      if (!$("#wiWf")) return;
      const ov = WI[b.id] || {}, steps = [{ k: "Today", v: (b.core_da || 0) / 2, total: true, c: C.ink2 }];
      for (const l of L) if (ov[l.id] !== undefined) { const m = MID[l.id], d = ov[l.id] - b.v[l.id]; steps.push({ k: m.short, v: l.f(b, m.mult ? d / m.mult : d), c: PILC[m.p], note: l.what }); }
      steps.push({ k: "Simulated", total: true, c: C.brand });
      waterfall($("#wiWf"), steps, { h: 220, label: "What-if rupee bridge", anim: !wfDrawn }); wfDrawn = true;
    };
    el.querySelectorAll(".wi-l input").forEach(s => s.addEventListener("input", () => requestAnimationFrame(draw)));
    el.querySelector(".wi-pre").addEventListener("click", () => requestAnimationFrame(draw));
    draw();
  };

  const _csum = CSEC.summary;
  CSEC.summary = (a, b, el) => {
    _csum(a, b, el);
    const rc = $("#cRadar"); rc.previousElementSibling.querySelector("h3").textContent = "Branch DNA · two roses";
    rose(rc, a, { b });
    const mpEl = $("#cMap"); const mp = hexMap(mpEl, { branches: E, isOn: () => false, fill: () => C.nat, r: () => 1.4, minH: 320 });
    arcs(mp, a, [{ b, c: CB, w: 3, label: b.name }], { c0: CA });
    mp.svg.select(".arcs").append("text").attr("class", "lbl-b").style("font-size", "11px").attr("x", mp.proj(JIT[a.id])[0] + 10).attr("y", mp.proj(JIT[a.id])[1] - 10).text(a.name);
  };

  // landing: sunburst
  const _land = renderLanding;
  renderLanding = function () {
    _land();
    $("#stateHeat").closest(".card").insertAdjacentHTML("beforebegin", `<div class="g g-sb"><div class="card"><div class="card-h"><h3>The network as a sunburst</h3><span class="sub">zone → state → branch · size = core disbursal · outer ring coloured by health band · tap to zoom</span></div><div id="sun" class="chart"></div>
      <div class="legend" style="justify-content:center">${Object.entries(ZONEC).map(([z, c]) => `<span><i style="background:${c}"></i>${z}</span>`).join("")}${bandLegend().replace(/<span class="muted">.*?<\/span>/, "")}</div></div>
      <div class="card sb-info" id="sbInfo"></div></div>`);
    sunburst($("#sun"), d => {
      if (!$("#sbInfo")) return;
      const ls = d.leaves().map(l => l.data.b), top = ls.slice().sort((p, q) => q.health - p.health).slice(0, 5), bands = ["lead", "steady", "lag"].map(k => ls.filter(x => x.band.id === k).length);
      $("#sbInfo").innerHTML = `<div class="eyebrow">${d.depth === 0 ? "All India" : d.depth === 1 ? "Zone" : "State"}</div><h3>${esc(d.data.name)}</h3>
        <div class="big" style="margin:6px 0">${X.cr(d.value)}<small>core · Aug–Sep</small></div>
        <div class="sb-bands">${bands.map((n, i) => `<i style="flex:${n};background:${BANDC[["lead", "steady", "lag"][i]]}" title="${n}"></i>`).join("")}</div>
        <div class="cmp">${bands[0]} leaders · ${bands[1]} steady · ${bands[2]} lagging · avg health ${Math.round(d3.mean(ls, x => x.health))}</div>
        <div class="eyebrow" style="margin-top:14px">Healthiest here</div><ol class="lead-list">${top.map((x, i) => `<li><span class="n">${i + 1}</span><a href="#/b/${encodeURIComponent(x.id)}/overview">${esc(x.name)}</a><span class="muted">${Math.round(x.health)}</span></li>`).join("")}</ol>`;
    });
  };

  // =================================================================== v5 · DARK PRESENTATION MODE
  // Charts are drawn with the light palette; in dark mode every new SVG/HTML node under the main view is re-coloured
  // through one map (pale surfaces → deep navy, ink → near-white, series colours → their neon twins).
  const DARK = {
    "#ffffff": "#171a31", "#1c1d3a": "#eef0ff", "#55587a": "#b9bcdc", "#9496b4": "#8b8fb5",
    "#e9eaf6": "#262a47", "#d9dbef": "#333858", "#f5f6fd": "#1d2039", "#eceefb": "#242845", "#e3e4f6": "#232745", "#dfe0f3": "#2b2f50",
    "#cfd0f6": "#3a3e70", "#c9c6fb": "#4b46a0", "#f1f0fe": "#20234a", "#f3f2fe": "#1f2142", "#e3e1fd": "#2a2860", "#f8f8fc": "#1b1d34", "#fdf0e8": "#33251f",
    "#ddf3e8": "#143a2b", "#fbefd3": "#3a3118", "#fde2e4": "#3d1d2a", "#fde9df": "#3a2420", "#bfe6d1": "#1e6b4a", "#f6e3a8": "#7a6420", "#f7c6c9": "#7a2d3d", "#e8f6ef": "#1f3d33",
    "#5048e5": "#7d75ff", "#7b74ff": "#9d97ff", "#3a32c9": "#5d55f0", "#8c86f5": "#a8a2ff", "#eb6834": "#ff7a45", "#1baf7a": "#2bd99a", "#eda100": "#ffc22e",
    "#e87ba4": "#ff6fb5", "#2a8fd6": "#3fbcff", "#e0444f": "#ff5470", "#1f9d61": "#2bd99a", "#d79a00": "#ffc22e", "#c98800": "#ffc22e", "#a3a5bd": "#5f6390", "#f4a27c": "#d9764e",
  };
  const DK = {}; for (const [k, v] of Object.entries(DARK)) DK[d3.rgb(k).formatHex()] = v;
  const isDark = () => document.documentElement.dataset.theme === "dark";
  const KEEP = ".hero, .opp-hero";
  function recolor(v, isText) {
    if (!v || v === "none" || v.startsWith("url") || v.startsWith("var")) return null;
    const c = d3.color(v); if (!c) return null;
    const hx = d3.rgb(c).formatHex(); if (isText && hx === "#ffffff") return null;
    const m = DK[hx]; if (!m) return null;
    if (c.opacity < 1) { const r = d3.rgb(m); r.opacity = c.opacity; return r.formatRgb(); } return m;
  }
  function darken(node) {
    if (!isDark() || node.nodeType !== 1) return;
    const list = [node, ...node.querySelectorAll("*")];
    for (const el of list) {
      if (el.closest(KEEP)) continue;
      const txt = el.tagName === "text" || el.tagName === "tspan";
      for (const a of ["fill", "stroke", "stop-color"]) { const n = recolor(el.getAttribute(a), txt && a === "fill"); if (n) el.setAttribute(a, n); }
      const st = el.style; if (!st || !st.length) continue;
      for (const p of ["fill", "stroke", "background-color", "color", "border-color", "border-top-color", "border-left-color"]) { const v = st.getPropertyValue(p); const n = recolor(v, (txt && p === "fill") || p === "color"); if (n) st.setProperty(p, n, st.getPropertyPriority(p)); }
      const bg = st.getPropertyValue("background-image"); if (bg && bg.includes("gradient")) st.setProperty("background-image", bg.replace(/rgba?\([^)]*\)/g, x => recolor(x) || x));
    }
  }
  let dq = new Set(), draf = 0;
  new MutationObserver(ms => { for (const m of ms) m.addedNodes.forEach(n => { if (n.nodeType === 1) { enhance(n); if (isDark()) dq.add(n); } }); if (dq.size && !draf) draf = requestAnimationFrame(() => { draf = 0; const q = [...dq]; dq = new Set(); q.forEach(n => n.isConnected && darken(n)); }); })
    .observe($("#view"), { childList: true, subtree: true });
  $("#themeBtn").onclick = () => {
    const d = !isDark(); if (d) document.documentElement.dataset.theme = "dark"; else delete document.documentElement.dataset.theme;
    try { localStorage.setItem("ov-theme", d ? "dark" : "light"); } catch (e) { /* storage blocked: mode still applies for this visit */ }
    const y = scrollY; render(); scrollTo(0, y);
  };

  // =================================================================== v7 · MOTION
  // entry motion only (300–900 ms, ease-out, ~50 ms stagger); data values never change mid-flight; reduced-motion = final state at once
  const RM = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  function motion(root) {
    if (RM()) return;
    // petals (rose, sanction clock) bloom outward from the hub
    root.querySelectorAll("path.petal[data-r]").forEach(p => {
      const a0 = +p.dataset.a0, a1 = +p.dataset.a1, r0 = +p.dataset.r0, r1 = +p.dataset.r, i = +p.dataset.i || 0;
      const arc = d3.arc().innerRadius(r0).padAngle(+p.dataset.pad || 0.02).cornerRadius(+p.dataset.cr || 3).startAngle(a0).endAngle(a1);
      d3.select(p).attr("d", arc.outerRadius(r0 + 0.5)()).transition().delay(120 + i * 45).duration(650).ease(d3.easeCubicOut)
        .attrTween("d", () => { const it = d3.interpolate(r0 + 0.5, r1); return t => arc.outerRadius(it(t))(); });
    });
    // flow-map arcs draw themselves, then a comet travels along each one
    root.querySelectorAll("path.flow-arc").forEach((p, i) => {
      const L = p.getTotalLength(); if (!L) return;
      d3.select(p).attr("stroke-dasharray", `${L} ${L}`).attr("stroke-dashoffset", L).transition().delay(200 + i * 140).duration(900).ease(d3.easeCubicInOut).attr("stroke-dashoffset", 0)
        .on("end", () => { d3.select(p).attr("stroke-dasharray", null); comet(p); });
    });
    // waterfall bars rise from their base, one after another
    root.querySelectorAll("rect.wf").forEach(r => {
      const y = +r.getAttribute("y"), h = +r.getAttribute("height"), base = +r.dataset.base, i = +r.dataset.i || 0, up = base >= y + h - 0.5;
      d3.select(r).attr("y", up ? base : y).attr("height", 0).transition().delay(150 + i * 110).duration(550).ease(d3.easeCubicOut).attr("y", y).attr("height", h);
    });
    // stream graph wipes in from the left, as if time is passing
    root.querySelectorAll("rect.wipe").forEach(r => d3.select(r).attr("width", 0).transition().delay(150).duration(1100).ease(d3.easeCubicInOut).attr("width", +r.dataset.w));
    // sankey links fade up in column order
    root.querySelectorAll(".sk-link").forEach(l => d3.select(l).attr("stroke-opacity", 0).transition().delay(100 + Math.random() * 300).duration(500).attr("stroke-opacity", 0.32));
    countUps(root);
  }
  function comet(path) {
    if (RM() || !path.isConnected) return;
    const svg = d3.select(path.ownerSVGElement), L = path.getTotalLength();
    const c = svg.append("circle").attr("r", 3.2).attr("fill", "#fff").attr("stroke", C.brand).attr("stroke-width", 1.5).attr("pointer-events", "none");
    const go = () => { if (!path.isConnected) return c.remove(); c.transition().duration(1800).ease(d3.easeCubicInOut).attrTween("transform", () => t => { const pt = path.getPointAtLength(t * L); return `translate(${pt.x},${pt.y})`; }).on("end", () => setTimeout(go, 900)); };
    go();
  }
  // headline numbers count up, keeping their prefix, suffix, decimals and Indian digit grouping
  function countUps(root) {
    root.querySelectorAll(".hc-big, .big, .rk .v, .duel-big b").forEach(el => {
      if (el.closest("#wiRes, .sb-info") || el.dataset.cu) return;
      const tn = [...el.childNodes].find(n => n.nodeType === 3 && /\d/.test(n.nodeValue)); if (!tn) return;
      const m = tn.nodeValue.match(/^(.*?)(-?[\d,]*\.?\d+)(.*)$/s); if (!m) return;
      const raw = m[2], v = parseFloat(raw.replace(/,/g, "")), dec = (raw.split(".")[1] || "").length, grp = raw.includes(",");
      if (!isFinite(v) || Math.abs(v) < 1.5 && dec === 0) return;
      el.dataset.cu = "1";
      const fmt = x => (grp ? x.toLocaleString("en-IN", { minimumFractionDigits: dec, maximumFractionDigits: dec }) : x.toFixed(dec));
      d3.select(el).transition().duration(800).ease(d3.easeCubicOut).tween("cu", () => t => { tn.nodeValue = m[1] + fmt(v * t) + m[3]; });
    });
  }
  // sankey: particles stream along each band, more particles on heavier flows
  function particles(svg, lk, links) {
    if (RM()) return;
    const P = [], g = svg.append("g").attr("pointer-events", "none");
    lk.each(function (l) { if (l.w < 2) return; const n = Math.max(1, Math.min(6, Math.round(l.w / 7))), L = this.getTotalLength();
      for (let k = 0; k < n; k++) P.push({ path: this, L, ph: Math.random(), dy: (Math.random() - 0.5) * Math.max(0, l.w - 4), sp: 0.00011 + Math.random() * 0.00005,
        c: g.append("circle").attr("r", Math.min(2.6, 1 + l.w / 10)).attr("fill", l.c || d3.select(this).attr("stroke")).attr("opacity", 0.85) }); });
    if (P.length > 90) P.splice(90).forEach(p => p.c.remove());
    const t0 = performance.now();
    (function tick(now) {
      if (!svg.node().isConnected) return;
      for (const p of P) { const f = (p.ph + (now - t0) * p.sp) % 1, pt = p.path.getPointAtLength(f * p.L); p.c.attr("cx", pt.x).attr("cy", pt.y + p.dy * Math.sin(f * Math.PI)).attr("opacity", 0.85 * Math.sin(f * Math.PI)); }
      requestAnimationFrame(tick);
    })(t0);
  }

  // =================================================================== v7 · LAYOUT POLISH
  // one card-header pattern everywhere: title + subtitle on the left, round actions on the right; an expand button on chart cards
  const EXP_I = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7"/></svg>';
  function enhance(node) {
    if (node.nodeType !== 1) return;
    const hs = node.matches && node.matches(".card-h") ? [node] : node.querySelectorAll(".card-h");
    hs.forEach(h => {
      if (h.dataset.enh) return; h.dataset.enh = "1";
      const kids = [...h.children], t = document.createElement("div"), a = document.createElement("div"); t.className = "ch-t"; a.className = "ch-a";
      let sub = false;
      for (const k of kids) { if (k.tagName === "H3" || (!sub && k.matches("span.sub"))) { if (k.matches("span.sub")) sub = true; t.appendChild(k); } else a.appendChild(k); }
      a.querySelectorAll(".how").forEach(b => { b.classList.add("ico"); b.title = "How is this calculated?"; [...b.childNodes].forEach(n => n.nodeType === 3 && n.remove()); });
      const card = h.closest(".card");
      if (card && card.querySelector(".card-h") === h && !card.closest(".hero") && card.querySelector(".chart svg, .map svg, .chart .fun") && !a.querySelector(".exp")) a.insertAdjacentHTML("beforeend", `<button class="exp" type="button" title="Expand" aria-label="Expand chart">${EXP_I}</button>`);
      h.append(t); if (a.children.length) h.append(a);
    });
  }
  let FULL = null;
  const scrimX = document.createElement("div"); scrimX.className = "scrim xs"; document.body.appendChild(scrimX);
  function closeFull() { if (!FULL) return; FULL.classList.remove("full"); FULL = null; scrimX.classList.remove("on"); document.body.classList.remove("no-scroll"); }
  scrimX.onclick = closeFull;
  document.addEventListener("click", e => { const b = e.target.closest(".exp"); if (!b) return; const c = b.closest(".card"); if (FULL === c) return closeFull(); closeFull(); FULL = c; c.classList.add("full"); scrimX.classList.add("on"); document.body.classList.add("no-scroll"); });
  addEventListener("keydown", e => { if (e.key === "Escape") closeFull(); });
  addEventListener("hashchange", () => { closeFull(); document.body.classList.remove("nav-open"); });

  // touch: a tap on a mark shows its tooltip (charts listen for mousemove)
  let tipT = 0;
  document.addEventListener("pointerdown", e => {
    if (e.pointerType !== "touch") return;
    untip(); clearTimeout(tipT);
    const t = e.target.closest("svg *"); if (!t) return;
    t.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: e.clientX, clientY: e.clientY }));
    tipT = setTimeout(untip, 3200);
  }, { passive: true });

  // =================================================================== CHART FILTERS
  // Every chart drawn by the shared kit (bars, lines, donuts, stacks, dumbbells, Pareto, heat tables) gets a funnel
  // button in its card header: pick months, series, categories or rows, sort, or keep the top N.
  // Choices are remembered per chart and section, so they hold while you move between branches.
  const FUN_I = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16l-6.2 7.6V19l-3.6 1.8v-8.2z"/></svg>';
  const CF = new Map();
  const isMonth = a => a.length > 2 && a.every(k => /^\d{4}-\d{2}$/.test(String(k)));
  const keyTxt = k => (/^\d{4}-\d{2}$/.test(String(k)) ? MON(k) : String(k));
  const cfKey = (el, label) => [state.view, state.view === "compare" ? state.csec : state.view === "branch" ? state.sec : "", el.id || label || "chart"].join("|");
  const cfNone = el => { el.innerHTML = `<div class="empty">Nothing selected — open the filter <span class="cf-ico">${FUN_I}</span> to pick at least one item.</div>`; return ""; };
  // control kinds: range (from/to over ordered keys) · set (tick boxes; stores what is hidden, so new items show by default) · sort · top
  const cfActive = (spec, f) => spec.filter(c => (c.type === "set" ? f[c.id] && c.items.some(it => f[c.id].has(it.k)) : c.type === "range" ? (f.from && f.from !== c.items[0].k) || (f.to && f.to !== c.items[c.items.length - 1].k) : f[c.id] && f[c.id] !== c.def)).length;
  function cfRange(c, f) {
    const ks = c.items.map(i => i.k); let a = ks.indexOf(f.from), b = ks.indexOf(f.to);
    if (a < 0) a = 0; if (b < 0) b = ks.length - 1; if (a > b) [a, b] = [b, a];
    return [a, b];
  }
  function cfPanel(pop, spec, f, redraw) {
    let h = "";
    for (const c of spec) {
      if (c.type === "range") {
        const [a, b] = cfRange(c, f), opts = sel => c.items.map((it, i) => `<option value="${i}" ${i === sel ? "selected" : ""}>${esc(it.t)}</option>`).join("");
        h += `<div class="cf-sec"><div class="cf-l">${esc(c.label)}</div><div class="cf-rng"><select data-r="from" aria-label="From">${opts(a)}</select><span>to</span><select data-r="to" aria-label="To">${opts(b)}</select></div>
          <div class="cf-quick">${[3, 6].filter(n => n < c.items.length).map(n => `<button type="button" data-last="${n}">Last ${n}</button>`).join("")}<button type="button" data-last="all">All</button></div></div>`;
      } else if (c.type === "set") {
        const off = f[c.id] || new Set();
        h += `<div class="cf-sec" data-set="${c.id}"><div class="cf-l">${esc(c.label)}<span><button type="button" data-all="1">All</button><button type="button" data-all="0">None</button></span></div>
          ${c.items.length > 9 ? `<input type="search" class="cf-q" placeholder="Search…" aria-label="Search ${esc(c.label)}">` : ""}
          <div class="cf-list">${c.items.map(it => `<label class="cf-it"><input type="checkbox" value="${esc(it.k)}" ${off.has(it.k) ? "" : "checked"}>${it.c ? `<i style="background:${it.c}"></i>` : ""}<span>${esc(it.t)}</span></label>`).join("")}</div></div>`;
      } else {
        h += `<div class="cf-sec"><div class="cf-l">${esc(c.label)}</div><select data-o="${c.id}" class="cf-sel">${c.options.map(([v, t]) => `<option value="${esc(v)}" ${(f[c.id] || c.def) === v ? "selected" : ""}>${esc(t)}</option>`).join("")}</select></div>`;
      }
    }
    pop.innerHTML = h + `<div class="cf-foot"><button type="button" class="cf-reset">Reset</button><button type="button" class="cf-done">Done</button></div>`;
    const rng = spec.find(c => c.type === "range");
    pop.querySelectorAll("[data-r]").forEach(s => s.onchange = () => { f[s.dataset.r] = rng.items[+s.value].k; redraw(); });
    pop.querySelectorAll("[data-last]").forEach(bn => bn.onclick = () => { const n = bn.dataset.last, ks = rng.items; f.to = ks[ks.length - 1].k; f.from = n === "all" ? ks[0].k : ks[Math.max(0, ks.length - +n)].k; redraw(true); });
    pop.querySelectorAll("[data-set]").forEach(sec => {
      const c = spec.find(x => x.id === sec.dataset.set), off = () => (f[c.id] = f[c.id] || new Set());
      sec.querySelectorAll("input[type=checkbox]").forEach(cb => cb.onchange = () => { const k = c.items.find(it => String(it.k) === cb.value).k; if (cb.checked) off().delete(k); else off().add(k); redraw(); });
      sec.querySelectorAll("[data-all]").forEach(bn => bn.onclick = () => { f[c.id] = bn.dataset.all === "1" ? new Set() : new Set(c.items.map(it => it.k)); redraw(true); });
      const q = sec.querySelector(".cf-q"); if (q) q.oninput = () => sec.querySelectorAll(".cf-it").forEach(l => { l.style.display = l.textContent.toLowerCase().includes(q.value.trim().toLowerCase()) ? "" : "none"; });
    });
    pop.querySelectorAll("[data-o]").forEach(s => s.onchange = () => { f[s.dataset.o] = s.value; redraw(); });
    pop.querySelector(".cf-reset").onclick = () => { for (const k of Object.keys(f)) delete f[k]; redraw(true); };
    pop.querySelector(".cf-done").onclick = () => pop.classList.remove("on");
  }
  // one funnel per chart: in the card header when the chart owns the card, otherwise a slim bar just above the chart
  // a chart that a later step replaced must not leave its funnel behind
  const cfPrune = () => {
    document.querySelectorAll(".cf").forEach(h => { if (!document.querySelector(`[data-cf-id="${h.dataset.for}"]`)) h.remove(); });
    document.querySelectorAll("body > .cf-pop").forEach(p => { if (!document.querySelector(`.cf[data-for="${p.dataset.for}"]`)) p.remove(); });
  };
  const cfClose = () => document.querySelectorAll(".cf-pop.on").forEach(x => x.classList.remove("on"));
  addEventListener("hashchange", () => { cfClose(); setTimeout(cfPrune, 400); });
  addEventListener("resize", cfClose);
  addEventListener("scroll", e => { if (!(e.target && e.target.closest && e.target.closest(".cf-pop"))) cfClose(); }, { passive: true, capture: true });
  let cfT = 0;
  function cfButton(el, spec, f, redraw) {
    cfPrune(); clearTimeout(cfT); cfT = setTimeout(cfPrune, 60);
    if (!el.dataset.cfId) el.dataset.cfId = "cf" + Math.random().toString(36).slice(2, 8);
    const id = el.dataset.cfId, card = el.closest(".card");
    let host = document.querySelector(`.cf[data-for="${id}"]`);
    if (!host) {
      host = document.createElement("div"); host.className = "cf"; host.dataset.for = id;
      host.innerHTML = `<button type="button" class="cf-btn" title="Filter this chart" aria-label="Filter this chart" aria-haspopup="true">${FUN_I}<span class="cf-n"></span></button>`;
      // the panel floats on <body> so a card's rounded clipping never cuts it off
      const pop = document.createElement("div"); pop.className = "cf-pop"; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-label", "Chart filters"); pop.dataset.for = id;
      document.body.appendChild(pop); host._pop = pop;
      const head = card && !card.closest(".hero") && card.querySelector(".card-h");
      const mine = head && !card.querySelector(".cf:not(.cf-inline)") && head.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING;
      if (mine) { const a = head.querySelector(".ch-a"); (a || head).insertBefore(host, (a || head).querySelector(".exp")); }
      else { host.classList.add("cf-inline"); el.parentNode.insertBefore(host, el); }
      host.querySelector(".cf-btn").onclick = e => {
        e.stopPropagation(); const open = !pop.classList.contains("on"); cfClose();
        if (!open) return;
        host._panel(); pop.classList.add("on");
        const r = host.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight;
        pop.style.left = Math.max(8, Math.min(innerWidth - pw - 8, r.right - pw)) + "px";
        pop.style.top = (r.bottom + 8 + ph > innerHeight - 8 && r.top - ph - 8 > 8 ? r.top - ph - 8 : r.bottom + 8) + "px";
      };
      pop.addEventListener("click", e => e.stopPropagation());
    }
    host._panel = () => cfPanel(host._pop, spec, f, keep => { redraw(); if (keep) host._panel(); });
    const n = cfActive(spec, f);
    host.classList.toggle("act", n > 0); host.querySelector(".cf-n").textContent = n || "";
  }
  document.addEventListener("click", cfClose);
  addEventListener("keydown", e => { if (e.key === "Escape") cfClose(); });
  function cfWrap(orig, specOf, apply, labelOf) {
    return function (el, ...rest) {
      if (!el || !el.isConnected) return orig(el, ...rest);
      let spec; try { spec = specOf(...rest); } catch (e) { spec = []; }
      if (!spec.length) return orig(el, ...rest);
      const key = cfKey(el, labelOf && labelOf(...rest));
      const f = CF.get(key) || {}; CF.set(key, f);
      const draw = () => { const a = apply(f, spec, ...rest); const out = a ? orig(el, ...a) : cfNone(el); cfButton(el, spec, f, draw); return out; };
      return draw();
    };
  }
  const setOf = (f, id) => f[id] || new Set();
  // x axis: months get a from/to range, other categories get tick boxes; series get tick boxes
  const axisSpec = (cats, series, xf) => {
    const s = [];
    if (isMonth(cats)) s.push({ type: "range", label: "Months", items: cats.map(k => ({ k, t: xf ? xf(k) : keyTxt(k) })) });
    else if (cats.length > 2) s.push({ type: "set", id: "cats", label: "Categories", items: cats.map(k => ({ k, t: xf ? String(xf(k)) : keyTxt(k) })) });
    if (series.length > 1) s.push({ type: "set", id: "ser", label: "Series", items: series.map(x => ({ k: x.name, t: x.name, c: x.c })) });
    return s;
  };
  const axisIdx = (f, spec, cats) => {
    const r = spec.find(c => c.type === "range");
    if (r) { const [a, b] = cfRange(r, f); return cats.map((_, i) => i).filter(i => i >= a && i <= b); }
    const off = setOf(f, "cats"); return cats.map((_, i) => i).filter(i => !off.has(cats[i]));
  };
  vbars = cfWrap(vbars, (cats, series, opt = {}) => axisSpec(cats, series, opt.xf), (f, spec, cats, series, opt = {}) => {
    const idx = axisIdx(f, spec, cats), off = setOf(f, "ser"), si = series.map((_, i) => i).filter(i => !off.has(series[i].name));
    if (!idx.length || !si.length) return null;
    const ser = si.map(i => { const s = series[i]; return { ...s, v: idx.map(j => s.v[j]), colorAt: s.colorAt && (k => s.colorAt(idx[k])), opAt: s.opAt && (k => s.opAt(idx[k])) }; });
    return [idx.map(i => cats[i]), ser, { ...opt, extra: opt.extra && ((k, s) => opt.extra(idx[k], si[s])), labels: opt.labels && ((v, k, s) => opt.labels(v, idx[k], si[s])) }];
  }, (c, s, o = {}) => o.label);
  lineChart = cfWrap(lineChart, (series, xs, opt = {}) => axisSpec(xs, series, opt.xf), (f, spec, series, xs, opt = {}) => {
    const idx = axisIdx(f, spec, xs), off = setOf(f, "ser"), ser = series.filter(s => !off.has(s.name));
    if (!idx.length || !ser.length) return null;
    return [ser.map(s => ({ ...s, v: idx.map(j => s.v[j]) })), idx.map(i => xs[i]), { ...opt, extra: opt.extra && (k => opt.extra(idx[k])) }];
  }, (s, x, o = {}) => o.label);
  donut = cfWrap(donut, items => (items.filter(d => d.v > 0).length > 1 ? [{ type: "set", id: "it", label: "Slices", items: items.map(d => ({ k: d.k, t: d.k, c: d.c })) }] : []), (f, spec, items, center, opt = {}) => {
    const off = setOf(f, "it"), keep = items.filter(d => !off.has(d.k));
    if (!keep.some(d => d.v > 0)) return null;
    const n = items.length - keep.length;
    return [keep, n ? { ...center, sub: `${center.sub || ""}${center.sub ? " · " : ""}${keep.length} of ${items.length}` } : center, opt];
  }, (i, c, o = {}) => o.label);
  stack100 = cfWrap(stack100, (rows, keys, colors) => {
    const s = [];
    if (rows.length > 2) s.push({ type: "set", id: "rows", label: "Rows", items: rows.map(r => ({ k: r.name, t: r.name })) });
    if (keys.length > 2) s.push({ type: "set", id: "keys", label: "Segments (shares re-based to what you keep)", items: keys.map((k, j) => ({ k, t: k, c: colors[j] })) });
    return s;
  }, (f, spec, rows, keys, colors, opt = {}) => {
    const ro = setOf(f, "rows"), ko = setOf(f, "keys"), kj = keys.map((_, j) => j).filter(j => !ko.has(keys[j])), rr = rows.filter(r => !ro.has(r.name));
    if (!kj.length || !rr.length) return null;
    return [rr, kj.map(j => keys[j]), kj.map(j => colors[j]), opt];
  }, (r, k, c, o = {}) => o.label);
  dumbbell = cfWrap(dumbbell, rows => (rows.length > 1 ? [
    ...(rows.length > 2 ? [{ type: "set", id: "rows", label: "Rows", items: rows.map(r => ({ k: r.k, t: r.k })) }] : []),
    { type: "sort", id: "sort", label: "Order", def: "orig", options: [["orig", "As designed"], ["hi", "Highest first"], ["lo", "Lowest first"], ["gap", "Biggest gap first"]] }] : []), (f, spec, rows, opt = {}) => {
    const off = setOf(f, "rows"); let r = rows.filter(x => !off.has(x.k));
    if (!r.length) return null;
    const v = x => (x.a === null ? -Infinity : x.a), g = x => (x.a === null || x.b === null ? -Infinity : Math.abs(x.a - x.b));
    if (f.sort === "hi") r = [...r].sort((p, q) => v(q) - v(p)); else if (f.sort === "lo") r = [...r].sort((p, q) => (v(p) === -Infinity) - (v(q) === -Infinity) || v(p) - v(q)); else if (f.sort === "gap") r = [...r].sort((p, q) => g(q) - g(p));
    return [r, opt];
  }, (r, o = {}) => o.label);
  renderPareto = cfWrap(renderPareto, rows => (rows.filter(r => r[1] > 0).length > 2 ? [
    { type: "set", id: "it", label: "Reasons", items: rows.filter(r => r[1] > 0).map(r => ({ k: r[0], t: r[0] })) },
    { type: "sort", id: "top", label: "Show", def: "all", options: [["all", "All reasons"], ["3", "Top 3"], ["5", "Top 5"], ["8", "Top 8"]] }] : []), (f, spec, rows, what) => {
    const off = setOf(f, "it"); let r = rows.filter(x => !off.has(x[0]));
    if (!r.some(x => x[1] > 0)) return null;
    if (f.top && f.top !== "all") r = [...r].sort((a, b) => b[1] - a[1]).slice(0, +f.top);
    return [r, what];
  }, (r, w) => "pareto-" + w);
  heatTable = cfWrap(heatTable, (rows, headers) => (rows.length > 2 ? [
    { type: "set", id: "rows", label: "Rows", items: rows.map(r => ({ k: r.name, t: r.name })) },
    { type: "sort", id: "sort", label: "Sort by", def: "orig", options: [["orig", "As designed"], ...headers.map((h, j) => [String(j), h + " (high → low)"])] },
    { type: "sort", id: "top", label: "Show", def: "all", options: [["all", "All rows"], ["5", "Top 5"], ["10", "Top 10"], ["15", "Top 15"]] }] : []), (f, spec, rows, headers, opt) => {
    const off = setOf(f, "rows"); let r = rows.filter(x => x.me || !off.has(x.name));
    if (!r.length) return null;
    if (f.sort && f.sort !== "orig") { const j = +f.sort, val = x => { const v = j < x.vals.length ? x.vals[j] : x.health; return v === null || v === undefined ? -Infinity : v; }; r = [...r].sort((a, b) => val(b) - val(a)); }
    if (f.top && f.top !== "all") r = r.slice(0, +f.top);
    return [r, headers, opt];
  }, (r, h) => "heat-" + h.join("/"));
  // bespoke charts
  sanctionClock = cfWrap(sanctionClock, () => [{ type: "range", label: "Months", items: X.FULL.map(k => ({ k, t: MON(k) })) }], (f, spec, b, P, opt = {}) => {
    const [a, z] = cfRange(spec[0], f), xs = X.FULL.slice(a, z + 1);
    return xs.length < 2 ? null : [b, P, { ...opt, xs }];
  }, () => "clock");
  const pillarSet = (w) => ({ type: "set", id: "pil", label: "Pillars", items: PILLARS.filter(p => (w ? p.w : p.id !== "market")).map(p => ({ k: p.id, t: p.name, c: PILC[p.id] })) });
  stream = cfWrap(stream, b => [{ type: "range", label: "Months", items: X.FULL.map(k => ({ k, t: MON(k) })) },
    { type: "set", id: "fam", label: "Products", items: CORE.filter(f => sum(X.FULL, m => b["cfm_" + f + "|" + m] || 0) > 0.01).map(f => ({ k: f, t: FAM[f], c: FAMC[f] })) }], (f, spec, b, opt = {}) => {
    const r = spec[0], [a, z] = cfRange(r, f), xs = X.FULL.slice(a, z + 1), hide = setOf(f, "fam");
    if (xs.length < 2 || spec[1].items.every(it => hide.has(it.k))) return null;
    return [b, { ...opt, xs, hide }];
  }, () => "stream");
  rose = cfWrap(rose, () => [pillarSet(false)], (f, spec, a, opt = {}) => {
    const hide = setOf(f, "pil"); if (spec[0].items.every(it => hide.has(it.k))) return null;
    return [a, { ...opt, hide }];
  }, (a, o = {}) => (o.b ? "rose-ab" : "rose"));
  violins = cfWrap(violins, (b, P) => [pillarSet(true), { type: "sort", id: "pool", label: "Distribution drawn from", def: "all", options: [["all", "All branches"], ["zone", `${b.zone} zone`], ["state", b.state], ["peers", P.name]] }], (f, spec, b, P, opt = {}) => {
    const hide = setOf(f, "pil"); if (spec[0].items.every(it => hide.has(it.k))) return null;
    const pool = { zone: E.filter(e => e.zone === b.zone), state: E.filter(e => e.state === b.state), peers: [...P.list, b] }[f.pool] || E;
    return [b, P, { ...opt, hide, pool, poolName: { zone: b.zone + " zone", state: b.state, peers: P.name }[f.pool] || "network" }];
  }, () => "violins");
  waterfall = cfWrap(waterfall, steps => (steps.filter(s => !s.total).length > 1 ? [{ type: "set", id: "st", label: "Steps", items: steps.filter(s => !s.total).map(s => ({ k: s.k, t: s.k, c: s.c })) }] : []), (f, spec, steps, opt = {}) => {
    const off = setOf(f, "st"); return [steps.filter(s => s.total || !off.has(s.k)), off.size ? { ...opt, anim: false } : opt];
  }, (s, o = {}) => o.label);

  // mobile shell: slide-in menu + bottom tab bar
  $("#menuBtn").onclick = () => document.body.classList.toggle("nav-open");
  $("#sideScrim").onclick = () => document.body.classList.remove("nav-open");
  const TABS = [["home", "Home", () => "#/", v => v === "landing"], ["list", "Branches", () => (state.id ? `#/b/${encodeURIComponent(state.id)}/${state.sec || "overview"}` : "#/pick"), v => v === "branch" || v === "pick"],
    ["compare", "Compare", () => cHash(state.ca || state.id, state.cb, "summary"), v => v === "compare"], ["opps", "Money", () => "#/opps", v => v === "opps"], ["ask", "Ask", () => "#/ask", v => v === "ask"]];
  function renderTabs() { $("#tabbar").innerHTML = TABS.map(([ic, n, h, on]) => `<a href="${h()}" class="${on(state.view) ? "on" : ""}">${icon(ic)}<span>${n}</span></a>`).join(""); }
  const _nav7 = renderNav;
  renderNav = function () { _nav7(); renderTabs(); };

  // ------------------------------------------------------------------ router
  function render() {
    renderNav();
    if (state.view === "landing") { document.title = "One Vision Dashboard"; renderLanding(); }
    else if (state.view === "pick") { document.title = "Choose a branch · One Vision"; renderPick(); }
    else if (state.view === "compare") renderCompare();
    else if (state.view === "opps") renderOpps();
    else if (state.view === "ask") renderAsk();
    else renderBranch();
    animate($("#view")); motion($("#view"));
  }
  function route() {
    const h = location.hash || "#/"; let m, v = "landing", id = state.id, sec = state.sec;
    let ca = state.ca, cb = state.cb, csec = state.csec;
    if ((m = h.match(/^#\/b\/([^/]+)(?:\/([a-z]+))?$/))) { v = "branch"; id = decodeURIComponent(m[1]); sec = SECS.some(s => s.id === m[2]) ? m[2] : "overview"; }
    else if ((m = h.match(/^#\/c(?:\/([^/]*))?(?:\/([^/]*))?(?:\/([a-z]+))?$/))) {
      v = "compare"; const d = x => (x && x !== "-" ? decodeURIComponent(x) : null);
      ca = d(m[1]); cb = d(m[2]); csec = CSECS.some(s => s.id === m[3]) ? m[3] : "summary";
      if (!m[1] && state.id) ca = state.id;
    }
    else if (h.startsWith("#/pick")) v = "pick";
    else if (h.startsWith("#/opps")) v = "opps";
    else if ((m = h.match(/^#\/ask(?:\?q=(.*))?$/))) { v = "ask"; if (m[1]) state.ask = decodeURIComponent(m[1]); }
    const changed = v !== state.view || id !== state.id || sec !== state.sec || ca !== state.ca || cb !== state.cb || csec !== state.csec;
    Object.assign(state, { view: v, id, sec, ca, cb, csec });
    render();
    if (changed) window.scrollTo(0, 0);
  }
  searchBox($("#topSearch"), $("#topSugg"));
  addEventListener("hashchange", route);
  let rtm; addEventListener("resize", () => { clearTimeout(rtm); rtm = setTimeout(() => { const y = scrollY; render(); scrollTo(0, y); }, 200); });
  route();
})();

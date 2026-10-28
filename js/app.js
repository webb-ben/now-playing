import { setToken, getUser, getFolders, getCollection, getRelease, getMaster } from "./discogs.js";
import { fromDiscogsList, fromText, key } from "./records.js";
import { yearOf, decade, fmtMain, labels, matches, tally, byName, sortRecords, search, pairs, baseTitle } from "./explore.js";
import { read, store, setCollection, readC, storeC, cache } from "./store.js";
import { fetchWiki } from "./wiki.js";

const $ = id => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const fmtDate = t => { try { return new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); } catch (e) { return ""; } };
const CSV = "#csv";

/* ---------- Theme ---------- */
function curTheme() {
  const t = document.documentElement.getAttribute("data-theme");
  if (t === "dark" || t === "light") return t;
  return (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
}
function paintTheme() {
  const d = curTheme() === "dark", b = $("themeBtn");
  b.textContent = d ? "☀️" : "\u{1F319}";
  b.setAttribute("aria-pressed", d ? "true" : "false");
  b.title = d ? "Switch to light mode" : "Switch to dark mode";
}
$("themeBtn").onclick = () => {
  const n = curTheme() === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", n);
  store("np:theme", n);
  paintTheme();
};
paintTheme();

/* ---------- State ---------- */
let records = [], byKey = {}, FOLDERS = {}, collection = "";
let PLAYS = {}, FAVS = {}, QUEUE = [], HIST = [], nowKey = "", pvKey = "", seen = {}, keepScroll = false, listCap = 200;
const MASTERS = read("np:masters") || {};          // master id -> original release year (0 when Discogs has none)
const DETAILS = cache("releases", 400);            // release id -> tracklist, videos, community stats
const WIKI = cache("wiki", 400);                   // record key -> Wikipedia intro
const FILTERS = { fArtist: "artist", fFormat: "format", fGenre: "genre", fStyle: "style", fLabel: "label", fDecade: "decade", fFolder: "folder" };

function recByKey(k) { return byKey[k] || null; }
function applyMasters() { records.forEach(r => { if (r.masterId && MASTERS[r.masterId]) r.origYear = MASTERS[r.masterId]; }); }

/* ---------- Loading a collection ---------- */
let ctl = null;
function busyUI(on) {
  $("loadUser").disabled = on; $("cancel").hidden = !on; $("progress").hidden = !on;
  if (on) $("progressBar").style.width = "0";
  $("refresh").hidden = on || !collection || collection === CSV;
}
function progress(n, total) {
  $("progressBar").style.width = (total ? Math.round(100 * n / total) : 0) + "%";
  $("status").textContent = "Loading records… " + n + (total ? " of " + total : "");
}
/* Accept a bare username or a pasted discogs.com/user/<name> link */
function parseUser(s) {
  s = (s || "").trim().replace(/^@/, "");
  const m = /discogs\.com\/(?:[a-z]{2}\/)?user\/([^/?#]+)/i.exec(s);
  return m ? decodeURIComponent(m[1]) : s;
}
function setUrlUser(name) {
  try {
    const u = new URL(location.href);
    if (name) u.searchParams.set("user", name); else u.searchParams.delete("user");
    history.replaceState(null, "", u);
  } catch (e) {}
}
function showUser(u) {
  $("userInfo").hidden = !u;
  if (!u) return;
  $("avatar").src = u.avatar || ""; $("avatar").hidden = !u.avatar;
  $("userLink").textContent = u.name ? u.name + " (" + u.username + ")" : u.username;
  $("userLink").href = u.uri || "https://www.discogs.com/user/" + encodeURIComponent(u.username);
  $("userMeta").textContent = [u.location, u.num_collection != null ? u.num_collection + " in collection" : "",
    u.num_wantlist ? u.num_wantlist + " on wantlist" : ""].filter(Boolean).join(" · ");
}

async function loadUser(input, force) {
  const name = parseUser(input);
  if (!name) { $("username").focus(); return; }
  if (ctl) ctl.abort();
  const my = ctl = new AbortController();
  setToken($("token").value);
  $("username").value = name;
  const cached = read("np:" + name.toLowerCase() + ":collection");
  if (cached && cached.records && !force) {
    useCollection(name, cached);
    $("status").textContent = cached.records.length + " records · saved in this browser " + fmtDate(cached.fetched) + ". Refresh to update.";
    ctl = null;
    return;
  }
  busyUI(true);
  $("status").textContent = "Looking up " + name + "…";
  try {
    const u = await getUser(name, my.signal);
    showUser(u);
    const items = await getCollection(u.username, { onProgress: progress, signal: my.signal });
    const folders = await getFolders(u.username, my.signal);
    const data = {
      fetched: Date.now(),
      user: { username: u.username, name: u.name, avatar: u.avatar_url, uri: u.uri, location: u.location, num_collection: u.num_collection, num_wantlist: u.num_wantlist },
      folders: folders.filter(f => f.id !== 0).map(f => [String(f.id), f.name]),
      records: fromDiscogsList(items)
    };
    if (!store("np:" + u.username.toLowerCase() + ":collection", data)) console.warn("Collection too large to save in this browser");
    useCollection(u.username, data);
    if (!data.records.length) $("status").textContent = u.username + "’s collection is empty.";
  } catch (e) {
    if (e.name === "AbortError") return;
    $("status").textContent = e.message || "Couldn’t reach Discogs. Check your connection and try again.";
  } finally {
    if (ctl === my) { ctl = null; busyUI(false); }
  }
}

function useCollection(name, data) {
  collection = name === CSV ? CSV : name;
  setCollection(collection);
  store("np:last", collection);
  setUrlUser(collection === CSV ? "" : collection);
  showUser(data.user);
  FOLDERS = {}; (data.folders || []).forEach(f => { FOLDERS[f[0]] = f[1]; });
  PLAYS = readC("plays") || {}; FAVS = readC("favs") || {}; QUEUE = readC("queue") || []; HIST = readC("hist") || [];
  nowKey = readC("now") || ""; pvKey = ""; seen = {};
  Object.keys(FILTERS).forEach(id => { $(id).value = ""; });
  $("favOnly").checked = false; $("mSearch").value = "";
  busyUI(false);
  setRecords(data.records || []);
  renderQueue(); renderHist(); renderPreview();
  const r = nowRec(); if (r) loadExtras(r);
}

$("userForm").onsubmit = e => { e.preventDefault(); loadUser($("username").value, false); };
$("refresh").onclick = () => loadUser(collection, true);
$("cancel").onclick = () => { if (ctl) ctl.abort(); ctl = null; busyUI(false); $("status").textContent = "Stopped."; };
$("token").value = read("np:token") || "";
$("token").onchange = () => { store("np:token", $("token").value.trim()); setToken($("token").value); };

/* ---------- Filters ---------- */
function fill(sel, rows, all) {
  const cur = sel.value;
  sel.innerHTML = "";
  const o = el("option", null, all); o.value = ""; sel.appendChild(o);
  rows.forEach(([v, n, text]) => { const op = el("option", null, (text || v) + " (" + n + ")"); op.value = v; sel.appendChild(op); });
  sel.value = cur; if (sel.value !== cur) sel.value = "";
}
function fillFilters() {
  const alpha = rows => rows.sort((a, b) => byName(a[0], b[0]));
  fill($("fArtist"), alpha(tally(records, r => r.artist)), "Any artist");
  fill($("fFormat"), tally(records, fmtMain), "Any format");
  fill($("fGenre"), alpha(tally(records, r => r.genres)), "Any genre");
  fill($("fStyle"), alpha(tally(records, r => r.styles)), "Any style");
  fill($("fLabel"), alpha(tally(records, labels)), "Any label");
  fill($("fDecade"), tally(records, r => decade(yearOf(r))).sort((a, b) => a[0] < b[0] ? -1 : 1), "Any decade");
  const fr = tally(records, r => r.folder).filter(x => FOLDERS[x[0]] || collection === CSV).map(x => [x[0], x[1], FOLDERS[x[0]] || x[0]]);
  fill($("fFolder"), fr, "Any folder");
  $("folderWrap").hidden = fr.length < 2;
}
function filterState() {
  const f = { favOnly: $("favOnly").checked };
  Object.keys(FILTERS).forEach(id => { f[FILTERS[id]] = $(id).value; });
  return f;
}
function pool() { const f = filterState(); return records.filter(r => matches(r, f, FAVS)); }

function setRecords(list) {
  records = list; byKey = {};
  list.forEach(r => { byKey[key(r)] = r; });
  applyMasters();
  fillFilters();
  const has = list.length > 0;
  $("filters").hidden = !has; $("statsCard").hidden = !has;
  if (has) $("status").textContent = list.length + " records loaded.";
  renderNow();
  updatePool();
}

function updatePool() {
  const p = pool(), f = filterState();
  const any = Object.keys(f).some(k => f[k]);
  $("clearFilters").hidden = !any;
  $("filtHead").textContent = "Filters" + (any ? " (" + p.length + " of " + records.length + ")" : "");
  $("pool").textContent = p.length + " record" + (p.length === 1 ? "" : "s") + " match your filters.";
  $("pick").disabled = p.length === 0;
  renderList(p);
  renderStats(p);
}
Object.keys(FILTERS).forEach(id => { $(id).onchange = () => { seen = {}; listCap = 200; updatePool(); }; });
$("favOnly").onchange = () => { seen = {}; updatePool(); };
$("clearFilters").onclick = () => {
  Object.keys(FILTERS).forEach(id => { $(id).value = ""; });
  $("favOnly").checked = false; seen = {}; updatePool();
};

/* ---------- Explore: what the current filtered set is made of. Clicking a bar sets that filter ---------- */
function renderStats(p) {
  const box = $("stats"); box.innerHTML = "";
  $("statsHead").textContent = "Explore " + (p.length === records.length ? "the collection" : "these " + p.length + " records");
  const sections = [
    ["Genres", "fGenre", tally(p, r => r.genres).slice(0, 8)],
    ["Styles", "fStyle", tally(p, r => r.styles).slice(0, 10)],
    ["Decades", "fDecade", tally(p, r => decade(yearOf(r))).sort((a, b) => a[0] < b[0] ? -1 : 1)],
    ["Artists", "fArtist", tally(p, r => r.artist).slice(0, 8)],
    ["Labels", "fLabel", tally(p, labels).slice(0, 8)],
    ["Formats", "fFormat", tally(p, fmtMain).slice(0, 6)]
  ];
  sections.forEach(([name, id, rows]) => {
    if (!rows.length || (rows.length === 1 && $(id).value)) return;
    const sec = el("div"), max = Math.max(...rows.map(x => x[1]));
    sec.appendChild(el("h3", null, name));
    rows.forEach(([v, n]) => {
      const b = el("button", "bar"); b.type = "button";
      b.title = "Filter: " + v;
      const t = el("span", "bt"), i = el("i"); i.style.width = Math.max(4, Math.round(100 * n / max)) + "%"; t.appendChild(i);
      b.appendChild(el("span", "bn", v)); b.appendChild(t); b.appendChild(el("span", "bc", String(n)));
      b.onclick = () => { $(id).value = v; seen = {}; listCap = 200; updatePool(); };
      sec.appendChild(b);
    });
    box.appendChild(sec);
  });
  renderYearsNote();
}

/* Discogs gives each item the year of that pressing. The original year lives on the master release,
   which takes one request per record, so it is looked up on demand and remembered. */
let yearsCtl = null;
function missingYears() { return records.filter(r => r.masterId && MASTERS[r.masterId] === undefined); }
function renderYearsNote() {
  const m = missingYears(), b = $("yearsBtn");
  if (yearsCtl) return;
  b.hidden = !m.length; b.textContent = "Look up original years";
  $("yearsNote").textContent = m.length
    ? "Decades use the pressing year for " + m.length + " record" + (m.length === 1 ? "" : "s") + ". Looking up original years takes about " + Math.max(1, Math.ceil(m.length / (read("np:token") ? 58 : 23))) + " min."
    : "";
}
$("yearsBtn").onclick = async () => {
  if (yearsCtl) { yearsCtl.abort(); return; }
  const my = yearsCtl = new AbortController(), todo = missingYears(), ids = Array.from(new Set(todo.map(r => r.masterId)));
  $("yearsBtn").textContent = "Stop";
  let done = 0;
  try {
    for (const id of ids) {
      if (MASTERS[id] !== undefined) { done++; continue; }
      $("yearsNote").textContent = "Looking up original years… " + done + " of " + ids.length;
      try { MASTERS[id] = (await getMaster(id, my.signal)).year || 0; }
      catch (e) { if (e.name === "AbortError") break; if (e.status === 404) MASTERS[id] = 0; else throw e; }
      done++;
      if (done % 5 === 0) store("np:masters", MASTERS);
    }
  } catch (e) {
    $("yearsNote").textContent = e.message || "Couldn’t reach Discogs.";
  } finally {
    store("np:masters", MASTERS);
    yearsCtl = null;
    applyMasters(); fillFilters(); keepScroll = true; updatePool(); renderNow(); renderPreview();
  }
};

/* ---------- Covers ---------- */
function hue(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h; }
/* Emoji thumbnails for records without cover art (mostly CSV imports): first matching keyword in the title wins */
const ICONS = [
  [/dragon/i, "🐉"], [/wave|ocean/i, "🌊"], [/water|\brain\b/i, "💧"], [/rainbow/i, "🌈"], [/fireworks/i, "🎆"],
  [/\bsun\b|sunshine|summer/i, "☀️"], [/\bmoon|midnight|\bnight/i, "🌙"], [/dream/i, "💭"], [/mountain/i, "🏔️"],
  [/island|isles/i, "🏝️"], [/snow|winter/i, "❄️"], [/storm|thunder/i, "⛈️"], [/forest|\btrees?\b|wood/i, "🌲"],
  [/bloom|flower|garden/i, "🌸"], [/cherry/i, "🍒"], [/honey/i, "🍯"], [/champagne/i, "🍾"], [/wine/i, "🍷"],
  [/fever|\bhott?\b|\bfire\b/i, "🔥"], [/heaven/i, "☁️"], [/prayer/i, "🙏"], [/spell|magic/i, "🔮"], [/\bbirds?\b|\bwings?\b/i, "🐦"],
  [/diamond/i, "💎"], [/\bstars?\b/i, "⭐"], [/space|planet|galaxy/i, "🪐"], [/ghost/i, "👻"], [/electr|spark|lightning/i, "⚡"],
  [/love|heart|sweet|kiss/i, "❤️"], [/crash/i, "💥"], [/circle/i, "⭕"], [/gold/i, "🥇"], [/silver/i, "🥈"], [/\bblue\b/i, "🔵"],
  [/radio/i, "📻"], [/city/i, "🏙️"], [/road|highway/i, "🛣️"], [/train/i, "🚆"], [/piano/i, "🎹"], [/blues|jazz/i, "🎷"],
  [/dance|tango|funk|disco/i, "🪩"], [/metal/i, "🤘"], [/music\b|melody|\bsongs?\b|ballad|\blive\b|sessions?\b/i, "🎶"]
];
const FALLBACK = ["🎵", "💿", "🎶", "🎧", "🎼", "🥁", "📀", "🎤", "🎸", "🎹"];
function icon(r) {
  const t = r.title || "";
  for (const [re, ic] of ICONS) if (re.test(t)) return ic;
  return FALLBACK[hue((r.artist || "") + "|" + t) % FALLBACK.length];
}
function cover(r, big) {
  const d = el("div", "cover" + (big ? " big" : "")), h = hue(r.artist + "|" + r.title);
  d.setAttribute("aria-hidden", "true");
  d.style.background = "linear-gradient(135deg,hsl(" + h + ",55%,42%),hsl(" + ((h + 50) % 360) + ",60%,28%))";
  const src = big ? (r.cover || r.thumb) : r.thumb;
  if (src) {
    const im = el("img"); im.alt = ""; im.loading = "lazy"; im.referrerPolicy = "no-referrer"; im.src = src;
    im.style.cssText = "width:100%;height:100%;object-fit:cover;border-radius:inherit";
    im.onerror = () => { d.textContent = icon(r); };
    d.appendChild(im);
  } else d.textContent = icon(r);
  return d;
}
/* Spinning record for Now playing / Preview; the center label is the cover art when there is one */
function nowDisc(r, still) {
  const h = hue((r.artist || "") + "|" + r.title);
  const w = el("div", "vwrap" + (still ? " still" : "")); w.setAttribute("aria-hidden", "true");
  const v = el("div", "vinyl"), l = el("div", "vlabel");
  l.style.background = "linear-gradient(135deg,hsl(" + h + ",60%,52%),hsl(" + ((h + 50) % 360) + ",65%,32%))";
  const src = r.thumb || r.cover;
  if (src) { l.className += " img"; l.style.backgroundImage = "url(" + JSON.stringify(src) + ")"; }
  v.appendChild(l); w.appendChild(v); w.appendChild(el("div", "vsheen"));
  return w;
}

/* ---------- Queue ---------- */
function inQueue(r) { return QUEUE.indexOf(key(r)) > -1; }
function paintQBtn(b, r) {
  const q = inQueue(r);
  b.textContent = q ? "✓ Queued" : "＋ Queue";
  b.setAttribute("aria-pressed", q ? "true" : "false");
  b.title = q ? "Remove from queue" : "Add to queue";
  b.setAttribute("aria-label", (q ? "Remove from queue: " : "Add to queue: ") + r.title);
}
function queueBtn(r) {
  const b = el("button", "btn ghost qbtn"); b.type = "button";
  paintQBtn(b, r);
  b.onclick = () => toggleQueue(r);
  return b;
}
function qChanged() {
  storeC("queue", QUEUE); renderQueue(); keepScroll = true; updatePool();
  const r = nowRec(); if (r) renderPairs(r, NP);
  const pr = pvRec(); if (pr) { renderPairs(pr, PV); paintQBtn($("pvQueue"), pr); }
}
function toggleQueue(r) {
  const k = key(r), i = QUEUE.indexOf(k);
  if (i > -1) QUEUE.splice(i, 1); else if (QUEUE.length < 50) QUEUE.push(k);
  qChanged();
}
function playNext() {
  while (QUEUE.length) {
    const r = recByKey(QUEUE[0]);
    if (r) { setNow(r); return; }
    QUEUE.shift();
  }
  qChanged();
}
function renderQueue() {
  const pruned = QUEUE.filter(k => recByKey(k));
  if (pruned.length !== QUEUE.length) { QUEUE = pruned; storeC("queue", QUEUE); }
  $("qCard").hidden = !QUEUE.length;
  $("qHead").textContent = "Up next (" + QUEUE.length + ")";
  const nb = $("npNext"); nb.hidden = !QUEUE.length;
  if (QUEUE.length) { const n0 = recByKey(QUEUE[0]); nb.title = n0 ? "Next: " + n0.title : ""; }
  const ul = $("qList"); ul.innerHTML = "";
  QUEUE.forEach((k, i) => {
    const r = recByKey(k); if (!r) return;
    const li = el("li", "qrow"), box = el("div", "mi"), acts = el("div", "qacts");
    box.appendChild(el("div", "mt", r.title));
    box.appendChild(el("div", "ma", [r.artist, yearOf(r)].filter(Boolean).join(" · ")));
    const mk = (txt, label, fn, dis) => { const b = el("button", "btn ghost", txt); b.type = "button"; b.setAttribute("aria-label", label + ": " + r.title); b.title = label; b.disabled = !!dis; b.onclick = fn; return b; };
    acts.appendChild(mk("↑", "Move up", () => { QUEUE.splice(i, 1); QUEUE.splice(i - 1, 0, k); qChanged(); }, i === 0));
    acts.appendChild(mk("▶", "Play now", () => setNow(r)));
    acts.appendChild(mk("✕", "Remove from queue", () => { QUEUE.splice(i, 1); qChanged(); }));
    li.appendChild(el("div", "qn", String(i + 1))); li.appendChild(box); li.appendChild(acts); ul.appendChild(li);
  });
}
$("qClear").onclick = () => { QUEUE = []; qChanged(); };
$("npNext").onclick = playNext;

/* ---------- Now playing and Preview share one card layout ---------- */
function nowRec() { return nowKey ? recByKey(nowKey) : null; }
function pvRec() { return pvKey ? recByKey(pvKey) : null; }
const NP = { p: "np", k: () => nowKey, rec: nowRec };
const PV = { p: "pv", k: () => pvKey, rec: pvRec };

function setNow(r) {
  const k0 = key(r), changed = k0 !== nowKey;
  nowKey = k0; storeC("now", nowKey);
  if (changed) addSpin(k0);
  const qi = QUEUE.indexOf(k0); if (qi > -1) { QUEUE.splice(qi, 1); storeC("queue", QUEUE); renderQueue(); }
  if (pvKey === k0) pvKey = "";
  loadExtras(r);
  renderNow(); renderPreview(); keepScroll = true; updatePool();
  try { $("npCard").scrollIntoView({ behavior: "smooth", block: "nearest" }); } catch (e) {}
}
$("npStop").onclick = () => { nowKey = ""; storeC("now", ""); renderNow(); keepScroll = true; updatePool(); };

/* Spin counter and favorites (kept in this browser, per collection) */
function addSpin(k) {
  const o = PLAYS[k] || { n: 0, last: 0, prev: 0 };
  PLAYS[k] = { n: o.n + 1, last: Date.now(), prev: o.last || 0 }; storeC("plays", PLAYS);
}
$("npUndo").onclick = () => {
  const o = PLAYS[nowKey]; if (!o || !o.n) return;
  PLAYS[nowKey] = { n: o.n - 1, last: o.prev || 0, prev: 0 }; storeC("plays", PLAYS);
  renderSpins(NP); renderSpins(PV); renderTop();
};
function renderSpins(V) {
  const vk = V.k(); if (!vk) return;
  const o = PLAYS[vk], n = o ? o.n : 0, s = $(V.p + "Spins");
  if (!n) s.textContent = "Not spun yet";
  else { const d = fmtDate(o.last); s.textContent = "Spun " + n + (n === 1 ? " time" : " times") + (d ? " · last " + d : ""); }
  const ub = $(V.p + "Undo"); if (ub) ub.hidden = !n;
  const f = !!FAVS[vk], b = $(V.p + "Fav");
  b.textContent = f ? "★ Favorited" : "☆ Favorite"; b.setAttribute("aria-pressed", f ? "true" : "false");
}
function toggleFav(V) {
  const k = V.k(); if (!k) return;
  if (FAVS[k]) delete FAVS[k]; else FAVS[k] = 1;
  storeC("favs", FAVS); renderSpins(NP); renderSpins(PV); renderTop(); keepScroll = true; updatePool();
}

/* Release details (tracklist, videos, community numbers) and the master's original year, fetched when a record is shown */
const detailBusy = {}, webBusy = {};
function loadExtras(r) { loadDetails(r); loadWeb(r); }
function refresh(k) { if (nowKey === k) renderNow(); if (pvKey === k) renderPreview(); }
async function loadDetails(r) {
  const k = key(r);
  if (!/^\d+$/.test(r.id) || DETAILS.get(r.id) || detailBusy[k]) return;
  detailBusy[k] = 1;
  try {
    const d = await getRelease(r.id), c = d.community || {}, rt = c.rating || {};
    DETAILS.set(r.id, {
      tracks: (d.tracklist || []).map(t => ({ p: t.position || "", t: t.title || "", d: t.duration || "", h: t.type_ === "heading" ? 1 : 0 })),
      videos: (d.videos || []).filter(v => /youtu/.test(v.uri || "")).slice(0, 3).map(v => ({ u: v.uri, t: v.title })),
      have: c.have || 0, want: c.want || 0, avg: rt.average || 0, cnt: rt.count || 0,
      country: d.country || "", released: d.released_formatted || ""
    });
    const mid = r.masterId || d.master_id;
    if (mid && MASTERS[mid] === undefined) {
      try { MASTERS[mid] = (await getMaster(mid)).year || 0; } catch (e) { if (e.status === 404) MASTERS[mid] = 0; }
      store("np:masters", MASTERS);
      if (MASTERS[mid]) { r.masterId = mid; applyMasters(); }
    }
  } catch (e) {
    console.warn("Release details", r.id, e);
  } finally {
    delete detailBusy[k];
    refresh(k);
  }
}
async function loadWeb(r) {
  const k = key(r), w = WIKI.get(k);
  if (webBusy[k] || (w && w.done)) return;
  webBusy[k] = 1;
  try {
    const x = await fetchWiki(baseTitle(r.title), r.artist || "");
    WIKI.set(k, x ? { done: 1, extract: x.extract, url: x.url, wtitle: x.title } : { done: 1 });
  } catch (e) {} finally { delete webBusy[k]; refresh(k); }
}

function yearText(r) {
  if (r.origYear && r.year && r.origYear !== r.year) return r.origYear + " (this pressing " + r.year + ")";
  return yearOf(r) ? String(yearOf(r)) : "";
}
function genreLine(r) { return [r.genres.join(", "), r.styles.join(", ")].filter(Boolean).join(" · "); }
const yt = q => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);

function renderView(V) {
  const r = V.rec(), p = V.p;
  $(p + "Card").hidden = !r;
  if (!r) return;
  const k = key(r), det = /^\d+$/.test(r.id) ? DETAILS.get(r.id) : null;
  const box = $(p + "Art"); box.innerHTML = ""; box.appendChild(nowDisc(r, V === PV));
  $(p + "Title").textContent = r.title;
  $(p + "Artist").textContent = r.artist || "Unknown artist";
  $(p + "Meta").textContent = [yearText(r), fmtMain(r) || r.format, r.label, r.catno].filter(Boolean).join(" · ");
  $(p + "Vibe").textContent = genreLine(r);

  const L = $(p + "Links"); L.innerHTML = "";
  const links = [];
  if (/^\d+$/.test(r.id)) links.push(["Discogs", "https://www.discogs.com/release/" + r.id]);
  if (det && det.videos.length) links.push(["Watch on YouTube", det.videos[0].u]);
  else links.push(["Search YouTube", yt(r.artist + " " + baseTitle(r.title))]);
  links.push(["Apple Music", "https://music.apple.com/us/search?term=" + encodeURIComponent(r.artist + " " + baseTitle(r.title))]);
  links.push(["Wikipedia", "https://en.wikipedia.org/w/index.php?search=" + encodeURIComponent(r.artist + " " + baseTitle(r.title) + " album")]);
  links.forEach(([t, u]) => { const a = el("a", null, t); a.href = u; a.target = "_blank"; a.rel = "noopener"; L.appendChild(a); });

  $(p + "Community").textContent = det ? [
    det.cnt ? "★ " + det.avg.toFixed(2) + " from " + det.cnt.toLocaleString() + " rating" + (det.cnt === 1 ? "" : "s") : "",
    det.have ? det.have.toLocaleString() + " have" : "", det.want ? det.want.toLocaleString() + " want" : "",
    [det.country, det.released].filter(Boolean).join(", ")
  ].filter(Boolean).join(" · ") : (detailBusy[k] ? "Loading from Discogs…" : "");

  renderAbout(r, V);
  renderTracks(r, V, det);
  renderSpins(V);
  renderPairs(r, V);
}
function renderAbout(r, V) {
  const k = key(r), w = WIKI.get(k) || {}, T = $(V.p + "Text"), N = $(V.p + "Note");
  T.hidden = !w.extract; T.textContent = w.extract || "";
  N.innerHTML = "";
  if (w.extract) {
    N.appendChild(document.createTextNode("From "));
    const a = el("a", null, "Wikipedia: " + w.wtitle); a.href = w.url; a.target = "_blank"; a.rel = "noopener"; N.appendChild(a);
    N.appendChild(document.createTextNode(" (text under CC BY-SA 4.0)."));
  } else if (webBusy[k]) N.textContent = "Looking up Wikipedia…";
  N.hidden = !N.childNodes.length;
}
function renderTracks(r, V, det) {
  const box = $(V.p + "Tr"), ul = $(V.p + "TrList");
  ul.innerHTML = "";
  const list = det ? det.tracks : [];
  box.hidden = !list.length;
  $(V.p + "TrSum").textContent = "Tracklist" + (list.length ? " (" + list.filter(t => !t.h).length + ")" : "");
  list.forEach(t => {
    const li = el("li", t.h ? "head" : null);
    if (t.h) { li.textContent = t.t; ul.appendChild(li); return; }
    const a = el("a", null, t.t); a.href = yt((r.artist || "") + " " + t.t); a.target = "_blank"; a.rel = "noopener";
    a.title = "Search YouTube for this track";
    const tt = el("span", "tt"); tt.appendChild(a);
    li.appendChild(el("span", "pos", t.p)); li.appendChild(tt); li.appendChild(el("span", "dur", t.d));
    ul.appendChild(li);
  });
}
function renderPairs(r, V) {
  const box = $(V.p + "Pairs"), ul = $(V.p + "PairList"), note = $(V.p + "PairNote");
  ul.innerHTML = ""; box.hidden = false;
  const ps = pairs(records, r);
  $(V.p + "PairSum").textContent = "Pairs well with" + (ps.length ? " (" + ps.length + ")" : "");
  if (!ps.length) { note.textContent = "No close matches in this collection by style and year."; return; }
  note.textContent = "Other artists sharing styles or genres, favoring nearby years" + (yearOf(r) ? " (this one: " + yearOf(r) + ")" : "") + ".";
  ps.forEach(x => {
    const li = el("li"); li.style.cssText = "display:flex;gap:10px;align-items:center";
    const d = el("div", "mi");
    d.appendChild(el("div", "mt", x.r.title));
    d.appendChild(el("div", "ma", [x.r.artist, yearOf(x.r)].filter(Boolean).join(" · ")));
    d.appendChild(el("div", "mv", x.sh.join(", ") + (x.d === 0 ? " · same year" : x.d !== null ? " · " + x.d + " yr" + (x.d === 1 ? "" : "s") + " apart" : "")));
    li.appendChild(cover(x.r)); li.appendChild(d); li.appendChild(rowButtons(x.r));
    ul.appendChild(li);
  });
}
function rowButtons(r) {
  const rb = el("div", "rbtns");
  const pv = el("button", "btn ghost qbtn", key(r) === pvKey ? "Viewing" : "Preview"); pv.type = "button";
  pv.setAttribute("aria-label", "Preview " + r.title); pv.onclick = () => openPreview(r);
  const pb = el("button", "btn ghost qbtn", key(r) === nowKey ? "▶ Playing" : "▶ Play"); pb.type = "button";
  pb.setAttribute("aria-label", "Play " + r.title); pb.onclick = () => setNow(r);
  rb.appendChild(pv); rb.appendChild(pb); rb.appendChild(queueBtn(r));
  return rb;
}
function renderNow() { renderView(NP); renderTop(); }
function renderPreview() {
  renderView(PV);
  const r = pvRec(); if (!r) return;
  const playing = key(r) === nowKey, pb = $("pvPlay");
  pb.disabled = playing; pb.textContent = playing ? "▶ Playing" : "▶ Play this";
  paintQBtn($("pvQueue"), r);
}
function openPreview(r) {
  pvKey = key(r); loadExtras(r); renderPreview();
  keepScroll = true; updatePool();
  try { $("pvCard").scrollIntoView({ behavior: "smooth", block: "nearest" }); } catch (e) {}
}
$("pvPlay").onclick = () => { const r = pvRec(); if (r) setNow(r); };
$("pvQueue").onclick = () => { const r = pvRec(); if (r) toggleQueue(r); };
$("pvClose").onclick = () => { pvKey = ""; renderPreview(); keepScroll = true; updatePool(); };
[NP, PV].forEach(V => { $(V.p + "Fav").onclick = () => toggleFav(V); });

/* Most played: ranked by spin count, ties to the most recent spin */
function renderTop() {
  let rows = [];
  Object.keys(PLAYS).forEach(k => { const o = PLAYS[k], r = recByKey(k); if (o && o.n && r) rows.push({ r, n: o.n, last: o.last || 0 }); });
  rows.sort((a, b) => b.n - a.n || b.last - a.last);
  rows = rows.slice(0, 10);
  $("topCard").hidden = !rows.length;
  $("topHead").textContent = "Most played" + (rows.length ? " (top " + rows.length + ")" : "");
  const ul = $("topList"); ul.innerHTML = "";
  rows.forEach((x, i) => {
    const li = el("li", "qrow"), box = el("div", "mi");
    box.appendChild(el("div", "mt", (FAVS[key(x.r)] ? "★ " : "") + x.r.title));
    box.appendChild(el("div", "ma", [x.r.artist, yearOf(x.r)].filter(Boolean).join(" · ")));
    const d = fmtDate(x.last);
    box.appendChild(el("div", "mv", x.n + (x.n === 1 ? " spin" : " spins") + (d ? " · last " + d : "")));
    const b = el("button", "btn ghost qbtn", key(x.r) === nowKey ? "▶ Playing" : "▶ Play"); b.type = "button";
    b.setAttribute("aria-label", "Play " + x.r.title); b.onclick = () => setNow(x.r);
    li.appendChild(el("div", "qn", String(i + 1))); li.appendChild(box); li.appendChild(b); ul.appendChild(li);
  });
}

/* ---------- Matching records list ---------- */
function renderList(p) {
  $("listCard").hidden = !records.length;
  $("matchSum").textContent = "Matching records (" + p.length + ")";
  const ul = $("matchList");
  if (!$("matchDet").open) return;
  const st0 = keepScroll ? ul.scrollTop : 0; keepScroll = false;
  ul.innerHTML = "";
  const list = sortRecords(search(p, $("mSearch").value), $("mSort").value);
  list.slice(0, listCap).forEach(r => {
    const li = el("li"), box = el("div", "mi");
    box.appendChild(el("div", "mt", (FAVS[key(r)] ? "★ " : "") + r.title));
    box.appendChild(el("div", "ma", r.artist || "Unknown artist"));
    box.appendChild(el("div", "mm", [yearOf(r) || "", fmtMain(r), r.label].filter(Boolean).join(" · ")));
    const g = genreLine(r); if (g) box.appendChild(el("div", "mv", g));
    li.appendChild(cover(r)); li.appendChild(box); li.appendChild(rowButtons(r));
    ul.appendChild(li);
  });
  if (list.length > listCap) {
    const li = el("li", "more"), b = el("button", "btn ghost", "Show " + Math.min(200, list.length - listCap) + " more of " + (list.length - listCap));
    b.type = "button"; b.onclick = () => { listCap += 200; keepScroll = true; updatePool(); };
    li.appendChild(b); ul.appendChild(li);
  }
  if (!list.length) ul.appendChild(el("li", "meta", "Nothing matches."));
  ul.scrollTop = st0;
}
$("matchDet").addEventListener("toggle", () => updatePool());
$("mSearch").oninput = () => { listCap = 200; renderList(pool()); };
$("mSort").onchange = () => { store("np:sort", $("mSort").value); renderList(pool()); };
$("mSort").value = read("np:sort") || "artist";

/* ---------- Pick a record ---------- */
function show(r) {
  const res = $("result"); res.innerHTML = "";
  res.appendChild(el("div", "artist", r.artist || "Unknown artist"));
  res.appendChild(el("div", "title", r.title));
  res.appendChild(el("div", "meta", [genreLine(r), r.label, fmtMain(r) || r.format, yearText(r)].filter(Boolean).join(" · ")));
}
function pickOne() {
  let p = pool();
  if (!p.length) return null;
  if ($("noRepeat").checked) {
    let fresh = p.filter(r => !seen[key(r)]);
    if (!fresh.length) { p.forEach(r => { delete seen[key(r)]; }); fresh = p; }
    p = fresh;
  }
  const r = p[Math.floor(Math.random() * p.length)];
  seen[key(r)] = 1;
  return r;
}
function setStage(c, save) {
  $("stage").classList.toggle("collapsed", c);
  const b = $("stgl"); b.textContent = c ? "▸" : "▾";
  b.setAttribute("aria-expanded", c ? "false" : "true"); b.title = c ? "Expand" : "Collapse";
  if (save) store("np:stageCollapsed", c ? 1 : 0);
}
$("stgl").onclick = () => setStage(!$("stage").classList.contains("collapsed"), true);
if (read("np:stageCollapsed")) setStage(true, false);
$("pick").onclick = () => {
  if ($("stage").classList.contains("collapsed")) setStage(false, true);
  const disc = $("disc"), btn = $("pick");
  btn.disabled = true; disc.classList.add("spin");
  let n = 0;
  const iv = setInterval(() => {
    const p = pool(); if (p.length) show(p[Math.floor(Math.random() * p.length)]);
    if (++n >= 9) {
      clearInterval(iv);
      disc.classList.remove("spin");
      const r = pickOne();
      btn.disabled = false;
      if (!r) return;
      show(r);
      const play = el("button", "btn ghost", "▶ Play this"); play.style.marginTop = "12px"; play.onclick = () => setNow(r);
      const look = el("button", "btn ghost", "Preview"); look.style.cssText = "margin:12px 0 0 8px"; look.onclick = () => openPreview(r);
      $("result").appendChild(play); $("result").appendChild(look);
      HIST.unshift(key(r)); HIST = HIST.slice(0, 30); storeC("hist", HIST); renderHist();
      btn.textContent = "Pick another";
    }
  }, 90);
};

function renderHist() {
  const rows = HIST.map(recByKey).filter(Boolean).slice(0, 10);
  $("histCard").hidden = !rows.length;
  const ul = $("hist"); ul.innerHTML = "";
  rows.forEach(r => {
    const li = el("li"), a = el("a", null, r.title); a.href = "#"; a.onclick = e => { e.preventDefault(); openPreview(r); };
    li.appendChild(a); li.appendChild(el("span", null, r.artist ? " — " + r.artist : "")); ul.appendChild(li);
  });
}
$("clear").onclick = () => { HIST = []; storeC("hist", HIST); renderHist(); };

/* ---------- CSV import ---------- */
function ingest(text) {
  const list = fromText(text);
  if (!list.length) { $("status").textContent = "Couldn’t find any records in that. Check the file and try again."; return; }
  if (ctl) { ctl.abort(); ctl = null; }
  const data = { fetched: Date.now(), user: null, folders: [], records: list };
  store("np:" + CSV + ":collection", data);
  $("username").value = "";
  useCollection(CSV, data);
  $("status").textContent = list.length + " records imported from CSV.";
  $("loader").open = false;
}
$("file").onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  const rd = new FileReader(); rd.onload = () => ingest(rd.result); rd.readAsText(f);
};
$("load").onclick = () => ingest($("paste").value);

/* ---------- Remembered panel states and startup ---------- */
[["topDet", "np:topClosed"], ["filtDet", "np:filtClosed"], ["statsDet", "np:statsClosed"]].forEach(([id, k]) => {
  if (read(k)) $(id).open = false;
  $(id).addEventListener("toggle", () => store(k, $(id).open ? 0 : 1));
});

setToken($("token").value);
const urlUser = new URLSearchParams(location.search).get("user"), last = read("np:last");
if (urlUser) loadUser(urlUser, false);
else if (last === CSV && read("np:" + CSV + ":collection")) useCollection(CSV, read("np:" + CSV + ":collection"));
else if (last) loadUser(last, false);
else $("username").focus();

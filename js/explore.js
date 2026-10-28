/* Pure helpers for filtering, counting, sorting and pairing records. No DOM here, so they can be tested in Node. */
import { key } from "./records.js";

/* Best known year: the original release (from the master) when we have it, else this pressing */
export function yearOf(r) { return r.origYear || r.year || 0; }
export function decade(y) { return y ? Math.floor(y / 10) * 10 + "s" : ""; }

const SIZES = ["LP", '12"', '10"', '7"', "EP", "Single"];
/* "Vinyl LP", "2× Vinyl LP", "CD", "Cassette" */
export function fmtMain(r) {
  const size = (r.descs || []).find(d => SIZES.indexOf(d) > -1);
  const base = [r.formatName, r.formatName === "Vinyl" ? size : ""].filter(Boolean).join(" ");
  return base ? (r.qty > 1 ? r.qty + "× " : "") + base : "";
}

export function labels(r) { return (r.label || "").split(/\s*,\s*/).filter(Boolean); }

/* Every filter is optional; a record passes when it matches all the ones that are set */
export function matches(r, f, favs) {
  return (!f.artist || r.artist === f.artist)
    && (!f.format || fmtMain(r) === f.format)
    && (!f.genre || r.genres.indexOf(f.genre) > -1)
    && (!f.style || r.styles.indexOf(f.style) > -1)
    && (!f.label || labels(r).indexOf(f.label) > -1)
    && (!f.decade || decade(yearOf(r)) === f.decade)
    && (!f.folder || r.folder === f.folder)
    && (!f.favOnly || !!(favs && favs[key(r)]));
}

/* [[value, count], ...] most common first, then alphabetical */
export function tally(list, fn) {
  const c = {};
  list.forEach(r => { [].concat(fn(r)).filter(Boolean).forEach(v => { c[v] = (c[v] || 0) + 1; }); });
  return Object.keys(c).map(k => [k, c[k]]).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
}

/* Alphabetical, ignoring a leading "The" */
export function sortKey(s) { return (s || "").toLowerCase().replace(/^the\s+/, ""); }
export function byName(a, b) { const x = sortKey(a), y = sortKey(b); return x < y ? -1 : x > y ? 1 : 0; }

export function sortRecords(list, how) {
  const cmp = {
    artist: (a, b) => byName(a.artist, b.artist) || yearOf(a) - yearOf(b) || byName(a.title, b.title),
    title: (a, b) => byName(a.title, b.title),
    year: (a, b) => (yearOf(a) || 9999) - (yearOf(b) || 9999) || byName(a.artist, b.artist),
    added: (a, b) => (a.added < b.added ? 1 : a.added > b.added ? -1 : 0)
  }[how] || ((a, b) => byName(a.artist, b.artist));
  return list.slice().sort(cmp);
}

export function search(list, q) {
  q = (q || "").trim().toLowerCase();
  if (!q) return list;
  return list.filter(r => (r.artist + " " + r.title + " " + r.label).toLowerCase().indexOf(q) > -1);
}

export function nw(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();
}
export function baseTitle(s) { return (s || "").replace(/\s*\([^)]*\)/g, "").trim(); }

/* Pairings: other records by different artists that share styles (strongest) or genres, favoring nearby release years */
export function pairs(records, r, n = 8) {
  const S = r.styles || [], G = r.genres || [], k = key(r), out = [], seen = {};
  if (!S.length && !G.length) return out;
  const y = yearOf(r);
  records.forEach(o => {
    if (key(o) === k || o.artist === r.artist || nw(o.title) === nw(r.title)) return;
    const ss = (o.styles || []).filter(x => S.indexOf(x) > -1), gs = (o.genres || []).filter(x => G.indexOf(x) > -1);
    if (!ss.length && !gs.length) return;
    let sc = ss.length * 3 + gs.length;
    const oy = yearOf(o), d = (y && oy) ? Math.abs(y - oy) : null;
    if (d !== null) sc += d <= 3 ? 3 : d <= 7 ? 2 : d <= 12 ? 1 : 0;
    const dk = nw(o.artist + " " + o.title);
    if (seen[dk]) return;
    seen[dk] = 1;
    out.push({ r: o, sc, d, sh: ss.length ? ss : gs });
  });
  out.sort((a, b) => b.sc - a.sc || (a.d === null ? 99 : a.d) - (b.d === null ? 99 : b.d));
  return out.slice(0, n);
}

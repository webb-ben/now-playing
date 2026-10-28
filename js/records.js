/* Turns Discogs API items, Discogs CSV exports and plain "Artist - Title" lists into one record shape:
   {id, artist, title, label, catno, format, formatName, qty, descs, year, origYear, masterId,
    genres, styles, thumb, cover, added, rating, folder} */

/* Discogs adds " (2)" to tell apart artists with the same name, and "*" to mark a name variation */
export function clean(s) { return (s || "").replace(/\s\(\d+\)$/, "").replace(/\*$/, "").trim(); }

export function artistString(artists) {
  return (artists || []).map((a, i, all) => {
    const name = clean(a.name);
    if (i === all.length - 1) return name;
    const j = (a.join || "").trim();
    return name + (!j || j === "," ? ", " : " " + j + " ");
  }).join("");
}

function uniq(arr) { return Array.from(new Set(arr.filter(Boolean))); }

export function fromDiscogs(item) {
  const b = item.basic_information || {}, fmts = b.formats || [], f = fmts[0] || {};
  const descs = uniq([].concat(...fmts.map(x => x.descriptions || [])));
  const img = s => (s && !/spacer\.gif$/.test(s)) ? s : "";
  return {
    id: String(b.id || item.id),
    artist: artistString(b.artists),
    title: (b.title || "").trim(),
    label: uniq((b.labels || []).map(l => clean(l.name))).join(", "),
    catno: ((b.labels || [])[0] || {}).catno || "",
    format: uniq(fmts.map(x => x.name)).concat(descs).join(", "),
    formatName: f.name || "",
    qty: parseInt(f.qty, 10) || 1,
    descs,
    year: b.year || 0,
    origYear: 0,
    masterId: b.master_id || 0,
    genres: b.genres || [],
    styles: b.styles || [],
    thumb: img(b.thumb),
    cover: img(b.cover_image),
    added: item.date_added || "",
    rating: item.rating || 0,
    folder: item.folder_id != null ? String(item.folder_id) : ""
  };
}

/* Same release added twice counts once */
export function fromDiscogsList(items) {
  const seen = {}, out = [];
  items.forEach(it => {
    const r = fromDiscogs(it);
    if (seen[r.id]) return;
    seen[r.id] = 1; out.push(r);
  });
  return out;
}

export function parseCSV(text) {
  let rows = [], row = [], f = "", q = false, i, c;
  text = text.replace(/^﻿/, "");
  for (i = 0; i < text.length; i++) {
    c = text[i];
    if (q) {
      if (c == '"') { if (text[i + 1] == '"') { f += '"'; i++; } else q = false; }
      else f += c;
    } else if (c == '"') q = true;
    else if (c == ",") { row.push(f); f = ""; }
    else if (c == "\n" || c == "\r") {
      if (c == "\r" && text[i + 1] == "\n") i++;
      row.push(f); f = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else f += c;
  }
  if (f !== "" || row.length) { row.push(f); rows.push(row); }
  return rows;
}

function split(s) { return (s || "").split(/[,;]/).map(x => x.trim()).filter(Boolean); }

function blank(o) {
  return Object.assign({ id: "", artist: "", title: "", label: "", catno: "", format: "", formatName: "", qty: 1, descs: [],
    year: 0, origYear: 0, masterId: 0, genres: [], styles: [], thumb: "", cover: "", added: "", rating: 0, folder: "" }, o);
}

/* A Discogs CSV export (or any CSV with Artist and Title columns), else one "Artist - Title | Genre" per line */
export function fromText(text) {
  const first = text.split(/\r?\n/)[0] || "";
  if (/artist/i.test(first) && /title/i.test(first) && first.indexOf(",") > -1) {
    const rows = parseCSV(text), h = rows[0].map(x => x.trim().toLowerCase());
    const ix = (...names) => { for (const n of names) { const i = h.indexOf(n); if (i > -1) return i; } return -1; };
    const a = ix("artist"), t = ix("title"), l = ix("label"), fm = ix("format"), cat = ix("catalog#", "catalog #", "catno"),
      oy = ix("original release year", "original year", "original_release_year"), py = ix("pressing year (released)", "pressing year", "released", "year"),
      fo = ix("collectionfolder", "folder"), id = ix("release_id", "release id"), g = ix("genre", "genres"), st = ix("style", "styles"),
      ad = ix("date added"), rt = ix("rating");
    const col = (r, i) => i > -1 ? (r[i] || "").trim() : "";
    return rows.slice(1).filter(r => col(r, t)).map(r => {
      const fmt = col(r, fm), parts = fmt.split(",").map(x => x.trim()).filter(Boolean);
      const m = /^(\d+)x(.*)$/.exec(parts[0] || "");
      return blank({
        id: col(r, id), artist: clean(col(r, a)), title: col(r, t), label: clean(col(r, l)), catno: col(r, cat),
        format: fmt, formatName: /^(LP|\d+")$/.test(m ? m[2] : parts[0] || "") ? "Vinyl" : (m ? m[2] : parts[0] || ""),
        qty: m ? parseInt(m[1], 10) : 1, descs: m ? [m[2]].concat(parts.slice(1)) : parts,
        year: parseInt(col(r, py), 10) || parseInt(col(r, oy), 10) || 0, origYear: parseInt(col(r, oy), 10) || 0,
        genres: split(col(r, g)), styles: split(col(r, st)), added: col(r, ad), rating: parseInt(col(r, rt), 10) || 0,
        folder: col(r, fo)
      });
    });
  }
  return text.split(/\r?\n/).map(s => s.trim()).filter(Boolean).map(s => {
    const gp = s.split(/\s*\|\s*/), m = gp[0].split(/\s+[-–—]\s+/);
    return blank(m.length > 1 ? { artist: m[0], title: m.slice(1).join(" - "), genres: split(gp[1]) } : { title: gp[0], genres: split(gp[1]) });
  });
}

export function key(r) { return r.id || (r.artist + "|" + r.title); }

/* Discogs API client. Public collections, profiles, releases and masters can all be read without signing in.
   Discogs allows 25 requests a minute without a token and 60 with one; requests run one at a time and
   wait when the last minute's budget is spent. The token goes in the query string so the browser
   does not need a CORS preflight. */
const API = "https://api.discogs.com";

export class DiscogsError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

let token = "";
export function setToken(t) { token = (t || "").trim(); }

const sleep = ms => new Promise(res => setTimeout(res, ms));
let recent = [], chain = Promise.resolve();

async function waitForSlot() {
  const limit = token ? 58 : 23, now = Date.now();
  recent = recent.filter(t => now - t < 60000);
  if (recent.length >= limit) await sleep(60000 - (now - recent[0]) + 250);
  recent.push(Date.now());
}

async function send(path, params, signal) {
  const u = new URL(API + path);
  for (const [k, v] of Object.entries(params || {})) if (v !== undefined && v !== "") u.searchParams.set(k, v);
  if (token) u.searchParams.set("token", token);
  for (let attempt = 0; attempt < 3; attempt++) {
    await waitForSlot();
    if (signal && signal.aborted) throw new DOMException("Aborted", "AbortError");
    const res = await fetch(u, { signal });
    if (res.status === 429) { recent = Array(60).fill(Date.now()); continue; }
    if (!res.ok) {
      let msg = "";
      try { msg = (await res.json()).message || ""; } catch (e) {}
      throw new DiscogsError(res.status, msg || "Discogs returned " + res.status);
    }
    return res.json();
  }
  throw new DiscogsError(429, "Discogs is rate limiting requests. Try again in a minute.");
}

/* Queue every request behind the previous one so the rate limiter sees them in order */
function get(path, params, signal) {
  const p = chain.then(() => send(path, params, signal));
  chain = p.catch(() => {});
  return p;
}

const enc = encodeURIComponent;

export function getUser(username, signal) {
  return get("/users/" + enc(username), null, signal).catch(e => {
    if (e.status === 404) throw new DiscogsError(404, "There’s no Discogs user called “" + username + "”.");
    throw e;
  });
}

/* Folder names; other people's folders other than "All" are private, so this falls back to none */
export function getFolders(username, signal) {
  return get("/users/" + enc(username) + "/collection/folders", null, signal)
    .then(j => j.folders || [])
    .catch(e => { if (e.name === "AbortError") throw e; return []; });
}

/* Every item in folder 0 (All), newest first, 100 per page */
export async function getCollection(username, { onProgress, signal } = {}) {
  const items = [];
  for (let page = 1, pages = 1; page <= pages; page++) {
    let j;
    try {
      j = await get("/users/" + enc(username) + "/collection/folders/0/releases",
        { per_page: 100, page, sort: "added", sort_order: "desc" }, signal);
    } catch (e) {
      if (e.status === 403) throw new DiscogsError(403, username + "’s collection is private.");
      if (e.status === 404) throw new DiscogsError(404, "There’s no Discogs user called “" + username + "”.");
      throw e;
    }
    pages = (j.pagination && j.pagination.pages) || 1;
    items.push(...(j.releases || []));
    if (onProgress) onProgress(items.length, (j.pagination && j.pagination.items) || items.length);
  }
  return items;
}

export function getRelease(id, signal) { return get("/releases/" + enc(id), null, signal); }
export function getMaster(id, signal) { return get("/masters/" + enc(id), null, signal); }

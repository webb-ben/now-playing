/* Original release years from MusicBrainz, which links its release groups to Discogs masters.
   One request covers up to 100 masters (vs one per master on Discogs), and MusicBrainz asks for at most
   one request a second. Its date is the album's first release anywhere, so it can differ from the year
   Discogs shows by a year or so. Masters MusicBrainz doesn't know are simply left out of the result. */
import { nw } from "./explore.js";

const URL_API = "https://musicbrainz.org/ws/2/url";
const sleep = ms => new Promise(res => setTimeout(res, ms));
let last = 0;

/* masters: Discogs master ids. titles: optional {masterId: album title}, used when a master is linked
   to more than one release group (an album and its single, say). Returns {masterId: year}. */
export async function mbYears(masters, { titles = {}, signal, userAgent, onProgress, retryMs = 2000 } = {}) {
  const ids = Array.from(new Set(masters.map(String))), out = {};
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100), q = new URLSearchParams();
    chunk.forEach(id => q.append("resource", "https://www.discogs.com/master/" + id));
    q.set("inc", "release-group-rels"); q.set("fmt", "json");
    let res;
    for (let attempt = 0; ; attempt++) {
      const wait = last + 1100 - Date.now();
      if (wait > 0) await sleep(wait);
      last = Date.now();
      // Browsers send their own User-Agent; Node scripts should identify themselves to MusicBrainz
      res = await fetch(URL_API + "?" + q, { signal, headers: userAgent ? { "User-Agent": userAgent } : {} });
      // 503 is MusicBrainz asking us to slow down: back off and try again
      if (res.status !== 503 || attempt >= 3) break;
      await sleep(retryMs * (attempt + 1));
    }
    if (res.status === 404) continue;   // none of this batch is linked
    if (!res.ok) throw new Error("MusicBrainz returned " + res.status);
    const j = await res.json();
    (j.urls || [j]).forEach(u => {
      const id = String(u.resource || "").replace(/\/$/, "").split("/").pop();
      const groups = (u.relations || []).map(r => r.release_group).filter(g => g && /^\d{4}/.test(g["first-release-date"] || ""));
      if (!groups.length) return;
      const want = nw(titles[id] || "");
      const g = groups.find(x => want && nw(x.title) === want)
        || groups.slice().sort((a, b) => a["first-release-date"] < b["first-release-date"] ? -1 : 1)[0];
      out[id] = parseInt(g["first-release-date"], 10);
    });
    if (onProgress) onProgress(Math.min(i + 100, ids.length), ids.length);
  }
  return out;
}

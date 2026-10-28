/* Looks up the original release year of everything in some Discogs users' collections and wantlists,
   and saves them to data/years.json. The site loads that file on startup, so those records show
   original years without a lookup. MusicBrainz answers most of them in a few batched requests;
   Discogs masters fill in the rest, one request each.

   node scripts/build-years.mjs <username> [more usernames]
   DISCOGS_TOKEN=... speeds up the Discogs part. Years already in the file are kept. */
import { readFile, writeFile } from "node:fs/promises";
import { setToken, getCollection, getWants, getMaster } from "../js/discogs.js";
import { mbYears } from "../js/musicbrainz.js";

const users = process.argv.slice(2);
if (!users.length) { console.error("Usage: node scripts/build-years.mjs <discogs username> [...]"); process.exit(1); }
setToken(process.env.DISCOGS_TOKEN || "");

const file = new URL("../data/years.json", import.meta.url);
let years = {};
try { years = JSON.parse(await readFile(file, "utf8")); } catch (e) {}
const save = () => {
  const sorted = {};
  Object.keys(years).sort((a, b) => a - b).forEach(k => { sorted[k] = years[k]; });
  return writeFile(file, JSON.stringify(sorted).replace(/,"/g, ',\n"') + "\n");
};

const titles = {};
for (const u of users) {
  const items = (await getCollection(u)).concat(await getWants(u));
  items.forEach(it => { const b = it.basic_information || {}; if (b.master_id) titles[b.master_id] = b.title; });
  console.log(u + ": " + items.length + " collection and wantlist items");
}
const todo = Object.keys(titles).filter(id => years[id] === undefined);
console.log(todo.length + " masters to look up (" + (Object.keys(titles).length - todo.length) + " already saved)");

const mb = await mbYears(todo, { titles, userAgent: "NowPlaying/1.0 (https://github.com/webb-ben/now-playing)" });
Object.assign(years, mb);
await save();
const rest = todo.filter(id => years[id] === undefined);
console.log("MusicBrainz: " + Object.keys(mb).length + " years. Discogs: " + rest.length + " left to look up");

let n = 0;
for (const id of rest) {
  try { years[id] = (await getMaster(id)).year || 0; }
  catch (e) { if (e.status === 404) years[id] = 0; else { console.error("master " + id + ": " + e.message); continue; } }
  if (++n % 10 === 0) { await save(); console.log("Discogs " + n + " / " + rest.length); }
}
await save();
console.log("Saved " + Object.keys(years).length + " years to data/years.json");

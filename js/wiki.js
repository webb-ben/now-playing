/* Live Wikipedia lookup for an album's intro (text under CC BY-SA). Returns null when no article clearly matches. */
import { nw } from "./explore.js";

export async function fetchWiki(title, artist) {
  const u = "https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrlimit=6&gsrsearch="
    + encodeURIComponent(title + " " + artist + " album")
    + "&prop=extracts%7Cinfo&exintro=1&explaintext=1&exsentences=4&exlimit=max&inprop=url";
  const res = await fetch(u);
  if (!res.ok) throw new Error("http " + res.status);
  const j = await res.json();
  const pg = (j.query && j.query.pages) || {}, list = Object.keys(pg).map(i => pg[i]);
  list.sort((x, y) => (x.index || 0) - (y.index || 0));
  const tt = nw(title), last = nw(artist).split(" ").pop();
  for (const p of list) {
    const ex = p.extract || "";
    if (nw(p.title).indexOf(tt) > -1 && /\b(album|ep|compilation|soundtrack|mixtape|single|record)\b/i.test(ex) && (!last || nw(ex).indexOf(last) > -1))
      return { title: p.title, url: p.fullurl, extract: ex.trim() };
  }
  return null;
}
